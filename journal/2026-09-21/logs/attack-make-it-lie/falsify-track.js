// The template's OWN invariant, copied verbatim from bench-delta.test.ts
// ("keeps every bar and interval on the track, at the seven canvases"),
// re-run against data the test never feeds it.
const path = require("path");
const { layoutBenchDelta, verdictText } = require(path.resolve("dist/dev/bench-delta/v1/bench-delta.js"));
const OPTS = { title:"v1.5 vs v1.4", subtitle:"best of 10 runs", baselineLabel:"v1.4", candidateLabel:"v1.5", smallerIsBetter:true };
const CANV = [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270],[1600,900]];
const rows = [
  { name: "flaky baseline", unit: "ms", base: 100, baseRange: 250, value: 1000, range: 100 },
  { name: "quiet control",  unit: "ms", base: 100, baseRange: 1,   value: 99,   range: 1   },
];
let fails = 0;
for (const [W,H] of CANV) {
  const L = layoutBenchDelta(rows, OPTS, W, H);
  const right = L.trackX + L.trackW;
  for (const r of L.rows) {
    for (const [nm, rect] of [["baseBar",r.baseBar],["candBar",r.candBar],["lane",r.lane],["baseIv",r.baseIv],["candIv",r.candIv]]) {
      if (!rect) continue;
      if (rect.x + rect.w > right) {
        fails++;
        console.log(`FAIL ${W}x${H} row "${r.row.name}" ${nm}: x+w=${rect.x+rect.w} > trackRight=${right}  (over by ${rect.x+rect.w-right}px)`);
      }
      if (rect.x + rect.w > r.lane.x + r.lane.w) {
        console.log(`     ^ and it is OUTSIDE its own lane (lane right = ${r.lane.x + r.lane.w})`);
      }
    }
  }
}
console.log(fails ? `\n${fails} violations of the template's own on-track invariant.` : "no violations");
