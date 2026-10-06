const path = require('path');
const root = path.resolve(__dirname, '../../../..');
const M = require(path.join(root, 'dist/community/weekly-run-report/v1/weekly-run-report.js'));
const { widthOf, budget } = require(path.join(root, 'dist/_shared/text.js'));
const { settleLayout, WeeklyRunReportV1 } = M;
const ctx = (w, h) => ({ mode: 'render', target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: '/tmp/x' }, media: {} });
const TEN = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250";
const SIX = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 5xV25";
const MAXED = { finishers: 9999, newPbs: 9999, firstTimers: 9999, visitors: 9999, volunteers: 9999, firstTimeVolunteers: 9999 };
const canvases = (process.argv[2] ? JSON.parse(process.argv[2]) : [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270],[1000,1000],[1366,768],[1200,630],[720,1280],[2000,500],[500,2000],[1080,1350],[1080,1350],[1200,1200],[1600,900],[800,600],[1024,768],[1440,1440],[2560,1440],[1080,1440],[1350,1080],[1300,1000],[1299,1000],[800,1000],[799,1000],[600,600],[400,400],[1920,1200],[2048,2048],[1170,2532],[1284,2778],[1125,2436],[1242,2688],[828,1792],[750,1334],[1500,500],[3000,1000],[1001,1001],[999,999],[1079,1079],[1081,1081]]);
const sets = { def: {}, ten: { milestones: TEN }, six: { milestones: SIX }, empty: { milestones: '' }, maxed: { counts: MAXED, runNumber: 9999 }, long: { eventName: 'Great Salterns Nature Reserve 5k Juniors' }, nofoot: { footer: '' }, nodate: { date: '' }, one: { milestones: '1xR100' } };
const bad = [];
const inside = (a, b) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
(async () => {
for (const [W, H] of canvases) for (const [name, props] of Object.entries(sets)) {
  let L, pitch;
  try { ({ L, pitch } = settleLayout(props, W, H)); } catch (e) { bad.push(`${W}x${H} ${name}: THROW ${e.message.slice(0, 160)}`); continue; }
  const tag = `${W}x${H} ${name} pitch=${pitch.x},${pitch.y}`;
  const all = [...L.tiles.map(t => ['tile:' + t.label, t.rect]), ...L.cells.map(c => ['cell:' + c.label, c.rect])];
  for (const [l, r] of all) {
    if (!(r.w > 0 && r.h > 0)) bad.push(`${tag}: ${l} non-positive ${JSON.stringify(r)}`);
    if (![r.x, r.y, r.w, r.h].every(Number.isInteger)) bad.push(`${tag}: ${l} non-integer ${JSON.stringify(r)}`);
    if (!inside(r, { x: 0, y: 0, w: W, h: H })) bad.push(`${tag}: ${l} off-canvas ${JSON.stringify(r)}`);
  }
  for (const c of L.cells) {
    const w = widthOf(c.text, c.px, c.bold);
    if (w > budget(c.rect.w)) bad.push(`${tag}: ${c.label} '${c.text}' ${c.px}px width ${w.toFixed(1)} > budget ${budget(c.rect.w)} (cell ${c.rect.w})`);
    if (c.rect.h < Math.ceil(c.px * 1.22)) bad.push(`${tag}: ${c.label} h ${c.rect.h} < lineH ${Math.ceil(c.px*1.22)}`);
    if (c.group) { const g = L.groups.find(g => g.key === c.group); if (!inside(c.rect, g.rect)) bad.push(`${tag}: ${c.label} outside its group ${JSON.stringify(c.rect)} vs ${JSON.stringify(g.rect)}`); }
  }
  // tiles that must not overlap each other
  const blocks = [...L.heroRects.map((r,i)=>['hero'+i,r]), ...L.statRects.map((r,i)=>['stat'+i,r]), ['band', L.band], ...L.tiles.filter(t=>t.label==='header-rule').map(t=>['rule',t.rect])];
  const foot = L.cells.find(c => c.label === 'footer'); if (foot) blocks.push(['footer', foot.rect]);
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) if (overlap(blocks[i][1], blocks[j][1])) bad.push(`${tag}: overlap ${blocks[i][0]} ${JSON.stringify(blocks[i][1])} & ${blocks[j][0]} ${JSON.stringify(blocks[j][1])}`);
  // header cells must not overlap tiles
  for (const c of L.cells.filter(c => /^(event-name|run-)/.test(c.label))) for (const [l, r] of blocks) if (l !== 'rule' && overlap(c.rect, r)) bad.push(`${tag}: header cell ${c.label} overlaps ${l}`);
  for (const c of L.cells.filter(c => /^(event-name|run-)/.test(c.label))) for (const d of L.cells.filter(d => d !== c && /^(event-name|run-)/.test(d.label))) if (overlap(c.rect, d.rect)) bad.push(`${tag}: header cells ${c.label} & ${d.label} overlap ${JSON.stringify(c.rect)} ${JSON.stringify(d.rect)}`);
  const rule = L.tiles.find(t=>t.label==='header-rule').rect;
  for (const c of L.cells.filter(c => /^(event-name|run-)/.test(c.label))) if (overlap(c.rect, rule)) bad.push(`${tag}: header cell ${c.label} overlaps rule ${JSON.stringify(c.rect)} ${JSON.stringify(rule)}`);
  for (const t of L.tiles.filter(t => t.label === 'run-sep')) if (overlap(t.rect, rule)) bad.push(`${tag}: run-sep overlaps rule`);
  // badges inside band, no overlaps
  for (const b of L.badges) if (!inside(b.rect, L.band)) bad.push(`${tag}: badge outside band ${JSON.stringify(b.rect)} band ${JSON.stringify(L.band)}`);
  for (let i = 0; i < L.badges.length; i++) for (let j = i + 1; j < L.badges.length; j++) if (overlap(L.badges[i].rect, L.badges[j].rect)) bad.push(`${tag}: badges ${i},${j} overlap`);
  const bt = L.cells.find(c => c.label === 'band-title');
  for (const b of L.badges) if (overlap(b.rect, bt.rect)) bad.push(`${tag}: badge overlaps band title ${JSON.stringify(b.rect)} ${JSON.stringify(bt.rect)}`);
  if (!inside(bt.rect, L.band)) bad.push(`${tag}: band-title outside band`);
  const em = L.cells.find(c => c.label === 'milestone-empty'); if (em && !inside(em.rect, L.band)) bad.push(`${tag}: empty line outside band`);
  if (em && overlap(em.rect, bt.rect)) bad.push(`${tag}: empty line overlaps title`);
  // hero >= 1.5 stat
  if (L.heroPx < 1.5 * L.statPx) bad.push(`${tag}: hero ${L.heroPx} < 1.5*stat ${L.statPx}`);
  // render
  try {
    const doc = await WeeklyRunReportV1.render({ ...WeeklyRunReportV1.defaultProps, ...props }, ctx(W, H));
    const refs = doc.sources.filter(s => s.type === 'mosaic');
    for (const r of refs) if (r.placement && r.placement.inset) bad.push(`${tag}: ref ${r.ref} has inset ${JSON.stringify(r.placement.inset)}`);
    const smooth = (n) => { if (!Number.isInteger(n) || n < 1) return false; let k = n; for (const f of [2,3,5]) while (k % f === 0) k /= f; return k === 1; };
    for (const [k, c] of Object.entries(doc.children || {})) if (!smooth(c.size.width) || !smooth(c.size.height)) bad.push(`${tag}: child ${k} size ${c.size.width}x${c.size.height} not 5-smooth`);
  } catch (e) { bad.push(`${tag}: RENDER THROW ${e.message.slice(0, 200)}`); }
}
console.log(bad.length ? bad.join('\n') : 'ALL OK');
})();
