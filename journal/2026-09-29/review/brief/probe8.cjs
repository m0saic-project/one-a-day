const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const ctx = (w, h) => ({ mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
(async () => {
  const tpl = T.CrosswordGridCardV1;
  const doc = await tpl.render({ ...tpl.defaultProps, solved: false }, ctx(1080, 1080));
  const s = JSON.stringify(doc);
  for (const needle of ["DOGSLED", "CATNAPS", "PAN#BOW", "THEME ANSWERS"]) console.log(needle, s.includes(needle));
  const labels = doc.sources.map(x => x.editor && x.editor.label);
  console.log(labels.join(","));
  const intent = doc.editor && (doc.editor.layoutIntent || doc.editor.layout);
  console.log(Object.keys(doc.editor || {}));
  const li = doc.editor.layoutIntent;
  if (li) console.log(JSON.stringify(li.constraints.map(c => c.label)), JSON.stringify(li.relations));
})().catch(e => { console.error(e); process.exit(1); });
