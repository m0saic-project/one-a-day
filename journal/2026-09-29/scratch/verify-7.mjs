const g=["PAN#BOW","AGE#ARE","DOGSLED","##AIL##","CATNAPS","OWE#SAT","YES#TRY"];const N=7,err=[];
g.forEach((r,i)=>{if(r.length!==N||!/^[A-Z#]+$/.test(r))err.push("row "+i)});
const b=(r,c)=>r<0||c<0||r>=N||c>=N||g[r][c]==="#";
for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(b(r,c)!==b(N-1-r,N-1-c))err.push("sym "+r+","+c);
let W=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!b(r,c))W.push([r,c]);
const seen=new Set([W[0].join()]),st=[W[0]];while(st.length){const[r,c]=st.pop();for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=[r+dr,c+dc];if(!b(...k)&&!seen.has(k.join())){seen.add(k.join());st.push(k)}}}
if(seen.size!==W.length)err.push("disconnected");
let n=0;const A=[],D=[];
for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(b(r,c))continue;const sa=b(r,c-1)&&!b(r,c+1),sd=b(r-1,c)&&!b(r+1,c);if(sa||sd)n++;
if(sa){let w="";for(let k=c;!b(r,k);k++)w+=g[r][k];A.push(n+"A "+w);if(w.length<3)err.push("short "+w)}
if(sd){let w="";for(let k=r;!b(k,c);k++)w+=g[k][c];D.push(n+"D "+w);if(w.length<3)err.push("short "+w)}
if(b(r,c-1)&&b(r,c+1))err.push("unchecked-across "+r+","+c);if(b(r-1,c)&&b(r+1,c))err.push("unchecked-down "+r+","+c);}
console.log(JSON.stringify({err,A,D},null,1));
