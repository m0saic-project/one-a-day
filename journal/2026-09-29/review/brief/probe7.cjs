// Gutter between board and panel copy: brief says >= 2x margin in every mode.
const path = require("path");
const fs = require("fs");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CONTRACT_CANVASES } = require(path.join(root, "dist/_shared/layout.js"));
const p21 = JSON.parse(fs.readFileSync(path.join(root, "journal/2026-09-29/stress/21x21.props.json"), "utf8"));
const maxcopy = { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" };
const open = (c, r) => Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => String.fromCharCode(65 + ((i + j) % 26))).join("")).join("/");
const cases = { defaults: {}, maxcopy, p21, "p21+max": { ...p21, ...maxcopy }, "15x16": { grid: open(15,16), themeEntries: "", circles: "" }, "3x25": { grid: open(3,25), themeEntries: "", circles: "" }, "25x3": { grid: open(25,3), themeEntries: "", circles: "" } };
const gap = (a, b) => { const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), 0), dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h), 0); return Math.max(dx, dy); };
for (const [name, props] of Object.entries(cases)) {
  const p = T.normalizeCrossword(props);
  for (const [w, h] of [[1080,1080], ...CONTRACT_CANVASES, [1350,1080],[1080,1350],[1440,1080],[1200,1080]]) {
    const L = T.layoutCrosswordCard(p, w, h);
    const ink = L.board.ink;
    let min = 1e9, who = "";
    for (const t of L.texts) { const g = gap(t.rect, ink); if (g < min) { min = g; who = t.label; } }
    for (const s of L.themeLines) { const g = gap(s.swatch, ink); if (g < min) { min = g; who = "swatch"; } }
    const left = ink.x, top = ink.y, right = w - ink.x - ink.w, bottom = h - ink.y - ink.h;
    const flag = min < 2 * L.margin ? "  <-- gutter < 2*margin" : "";
    if (flag || name === "defaults") console.log(`${name} @${w}x${h} ${L.mode}: margin=${L.margin} nearest copy ${who} at ${min}px; board edges L${left} T${top} R${right} B${bottom}${flag}`);
  }
}
