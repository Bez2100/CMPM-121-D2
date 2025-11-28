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

  // ----- Clear Button -----
  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-button";
  clearBtn.textContent = "Clear";

  root.appendChild(title);
  root.appendChild(canvas);
  root.appendChild(clearBtn);
  document.body.appendChild(root);

  // ====================================================
  // STEP 3 – DATA MODEL FOR DRAWING
  // ====================================================
  type Point = { x: number; y: number };
  type Stroke = Point[];

  const strokes: Stroke[] = [];
  let currentStroke: Stroke | null = null;

  let isDrawing = false;

  // ----- Draw observer -----
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

  // Listen for the custom event
  canvas.addEventListener("drawing-changed", redrawCanvas);

  // ====================================================
  // MOUSE HANDLING (now using the model instead of direct drawing)
  // ====================================================
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;

    currentStroke = [];
    strokes.push(currentStroke);

    const point = { x: e.offsetX, y: e.offsetY };
    currentStroke.push(point);

    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !currentStroke) return;

    const point = { x: e.offsetX, y: e.offsetY };
    currentStroke.push(point);

    // Only redraw when a new point is added
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
  // CLEAR BUTTON
  // ====================================================
  clearBtn.addEventListener("click", () => {
    strokes.length = 0; // clear array
    currentStroke = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });
});
