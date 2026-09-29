const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CONTRACT_CANVASES } = require(path.join(root, "dist/_shared/layout.js"));
const { widthOf, budget } = require(path.join(root, "dist/_shared/text.js"));
const canv = [[1080,1080], ...CONTRACT_CANVASES];
function synthetic(cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) { let line = "";
    for (let c = 0; c < cols; c++) { const rr = Math.min(r, rows-1-r), cc = Math.min(c, cols-1-c);
      const block = (rr*5+cc*3)%7===3 && rr>0 && cc>0; line += block ? "#" : String.fromCharCode(65+((r*7+c*3)%26)); }
    out.push(line); }
  return out.join("/");
}
const summarize = (name, props) => {
  const p = T.normalizeCrossword(props);
  for (const [w,h] of canv) {
    const L = T.layoutCrosswordCard(p, w, h);
    const B = L.board;
    const title = L.texts.find(t => t.label === "title");
    const minPx = Math.min(...L.texts.map(t => t.px));
    const minLbl = L.texts.filter(t=>t.px===minPx).map(t=>t.label).join(",");
    const S = Math.min(w,h);
    const hole = B.hole(0);
    console.log(`${name} @${w}x${h} mode=${L.mode} margin=${L.margin} gutter=${L.gutter} pitch=${B.pitch.toFixed(2)} rule=${B.rule} border=${B.border} ink=${JSON.stringify(B.ink)} letter=${B.letterPx} num=${B.numberPx} Wfit=${widthOf("W",B.letterPx,true).toFixed(1)}/${(hole.w*0.94-2).toFixed(1)} title=${title.px}(S/20=${(S/20).toFixed(1)}) lines=${title.text.split("\n").length} minTextPx=${minPx}[${minLbl}] boardW=${(B.ink.w/w).toFixed(3)} boardH=${(B.ink.h/h).toFixed(3)}`);
  }
};
summarize("defaults", {});
summarize("maxcopy", { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" });
summarize("15x15", { grid: synthetic(15,15), themeEntries: "", circles: "" });
