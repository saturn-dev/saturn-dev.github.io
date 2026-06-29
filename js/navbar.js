(() => {
  const nav = document.getElementById("navbar");
  if (!nav) return;

  const SHRINK_AFTER = 10;
  const SHRINK_ON  = 140;
  const SHRINK_OFF = 90;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;

    nav.classList.toggle("scrolled", y > SHRINK_AFTER);

    if (y > SHRINK_ON) nav.classList.add("shrunk");
    else if (y < SHRINK_OFF) nav.classList.remove("shrunk");

    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
})();

(() => {
  const drawer  = document.getElementById("drawer");
  const overlay = document.getElementById("drawerOverlay");
  const handle  = document.getElementById("drawerHandle");
  const menuBtn = document.getElementById("menuBtn");
  if (!drawer || !overlay || !handle) return;

  const CLOSE_THRESHOLD = 0.35;

  let isOpen          = false;
  let dragging        = false;
  let startY          = 0;
  let currentProgress = 1;

  function setPosition(progress, tween = true) {
    currentProgress = progress;
    drawer.style.transition = tween
      ? "transform .4s cubic-bezier(.22,1,.36,1)"
      : "none";
    drawer.style.transform = `translateY(${progress * 100}%)`;
  }

  function openDrawer() {
    isOpen = true;
    drawer.classList.add("open");
    overlay.classList.add("active");
    menuBtn && menuBtn.classList.add("active");
    document.body.style.overflow = "hidden";
    setPosition(0);
  }

  function closeDrawer() {
    isOpen = false;
    drawer.classList.remove("open");
    overlay.classList.remove("active");
    menuBtn && menuBtn.classList.remove("active");
    document.body.style.overflow = "";
    setPosition(1);
  }

  window.openDrawer  = openDrawer;
  window.closeDrawer = closeDrawer;

  menuBtn && menuBtn.addEventListener("click", e => {
    e.preventDefault();
    if (isOpen) closeDrawer();
    else        openDrawer();
  });

  overlay.addEventListener("click", closeDrawer);

  handle.addEventListener("pointerdown", e => {
    if (!isOpen) return;
    dragging = true;
    startY   = e.clientY;
    drawer.style.transition = "none";
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dh    = drawer.offsetHeight || 1;
    const delta = (e.clientY - startY) / dh;
    setPosition(Math.max(0, Math.min(1, delta)), false);
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    if (currentProgress > CLOSE_THRESHOLD) closeDrawer();
    else                                    openDrawer();
  }
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && isOpen) closeDrawer();
  });
})();

(() => {
  document.querySelectorAll(".drawer-accordion-trigger").forEach(trigger => {
    trigger.addEventListener("click", () => {
      const item = trigger.closest(".drawer-accordion");
      if (!item) return;
      const open = item.classList.toggle("open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
})();
