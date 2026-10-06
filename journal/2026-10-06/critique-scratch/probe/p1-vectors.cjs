const { m, render, texts, tryIt } = require('./lib.cjs');
const C = { finishers: 214, newPbs: 38, firstTimers: 27, visitors: 19, volunteers: 31, firstTimeVolunteers: 4 };
const badgeList = (doc) => {
  const t = texts(doc); const out = [];
  for (let i = 1; i <= 10; i++) {
    const club = t.find(x => x.label === `badge-club-${i}`); if (!club) break;
    const cap = t.find(x => x.label === `badge-caption-${i}`);
    const child = doc.children[`badge-${i}`];
    const fill = Object.values(child.sources).find(s => s.editor && s.editor.label === 'badge');
    out.push(`${club.text} '${cap.text}' fill=${fill && fill.color}`);
  }
  return out;
};
const rows = (doc) => {
  const ys = {};
  for (let i = 1; i <= 10; i++) {
    const src = Object.values(doc.sources).find(s => s.editor && s.editor.label === `badge-${i}`);
    if (!src) break;
    const k = JSON.stringify(src.placement && src.placement.inset ? src.placement.inset.top.toFixed(4) : '?');
    ys[k] = (ys[k] || 0) + 1;
  }
  return ys;
};
(async () => {
  const cases = [
    ['4xR25, 3xR50, 1xR100, 2xV25', {}],
    ['1xr100,4xR25', {}],
    ['', {}],
    ['4xR30', {}],
    ['4xR25, 2xR25', {}],
    ['6 entries: 1xR25,1xR50,1xR100,1xR250,1xR500,1xR1000', {}],
    ['10 entries', {}],
    ['11 entries', {}],
  ];
  const TEN = '6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250';
  const ms = {
    '6 entries: 1xR25,1xR50,1xR100,1xR250,1xR500,1xR1000': '1xR25,1xR50,1xR100,1xR250,1xR500,1xR1000',
    '10 entries': TEN,
    '11 entries': TEN + ', 1xV500',
  };
  for (const [label] of cases) {
    const milestones = ms[label] ?? label;
    for (const [w, h] of [[1080, 1080], [1080, 1920], [1920, 1080]]) {
      const r = await tryIt(() => render({ milestones }, w, h));
      if (!r.ok) { console.log(`[${label}] ${w}x${h} REFUSED: ${r.err}`); continue; }
      const doc = r.v; const t = texts(doc);
      const empty = t.find(x => x.label === 'milestone-empty');
      console.log(`[${label}] ${w}x${h} badges=${JSON.stringify(badgeList(doc))} rows=${JSON.stringify(rows(doc))} empty=${empty ? JSON.stringify(empty.text) : '-'}`);
    }
  }
  // counts finishers 1204
  const r = await render({ counts: { ...C, finishers: 1204 } });
  console.log('finishers 1204 ->', JSON.stringify(texts(r).find(x => x.label === 'value-finishers').text));
  for (const d of ['2026-10-03', '2026-02-30']) {
    const q = await tryIt(() => render({ date: d }));
    console.log(`date ${d} ->`, q.ok ? JSON.stringify(texts(q.v).find(x => x.label === 'run-date').text) : 'REFUSED: ' + q.err);
  }
  // Refusals from Rules, not props
  const refusals = [
    ['counts unknown key pb', { counts: { ...C, pb: 3 } }],
    ['counts missing key visitors', { counts: (() => { const c = { ...C }; delete c.visitors; return c; })() }],
    ['counts finishers 0', { counts: { ...C, finishers: 0, newPbs: 0, firstTimers: 0, visitors: 0 }, milestones: '' }],
    ['counts newPbs>finishers', { counts: { ...C, newPbs: 215 } }],
    ['counts firstTimers>finishers', { counts: { ...C, firstTimers: 215 } }],
    ['counts visitors>finishers', { counts: { ...C, visitors: 215 } }],
    ['counts ftv>vol', { counts: { ...C, firstTimeVolunteers: 32 } }],
    ['counts 10000', { counts: { ...C, finishers: 10000 } }],
    ['counts float', { counts: { ...C, newPbs: 3.5 } }],
    ['counts negative', { counts: { ...C, newPbs: -1 } }],
    ['counts string number', { counts: { ...C, newPbs: '38' } }],
    ['counts null', { counts: null }],
    ['counts array', { counts: [1, 2] }],
    ['counts bad JSON string', { counts: '{finishers: 214' }],
    ['counts valid JSON string', { counts: JSON.stringify(C) }],
    ['counts JSON string "null"', { counts: 'null' }],
    ['counts NaN', { counts: { ...C, newPbs: NaN } }],
    ['counts Infinity', { counts: { ...C, newPbs: Infinity } }],
    ['milestones R30', { milestones: '4xR30' }],
    ['milestones dup', { milestones: '4xR25, 2xR25' }],
    ['milestones 11', { milestones: TEN + ', 1xV500' }],
    ['milestones count 1000', { milestones: '1000xR25' }],
    ['milestones runners>finishers', { milestones: '200xR25, 20xR50' }],
    ['milestones vols>volunteers', { milestones: '32xV25' }],
    ['date 2026-02-30', { date: '2026-02-30' }],
    ['date garbage', { date: 'next saturday' }],
    ['date number', { date: 20261003 }],
    ['eventName emoji', { eventName: 'Park 5k \u{1F3C3}' }],
    ['eventName CJK', { eventName: '公園 5k' }],
    ['eventName empty', { eventName: '' }],
    ['eventName 41 chars', { eventName: 'A'.repeat(41) }],
    ['eventName with ÿ (upper Ÿ U+0178)', { eventName: 'Hÿde Park 5k' }],
    ['eventName with ß (upper SS)', { eventName: 'Straße 5k' }],
    ['eventName with ŉ', { eventName: 'ŉ Park' }],
    ['footer emoji', { footer: 'Thanks ❤' }],
    ['footer smart quote', { footer: 'Thanks to all ’our’ volunteers' }],
    ['footer en dash', { footer: 'Next run 10–17 Oct' }],
    ['footer 300 chars', { footer: 'x '.repeat(150) }],
    ['runNumber 0', { runNumber: 0 }],
    ['runNumber 10000', { runNumber: 10000 }],
    ['runNumber 3.5', { runNumber: 3.5 }],
    ['runNumber "313"', { runNumber: '313' }],
    ['accent bad', { accent: 'green' }],
    ['accent #abc', { accent: '#abc' }],
    ['accent ""', { accent: '' }],
    ['accent low contrast #ffff00', { accent: '#ffff00' }],
    ['debugLayout "true"', { debugLayout: 'true' }],
    ['unknown prop count', { count: C }],
    ['unknown prop title', { title: 'x' }],
    ['null prop eventName', { eventName: null }],
    ['null milestones', { milestones: null }],
  ];
  for (const [label, props] of refusals) {
    const q = await tryIt(() => render(props));
    if (q.ok) {
      const t = texts(q.v);
      const pick = (l) => (t.find(x => x.label === l) || {}).text;
      console.log(`ACCEPTED [${label}] name=${JSON.stringify(pick('event-name') ?? pick('event-name-1'))} footer=${JSON.stringify(pick('footer'))} run=${JSON.stringify(pick('run-number'))} newPbs=${JSON.stringify(pick('value-newPbs'))} heroColor=${(texts(q.v).find(x => x.label === 'value-finishers').src.layers[0].content.color) || JSON.stringify(texts(q.v).find(x => x.label === 'value-finishers').src.layers[0].content).slice(0,200)}`);
    } else console.log(`REFUSED  [${label}] ${q.err}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
