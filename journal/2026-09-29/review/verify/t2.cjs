const root = "C:/src/m0saic-production/one-a-day";
const T = require(root + "/dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
for (const title of ["Turning Things Around", "Four Quarters of the Evening Sky", "A Sunday-Size Stress Grid"]) {
  for (const solved of [true, false]) {
    const L = T.layoutCrosswordCard(T.normalizeCrossword({ title, solved }), 1080, 1080);
    const t = L.texts.find(x => x.label === "title"), b = L.texts.find(x => x.label === "byline");
    console.log(JSON.stringify(title), "solved=" + solved, "title", t.px + "px", "lines=" + t.text.split("\n").length, "byline y=" + Math.round(b.rect.y));
  }
}
