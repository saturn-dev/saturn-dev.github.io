  fetch("/products.json")
  .then(res => res.json())
  .then(data => initProducts(data.products));


function initProducts(products) {
  const leftCol = document.querySelector(".column.left");
  const midCol = document.querySelector(".column.middle");
  const rightCol = document.querySelector(".column.right");

  // Shuffle products
  const shuffled = [...products].sort(() => Math.random() - 0.5);

  // Split into rows of 3 (NO duplicates per row)
  const rows = [];
  for (let i = 0; i < shuffled.length; i += 3) {
    const row = shuffled.slice(i, i + 3);
    if (row.length === 3) rows.push(row);
  }

  // Fill columns
  rows.forEach(row => {
    leftCol.appendChild(createCard(row[0]));
    midCol.appendChild(createCard(row[1]));
    rightCol.appendChild(createCard(row[2]));
  });

  // Duplicate content for infinite scroll illusion
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