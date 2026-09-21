// Compare the template's interval-overlap verdict with hyperfine's own shipped
// significance test (scripts/welch_ttest.py) on the SAME real hyperfine run.
// Welch's t + two-sided p via the regularised incomplete beta (Lentz).
import fs from "node:fs";
import { verdictOf, verdictText } from "../../../../dist/dev/bench-delta/v1/bench-delta.js";

function lnGamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, t = x + 5.5;
  t -= (x + 0.5) * Math.log(t);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -t + Math.log(2.5066282746310005 * ser / x);
}
function betacf(a, b, x) {
  const FPMIN = 1e-300, EPS = 3e-16;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const varS = (a) => { const m = mean(a); return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1); };

const hf = JSON.parse(fs.readFileSync(new URL("./hyperfine.json", import.meta.url), "utf8"));
const base = hf.results[0];
console.log(`baseline: ${base.command.slice(0, 70)}...`);
console.log(`  mean=${(base.mean * 1000).toFixed(1)}ms sd=${(base.stddev * 1000).toFixed(1)}ms n=${base.times.length}\n`);

for (const cand of hf.results.slice(1)) {
  const X = base.times, Y = cand.times;
  const mx = mean(X), my = mean(Y), vx = varS(X), vy = varS(Y);
  const se = Math.sqrt(vx / X.length + vy / Y.length);
  const t = (mx - my) / se;
  const df = (vx / X.length + vy / Y.length) ** 2 / ((vx / X.length) ** 2 / (X.length - 1) + (vy / Y.length) ** 2 / (Y.length - 1));
  const p = betai(df / 2, 0.5, df / (df + t * t));
  const row = { name: cand.command, unit: "s", base: base.mean, baseRange: base.stddev, value: cand.mean, range: cand.stddev };
  const v = verdictOf(row, true);
  console.log(`candidate: ${cand.command.slice(0, 70)}...`);
  console.log(`  mean=${(cand.mean * 1000).toFixed(1)}ms sd=${(cand.stddev * 1000).toFixed(1)}ms  ratio=${(base.mean / cand.mean).toFixed(3)}x`);
  console.log(`  welch_ttest.py    : t=${t.toFixed(3)} df=${df.toFixed(1)} p=${p.toExponential(3)} -> ${p < 0.05 ? "THERE IS A DIFFERENCE (p<0.05)" : "almost the same (p>=0.05)"}`);
  console.log(`  bench-delta/v1    : ${verdictText(v)}   [${v.reason}]`);
  console.log("");
}
