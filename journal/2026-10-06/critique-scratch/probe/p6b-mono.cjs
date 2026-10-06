const { m } = require('./lib.cjs');
const fs = require('fs');
const ALL = ['6xR25', '4xR50', '3xR100', '2xR250', '1xR500', '1xR1000', '5xV25', '3xV50', '2xV100', '1xV250'];
const n = Number(process.argv[2]);
const milestones = ALL.slice(0, n).join(', ');
const aspects = [[16,9],[9,16],[1,1],[4,5],[5,4],[191,100],[3,1],[4,3],[3,4],[2,1],[13,10],[129,100],[8,10],[79,100],[1200,628],[1080,566],[1242,2208]];
const res = { n, milestones, perAspect: [] };
for (const [aw, ah] of aspects) {
  let firstOk = null, lastFail = null, okAfter = [], failsAfterOk = [], prevOk = false;
  for (let s = 240; s <= 2200; s += 3) {
    // s is the shorter side
    let w, h;
    if (aw >= ah) { h = s; w = Math.round(s * aw / ah); } else { w = s; h = Math.round(s * ah / aw); }
    let ok = true, msg = '';
    try { m.settleLayout({ milestones }, w, h); } catch (e) { ok = false; msg = e.message.replace(/^.*?v1: /, ''); }
    if (ok && firstOk === null) firstOk = `${w}x${h}`;
    if (!ok) { lastFail = `${w}x${h}`; if (firstOk !== null) failsAfterOk.push(`${w}x${h}: ${msg}`); }
  }
  res.perAspect.push({ aspect: `${aw}:${ah}`, firstOk, lastFail, failsAfterOk });
}
fs.writeFileSync(`${__dirname}/p6b-${n}.json`, JSON.stringify(res, null, 1));
console.log(n, 'done', res.perAspect.map(a => `${a.aspect} firstOk=${a.firstOk} lastFail=${a.lastFail} nonMono=${a.failsAfterOk.length}`).join(' | '));
