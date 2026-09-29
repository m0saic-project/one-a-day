// Theme-list text size at the canvases, for the brief's stress case (8 answers of 15-21 letters).
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const props = require(path.join(ROOT, "journal/2026-09-29/stress/21x21.props.json"));
const p = T.normalizeCrossword(props);
for (const [W, H] of [[1080, 1080], [1920, 1080], [1080, 1920], [1280, 720], [3840, 2160], [640, 360], [480, 270]]) {
  const L = T.layoutCrosswordCard(p, W, H);
  const lines = L.texts.filter((t) => /^theme-\d+$/.test(t.label));
  const head = L.texts.find((t) => t.label === "theme-heading");
  const other = L.texts.filter((t) => !t.label.startsWith("theme")).map((t) => `${t.label}=${t.px}`).join(" ");
  console.log(`${W}x${H} [${L.mode}] theme lines ${lines[0].px}px (${(lines[0].px / Math.min(W, H) * 1080).toFixed(1)}px per 1080 short side), heading ${head.px}px | ${other}`);
}
