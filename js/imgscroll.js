fetch("/products.json")
  .then(res => res.json())
  .then(data => initProducts(data.products));

function initProducts(products) {
  const leftCol = document.querySelector(".column.left");
  const midCol = document.querySelector(".column.middle");
  const rightCol = document.querySelector(".column.right");

  const shuffled = [...products].sort(() => Math.random() - 0.5);

  const random50 = shuffled.slice(0, 40);

  const rows = [];
  for (let i = 0; i < random50.length; i += 3) {
    const row = random50.slice(i, i + 3);
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
}

function kakobuyLink(raw) {
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(raw)}&affcode=deepinmycloset`;
}

function createCard(product) {
  if (!product) return document.createElement("div");

  const card = document.createElement("a"); 
  card.className = "product-card";
  card.href = kakobuyLink(product.link);
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  card.innerHTML = `
    <img src="${product.image}" alt="${product.name || 'Product'}">
    <div class="product-name">${product.name || "Unnamed Product"}</div>
    <div class="product-price">${product.price ? `$${product.price}` : "Price N/A"}</div>
  `;

  return card;
}
