const { m, render, tryIt, texts } = require('./lib.cjs');
const CANV = [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270]];
const TEN = '6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250';
const MAX = { finishers: 9999, newPbs: 9999, firstTimers: 9999, visitors: 9999, volunteers: 9999, firstTimeVolunteers: 9999 };
const sets = [
  ['defaults', {}, CANV],
  ['milestones ""', { milestones: '' }, CANV],
  ['ten clubs', { milestones: TEN }, CANV.filter(([w]) => w >= 640)],
  ['ten clubs @480', { milestones: TEN }, [[480,270]]],
  ['eventName juniors (40ch)', { eventName: 'Great Salterns Nature Reserve 5k Juniors' }, CANV],
  ['counts all 9999', { counts: MAX }, CANV],
  ['footer ""', { footer: '' }, CANV],
  ['date ""', { date: '' }, CANV],
  ['all stress', { eventName: 'Great Salterns Nature Reserve 5k Juniors', counts: MAX, milestones: TEN, footer: 'Thanks to our 31 volunteers - next run Saturday 10 October, 9am sharp!' }, CANV.filter(([w]) => w >= 640)],
  ['70ch footer', { footer: 'Thanks to our 31 volunteers - next run Saturday 10 October, 9am sharp!' }, CANV],
  ['ten clubs + footer "" + date ""', { milestones: TEN, footer: '', date: '' }, CANV.filter(([w]) => w >= 640)],
  ['runNumber 9999 + long date', { runNumber: 9999, date: '2026-12-30' }, CANV],
];
(async () => {
  for (const [name, props, canv] of sets) {
    const row = [];
    for (const [w, h] of canv) {
      const r = await tryIt(() => render({ ...props, debugLayout: true }, w, h));
      if (!r.ok) { row.push(`${w}x${h} REFUSED(${r.err.replace(/^.*?v1: /, '').slice(0, 90)})`); continue; }
      const lc = r.v.editor.layoutContract;
      row.push(`${w}x${h} ${lc.ok ? 'ok' : 'FAIL'}${lc.violations.length ? ' ' + JSON.stringify(lc.violations).slice(0, 400) : ''} (${lc.constraintCount})`);
    }
    console.log(`[${name}]\n  ` + row.join('\n  '));
  }
})();
