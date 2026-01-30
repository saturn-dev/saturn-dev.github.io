function initProductsHorizontal(products) {
  const leftCol = document.querySelector(".h-column.left");
  const midCol = document.querySelector(".h-column.middle");
  const rightCol = document.querySelector(".h-column.right");

  const shuffled = [...products].sort(() => Math.random() - 0.5);

  // Split into rows of 3
  const rows = [];
  for (let i = 0; i < shuffled.length; i += 3) {
    const row = shuffled.slice(i, i + 3);
    if (row.length === 3) rows.push(row);
  }

  // Fill columns horizontally
  rows.forEach(row => {
    leftCol.appendChild(createCardHorizontal(row[0]));
    midCol.appendChild(createCardHorizontal(row[1]));
    rightCol.appendChild(createCardHorizontal(row[2]));
  });

  // Duplicate content for infinite horizontal scroll
  leftCol.innerHTML += leftCol.innerHTML;
  midCol.innerHTML += midCol.innerHTML;
  rightCol.innerHTML += rightCol.innerHTML;
}

function createCardHorizontal(product) {
  if (!product) return document.createElement("div");

  const card = document.createElement("a"); 
  card.className = "product-card-horizontal";
  card.href = kakobuyLink(product.link);
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  card.innerHTML = `
    <img src="${product.image}" alt="${product.name || 'Product'}">
    <div class="product-name-horizontal">${product.name || "Unnamed Product"}</div>
    <div class="product-price-horizontal">${product.price ? `$${product.price}` : "Price N/A"}</div>
  `;

  return card;
}
