// Why do mid-size canvases refuse 6-10 clubs? Unsnapped vs settled-pitch badge numbers.
const path = require('path');
const root = path.resolve(__dirname, '../../../..');
const m = require(path.join(root, 'dist/community/weekly-run-report/v1/weekly-run-report.js'));
const ALL = ["6xR25", "4xR50", "3xR100", "2xR250", "1xR500", "1xR1000", "5xV25", "3xV50", "2xV100", "1xV250"];
const cases = JSON.parse(process.argv[2]);
for (const [w, h, n] of cases) {
  const props = { milestones: ALL.slice(0, n).join(", ") };
  const pitch = m.settleLayout({ milestones: ALL.slice(0, 5).join(", ") }, w, h).pitch;
  const show = (pt) => { try { const L = m.layoutWeeklyRunReport(props, w, h, pt); const b = L.badges[0].rect; return `ok shape=${L.shape} small=${L.small} badge=${b.w}x${b.h} club=${L.badgePx} cap=${L.captionPx} rows=${[...new Set(L.badges.map(x=>x.rect.y))].length}`; } catch (e) { return 'NO ' + e.message.replace(/^.*?: /, '').slice(0, 60); } };
  console.log(`${w}x${h} n=${n} pitch=${JSON.stringify(pitch)}\n   exact: ${show({x:1,y:1})}\n   snap : ${show(pitch)}`);
}
