const M = require("../../../../dist/community/weekly-run-report/v1/weekly-run-report.js");
const T = require("../../../../dist/_shared/text.js");
const fs = require("fs");
const BASE = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250".split(", ");
const LONG = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 15xV25, 13xV50, 2xV100, 1xV250".split(", ");
const aspects = [[9,16],[3,4],[1,1],[16,9],[21,9]];
const widths = [640, 1080, 1920, 3840];
const canv = [];
for (const [a,b] of aspects) for (const w of widths) canv.push({W:w, H:Math.round(w*b/a), asp:`${a}:${b}`});
for (const [W,H] of [[1000,800],[1200,900],[1290,1000],[1440,900],[828,1792],[1125,2436],[1001,1001]]) canv.push({W,H,asp: W===H?"1:1":`${W}x${H}`});
let calls = 0;
const lineH = (px) => Math.ceil(px*1.22);
function run(list, n, W, H) {
  const props = { milestones: list.slice(0,n).join(", ") };
  calls++;
  let r;
  try { r = M.settleLayout(props, W, H); } catch (e) { return { ok:false, err:e.message }; }
  const L = r.L;
  const issues = [];
  if (L.badgePx > L.statPx) issues.push(`badgePx ${L.badgePx} > statPx ${L.statPx}`);
  const rowsY = [...new Set(L.badges.map(b=>b.rect.y))].length;
  L.badges.forEach((b, i) => {
    const k = i+1, R = b.rect;
    const club = L.cells.find(c=>c.label===`badge-club-${k}`), cap = L.cells.find(c=>c.label===`badge-caption-${k}`);
    if (club.px > L.statPx) issues.push(`club ${k} px ${club.px} > statPx ${L.statPx}`);
    const block = lineH(club.px) + lineH(cap.px);
    if (block > R.h) issues.push(`badge ${k} block ${block} > h ${R.h}`);
    for (const c of [club, cap]) {
      const cr = c.rect;
      if (cr.y < R.y || cr.y+cr.h > R.y+R.h || cr.x < R.x || cr.x+cr.w > R.x+R.w) issues.push(`${c.label} rect ${JSON.stringify(cr)} outside badge ${JSON.stringify(R)}`);
      if (c.width > T.budget(cr.w)) issues.push(`${c.label} text w ${c.width.toFixed(1)} > budget ${T.budget(cr.w)}`);
    }
    const band = L.band;
    if (R.y < band.y || R.y+R.h > band.y+band.h || R.x < band.x || R.x+R.w > band.x+band.w) issues.push(`badge ${k} outside band`);
    L.badges.forEach((o, j) => { if (j>i) { const Q=o.rect; if (R.x<Q.x+Q.w && Q.x<R.x+R.w && R.y<Q.y+Q.h && Q.y<R.y+R.h) issues.push(`badge ${k} overlaps ${j+1}`);} });
  });
  return { ok:true, shape:L.shape, statPx:L.statPx, heroPx:L.heroPx, badgePx:L.badgePx, captionPx:L.captionPx, small:L.small, rows:rowsY, bw:L.badges[0]?.rect.w, bh:L.badges[0]?.rect.h, pitch:r.pitch, issues };
}
const out = [];
for (const c of canv) for (let n=1;n<=10;n++) out.push({ set:"base", ...c, n, S:Math.min(c.H,0.75*c.W), ...run(BASE,n,c.W,c.H) });
for (const c of canv) out.push({ set:"long", ...c, n:10, S:Math.min(c.H,0.75*c.W), ...run(LONG,10,c.W,c.H) });
for (let n=1;n<=10;n++) out.push({ set:"base", W:480, H:270, asp:"480x270", n, S:270, ...run(BASE,n,480,270) });
fs.writeFileSync(__dirname + "/sweep.json", JSON.stringify(out, null, 1));
console.log("settleLayout calls:", calls);
console.log("\n== refusals (all) ==");
for (const o of out.filter(o=>!o.ok)) console.log(`${o.set} ${o.W}x${o.H} S=${o.S} n=${o.n}: ${o.err.replace(/^@one-a-day\/community\/weekly-run-report\/v1: /,"")}`);
console.log("\n== issues on accepted ==");
for (const o of out.filter(o=>o.ok && o.issues.length)) console.log(`${o.set} ${o.W}x${o.H} n=${o.n}: ${o.issues.join("; ")}`);
console.log("\n== monotonicity (same aspect) ==");
const groups = {};
for (const o of out.filter(o=>o.set==="base")) (groups[o.asp] ??= []).push(o);
let viol = 0;
for (const [asp, arr] of Object.entries(groups)) for (let n=1;n<=10;n++) {
  const xs = arr.filter(o=>o.n===n).sort((a,b)=>a.W-b.W);
  for (let i=0;i<xs.length;i++) for (let j=i+1;j<xs.length;j++) if (xs[i].ok && !xs[j].ok && xs[j].W>xs[i].W) { viol++; console.log(`VIOLATION ${asp} n=${n}: ${xs[i].W}x${xs[i].H} ok, ${xs[j].W}x${xs[j].H} refused`); }
}
console.log("same-aspect violations:", viol);
console.log("\n== dominance (W>=,H>=, any aspect) ==");
const base = out.filter(o=>o.set==="base"); let dv=0;
for (const a of base) for (const b of base) if (a.n===b.n && a.ok && !b.ok && b.W>=a.W && b.H>=a.H && (b.W>a.W||b.H>a.H)) { dv++; console.log(`DOM n=${a.n}: ${a.W}x${a.H} ok, ${b.W}x${b.H} refused`); }
console.log("dominance violations:", dv);
