(() => {
  const topBar   = document.querySelector(".controls");
  const topInput = document.getElementById("searchInput");
  const floating = document.getElementById("floatingSearch");
  const floatInp = document.getElementById("floatingSearchInput");
  const clearBtn = document.getElementById("floatingClear");
  const filtBtn  = document.getElementById("floatingFilters");
  const openFilt = document.getElementById("openFilters");
  if (!topBar || !floating) return;

  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        const topVisible = e.isIntersecting;
        floating.classList.toggle("visible", !topVisible);
        floating.setAttribute("aria-hidden", topVisible ? "true" : "false");
      }
    },
    { threshold: 0, rootMargin: "0px 0px -40px 0px" }
  );
  io.observe(topBar);

  const dispatchInput = el => el.dispatchEvent(new Event("input", { bubbles: true }));

  if (topInput && floatInp) {
    floatInp.addEventListener("input", () => {
      if (topInput.value !== floatInp.value) {
        topInput.value = floatInp.value;
        dispatchInput(topInput);
      }
      floating.classList.toggle("has-value", floatInp.value.length > 0);
    });

    topInput.addEventListener("input", () => {
      if (floatInp.value !== topInput.value) {
        floatInp.value = topInput.value;
      }
      floating.classList.toggle("has-value", floatInp.value.length > 0);
    });
  }

  clearBtn && clearBtn.addEventListener("click", () => {
    if (!floatInp) return;
    floatInp.value = "";
    if (topInput) { topInput.value = ""; dispatchInput(topInput); }
    floating.classList.remove("has-value");
    floatInp.focus();
  });

  filtBtn && filtBtn.addEventListener("click", () => {
    if (openFilt) openFilt.click();
  });
})();
