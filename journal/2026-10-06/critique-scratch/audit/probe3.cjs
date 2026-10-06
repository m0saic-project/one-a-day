const m = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
const INK = '#1b1f1c';
const onColor = (f) => m.contrast(f, '#ffffff') >= m.contrast(f, INK) ? '#ffffff' : INK;
let worst = { c: 99 };
for (let v = 0; v < 256; v++) { const h = v.toString(16).padStart(2,'0'); const f = `#${h}${h}${h}`; const c = m.contrast(f, onColor(f)); if (c < worst.c) worst = { f, c }; }
console.log('worst grey accent for badge text:', worst.f, worst.c.toFixed(2));
for (const f of ['#1f7a4d','#dde1da','#e4572e','#ff6f00','#d81b60','#00897b','#7a3b8f','#808080','#ffd23f','#ffffff','#fbfbfb','#dde1da']) {
  console.log(f, 'badge ink', onColor(f), m.contrast(f, onColor(f)).toFixed(2), '| vs tile', m.contrast(f,'#fbfbfb').toFixed(2), '| vs volunteer fill', m.contrast(f,'#dde1da').toFixed(2), '| vs paper', m.contrast(f,'#f6f4ee').toFixed(2));
}
console.log('DIM on tile', m.contrast('#4f5651','#fbfbfb').toFixed(2), 'DIM on paper', m.contrast('#4f5651','#f6f4ee').toFixed(2), 'tile vs paper', m.contrast('#fbfbfb','#f6f4ee').toFixed(3));
// count accents (random-ish deterministic sweep) whose badge text < 4.5
let n = 0, below45 = 0, below3 = 0;
for (let r = 0; r < 256; r += 17) for (let g = 0; g < 256; g += 17) for (let b = 0; b < 256; b += 17) { n++; const f = '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''); const c = m.contrast(f, onColor(f)); if (c < 4.5) below45++; if (c < 3) below3++; }
console.log(`sweep ${n} accents: badge text <4.5:1 for ${below45}, <3:1 for ${below3}`);
// accent identical to volunteer fill
const L = m.layoutWeeklyRunReport({ accent: '#dde1da' }, 1080, 1080);
console.log('accent=#dde1da tiles:', L.tiles.filter(t=>t.label==='badge').map(t=>t.color).join(','), 'heroInk', L.p.heroInk);
const L2 = m.layoutWeeklyRunReport({ accent: '#fbfbfb' }, 1080, 1080);
console.log('accent=#fbfbfb run badge fill == band fill:', L2.tiles.filter(t=>t.label==='badge').map(t=>t.color).join(','), 'band', L2.tiles.find(t=>t.label==='milestone-band').color);
