// usage: node grid-9.mjs ROW1 ROW2 ... ('#' = block)
const rows = process.argv.slice(2);
const N = rows.length;
const g = rows.map(r => r.split(''));
const blk = (r, c) => r < 0 || c < 0 || r >= N || c >= N || g[r][c] === '#';
let sym = true;
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
  if ((g[r][c] === '#') !== (g[N-1-r][N-1-c] === '#')) sym = false;
console.log('size', N, 'widths ok', rows.every(r => r.length === N));
console.log('symmetry', sym);
let whites = [], seen = new Set();
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!blk(r, c)) whites.push([r, c]);
const st = [whites[0]]; seen.add(whites[0].join());
while (st.length) { const [r, c] = st.pop(); for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const k = [r+dr, c+dc]; if (!blk(...k) && !seen.has(k.join())) { seen.add(k.join()); st.push(k); } } }
console.log('connected', seen.size === whites.length, 'blocks', N*N - whites.length);
let num = 0, across = [], down = [], minLen = 99;
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
  if (blk(r, c)) continue;
  const a = blk(r, c-1) && !blk(r, c+1), d = blk(r-1, c) && !blk(r+1, c);
  if (a || d) num++;
  if (a) { let s = ''; for (let k = c; !blk(r, k); k++) s += g[r][k]; across.push(`${num}A ${s}`); minLen = Math.min(minLen, s.length); }
  if (d) { let s = ''; for (let k = r; !blk(k, c); k++) s += g[k][c]; down.push(`${num}D ${s}`); minLen = Math.min(minLen, s.length); }
}
// unchecked / short
let bad = [];
for (const [r, c] of whites) {
  const ah = !blk(r, c-1) || !blk(r, c+1), dv = !blk(r-1, c) || !blk(r+1, c);
  if (!ah || !dv) bad.push(`${r},${c}`);
}
console.log('unchecked cells', bad.join(' ') || 'none');
console.log('min entry length', minLen, 'maxClueNumber', num);
console.log('ACROSS\n  ' + across.join('\n  '));
console.log('DOWN\n  ' + down.join('\n  '));
