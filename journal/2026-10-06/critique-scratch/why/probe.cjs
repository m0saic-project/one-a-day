// Critic probe (why-tutorial truth). Read-only: requires the built dist module.
const path = require('path');
const m = require(path.resolve(__dirname, '../../../../dist/community/weekly-run-report/v1/weekly-run-report.js'));

const DEF = { finishers: 214, newPbs: 38, firstTimers: 27, visitors: 19, volunteers: 31, firstTimeVolunteers: 4 };
const BIG = { finishers: 9999, newPbs: 38, firstTimers: 27, visitors: 19, volunteers: 9999, firstTimeVolunteers: 4 };
const R = ['R25', 'R50', 'R100', 'R250', 'R500', 'R1000'];
const V = ['V25', 'V50', 'V100', 'V250', 'V500', 'V1000'];
// n clubs: alternate run/volunteer so both caption words appear.
function clubs(n) { const out = []; for (let i = 0; out.length < n; i++) { if (i < 6) out.push(R[i]); if (out.length < n && i < 6) out.push(V[i]); } return out.slice(0, n); }
function line(n, digits) {
  const c = digits === 1 ? 1 : digits === 2 ? 12 : 120;
  return clubs(n).map((k) => `${c}x${k}`).join(', ');
}
function run(label, props, W, H) {
  try {
    const { L } = m.settleLayout(props, W, H);
    const rows = [];
    const ys = [...new Set(L.badges.map((b) => b.rect.y))];
    for (const y of ys) rows.push(L.badges.filter((b) => b.rect.y === y).length);
    const empty = L.cells.find((c) => c.label === 'milestone-empty');
    console.log(`${label.padEnd(34)} ${W}x${H} OK rows=[${rows}] badge=${L.badges[0] ? L.badges[0].rect.w + 'x' + L.badges[0].rect.h : '-'} club=${L.badgePx}px cap=${L.captionPx}px small=${L.small} floor=${L.floor} hero=${L.heroPx} stat=${L.statPx} ratio=${(L.heroPx / L.statPx).toFixed(3)}${empty ? ' empty="' + empty.text + '" band=' + JSON.stringify(L.band) : ''}`);
  } catch (e) {
    console.log(`${label.padEnd(34)} ${W}x${H} REFUSED ${e.message.replace(/^.*?: /, '')}`);
  }
}

const which = process.argv[2] || 'all';
if (which === 'all' || which === 'thumb') {
  console.log('--- 480x270, clubs 1..10, caption digits 1/2/3 ---');
  for (let n = 1; n <= 10; n++) for (const d of [1, 2, 3]) {
    const counts = d === 1 ? DEF : d === 2 ? (n * 12 <= 31 ? DEF : BIG) : BIG;
    run(`n=${n} digits=${d} ${counts === DEF ? 'def' : 'big'}counts`, { counts, milestones: line(n, d) }, 480, 270);
  }
  console.log('--- 480x270, default counts, 2-digit run captions only (valid under 214 finishers) ---');
  for (let n = 5; n <= 6; n++) {
    const ms = R.slice(0, n).map((k) => `12x${k}`).join(', ');
    run(`n=${n} 12xR* defcounts`, { milestones: ms }, 480, 270);
  }
}
if (which === 'all' || which === 'canv') {
  console.log('--- contract canvases, 10 clubs, 3-digit captions (BIG counts) ---');
  for (const [w, h] of [[1920, 1080], [1280, 720], [1080, 1920], [1080, 1080], [3840, 2160], [640, 360], [480, 270]]) {
    run('n=10 digits=3', { counts: BIG, milestones: line(10, 3) }, w, h);
    run('n=10 digits=2', { counts: BIG, milestones: line(10, 2) }, w, h);
    run('n=6 digits=3', { counts: BIG, milestones: line(6, 3) }, w, h);
  }
  console.log('--- defaults and empty week ---');
  for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920], [480, 270]]) {
    run('defaults', {}, w, h);
    run('milestones ""', { milestones: '' }, w, h);
    run('n=6 digits=1', { milestones: line(6, 1) }, w, h);
    run('n=4 digits=1', { milestones: line(4, 1) }, w, h);
  }
}
if (which === 'all' || which === 'clubs') {
  console.log('--- real parkrun clubs the card may refuse ---');
  for (const ms of ['1xR10', '1xV10', '1xR200', '2xR300', '1xR400', '1xV200', '1xR11', '1xR21', '4xR25, 1xR200, 2xV25']) {
    try { m.normalizeWeeklyRunReport({ milestones: ms }); console.log(`${ms.padEnd(24)} accepted`); }
    catch (e) { console.log(`${ms.padEnd(24)} REFUSED ${e.message.replace(/^.*?: /, '')}`); }
  }
  console.log('--- runstats line verbatim (from rwkura README) ---');
  for (const ms of ['4xR25, 4xR50, 1xR100', '2xV25, 1xV50']) {
    try { const p = m.normalizeWeeklyRunReport({ milestones: ms }); console.log(`${ms.padEnd(24)} -> ${p.milestones.map((b) => b.kind + b.club + ':' + b.caption).join(' | ')}`); }
    catch (e) { console.log(`${ms.padEnd(24)} REFUSED ${e.message}`); }
  }
}
if (which === 'all' || which === 'usage') {
  console.log('--- the Use-it page week.json, with real-looking counts and no milestones key ---');
  const week = { eventName: 'Your Park 5k', runNumber: 313, date: '2026-10-10', counts: { finishers: 160, newPbs: 20, firstTimers: 15, visitors: 10, volunteers: 22, firstTimeVolunteers: 2 }, footer: '' };
  const p = m.normalizeWeeklyRunReport(week);
  console.log('milestones rendered:', p.milestones.map((b) => b.club + ' ' + b.caption).join(' | '));
  console.log('date:', p.date, 'run:', p.runText, 'footer:', JSON.stringify(p.footer));
  console.log('--- accent #7a3b8f ---');
  const p2 = m.normalizeWeeklyRunReport({ accent: '#7a3b8f' });
  console.log('accent', p2.accent, 'heroInk', p2.heroInk, 'contrast vs #fbfbfb', m.contrast('#7a3b8f', '#fbfbfb').toFixed(2));
  for (const a of ['#3e3e78', '#ffa300', '#2b233d', '#4d3691', '#1f7a4d']) console.log(a, 'contrast vs tile', m.contrast(a, '#fbfbfb').toFixed(2), 'heroInk', m.normalizeWeeklyRunReport({ accent: a }).heroInk);
  console.log('--- counts as literal {...} placeholder ---');
  try { m.normalizeWeeklyRunReport({ counts: '{...}' }); } catch (e) { console.log('REFUSED', e.message.replace(/^.*?: /, '')); }
}
