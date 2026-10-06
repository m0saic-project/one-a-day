const fs=require("fs");
const [file,w,h,x0,y0]=[process.argv[2],+process.argv[3],+process.argv[4],+process.argv[5],+process.argv[6]];
const b=fs.readFileSync(file);
// print chars: '.' = (251,251,251) exactly; else the min channel / code
let hist={};
for(let y=0;y<h;y++){let row="";for(let x=0;x<w;x++){const i=(y*w+x)*3;const r=b[i],g=b[i+1],bb=b[i+2];const k=r+","+g+","+bb;hist[k]=(hist[k]||0)+1;
 const m=Math.min(r,g,bb), M=Math.max(r,g,bb);
 let c; if(m<200) c="#"; else if(r===251&&g===251&&bb===251) c="."; else if (m>=252) c="+"; else if (m>=248) c="-"; else c="o"; row+=c;}
 console.log(String(y0+y).padStart(4)+" "+row);}
const top=Object.entries(hist).sort((a,b)=>b[1]-a[1]).slice(0,15); console.log(top);
