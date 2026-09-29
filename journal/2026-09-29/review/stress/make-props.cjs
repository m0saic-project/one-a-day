const fs = require("fs"); const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
function synth(cols, rows) { const out = []; for (let r = 0; r < rows; r++) { let l = ""; for (let c = 0; c < cols; c++) { const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c); l += ((rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0) ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26)); } out.push(l); } return out.join("/"); }
const ents = (g) => [...T.numberCrosswordGrid(T.parseCrosswordGrid(g)).entries.values()];
const longest = (g, n, minLen = 0) => ents(g).filter((e) => e.answer.length >= minLen).sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, n).map((e) => e.id);
const g21 = synth(21, 21);
const white15 = Array.from({ length: 15 }, (_, r) => Array.from({ length: 15 }, (_, c) => String.fromCharCode(65 + ((r * 7 + c * 3) % 26))).join("")).join("/");
const out = {
  "maxcopy": { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" },
  "title25": { title: "The Long and Winding Road" },
  "8long-maxcopy": { grid: g21, themeEntries: longest(g21, 8, 20).join(" "), circles: "0 22 44", title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" },
  "8long": { grid: g21, themeEntries: longest(g21, 8, 20).join(" "), circles: "" },
  "25x3-debug": { grid: synth(25, 3), themeEntries: longest(synth(25, 3), 4).join(" "), circles: "", debugLayout: true },
  "120circles": { grid: white15, themeEntries: "1A,\n16A", circles: Array.from({ length: 120 }, (_, i) => i).join(",\n") },
  "authorW48": { author: "W".repeat(48) },
};
for (const [k, v] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, `${k}.props.json`), JSON.stringify(v, null, 2));
console.log(Object.keys(out).join(" "));
