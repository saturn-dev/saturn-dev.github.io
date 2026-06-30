(() => {
  const ua = navigator.userAgent || "";
  const isTikTokWebview = /musical_ly|TikTok|BytedanceWebview|Bytedance/i.test(ua);

  if (!isTikTokWebview) return;

  const overlay = document.getElementById("ttbOverlay");
  const arrow   = document.getElementById("ttbArrow");
  const copyBtn = document.getElementById("ttbCopyBtn");
  if (!overlay) return;

  function show() {
    overlay.classList.add("show");
    arrow.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function copyLink() {
    const url = window.location.href;
    const onCopied = () => {
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        Link copied
      `;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy link to paste in browser
        `;
      }, 2200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(onCopied).catch(() => fallbackCopy(url, onCopied));
    } else {
      fallbackCopy(url, onCopied);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  setTimeout(show, 600);

  copyBtn.addEventListener("click", copyLink);
})();
