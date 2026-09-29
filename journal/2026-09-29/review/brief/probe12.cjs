// Brief: "title: the puzzle title, the largest panel text". Find inputs where another panel text is larger.
const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CONTRACT_CANVASES } = require(path.join(root, "dist/_shared/layout.js"));
const titles = ["Cats and Dogs", "Turning Things Around", "A Sunday-Size Stress Grid", "Sunday Puzzle: Turning Around", "A Title Long Enough To Need Two Lines Ok"];
for (const title of titles) for (const [w, h] of [[1080,1080], ...CONTRACT_CANVASES]) {
  const L = T.layoutCrosswordCard(T.normalizeCrossword({ title }), w, h);
  const t = L.texts.find(x => x.label === "title");
  const bigger = L.texts.filter(x => x.label !== "title" && x.px >= t.px).map(x => `${x.label}=${x.px}`);
  if (bigger.length) console.log(`${JSON.stringify(title)} @${w}x${h}: title=${t.px}px, not larger than: ${bigger.join(", ")}`);
}
