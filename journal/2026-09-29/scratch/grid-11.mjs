// Usage: node grid-11.mjs ROW1 ROW2 ... ('#' = block)
import fs from "fs";
let rows = process.argv.slice(2);
if (rows.length === 1 && fs.existsSync(rows[0])) rows = fs.readFileSync(rows[0], "utf8").split(/?
/).map(s => s.trim()).filter(Boolean);
const N = rows.length;
const g = rows.map(r => r.split(''));
let ok = true;
if (!rows.every(r => r.length === N)) { console.log('BAD: non-square'); ok = false; }
const W = (r, c) => r >= 0 && c >= 0 && r < N && c < N && g[r][c] !== '#';
let sym = true;
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
  if ((g[r][c] === '#') !== (g[N-1-r][N-1-c] === '#')) sym = false;
console.log('symmetry:', sym);
let blocks = 0, whites = [];
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) g[r][c] === '#' ? blocks++ : whites.push([r,c]);
const seen = new Set(); const st = [whites[0]];
while (st.length) { const [r,c] = st.pop(); const k = r+','+c; if (seen.has(k) || !W(r,c)) continue; seen.add(k); st.push([r+1,c],[r-1,c],[r,c+1],[r,c-1]); }
console.log('connected:', seen.size === whites.length, 'blocks:', blocks);
let num = 0; const across = [], down = []; let minLen = 99;
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
  if (!W(r,c)) continue;
  const sa = !W(r,c-1) && W(r,c+1), sd = !W(r-1,c) && W(r+1,c);
  if (!sa && !sd) { if (!W(r,c-1) && !W(r-1,c)) {} }
  if (sa || sd) num++;
  if (sa) { let s=''; let cc=c; while (W(r,cc)) s += g[r][cc++]; across.push(`${num}A ${s}`); minLen = Math.min(minLen, s.length); }
  if (sd) { let s=''; let rr=r; while (W(rr,c)) s += g[rr++][c]; down.push(`${num}D ${s}`); minLen = Math.min(minLen, s.length); }
}
// unchecked / short
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (W(r,c)) {
  if (!(W(r,c-1)||W(r,c+1)) || !(W(r-1,c)||W(r+1,c))) { console.log('UNCHECKED cell', r, c); }
}
console.log('minLen:', minLen, 'maxClue:', num);
console.log('ACROSS:\n ' + across.join('\n '));
console.log('DOWN:\n ' + down.join('\n '));
