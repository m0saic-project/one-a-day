const M = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
const tryIt = (name, f) => { try { console.log(name, '=>', JSON.stringify(f())); } catch (e) { console.log(name, '=> THROW', e.message); } };
const show = (s) => M.parseMilestones(s).map(b => `${b.kind}${b.club} ${b.caption}`);
tryIt('v1', () => show('4xR25, 3xR50, 1xR100, 2xV25'));
tryIt('v2', () => show('1xr100,4xR25'));
tryIt('v3', () => show(''));
tryIt('v4', () => show('4xR30'));
tryIt('v5', () => show('4xR25, 2xR25'));
const SIX = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 5xV25";
const TEN = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250";
const rows = (s, w, h) => { const ys = M.settleLayout({ milestones: s }, w, h).L.badges.map(b => b.rect.y); return [...new Set(ys)].map(y => ys.filter(v => v === y).length); };
const canv = [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270],[720,1280],[1080,1350],[1200,628],[1500,500]];
for (const [w,h] of canv) { tryIt(`six ${w}x${h}`, () => rows(SIX,w,h)); }
for (const [w,h] of canv) { tryIt(`ten ${w}x${h}`, () => rows(TEN,w,h)); }
tryIt('v8 11', () => show(TEN + ', 1xV500'));
tryIt('v9', () => M.formatCount(1204));
tryIt('v9 render', () => M.settleLayout({counts:{finishers:1204,newPbs:38,firstTimers:27,visitors:19,volunteers:31,firstTimeVolunteers:4}},1080,1080).L.cells.find(c=>c.label==='value-finishers').text);
tryIt('v10', () => M.formatRunDate('2026-10-03'));
tryIt('v11', () => M.normalizeWeeklyRunReport({date:'2026-02-30'}));
tryIt('empty', () => M.settleLayout({milestones:''},1080,1080).L.cells.filter(c=>c.label.startsWith('milestone')||c.label.startsWith('badge')).map(c=>c.text));
