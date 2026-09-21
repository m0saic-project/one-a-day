import fs from 'node:fs'; import zlib from 'node:zlib'; import crypto from 'node:crypto';
function decode(f){
  const b=fs.readFileSync(f); let o=8; const idat=[]; let ihdr=null;
  while(o<b.length){const len=b.readUInt32BE(o);const t=b.toString('ascii',o+4,o+8);const d=b.subarray(o+8,o+8+len);
    if(t==='IHDR')ihdr={w:d.readUInt32BE(0),h:d.readUInt32BE(4),depth:d[8],color:d[9]};
    if(t==='IDAT')idat.push(d); if(t==='IEND')break; o+=12+len;}
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const ch={0:1,2:3,4:2,6:4}[ihdr.color]; const bpp=ch*(ihdr.depth/8); const stride=ihdr.w*bpp;
  const px=Buffer.alloc(ihdr.h*stride); let p=0;
  for(let y=0;y<ihdr.h;y++){const ft=raw[p++]; const line=raw.subarray(p,p+stride); p+=stride;
    const cur=px.subarray(y*stride,(y+1)*stride); const prev=y? px.subarray((y-1)*stride,y*stride):Buffer.alloc(stride);
    for(let x=0;x<stride;x++){const a=x>=bpp?cur[x-bpp]:0,bb=prev[x],c=x>=bpp?prev[x-bpp]:0;let v=line[x];
      if(ft===1)v+=a; else if(ft===2)v+=bb; else if(ft===3)v+=((a+bb)>>1); else if(ft===4){const pp=a+bb-c,pa=Math.abs(pp-a),pb=Math.abs(pp-bb),pc=Math.abs(pp-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?bb:c);}
      cur[x]=v&255;}}
  return {ihdr,px,stride,bpp};
}
const [f1,f2]=process.argv.slice(2);
const A=decode(f1),B=decode(f2);
console.log('size',A.ihdr,B.ihdr);
console.log('pixel sha', crypto.createHash('sha256').update(A.px).digest('hex').slice(0,16), crypto.createHash('sha256').update(B.px).digest('hex').slice(0,16));
if(A.px.equals(B.px)){console.log('PIXELS IDENTICAL (compression differs only)');process.exit(0);}
let n=0,maxd=0,firstY=-1,minX=1e9,maxX=-1,minY=1e9,maxY=-1;
for(let y=0;y<A.ihdr.h;y++)for(let x=0;x<A.stride;x++){const i=y*A.stride+x;if(A.px[i]!==B.px[i]){n++;const d=Math.abs(A.px[i]-B.px[i]);if(d>maxd)maxd=d;if(firstY<0)firstY=y;const col=Math.floor(x/A.bpp);if(col<minX)minX=col;if(col>maxX)maxX=col;if(y<minY)minY=y;if(y>maxY)maxY=y;}}
console.log('differing bytes',n,'of',A.px.length,'maxdelta',maxd,'bbox x',minX,maxX,'y',minY,maxY);
