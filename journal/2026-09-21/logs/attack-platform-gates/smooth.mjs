import fs from 'node:fs';
const isSmooth = n => { let m=n; for (const p of [2,3,5]) while (m%p===0) m/=p; return m===1; };
const files = process.argv.slice(2);
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f,'utf8'));
  const strs = [j.layout?.rootM0, j.layout?.rootFlattenedM0].filter(Boolean);
  const counts = new Map();
  for (const s of strs) for (const m of s.matchAll(/(\d+)\s*[\[(]/g)) {
    const n = Number(m[1]); counts.set(n,(counts.get(n)||0)+1);
  }
  const all = [...counts.keys()].sort((a,b)=>a-b);
  const rough = all.filter(n => n>12 && !isSmooth(n));
  console.log(f.split(/[\/]/).slice(-2).join('/'),
    '| distinct splits:', JSON.stringify(all),
    '| >12 NOT 5-smooth:', rough.length? JSON.stringify(rough) : 'none');
}
