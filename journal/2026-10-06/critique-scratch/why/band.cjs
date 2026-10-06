const path = require('path');
const m = require(path.resolve(__dirname, '../../../../dist/community/weekly-run-report/v1/weekly-run-report.js'));
const BIG = { finishers: 677, newPbs: 102, firstTimers: 16, visitors: 54, volunteers: 50, firstTimeVolunteers: 1 };
for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920]]) for (const ms of ['', '1xR25', '4xR25, 3xR50, 1xR100, 2xV25', '1xR25, 1xR50, 1xR100, 1xR250, 1xR500, 1xV25, 1xV50, 1xV100, 1xV250, 1xV500']) {
  const { L } = m.settleLayout({ counts: BIG, milestones: ms }, w, h);
  console.log(`${w}x${h} n=${L.badges.length} band=${JSON.stringify(L.band)}`);
}
// Rushmoor parkrun #522, 2026-10-03, counted from the public results page by this critic.
const rushmoor = { eventName: 'Rushmoor parkrun', runNumber: 522, date: '2026-10-03', counts: BIG, milestones: '3xR25, 1xR50, 3xR200, 1xR250, 1xV250', footer: '' };
try { m.normalizeWeeklyRunReport(rushmoor); console.log('rushmoor accepted'); } catch (e) { console.log('rushmoor REFUSED:', e.message); }
