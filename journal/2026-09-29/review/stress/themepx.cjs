// Theme-list font size vs answer length, per canvas; mirrors the test's longThemes(synthetic(n,n)).
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
function synth(cols, rows) { const out = []; for (let r = 0; r < rows; r++) { let l = ""; for (let c = 0; c < cols; c++) { const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c); l += ((rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0) ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26)); } out.push(l); } return out.join("/"); }
const openGrid = (n) => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => String.fromCharCode(65 + ((r * 7 + c * 3) % 26))).join("")).join("/");
const longThemes = (g) => [...T.numberCrosswordGrid(T.parseCrosswordGrid(g)).entries.values()].sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, 8).map((e) => e.id).join(" ");
const cases = [];
for (const n of [15, 17, 19, 21, 23, 25]) cases.push([`open ${n}x${n} 8x${n}-letter`, { grid: openGrid(n), themeEntries: longThemes(openGrid(n)), circles: "" }]);
cases.push(["TEST STRESS '25x25' = synthetic(25,25)+longThemes", { grid: synth(25, 25), themeEntries: longThemes(synth(25, 25)), circles: "" }]);
cases.push(["open 21x21, 4 x 21-letter", { grid: openGrid(21), themeEntries: "1A 22A 23A 24A", circles: "" }]);
cases.push(["open 25x25, 4 x 25-letter", { grid: openGrid(25), themeEntries: "1A 26A 27A 28A", circles: "" }]);
for (const [name, props] of cases) {
  const p = T.normalizeCrossword(props);
  const lens = p.themes.map((t) => t.answer.length);
  const row = [[1080, 1080], [1200, 1200], [1080, 1350], [1920, 1080], [1080, 1920], [1200, 630], [480, 270], [640, 360]].map(([W, H]) => {
    const L = T.layoutCrosswordCard(p, W, H);
    const t = L.texts.find((x) => x.label === "theme-0");
    const title = L.texts.find((x) => x.label === "title");
    return `${W}x${H}:${t.px}px(${L.mode[0]}) `;
  });
  console.log(`${name} [answer lengths ${Math.min(...lens)}-${Math.max(...lens)}]\n   ${row.join(" ")}`);
}
