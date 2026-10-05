// Critic scratch: canvases and copy outside the build's sweep.
const fs = require('fs');
const t = require('../../../../dist/music/radio-top-30-chart/v1/radio-top-30-chart.js');
const D = t.RadioTop30ChartV1.defaultProps.rows;
const real = JSON.parse(fs.readFileSync(__dirname + '/real30.json', 'utf8'));
const hard = real.rows.slice();
hard[1] = "CHARLI XCX | Brat And It's Completely Different But Also Still Brat | Atlantic";
hard[8] = 'MULATU ASTATKE AND HOODNA ORCHESTRA | "Tension" | Batov';
hard[16] = 'TV GIRL AND GEORGE CLANTON | Fauxllennium | 100% Electronica';
fs.writeFileSync(__dirname + '/hard30.json', JSON.stringify({ ...real, rows: hard }, null, 2));
const show = (name, props, sizes) => {
  for (const [w, h] of sizes) {
    try {
      const L = t.layoutRadioChart(props, w, h);
      const alone = L.rows.filter(r => r.artistAlone || r.titleAlone).map(r => `${r.row.rank}:${r.artistAlone ? 'A' + (r.artistPx / L.artistCap).toFixed(2) : ''}${r.titleAlone ? 'T' + (r.titlePx / L.titleCap).toFixed(2) : ''}`);
      const st = L.cells.find(c => c.label === 'station'), ct = L.cells.find(c => c.label === 'chart-title');
      console.log(`${name} ${w}x${h} ${L.columns}x${L.perColumn} pitch ${L.pitch} colW ${L.colW} caps ${L.artistCap.toFixed(1)}/${L.titleCap.toFixed(1)} shared ${L.shared.toFixed(3)} station ${st.px.toFixed(1)} title ${ct.px.toFixed(1)} alone(${alone.length}) [${alone.join(' ')}]`);
    } catch (e) { console.log(`${name} ${w}x${h} THROWS ${e.message}`); }
  }
};
const A = [[1080, 1080], [1920, 1080], [1080, 1920], [1080, 1350], [1440, 1080], [1400, 1080], [1200, 630], [1920, 600], [600, 1920]];
show('default', {}, A);
show('real', { rows: real.rows }, A);
show('hard', { rows: hard }, A);
show('lead', { lead: true }, A);
// what a paste from a web page carries
for (const [name, rows] of [
  ['curly apostrophe', ["RAVYN LENAE | Bird’s Eye | Atlantic"]],
  ['curly quotes', ["BEACH FOSSILS | “Inside Out” | Numero Group"]],
  ['en dash', ["A | Live 2019–2021 | B"]],
  ['ellipsis char', ["PRODBYDR | Ya Mama's Favs… | Self-Released"]],
  ['tab separated', ["CLAIRO\tCharm\tVirgin"]],
  ['pipe in name', ["A|B | Title | Label | 3 | x"]],
  ['numbered line', ["1. CLAIRO | Charm | Virgin"]],
  ['lw with hash', ["A | B | C | #4"]],
  ['lw dash', ["A | B | C | -"]],
  ['string rows', "A | B | C\nD | E | F"],
]) {
  try { const p = t.normalizeRadioChart({ rows }); console.log(name, 'OK', JSON.stringify(p.rows[0])); }
  catch (e) { console.log(name, 'THROWS', e.message); }
}
