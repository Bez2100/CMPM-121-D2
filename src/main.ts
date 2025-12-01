import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // UI CREATION
  // =======================
  const root = document.createElement("div");
  root.className = "app-container";

  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = "Sketch Pad Town";

  // canvas + tools container
  const canvasToolsContainer = document.createElement("div");
  canvasToolsContainer.className = "canvas-tools-container";

  const canvas = document.createElement("canvas");
  canvas.className = "draw-canvas";
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.lineCap = "round";

  // Button column (left of canvas)
  const buttonColumn = document.createElement("div");
  buttonColumn.className = "button-column";

  // ====== Marker buttons ======
  const thinBtn = document.createElement("button");
  thinBtn.className = "thin-button";
  thinBtn.textContent = "Thin Brush";

  const thickBtn = document.createElement("button");
  thickBtn.className = "thick-button";
  thickBtn.textContent = "Thick Brush";

  buttonColumn.appendChild(thinBtn);
  buttonColumn.appendChild(thickBtn);

  // ====== Sticker buttons ======
  const stickers = ["🐱", "🚗", "🚙", "🏢"];
  const stickerButtons: HTMLButtonElement[] = [];

  stickers.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "sticker-button";
    btn.textContent = emoji;
    buttonColumn.appendChild(btn);
    stickerButtons.push(btn);
  });

  // custom sticker button
  const customStickerBtn = document.createElement("button");
  customStickerBtn.className = "sticker-button";
  customStickerBtn.textContent = "+";
  buttonColumn.appendChild(customStickerBtn);

  // Add canvas and button column
  canvasToolsContainer.appendChild(buttonColumn);
  canvasToolsContainer.appendChild(canvas);

  // bottom buttons row
  const bottomButtons = document.createElement("div");
  bottomButtons.className = "bottom-buttons";

  const undoBtn = document.createElement("button");
  undoBtn.className = "undo-button";
  undoBtn.textContent = "Undo";

  const redoBtn = document.createElement("button");
  redoBtn.className = "redo-button";
  redoBtn.textContent = "Redo";

  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-button";
  clearBtn.textContent = "Clear";

  bottomButtons.appendChild(undoBtn);
  bottomButtons.appendChild(redoBtn);
  bottomButtons.appendChild(clearBtn);

  root.appendChild(title);
  root.appendChild(canvasToolsContainer);
  root.appendChild(bottomButtons);
  document.body.appendChild(root);

  // =======================
  // DATA STRUCTURES
  // =======================
  type Point = { x: number; y: number };

  class MarkerStroke {
    points: Point[] = [];
    constructor(public thickness: number, public color: string) {}

    drag(x: number, y: number) {
      this.points.push({ x, y });
    }

    draw(ctx: CanvasRenderingContext2D) {
      if (this.points.length === 0) return;
      ctx.save();
      ctx.lineWidth = this.thickness;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  class StickerCommand {
    constructor(
      public x: number,
      public y: number,
      public emoji: string,
      public rotation: number,
    ) {}
    drag(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.font = "32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    }
  }

  class ToolPreview {
    constructor(
      public x: number,
      public y: number,
      public radius: number,
      public color?: string,
    ) {}
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.strokeStyle = this.color ?? "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  class StickerPreview {
    constructor(
      public x: number,
      public y: number,
      public emoji: string,
      public rotation: number,
    ) {}
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = 0.5;
      ctx.font = "32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    }
  }

  const strokes: (MarkerStroke | StickerCommand)[] = [];
  const redoStack: (MarkerStroke | StickerCommand)[] = [];

  let currentStroke: MarkerStroke | StickerCommand | null = null;
  let isDrawing = false;

  // =======================
  // TOOL STATE
  // =======================
  type Tool = "marker" | "sticker";
  let activeTool: Tool = "marker";
  let activeSticker: string | null = null;

  let markerThickness = 4;
  let nextMarkerColor = "black";
  let nextStickerRotation = 0;

  let toolPreview: ToolPreview | StickerPreview | null = null;

  // =======================
  // UTILITY
  // =======================
  function getRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 50%)`;
  }

  function getRandomRotation(): number {
    return (Math.random() - 0.5) * Math.PI / 2; // -90° to 90°
  }

  // =======================
  // REDRAW
  // =======================
  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const item of strokes) {
      item.draw(ctx);
    }
    if (!isDrawing && toolPreview) {
      toolPreview.draw(ctx);
    }
  }

  canvas.addEventListener("drawing-changed", redrawCanvas);
  canvas.addEventListener("tool-moved", redrawCanvas);

  // =======================
  // MOUSE EVENTS
  // =======================
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    redoStack.length = 0;

    if (activeTool === "marker") {
      currentStroke = new MarkerStroke(markerThickness, nextMarkerColor);
      currentStroke.drag(e.offsetX, e.offsetY);
    } else if (activeTool === "sticker" && activeSticker) {
      currentStroke = new StickerCommand(
        e.offsetX,
        e.offsetY,
        activeSticker,
        nextStickerRotation,
      );
    }

    strokes.push(currentStroke!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentStroke) {
      currentStroke.drag(e.offsetX, e.offsetY);
      canvas.dispatchEvent(new Event("drawing-changed"));
    } else {
      if (activeTool === "marker") {
        toolPreview = new ToolPreview(
          e.offsetX,
          e.offsetY,
          markerThickness / 2,
          nextMarkerColor,
        );
      } else if (activeTool === "sticker" && activeSticker) {
        toolPreview = new StickerPreview(
          e.offsetX,
          e.offsetY,
          activeSticker,
          nextStickerRotation,
        );
      }
      canvas.dispatchEvent(new Event("tool-moved"));
    }
  });

  canvas.addEventListener("mouseup", () => {
    isDrawing = false;
    currentStroke = null;
  });

  canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
    currentStroke = null;
  });

  // =======================
  // BUTTON HANDLERS
  // =======================
  // Marker buttons
  thinBtn.addEventListener("click", () => {
    activeTool = "marker";
    activeSticker = null;
    markerThickness = 4;
    nextMarkerColor = getRandomColor();
  });

  thickBtn.addEventListener("click", () => {
    activeTool = "marker";
    activeSticker = null;
    markerThickness = 10;
    nextMarkerColor = getRandomColor();
  });

  // Sticker buttons
  stickerButtons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      activeTool = "sticker";
      activeSticker = stickers[i];
      nextStickerRotation = getRandomRotation();
    });
  });

  customStickerBtn.addEventListener("click", () => {
    const input = prompt("Enter custom sticker emoji", "🧽");
    if (input) {
      stickers.push(input);
      const btn = document.createElement("button");
      btn.className = "sticker-button";
      btn.textContent = input;
      buttonColumn.insertBefore(btn, customStickerBtn); // insert before custom button
      stickerButtons.push(btn);

      btn.addEventListener("click", () => {
        activeTool = "sticker";
        activeSticker = input;
        nextStickerRotation = getRandomRotation();
      });
    }
  });

  // Undo/Redo/Clear
  undoBtn.addEventListener("click", () => {
    if (strokes.length === 0) return;
    const undone = strokes.pop()!;
    redoStack.push(undone);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  redoBtn.addEventListener("click", () => {
    if (redoStack.length === 0) return;
    const restored = redoStack.pop()!;
    strokes.push(restored);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  clearBtn.addEventListener("click", () => {
    strokes.length = 0;
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });
});
