const g=["#SCAM","STARE","HORSE","INGOT","NEON#"];const N=5;const errs=[];
g.forEach((r,i)=>{if(r.length!==N)errs.push(`row ${i} len`);if(!/^[A-Z#]+$/.test(r))errs.push(`row ${i} chars`);});
const W=(r,c)=>r>=0&&c>=0&&r<N&&c<N&&g[r][c]!=='#';
for(let r=0;r<N;r++)for(let c=0;c<N;c++)if((g[r][c]==='#')!==(g[N-1-r][N-1-c]==='#'))errs.push(`sym ${r},${c}`);
let start=null,cnt=0;for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(W(r,c)){cnt++;start??=[r,c];}
const seen=new Set([start.join()]);const q=[start];while(q.length){const[r,c]=q.pop();for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=[r+dr,c+dc];if(W(...k)&&!seen.has(k.join())){seen.add(k.join());q.push(k);}}}
if(seen.size!==cnt)errs.push('disconnected');
const ent=[];let n=0;
for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(!W(r,c))continue;const a=!W(r,c-1)&&W(r,c+1),d=!W(r-1,c)&&W(r+1,c);if(a||d)n++;
 if(a){let s='';for(let k=c;W(r,k);k++)s+=g[r][k];ent.push(`${n}A ${s}`);if(s.length<3)errs.push(`short ${n}A`);}
 if(d){let s='';for(let k=r;W(k,c);k++)s+=g[k][c];ent.push(`${n}D ${s}`);if(s.length<3)errs.push(`short ${n}D`);}}
for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(W(r,c)){let a=0,d=0;for(let k=c;W(r,k);k++)a++;for(let k=c-1;W(r,k);k--)a++;for(let k=r;W(k,c);k++)d++;for(let k=r-1;W(k,c);k--)d++;if(a<3||d<3)errs.push(`unchecked ${r},${c}`);}
console.log(ent.join('\n'));console.log('errors:',errs);
