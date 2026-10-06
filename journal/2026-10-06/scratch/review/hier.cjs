const M = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
const MAXED = { finishers: 9999, newPbs: 9999, firstTimers: 9999, visitors: 9999, volunteers: 9999, firstTimeVolunteers: 9999 };
const canv = [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270],[720,1280],[1080,1350],[1200,628],[1500,500],[2000,600]];
const sets = { def:{}, maxed:{counts:MAXED}, one:{milestones:'1xR100'}, maxedOne:{counts:MAXED, milestones:'1xR25'}, maxed1000:{counts:MAXED, milestones:'1xR1000'}, small:{counts:{finishers:1,newPbs:1,firstTimers:1,visitors:1,volunteers:1,firstTimeVolunteers:1}, milestones:'1xR25'} };
for (const [n,p] of Object.entries(sets)) for (const [w,h] of canv) {
  try {
    const { L } = M.settleLayout(p, w, h);
    const others = L.cells.filter(c => !['value-finishers','value-volunteers'].includes(c.label));
    const top = others.reduce((a,c)=> c.px>a.px?c:a, {px:0});
    const flag = top.px >= L.heroPx ? '  <== NOT LARGEST' : '';
    console.log(n, `${w}x${h}`, 'hero', L.heroPx, 'stat', L.statPx, 'ratio', (L.heroPx/L.statPx).toFixed(2), 'label', L.labelPx, 'next', top.label, top.px, 'badge', L.badgePx, 'cap', L.captionPx, 'two', L.twoLineLabels, flag);
  } catch (e) { console.log(n, `${w}x${h}`, 'THROW', e.message.replace(/^.*?: /,'')); }
}
