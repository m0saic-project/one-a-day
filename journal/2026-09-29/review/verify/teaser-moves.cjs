const root = "C:/src/m0saic-production/one-a-day";
const T = require(root + "/dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
const { CONTRACT_CANVASES } = require(root + "/dist/_shared/layout.js");
const fs = require("fs");
const p21 = JSON.parse(fs.readFileSync(root + "/journal/2026-09-29/stress/21x21.props.json", "utf8"));
const cases = { defaults: {}, title21: { title: "Turning Things Around" }, stress21: p21 };
const canv = [[1080,1080], ...CONTRACT_CANVASES];
for (const [name, props] of Object.entries(cases)) {
  for (const [w, h] of canv) {
    const A = T.layoutCrosswordCard(T.normalizeCrossword({ ...props, solved: true }), w, h);
    const B = T.layoutCrosswordCard(T.normalizeCrossword({ ...props, solved: false }), w, h);
    const out = [];
    for (const lab of ["title", "byline-by", "byline", "meta-publication", "meta-date", "meta"]) {
      const a = A.texts.find(t => t.label === lab), b = B.texts.find(t => t.label === lab);
      const ra = a.rect, rb = b.rect;
      const r = (q) => `${Math.round(q.x)},${Math.round(q.y)} ${Math.round(q.w)}x${Math.round(q.h)}`;
      if (r(ra) !== r(rb) || a.px !== b.px || (lab !== "meta" && a.text !== b.text)) out.push(`  ${lab}: ${a.px}px [${r(ra)}] ${JSON.stringify(a.text)} -> ${b.px}px [${r(rb)}] ${JSON.stringify(b.text)}`);
    }
    console.log(`${name} @${w}x${h} mode=${A.mode} ${out.length ? "\n" + out.join("\n") : "same"}`);
  }
}
