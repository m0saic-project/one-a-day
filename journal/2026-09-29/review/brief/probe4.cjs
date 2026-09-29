// Brief: "Unsolved mode (solved: false) ... Nothing else moves." Compare solved vs teaser geometry.
const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CONTRACT_CANVASES } = require(path.join(root, "dist/_shared/layout.js"));
const fs = require("fs");
const p15 = JSON.parse(fs.readFileSync(path.join(root, "journal/2026-09-29/stress/15x15.props.json"), "utf8"));
const p21 = JSON.parse(fs.readFileSync(path.join(root, "journal/2026-09-29/stress/21x21.props.json"), "utf8"));
const cases = { defaults: {}, "title21": { title: "Turning Things Around" }, stress15: p15, stress21: p21 };
for (const [name, props] of Object.entries(cases)) {
  for (const [w, h] of [[1080,1080], ...CONTRACT_CANVASES]) {
    const A = T.layoutCrosswordCard(T.normalizeCrossword({ ...props, solved: true }), w, h);
    const B = T.layoutCrosswordCard(T.normalizeCrossword({ ...props, solved: false }), w, h);
    const diffs = [];
    if (JSON.stringify(A.board.ink) !== JSON.stringify(B.board.ink)) diffs.push("board");
    for (const t of A.texts) {
      const u = B.texts.find(x => x.label === t.label);
      if (!u) continue;
      if (t.label === "meta") { if (u.rect.x !== t.rect.x || u.rect.y !== t.rect.y) diffs.push(`meta pos`); continue; }
      if (JSON.stringify(t.rect) !== JSON.stringify(u.rect) || t.px !== u.px || t.text !== u.text) diffs.push(`${t.label}: ${t.px}px ${JSON.stringify(t.rect)} ${JSON.stringify(t.text)} -> ${u.px}px ${JSON.stringify(u.rect)} ${JSON.stringify(u.text)}`);
    }
    if (diffs.length) console.log(`${name} @${w}x${h}:\n  ` + diffs.join("\n  "));
  }
}
