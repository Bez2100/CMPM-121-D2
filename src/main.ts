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

  // Add elements to root
  root.appendChild(title);
  root.appendChild(canvas);
  root.appendChild(clearBtn);

  // Add root to page
  document.body.appendChild(root);

  // ========== DRAWING LOGIC ==========
  let isDrawing = false;

  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });

  canvas.addEventListener("mouseup", () => {
    isDrawing = false;
  });

  canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
  });

  // ========== CLEAR BUTTON ==========
  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
});
