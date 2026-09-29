const { execFileSync } = require("child_process");
function size(f) { try { execFileSync("ffmpeg", ["-hide_banner", "-i", f], { stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { const m = String(e.stderr).match(/Video: (\w+).*?, (\w+[^,]*), (\d+)x(\d+)/); return { fmt: m[2], w: Number(m[3]), h: Number(m[4]) }; } }
function raw(f) { return execFileSync("ffmpeg", ["-v", "error", "-i", f, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 28 }); }
const [a, b] = process.argv.slice(2);
const sa = size(a), sb = size(b);
console.log(a, sa, b, sb);
const A = raw(a), B = raw(b), w = sa.w;
const px = (X, x, y) => { const i = (y * w + x) * 3; return [X[i], X[i+1], X[i+2]]; };
console.log("pixel(5,5)", px(A, 5, 5), px(B, 5, 5), "pixel(500,500)", px(A, 500, 500), px(B, 500, 500));
let big = 0, bbox = [1e9, 1e9, -1, -1], hist = {};
for (let i = 0; i < A.length; i += 3) {
  const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i+1] - B[i+1]), Math.abs(A[i+2] - B[i+2]));
  hist[d > 30 ? ">30" : d] = (hist[d > 30 ? ">30" : d] || 0) + 1;
  if (d > 30) { big++; const p = i / 3, x = p % w, y = Math.floor(p / w); bbox = [Math.min(bbox[0], x), Math.min(bbox[1], y), Math.max(bbox[2], x), Math.max(bbox[3], y)]; }
}
console.log("hist", JSON.stringify(hist).slice(0, 400), "big", big, "bbox", bbox);
