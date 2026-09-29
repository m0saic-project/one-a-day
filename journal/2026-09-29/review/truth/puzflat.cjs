// The tutorial says "puzpy's p.solution pastes as is". puzpy's p.solution is width*height chars, row-major, '.' for blocks.
const { normalizeCrossword } = require("../../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
function flat(cols, rows) {
  let s = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += (r * 7 + c * 3) % 11 === 5 ? "." : String.fromCharCode(65 + ((r * 7 + c * 3) % 26));
  return s;
}
for (const [c, r] of [[15, 15], [21, 21], [15, 16], [16, 15], [21, 23], [5, 5], [4, 4], [3, 3]]) {
  const s = flat(c, r);
  try { const p = normalizeCrossword({ grid: s, themeEntries: "", circles: "" }); console.log(`${c}x${r} (${s.length} chars): ok -> ${p.pz.cols}x${p.pz.rows}`); }
  catch (e) { console.log(`${c}x${r} (${s.length} chars): ${e.message}`); }
}
