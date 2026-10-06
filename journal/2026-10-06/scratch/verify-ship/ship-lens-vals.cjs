const fs=require("fs");
const [file,w,h,x0,y0,xa,xb,ya,yb]=process.argv.slice(2).map((v,i)=>i?+v:v);
const b=fs.readFileSync(file);
console.log("x:   "+Array.from({length:xb-xa+1},(_,k)=>String(xa+k).slice(-2).padStart(3)).join(""));
for(let y=ya;y<=yb;y++){let row="";for(let x=xa;x<=xb;x++){const i=((y-y0)*w+(x-x0))*3;const r=b[i],g=b[i+1],bb=b[i+2];
 // show blue channel (yellow tint shows as low blue)
 row+=String(bb).slice(-3).padStart(4).slice(1);} console.log(String(y).padStart(4)+" "+row);}
