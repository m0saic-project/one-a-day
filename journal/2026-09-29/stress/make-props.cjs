// Stress props for the rubric's real renders: a 15x15 (three 15-letter theme rows, circles)
// and a 21x21 (8 long themes). Block patterns have 180-degree symmetry; the fill letters are
// synthetic (only the default 7x7 must be real words), the three 15s in the 15x15 are words.
const fs = require("fs");
const path = require("path");
const { numberCrosswordGrid, parseCrosswordGrid } = require("../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");

const FILL = "EASTRONILUCDHMPGBYWFKV";
const fill = (rows) => rows.map((row, r) => [...row].map((ch, c) => (ch === "." ? FILL[(r * 7 + c * 5) % FILL.length] : ch)).join(""));

const p15 = [
  "....#.....#....",
  "....#.....#....",
  "SOLVEDGRIDCARDS",
  "...#....##.....",
  "###.....#......",
  "....#....#.....",
  "...#.....#....#",
  "PUZZLEFILEINPUT",
  "#....#.....#...",
  ".....#....#....",
  "......#.....###",
  ".....##....#...",
  "THEMEANSWERSLIT",
  "....#.....#....",
  "....#.....#....",
];
for (let r = 0; r < 15; r++) {
  const mirror = [...p15[14 - r]].reverse().join("");
  const blocks = (s) => [...s].map((ch) => (ch === "#" ? "#" : ".")).join("");
  if (blocks(p15[r]) !== blocks(mirror)) throw new Error(`15x15 row ${r} breaks symmetry`);
}
const g15 = fill(p15).join("/");
const e15 = numberCrosswordGrid(parseCrosswordGrid(g15)).entries;
const across15 = [...e15.values()].filter((e) => e.dir === "A" && e.answer.length === 15).map((e) => e.id);
if (across15.length !== 3) throw new Error("expected three 15-letter across entries");
const circles15 = [7 * 15 + 6, 7 * 15 + 7, 7 * 15 + 8, 7 * 15 + 9].join(" "); // FILE, the middle of the revealer row

function synthetic(cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c);
      const block = (rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0;
      line += block ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26));
    }
    out.push(line);
  }
  return out.join("/");
}
const g21 = synthetic(21, 21);
const e21 = [...numberCrosswordGrid(parseCrosswordGrid(g21)).entries.values()];
const themes21 = e21.sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, 8).map((e) => e.id);

const out = {
  "15x15": { grid: g15, themeEntries: across15.join(" "), circles: circles15, title: "Solved Grid Cards", author: "one-a-day agent (stress test)", publication: "Stress Weekday", date: "2026-09-28" },
  "21x21": { grid: g21, themeEntries: themes21.join(" "), circles: "0 22 44", title: "A Sunday-Size Stress Grid", author: "one-a-day agent (stress test)", publication: "Stress Sunday", date: "2026-09-27" },
  "15x15-teaser": { grid: g15, themeEntries: across15.join(" "), circles: circles15, title: "Solved Grid Cards", author: "one-a-day agent (stress test)", publication: "Stress Weekday", date: "2026-09-28", solved: false },
};
for (const [k, v] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, `${k}.props.json`), JSON.stringify(v, null, 2) + "\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.themeEntries]))));
