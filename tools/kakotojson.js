(function () {

if (document.getElementById("kb-json-gui")) return;

const gui = document.createElement("div");
gui.id = "kb-json-gui";

Object.assign(gui.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "340px",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #6ddc8c",
    borderRadius: "14px",
    padding: "12px",
    zIndex: "2147483647",
    fontFamily: "monospace",
    boxShadow: "0 0 30px rgba(109,220,140,0.8)",
    backdropFilter: "blur(10px)",
    color: "#6ddc8c"
});

gui.innerHTML = `
<div style="font-weight:bold;margin-bottom:6px;">Kakobuy JSON</div>

<textarea id="kb-output" style="
width:100%;
height:200px;
background:#0f1712;
color:#6ddc8c;
border:none;
border-radius:8px;
padding:8px;
resize:none;
"></textarea>

<button id="kb-copy" style="
margin-top:6px;
width:100%;
background:#6ddc8c;
border:none;
padding:6px;
color:black;
border-radius:8px;
cursor:pointer;
font-weight:bold;
">Copy JSON</button>
`;

document.body.appendChild(gui);

document.getElementById("kb-copy").onclick = () => {
    navigator.clipboard.writeText(
        document.getElementById("kb-output").value
    );
};

function getGalleryImages(){

    let imgs = [];

    imgs.push(...document.querySelectorAll('.item-imgs-box img'));
    imgs.push(...document.querySelectorAll('.swiper-slide img'));

    imgs.push(...document.querySelectorAll('.tb-thumb img'));
    imgs.push(...document.querySelectorAll('.J_TThumb img'));
    imgs.push(...document.querySelectorAll('.tb-gallery img'));

    const zoom = document.querySelector('#J_ImgBooth');
    if(zoom) imgs.push(zoom);

    const clean = [...new Set(
        imgs
        .map(img => img.src)
        .filter(Boolean)
        .map(src =>
            src
            .replace('_50x50.jpg','')
            .replace('_60x60.jpg','')
            .replace('_90x90.jpg','')
            .replace('_100x100.jpg','')
            .replace('_400x400.jpg','')
            .replace('_430x430.jpg','')
            .split("?")[0]
        )
    )];

    return clean;

}

function formatJSON(data){

    const indent = "  ";
    const keys = Object.keys(data);

    let lines = ["{"];

    keys.forEach((key,index)=>{

        let value = data[key];
        let line;

        if(Array.isArray(value)){

            const arr = value
                .map(v => JSON.stringify(v))
                .join(", ");

            line = `${indent}"${key}": [${arr}]`;

        } else if(typeof value === "string"){

            line = `${indent}"${key}": ${JSON.stringify(value)}`;

        } else {

            line = `${indent}"${key}": ${value}`;

        }

        if(index !== keys.length - 1) line += ",";

        lines.push(line);

    });

    lines.push("}");

    return lines.join("\n");

}

function updateJSON(){

    const name =
        document.querySelector('.item-title')
        ?.innerText.trim() || "";

    const priceMatch =
        document.querySelector('.sku-price')
        ?.innerText.match(/≈\s*\$\s*([\d.]+)/);

    const price =
        priceMatch ? parseFloat(priceMatch[1]) : 0;

    const sellerEl =
        document.querySelector('.seller-title');

    const seller =
        sellerEl?.innerText.trim() || "";

    const sellerlink =
        sellerEl?.href || "";

    const salesMatch =
        document.querySelector('.sales span')
        ?.innerText.match(/\d+/);

    const sales =
        salesMatch ? salesMatch[0] : "0";

    const link =
        document.querySelector('.seller-url')
        ?.href || "";

    let sizes = [];
    let colors = [];

    const rows =
        document.querySelectorAll('[data-v-d02175c2] .item-props .row');

    rows.forEach((row,index)=>{

        const items = row.querySelectorAll('.spec');

        const values = [...items].map(item=>{

            const img = item.querySelector('img');
            const span = item.querySelector('span');

            if(img) return img.src.split("?")[0];

            if(span && span.innerText.trim())
                return span.innerText.trim();

            if(item.getAttribute("title"))
                return item.getAttribute("title").trim();

            return null;

        }).filter(Boolean);

        if(values.length === 0) return;

        if(index === 0) sizes = values;
        if(index === 1) colors = values;

    });

    const gallery = getGalleryImages();

    const json = {
        name,
        price,
        category: "MISSING",
        seller,
        sellerlink,
        size: sizes,
        sales,
        link
    };

    if(colors.length > 0)
        json.color = colors;

    if(gallery.length > 0)
        json.gallery = gallery;

    document.getElementById("kb-output").value =
        formatJSON(json);

}

setInterval(updateJSON,1500);

})();
