import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // UI CREATION
  // ==========================
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

  // --------------------------
  // Buttons
  // --------------------------
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

  // === STEP 9: Sticker system ===
  interface StickerDef {
    emoji: string;
  }

  const stickerList: StickerDef[] = [
    { emoji: "🐱" },
    { emoji: "🚗" },
    { emoji: "🚙" },
    { emoji: "🏢" },
  ];

  const stickerBtnRow = document.createElement("div");
  stickerBtnRow.className = "button-row";

  root.appendChild(title);
  root.appendChild(canvas);
  root.appendChild(stickerBtnRow); // container for stickers

  const btnRow = document.createElement("div");
  btnRow.className = "button-row";

  btnRow.appendChild(thinBtn);
  btnRow.appendChild(thickBtn);
  btnRow.appendChild(undoBtn);
  btnRow.appendChild(redoBtn);
  btnRow.appendChild(clearBtn);

  root.appendChild(btnRow);
  document.body.appendChild(root);

  // --------------------------
  // Commands / Data
  // --------------------------
  type Point = { x: number; y: number };

  interface Command {
    drag(x: number, y: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
  }

  class MarkerStroke implements Command {
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

  class StickerCommand implements Command {
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

  const strokes: Command[] = [];
  const redoStack: Command[] = [];

  let currentStroke: Command | null = null;
  let isDrawing = false;
  let markerThickness = 4;
  let toolPreview: ToolPreview | StickerPreview | null = null;

  type Tool = "marker" | "sticker";
  let activeTool: Tool = "marker";
  let activeSticker: string | null = null;

  // --------------------------
  // Sticker rendering helper
  // --------------------------
  function renderStickerButtons() {
    stickerBtnRow.innerHTML = "";
    for (const sticker of stickerList) {
      const btn = document.createElement("button");
      btn.className = "sticker-button";
      btn.textContent = sticker.emoji;
      btn.addEventListener("click", () => {
        activeTool = "sticker";
        activeSticker = sticker.emoji;
      });
      stickerBtnRow.appendChild(btn);
    }
  }
  renderStickerButtons();

  const customStickerBtn = document.createElement("button");
  customStickerBtn.className = "sticker-button";
  customStickerBtn.textContent = "➕ Sticker";
  btnRow.appendChild(customStickerBtn);

  customStickerBtn.addEventListener("click", () => {
    const input = prompt("Enter custom sticker emoji:", "⭐");
    if (!input || input.trim().length === 0) return;

    stickerList.push({ emoji: input });
    renderStickerButtons();
  });

  // --------------------------
  // Drawing pipeline
  // --------------------------
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

  // --------------------------
  // Mouse events
  // --------------------------
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    redoStack.length = 0;

    if (activeTool === "marker") {
      currentStroke = new MarkerStroke(markerThickness);
      currentStroke.drag(e.offsetX, e.offsetY);
    } else if (activeTool === "sticker" && activeSticker) {
      currentStroke = new StickerCommand(e.offsetX, e.offsetY, activeSticker);
    }

    if (currentStroke) strokes.push(currentStroke);
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

  // --------------------------
  // Button handlers
  // --------------------------
  clearBtn.addEventListener("click", () => {
    strokes.length = 0;
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

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
});
