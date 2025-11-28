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
  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-button";
  clearBtn.textContent = "Clear";

  const undoBtn = document.createElement("button");
  undoBtn.className = "undo-button";
  undoBtn.textContent = "Undo";

  const redoBtn = document.createElement("button");
  redoBtn.className = "redo-button";
  redoBtn.textContent = "Redo";

  // Add elements to root
  root.appendChild(title);
  root.appendChild(canvas);

  const btnRow = document.createElement("div");
  btnRow.className = "button-row";
  btnRow.appendChild(undoBtn);
  btnRow.appendChild(redoBtn);
  btnRow.appendChild(clearBtn);

  root.appendChild(btnRow);
  document.body.appendChild(root);

  // ====================================================
  // DATA MODEL (expanded for undo/redo)
  // ====================================================
  type Point = { x: number; y: number };
  type Stroke = Point[];

  const strokes: Stroke[] = []; // display list
  const redoStack: Stroke[] = []; // undo → redo

  let currentStroke: Stroke | null = null;
  let isDrawing = false;

  // ====================================================
  // DRAWING OBSERVER
  // ====================================================
  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    for (const stroke of strokes) {
      if (stroke.length === 0) continue;

      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
    }
    ctx.stroke();
  }

  canvas.addEventListener("drawing-changed", redrawCanvas);

  // ====================================================
  // MOUSE EVENTS USING DATA MODEL
  // ====================================================
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;

    currentStroke = [];
    strokes.push(currentStroke);

    // Once you start drawing a new stroke, redo history is invalid
    redoStack.length = 0;

    currentStroke.push({ x: e.offsetX, y: e.offsetY });

    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !currentStroke) return;

    currentStroke.push({ x: e.offsetX, y: e.offsetY });
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mouseup", () => {
    isDrawing = false;
    currentStroke = null;
  });

  canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
    currentStroke = null;
  });

  // ====================================================
  // BUTTONS
  // ====================================================

  // ----- CLEAR -----
  clearBtn.addEventListener("click", () => {
    strokes.length = 0;
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  // ----- UNDO -----
  undoBtn.addEventListener("click", () => {
    if (strokes.length === 0) return; // nothing to undo

    const undone = strokes.pop()!; // remove last stroke
    redoStack.push(undone); // move it to redo stack

    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  // ----- REDO -----
  redoBtn.addEventListener("click", () => {
    if (redoStack.length === 0) return; // nothing to redo

    const restored = redoStack.pop()!; // take last undone stroke
    strokes.push(restored); // add it back

    canvas.dispatchEvent(new Event("drawing-changed"));
  });
});
