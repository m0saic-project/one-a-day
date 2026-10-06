const path = require('path');
const root = path.resolve(__dirname, '../../../..');
const { settleLayout, layoutWeeklyRunReport } = require(path.join(root, 'dist/community/weekly-run-report/v1/weekly-run-report.js'));
const TEN = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250";
const SIX = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 5xV25";
const mode = process.argv[2];
if (mode === '169') {
  for (let w = 1280; w <= 3840; w += 16) { const h = Math.round(w * 9 / 16); const r = [];
    for (const [n, s] of [['ten', TEN], ['six', SIX]]) { try { const { L, pitch } = settleLayout({ milestones: s }, w, h); r.push(`${n}:ok(${L.captionPx}/${L.badgePx} p${pitch.x},${pitch.y})`); } catch (e) { r.push(`${n}:REFUSED`); } }
    console.log(`${w}x${h}`, r.join(' '));
  }
}
if (mode === 'sq') {
  for (const [w, h] of [[1080,1080],[1200,1000],[1250,1000],[1280,1000],[1290,1000],[1299,1000],[1080,1350],[1080,1300],[1080,1200],[1350,1080],[1400,1080],[1404,1080]]) { const r = [];
    for (const [n, s] of [['ten', TEN], ['six', SIX], ['def', undefined]]) { try { const { L, pitch } = settleLayout(s === undefined ? {} : { milestones: s }, w, h); r.push(`${n}:ok(cap${L.captionPx}/club${L.badgePx} small${L.small} p${pitch.x},${pitch.y} shape ${L.shape} band ${L.band.w}x${L.band.h})`); } catch (e) { r.push(`${n}:REFUSED ${e.message.slice(60,140)}`); } }
    console.log(`${w}x${h}`, r.join(' | '));
  }
}
