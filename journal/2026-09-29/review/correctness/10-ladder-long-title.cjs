// Brief ladder: "At the 1080x1080 hint, a 15x15 has letters of at least 28 px and numbers of at least 13 px."
// The square layout now shrinks the board when the title needs two lines at S/20. Does the ladder survive a long title?
const path = require("path");
const T = require(path.resolve(__dirname, "../../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const synth = (cols, rows) => { const out = []; for (let r = 0; r < rows; r++) { let l = ""; for (let c = 0; c < cols; c++) { const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c); l += ((rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0) ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26)); } out.push(l); } return out.join("/"); };
const g15 = synth(15, 15);
for (const [title, themes] of [["Cats and Dogs", ""], ["Variety Pack Tuesday", ""], ["Variety Pack Tuesday", "1A"], ["Wanting for Winter at the Lake", "1A"], ["A Title Long Enough To Need Two Lines Ok", ""], ["A Title Long Enough To Need Two Lines Ok", "1A"]]) {
  const L = T.layoutCrosswordCard(T.normalizeCrossword({ grid: g15, themeEntries: themes, circles: "", title }), 1080, 1080);
  const B = L.board;
  const t = L.texts.find((x) => x.label === "title");
  console.log(`15x15 @1080 title ${JSON.stringify(title)} themes=${JSON.stringify(themes)}: board ${B.ink.w}px, letters ${B.letterPx}px${B.letterPx < 28 ? " (<28 LADDER BROKEN)" : ""}, numbers ${B.numberPx}px${B.numberPx < 13 ? " (<13 LADDER BROKEN)" : ""}, title ${t.px}px x${t.text.split("\n").length}`);
}
