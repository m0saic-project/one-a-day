const m = require('../../dist/community/weekly-run-report/v1/weekly-run-report.js');
const canv = [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270]];
const sets = JSON.parse(process.argv[2] || '[{}]');
for (const over of sets) for (const [w,h] of canv) {
  try {
    const { L } = m.settleLayout(over, w, h);
    console.log(`${w}x${h} ${L.shape} name=${L.namePx}x${L.nameLines.length}${L.runBeside?'B':''} hero=${L.heroPx} stat=${L.statPx} ratio=${(L.heroPx/L.statPx).toFixed(2)} label=${L.labelPx}${L.twoLineLabels?'(2)':''} badge=${L.badgePx}/${L.captionPx} floor=${L.floor}/${L.small} hero=${JSON.stringify(L.heroRects[0])} stat=${JSON.stringify(L.statRects[0])} band=${JSON.stringify(L.band)}`);
  } catch (e) { console.log(`${w}x${h} ERR ${e.message}`); }
}
