const path = require("path");
const { layoutBenchDelta, verdictText } = require(path.resolve("dist/dev/bench-delta/v1/bench-delta.js"));
const OPTS = { title:"v1.5 vs v1.4", subtitle:"best of 10 runs", baselineLabel:"v1.4", candidateLabel:"v1.5", smallerIsBetter:true };
const CANV = [[1600,900],[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270]];
// a plausible bench sheet: one giant regression, one giant win, one ordinary row
const rows = [
  { name: "regex backtrack (pathological)", unit: "ms", base: 12,   baseRange: 0.3, value: 480,  range: 9 },
  { name: "memoised lookup",                unit: "ns", base: 9400, baseRange: 40,  value: 7,    range: 0.4 },
  { name: "http round trip",                unit: "ms", base: 100,  baseRange: 2,   value: 92,   range: 2 },
];
let worst = { errAbs: -1 };
for (const [W,H] of CANV) {
  const L = layoutBenchDelta(rows, OPTS, W, H);
  console.log(`\n${W}x${H}  trackW=${L.trackW} ref=${L.ref} rel=${(L.trackW/L.ref).toFixed(3)}`);
  L.rows.forEach(r => {
    const truth = r.row.value / r.row.base;
    const drawn = r.candBar.w / r.baseBar.w;
    const err = (drawn - truth) / truth * 100;
    console.log(`  "${r.row.name}"  pill="${verdictText(r.verdict)}"  truth=${truth.toFixed(6)}  drawn=${drawn.toFixed(6)}  err=${err.toFixed(1)}%  (candW=${r.candBar.w}, baseW=${r.baseBar.w})`);
    if (Math.abs(err) > worst.errAbs) worst = { errAbs: Math.abs(err), err, W, H, name: r.row.name, truth, drawn, pill: verdictText(r.verdict) };
  });
  console.log(`  FOOTER: ${L.footer.text}`);
}
console.log(`\nWORST: ${worst.err.toFixed(1)}%  at ${worst.W}x${worst.H} on "${worst.name}" (pill "${worst.pill}"): picture says ${worst.drawn.toFixed(4)}x baseline, numbers say ${worst.truth.toFixed(6)}x`);
