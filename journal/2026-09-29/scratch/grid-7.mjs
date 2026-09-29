// Usage: node grid-7.mjs ROW0 ROW1 ... ('#' = block)
const rows = process.argv.slice(2).length ? process.argv.slice(2) : [
  "PAN#BOW","AGE#ARE","DOGSLED","##AIL##","CATNAPS","OWE#SAT","YES#TRY"];
const n = rows.length;
if (!rows.every(r => r.length === n)) { console.log("NOT SQUARE"); process.exit(1); }
const blk = (r,c) => r<0||c<0||r>=n||c>=n||rows[r][c]==='#';
let sym = true;
for (let r=0;r<n;r++) for (let c=0;c<n;c++) if ((rows[r][c]==='#') !== (rows[n-1-r][n-1-c]==='#')) sym=false;
console.log("symmetry:", sym ? "OK" : "FAIL");
const whites=[]; for (let r=0;r<n;r++) for (let c=0;c<n;c++) if(!blk(r,c)) whites.push([r,c]);
const seen=new Set([whites[0].join()]); const st=[whites[0]];
while(st.length){const [r,c]=st.pop(); for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=[r+dr,c+dc]; if(!blk(...k)&&!seen.has(k.join())){seen.add(k.join());st.push(k);}}}
console.log("connectivity:", seen.size===whites.length ? "OK" : `FAIL (${seen.size}/${whites.length})`);
console.log("blocks:", n*n-whites.length);
let num=0; const across=[], down=[]; let minLen=99;
for (let r=0;r<n;r++) for (let c=0;c<n;c++) {
  if (blk(r,c)) continue;
  const sa = blk(r,c-1)&&!blk(r,c+1), sd = blk(r-1,c)&&!blk(r+1,c);
  if (sa||sd) num++;
  if (sa){let w="";for(let k=c;!blk(r,k);k++)w+=rows[r][k];across.push(`${num}A ${w}`);minLen=Math.min(minLen,w.length);}
  if (sd){let w="";for(let k=r;!blk(k,c);k++)w+=rows[k][c];down.push(`${num}D ${w}`);minLen=Math.min(minLen,w.length);}
  // unchecked / 1-letter entries
  if (blk(r,c-1)&&blk(r,c+1)) { console.log(`cell ${r},${c} has no across entry`); minLen=Math.min(minLen,1); }
  if (blk(r-1,c)&&blk(r+1,c)) { console.log(`cell ${r},${c} has no down entry`); minLen=Math.min(minLen,1); }
}
console.log("min entry length:", minLen);
console.log("maxClueNumber:", num);
console.log("ACROSS:\n  "+across.join("\n  "));
console.log("DOWN:\n  "+down.join("\n  "));
