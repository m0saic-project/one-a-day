const path = require("path");
const M = require(path.resolve("dist/dev/bench-delta/v1/bench-delta.js"));
const { layoutBenchDelta, verdictOf, verdictText } = M;
const OPTS = { title: "t", subtitle: "s", baselineLabel: "b", candidateLabel: "c", smallerIsBetter: true };

// Does the PICTURE (two stripe rects) agree with the PILL (interval logic)?
function probe(row, W, H) {
  const rows = [row];
  const L = layoutBenchDelta(rows, OPTS, W, H);
  const r = L.rows[0];
  const bi = r.baseIv, ci = r.candIv;
  if (!bi || !ci) return null;
  const bx = [bi.x, bi.x + bi.w], cx = [ci.x, ci.x + ci.w];
  const drawnOverlap = bx[0] <= cx[1] && cx[0] <= bx[1];
  const said = r.verdict.kind;            // noise == "the intervals overlap"
  const saidOverlap = said === "noise";
  return { drawnOverlap, saidOverlap, said, bx, cx, gap: Math.max(cx[0] - bx[1], bx[0] - cx[1]) };
}

const CANV = [[1600,900],[1920,1080],[1080,1920],[1080,1080],[640,360],[480,270]];
let flips = [];
// sweep: base fixed, candidate just past / just inside the baseline's upper edge
for (const bR of [0.5, 1, 2, 5]) {
  for (let k = 0; k <= 60; k++) {
    const vR = bR / 3;
    const value = 100 + bR + vR + k * 0.02;   // k=0 => exactly touching; k>0 => truly disjoint
    const row = { name: "x", unit: "ms", base: 100, baseRange: bR, value, range: vR };
    for (const [W, H] of CANV) {
      const p = probe(row, W, H);
      if (!p) continue;
      if (p.drawnOverlap !== p.saidOverlap) {
        flips.push({ W, H, bR, vR, value: +value.toFixed(3), ...p });
      }
    }
  }
}
console.log("flips found:", flips.length);
// print the most extreme ones per canvas
const byCanvas = {};
for (const f of flips) {
  const k = `${f.W}x${f.H}`;
  if (!byCanvas[k] || Math.abs(f.value - 100) > Math.abs(byCanvas[k].value - 100)) byCanvas[k] = f;
}
for (const k of Object.keys(byCanvas)) {
  const f = byCanvas[k];
  console.log(`${k} base=100+/-${f.bR} value=${f.value}+/-${f.vR} -> pill says "${f.said}" but stripes drawn baseIv=[${f.bx}] candIv=[${f.cx}] overlap=${f.drawnOverlap}`);
}
