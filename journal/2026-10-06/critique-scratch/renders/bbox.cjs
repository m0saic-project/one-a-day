// usage: node bbox.cjs file.png x0 y0 x1 y1 [thresh]  -> bbox of "ink" pixels (far from local bg = pixel at x0,y0)
const { execFileSync } = require('child_process');
const FF = 'C:/FFMPEG/ffmpeg-7.1-essentials_build/bin/ffmpeg.exe';
const FP = 'C:/FFMPEG/ffmpeg-7.1-essentials_build/bin/ffprobe.exe';
const [file, ...r] = process.argv.slice(2);
const [x0,y0,x1,y1] = r.slice(0,4).map(Number); const th = Number(r[4]||80);
const [W,H] = execFileSync(FP, ['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0', file]).toString().trim().split(',').map(Number);
const buf = execFileSync(FF, ['-v','error','-i', file, '-f','rawvideo','-pix_fmt','rgb24','-'], {maxBuffer: 1<<30});
const px=(x,y)=>{const i=(y*W+x)*3;return [buf[i],buf[i+1],buf[i+2]];};
const bg = px(x0,y0);
let bx0=1e9,by0=1e9,bx1=-1,by1=-1;
for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const p=px(x,y);const d=Math.abs(p[0]-bg[0])+Math.abs(p[1]-bg[1])+Math.abs(p[2]-bg[2]);if(d>th){if(x<bx0)bx0=x;if(x>bx1)bx1=x;if(y<by0)by0=y;if(y>by1)by1=y;}}
console.log(`bg=${bg} bbox x ${bx0}-${bx1} (${bx1-bx0+1}) y ${by0}-${by1} (${by1-by0+1})`);
