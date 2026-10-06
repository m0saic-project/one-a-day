const { m, render, texts } = require('./lib.cjs');
(async () => {
  const doc = await render({}, 1080, 1080);
  const t = texts(doc).find(x => x.label === 'value-finishers');
  console.log(JSON.stringify(t.src, null, 1).slice(0, 3000));
  console.log(JSON.stringify(doc.children['tile-finishers'], null, 1).slice(0, 800));
  console.log(JSON.stringify(Object.values(doc.sources).find(s=>s.editor&&s.editor.label==='badge-1'), null, 1));
})();
