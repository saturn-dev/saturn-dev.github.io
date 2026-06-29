var outfitGrid             = document.getElementById("outfitGrid");
var outfitModal            = document.getElementById("outfitModal");
var outfitModalLeft        = document.getElementById("outfitModalLeft");
var outfitModalImg         = document.getElementById("outfitModalImg");
var outfitModalTitle       = document.getElementById("outfitModalTitle");
var outfitModalItemsCount  = document.getElementById("outfitModalItemsCount");
var outfitModalProducts    = document.getElementById("outfitModalProducts");
var outfitModalClose       = document.getElementById("outfitModalClose");

var outfitsData  = [];
var productsData = [];

function kakobuyLink(raw) {
  return "https://www.kakobuy.com/item/details?url=" + encodeURIComponent(raw) + "&affcode=deepinmycloset";
}

Promise.all([
  fetch("/outfits.json").then(function(r) { return r.json(); }),
  fetch("/products.json").then(function(r) { return r.json(); })
]).then(function(res) {
  outfitsData  = res[0].outfits  || [];
  productsData = res[1].products || [];
  renderOutfitGrid();
}).catch(function(err) {
  console.error("[Outfits]", err);
  outfitGrid.innerHTML = '<p style="color:var(--muted);padding:56px;text-align:center;grid-column:1/-1">Could not load outfits.</p>';
});

function renderOutfitGrid() {
  outfitGrid.innerHTML = "";
  if (!outfitsData.length) {
    outfitGrid.innerHTML = '<p style="color:var(--muted);padding:56px;text-align:center;grid-column:1/-1">No outfits yet.</p>';
    return;
  }
  outfitsData.forEach(function(o, i) {
    var card = buildOutfitCard(o, i);
    outfitGrid.appendChild(card);
    setTimeout(function() { card.classList.add("loaded"); }, i * 55);
  });
}

function buildOutfitCard(o, i) {
  var count = o.products ? o.products.length : 0;
  var card  = document.createElement("div");
  card.className = "outfit-card";
  card.style.animationDelay = (i * 0.055) + "s";

  card.innerHTML =
    '<img class="outfit-card-img" src="' + o.image + '" alt="' + o.title + '" loading="lazy">' +
    '<div class="outfit-card-overlay">' +
      '<div class="outfit-card-overlay-title">' + o.title + '</div>' +
      '<button class="outfit-card-view-btn">View Look &#8594;</button>' +
    '</div>' +
    (count > 0 ? '<div class="outfit-card-badge">' + count + ' Item' + (count !== 1 ? 's' : '') + '</div>' : '');

  card.addEventListener("click", function() { openOutfitModal(o); });
  return card;
}

function openOutfitModal(o) {
  var products = o.products || [];
  var count    = products.length;

  outfitModalTitle.textContent       = o.title;
  outfitModalItemsCount.textContent  = "Included Items (" + count + ")";
  outfitModalImg.src = o.image;

  var oldPins = outfitModalLeft.querySelectorAll(".outfit-pin");
  oldPins.forEach(function(p) { p.remove(); });

  renderOutfitProducts(products);

  outfitModal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeOutfitModal() {
  outfitModal.classList.remove("open");
  document.body.style.overflow = "";
  outfitModalImg.src = "";
}

outfitModalClose.addEventListener("click", closeOutfitModal);
outfitModal.addEventListener("click", function(e) { if (e.target === outfitModal) closeOutfitModal(); });
document.addEventListener("keydown", function(e) { if (outfitModal.classList.contains("open") && e.key === "Escape") closeOutfitModal(); });

function resolveProduct(name) {
  return productsData.find(function(p) {
    return p.name.toLowerCase().trim() === name.toLowerCase().trim();
  });
}

function renderOutfitProducts(items) {
  outfitModalProducts.innerHTML = "";

  if (!items || !items.length) {
    outfitModalProducts.innerHTML = '<div class="outfit-no-products">No items listed</div>';
    return;
  }

  items.forEach(function(item, i) {
    var p   = resolveProduct(item.name);
    var num = i + 1;

    if (item.pin && item.pin.length === 2) {
      var pin = document.createElement("div");
      pin.className = "outfit-pin";
      pin.textContent = num;
      pin.style.left = item.pin[0] + "%";
      pin.style.top  = item.pin[1] + "%";
      pin.style.animationDelay = (i * 0.08 + 0.15) + "s";
      pin.dataset.idx = i;
      outfitModalLeft.appendChild(pin);
    }

    var imgSrc = p
      ? (p.image || "/products/" + p.name.toLowerCase().replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-") + ".png")
      : "";

    var name  = p ? p.name  : item.name;
    var price = p ? "$" + p.price.toFixed(2) : "";
    var link  = p ? p.link  : "";

    var card = document.createElement("div");
    card.className = "outfit-product-card";
    card.dataset.idx = i;
    card.style.opacity = "0";
    card.style.animation = "productIn .35s cubic-bezier(.22,1,.36,1) " + (i * 0.07 + 0.1) + "s both";

    card.innerHTML =
      '<div class="outfit-product-num">' + num + '</div>' +
      '<img src="' + imgSrc + '" alt="' + name + '" loading="lazy">' +
      '<div class="outfit-product-info">' +
        '<div class="outfit-product-name">' + name + '</div>' +
        '<div class="outfit-product-price">' + price + '</div>' +
      '</div>' +
      '<div class="outfit-product-link" title="View on KakoBuy">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
          '<polyline points="15,3 21,3 21,9"/>' +
          '<line x1="10" y1="14" x2="21" y2="3"/>' +
        '</svg>' +
      '</div>';

    var linkBtn = card.querySelector(".outfit-product-link");
    if (link) {
      linkBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        window.open(kakobuyLink(link), "_blank");
      });
    } else {
      linkBtn.style.opacity = ".3";
      linkBtn.style.pointerEvents = "none";
    }

    card.addEventListener("mouseenter", function() { highlightItem(i, true); });
    card.addEventListener("mouseleave", function() { highlightItem(i, false); });

    outfitModalProducts.appendChild(card);
  });
}

function highlightItem(idx, on) {
  var pin  = outfitModalLeft.querySelector(".outfit-pin[data-idx='" + idx + "']");
  var card = outfitModalProducts.querySelector(".outfit-product-card[data-idx='" + idx + "']");
  if (pin)  pin.classList.toggle("active",  on);
  if (card) card.classList.toggle("active", on);
}
