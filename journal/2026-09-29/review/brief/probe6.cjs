const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CONTRACT_CANVASES } = require(path.join(root, "dist/_shared/layout.js"));
// open 25x25 grid: every row and column is a 25-letter entry
const g = Array.from({ length: 25 }, (_, r) => Array.from({ length: 25 }, (_, c) => String.fromCharCode(87 - ((r + c) % 3))).join("")).join("/"); // W/V/U, wide glyphs
const { entries } = T.numberCrosswordGrid(T.parseCrosswordGrid(g));
const ids = [...entries.keys()];
console.log("entries", ids.length, ids.slice(0, 8).join(" "));
// 21x21 with 21-letter answers, 3-digit ids? build a grid where the long entries have big numbers
const maxcopy = { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" };
const cases = {
  "25open-8x25": { grid: g, themeEntries: ids.slice(-8).join(" "), circles: "" },
  "25open-8x25+max": { grid: g, themeEntries: ids.slice(-8).join(" "), circles: "", ...maxcopy },
};
for (const [name, props] of Object.entries(cases)) {
  const p = T.normalizeCrossword(props);
  console.log(name, p.themes.map(t => t.id + ":" + t.answer.length).join(" "));
  for (const [w, h] of [[1080,1080], ...CONTRACT_CANVASES]) {
    const L = T.layoutCrosswordCard(p, w, h);
    const byLabel = {};
    for (const t of L.texts) { const k = t.label.replace(/-\d+$/, ""); byLabel[k] = Math.min(byLabel[k] ?? 999, t.px); }
    console.log(`  @${w}x${h} ${L.mode}: ${JSON.stringify(byLabel)} letter=${L.board.letterPx} num=${L.board.numberPx}`);
  }
}
