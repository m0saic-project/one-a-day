const rows = process.argv.slice(2).length ? process.argv.slice(2) : ['#SCAM','STARE','HORSE','INGOT','NEON#'];
const N = rows.length, W = (r,c)=>r>=0&&c>=0&&r<N&&c<N&&rows[r][c]!=='#';
let sym=true; for(let r=0;r<N;r++)for(let c=0;c<N;c++) if((rows[r][c]==='#')!==(rows[N-1-r][N-1-c]==='#')) sym=false;
console.log('symmetry', sym);
const cells=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(W(r,c))cells.push([r,c]);
const seen=new Set([cells[0].join()]);const st=[cells[0]];
while(st.length){const [r,c]=st.pop();for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=[r+dr,c+dc];if(W(...k)&&!seen.has(k.join())){seen.add(k.join());st.push(k);}}}
console.log('connected', seen.size===cells.length);
let n=0,min=99;const A=[],D=[];
for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(!W(r,c))continue;let num=false;
 if(!W(r,c-1)&&W(r,c+1)){num=true;}
 if(!W(r-1,c)&&W(r+1,c)){num=true;}
 if(num)n++;
 if(!W(r,c-1)){let s='';for(let k=c;W(r,k);k++)s+=rows[r][k];min=Math.min(min,s.length);if(s.length>1)A.push(n+'A '+s);else console.log('unchecked across at',r,c);}
 if(!W(r-1,c)){let s='';for(let k=r;W(k,c);k++)s+=rows[k][c];min=Math.min(min,s.length);if(s.length>1)D.push(n+'D '+s);else console.log('unchecked down at',r,c);}
}
console.log('min entry length', min);console.log('ACROSS',A);console.log('DOWN',D);console.log('max clue',n);
