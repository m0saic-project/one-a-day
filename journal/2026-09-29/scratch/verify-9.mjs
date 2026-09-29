const g=["....#....","....#....","SUNFLOWER","...#.....","###...###",".....#...","MOONLIGHT","....#....","....#...."];
const N=9,v=[];const W=(r,c)=>r>=0&&c>=0&&r<N&&c<N&&g[r][c]!=='#';
g.forEach((row,r)=>{if(row.length!==9)v.push(`row ${r} len`);if(!/^[A-Z#]+$/.test(row))v.push(`row ${r} has non A-Z chars (unfilled)`);});
for(let r=0;r<N;r++)for(let c=0;c<N;c++)if((g[r][c]==='#')!==(g[N-1-r][N-1-c]==='#'))v.push(`asym ${r},${c}`);
let cells=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(W(r,c))cells.push([r,c]);
const seen=new Set([cells[0].join()]);const st=[cells[0]];while(st.length){const[r,c]=st.pop();for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=[r+a,c+b];if(W(...k)&&!seen.has(k.join())){seen.add(k.join());st.push(k)}}}
if(seen.size!==cells.length)v.push('disconnected');
let n=0,ents=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(!W(r,c))continue;const sa=!W(r,c-1)&&W(r,c+1),sd=!W(r-1,c)&&W(r+1,c);if(sa||sd)n++;
if(sa){let s='';for(let k=c;W(r,k);k++)s+=g[r][k];ents.push(n+'A '+s);if(s.length<3)v.push('short '+n+'A')}
if(sd){let s='';for(let k=r;W(k,c);k++)s+=g[k][c];ents.push(n+'D '+s);if(s.length<3)v.push('short '+n+'D')}
if(!sa&&!sd){/* check unchecked */}
let ha=W(r,c-1)||W(r,c+1),hd=W(r-1,c)||W(r+1,c);if(!ha||!hd)v.push(`unchecked ${r},${c}`);}
console.log(ents.join('\n'));console.log('violations',v);
