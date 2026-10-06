// usage: node scan.cjs file.png row|col N [minRun]
// prints runs of identical-ish colour along a row or column
const { execFileSync } = require('child_process');
const FF = 'C:/FFMPEG/ffmpeg-7.1-essentials_build/bin/ffmpeg.exe';
const FP = 'C:/FFMPEG/ffmpeg-7.1-essentials_build/bin/ffprobe.exe';
const [file, mode, nStr, minRunStr] = process.argv.slice(2);
const dims = execFileSync(FP, ['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0', file]).toString().trim().split(',').map(Number);
const [W,H] = dims;
const buf = execFileSync(FF, ['-v','error','-i', file, '-f','rawvideo','-pix_fmt','rgb24','-'], {maxBuffer: 1<<30});
const n = Number(nStr); const minRun = Number(minRunStr||3);
const px = (x,y)=>{const i=(y*W+x)*3; return [buf[i],buf[i+1],buf[i+2]];};
const len = mode==='row'?W:H;
let runs=[]; let cur=null;
for (let k=0;k<len;k++){
  const p = mode==='row'?px(k,n):px(n,k);
  const key = p.join(',');
  if (cur && Math.abs(cur.c[0]-p[0])<=2 && Math.abs(cur.c[1]-p[1])<=2 && Math.abs(cur.c[2]-p[2])<=2){cur.e=k;}
  else { cur={s:k,e:k,c:p}; runs.push(cur);} }
console.log(`${file} ${W}x${H} ${mode} ${n}`);
let out=[];
for (const r of runs){ if (r.e-r.s+1>=minRun) out.push(`${r.s}-${r.e}(${r.e-r.s+1}) rgb(${r.c.join(',')})`); }
console.log(out.join('\n'));
