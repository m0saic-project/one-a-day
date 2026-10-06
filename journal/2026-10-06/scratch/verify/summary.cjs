const out = require("./sweep.json");
const key = o => `${o.W}x${o.H}`;
const canv = [...new Set(out.map(key))];
console.log("canvas      shape  S    stat hero | n=5 bpx/cpx/rows | n=6 | n=8 | n=10 | long10 | minBadge(w x h) n>=6");
for (const c of canv) {
  const g = (set, n) => out.find(o=>key(o)===c && o.set===set && o.n===n);
  const f = o => !o ? "-" : o.ok ? `${o.badgePx}/${o.captionPx}/${o.rows}r` : "REFUSED";
  const a = g("base",5) || g("base",1);
  const ok = out.filter(o=>key(o)===c && o.ok && o.n>=6);
  const mb = ok.length ? ok.map(o=>`${o.bw}x${o.bh}`).reduce((m,x)=> (eval(x.replace("x","*"))<eval(m.replace("x","*"))?x:m)) : "-";
  console.log(`${c.padEnd(11)} ${String(a.shape??"").padEnd(6)} ${String(a.S).padEnd(4)} ${String(a.statPx).padEnd(4)} ${String(a.heroPx).padEnd(4)} | ${f(g("base",5))} | ${f(g("base",6))} | ${f(g("base",8))} | ${f(g("base",10))} | ${f(g("long",10))} | ${mb}`);
}
console.log("\none-long-row cases (n>=6, rows==1):");
for (const o of out.filter(o=>o.ok && o.n>=6 && o.rows===1)) console.log(`  ${o.set} ${key(o)} shape=${o.shape} n=${o.n} badgePx=${o.badgePx} captionPx=${o.captionPx}`);
console.log("\nn=6 badgePx vs n=5 (base): smaller / same / larger");
let s=0,e=0,l=0; const notSmaller=[];
for (const c of canv) { const a=out.find(o=>key(o)===c&&o.set==="base"&&o.n===5), b=out.find(o=>key(o)===c&&o.set==="base"&&o.n===6); if(!a?.ok||!b?.ok) continue; if(b.badgePx<a.badgePx)s++; else if(b.badgePx===a.badgePx){e++;notSmaller.push(`${c} ${a.badgePx}->${b.badgePx} (bh ${a.bh}->${b.bh})`);} else {l++;notSmaller.push(`${c} LARGER ${a.badgePx}->${b.badgePx}`);} }
console.log(s,e,l, notSmaller.join("; "));
console.log("\nn=1..5 badge rect same size per canvas?");
for (const c of canv) { const xs = out.filter(o=>key(o)===c&&o.set==="base"&&o.n<=5&&o.ok); const sz=[...new Set(xs.map(o=>`${o.bw}x${o.bh}/${o.badgePx}/${o.captionPx}`))]; if (sz.length>1) console.log("  ",c,sz.join(" , ")); }
console.log("\nmax badgePx/statPx ratio:", Math.max(...out.filter(o=>o.ok).map(o=>o.badgePx/o.statPx)).toFixed(3));
console.log("cases badgePx == statPx:", out.filter(o=>o.ok&&o.badgePx===o.statPx).map(o=>`${o.set} ${key(o)} n=${o.n} ${o.badgePx}`).join("; ")||"none");
