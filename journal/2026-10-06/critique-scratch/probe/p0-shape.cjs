const { m, render, texts } = require('./lib.cjs');
(async () => {
  const doc = await render({}, 1080, 1080);
  console.log(Object.keys(doc));
  const s0 = Object.values(doc.sources)[0];
  console.log(JSON.stringify(s0, null, 1).slice(0, 1500));
  for (const t of texts(doc)) console.log(t.where, '|', t.label, '|', JSON.stringify(t.text));
})().catch(e => { console.error(e); process.exit(1); });
