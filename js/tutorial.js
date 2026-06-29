(() => {
  const copyIcon     = document.getElementById("copy-icon");
  const checkIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" color="var(--text)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

  if (copyIcon) {
    copyIcon.addEventListener("click", () => {
      navigator.clipboard.writeText("discord.gg/KKTNRQbKDE").then(() => {
        copyIcon.outerHTML = checkIconSVG;
        showNotification("Copied!", "deepinmycloset Discord invite copied to clipboard.", 5000, "#4ADE80");
      });
    });
  }
})();

(() => {
  const stepButtons = document.querySelectorAll(".step-button");
  const stepPanels  = document.querySelectorAll(".step-panel");

  stepButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      stepButtons.forEach(b => b.classList.remove("is-active"));
      stepPanels .forEach(p => p.classList.remove("is-active"));

      btn.classList.add("is-active");
      document.getElementById(btn.dataset.step).classList.add("is-active");
    });
  });
})();
