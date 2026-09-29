// Theme-list px vs the template's own panel floor (floorPx = max(8, round(S*0.013))) at the hint, for realistic theme sets;
// and title px vs the brief's S/20 ladder at the primary canvases for realistic title lengths.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const synth = (cols, rows) => { const out = []; for (let r = 0; r < rows; r++) { let l = ""; for (let c = 0; c < cols; c++) { const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c); l += ((rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0) ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26)); } out.push(l); } return out.join("/"); };
const OPEN = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => String.fromCharCode(65 + ((i * 7 + j * 3) % 26))).join("")).join("/");
const acrossIds = (grid, k) => { const { entries } = T.numberCrosswordGrid(T.parseCrosswordGrid(grid)); return [...entries.values()].filter((e) => e.dir === "A").slice(0, k).map((e) => e.id).join(" "); };
const sets = [
  ["5 x 15-letter (15x15 open)", OPEN(15), acrossIds(OPEN(15), 5)],
  ["6 x 15-letter (15x15 open)", OPEN(15), acrossIds(OPEN(15), 6)],
  ["8 x 21-letter (21x21 open)", OPEN(21), acrossIds(OPEN(21), 8)],
  ["6 x 21-letter (21x21 open)", OPEN(21), acrossIds(OPEN(21), 6)],
  ["4 x 21-letter (21x21 open)", OPEN(21), acrossIds(OPEN(21), 4)],
  ["stress/21x21.props.json", null, null],
];
for (const [name, grid, themes] of sets) {
  const props = grid ? { grid, themeEntries: themes, circles: "" } : require(path.join(ROOT, "journal/2026-09-29/stress/21x21.props.json"));
  const p = T.normalizeCrossword(props);
  const L = T.layoutCrosswordCard(p, 1080, 1080);
  const line = L.texts.find((t) => t.label === "theme-0"), head = L.texts.find((t) => t.label === "theme-heading");
  const by = L.texts.find((t) => t.label === "byline"), meta = L.texts.find((t) => t.label === "meta");
  console.log(`1080x1080 ${name}: answers ${line.px}px (e.g. ${line.text.length} letters), heading ${head.px}px, byline ${by.px}px, meta ${meta.px}px, floorPx ${Math.max(8, Math.round(1080 * 0.013))}`);
}
for (const title of ["Cats and Dogs", "Variety Pack", "Variety Pack Tuesday", "Wanting for Winter at the Lake", "A Title Long Enough To Need Two Lines Ok"]) {
  const row = [[1080, 1080], [1920, 1080], [1080, 1920]].map(([W, H]) => { const t = T.layoutCrosswordCard(T.normalizeCrossword({ title }), W, H).texts.find((x) => x.label === "title"); return `${W}x${H}=${t.px}px${t.px < Math.min(W, H) / 20 ? "(<S/20)" : ""}`; });
  console.log(`title ${JSON.stringify(title)} (${title.length}): ${row.join("  ")}`);
}
