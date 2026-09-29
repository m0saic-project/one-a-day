const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const W = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
let bad = 0, n = 0;
for (let t = Date.UTC(1900,0,1); t <= Date.UTC(2100,11,31); t += 86400000 * 3) {
  const d = new Date(t); const iso = d.toISOString().slice(0,10);
  const p = T.normalizeCrossword({ date: iso });
  const want = `${W[d.getUTCDay()]} ${d.getUTCMonth()+1}/${d.getUTCDate()}/${String(d.getUTCFullYear()%100).padStart(2,"0")}`;
  n++; if (p.metaDate !== want) { bad++; if (bad < 5) console.log(iso, p.metaDate, want); }
}
console.log("checked", n, "bad", bad);
for (const d of ["2024-02-29","2023-02-29","1900-02-29","2000-02-29","0000-01-01","2026-13-01","2026-09-31"]) { try { console.log(d, T.normalizeCrossword({ date: d }).metaDate); } catch (e) { console.log(d, "ERR", e.message); } }
// meta format for defaults and teaser
console.log(T.normalizeCrossword({}).meta, "|", T.normalizeCrossword({ solved: false }).meta);
