const m = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
const MAX = { finishers: 9999, newPbs: 9999, firstTimers: 9999, visitors: 9999, volunteers: 9999, firstTimeVolunteers: 9999 };
const clubs = ['R25','R50','R100','R250','R500','R1000','V25','V50','V100','V250'];
const line = (n, c) => clubs.slice(0, n).map(k => `${c}x${k}`).join(', ');
const canv = [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270],[1080,1350],[1200,628],[1080,566],[800,800],[600,600],[540,960],[720,1280],[1000,800],[960,540],[1024,768],[400,400],[360,640],[500,500],[300,600],[600,300]];
for (const c of [1, 99, 999]) {
  console.log(`--- captions with count ${c}`);
  for (const [w,h] of canv) {
    const res = [];
    for (let n = 1; n <= 10; n++) {
      try { const { L } = m.settleLayout({ counts: MAX, milestones: line(n, c) }, w, h); res.push(`${n}:${L.captionPx}`); }
      catch (e) { res.push(`${n}:X`); }
    }
    console.log(`${w}x${h}`.padEnd(10), res.join(' '));
  }
}
