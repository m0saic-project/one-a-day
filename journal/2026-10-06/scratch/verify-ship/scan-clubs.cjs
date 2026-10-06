const ROOT = "C:/src/m0saic-production/one-a-day";
const m = require(ROOT + "/dist/community/weekly-run-report/v1/weekly-run-report.js");
const clubs = ["R25","R50","R100","R250","R500","R1000","V25","V50","V100","V250"];
const counts = { finishers: 9999, newPbs: 38, firstTimers: 27, visitors: 19, volunteers: 9999, firstTimeVolunteers: 4 };
const sizes = [[480,270],[640,360],[1280,720],[1080,1080],[1080,1920],[1920,1080],[3840,2160],[720,1280],[1080,1350]];
for (const [W,H] of sizes) {
  const row = [];
  for (const cnt of [1, 999]) {
    const res = [];
    for (let n = 1; n <= 10; n++) {
      // choose a mix: run clubs first then volunteer clubs
      const ms = clubs.slice(0, n).map((c) => `${cnt}x${c}`).join(", ");
      // also volunteer-heavy (longer caption "volunteers")
      const ms2 = [...clubs.slice(6), ...clubs.slice(0,6)].slice(0, n).map((c) => `${cnt}x${c}`).join(", ");
      let ok1 = true, ok2 = true, info = "";
      try { const { L } = m.settleLayout({ counts, milestones: ms }, W, H); info = `${L.badges.length ? new Set(L.badges.map(b=>b.rect.y)).size : 0}r/${L.captionPx}`; } catch (e) { ok1 = false; }
      try { m.settleLayout({ counts, milestones: ms2 }, W, H); } catch (e) { ok2 = false; }
      res.push(`${n}:${ok1?"ok":"X"}${ok2?"":"(v:X)"}${ok1?"["+info+"]":""}`);
    }
    row.push(`  count=${cnt}: ${res.join(" ")}`);
  }
  console.log(`${W}x${H}\n${row.join("\n")}`);
}
