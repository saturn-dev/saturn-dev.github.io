fetch("/products.json")
  .then(res => res.json())
  .then(data => initProducts(data.products));

function initProducts(products) {
  // This showcase is hidden on screens <=1170px (the horizontal one takes
  // over there), so it only ever renders on desktop — but still cap the
  // count to keep the per-card blurred background images cheap.
  const isSmall = window.innerWidth <= 1170;
  if (isSmall) return;

  const leftCol = document.querySelector(".column.left");
  const midCol = document.querySelector(".column.middle");
  const rightCol = document.querySelector(".column.right");

  const count = window.innerWidth <= 1600 ? 24 : 40;
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  const randomSet = shuffled.slice(0, count);

  const rows = [];
  for (let i = 0; i < randomSet.length; i += 3) {
    const row = randomSet.slice(i, i + 3);
    if (row.length === 3) rows.push(row);
  }

  rows.forEach(row => {
    leftCol.appendChild(createCard(row[0]));
    midCol.appendChild(createCard(row[1]));
    rightCol.appendChild(createCard(row[2]));
  });

  leftCol.innerHTML += leftCol.innerHTML;
  midCol.innerHTML += midCol.innerHTML;
  rightCol.innerHTML += rightCol.innerHTML;

  pauseOffscreen(".product-showcase", [leftCol, midCol, rightCol]);
}

function pauseOffscreen(containerSelector, columns) {
  const container = document.querySelector(containerSelector);
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

function kakobuyLink(raw) {
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(raw)}&affcode=deepinmycloset`;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function createCard(product) {
  if (!product) return document.createElement("div");

  const slug = slugify(product.name || "product");
  const imgPath = `/products/${slug}.png`;

  const card = document.createElement("a");
  card.className = "product-card";
  card.href = kakobuyLink(product.link);
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  card.innerHTML = `
    <div class="product-card-img-wrap">
      <img class="product-card-img-bg" src="${imgPath}" alt="" aria-hidden="true" loading="lazy" decoding="async">
      <img class="product-card-img-main" src="${imgPath}" alt="${product.name || 'Product'}" loading="lazy" decoding="async">
    </div>
    <div class="product-name">${product.name || "Unnamed Product"}</div>
    <div class="product-price">${product.price ? `$${product.price}` : "Price N/A"}</div>
  `;

  return card;
}
