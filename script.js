// ============================================================
//  let
// ============================================================

let data;
let currentCategory  = "ALL";
let visibleCount     = 0;
let chunkSize        = 0;
let filteredProducts = [];
let isLoading        = false;
let searchTimeout    = null;

let qcImages         = [];
let qcIndex          = 0;
let currentQcFolder  = "";
let isSingleImageMode = false;

let currentZoom     = 1;
let currentRotation = 0;
let offsetX         = 0;
let offsetY         = 0;
let dragStart       = 0;

let activeSort  = "az";
let minSelected = 0;
let maxSelected = 0;

// Cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];


// ============================================================
//  DOM CONST
// ============================================================

const tabsEl       = document.getElementById("tabs");
const grid         = document.getElementById("productGrid");
const searchInput  = document.getElementById("searchInput");
const sidebarTabsEl = document.getElementById("sidebarTabs");
const filterOptions = document.querySelectorAll(".filter-option");
const colorSection  = document.getElementById("colorSection");

// QC modal elements
const qcModal    = document.getElementById("qcModal");
const qcImage    = document.getElementById("qcImage");
const qcPrev     = document.getElementById("qcPrev");
const qcNext     = document.getElementById("qcNext");
const qcThumbs   = document.getElementById("qcThumbs");
const qcSkeleton = document.getElementById("qcSkeleton");
const qcFrame    = document.querySelector(".qc-image-frame");
const qcZoomIn   = document.getElementById("qcZoomIn");
const qcZoomOut  = document.getElementById("qcZoomOut");
const qcRotate   = document.getElementById("qcRotate");
const qcReset    = document.getElementById("qcReset");
const qcSave     = document.getElementById("qcSave");
const qcCloseBtn = document.getElementById("qcCloseBtn");

const proxyBase = "https://imgproxy-vb4m.onrender.com/proxy-image?url=";


// ============================================================
//  CART
// ============================================================

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product, selection = {}) {
  if (cart.some(item => item.name === product.name)) {
    showNotification("Error", "You can only have 1 of each product", 3000, "#e53535");
    return;
  }

  cart.push({
    ...product,
    selectedSize:  selection.size  || null,
    selectedColor: selection.color || null,
    cartImage:     selection.image || product.image || null,
  });
  saveCart();
  updateCartButton();
  updateOtherTotals();
  showNotification("Added!", `${product.name} added to cart`, 2000, "#00aaff");
}

function removeFromCart(name) {
  cart = cart.filter(item => item.name !== name);
  saveCart();
  renderCartPage?.();
  updateCartButton();
  updateOtherTotals();
}

function updateCartButton() {
  const total  = cart.reduce((sum, item) => sum + item.price, 0);
  const cartBtn = document.querySelector(".cart-button");
  if (!cartBtn) return;

  const oldTotal = parseFloat(cartBtn.dataset.total || "0");
  cartBtn.dataset.total = total;

  cartBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 24">
      <g fill="none">
        <path d="M24 0v24H0V0z"/>
        <path fill="currentColor" d="M9 20a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2M2.2 2.9a1 1 0 0 1 1.295-.269l.105.07 1.708 1.28a2 2 0 0 1 .653.848l.06.171h12.846a2 2 0 0 1 1.998 2.1l-.013.148-.457 3.655a5 5 0 0 1-4.32 4.34l-.226.023-7.313.61.26 1.124H17.5a1 1 0 0 1 .117 1.993L17.5 19H8.796a2 2 0 0 1-1.906-1.393l-.043-.157-2.74-11.87L2.4 4.3a1 1 0 0 1-.2-1.4"/>
      </g>
    </svg>
    <span class="cart-total">$0.00</span>
  `;

  animateValue(cartBtn.querySelector(".cart-total"), oldTotal, total, 500);
}

function updateOtherTotals() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.querySelectorAll(".cart-total-global").forEach(el => {
    el.textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });
}

function animateValue(element, start, end, duration = 500) {
  let startTimestamp = null;

  const step = timestamp => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = start + (end - start) * progress;
    element.textContent = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (progress < 1) window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
}


// ============================================================
//  CART INIT + CROSS-TAB SYNC
// ============================================================

cart = JSON.parse(localStorage.getItem("cart")) || [];
updateCartButton();
updateOtherTotals();

window.addEventListener("storage", (e) => {
  if (e.key === "cart") {
    cart = JSON.parse(e.newValue) || [];
    updateCartButton();
    updateOtherTotals();
  }
});


// ============================================================
//  SEARCH
// ============================================================

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => renderProducts(true), 400);
});


// ============================================================
//  FILTER MODAL
// ============================================================

const modal = document.getElementById("filterModal");

document.getElementById("openFilters").onclick = () => {
  modal.style.display = "flex";
};

document.getElementById("closeFilters").onclick = () => {
  modal.style.display = "none";
};

modal.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// Sort buttons
document.querySelectorAll(".sort-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeSort = btn.dataset.sort;
  };
});

// Price range
const minRange = document.getElementById("minPrice");
const maxRange = document.getElementById("maxPrice");
const rangeWrapper = minRange.closest(".range-wrapper");

function updateRangeFill() {
  const lo = +minRange.min;
  const hi = +minRange.max;
  const span = hi - lo || 1;
  const minPct = ((+minRange.value - lo) / span) * 100;
  const maxPct = ((+maxRange.value - lo) / span) * 100;
  rangeWrapper.style.setProperty("--min-percent", `${minPct}%`);
  rangeWrapper.style.setProperty("--max-percent", `${maxPct}%`);
}

minRange.addEventListener("input", () => {
  if (+minRange.value >= +maxRange.value) {
    minRange.value = +maxRange.value - 1;
  }
  minSelected = +minRange.value;
  document.getElementById("minPriceLabel").textContent = `$${minSelected}`;
  updateRangeFill();
});

maxRange.addEventListener("input", () => {
  if (+maxRange.value <= +minRange.value) {
    maxRange.value = +minRange.value + 1;
  }
  maxSelected = +maxRange.value;
  document.getElementById("maxPriceLabel").textContent = `$${maxSelected}`;
  updateRangeFill();
});

document.getElementById("applyFilters").onclick = () => {
  modal.style.display = "none";
  renderProducts(true);
};

document.getElementById("clearFilters").onclick = () => {
  // Reset sort
  activeSort = "az";
  document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-sort="${activeSort}"]`)?.classList.add("active");

  const prices = data.products.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  minSelected = min;
  maxSelected = max;

  minRange.value = min;
  maxRange.value = max;

  document.getElementById("minPriceLabel").textContent = `$${min}`;
  document.getElementById("maxPriceLabel").textContent = `$${max}`;
  updateRangeFill();

  renderProducts(true);
};


// ============================================================
//  QC MODAL
// ============================================================

window.addEventListener("DOMContentLoaded", () => {
  qcZoomIn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7"/>
      <line x1="11" y1="8"  x2="11" y2="14"/>
      <line x1="8"  y1="11" x2="14" y2="11"/>
      <line x1="16.5" y1="16.5" x2="21" y2="21"/>
    </svg>`;

  qcZoomOut.innerHTML = `
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
      <line x1="16.5" y1="16.5" x2="21" y2="21"/>
    </svg>`;

  qcRotate.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 9V7a2 2 0 0 0-2-2h-6"/>
      <path d="m15 2-3 3 3 3"/>
      <path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>
    </svg>`;

  qcReset.innerHTML = `
    <svg viewBox="0 0 24 24">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.5 15a9 9 0 1 0 3-9l-5 4"/>
    </svg>`;

  qcSave.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/>
      <path d="m14 19 3 3v-5.5"/>
      <path d="m17 22 3-3"/>
      <circle cx="9" cy="9" r="2"/>
    </svg>`;

  qcCloseBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <line x1="6"  y1="6"  x2="18" y2="18"/>
      <line x1="18" y1="6"  x2="6"  y2="18"/>
    </svg>`;
});


// ============================================================
//  PRODUCT FETCH
// ============================================================

fetch("/products.json")
  .then(res => res.json())
  .then(json => {
    data = json;

    const prices = data.products.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    minSelected = min;
    maxSelected = max;

    minRange.min = maxRange.min = min;
    minRange.max = maxRange.max = max;
    minRange.value = min;
    maxRange.value = max;

    document.getElementById("minPriceLabel").textContent = `$${min}`;
    document.getElementById("maxPriceLabel").textContent = `$${max}`;
    updateRangeFill();

    createTabs();
    updateSearchPlaceholder();
    renderProducts(true);
    updateCartButton();
    updateOtherTotals();
  });


// ============================================================
//  TABS
// ============================================================

function createTabs() {
  tabsEl.innerHTML = "";

  data.categories.forEach(cat => {
    const tab = document.createElement("div");
    tab.className = "tab" + (cat === "ALL" ? " active" : "");
    tab.textContent = cat;

    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = cat;
      updateSearchPlaceholder();
      renderProducts(true);
    };

    tabsEl.appendChild(tab);
  });
}

function updateSearchPlaceholder() {
  const count = data.products.filter(p =>
    currentCategory === "ALL" || p.category === currentCategory
  ).length;
  searchInput.placeholder = `Search ${count} products`;
}

// Drag-to-scroll
const tabs = document.querySelector(".tabs");
let isDown   = false;
let isDragging = false;
let startX;
let scrollLeft;

tabs.addEventListener("mousedown", (e) => {
  isDown     = true;
  isDragging = false;
  tabs.classList.add("dragging");
  startX     = e.pageX - tabs.offsetLeft;
  scrollLeft = tabs.scrollLeft;
});

document.addEventListener("mouseup", () => {
  isDown = false;
  tabs.classList.remove("dragging");
});

tabs.addEventListener("mousemove", (e) => {
  if (!isDown) return;

  const x    = e.pageX - tabs.offsetLeft;
  const walk = x - startX;

  if (Math.abs(walk) > 5) isDragging = true;

  tabs.scrollLeft = scrollLeft - walk;
});

tabs.addEventListener("click", (e) => {
  if (isDragging) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

// Scroll arrows
const tabsArrowLeft  = document.getElementById("tabsArrowLeft");
const tabsArrowRight = document.getElementById("tabsArrowRight");

function updateTabArrows() {
  const max = tabs.scrollWidth - tabs.clientWidth;
  tabsArrowLeft.classList.toggle("show", tabs.scrollLeft > 4);
  tabsArrowRight.classList.toggle("show", tabs.scrollLeft < max - 4);
}

tabs.addEventListener("scroll", updateTabArrows);
window.addEventListener("resize", updateTabArrows);

tabsArrowLeft.addEventListener("click", () => {
  tabs.scrollBy({ left: -tabs.clientWidth * 0.7, behavior: "smooth" });
});

tabsArrowRight.addEventListener("click", () => {
  tabs.scrollBy({ left: tabs.clientWidth * 0.7, behavior: "smooth" });
});

// re-check after tabs are populated (createTabs runs after fetch resolves)
const tabsObserver = new MutationObserver(updateTabArrows);
tabsObserver.observe(tabsEl, { childList: true });
updateTabArrows();


// ============================================================
//  PRODUCT RENDERING
// ============================================================

function sortABC(arr) {
  arr.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

function renderProducts(reset = true) {
  if (reset) {
    grid.innerHTML = "";
    visibleCount = 0;
  }

  filteredProducts = data.products.filter(p =>
    (currentCategory === "ALL" || p.category === currentCategory) &&
    p.name.toLowerCase().includes(searchInput.value.toLowerCase()) &&
    p.price >= minSelected &&
    p.price <= maxSelected
  );

  // Sort
  if (activeSort === "az") {
    filteredProducts.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  } else if (activeSort === "new") {
    filteredProducts = [...filteredProducts].reverse();
  } else if (activeSort === "old") {
  } else if (activeSort === "low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (activeSort === "high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  const loader      = document.getElementById("infiniteLoader");
  const isSearching = searchInput.value.trim().length > 0;

  if (currentCategory !== "ALL" || isSearching) {
    loader.classList.add("hidden");
    filteredProducts.forEach(renderCard);
    visibleCount = filteredProducts.length;
    return;
  }
  chunkSize = 40;
  loadMoreProducts();
}

function loadMoreProducts() {
  if (isLoading || currentCategory !== "ALL") return;

  const loader = document.getElementById("infiniteLoader");
  loader.classList.remove("hidden");
  isLoading = true;

  setTimeout(() => {
    const nextBatch = filteredProducts.slice(visibleCount, visibleCount + chunkSize);
    nextBatch.forEach(renderCard);
    visibleCount += nextBatch.length;
    isLoading = false;

    if (visibleCount >= filteredProducts.length) {
      loader.classList.add("hidden");
    }
  }, 500);
}

function renderCard(p) {
  const imageSrc = p.image || `/products/${
    p.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
  }.png`;

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="card-tilt">
      <div class="card-skeleton"></div>
      <div class="card-image-wrapper">
        <img class="card-img-bg" src="${imageSrc}" loading="lazy" aria-hidden="true">
        <img class="card-img-main" src="${imageSrc}" loading="lazy">
        <div class="card-glare"></div>
        <div class="price">$${p.price.toFixed(2)}</div>
        <div class="card-gradient"></div>
        <div class="card-content">
          <div class="title">${p.name}</div>
          <div class="category">${p.category}</div>
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", () => openProductModal(p));
  attachCardTilt(card);
  attachCardLoadState(card);
  grid.appendChild(card);
}

function attachCardLoadState(card) {
  const tilt = card.querySelector(".card-tilt");
  const mainImg = card.querySelector(".card-img-main");

  function markLoaded() {
    tilt.classList.add("loaded");
  }

  if (mainImg.complete && mainImg.naturalWidth > 0) {
    markLoaded();
  } else {
    mainImg.addEventListener("load", markLoaded, { once: true });
    mainImg.addEventListener("error", markLoaded, { once: true });
  }
}

function isCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 810;
}

function attachCardTilt(card) {
  const tilt = card.querySelector(".card-tilt");

  if (isCoarsePointer()) {
    card.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      tilt.classList.add("tap-active");
    });
    const release = (e) => {
      if (e.pointerType === "mouse") return;
      setTimeout(() => tilt.classList.remove("tap-active"), 180);
    };
    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", release);
    return;
  }

  const maxTilt = 14;
  let frame = null;

  function onMove(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rotateY = (x - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - y) * maxTilt * 2;

      tilt.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      tilt.style.setProperty("--mx", `${x * 100}%`);
      tilt.style.setProperty("--my", `${y * 100}%`);
    });
  }

  function onLeave() {
    if (frame) cancelAnimationFrame(frame);
    tilt.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  card.addEventListener("pointermove", onMove);
  card.addEventListener("pointerleave", onLeave);
}

window.addEventListener("scroll", () => {
  if (currentCategory !== "ALL") return;

  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
    visibleCount < filteredProducts.length
  ) {
    loadMoreProducts();
  }
});


// ============================================================
//  QC VIEWER
// ============================================================

qcNext.onclick = (e) => {
  e.stopPropagation();
  openQcImage((qcIndex + 1) % qcImages.length);
};

qcPrev.onclick = (e) => {
  e.stopPropagation();
  openQcImage((qcIndex - 1 + qcImages.length) % qcImages.length);
};

function openQcImage(index) {
  if (!qcImages.length) return;

  qcIndex = index;
  qcSkeleton.style.display = "block";
  qcImage.style.opacity = "0";

  const img = new Image();
  img.src = `/qc/${currentQcFolder}/${qcImages[index]}`;

  img.onload = () => {
    qcImage.src = img.src;
    qcSkeleton.style.display = "none";
    qcImage.style.opacity = "1";
    highlightThumb();
  };
}

function highlightThumb() {
  document.querySelectorAll(".qc-thumb").forEach((t, i) => {
    t.classList.toggle("active", i === qcIndex);
  });
}

function renderThumbnails() {
  qcThumbs.innerHTML = "";

  qcImages.forEach((img, i) => {
    const t = document.createElement("img");
    t.src = `/qc/${currentQcFolder}/${img}`;
    t.className = "qc-thumb";

    t.onclick = (e) => {
      e.stopPropagation();
      openQcImage(i);
    };

    qcThumbs.appendChild(t);
  });

  highlightThumb();
}

function openCustomQc(imagesArray, startIndex = 0) {
  if (!imagesArray || !imagesArray.length) return;

  isSingleImageMode = true;
  qcThumbs.innerHTML = "";
  qcThumbs.style.display = "none";

  qcImages = imagesArray;
  qcIndex  = startIndex;

  qcModal.style.display = "flex";
  openExternalQcImage(imagesArray, startIndex);
}

function openExternalQcImage(imagesArray, index) {
  qcIndex = index;

  qcSkeleton.style.display = "block";
  qcImage.style.opacity = "0";

  const img = new Image();
  img.src = imagesArray[index];

  img.onload = () => {
    qcImage.src = img.src;
    qcSkeleton.style.display = "none";
    qcImage.style.opacity = "1";
    if (isSingleImageMode) {
      qcImage.style.maxWidth  = "60%";
      qcImage.style.maxHeight = "60vh";
    } else {
      qcImage.style.maxWidth  = "";
      qcImage.style.maxHeight = "";
    }
  };
}


// ============================================================
//  QC TRANSFORM
// ============================================================


let startY     = 0;

function applyTransform() {
  qcFrame.style.transform = `
    translate(${offsetX}px, ${offsetY}px)
    scale(${currentZoom})
    rotate(${currentRotation}deg)
  `;
}

qcFrame.addEventListener("pointerdown", (e) => {
  if (currentZoom <= 1) return; 

  isDragging = true;
  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;

  qcFrame.style.transition = "none";
  qcFrame.setPointerCapture(e.pointerId);
});

qcFrame.addEventListener("pointermove", (e) => {
  if (!isDragging) return;

  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
  applyTransform();
});

qcFrame.addEventListener("pointerup", (e) => {
  isDragging = false;
  qcFrame.releasePointerCapture(e.pointerId);
  qcFrame.style.transition = "transform 0.25s ease";
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
  applyTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  qcFrame.style.cursor = "grab";
});

// --- Controls ---

qcZoomIn.onclick = (e) => {
  e.stopPropagation();
  currentZoom = Math.min(currentZoom + 0.2, 5);
  applyTransform();
};

qcZoomOut.onclick = (e) => {
  e.stopPropagation();
  currentZoom = Math.max(currentZoom - 0.2, 0.4);
  applyTransform();
};

qcRotate.onclick = (e) => {
  e.stopPropagation();
  currentRotation += 90;
  applyTransform();
};

function resetTransform() {
  currentZoom     = 1;
  currentRotation = 0;
  offsetX         = 0;
  offsetY         = 0;
  applyTransform();
}

qcReset.onclick = (e) => {
  e.stopPropagation();
  resetTransform();
};

// --- Save ---

qcSave.onclick = (e) => {
  e.stopPropagation();
  const link = document.createElement("a");
  link.href = qcImage.src;
  link.download = "qc-@deepinmycloset.jpg";
  link.click();
};

// --- Close ---

function closeQc() {
  isSingleImageMode = false;
  qcThumbs.style.display = "flex";
  qcImage.style.maxWidth  = "";
  qcImage.style.maxHeight = "";
  qcModal.style.display   = "none";
  resetTransform();
}

qcCloseBtn.onclick = (e) => {
  e.stopPropagation();
  closeQc();
};

qcModal.addEventListener("click", (e) => {
  if (e.target === qcModal) closeQc();
});

document.addEventListener("keydown", (e) => {
  if (qcModal.style.display !== "flex") return;

  if (e.key === "Escape")      closeQc();
  if (e.key === "ArrowRight")  qcNext.click();
  if (e.key === "ArrowLeft")   qcPrev.click();
});

let swipeStartX = 0;

qcModal.addEventListener("pointerdown", (e) => {
  if (currentZoom > 1) return;
  swipeStartX = e.clientX;
});

qcModal.addEventListener("pointerup", (e) => {
  if (currentZoom > 1) return;

  const diff = swipeStartX - e.clientX;
  if (Math.abs(diff) > 60) {
    diff > 0
      ? openQcImage((qcIndex + 1) % qcImages.length)
      : openQcImage((qcIndex - 1 + qcImages.length) % qcImages.length);
  }
});


// ============================================================
//  PRODUCT MODAL
// ============================================================

const productModal = document.getElementById("productModal");
const productClose = document.getElementById("productClose");

const btn        = document.getElementById("openFilters");
const filterText = "Filters";

function updateFilterBtn() {
  if (window.innerWidth <= 768) {
    btn.childNodes.forEach(n => { if (n.nodeType === 3) n.remove(); });
  } else {
    if (!btn.textContent.includes(filterText)) {
      btn.append(" " + filterText);
    }
  }
}

updateFilterBtn();
window.addEventListener("resize", updateFilterBtn);

function closeProductModal() {
  if (productModal.style.display !== "flex") return;
  productModal.classList.add("closing");
  setTimeout(() => {
    productModal.style.display = "none";
    productModal.classList.remove("closing");
  }, 220);
}

productClose.onclick = closeProductModal;
productModal.onclick  = e => {
  if (e.target === productModal) closeProductModal();
};

function kakobuyLink(raw) {
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(raw)}&affcode=deepinmycloset`;
}

function openProductModal(p) {
  document.getElementById("productTitle").textContent    = p.name;
  document.getElementById("productPrice").textContent    = `$${p.price.toFixed(2)}`;
  document.getElementById("productCategory").textContent = p.category;
  document.getElementById("productSales").textContent    = `Sales : ${p.sales}`;

  const mainImage = p.image || `/products/${
    p.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
  }.png`;
  document.getElementById("productMainImage").src   = mainImage;
  document.getElementById("productMainImageBg").src = mainImage;

  // Seller
  document.getElementById("sellerName").textContent = p.seller;
  document.getElementById("sellerName").href        = p.sellerlink;

  const logo = document.getElementById("sellerLogo");
  if      (p.link.includes("weidian")) logo.src = "https://nhbpica.kakobuy.com/etc/platform/micro.png";
  else if (p.link.includes("taobao"))  logo.src = "https://nhbpica.kakobuy.com/etc/platform/taobao.png";
  else if (p.link.includes("1688"))    logo.src = "https://nhbpica.kakobuy.com/etc/platform/1688.png";

  // KakoBuy link
  document.getElementById("gotoProduct").href = kakobuyLink(p.link);

  // QC button
  const galleryQcBtn = document.querySelector(".gallery-qc-btn");

  galleryQcBtn.onclick = async () => {
    const folderSlug = (p.qc || p.name)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    currentQcFolder = folderSlug;

    try {
      const res = await fetch(`/qc/${currentQcFolder}/index.json`);
      if (!res.ok) throw new Error("missing");

      qcImages = (await res.json()).images;
      qcImages.sort((a, b) => parseInt(a) - parseInt(b));

      if (!qcImages.length) throw new Error("missing");

      qcIndex = 0;
      productModal.style.display = "none";
      qcModal.style.display      = "flex";

      renderThumbnails();
      openQcImage(0);

    } catch (err) {
      console.error(err);
      showNotification("Error.", "No available Quality Check", 4000, "#e53535");
    }
  };

  // Size / color selection state for this product
  let selectedSize  = null;
  let selectedColor = null;

  // Cart button
  const copyBtn = document.getElementById("copyRawBtn");

  const cartIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="9"  cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
    <span class="copy-btn-label">Add to Cart</span>`;

  const checkIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
    <span class="copy-btn-label">Added</span>`;

  function updateCopyButton() {
    const inCart = cart.some(item => item.name === p.name);

    if (inCart) {
      copyBtn.innerHTML          = checkIcon;
      copyBtn.disabled           = true;
      copyBtn.style.pointerEvents = "none";
    } else {
      copyBtn.innerHTML          = cartIcon;
      copyBtn.disabled           = false;
      copyBtn.style.pointerEvents = "auto";
    }
  }

  updateCopyButton();

  const hasSizes  = !!(p.size  && p.size.length);
  const hasColors = !!(p.color && p.color.length);

  copyBtn.onclick = () => {
    if (cart.some(item => item.name === p.name)) return;

    const missingSize  = hasSizes  && !selectedSize;
    const missingColor = hasColors && !selectedColor;

    if (missingSize && missingColor) {
      showNotification("Select Required", "Please select a size and color before adding to cart.", 3000, "#e53535");
      return;
    }
    if (missingSize) {
      showNotification("Select Size", "Please select a size before adding to cart.", 3000, "#e53535");
      return;
    }
    if (missingColor) {
      showNotification("Select Color", "Please select a color before adding to cart.", 3000, "#e53535");
      return;
    }

    const imageColorCount = hasColors ? p.color.filter(c => c.startsWith("http")).length : 0;
    const onlyOneImageColor = imageColorCount === 1;

    let cartImage = mainImage;
    if (selectedColor && selectedColor.startsWith("http") && !onlyOneImageColor) {
      cartImage = proxyBase + encodeURIComponent(selectedColor);
    }

    addToCart(p, { size: selectedSize, color: selectedColor, image: cartImage });
    updateCopyButton();
  };

  // Sizes
  const sizeContainer = document.getElementById("sizeContainer");
  sizeContainer.innerHTML = "";
  selectedSize = null;
  p.size?.forEach(size => {
    const div = document.createElement("div");
    div.textContent = size;
    div.onclick = () => {
      selectedSize = size;
      sizeContainer.querySelectorAll("div").forEach(d => d.classList.remove("selected"));
      div.classList.add("selected");
    };
    sizeContainer.appendChild(div);
  });

  // Colors
  const colorContainer = document.getElementById("colorContainer");
  colorContainer.innerHTML = "";
  selectedColor = null;

  if (p.color && p.color.length) {
    colorSection.classList.remove("hidden");

    const COLOR_LIMIT = 8;

    const selectColor = (c, el) => {
      selectedColor = c;
      colorContainer.querySelectorAll(".color-img-wrapper, .color-swatch")
        .forEach(node => node.classList.remove("selected"));
      el.classList.add("selected");
    };

    const renderColor = (c) => {
      if (c.startsWith("http")) {
        const wrapper = document.createElement("div");
        wrapper.className = "color-img-wrapper";
        loadImageWithSkeleton(wrapper, proxyBase + encodeURIComponent(c));
        wrapper.onclick = () => selectColor(c, wrapper);
        return wrapper;
      } else {
        const div = document.createElement("div");
        div.className = "color-swatch";
        div.textContent = c;
        div.onclick = () => selectColor(c, div);
        return div;
      }
    };

    p.color.slice(0, COLOR_LIMIT).forEach(c => {
      colorContainer.appendChild(renderColor(c));
    });

    if (p.color.length > COLOR_LIMIT) {
      const loadMoreBtn = document.createElement("button");
      loadMoreBtn.className = "color-load-more";
      loadMoreBtn.textContent = `+${p.color.length - COLOR_LIMIT}`;
      loadMoreBtn.setAttribute("aria-label", "Load more colors");
      loadMoreBtn.onclick = () => {
        loadMoreBtn.remove();
        p.color.slice(COLOR_LIMIT).forEach(c => {
          colorContainer.appendChild(renderColor(c));
        });
      };
      colorContainer.appendChild(loadMoreBtn);
    }

  } else {
    colorSection.classList.add("hidden");
  }

  // Gallery
  const gallery = document.getElementById("productGallery");
  gallery.innerHTML = "";

  if (p.gallery && p.gallery.length) {
    p.gallery.forEach(imgSrc => {
      const wrapper = document.createElement("div");
      wrapper.className = "gallery-img-wrapper";
      loadImageWithSkeleton(wrapper, proxyBase + encodeURIComponent(imgSrc));
      gallery.appendChild(wrapper);
    });
  }

  productModal.style.display = "flex";
}

function loadImageWithSkeleton(container, imageUrl) {
  container.innerHTML = "";

  const skeleton = document.createElement("div");
  skeleton.className = "img-skeleton";
  container.appendChild(skeleton);

  const img = new Image();
  img.style.opacity    = "0";
  img.style.transition = "opacity 0.3s ease";
  img.src = imageUrl;

  img.onload = () => {
    container.innerHTML = "";
    container.appendChild(img);
    requestAnimationFrame(() => { img.style.opacity = "1"; });
  };
}


// ============================================================
//  NOTIFICATIONS
// ============================================================

function showNotification(title, description, duration = 3000, color = "#fff") {
  const container = document.getElementById("notification-container");
  const notif     = document.createElement("div");
  notif.className = "notification";

  notif.innerHTML = `
    <div class="fill-background" style="animation:shrink ${duration}ms linear forwards"></div>
    <div class="left-bar" style="background-color:${color}"></div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-desc">${description}</div>
    </div>
  `;

  container.appendChild(notif);
  requestAnimationFrame(() => notif.classList.add("show"));

  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 300);
  }, duration);
}