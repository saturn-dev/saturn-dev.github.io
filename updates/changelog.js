const timeline = document.getElementById("timeline");

const releases = [
  {
    title: "v0.4",
    tags: ["NEWEST"],
    date: "2026-1-13",
    changes: [
      "Website release! 🎉",
      "Added a bunch of new products 100+",
      "Accessories tab",
      "MISC tab",
      "QC checker feature"
    ]
  },
  {
    title: "v0.3",
    tags: [],
    date: "2025-12-31",
    changes: [
      "ERD Mussolini Sweater",
      "ERD 'Remember When' Hoodie",
      "ERD 'Benny's Video' Hoodie",
      "Balenciaga Be Kind Hoodie",
      "Raf Simons aw00 'Confusion' Hoodie",
      "Number (N)ine Tribal Zip-up",
      "ERD 'War' Hoodie",
      "ERD Straight Leg Corduroy Pants",
      "ERD Ripped Bootcut Jeans",
      "Balenciaga Triple Waist Sweats",
      "Satoshi Nakamoto Old Skool Vans"
    ]
  },
    {
    title: "v0.2",
    tags: [],
    date: "2025-12-23",
    changes: [
      "ERD Le Rosey Sweater",
      "Raf Simons Virginia Creeper longsleeve",
      "Raf Simons Virginia Creeper Hoodie",
      "Balenciaga Red Skater Zip-up",
      "Hysteric Glamour Medicine Hoodie",
      "Dior 06SS Boy About Home Hoodie",
      "Balenciaga Incognito Zip-up",
      "Balenciaga Tribal Sweatpants",
      "Balenciaga Nail Polish Sweatpants",
      "Project Grailz Triple Waist Sweatpants",
      "Gucci Demna Horsebit Jeans",
      "Rick Owens Spiral Jeans",
      "Balenciaga Arena",
      "ERD Vans",
      "Balenciaga Birkenstock Mule"
    ]
  },
    {
    title: "v0.1",
    tags: ["OLDEST"],
    date: "2025-12-23",
    changes: [
      "Undercover Bug Denim",
      "Undercover 05ss Heart Jeans",
      "Undercover 10ss Blue Yarn Jeans",
      "Undercover 10ss Red Yarn Jeans",
      "Maison Margiela Flared Jeans",
      "Maison Margiela Oil Wash Jeans",
      "Maison Margiela Washed Wide Jeans"
    ]
  }
];

function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now - past) / (1000 * 60 * 60 * 24));

  let relative;
  if (diff < 7) relative = `${diff} days ago`;
  else if (diff < 30) relative = `${Math.floor(diff / 7)} weeks ago`;
  else relative = `${Math.floor(diff / 30)} months ago`;

  const exact = past.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return `
    <div class="relative">${relative}</div>
    <div class="exact">${exact}</div>
  `;
}


function render() {
  timeline.innerHTML = "";

  releases.forEach((r, index) => {
    const entry = document.createElement("div");
    entry.className = "entry";
    entry.style.animationDelay = `${index * 0.1}s`;

    entry.innerHTML = `
      <div class="time">${timeAgo(r.date)}</div>
      <div class="dot"></div>
      <div class="card">
        <div class="tags">
          ${r.tags.map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
        <div class="title">${r.title}</div>
        <ul>
          ${r.changes.map(c => `<li>${c}</li>`).join("")}
        </ul>
      </div>
    `;

    timeline.appendChild(entry);
  });
}

render();

setInterval(render, 1000 * 60 * 60);
