const path = require("path");
const fs = require("fs");
const ROOT = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const stress21 = JSON.parse(fs.readFileSync(path.join(ROOT, "journal/2026-09-29/stress/21x21.props.json"), "utf8"));
const stress15 = JSON.parse(fs.readFileSync(path.join(ROOT, "journal/2026-09-29/stress/15x15.props.json"), "utf8"));
const cases = [["defaults", {}], ["build stress 15x15", stress15], ["build stress 21x21", stress21]];
// vary number of themes on build 15x15 and 21x21 stress grids
for (const [nm, base] of [["15", stress15], ["21", stress21]]) {
  const num = T.numberCrosswordGrid(T.parseCrosswordGrid(base.grid));
  const ents = [...num.entries.values()].sort((a, b) => b.answer.length - a.answer.length || a.number - b.number);
  for (const k of [3, 4, 5, 6, 8]) cases.push([`${nm}x${nm} top-${k} longest`, { ...base, themeEntries: ents.slice(0, k).map(e => e.id).join(" ") }]);
}
for (const [name, props] of cases) {
  const p = T.normalizeCrossword(props);
  const lens = p.themes.map(t => t.answer.length);
  let out = `${name} [n=${p.themes.length}, len ${Math.min(...lens)}-${Math.max(...lens)}]\n`;
  for (const [W, H] of [[1080, 1080], [1080, 1350], [1920, 1080], [1080, 1920], [480, 270]]) {
    const L = T.layoutCrosswordCard(p, W, H);
    const g = l => L.texts.find(x => x.label === l);
    const th = g("theme-0"), hd = g("theme-heading"), ti = g("title"), me = g("meta"), by = g("byline");
    const ans = L.texts.filter(x => /^theme-\d+$/.test(x.label));
    const maxRight = Math.max(...ans.map(a => a.rect.x + a.width));
    const minX = Math.min(...ans.map(a => a.rect.x));
    out += `  ${W}x${H} ${L.mode}: theme=${th && th.px} head=${hd && hd.px} title=${ti.px} byline=${by && by.px} meta=${me && me.px} panel=${JSON.stringify(L.panel)} ansInk x ${minX|0}..${maxRight|0}\n`;
  }
  console.log(out);
}
