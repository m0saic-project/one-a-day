// Gap between the ink of one caption cell and the next cell's "|" vs the single space inside the tail cell.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { widthOf } = require(path.join(ROOT, "dist/_shared/text.js"));
for (const [name, over] of [["defaults", {}], ["24-char publication", { publication: "The Weekly Puzzle Papers" }]]) {
  for (const [W, H] of [[1080, 1080], [1920, 1080], [1080, 1920]]) {
    const L = T.layoutCrosswordCard(T.normalizeCrossword(over), W, H);
    const [pub, date, tail] = ["meta-publication", "meta-date", "meta"].map((l) => L.texts.find((t) => t.label === l));
    if (date.rect.y !== pub.rect.y) { console.log(`${name} @ ${W}x${H}: stacked`); continue; }
    const g1 = date.rect.x - (pub.rect.x + pub.width), g2 = tail.rect.x - (date.rect.x + date.width), sp = widthOf(" ", tail.px);
    console.log(`${name} @ ${W}x${H} (${tail.px}px): gap before 1st "|" ${g1.toFixed(1)}px, before 2nd "|" ${g2.toFixed(1)}px, before 3rd "|" (a space) ${sp.toFixed(1)}px`);
  }
}
