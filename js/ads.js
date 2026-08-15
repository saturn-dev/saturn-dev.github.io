// ============================================================
//  ADS  —  pinned sponsored cards at the top of /spreadsheet
//
//  To remove ads completely:
//    1. delete this file (js/ads.js)
//    2. delete /ad.json
//    3. delete the <script src="/js/ads.js"> tag in spreadsheet/index.html
//  Nothing in script.js needs to change — the hook is optional-chained.
//  To disable without deleting: set AD_ENABLED = false.
// ============================================================

const AD_ENABLED = true;
const AD_FEED    = "/ad.json";

let adItems   = [];
let adHookRan = false;

function adImageSrc(src) {
  if (!src) return src;
  return /^https?:\/\//i.test(src) ? proxyBase + encodeURIComponent(src) : src;
}

window.renderPinnedCards = function () {
  if (!AD_ENABLED) return;
  adHookRan = true;

  adItems.forEach(ad => {
    renderCard(
      // no category -> the card renders without the category line
      { ...ad, category: "", image: adImageSrc(ad.image) },
      {
        // must keep "card": all tilt / glare / hover / cursor CSS is scoped to it
        className: "card ad-card",
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
      // feed may land after the first render — repaint once it does
      if (adHookRan && adItems.length && typeof data !== "undefined" && data) {
        renderProducts(true);
      }
    })
    .catch(() => { adItems = []; });
}
