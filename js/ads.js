// ============================================================
//  SPONSORED CARDS  (/ad.json)
// ============================================================
//
//  Pins the products in /ad.json to the top of the spreadsheet grid.
//  They use the normal card markup/CSS, but clicking one opens its
//  Kakobuy link in a new tab instead of the product modal.
//
//  TO REMOVE ADS COMPLETELY:
//    1. delete <script src="/js/ads.js"></script> from /spreadsheet/index.html
//    2. delete this file and /ad.json
//  Nothing in script.js has to change — its renderPinnedCards() hook
//  is optional and silently does nothing once this file is gone.
//
//  TO SWAP IN A NEW AD LIST: just replace /ad.json (same fields).
//  TO PAUSE ADS WITHOUT DELETING ANYTHING: set AD_ENABLED to false.
// ============================================================

const AD_ENABLED = true;
const AD_FEED    = "/ad.json";

let adItems      = [];
let adHookRan    = false;

// Route ad images through the site's image proxy (external URLs only)
function adImageSrc(src) {
  if (!src) return src;
  return /^https?:\/\//i.test(src) ? proxyBase + encodeURIComponent(src) : src;
}

// Called by renderProducts() in script.js, top of the default view only
window.renderPinnedCards = function () {
  if (!AD_ENABLED) return;

  adHookRan = true;

  adItems.forEach(ad => {
    renderCard(
      { ...ad, image: adImageSrc(ad.image) },
      {
        className: "ad-card",
        onClick: () => window.open(ad.link, "_blank", "noopener"),
      }
    );
  });
};

if (AD_ENABLED) {
  fetch(AD_FEED)
    .then(res => res.json())
    .then(json => {
      adItems = json.products || [];

      // If the grid was already drawn before this feed landed, redraw once
      // so the ads take their place at the top.
      if (adHookRan && adItems.length && typeof data !== "undefined" && data) {
        renderProducts(true);
      }
    })
    .catch(() => {
      adItems = [];
    });
}
