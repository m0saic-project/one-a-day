// Hard geometry numbers straight from the built template.
import fs from "node:fs";
import { layoutBenchDelta, SAMPLE_ROWS } from "../../../../dist/dev/bench-delta/v1/bench-delta.js";

const file = process.argv[2];
const W = Number(process.argv[3] || 1600), H = Number(process.argv[4] || 900);
let rows = SAMPLE_ROWS, opts = { title: "v1.5 vs v1.4", subtitle: "best of 10 runs - 8-core M4 Pro - cold caches", baselineLabel: "v1.4", candidateLabel: "v1.5", smallerIsBetter: true };
if (file && file !== "-") {
  const p = JSON.parse(fs.readFileSync(new URL(`./${file}`, import.meta.url), "utf8"));
  rows = p.rows;
  opts = { title: p.title ?? "t", subtitle: p.subtitle ?? "s", baselineLabel: p.baselineLabel ?? "base", candidateLabel: p.candidateLabel ?? "cand", smallerIsBetter: p.smallerIsBetter ?? true };
}
const L = layoutBenchDelta(rows, opts, W, H);
console.log(`canvas ${W}x${H}  S=${L.S}  track=[${L.trackX.toFixed(1)} .. ${(L.trackX + L.trackW).toFixed(1)}]  ref(px per baseline)=${L.ref.toFixed(2)}`);
console.log(`rule.x=${L.rule.x.toFixed(2)}  rule.w=${L.rule.w}  rule.y=${L.rule.y.toFixed(1)} h=${L.rule.h.toFixed(1)}`);
console.log(`rows shown ${L.shown}/${L.total}   rows band bottom=${(L.rows.at(-1).lane.y + L.rows.at(-1).lane.h).toFixed(1)} of H=${H}`);
console.log("name px:", L.rows.map((r) => r.name.px).join(","), " values px:", L.rows.map((r) => r.values.px).join(","), " verdict px:", L.rows.map((r) => r.verdictFit.px).join(","));
for (const r of L.rows) {
  const baseEnd = r.baseBar.x + r.baseBar.w;
  const candEnd = r.candBar.x + r.candBar.w;
  const ivs = [r.baseIv, r.candIv].map((iv) => (iv ? `[${iv.x.toFixed(0)}..${(iv.x + iv.w).toFixed(0)}]` : "none"));
  console.log(
    `  ${r.row.name.slice(0, 28).padEnd(28)} baseEnd=${baseEnd.toFixed(2)} candEnd=${candEnd.toFixed(2)} ` +
    `dRule=${(baseEnd - L.rule.x - L.rule.w / 2).toFixed(2)} candOverTrack=${(candEnd > L.trackX + L.trackW + 0.5).toString().padEnd(5)} ` +
    `iv=${ivs.join("/")} verdict="${r.verdictFit.text}" ell=${r.name.text.includes("...")}`
  );
}
