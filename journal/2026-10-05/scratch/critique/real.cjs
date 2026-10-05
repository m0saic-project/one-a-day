// Critic scratch: feed the card rows a station really published (KWVA's page, as the scout fetched it).
const fs = require('fs');
const t = require('../../../../dist/music/radio-top-30-chart/v1/radio-top-30-chart.js');
const j = JSON.parse(fs.readFileSync(__dirname + '/../kwva.json', 'utf8'));
const lines = j.text.split('\n').map(s => s.trim()).filter(s => /^\d+\.\s/.test(s));
const rows = [];
const seen = new Set();
for (const l of lines) {
  const m = l.match(/^\d+\.\s+(.*?)\s+(?:Album|Single)\s*:\s*(.*?)\s+Label\s*:\s*(.*?)\s*(?:…|\.\.\.)?$/);
  if (!m) { console.log('UNPARSED', l); continue; }
  const row = `${m[1]} | ${m[2]} | ${m[3]}`;
  if (seen.has(row) || /…/.test(row)) continue;
  seen.add(row); rows.push(row);
}
console.log(rows.length, 'rows');
const nonAscii = rows.filter(r => /[^\x20-\x7e]/.test(r));
console.log('non-ASCII rows:', nonAscii);
const thirty = rows.slice(0, 30);
fs.writeFileSync(__dirname + '/real30.json', JSON.stringify({ station: 'KWVA 88.1 FM', weekOf: 'Week of Jan 14, 2025', footer: 'kwva.uoregon.edu/charts - critic scratch, rows as KWVA typed them', rows: thirty }, null, 2));
thirty.forEach((r, i) => console.log(String(i + 1).padStart(2), r));
for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920]]) {
  try {
    const L = t.layoutRadioChart({ rows: thirty }, w, h);
    const alone = L.rows.filter(r => r.artistAlone || r.titleAlone).map(r => `${r.row.rank}:${r.artistAlone ? 'A' + (r.artistPx / L.artistCap).toFixed(2) : ''}${r.titleAlone ? 'T' + (r.titlePx / L.titleCap).toFixed(2) : ''}`);
    console.log(`${w}x${h} caps ${L.artistCap.toFixed(1)}/${L.titleCap.toFixed(1)} shared ${L.shared.toFixed(3)} -> ${L.artistShared.toFixed(1)}/${L.titleShared.toFixed(1)} alone(${alone.length}) [${alone.join(' ')}]`);
  } catch (e) { console.log(`${w}x${h} THROWS ${e.message}`); }
}
