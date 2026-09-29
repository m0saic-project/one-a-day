const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const titles = ["Cats and Dogs", "Variety Pack", "Solved Grid Cards", "Hidden in Plain Sight", "Turning Things Around", "A Sunday-Size Stress Grid", "Sunday Puzzle: Turning Around", "A Title Long Enough To Need Two Lines Ok"];
const canv = [[1080,1080],[1920,1080],[1080,1920],[1080,1350],[1350,1080]];
for (const t of titles) {
  const p = T.normalizeCrossword({ title: t });
  const row = canv.map(([w,h]) => {
    const L = T.layoutCrosswordCard(p, w, h);
    const tt = L.texts.find(x => x.label === "title");
    return `${w}x${h}:${tt.px}px/${tt.text.split("\n").length}L${tt.px < Math.min(w,h)/20 ? "<S/20" : ""}`;
  });
  console.log(`${JSON.stringify(t).padEnd(45)} (${t.length}) ${row.join(" ")}`);
}
console.log("--- square 1080 detail, default props + max title");
const p = T.normalizeCrossword({ title: "A Title Long Enough To Need Two Lines Ok" });
const L = T.layoutCrosswordCard(p, 1080, 1080);
console.log("mode", L.mode, "panel", JSON.stringify(L.panel), "board", JSON.stringify(L.board.ink));
for (const x of L.texts) console.log(x.label.padEnd(18), String(x.px).padStart(3)+"px", JSON.stringify(x.rect), JSON.stringify(x.text));
