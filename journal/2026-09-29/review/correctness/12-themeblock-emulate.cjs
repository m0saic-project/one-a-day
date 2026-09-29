// Emulates themeBlock's px search (same formulas as crossword-grid-card.ts) for 1 vs 2 sub-columns in the
// 1080x1080 caption strip, to show the ">4 answers -> 2 sub-columns" rule picks the SMALLER size for long answers.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { widthOf, budget } = require(path.join(ROOT, "dist/_shared/text.js"));
const OPEN = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => String.fromCharCode(65 + ((i * 7 + j * 3) % 26))).join("")).join("/");
const blockH = (px, lines) => Math.ceil(px * (1.17 + 1.25 * (lines - 1))) + 2;
const S = 1080, floorPx = Math.max(8, Math.round(S * 0.013));
function sizeFor(themes, w, h, maxPx, subCols) {
  const n = themes.length, perCol = Math.ceil(n / subCols), colGap = Math.round(S * 0.03), colW = (w - (subCols - 1) * colGap) / subCols;
  const lineW = (q) => Math.max(...themes.map((t) => Math.round(q * 0.75) + Math.round(q * 0.5) + Math.max(...themes.map((u) => widthOf(u.id, q))) + Math.round(q * 0.6) + widthOf(t.answer, q, true)));
  const pitchOf = (q) => Math.max(blockH(q, 1), Math.round(q * 1.55));
  const headPx = (q) => Math.max(floorPx, Math.round(q * 0.72));
  let px = Math.floor(maxPx);
  while (px > 6 && (lineW(px) > budget(colW) || blockH(headPx(px), 1) + Math.round(px * 0.35) + perCol * pitchOf(px) > h)) px--;
  return px;
}
for (const [n, k] of [[15, 5], [15, 6], [21, 5], [21, 6], [21, 8]]) {
  const p = T.normalizeCrossword({ grid: OPEN(n), themeEntries: [...T.numberCrosswordGrid(T.parseCrosswordGrid(OPEN(n))).entries.values()].filter((e) => e.dir === "A").slice(0, k).map((e) => e.id).join(" "), circles: "" });
  const L = T.layoutCrosswordCard(p, 1080, 1080);
  const rw = L.panel.x + L.panel.w - (L.panel.x + L.panel.w * 0.58);
  const actual = L.texts.find((t) => t.label === "theme-0").px;
  console.log(`${k} x ${n}-letter answers @1080: template ${actual}px (2 sub-cols; emulated ${sizeFor(p.themes, rw, L.panel.h, S * 0.03, 2)}), 1 column would be ${sizeFor(p.themes, rw, L.panel.h, S * 0.03, 1)}px; floorPx ${floorPx}`);
}
