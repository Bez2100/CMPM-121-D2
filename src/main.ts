import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  // UI CREATION
  const root = document.createElement("div");
  root.className = "app-container";

  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = "Sketch Pad Town";

  const canvas = document.createElement("canvas");
  canvas.className = "draw-canvas";
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d")!;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  // BUTTONS
  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-button";
  clearBtn.textContent = "Clear";

  const undoBtn = document.createElement("button");
  undoBtn.className = "undo-button";
  undoBtn.textContent = "Undo";

  const redoBtn = document.createElement("button");
  redoBtn.className = "redo-button";
  redoBtn.textContent = "Redo";

  const thinBtn = document.createElement("button");
  thinBtn.className = "thin-button";
  thinBtn.textContent = "Thin";

  const thickBtn = document.createElement("button");
  thickBtn.className = "thick-button";
  thickBtn.textContent = "Thick";

  // STEP 8: STICKER BUTTONS
  const catBtn = document.createElement("button");
  catBtn.className = "sticker-button";
  catBtn.textContent = "🐱";

  const car1Btn = document.createElement("button");
  car1Btn.className = "sticker-button";
  car1Btn.textContent = "🚗";

  const car2Btn = document.createElement("button");
  car2Btn.className = "sticker-button";
  car2Btn.textContent = "🚙";

  const buildingBtn = document.createElement("button");
  buildingBtn.className = "sticker-button";
  buildingBtn.textContent = "🏢";

  // LAYOUT
  root.appendChild(title);
  root.appendChild(canvas);

  const btnRow = document.createElement("div");
  btnRow.className = "button-row";

  btnRow.appendChild(thinBtn);
  btnRow.appendChild(thickBtn);

  // STEP 8: Add stickers
  btnRow.appendChild(catBtn);
  btnRow.appendChild(car1Btn);
  btnRow.appendChild(car2Btn);
  btnRow.appendChild(buildingBtn);

  btnRow.appendChild(undoBtn);
  btnRow.appendChild(redoBtn);
  btnRow.appendChild(clearBtn);

  root.appendChild(btnRow);
  document.body.appendChild(root);

  // ======================
  // DATA STRUCTURES
  // ======================

  type Point = { x: number; y: number };

  class MarkerStroke {
    points: Point[] = [];
    constructor(public thickness: number) {}

    drag(x: number, y: number) {
      this.points.push({ x, y });
    }

    draw(ctx: CanvasRenderingContext2D) {
      if (this.points.length === 0) return;
      ctx.save();
      ctx.lineWidth = this.thickness;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  class ToolPreview {
    constructor(public x: number, public y: number, public radius: number) {}

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  class StickerPreview {
    constructor(public x: number, public y: number, public emoji: string) {}

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.font = "32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, this.x, this.y);
      ctx.restore();
    }
  }

  class StickerCommand {
    constructor(public x: number, public y: number, public emoji: string) {}

    drag(x: number, y: number) {
      this.x = x;
      this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.font = "32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, this.x, this.y);
      ctx.restore();
    }
  }

  // === FIX: No `any` ===
  type Command = MarkerStroke | StickerCommand;

  const strokes: Command[] = [];
  const redoStack: Command[] = [];

  let currentStroke: Command | null = null;
  let isDrawing = false;

  let markerThickness = 4;
  let toolPreview: ToolPreview | StickerPreview | null = null;

  type Tool = "marker" | "sticker";
  let activeTool: Tool = "marker";
  let activeSticker: string | null = null;

  // REDRAW
  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const item of strokes) item.draw(ctx);

    if (!isDrawing && toolPreview) toolPreview.draw(ctx);
  }

  canvas.addEventListener("drawing-changed", redrawCanvas);
  canvas.addEventListener("tool-moved", redrawCanvas);

  // ======================
  // MOUSE EVENTS
  // ======================

  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    redoStack.length = 0;

    if (activeTool === "marker") {
      currentStroke = new MarkerStroke(markerThickness);
      currentStroke.drag(e.offsetX, e.offsetY);
    } else if (activeTool === "sticker" && activeSticker) {
      currentStroke = new StickerCommand(e.offsetX, e.offsetY, activeSticker);
    }

    if (currentStroke !== null) {
      strokes.push(currentStroke);
    }
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
        );
      } else if (activeTool === "sticker" && activeSticker) {
        toolPreview = new StickerPreview(e.offsetX, e.offsetY, activeSticker);
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

  // ======================
  // BUTTONS
  // ======================

  clearBtn.addEventListener("click", () => {
    strokes.length = 0;
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  undoBtn.addEventListener("click", () => {
    if (strokes.length > 0) {
      const undone = strokes.pop()!;
      redoStack.push(undone);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  });

  redoBtn.addEventListener("click", () => {
    if (redoStack.length > 0) {
      const restored = redoStack.pop()!;
      strokes.push(restored);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  });

  thinBtn.addEventListener("click", () => {
    activeTool = "marker";
    activeSticker = null;
    markerThickness = 4;
  });

  thickBtn.addEventListener("click", () => {
    activeTool = "marker";
    activeSticker = null;
    markerThickness = 10;
  });

  // STEP 8: Sticker selection
  catBtn.addEventListener("click", () => {
    activeTool = "sticker";
    activeSticker = "🐱";
  });

  car1Btn.addEventListener("click", () => {
    activeTool = "sticker";
    activeSticker = "🚗";
  });

  car2Btn.addEventListener("click", () => {
    activeTool = "sticker";
    activeSticker = "🚙";
  });

  buildingBtn.addEventListener("click", () => {
    activeTool = "sticker";
    activeSticker = "🏢";
  });
});
