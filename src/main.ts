import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  // Root container (created entirely from TS)
  const root = document.createElement("div");
  root.className = "app-container";

  // App title (specified: created via TS, not HTML)
  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = "Sketch Pad Town";

  // Canvas created from TS
  const canvas = document.createElement("canvas");
  canvas.className = "draw-canvas";
  canvas.width = 256;
  canvas.height = 256;

  // Build the DOM in memory
  root.appendChild(title);
  root.appendChild(canvas);

  // Attach to page
  document.body.appendChild(root);
});
