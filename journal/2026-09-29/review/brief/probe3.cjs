const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const titles = ["Variety Pack", "Cats and Dogs", "Solved Grid Cards", "Turning Things Around", "Hidden in Plain Sight", "A Sunday-Size Stress Grid", "Sunday Puzzle: Turning Around", "A Title Long Enough To Need Two Lines Ok"];
for (const t of titles) {
  const p = T.normalizeCrossword({ title: t });
  const row = [[1080,1080],[1920,1080],[1080,1920]].map(([w,h]) => {
    const L = T.layoutCrosswordCard(p, w, h);
    const tt = L.texts.find(x => x.label === "title");
    return `${w}x${h}:${tt.px}px/${tt.text.split("\n").length}L${tt.px < Math.min(w,h)/20 ? " <S/20" : ""}`;
  });
  console.log(`${JSON.stringify(t)} (${t.length}) ${row.join("  ")}`);
}
