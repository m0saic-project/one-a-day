const path = require("path");
const M = require(path.resolve("dist/dev/bench-delta/v1/bench-delta.js"));
const { layoutBenchDelta, verdictText } = M;
const O = (sib) => ({ title:"v1.5 vs v1.4", subtitle:"best of 10 runs", baselineLabel:"v1.4", candidateLabel:"v1.5", smallerIsBetter:sib });
const CANV = [[1600,900],[1920,1080],[1080,1920],[1080,1080],[640,360],[480,270]];

const rows = M.SAMPLE_ROWS;

function walk(o, p, out) {
  if (o === null || typeof o !== "object") { out[p] = o; return out; }
  for (const k of Object.keys(o)) walk(o[k], p ? `${p}.${k}` : k, out);
  return out;
}

for (const [W,H] of CANV) {
  const A = layoutBenchDelta(rows, O(true), W, H);
  const B = layoutBenchDelta(rows, O(false), W, H);
  const fa = walk(A, "", {}), fb = walk(B, "", {});
  const keys = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  const diffs = [...keys].filter(k => fa[k] !== fb[k]);
  console.log(`${W}x${H}: ${diffs.length} differing leaf fields`);
  for (const k of diffs) console.log(`   ${k}: ${JSON.stringify(fa[k])}  ->  ${JSON.stringify(fb[k])}`);
  console.log(`   pills T: ${A.rows.map(r=>verdictText(r.verdict)).join(" | ")}`);
  console.log(`   pills F: ${B.rows.map(r=>verdictText(r.verdict)).join(" | ")}`);
}
