const path = require("path");
const M = require(path.resolve("dist/dev/bench-delta/v1/bench-delta.js"));
const { layoutBenchDelta, verdictText } = M;
const O = (o={}) => ({ title:"v1.5 vs v1.4", subtitle:"best of 10 runs", baselineLabel:"v1.4", candidateLabel:"v1.5", smallerIsBetter:true, ...o });
const CANV = [[1600,900],[1920,1080],[1080,1920],[1080,1080],[640,360],[480,270]];

function barAudit(tag, rows, opts={}) {
  let worst = null;
  for (const [W,H] of CANV) {
    const L = layoutBenchDelta(rows, O(opts), W, H);
    L.rows.forEach((r,i) => {
      const truth = r.row.value / r.row.base;
      const drawn = r.candBar.w / r.baseBar.w;
      const err = truth === 0 ? Infinity : (drawn-truth)/truth*100;
      if (!worst || Math.abs(err) > Math.abs(worst.err)) worst = { tag,W,H,i,name:r.row.name,base:r.row.base,value:r.row.value,baseW:r.baseBar.w,candW:r.candBar.w,truth,drawn,err,pill:verdictText(r.verdict),footer:L.footer.text };
    });
  }
  return worst;
}

console.log("### 6: sub-1% apart rows -- does the bar difference survive rounding?");
const near = [
  { name:"row A", unit:"ms", base:1000, baseRange:0.1, value:1000, range:0.1 },
  { name:"row B", unit:"ms", base:1000, baseRange:0.1, value:1004, range:0.1 },
  { name:"row C", unit:"ms", base:1000, baseRange:0.1, value:1008, range:0.1 },
  { name:"row D", unit:"ms", base:1000, baseRange:0.1, value:1009, range:0.1 },
];
for (const [W,H] of CANV) {
  const L = layoutBenchDelta(near, O(), W, H);
  console.log(`  ${W}x${H} ref=${L.ref} candW = ${L.rows.map(r=>r.candBar.w).join(", ")}  pills = ${L.rows.map(r=>verdictText(r.verdict)).join(" | ")}`);
}

console.log("\n### 7: base === value");
const eq = [{ name:"identical", unit:"ms", base:100, baseRange:1, value:100, range:1 },
            { name:"identical, no spread", unit:"ms", base:100, value:100 }];
for (const [W,H] of [[1600,900],[480,270]]) {
  const L = layoutBenchDelta(eq, O(), W, H);
  L.rows.forEach((r,i)=>console.log(`  ${W}x${H} row${i} baseW=${r.baseBar.w} candW=${r.candBar.w} pill="${verdictText(r.verdict)}" baseBarH=${r.baseBar.h} candBarH=${r.candBar.h}`));
}

console.log("\n### 8: one row with range, one without (asymmetric)");
const asym = [
  { name:"baseline has range, candidate does not", unit:"ms", base:100, baseRange:1, value:50 },
  { name:"candidate has range, baseline does not", unit:"ms", base:100, value:50, range:1 },
  { name:"neither", unit:"ms", base:100, value:50 },
];
const L8 = layoutBenchDelta(asym, O(), 1600, 900);
L8.rows.forEach((r,i)=>console.log(`  row${i} "${r.row.name}" -> pill="${verdictText(r.verdict)}" baseIv=${r.baseIv?JSON.stringify([r.baseIv.x-L8.trackX,r.baseIv.w]):"null"} candIv=${r.candIv?JSON.stringify([r.candIv.x-L8.trackX,r.candIv.w]):"null"} candBarH=${r.candBar.h} baseBarH=${r.baseBar.h}`));

console.log("\n### 9: 32 rows");
const many = Array.from({length:32},(_,i)=>({ name:`bench ${i+1}`, unit:"ms", base:100, baseRange: i%3===0?1:undefined, value: 100 - i, range: i%3===0?1:undefined }));
for (const [W,H] of CANV) {
  const L = layoutBenchDelta(many, O(), W, H);
  console.log(`  ${W}x${H} shown=${L.shown}/${L.total} summary="${L.summary.text.replace(/\n/g," / ")}"`);
  console.log(`      footer="${L.footer.text}"`);
}
