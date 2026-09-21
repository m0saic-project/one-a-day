import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ROOT="C:/src/m0saic-production/one-a-day"; process.env.M0SAIC_CLI ??= "/usr/bin/false";
const bd = require(path.join(ROOT,"dist/dev/bench-delta/v1/bench-delta.js"));
const rows = bd.SAMPLE_ROWS;
const L60 = "@".repeat(60);
let worst = null, hits = 0, n = 0;
const sizes = [];
for (let w=320; w<=3840; w+=8) for (const h of [180,270,360,480,540,720,900,1080,1350,1920,2160]) sizes.push([w,h]);
for (const [w,h] of sizes) {
  n++;
  const L = bd.layoutBenchDelta(rows, { title:"v1.5 vs v1.4", subtitle:"best of 10 runs", baselineLabel:L60, candidateLabel:L60, smallerIsBetter:true }, w, h);
  const last = L.legend[L.legend.length-1];
  const right = last.labelRect.x + last.labelRect.w;
  const contentRight = L.margin + (w - 2*L.margin);
  const overContent = right - contentRight;
  const overCanvas = right - w;
  if (overContent > 0) hits++;
  if (!worst || overCanvas > worst.overCanvas) worst = { w,h,right,contentRight,overContent,overCanvas };
}
console.log(`checked ${n} canvases; ${hits} spill past the content margin`);
console.log("worst vs CANVAS edge:", JSON.stringify(worst));
// worst vs content margin
let wc = null;
for (const [w,h] of sizes) {
  const L = bd.layoutBenchDelta(rows, { title:"v1.5 vs v1.4", subtitle:"best of 10 runs", baselineLabel:L60, candidateLabel:L60, smallerIsBetter:true }, w, h);
  const last = L.legend[L.legend.length-1];
  const right = last.labelRect.x + last.labelRect.w;
  const over = right - (w - L.margin);
  if (!wc || over > wc.over) wc = { w,h,right,margin:L.margin,over };
}
console.log("worst vs content margin:", JSON.stringify(wc));
