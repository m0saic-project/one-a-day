const ROOT = "C:/src/m0saic-production/one-a-day";
const m = require(ROOT + "/dist/community/weekly-run-report/v1/weekly-run-report.js");
const clubs = ["R25","R50","R100","R250","R500","R1000","V25","V50","V100","V250"];
const counts = { finishers: 9999, newPbs: 38, firstTimers: 27, visitors: 19, volunteers: 9999, firstTimeVolunteers: 4 };
for (const [W,H] of []) for (const cnt of []) {
  const res = [];
  for (let n = 5; n <= 10; n++) {
    const ms = clubs.slice(0, n).map((c) => `${cnt}x${c}`).join(", ");
    try { m.settleLayout({ counts, milestones: ms }, W, H); res.push(`${n}:ok`); } catch (e) { res.push(`${n}:X`); }
  }
  console.log(`${W}x${H} count=${cnt}: ${res.join(" ")}`);
}
// badge sizes 5 vs 6 clubs
for (const [W,H] of [[1080,1080],[1080,1920],[1920,1080],[1280,720],[640,360]]) {
  const out = [];
  for (const n of [1,5,6,10]) {
    const ms = clubs.slice(0, n).map((c) => `1x${c}`).join(", ");
    const { L } = m.settleLayout({ milestones: ms, counts }, W, H);
    out.push(`${n}: ${L.badges[0].rect.w}x${L.badges[0].rect.h} club${L.badgePx}/cap${L.captionPx}`);
  }
  console.log(`${W}x${H} ${out.join(" | ")}`);
}
// the ship's ten-club example
const ten = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250";
for (const [W,H] of [[480,270],[640,360]]) { try { const {L} = m.settleLayout({ milestones: ten }, W, H); console.log(W,H,"ten ok cap", L.captionPx); } catch (e) { console.log(W,H,"ten X:", e.message); } }
// heroes vs stats sizes
for (const [W,H] of [[1080,1080],[1080,1920],[1920,1080],[1280,720],[480,270],[640,360],[3840,2160]]) {
  const { L } = m.settleLayout({}, W, H);
  console.log(`${W}x${H} ${L.shape} hero ${L.heroRects.map(r=>`${r.x},${r.y} ${r.w}x${r.h}`).join(" ; ")} | stat ${L.statRects.map(r=>`${r.x},${r.y} ${r.w}x${r.h}`).join(" ; ")} | heroPx ${L.heroPx} statPx ${L.statPx} ratio ${(L.heroPx/L.statPx).toFixed(3)} badgePx ${L.badgePx}`);
}
