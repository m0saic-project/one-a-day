const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { widthOf } = require(path.join(root, "dist/_shared/text.js"));
for (const [w, h] of [[1080,1080],[1920,1080],[1080,1920],[480,270]]) {
  const L = T.layoutCrosswordCard(T.normalizeCrossword({}), w, h);
  const g = (l) => L.texts.find(t => t.label === l);
  const pub = g("meta-publication"), date = g("meta-date"), rest = g("meta");
  const sp = widthOf(" ", pub.px);
  const gap1 = date.rect.x - (pub.rect.x + pub.width), gap2 = rest.rect.x - (date.rect.x + date.width);
  console.log(`${w}x${h} px=${pub.px} space=${sp.toFixed(1)} gap before 1st '|'=${gap1.toFixed(1)} gap before 2nd '|'=${gap2.toFixed(1)} (3rd '|' uses a plain space) texts: ${JSON.stringify(pub.text)} ${JSON.stringify(date.text)} ${JSON.stringify(rest.text)}`);
}
