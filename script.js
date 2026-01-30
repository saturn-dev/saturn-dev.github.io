let data;
let currentCategory = "ALL";
let visibleCount = 0;
let chunkSize = 0;
let filteredProducts = [];
let isLoading = false;

let cart = JSON.parse(localStorage.getItem("cart")) || [];
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

const tabsEl = document.getElementById("tabs");
const grid = document.getElementById("productGrid");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const qcModal = document.getElementById("qcModal");
const qcImage = document.getElementById("qcImage");
const qcClose = document.getElementById("qcClose");

fetch("/products.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    sortABC(data.products);
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
sortSelect.addEventListener("change", () => renderProducts(true));
searchInput.addEventListener("input", () => renderProducts(true));
// ------------------ PRODUCT RENDERING ------------------
function renderProducts(reset = true) {
  if (reset) {
    grid.innerHTML = "";
    visibleCount = 0;
  }

  filteredProducts = data.products.filter(p =>
    (currentCategory === "ALL" || p.category === currentCategory) &&
    p.name.toLowerCase().includes(searchInput.value.toLowerCase())
  );

  if (sortSelect.value === "low") filteredProducts.sort((a, b) => a.price - b.price);
  else if (sortSelect.value === "high") filteredProducts.sort((a, b) => b.price - a.price);

  const loader = document.getElementById("infiniteLoader");

  // 🔥 CATEGORY TABS: render everything instantly
  if (currentCategory !== "ALL") {
    loader.classList.add("hidden");
    filteredProducts.forEach(renderCard);
    visibleCount = filteredProducts.length;
    return;
  }

  // 🔥 ALL TAB: infinite scroll logic
  chunkSize = Math.max(1, Math.ceil(filteredProducts.length * 0.25));
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
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <a><button class="qc-button" title="Quality Check">
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
        <path d="M360-400h400L622-580l-92 120-62-80-108 140Zm-40 160q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Z"/>
      </svg>
    </button></a>
    <img src="/${p.image}" loading="lazy">
    <div class="title">${p.name}</div>
    <div class="price">$${p.price.toFixed(2)}</div>
    <div class="btn-row">
      <a href="${kakobuyLink(p.link)}" target="_blank" class="btn small">
        BUY ON KAKOBUY
      </a>
      <a href="${p.link}" class="btn small secondary raw-link">
        RAW LINK
      </a>
    </div>
    <button class="qc-btn">ADD TO CART</button>
  `;

  const addToCartBtn = card.querySelector(".qc-btn");

  // Disable button if item is already in cart
  if (cart.some(item => item.name === p.name)) {
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "IN CART";
    addToCartBtn.style.color = "#888";
    addToCartBtn.style.border = "1px solid #888";
    addToCartBtn.style.cursor = "not-allowed";
  }

  addToCartBtn.onclick = () => {
    addToCart(p);

    // Immediately disable the button after adding
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "IN CART";
    addToCartBtn.style.color = "#888";
    addToCartBtn.style.border = "1px solid #888";
    addToCartBtn.style.cursor = "not-allowed";
  };

    const qcBtn = card.querySelector(".qc-button");
    qcBtn.onclick = () => {
      if (p.qc) {
     qcImage.src = "/products/qc/" + p.qc.split('/').pop();
        qcModal.style.display = "flex";
      } else {
        showNotification(
          'Error.',
          'No available Quality Check',
          4000,
          '#e53535'
        );
      }
    };
qcClose.onclick = () => qcModal.style.display = "none";
qcModal.onclick = e => e.target === qcModal && (qcModal.style.display = "none");

  card.querySelector(".raw-link").onclick = e => {
    e.preventDefault();
    navigator.clipboard.writeText(p.link);
    showNotification("Copied!", "Raw link copied to clipboard", 3000, "#00ffa0");
  };

  grid.appendChild(card);
}


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




