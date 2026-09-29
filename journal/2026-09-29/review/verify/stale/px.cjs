const { execFileSync } = require("child_process");
const raw = (f) => execFileSync("ffmpeg", ["-v", "error", "-i", f, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 28 });
const [a, b, W] = [process.argv[2], process.argv[3], Number(process.argv[4])];
const A = raw(a), B = raw(b);
const at = (X, x, y) => [...X.slice((y * W + x) * 3, (y * W + x) * 3 + 3)];
for (const [x, y] of [[5, 5], [W - 5, 5], [100, 1050 * W / 1080 | 0]]) console.log(x, y, at(A, x, y), at(B, x, y));
const hist = {};
for (let i = 0; i < A.length; i += 3) { const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); const k = d === 0 ? "0" : d <= 3 ? "1-3" : d <= 20 ? "4-20" : ">20"; hist[k] = (hist[k] || 0) + 1; }
console.log(hist);
