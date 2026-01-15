let data;
let currentCategory = "ALL";

const tabsEl = document.getElementById("tabs");
const grid = document.getElementById("productGrid");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const qcModal = document.getElementById("qcModal");
const qcImage = document.getElementById("qcImage");
const qcClose = document.getElementById("qcClose");

function sortABC(arr) {
  arr.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}


fetch("/products.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    sortABC(data.products);

    createTabs();
    updateSearchPlaceholder();
    renderProducts();
  });



function createTabs() {
  data.categories.forEach(cat => {
    const tab = document.createElement("div");
    tab.className = "tab" + (cat === "ALL" ? " active" : "");
    tab.textContent = cat;
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = cat;
      renderProducts();
    };
    tabsEl.appendChild(tab);
  });
}

function updateSearchPlaceholder() {
  searchInput.placeholder = `Search ${data.products.length} products`;
}

function kakobuyLink(raw) {
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(raw)}&affcode=deepinmycloset`;
}


function renderProducts() {
  grid.innerHTML = "";

  let products = data.products.filter(p =>
    (currentCategory === "ALL" || p.category === currentCategory) &&
    p.name.toLowerCase().includes(searchInput.value.toLowerCase())
  );

  if (sortSelect.value === "low") {
    products.sort((a, b) => a.price - b.price);
  } else if (sortSelect.value === "high") {
    products.sort((a, b) => b.price - a.price);
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
      <img src="/${p.image}" loading="lazy">
      <div class="title">${p.name}</div>
      <div class="price">$${p.price.toFixed(2)}</div>

      <div class="btn-row">
        <a href="${kakobuyLink(p.link)}" target="_blank" class="btn small">BUY ON KAKOBUY</a>
        <a href="${p.link}" target="_blank" class="btn small secondary raw-link">RAW LINK</a>
      </div>

<button class="qc-btn">QUALITY CHECK</button>
    `;

    const qcBtn = card.querySelector(".qc-btn");
    qcBtn.onclick = () => {
      if (p.qc) {
        qcImage.src = p.qc;
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
    const rawBtn = card.querySelector(".raw-link");
    rawBtn.addEventListener("click", e => {
      e.preventDefault(); 
      navigator.clipboard.writeText(p.link).then(() => {
        showNotification(
          "Copied!",
          "Raw link copied to clipboard",
          3000,
          "#00ffa0"
        );
      }).catch(() => {
        showNotification(
          "Error!",
          "Failed to copy link",
          3000,
          "#e53535"
        );
      });
    });

    grid.appendChild(card);
  });
}

  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");
  const openBtn = document.getElementById("menuOpen");
  const closeBtn = document.getElementById("menuClose");

  function openMenu() {
    menu.classList.add("active");
    overlay.classList.add("active");
  }

  function closeMenu() {
    menu.classList.remove("active");
    overlay.classList.remove("active");
  }

  openBtn.onclick = openMenu;
  closeBtn.onclick = closeMenu;
  overlay.onclick = closeMenu;

function showNotification(title, description, duration = 3000, color = '#ffffff') {
    const container = document.getElementById('notification-container');

    const notif = document.createElement('div');
    notif.className = 'notification';

    const fill = document.createElement('div');
    fill.className = 'fill-background';
    fill.style.animation = `shrink ${duration}ms linear forwards`;

    const bar = document.createElement('div');
    bar.className = 'left-bar';
    bar.style.backgroundColor = color;

    const content = document.createElement('div');
    content.className = 'notification-content';
    content.innerHTML = `
      <div class="notification-title">${title}</div>
      <div class="notification-desc">${description}</div>
    `;

    notif.appendChild(fill);
    notif.appendChild(bar);
    notif.appendChild(content);
    container.appendChild(notif);

    void notif.offsetWidth;
    notif.classList.add('show');

    const timeout = setTimeout(() => dismissNotification(notif), duration);

    notif.addEventListener('click', () => {
      clearTimeout(timeout);
      setTimeout(() => dismissNotification(notif), 400);
    });

    function dismissNotification(el) {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }
  }

qcClose.onclick = () => qcModal.style.display = "none";
qcModal.onclick = e => e.target === qcModal && (qcModal.style.display = "none");

sortSelect.addEventListener("change", renderProducts);
searchInput.addEventListener("input", renderProducts);
