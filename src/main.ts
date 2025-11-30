import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  // ----- Root container -----
  const root = document.createElement("div");
  root.className = "app-container";

  // ----- Title -----
  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = "Sketch Pad Town";

  // ----- Canvas -----
  const canvas = document.createElement("canvas");
  canvas.className = "draw-canvas";
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d")!;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  // ----- Buttons -----
  const undoBtn = document.createElement("button");
  undoBtn.className = "undo-button";
  undoBtn.textContent = "Undo";

  const redoBtn = document.createElement("button");
  redoBtn.className = "redo-button";
  redoBtn.textContent = "Redo";

  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-button";
  clearBtn.textContent = "Clear";

  const thinBtn = document.createElement("button");
  thinBtn.className = "thin-button";
  thinBtn.textContent = "Thin";

  const thickBtn = document.createElement("button");
  thickBtn.className = "thick-button";
  thickBtn.textContent = "Thick";

  // ----- Add elements to root -----
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

  // COMMAND OBJECTS + Thickness Support

  class MarkerLine {
    private points: { x: number; y: number }[] = [];
    private thickness: number;

    constructor(startX: number, startY: number, thickness: number) {
      this.thickness = thickness;
      this.points.push({ x: startX, y: startY });
    }

    drag(x: number, y: number) {
      this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
      if (this.points.length < 2) return;

      ctx.lineWidth = this.thickness;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);

      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }

      ctx.stroke();
    }
  }

  // Display list & undo/redo
  const displayList: MarkerLine[] = [];
  const redoStack: MarkerLine[] = [];

  let currentCommand: MarkerLine | null = null;
  let isDrawing = false;

  let currentThickness = 4;

  // REDRAW OBSERVER
  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const cmd of displayList) {
      cmd.display(ctx);
    }
  }

  canvas.addEventListener("drawing-changed", redrawCanvas);

  // MOUSE EVENTS USING COMMAND OBJECTS
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;

    currentCommand = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
    displayList.push(currentCommand);

    // New stroke → redo history cleared
    redoStack.length = 0;

    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !currentCommand) return;

    currentCommand.drag(e.offsetX, e.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mouseup", () => {
    isDrawing = false;
    currentCommand = null;
  });

  canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
    currentCommand = null;
  });

  // BUTTON ACTIONS

  clearBtn.addEventListener("click", () => {
    displayList.length = 0;
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  undoBtn.addEventListener("click", () => {
    if (displayList.length === 0) return;

    const undone = displayList.pop()!;
    redoStack.push(undone);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  redoBtn.addEventListener("click", () => {
    if (redoStack.length === 0) return;

    const restored = redoStack.pop()!;
    displayList.push(restored);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  thinBtn.addEventListener("click", () => {
    currentThickness = 2;
    thinBtn.classList.add("selectedTool");
    thickBtn.classList.remove("selectedTool");
  });

  thickBtn.addEventListener("click", () => {
    currentThickness = 8;
    thickBtn.classList.add("selectedTool");
    thinBtn.classList.remove("selectedTool");
  });

  thinBtn.classList.add("selectedTool");
});
