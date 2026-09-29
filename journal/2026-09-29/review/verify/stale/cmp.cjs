// Pixel-compare two PNGs by decoding with ffmpeg to raw rgb24.
const { execFileSync } = require("child_process");
const dims = (f) => { const o = execFileSync("ffmpeg", ["-hide_banner", "-i", f], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); return o; };
function raw(f) { return execFileSync("ffmpeg", ["-v", "error", "-i", f, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 28 }); }
function size(f) { try { execFileSync("ffmpeg", ["-hide_banner", "-i", f], { stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { const m = String(e.stderr).match(/, (\d+)x(\d+)/); return [Number(m[1]), Number(m[2])]; } }
const [a, b] = process.argv.slice(2);
const [wa, ha] = size(a), [wb, hb] = size(b);
if (wa !== wb || ha !== hb) { console.log("size differs", wa, ha, wb, hb); process.exit(1); }
const A = raw(a), B = raw(b);
let diff = 0, maxd = 0, bbox = [1e9, 1e9, -1, -1];
for (let i = 0; i < A.length; i += 3) {
  const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2]));
  if (d > 0) { diff++; maxd = Math.max(maxd, d); const p = i / 3, x = p % wa, y = Math.floor(p / wa); bbox = [Math.min(bbox[0], x), Math.min(bbox[1], y), Math.max(bbox[2], x), Math.max(bbox[3], y)]; }
}
console.log(`${a} vs ${b} (${wa}x${ha}): ${diff} px differ, max delta ${maxd}, bbox ${diff ? bbox : "-"}`);
