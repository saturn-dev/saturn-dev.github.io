fetch("/scrolling.json")
  .then(res => res.json())
  .then(data => initProductsHorizontal(data.products));

function kakobuyLink(raw) {
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(raw)}&affcode=deepinmycloset`;
}

function initProductsHorizontal(products) {
  const leftCol  = document.querySelector(".h-column.left");
  const midCol   = document.querySelector(".h-column.middle");
  const rightCol = document.querySelector(".h-column.right");
  if (!leftCol || !midCol || !rightCol) return;

  // This is the showcase mobile actually sees, so keep the rendered set
  // small there to limit concurrent image decodes / animated elements.
  const count = window.innerWidth <= 700 ? 18 : window.innerWidth <= 1170 ? 30 : 48;
  const shuffled = [...products].sort(() => Math.random() - 0.5).slice(0, count);

  const rows = [];
  for (let i = 0; i < shuffled.length; i += 3) {
    const row = shuffled.slice(i, i + 3);
    if (row.length === 3) rows.push(row);
  }

  rows.forEach(row => {
    leftCol.appendChild(createCardHorizontal(row[0]));
    midCol.appendChild(createCardHorizontal(row[1]));
    rightCol.appendChild(createCardHorizontal(row[2]));
  });

  // Duplicate content for infinite horizontal scroll
  leftCol.innerHTML += leftCol.innerHTML;
  midCol.innerHTML += midCol.innerHTML;
  rightCol.innerHTML += rightCol.innerHTML;

  pauseOffscreenHorizontal([leftCol, midCol, rightCol]);
}

function createCardHorizontal(product) {
  if (!product) return document.createElement("div");

  const card = document.createElement("a");
  card.className = "product-card-horizontal";
  card.href = kakobuyLink(product.link);
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const img = product.image || "";

  card.innerHTML = `
    <div class="product-card-img-wrap-h">
      <img class="product-card-img-bg" src="${img}" alt="" aria-hidden="true" loading="lazy" decoding="async">
      <img class="product-card-img-main" src="${img}" alt="${product.name || 'Product'}" loading="lazy" decoding="async">
    </div>
    <div class="product-name-horizontal">${product.name || "Unnamed Product"}</div>
    <div class="product-price-horizontal">${product.price ? `$${product.price}` : "Price N/A"}</div>
  `;

  return card;
}

function pauseOffscreenHorizontal(columns) {
  const container = document.querySelector(".product-showcase-horizontal");
  if (!container || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        columns.forEach(col => {
          col.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
        });
      });
    },
    { threshold: 0 }
  );
  observer.observe(container);
}
