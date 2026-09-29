import { readFileSync } from 'node:fs';
const words = new Set(readFileSync(new URL('./words-9.txt', import.meta.url), 'utf8').split(/\s+/).filter(Boolean));
const extra = (process.env.EXTRA || '').split(',').filter(Boolean); extra.forEach(w => words.add(w));
const rows = process.argv.slice(2);
const N = rows.length; const g = rows.map(r => r.split(''));
const blk = (r, c) => r < 0 || c < 0 || r >= N || c >= N || g[r][c] === '#';
const slots = [];
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
  if (blk(r, c)) continue;
  if (blk(r, c-1) && !blk(r, c+1)) { const cells = []; for (let k = c; !blk(r, k); k++) cells.push([r, k]); slots.push(cells); }
  if (blk(r-1, c) && !blk(r+1, c)) { const cells = []; for (let k = r; !blk(k, c); k++) cells.push([k, c]); slots.push(cells); }
}
const byLen = {}; for (const w of words) (byLen[w.length] ||= []).push(w);
let seed = +(process.env.SEED || 1); const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
for (const k in byLen) byLen[k].sort(() => rnd() - 0.5);
const used = new Set();
const pat = s => s.map(([r, c]) => g[r][c]).join('');
const cands = s => { const p = pat(s); const re = new RegExp('^' + p + '$'); return (byLen[p.length] || []).filter(w => re.test(w) && !used.has(w)); };
let nodes = 0;
function solve() {
  if (++nodes > 500000) return false;
  let best = null, bc = null;
  for (const s of slots) { const p = pat(s); if (!p.includes('.')) { if (!words.has(p)) return false; continue; } const c = cands(s); if (!c.length) return false; if (!best || c.length < bc.length) { best = s; bc = c; } }
  if (!best) return true;
  for (const w of bc) {
    const saved = best.map(([r, c]) => g[r][c]);
    best.forEach(([r, c], i) => g[r][c] = w[i]); used.add(w);
    if (solve()) return true;
    used.delete(w); best.forEach(([r, c], i) => g[r][c] = saved[i]);
  }
  return false;
}
const ok = solve();
console.log(ok ? 'SOLVED' : 'FAILED', nodes);
if (ok) console.log(g.map(r => r.join('')).join(' '));
