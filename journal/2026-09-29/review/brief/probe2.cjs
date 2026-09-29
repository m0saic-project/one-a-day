const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CONTRACT_CANVASES } = require(path.join(root, "dist/_shared/layout.js"));
const fs = require("fs");
const p21 = JSON.parse(fs.readFileSync(path.join(root, "journal/2026-09-29/stress/21x21.props.json"), "utf8"));
const maxcopy = { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" };
const cases = {
  "21x21+8themes": p21,
  "21x21+8themes+maxcopy": { ...p21, ...maxcopy },
  "defaults+maxcopy": maxcopy,
};
for (const [name, props] of Object.entries(cases)) {
  const p = T.normalizeCrossword(props);
  for (const [w, h] of [[1080,1080], ...CONTRACT_CANVASES]) {
    const L = T.layoutCrosswordCard(p, w, h);
    const small = L.texts.filter(t => t.px < 8).map(t => `${t.label}=${t.px}`);
    const byLabel = {};
    for (const t of L.texts) { const k = t.label.replace(/-\d+$/, ""); byLabel[k] = Math.min(byLabel[k] ?? 999, t.px); }
    console.log(`${name} @${w}x${h}: ${JSON.stringify(byLabel)} under8=${small.join(",")}`);
  }
}
