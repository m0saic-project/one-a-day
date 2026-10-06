const path = require('path');
const root = path.resolve(__dirname, '../../../..');
const { settleLayout } = require(path.join(root, 'dist/community/weekly-run-report/v1/weekly-run-report.js'));
const TEN = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250";
const SIX = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 5xV25";
const FIVE = "6xR25, 4xR50, 3xR100, 2xR250, 5xV25";
const MAXED = { finishers: 9999, newPbs: 9999, firstTimers: 9999, visitors: 9999, volunteers: 9999, firstTimeVolunteers: 9999 };
const sets = { def: {}, five: { milestones: FIVE }, six: { milestones: SIX }, ten: { milestones: TEN }, maxed: { counts: MAXED, runNumber: 9999 }, long: { eventName: 'Great Salterns Nature Reserve 5k Juniors' }, name32: { eventName: 'Great Salterns Nature Reserve 5k' }, foot70: { footer: 'Thanks to all 31 volunteers - see you next Saturday at 9am by the cafe' }, big999: { milestones: '999xR25, 999xR50, 999xV25, 999xV1000' } };
const canv = JSON.parse(process.argv[2]);
for (const [w, h] of canv) {
  const bad = [];
  for (const [n, p] of Object.entries(sets)) { try { settleLayout(p, w, h); } catch (e) { bad.push(n + '(' + (e.message.match(/: (\S+) cannot/)||[])[1] + ')'); } }
  console.log(`${w}x${h}`, bad.length ? 'REFUSED: ' + bad.join(' ') : 'ok');
}
