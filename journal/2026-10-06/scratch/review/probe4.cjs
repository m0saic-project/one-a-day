// Trace the badge fit at 1600x900 (ten) and 1000x800 (six) for pitch 1 vs the settled pitch.
const path = require('path');
const root = path.resolve(__dirname, '../../../..');
const M = require(path.join(root, 'dist/community/weekly-run-report/v1/weekly-run-report.js'));
const { widthOf, budget } = require(path.join(root, 'dist/_shared/text.js'));
const TEN = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250";
const SIX = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 5xV25";
for (const [W, H, ms, pitches] of [[1600, 900, TEN, [{x:1,y:1},{x:4,y:3}]], [1000, 800, SIX, [{x:1,y:1},{x:2,y:2},{x:4,y:4},{x:5,y:5}]], [1280, 720, TEN, [{x:1,y:1},{x:2,y:2}]]]) {
  for (const p of pitches) {
    // find the badge rects by catching: monkeypatch not possible; re-run with milestones replaced by the same count of shortest captions
    try { const L = M.layoutWeeklyRunReport({ milestones: ms }, W, H, p); console.log(W, H, p, 'ok small', L.small, 'cap', L.captionPx, 'club', L.badgePx, 'badge', JSON.stringify(L.badges[0].rect), 'band', JSON.stringify(L.band)); }
    catch (e) { console.log(W, H, p, 'REFUSED', e.message.slice(42, 120)); }
  }
}
// at 1000x800 what pitch does settle find for the def layout?
try { const { pitch } = M.settleLayout({}, 1000, 800); console.log('1000x800 def pitch', pitch); } catch (e) { console.log(e.message); }
console.log('caption widths', ['6 runners','5 volunteers','1 volunteer'].map(t => [t, widthOf(t, 13, false).toFixed(1), widthOf(t, 11, false).toFixed(1)]));
