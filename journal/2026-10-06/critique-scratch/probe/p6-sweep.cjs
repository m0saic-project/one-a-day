const { m } = require('./lib.cjs');
const fs = require('fs');
const t0 = Date.now();
const grid = [];
for (let w = 240; w <= 4096; w += 97) for (let h = 240; h <= 4096; h += 97) grid.push([w, h]);
const named = [[1080,1350],[1200,1500],[1080,1080],[1200,628],[1200,630],[1080,566],[1500,500],[820,312],[1640,624],[2048,1152],[800,800],[720,1280],[1242,2208],[3000,3000],[400,400],[320,320],[300,250],[1920,1080],[1080,1920],[1280,720],[3840,2160],[640,360],[480,270]];
const fails = [], namedOut = [];
for (const [w, h] of [...grid, ...named]) {
  try { m.settleLayout({}, w, h); if (named.some(([a,b]) => a===w&&b===h)) namedOut.push(`${w}x${h} ok`); }
  catch (e) { const msg = e.message.replace(/^.*?v1: /, ''); fails.push({ w, h, msg }); if (named.some(([a,b]) => a===w&&b===h)) namedOut.push(`${w}x${h} REFUSED ${msg}`); }
}
console.log(`settled ${grid.length + named.length} canvases in ${Date.now() - t0}ms; refusals at defaults: ${fails.length}`);
console.log(namedOut.join('\n'));
// group by field
const byField = {};
for (const f of fails) { const k = f.msg.replace(/on \d+x\d+ above the \d+px/, 'on WxH above the Npx'); (byField[k] = byField[k] || []).push(`${f.w}x${f.h}`); }
for (const [k, v] of Object.entries(byField)) console.log(`\n[${v.length}] ${k}\n   ${v.slice(0, 40).join(' ')}${v.length > 40 ? ' ...' : ''}`);
// smallest refused by area and refused with min side >= 300
const big = fails.filter(f => Math.min(f.w, f.h) >= 300).sort((a, b) => b.w * b.h - a.w * a.h);
console.log('\nrefusals with min side >= 300:', big.length, big.slice(0, 30).map(f => `${f.w}x${f.h}(${(f.w/f.h).toFixed(2)})`).join(' '));
// aspect bounds of refusals
const asp = fails.map(f => f.w / f.h);
console.log('refused aspect range among grid:', Math.min(...asp).toFixed(3), Math.max(...asp).toFixed(3));
fs.writeFileSync(__dirname + '/p6-fails.json', JSON.stringify(fails, null, 0));
