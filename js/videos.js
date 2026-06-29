var videoGrid          = document.getElementById("videoGrid");
var videoModal         = document.getElementById("videoModal");
var videoModalPlayer   = document.getElementById("videoModalPlayer");
var videoModalProducts = document.getElementById("videoModalProducts");
var videoModalClose    = document.getElementById("videoModalClose");

var videosData    = [];
var productsData  = [];
var activePreview = null;

function kakobuyLink(raw) {
  return "https://www.kakobuy.com/item/details?url=" + encodeURIComponent(raw) + "&affcode=deepinmycloset";
}

Promise.all([
  fetch("/videos.json").then(function(r) { return r.json(); }),
  fetch("/products.json").then(function(r) { return r.json(); })
]).then(function(res) {
  videosData   = res[0].videos   || [];
  productsData = res[1].products || [];
  renderVideoGrid();
}).catch(function(err) {
  console.error("[Videos]", err);
  videoGrid.innerHTML = '<p style="color:var(--muted);padding:48px;text-align:center;grid-column:1/-1">Could not load videos.</p>';
});

function renderVideoGrid() {
  videoGrid.innerHTML = "";
  if (!videosData.length) {
    videoGrid.innerHTML = '<p style="color:var(--muted);padding:48px;text-align:center;grid-column:1/-1">No videos yet.</p>';
    return;
  }
  videosData.forEach(function(v) { videoGrid.appendChild(buildVideoCard(v)); });
}

function buildVideoCard(v) {
  var linked = resolveProducts(v.products);
  var card   = document.createElement("div");
  card.className = "video-card";

  var badge = linked.length
    ? '<div class="video-card-badge">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        linked.length + " product" + (linked.length > 1 ? "s" : "") +
      '</div>'
    : "";

  card.innerHTML =
    '<img class="video-card-thumb" src="' + (v.thumbnail || "") + '" alt="" loading="lazy">' +
    '<video class="video-card-preview" src="' + v.video + '" muted playsinline loop preload="none"></video>' +
    '<div class="video-card-gradient"></div>' +
    '<div class="video-card-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>' +
    badge;

  var preview = card.querySelector(".video-card-preview");
  card.addEventListener("mouseenter", function() { preview.play().catch(function(){}); activePreview = preview; });
  card.addEventListener("mouseleave", function() { preview.pause(); preview.currentTime = 0; activePreview = null; });
  card.addEventListener("click", function() { openVideoModal(v); });
  return card;
}

function openVideoModal(v) {
  if (activePreview) { activePreview.pause(); activePreview.currentTime = 0; }
  videoModalPlayer.src = v.video;
  videoModalPlayer.load();
  videoModalPlayer.play().catch(function(){});
  renderVideoProducts(v.products);
  videoModal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeVideoModal() {
  videoModalPlayer.pause();
  videoModalPlayer.src = "";
  videoModal.classList.remove("open");
  document.body.style.overflow = "";
}

videoModalClose.onclick = closeVideoModal;
videoModal.addEventListener("click", function(e) { if (e.target === videoModal) closeVideoModal(); });
document.addEventListener("keydown", function(e) { if (videoModal.classList.contains("open") && e.key === "Escape") closeVideoModal(); });

function resolveProducts(names) {
  if (!names || !names.length) return [];
  return names.map(function(name) {
    return productsData.find(function(p) {
      return p.name.toLowerCase().trim() === name.toLowerCase().trim();
    });
  }).filter(Boolean);
}

function renderVideoProducts(names) {
  videoModalProducts.innerHTML = "";
  var matched = resolveProducts(names);

  if (!matched.length) {
    videoModalProducts.innerHTML = '<div class="video-no-products">No linked products</div>';
    return;
  }

  matched.forEach(function(p) {
    var img = p.image || ("/products/" + p.name.toLowerCase().replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-") + ".png");
    var card = document.createElement("div");
    card.className = "video-product-card";
    card.innerHTML =
      '<img src="' + img + '" alt="' + p.name + '" loading="lazy">' +
      '<div class="video-product-info">' +
        '<div class="video-product-name">' + p.name + '</div>' +
        '<div class="video-product-meta">' +
          '<span class="video-product-price">$' + p.price.toFixed(2) + '</span>' +
          '<span class="video-product-category">' + p.category + '</span>' +
        '</div>' +
      '</div>';
    card.addEventListener("click", function() { window.open(kakobuyLink(p.link), "_blank"); });
    videoModalProducts.appendChild(card);
  });
}
