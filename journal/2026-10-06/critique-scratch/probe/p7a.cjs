const { m, render } = require('./lib.cjs');
(async () => {
  const doc = await render({ debugLayout: true }, 1080, 1080);
  console.log(Object.keys(doc.editor));
  console.log(JSON.stringify(doc.editor.layoutContract, null, 1).slice(0, 1500));
})();
