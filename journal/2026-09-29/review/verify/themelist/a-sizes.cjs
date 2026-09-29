const path = require("path");
const ROOT = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const fs = require("fs");
// Open grid, no blocks, n x n
const OPEN = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => String.fromCharCode(65 + ((i * 7 + j * 3) % 26))).join("")).join("/");
function run(label, props, W, H) {
  const p = T.normalizeCrossword(props);
  const L = T.layoutCrosswordCard(p, W, H);
  const by = {};
  for (const t of L.texts) by[t.label] = t.px;
  const themePx = L.texts.filter((t) => /^theme-\d+$/.test(t.label)).map((t) => t.px);
  console.log(`${label} ${W}x${H} mode=${L.mode} themes=${p.themes.length} ansLen=[${p.themes.map(t=>t.answer.length).join(",")}] title=${by.title} byline=${by.byline} meta=${by.meta} heading=${by["theme-heading"]} list=${themePx[0]} letterPx=${L.board.letterPx} numberPx=${L.board.numberPx} board=${L.board.ink.w}x${L.board.ink.h} panelH=${L.panel.h}`);
}
// Stress props from the committed file
const stress = JSON.parse(fs.readFileSync(path.join(ROOT, "journal/2026-09-29/stress/21x21.props.json"), "utf8"));
for (const [W,H] of [[1080,1080],[1080,1350],[1080,1920],[1920,1080],[1280,720],[480,270],[1200,1200]]) run("stress21", stress, W, H);
const s15 = JSON.parse(fs.readFileSync(path.join(ROOT, "journal/2026-09-29/stress/15x15.props.json"), "utf8"));
run("stress15", s15, 1080, 1080);
// Sweep: k across themes of length n in an open n x n grid
for (const n of [7, 9, 11, 13, 15, 21]) {
  const g = OPEN(n);
  const across = [...T.numberCrosswordGrid(T.parseCrosswordGrid(g)).entries.values()].filter((e) => e.dir === "A");
  for (const k of [2, 3, 4, 5, 6, 8]) {
    if (k > across.length) continue;
    run(`open${n} k=${k}`, { grid: g, themeEntries: across.slice(0, k).map((e) => e.id).join(" "), circles: "" }, 1080, 1080);
  }
}
// Default
run("default", {}, 1080, 1080);
