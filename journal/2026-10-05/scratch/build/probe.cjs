// Scratch: time one render per canvas from dist/ and print the ladder's numbers.
const t = require('../../../../dist/music/radio-top-30-chart/v1/radio-top-30-chart.js');
const over = process.argv[2] ? JSON.parse(process.argv[2]) : {};
(async () => {
  for (const [w,h] of [[1080,1080],[1920,1080],[1080,1920],[480,270]]) {
    const t0 = Date.now();
    try {
      const L = t.layoutRadioChart(over, w, h);
      const alone = L.rows.filter(r => r.artistAlone || r.titleAlone).map(r => `${r.row.rank}:${r.artistPx}/${r.titlePx}`);
      const t1 = Date.now();
      const target = { width: w, height: h, fps: 30, durationMs: 2000 };
      const doc = await t.RadioTop30ChartV1.render({ ...t.RadioTop30ChartV1.defaultProps, ...over }, { mode: 'render', target, output: { ...target, workspaceDir: '/tmp/x' }, media: {} });
      console.log(`${w}x${h} cols ${L.columns}x${L.perColumn} pitch ${L.pitch} colW ${L.colW} caps ${L.artistCap.toFixed(2)}/${L.titleCap.toFixed(2)} shared ${L.shared.toFixed(3)} -> ${L.artistShared}/${L.titleShared} alone [${alone}] sources ${doc.sources.length} m0 ${String(doc.m0).length} layout ${t1-t0}ms render ${Date.now()-t1}ms`);
    } catch (e) { console.log(`${w}x${h} THROWS ${e.message}`); }
  }
})();
