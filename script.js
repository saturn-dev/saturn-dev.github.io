let data;
let currentCategory = "ALL";
let visibleCount = 0;
let chunkSize = 0;
let filteredProducts = [];
let isLoading = false;
let searchTimeout = null;
let qcImages = [];
let qcIndex = 0;
let currentQcFolder = "";
let dragStart = 0;
let currentZoom = 1;
let currentRotation = 0;
let offsetX = 0;
let offsetY = 0;
let isSingleImageMode = false;
let activeSort = "az";
let minSelected = 0;
let maxSelected = 0;

let cart = JSON.parse(localStorage.getItem("cart")) || [];
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

const tabsEl = document.getElementById("tabs");
const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const sidebarTabsEl = document.getElementById("sidebarTabs");
const filterOptions = document.querySelectorAll(".filter-option");

const qcModal = document.getElementById("qcModal");
const qcImage = document.getElementById("qcImage");
const qcPrev = document.getElementById("qcPrev");
const qcNext = document.getElementById("qcNext");
const qcThumbs = document.getElementById("qcThumbs");
const qcSkeleton = document.getElementById("qcSkeleton");
const qcFrame = document.querySelector(".qc-image-frame");
const qcZoomIn = document.getElementById("qcZoomIn");
const qcZoomOut = document.getElementById("qcZoomOut");
const qcRotate = document.getElementById("qcRotate");
const qcReset = document.getElementById("qcReset");
const qcSave = document.getElementById("qcSave");
const qcCloseBtn = document.getElementById("qcCloseBtn");
const proxyBase = "https://imgproxy-vb4m.onrender.com/proxy-image?url=";

// ------------------ CART FUNCTIONS ------------------
function addToCart(product) {
  if (cart.some(item => item.name === product.name)) {
    showNotification("Error", "You can only have 1 of each product", 3000, "#e53535");
    return;
  }
  cart.push({ ...product });
  saveCart(); // save to localStorage
  updateCartButton();
  updateOtherTotals();
  showNotification("Added!", `${product.name} added to cart`, 2000, "#00aaff");
}

function removeFromCart(name) {
  cart = cart.filter(item => item.name !== name);
  saveCart(); // save to localStorage
  renderCartPage?.();
  updateCartButton();
  updateOtherTotals();
}

function updateCartButton() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const cartBtn = document.querySelector(".cart-button");
  if (cartBtn) {
    const oldTotal = parseFloat(cartBtn.dataset.total || "0");
    cartBtn.dataset.total = total;
    cartBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 24">
        <g fill="none">
          <path d="M24 0v24H0V0z"/>
          <path fill="currentColor" d="M9 20a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2M2.2 2.9a1 1 0 0 1 1.295-.269l.105.07 1.708 1.28a2 2 0 0 1 .653.848l.06.171h12.846a2 2 0 0 1 1.998 2.1l-.013.148-.457 3.655a5 5 0 0 1-4.32 4.34l-.226.023-7.313.61.26 1.124H17.5a1 1 0 0 1 .117 1.993L17.5 19H8.796a2 2 0 0 1-1.906-1.393l-.043-.157-2.74-11.87L2.4 4.3a1 1 0 0 1-.2-1.4"></path>
        </g>
      </svg> <span class="cart-total">$0.00</span>
    `;
    const totalEl = cartBtn.querySelector(".cart-total");
    animateValue(totalEl, oldTotal, total, 500);
  }
}

// ------------------ GLOBAL TOTAL SYNC ------------------
function updateOtherTotals() {
  const cartBtn = document.querySelector(".cart-button");
  if (!cartBtn) return;

  const total = parseFloat(cartBtn.dataset.total || 0);
  document.querySelectorAll(".cart-total-global").forEach(el => {
    el.textContent = `$${total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  });
}

function animateValue(element, start, end, duration = 500) {
  let startTimestamp = null;
  const step = timestamp => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = start + (end - start) * progress;
    // format with commas and 2 decimals
    element.textContent = `$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// ------------------ CART SYNC ACROSS PAGES ------------------

// Load cart from localStorage immediately on page load
cart = JSON.parse(localStorage.getItem("cart")) || [];
updateCartButton();
updateOtherTotals();

// Listen for changes in other tabs/pages
window.addEventListener("storage", (e) => {
  if (e.key === "cart") {
    cart = JSON.parse(e.newValue) || [];
    updateCartButton();
    updateOtherTotals();
  }
});

// Format cart total with commas
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

// Update other totals anywhere on the page
function updateOtherTotals() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.querySelectorAll(".cart-total-global").forEach(el => {
    el.textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });
}
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    renderProducts(true);
  }, 400);
});
const modal = document.getElementById("filterModal");
document.getElementById("openFilters").onclick = () => {
  modal.style.display = "flex";
};

document.getElementById("closeFilters").onclick = () => {
  modal.style.display = "none";
};

modal.onclick = e => {
  if(e.target === modal) modal.style.display = "none";
};

document.querySelectorAll(".sort-btn").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".sort-btn")
      .forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeSort = btn.dataset.sort;
  };
});

document.getElementById("minPrice").oninput = e=>{
  minSelected = +e.target.value;
  document.getElementById("minPriceLabel").textContent = `$${minSelected}`;
};

document.getElementById("maxPrice").oninput = e=>{
  maxSelected = +e.target.value;
  document.getElementById("maxPriceLabel").textContent = `$${maxSelected}`;
};

document.getElementById("applyFilters").onclick = ()=>{
  modal.style.display = "none";
  renderProducts(true);
};
document.getElementById("clearFilters").onclick = () => {

  activeSort = "az";

  document.querySelectorAll(".sort-btn")
    .forEach(b => b.classList.remove("active"));

  document.querySelector(`[data-sort="az"]`)
    .classList.add("active");

  // reset price
  const prices = data.products.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  minSelected = min;
  maxSelected = max;

  const minRange = document.getElementById("minPrice");
  const maxRange = document.getElementById("maxPrice");

  minRange.value = min;
  maxRange.value = max;

  document.getElementById("minPriceLabel").textContent = `$${min}`;
  document.getElementById("maxPriceLabel").textContent = `$${max}`;

  renderProducts(true);
};
window.addEventListener("DOMContentLoaded", () => {
qcZoomIn.innerHTML = `
<svg viewBox="0 0 24 24">
  <circle cx="11" cy="11" r="7"/>
  <line x1="11" y1="8" x2="11" y2="14"/>
  <line x1="8" y1="11" x2="14" y2="11"/>
  <line x1="16.5" y1="16.5" x2="21" y2="21"/>
</svg>`;

qcZoomOut.innerHTML = `
<svg viewBox="0 0 24 24">
  <circle cx="11" cy="11" r="7"/>
  <line x1="8" y1="11" x2="14" y2="11"/>
  <line x1="16.5" y1="16.5" x2="21" y2="21"/>
</svg>`;

qcRotate.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw-square-icon lucide-rotate-ccw-square"><path d="M20 9V7a2 2 0 0 0-2-2h-6"/><path d="m15 2-3 3 3 3"/><path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/></svg>
`;

qcReset.innerHTML = `
<svg viewBox="0 0 24 24">
  <polyline points="1 4 1 10 7 10"/>
  <path d="M3.5 15a9 9 0 1 0 3-9l-5 4"/>
</svg>`;

qcSave.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-down-icon lucide-image-down"><path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/><path d="m14 19 3 3v-5.5"/><path d="m17 22 3-3"/><circle cx="9" cy="9" r="2"/></svg>`;

qcCloseBtn.innerHTML = `
<svg viewBox="0 0 24 24">
  <line x1="6" y1="6" x2="18" y2="18"/>
  <line x1="18" y1="6" x2="6" y2="18"/>
</svg>`;
});
fetch("/products.json")
  .then(res => res.json())
  .then(json => {

    data = json; // ✅ assign FIRST

    const prices = data.products.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    minSelected = min;
    maxSelected = max;

    const minRange = document.getElementById("minPrice");
    const maxRange = document.getElementById("maxPrice");

    minRange.min = maxRange.min = min;
    minRange.max = maxRange.max = max;

    minRange.value = min;
    maxRange.value = max;

    document.getElementById("minPriceLabel").textContent = `$${min}`;
    document.getElementById("maxPriceLabel").textContent = `$${max}`;

    createTabs();
    updateSearchPlaceholder();
    renderProducts(true);
    updateCartButton();
    updateOtherTotals();
  });

function sortABC(arr) {
  arr.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}
const minRange = document.getElementById("minPrice");
const maxRange = document.getElementById("maxPrice");

minRange.addEventListener("input", () => {
  if (+minRange.value >= +maxRange.value) {
    minRange.value = +maxRange.value - 1;
  }
  minSelected = +minRange.value;
  document.getElementById("minPriceLabel").textContent = `$${minSelected}`;
});

maxRange.addEventListener("input", () => {
  if (+maxRange.value <= +minRange.value) {
    maxRange.value = +minRange.value + 1;
  }
  maxSelected = +maxRange.value;
  document.getElementById("maxPriceLabel").textContent = `$${maxSelected}`;
});
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
// ------------------ EVENT LISTENERS ------------------

function kakobuyLink(raw) {
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(raw)}&affcode=deepinmycloset`;
}
const tabs = document.querySelector(".tabs");

let isDown = false;
let scrollLeft;

tabs.addEventListener("mousedown", (e) => {
  isDown = true;
  isDragging = false;

  tabs.classList.add("dragging");

  startX = e.pageX - tabs.offsetLeft;
  scrollLeft = tabs.scrollLeft;
});

document.addEventListener("mouseup", () => {
  isDown = false;
  tabs.classList.remove("dragging");
});

tabs.addEventListener("mousemove", (e) => {
  if (!isDown) return;

  const x = e.pageX - tabs.offsetLeft;
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


// ------------------ PRODUCT RENDERING ------------------
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
);// SORTING
if (activeSort === "az") {
  filteredProducts.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}
else if (activeSort === "new") {
  filteredProducts = [...filteredProducts].reverse();
}
else if (activeSort === "old") {
}
else if (activeSort === "low") {
  filteredProducts.sort((a, b) => a.price - b.price);
}
else if (activeSort === "high") {
  filteredProducts.sort((a, b) => b.price - a.price);
}
// "old" = default natural order (top → bottom)

  const loader = document.getElementById("infiniteLoader");

const isSearching = searchInput.value.trim().length > 0;

// 🔥 CATEGORY TABS OR SEARCH: render everything instantly
if (currentCategory !== "ALL" || isSearching) {
  loader.classList.add("hidden");
  filteredProducts.forEach(renderCard);
  visibleCount = filteredProducts.length;
  return;
}

  // 🔥 ALL TAB: infinite scroll logic
chunkSize = 40;
  loadMoreProducts();
}



function loadMoreProducts() {
  if (isLoading || currentCategory !== "ALL") return;

  const loader = document.getElementById("infiniteLoader");
  loader.classList.remove("hidden");
  isLoading = true;

  setTimeout(() => {
    const nextBatch = filteredProducts.slice(
      visibleCount,
      visibleCount + chunkSize
    );

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
    p.name.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-')
  }.png`;

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${imageSrc}" loading="lazy">

      <div class="price">$${p.price.toFixed(2)}</div>

      <div class="card-gradient"></div>

      <div class="card-content">
        <div class="title">${p.name}</div>
        <div class="category">${p.category}</div>
      </div>
    </div>
  `;

  card.addEventListener("click", (e) => {
    openProductModal(p);
  });

  grid.appendChild(card);
}

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
  document.querySelectorAll(".qc-thumb").forEach((t,i)=>{
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

const productModal = document.getElementById("productModal");
const productClose = document.getElementById("productClose");

const btn = document.getElementById("openFilters");
let filterText = "Filters";

function updateFilterBtn() {
  if (window.innerWidth <= 768) {
    // remove text if mobile
    btn.childNodes.forEach(n => {
      if (n.nodeType === 3) n.remove();
    });
  } else {
    // restore text if desktop
    if (!btn.textContent.includes(filterText)) {
      btn.append(" " + filterText);
    }
  }
}

updateFilterBtn();
window.addEventListener("resize", updateFilterBtn);


function openProductModal(p) {

  document.getElementById("productTitle").textContent = p.name;
  document.getElementById("productPrice").textContent = `$${p.price.toFixed(2)}`;
  document.getElementById("productCategory").textContent = p.category;
  document.getElementById("productSales").textContent = `Sales : ${p.sales}`;

  const mainImage = p.image || `/products/${
    p.name.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-')
  }.png`;

  document.getElementById("productMainImage").src = mainImage;

  // SELLER
  document.getElementById("sellerName").textContent = p.seller;
  document.getElementById("sellerName").href = p.sellerlink;

  const logo = document.getElementById("sellerLogo");

  if (p.link.includes("weidian")) {
    logo.src = "https://nhbpica.kakobuy.com/etc/platform/micro.png";
  } else if (p.link.includes("taobao")) {
    logo.src = "https://nhbpica.kakobuy.com/etc/platform/taobao.png";
  } else if (p.link.includes("1688")) {
    logo.src = "https://nhbpica.kakobuy.com/etc/platform/1688.png";
  }

  // GOTO PRODUCT
  document.getElementById("gotoProduct").href = kakobuyLink(p.link);
const galleryQcBtn = document.querySelector(".gallery-qc-btn");

galleryQcBtn.onclick = async () => {

  const folderSlug = p.qc || p.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  currentQcFolder = folderSlug;

  try {
    const res = await fetch(`/qc/${currentQcFolder}/index.json`);
    if (!res.ok) throw new Error("missing");

    qcImages = (await res.json()).images;
    qcImages.sort((a,b)=>parseInt(a)-parseInt(b));

    if (!qcImages.length) throw new Error("missing");

    qcIndex = 0;

    productModal.style.display = "none"; 

    qcModal.style.display = "flex";
    renderThumbnails();
    openQcImage(0);

  } catch (err) {
    console.error(err);
    showNotification('Error.', 'No available Quality Check', 4000, '#e53535');
  }
};
const copyBtn = document.getElementById("copyRawBtn");

const cartIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="9" cy="21" r="1"/>
  <circle cx="20" cy="21" r="1"/>
  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
</svg>
`;

const checkIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
stroke-linecap="round" stroke-linejoin="round">
<path d="M20 6 9 17l-5-5"/>
</svg>
`;

function updateCopyButton() {

  const inCart = cart.some(item => item.name === p.name);

  if (inCart) {
    copyBtn.innerHTML = checkIcon;
    copyBtn.disabled = true;
    copyBtn.style.pointerEvents = "none";
  } else {
    copyBtn.innerHTML = cartIcon;
    copyBtn.disabled = false;
    copyBtn.style.pointerEvents = "auto";
  }

}

updateCopyButton();

copyBtn.onclick = () => {

  if (cart.some(item => item.name === p.name)) return;

  addToCart(p);

  updateCopyButton(); // 🔥 lock button after adding
};


  // SIZES
  const sizeContainer = document.getElementById("sizeContainer");
  sizeContainer.innerHTML = "";
  p.size?.forEach(size => {
    const div = document.createElement("div");
    div.textContent = size;
    sizeContainer.appendChild(div);
  });

  // COLORS
const colorContainer = document.getElementById("colorContainer");
colorContainer.innerHTML = ""; // clear previous

if (p.color && p.color.length) {
  colorSection.classList.remove("hidden");

  p.color.forEach(c => {
    if (c.startsWith("http")) {
      // image color
      const wrapper = document.createElement("div");
      wrapper.className = "color-img-wrapper";
      const imgSrc = proxyBase + encodeURIComponent(c);
      loadImageWithSkeleton(wrapper, imgSrc);
      colorContainer.appendChild(wrapper);
    } else {
      // text color
      const div = document.createElement("div");
      div.textContent = c;

      // Apply pill-like styling
      Object.assign(div.style, {
        cursor: "pointer",
        padding: "9px 16px",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        transition: "0.25s"
      });

      colorContainer.appendChild(div);
    }
  });

} else {
  colorSection.classList.add("hidden");
}

function loadImageWithSkeleton(container, imageUrl) {

  container.innerHTML = "";

  const skeleton = document.createElement("div");
  skeleton.className = "img-skeleton";
  container.appendChild(skeleton);

  const img = new Image();
  img.style.opacity = "0";
  img.style.transition = "opacity 0.3s ease";

  img.src = imageUrl;

  img.onload = () => {
    container.innerHTML = "";
    container.appendChild(img);

    requestAnimationFrame(() => {
      img.style.opacity = "1";
    });
  };
}

/* ================= OPEN CUSTOM QC FROM ARRAY ================= */
function openCustomQc(imagesArray, startIndex = 0) {

  if (!imagesArray || !imagesArray.length) return;

  isSingleImageMode = true; // 🔥 enable single image mode
  qcThumbs.innerHTML = "";  // 🔥 remove thumbnails
  qcThumbs.style.display = "none";

  qcImages = imagesArray;
  qcIndex = startIndex;

  qcModal.style.display = "flex";

  openExternalQcImage(imagesArray, startIndex);
}

/* load external image with skeleton */
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

    // 🔥 make image smaller for gallery mode
    if (isSingleImageMode) {
      qcImage.style.maxWidth = "60%";
      qcImage.style.maxHeight = "60vh";
    } else {
      qcImage.style.maxWidth = "";
      qcImage.style.maxHeight = "";
    }
  };
}
 // GALLERY
const gallery = document.getElementById("productGallery");
gallery.innerHTML = "";

if (p.gallery && p.gallery.length) {

  p.gallery.forEach((imgSrc) => {

    const wrapper = document.createElement("div");
    wrapper.className = "gallery-img-wrapper";

    imgSrc = proxyBase + encodeURIComponent(imgSrc);

    loadImageWithSkeleton(wrapper, imgSrc);

    gallery.appendChild(wrapper);
  });
}

  productModal.style.display = "flex";
}

productClose.onclick = () => productModal.style.display = "none";
productModal.onclick = e => {
  if (e.target === productModal) productModal.style.display = "none";
};

/* ================= QC TRANSFORM SYSTEM ================= */

let isDragging = false;
let startX = 0;
let startY = 0;

/* Remove lag while dragging */
function applyTransform() {
  qcFrame.style.transform =
    `translate(${offsetX}px, ${offsetY}px)
     scale(${currentZoom})
     rotate(${currentRotation}deg)`;
}

/* ---------- POINTER EVENTS (DESKTOP + MOBILE) ---------- */

qcFrame.addEventListener("pointerdown", (e) => {
  if (currentZoom <= 1) return; // 🔥 only drag when zoomed

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

/* ---------- ZOOM ---------- */

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

/* ---------- ROTATE ---------- */

qcRotate.onclick = (e) => {
  e.stopPropagation();
  currentRotation += 90;
  applyTransform();
};

/* ---------- RESET ---------- */

function resetTransform() {
  currentZoom = 1;
  currentRotation = 0;
  offsetX = 0;
  offsetY = 0;
  applyTransform();
}

qcReset.onclick = (e) => {
  e.stopPropagation();
  resetTransform();
};

/* ---------- CLOSE ---------- */

function closeQc() {
  isSingleImageMode = false;
qcThumbs.style.display = "flex";
qcImage.style.maxWidth = "";
qcImage.style.maxHeight = "";
  qcModal.style.display = "none";
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

  if (e.key === "Escape") closeQc();
  if (e.key === "ArrowRight") qcNext.click();
  if (e.key === "ArrowLeft") qcPrev.click();
});

/* ---------- SAVE ---------- */

qcSave.onclick = (e) => {
  e.stopPropagation();

  const link = document.createElement("a");
  link.href = qcImage.src;
  link.download = "qc-@deepinmycloset.jpg";
  link.click();
};




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

// ------------------ SCROLL INFINITE ------------------
window.addEventListener("scroll", () => {
  if (currentCategory !== "ALL") return;

  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
    visibleCount < filteredProducts.length
  ) {
    loadMoreProducts();
  }
});



// ------------------ NOTIFICATIONS ------------------
function showNotification(title, description, duration = 3000, color = "#fff") {
  const container = document.getElementById("notification-container");
  const notif = document.createElement("div");
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
  setTimeout(() => { notif.classList.remove("show"); setTimeout(() => notif.remove(), 300); }, duration);
}



