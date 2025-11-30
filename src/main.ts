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

  // Buttons
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

  // Layout
  root.appendChild(title);
  root.appendChild(canvas);

  const btnRow = document.createElement("div");
  btnRow.className = "button-row";
  btnRow.appendChild(thinBtn);
  btnRow.appendChild(thickBtn);
  btnRow.appendChild(undoBtn);
  btnRow.appendChild(redoBtn);
  btnRow.appendChild(clearBtn);

  root.appendChild(btnRow);
  document.body.appendChild(root);

  // DATA STRUCTURES
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

  const strokes: MarkerStroke[] = [];
  const redoStack: MarkerStroke[] = [];

  let currentStroke: MarkerStroke | null = null;
  let isDrawing = false;

  let markerThickness = 4; // default
  let toolPreview: ToolPreview | null = null;

  // REDRAW PIPELINE
  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    for (const stroke of strokes) {
      stroke.draw(ctx);
    }

    // Draw preview if not drawing
    if (!isDrawing && toolPreview) {
      toolPreview.draw(ctx);
    }
  }

  canvas.addEventListener("drawing-changed", redrawCanvas);
  canvas.addEventListener("tool-moved", redrawCanvas);

  // MOUSE EVENTS
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    redoStack.length = 0;

    currentStroke = new MarkerStroke(markerThickness);
    currentStroke.drag(e.offsetX, e.offsetY);
    strokes.push(currentStroke);

    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentStroke) {
      currentStroke.drag(e.offsetX, e.offsetY);
      canvas.dispatchEvent(new Event("drawing-changed"));
    } else {
      // Update tool preview
      toolPreview = new ToolPreview(e.offsetX, e.offsetY, markerThickness / 2);
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

  // BUTTON HANDLERS
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
    markerThickness = 4;
  });

  thickBtn.addEventListener("click", () => {
    markerThickness = 10;
  });
});
