const path = require('path');
const root = path.resolve(__dirname, '../../../..');
const m = require(path.join(root, 'dist/community/weekly-run-report/v1/weekly-run-report.js'));
function ctx(w, h) {
  const target = { width: w, height: h, fps: 30, durationMs: 2000 };
  return { mode: 'render', target, output: { ...target, workspaceDir: '/tmp/probe' }, media: {} };
}
async function render(props, w = 1080, h = 1080) {
  return m.WeeklyRunReportV1.render(props, ctx(w, h));
}
function texts(doc) {
  const out = [];
  const visit = (srcs, where) => {
    for (const s of Object.values(srcs || {})) {
      const t = s && s.layers && s.layers[0] && s.layers[0].content && s.layers[0].content.text;
      if (t !== undefined) out.push({ where, label: s.editor && s.editor.label, text: t, src: s });
    }
  };
  visit(doc.sources, 'root');
  for (const [k, c] of Object.entries(doc.children || {})) visit(c.sources, k);
  return out;
}
async function tryIt(fn) { try { return { ok: true, v: await fn() }; } catch (e) { return { ok: false, err: e.message }; } }
module.exports = { m, ctx, render, texts, tryIt, root };
