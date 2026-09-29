// Brief: the title is "the largest panel text". At the 1080x1080 hint, with the default author, find titles whose px < byline px.
const path = require("path");
const T = require(path.resolve(__dirname, "../../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const words = "Wanting for Winter at the Lake House Party Time".split(" ");
for (let n = 1; n <= words.length; n++) {
  const title = words.slice(0, n).join(" ");
  if (title.length > 40) break;
  for (const over of [{}, { themeEntries: "" }, { solved: false }]) {
    const L = T.layoutCrosswordCard(T.normalizeCrossword({ title, ...over }), 1080, 1080);
    const t = L.texts.find((x) => x.label === "title"), b = L.texts.find((x) => x.label === "byline"), th = L.texts.find((x) => x.label === "theme-0");
    const others = L.texts.filter((x) => x.label !== "title").map((x) => x.px);
    const flag = t.px < Math.max(...others) ? `  <-- title smaller than ${L.texts.filter((x) => x.px > t.px).map((x) => x.label + "=" + x.px).join(",")}` : "";
    console.log(`${JSON.stringify(title)} (${title.length}) ${JSON.stringify(over)}: title ${t.px}px x${t.text.split("\n").length} lines, byline ${b.px}px${flag}`);
  }
}
