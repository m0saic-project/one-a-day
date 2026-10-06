const m = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
const lay = require('../../../../dist/_shared/layout.js');
const T = m.WeeklyRunReportV1;
const ctx = (w,h) => ({ mode: 'render', target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: '/tmp/x' }, media: {} });
(async () => {
  for (const [w,h,over] of [[1080,1080,{}],[1920,1080,{}],[1080,1080,{milestones:''}],[1080,1920,{eventName:'Great Salterns Nature Reserve 5k Juniors'}]]) {
    const doc = await T.render({ ...T.defaultProps, ...over }, ctx(w,h));
    const intent = lay.layoutIntentOf(doc);
    const res = lay.checkLayoutIntent(doc, w, h);
    const nonText = intent.constraints.filter(c => !c.textFits);
    console.log(`${w}x${h} ${JSON.stringify(over)} ok=${res.ok} constraints=${intent.constraints.length} textFits=${intent.constraints.filter(c=>c.textFits).length}`);
    console.log('  non-text:', JSON.stringify(nonText));
    console.log('  relations:', JSON.stringify(intent.relations));
    console.log('  resolved counts:', ['hero-tile','stat-tile','badge','milestone-band','header-rule','event-name','event-name-1','event-name-2','footer'].map(l => `${l}=${(res.resolved[l]||[]).length}`).join(' '));
    const labels = intent.constraints.filter(c=>c.textFits).map(c=>c.label);
    console.log('  textFits labels:', labels.join(','));
    if (!res.ok) console.log(res.violations);
  }
  // Child documents and overlay
  const doc = await T.render({ ...T.defaultProps }, ctx(1080,1080));
  console.log('children:', Object.keys(doc.children).length, 'parent sources:', doc.sources.length);
  // Find unbound sources that show a prop
  const walk = (d, path) => (d.sources||[]).map(s => ({ path, label: s.editor && s.editor.label, binding: s.editor && (s.editor.binding || s.editor.bindings), type: s.type }));
  const all = [...walk(doc,'parent'), ...Object.entries(doc.children).flatMap(([k,c]) => walk(c,k))];
  for (const s of all) console.log(`  ${s.path.padEnd(22)} ${String(s.type).padEnd(8)} ${String(s.label).padEnd(28)} ${s.binding ? JSON.stringify(s.binding) : '-'}`);
})().catch(e => { console.error(e); process.exit(1); });
