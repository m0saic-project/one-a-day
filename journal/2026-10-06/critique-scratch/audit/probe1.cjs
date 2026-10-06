const m = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
const canv = [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270]];
console.log('--- defaults per canvas: pitch, sizes, floors');
for (const [w,h] of canv) {
  const { L, pitch } = m.settleLayout({}, w, h);
  const minCell = Math.min(...L.cells.map(c=>c.px));
  const below = L.cells.filter(c=>c.px < L.floor).map(c=>`${c.label}:${c.px}`);
  console.log(`${w}x${h} ${L.shape} pitch=${pitch.x}x${pitch.y} floor=${L.floor} small=${L.small} name=${L.namePx}/${L.nameLines.length}${L.runBeside?'B':''} hero=${L.heroPx} stat=${L.statPx} label=${L.labelPx} club=${L.badgePx} cap=${L.captionPx} minPx=${minCell} belowFloor=[${below.join(',')}]`);
}
console.log('--- wide header: name size vs length at 1920x1080 / 1280x720');
for (const [w,h] of [[1920,1080],[1280,720],[3840,2160]]) {
  for (const n of ['Bushy 5k','Willowmere Park 5k','Great Salterns Nature Reserve 5k','Great Salterns Nature Reserve 5k Juniors','AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','Llanfairpwllgwyngyllgogerychwyrndrobwll']) {
    try { const { L } = m.settleLayout({ eventName: n }, w, h); console.log(`${w}x${h} ${JSON.stringify(n)} len=${n.length} namePx=${L.namePx} lines=${L.nameLines.length} beside=${L.runBeside}`); } catch(e) { console.log(`${w}x${h} ${n} ERR ${e.message}`); }
  }
}
console.log('--- square/tall: name ladder');
for (const [w,h] of [[1080,1080],[1080,1920],[640,360],[480,270]]) {
  for (const n of ['Willowmere Park 5k','Great Salterns Nature Reserve 5k','Great Salterns Nature Reserve 5k Juniors','AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW','WWWWWWWWWWWWWWWWWWW WWWWWWWWWWWWWWWWWWWW']) {
    try { const { L } = m.settleLayout({ eventName: n }, w, h); console.log(`${w}x${h} ${JSON.stringify(n)} namePx=${L.namePx} lines=${L.nameLines.length} beside=${L.runBeside}`); } catch(e) { console.log(`${w}x${h} ${n} ERR ${e.message}`); }
  }
}
