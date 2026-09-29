// Title size vs other panel text, realistic titles of increasing length, square-mode canvases.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const titles = ["Cats and Dogs", "Something's Gotta Give", "The Long and Winding Road", "Hidden Animals in Plain Sight", "It's Not What You Think, Is It?", "A Tale of Two Cities, More or Less", "Don't Count Your Chickens Just Yet", "A Title Long Enough To Need Two Lines Ok"];
for (const [W, H] of [[1080, 1080], [1200, 1200], [1080, 1200], [1200, 1000], [1080, 1350], [1200, 630], [1920, 1080], [1080, 1920]]) {
  console.log(`== ${W}x${H}`);
  for (const title of titles) {
    const p = T.normalizeCrossword({ title });
    const L = T.layoutCrosswordCard(p, W, H);
    const px = (l) => (L.texts.find((t) => t.label === l) || {}).px;
    const tt = L.texts.find((t) => t.label === "title");
    const flag = tt.px < px("byline") || tt.px < px("theme-0") ? "  <-- title smaller than byline/answers" : "";
    console.log(`${String(title.length).padStart(2)} ${L.mode} title=${tt.px}px lines=${tt.text.split("\n").length} byline=${px("byline")} theme=${px("theme-0")} meta=${px("meta")}  S/20=${(Math.min(W, H) / 20).toFixed(0)}${flag}`);
  }
}
