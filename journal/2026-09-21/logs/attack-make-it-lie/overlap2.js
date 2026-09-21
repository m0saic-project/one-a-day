const path = require("path");
const M = require(path.resolve("dist/dev/bench-delta/v1/bench-delta.js"));
const { layoutBenchDelta } = M;
const OPTS = { title: "t", subtitle: "s", baselineLabel: "b", candidateLabel: "c", smallerIsBetter: true };
const CANV = [[1600,900],[1920,1080],[1080,1920],[1080,1080],[640,360],[480,270]];

function probe(row, W, H) {
  const L = layoutBenchDelta([row], OPTS, W, H);
  const r = L.rows[0];
  if (!r.baseIv || !r.candIv) return null;
  const bx = [r.baseIv.x, r.baseIv.x + r.baseIv.w], cx = [r.candIv.x, r.candIv.x + r.candIv.w];
  return { drawnOverlap: bx[0] <= cx[1] && cx[0] <= bx[1], kind: r.verdict.kind, bx, cx,
           pxGap: cx[0] - bx[1], ref: L.ref, trackW: L.trackW };
}

// A: truly DISJOINT, drawn as overlapping/touching. How big a true gap survives?
let worstA = null;
for (const bR of [0.2,0.5,1,2,5,10,20]) for (const vR of [0, 0.1, 1, 5]) {
  for (let g = 0; g <= 400; g++) {           // g = true gap in units of base%
    const gap = g * 0.01;
    const value = 100 + bR + vR + gap;
    const row = { name:"x", unit:"ms", base:100, baseRange:bR, value, range: vR===0?undefined:vR };
    for (const [W,H] of CANV) {
      const p = probe(row,W,H); if(!p) continue;
      if (p.drawnOverlap && p.kind !== "noise") {
        const rec = { W,H,bR,vR,gapPct:+gap.toFixed(3), ...p };
        if (!worstA || rec.gapPct > worstA.gapPct) worstA = rec;
      }
    }
  }
}
console.log("A) truly disjoint but drawn touching/overlapping - worst true gap:");
console.log("  ", JSON.stringify(worstA));

// B: truly OVERLAPPING, drawn with a visible gap
let worstB = null;
for (const bR of [0.2,0.5,1,2,5,10,20]) for (const vR of [0.1,1,5,10]) {
  for (let g = 0; g <= 400; g++) {
    const ov = g * 0.01;                      // true overlap amount
    const value = 100 + bR + vR - ov;
    const row = { name:"x", unit:"ms", base:100, baseRange:bR, value, range: vR };
    for (const [W,H] of CANV) {
      const p = probe(row,W,H); if(!p) continue;
      if (!p.drawnOverlap && p.kind === "noise") {
        const rec = { W,H,bR,vR,overlapPct:+ov.toFixed(3), ...p };
        if (!worstB || rec.pxGap > worstB.pxGap) worstB = rec;
      }
    }
  }
}
console.log("B) truly overlapping but drawn with a gap - worst pixel gap:");
console.log("  ", JSON.stringify(worstB));
