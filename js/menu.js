const drawer = document.getElementById("drawer");
const overlay = document.getElementById("drawerOverlay");
const handle = drawer.querySelector(".drawer-handle");

const vh = () => window.innerHeight;

let minY; 
let maxY; 
let currentY;
let startY;
let startTranslate;
let dragging = false;

function updateLimits() {
  minY = vh() * 0.45;
  maxY = 0;
}
updateLimits();
window.addEventListener("resize", updateLimits);

function openDrawer() {
  drawer.classList.add("open");
  overlay.classList.add("active");
  currentY = minY;
  drawer.style.transform = `translateY(${currentY}px)`;
}

function closeDrawer() {
  drawer.classList.remove("open", "full");
  overlay.classList.remove("active");
  drawer.style.transform = "translateY(100%)";
}

overlay.addEventListener("click", closeDrawer);

handle.addEventListener("pointerdown", (e) => {
  dragging = true;
  startY = e.clientY;
  startTranslate = currentY ?? minY;
  drawer.style.transition = "none";
});

window.addEventListener("pointermove", (e) => {
  if (!dragging) return;

  const delta = e.clientY - startY;
  currentY = Math.min(Math.max(startTranslate + delta, maxY), minY);

  drawer.style.transform = `translateY(${currentY}px)`;
});

window.addEventListener("pointerup", () => {
  if (!dragging) return;
  dragging = false;
  drawer.style.transition = "";

  if (currentY < minY * 0.4) {
    drawer.classList.add("full");
    currentY = maxY;
  } else {
    drawer.classList.remove("full");
    currentY = minY;
  }

  drawer.style.transform = `translateY(${currentY}px)`;
});