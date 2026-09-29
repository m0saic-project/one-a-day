const path = require("path");
const fs = require("fs");
const ROOT = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
// Use the committed 15x15 stress grid (real 15x15 with blocks, three 15-letter themers) and add more themers.
const s15 = JSON.parse(fs.readFileSync(path.join(ROOT, "journal/2026-09-29/stress/15x15.props.json"), "utf8"));
const ent = [...T.numberCrosswordGrid(T.parseCrosswordGrid(s15.grid)).entries.values()];
const base = s15.themeEntries.split(/\s+/);
const others = ent.filter((e) => !base.includes(e.id)).sort((a, b) => b.answer.length - a.answer.length);
console.log("base", base, "next longest", others.slice(0, 6).map((e) => `${e.id}:${e.answer.length}`).join(" "));
const report = (label, themeEntries, W = 1080, H = 1080) => {
  const p = T.normalizeCrossword({ ...s15, themeEntries });
  const L = T.layoutCrosswordCard(p, W, H);
  const g = (l) => (L.texts.find((t) => t.label === l) || {}).px;
  const lines = L.texts.filter((t) => /^theme-\d+$/.test(t.label));
  const ys = lines.map((t) => t.rect.y + t.rect.h);
  console.log(`${label} ${W}x${H}: themes=${p.themes.map((t) => t.answer.length).join(",")} heading=${g("theme-heading")} list=${g("theme-0")} byline=${g("byline")} meta=${g("meta")} panel=${JSON.stringify(L.panel)} listBottom=${Math.max(...ys)} listRight=${Math.max(...lines.map(t=>t.rect.x+t.width))}`);
  return { ...s15, themeEntries };
};
const four = [...base, others[0].id].join(" ");
const five = [...base, others[0].id, others[1].id].join(" ");
const six = [...base, others[0].id, others[1].id, others[2].id].join(" ");
report("3 themers", base.join(" "));
const p4 = report("4 themers", four);
const p5 = report("5 themers", five);
report("6 themers", six);
fs.writeFileSync(path.join(__dirname, "p4.props.json"), JSON.stringify(p4, null, 1));
fs.writeFileSync(path.join(__dirname, "p5.props.json"), JSON.stringify(p5, null, 1));
