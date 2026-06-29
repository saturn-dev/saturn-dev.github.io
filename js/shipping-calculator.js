(() => {
  const VOLUMETRIC_DIVISOR = 5000;
  const PROMO_DISCOUNT     = 15;

  const SERVICES = [
    { key: "dhl",   name: "DHL Express",      base: 6, perKg: 13.5, etaMin: 5,  etaMax: 9,  tag: "FASTEST",  tagClass: "fastest"  },
    { key: "fedex", name: "FedEx Priority",   base: 6, perKg: 12.5, etaMin: 3,  etaMax: 5,  tag: null                              },
    { key: "ups",   name: "UPS Worldwide",    base: 5, perKg: 11.5, etaMin: 12, etaMax: 16, tag: null                              },
    { key: "ems",   name: "EMS Economy",      base: 4, perKg: 8.5,  etaMin: 7,  etaMax: 12, tag: "CHEAPEST", tagClass: "cheapest" }
  ];

  const DEST_MULT = {
    US: 1.00, CA: 1.05, MX: 1.05,
    UK: 1.10, DE: 1.10, FR: 1.10,
    AU: 1.20, JP: 0.85
  };

  const presetGrid    = document.getElementById("presetGrid");
  const customGrid    = document.getElementById("customGrid");
  const weightSummary = document.getElementById("weightSummary");
  const modeToggle    = document.getElementById("modeToggle");
  const promoToggle   = document.getElementById("promoToggle");
  const promoCard     = document.getElementById("promoCard");
  const priceGrid     = document.getElementById("priceGrid");
  const destSelect    = document.getElementById("destSelect");

  const dimL  = document.getElementById("dimL");
  const dimW  = document.getElementById("dimW");
  const dimH  = document.getElementById("dimH");
  const dimWt = document.getElementById("dimWt");

  const elActual     = document.getElementById("actualWeight");
  const elVolumetric = document.getElementById("volumetricWeight");
  const elChargeable = document.getElementById("chargeableWeight");

  const state = {
    mode: "preset",
    L: 30, W: 25, H: 20, weight: 2,
    dest: "US",
    promo: false
  };

  const fmt$ = n => `$${n.toFixed(2)}`;

  function calcWeights() {
    const volumetric = (state.L * state.W * state.H) / VOLUMETRIC_DIVISOR;
    const chargeable = Math.max(state.weight, volumetric);
    return { actual: state.weight, volumetric, chargeable };
  }

  function calcPrice(service, chargeable) {
    const mult = DEST_MULT[state.dest] ?? 1;
    let price = (service.base + service.perKg * chargeable) * mult;
    if (state.promo) price = Math.max(0, price - PROMO_DISCOUNT);
    return price;
  }

  function animateText(el, from, to, format, duration = 380) {
    const start = performance.now();
    function frame(now) {
      const t     = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function readPrev(el) {
    const raw = parseFloat((el.textContent || "0").replace(/[^0-9.\-]/g, ""));
    return isNaN(raw) ? 0 : raw;
  }

  function renderWeights() {
    if (state.mode !== "custom") return;
    const w = calcWeights();
    animateText(elActual,     readPrev(elActual),     w.actual,     v => v.toFixed(2) + "kg");
    animateText(elVolumetric, readPrev(elVolumetric), w.volumetric, v => v.toFixed(2) + "kg");
    animateText(elChargeable, readPrev(elChargeable), w.chargeable, v => v.toFixed(2) + "kg");
  }

  const prevPrices = {};

  function renderPrices() {
    const { chargeable } = calcWeights();

    if (!priceGrid.dataset.built) {
      priceGrid.innerHTML = SERVICES.map(s => `
        <article class="price-card ${s.tagClass === 'cheapest' ? 'is-cheapest' : ''}" data-service="${s.key}">
          <div class="price-head">
            <div class="price-name">${s.name}</div>
            ${s.tag ? `<span class="price-tag ${s.tagClass}">${s.tag}</span>` : ""}
          </div>
          <div class="price-amount">
            <span class="promo-strike" data-strike></span>
            <span data-amount>$0.00</span>
          </div>
          <div class="price-meta">Chargeable weight <strong data-cw>0.00kg</strong> at <strong data-rate>$0/kg</strong></div>
          <div class="price-eta" data-eta>${s.etaMin}-${s.etaMax} days</div>
          <a class="price-cta" href="https://www.kakobuy.com/register/?affcode=deepinmycloset" target="_blank" rel="noopener">
            <span>Sign up & save $15</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </article>
      `).join("");
      priceGrid.dataset.built = "true";
    }

    SERVICES.forEach(s => {
      const card = priceGrid.querySelector(`[data-service="${s.key}"]`);
      if (!card) return;

      const finalPrice   = calcPrice(s, chargeable);
      const noPromoPrice = (s.base + s.perKg * chargeable) * (DEST_MULT[state.dest] ?? 1);

      const amountEl = card.querySelector("[data-amount]");
      const strikeEl = card.querySelector("[data-strike]");
      const cwEl     = card.querySelector("[data-cw]");
      const rateEl   = card.querySelector("[data-rate]");

      const prev = prevPrices[s.key] ?? finalPrice;
      animateText(amountEl, prev, finalPrice, v => fmt$(v));
      prevPrices[s.key] = finalPrice;

      if (state.promo && noPromoPrice - finalPrice > 0.005) {
        card.classList.add("has-promo");
        strikeEl.textContent = fmt$(noPromoPrice);
      } else {
        card.classList.remove("has-promo");
        strikeEl.textContent = "";
      }

      cwEl.textContent  = `${chargeable.toFixed(2)}kg`;
      rateEl.textContent = `$${s.perKg.toFixed(2)}/kg`;
    });
  }

  function renderAll() {
    renderWeights();
    renderPrices();
  }

  modeToggle.addEventListener("click", e => {
    const btn = e.target.closest("button[data-mode]");
    if (!btn) return;
    const mode = btn.dataset.mode;
    if (mode === state.mode) return;

    modeToggle.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === btn));
    state.mode = mode;

    if (mode === "preset") {
      presetGrid.style.display = "";
      customGrid.style.display = "none";
      weightSummary.style.display = "none";
      const active = presetGrid.querySelector(".preset-card.active");
      if (active) applyPreset(active);
    } else {
      presetGrid.style.display = "none";
      customGrid.style.display = "";
      weightSummary.style.display = "";
      dimL.value  = state.L;
      dimW.value  = state.W;
      dimH.value  = state.H;
      dimWt.value = state.weight;
      renderAll();
    }
  });

  function applyPreset(card) {
    presetGrid.querySelectorAll(".preset-card").forEach(c => c.classList.toggle("active", c === card));
    state.L      = parseFloat(card.dataset.l);
    state.W      = parseFloat(card.dataset.w);
    state.H      = parseFloat(card.dataset.h);
    state.weight = parseFloat(card.dataset.weight);
    renderAll();
  }

  presetGrid.addEventListener("click", e => {
    const card = e.target.closest(".preset-card");
    if (card) applyPreset(card);
  });

  [dimL, dimW, dimH, dimWt].forEach(input => {
    input.addEventListener("input", () => {
      state.L      = Math.max(1,   parseFloat(dimL.value)  || 0);
      state.W      = Math.max(1,   parseFloat(dimW.value)  || 0);
      state.H      = Math.max(1,   parseFloat(dimH.value)  || 0);
      state.weight = Math.max(0.1, parseFloat(dimWt.value) || 0);
      renderAll();
    });
  });

  destSelect.addEventListener("change", () => {
    state.dest = destSelect.value;
    renderAll();
  });

  promoToggle.addEventListener("change", () => {
    state.promo = promoToggle.checked;
    promoCard.classList.toggle("active", state.promo);
    if (state.promo && typeof showNotification === "function") {
      showNotification("Promo applied", "$15 off with code DEEPINMYCLOSET", 3500, "#00b0cc");
    }
    renderAll();
  });

  renderAll();
})();
