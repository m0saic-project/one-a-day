// A non-square .puz solution string whose length happens to be a perfect square: 16 wide x 9 tall = 144 chars.
const { normalizeCrossword } = require("../../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
const rows = [];
for (let r = 0; r < 9; r++) { let s = ""; for (let c = 0; c < 16; c++) s += c === 7 && r % 3 === 1 ? "." : String.fromCharCode(65 + ((r * 5 + c) % 26)); rows.push(s); }
const flat = rows.join("");
const p = normalizeCrossword({ grid: flat, themeEntries: "", circles: "" });
console.log(`16x9 puzzle, ${flat.length}-char p.solution -> parsed as ${p.pz.cols}x${p.pz.rows}; meta "${p.meta}"`);
console.log("first parsed row:", p.pz.cells.slice(0, p.pz.cols).map((c) => c ?? "#").join(""), " vs true row 1:", rows[0].replace(/\./g, "#"));
