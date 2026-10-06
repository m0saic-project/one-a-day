// usage: node probe.cjs <variant> '<json array of prop overrides>' [canvases json]
const path = require("path");
const v = process.argv[2];
const m = require(path.join(__dirname, v, "wrr.js"));
const sets = JSON.parse(process.argv[3] || "[{}]");
const canv = JSON.parse(process.argv[4] || "[[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270]]");
for (const over of sets) for (const [w, h] of canv) {
  try {
    const { L } = m.settleLayout(over, w, h);
    const rows = [...new Set(L.badges.map((b) => b.rect.y))].map((y) => L.badges.filter((b) => b.rect.y === y).length);
    console.log(`${v} ${w}x${h} ${L.shape} name=${L.namePx}x${L.nameLines.length} hero=${L.heroPx} stat=${L.statPx} ratio=${(L.heroPx / L.statPx).toFixed(2)} label=${L.labelPx}${L.twoLineLabels ? "(2)" : ""} badge=${L.badgePx}/${L.captionPx} floor=${L.floor}/${L.small} rows=${JSON.stringify(rows)} badgeRect=${L.badges[0] ? L.badges[0].rect.w + "x" + L.badges[0].rect.h : "-"} heroInk=${L.p.heroInk} stat0=${JSON.stringify(L.statRects[0])} band=${JSON.stringify(L.band)}`);
  } catch (e) { console.log(`${v} ${w}x${h} ERR ${e.message}`); }
}
