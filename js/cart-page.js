(() => {
  const container     = document.getElementById("cartContainer");
  const totalEl       = document.getElementById("cartTotal");
  const emptyState    = document.getElementById("emptyState");
  const countDisplay  = document.getElementById("cartCountDisplay");
  const subtitleEl    = document.getElementById("cartSubtitle");
  const itemCountEl   = document.getElementById("totalItemCount");
  const cartTotalText = document.querySelector(".cart-total-text");

  function getCart() { return JSON.parse(localStorage.getItem("cart")) || []; }
  function saveCart(c) { localStorage.setItem("cart", JSON.stringify(c)); }

  function animateNumber(el, start, end, duration = 500) {
    const range = end - start;
    let startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      const p    = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const v    = start + range * ease;

      el.textContent = `$${v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;

      if (p < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function getProductImage(item) {
    if (item.cartImage) return item.cartImage;
    if (item.image) return item.image;
    return `/products/${item.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")}.png`;
  }

  function loadCartImage(wrap, src, alt) {
    wrap.innerHTML = "";
    const skeleton = document.createElement("div");
    skeleton.className = "img-skeleton";
    wrap.appendChild(skeleton);

    const img = new Image();
    img.alt = alt || "";
    img.style.opacity = "0";
    img.style.transition = "opacity 0.3s ease";

    img.onload = () => {
      wrap.innerHTML = "";
      wrap.appendChild(img);
      requestAnimationFrame(() => { img.style.opacity = "1"; });
    };
    img.onerror = () => {
      wrap.innerHTML = "";
      img.style.opacity = "0.3";
      wrap.appendChild(img);
    };

    img.src = src;
  }

  function getVariantLabel(item) {
    const parts = [];
    if (item.selectedSize) parts.push(`Size: ${item.selectedSize}`);
    if (item.selectedColor && !item.selectedColor.startsWith("http")) {
      parts.push(`Color: ${item.selectedColor}`);
    }
    return parts.join(" • ");
  }

  function removeItem(name) {
    const el = [...document.querySelectorAll(".cart-item")].find(e => e.dataset.name === name);
    if (!el) return;

    el.classList.add("removing");
    el.addEventListener("animationend", () => {
      const updated = getCart().filter(i => i.name !== name);
      saveCart(updated);
      showNotification("Removed", `${name} removed from cart`, 3000, "#e53535");
      renderCart();
      if (typeof cart !== "undefined") cart = getCart();
      window.updateCartButton?.();
      window.updateOtherTotals?.();
    }, { once: true });
  }

  function renderCart() {
    const cart = getCart();
    container.innerHTML = "";

    if (cart.length === 0) {
      emptyState.classList.add("visible");
      countDisplay.textContent = "";
      subtitleEl.textContent   = "Your cart is empty.";
      itemCountEl.textContent  = "0 items";

      animateNumber(totalEl, parseFloat(totalEl.textContent.replace(/[$,]/g, "")) || 0, 0);
      if (cartTotalText) animateNumber(cartTotalText, parseFloat(cartTotalText.textContent.replace(/[$,]/g, "")) || 0, 0);
      return;
    }

    emptyState.classList.remove("visible");

    const plural = cart.length === 1 ? "1 item" : `${cart.length} items`;
    itemCountEl.textContent = plural;
    subtitleEl.textContent  = `${cart.length} item${cart.length > 1 ? "s" : ""} in cart.`;

    let total = 0;

    cart.forEach((item, i) => {
      total += item.price;

      const el = document.createElement("div");
      el.className = "cart-item";
      el.dataset.name = item.name;
      el.style.animationDelay = `${i * 0.07}s`;

      const variantLabel = getVariantLabel(item);

      el.innerHTML = `
        <div class="cart-img-wrap"></div>
        <div class="cart-info">
          <div class="cart-name">${item.name}</div>
          ${variantLabel ? `<div class="cart-variant">${variantLabel}</div>` : ""}
          <div class="cart-price">$${item.price.toFixed(2)}</div>
        </div>
        <div class="cart-actions">
          <a class="buy-btn" target="_blank"
             href="https://www.kakobuy.com/item/details?url=${encodeURIComponent(item.link)}&affcode=deepinmycloset">
            Buy Now
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <button class="remove-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            Remove
          </button>
        </div>
      `;

      loadCartImage(el.querySelector(".cart-img-wrap"), getProductImage(item), item.name);
      el.querySelector(".remove-btn").onclick = () => removeItem(item.name);
      container.appendChild(el);
    });

    const old = parseFloat(totalEl.textContent.replace(/[$,]/g, "")) || 0;
    animateNumber(totalEl, old, total);

    if (cartTotalText) {
      const oldNav = parseFloat(cartTotalText.textContent.replace(/[$,]/g, "")) || 0;
      animateNumber(cartTotalText, oldNav, total);
    }
  }

  window.addEventListener("storage", e => {
    if (e.key === "cart") renderCart();
  });

  renderCart();
})();
