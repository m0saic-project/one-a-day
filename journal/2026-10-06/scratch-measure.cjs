// Measure white tile runs along a column and a row of a rendered PNG (build-phase scratch).
// usage: node scratch-measure.cjs <png> <x> <y>
const { execFileSync } = require("child_process");
const [png, xs, ys] = process.argv.slice(2);
const x = Number(xs), y = Number(ys);
// Decode with ffmpeg to raw rgb24.
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "json", png]).toString());
const { width: W, height: H } = probe.streams[0];
const raw = execFileSync("ffmpeg", ["-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 28 });
const px = (i, j) => { const o = (j * W + i) * 3; return [raw[o], raw[o + 1], raw[o + 2]]; };
const isWhite = ([r, g, b]) => r === 255 && g === 255 && b === 255;
const runs = (get, n) => { const out = []; let start = -1; for (let k = 0; k <= n; k++) { const w = k < n && isWhite(get(k)); if (w && start < 0) start = k; if (!w && start >= 0) { out.push(`${start}+${k - start}`); start = -1; } } return out; };
console.log(`${W}x${H} column x=${x}:`, runs((k) => px(x, k), H).join(" "));
console.log(`${W}x${H} row y=${y}:`, runs((k) => px(k, y), W).join(" "));
