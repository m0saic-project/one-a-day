const m = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
for (const [w,h] of [[1080,1080],[1920,1080],[1080,1920],[1280,720],[3840,2160]]) {
  const { L, pitch } = m.settleLayout({}, w, h);
  const hr = L.tiles.find(t=>t.label==='header-rule').rect;
  const edges = (rs) => `${Math.min(...rs.map(r=>r.x))}..${Math.max(...rs.map(r=>r.x+r.w))}`;
  console.log(`${w}x${h} pitch ${pitch.x}x${pitch.y} rule ${hr.x}..${hr.x+hr.w} band ${L.band.x}..${L.band.x+L.band.w} hero ${edges(L.heroRects)} stat ${edges(L.statRects)} heroWH ${L.heroRects[0].w}x${L.heroRects[0].h} statWH ${L.statRects[0].w}x${L.statRects[0].h}`);
}
// unknown prop with undefined value; ß uppercase length; ŉ
for (const p of [{ colour: undefined }, { eventName: 'Straße ' + 'ß'.repeat(33) }, { eventName: 'ŉ Park' }, { milestones: '1000xR25' }, { milestones: '0xR25' }, { date: '1899-12-31' }, { runNumber: 1.5 }, { counts: '{"finishers":214}' }]) {
  try { const r = m.normalizeWeeklyRunReport(p); console.log(JSON.stringify(p), '-> ok', r.title, r.title.length); } catch (e) { console.log(JSON.stringify(p), '->', e.message); }
}
