// usage: node corner.cjs <png> x0 y0 w h  -> prints hex grid
const { execFileSync } = require("child_process");
const [png, ...n] = process.argv.slice(2); const [x0, y0, w, h] = n.map(Number);
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "json", png]).toString());
const { width: W } = probe.streams[0];
const raw = execFileSync("ffmpeg", ["-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 28 });
for (let y = y0; y < y0 + h; y++) { const row = []; for (let x = x0; x < x0 + w; x++) { const o = (y * W + x) * 3; row.push([raw[o], raw[o + 1], raw[o + 2]].map((v) => v.toString(16).padStart(2, "0")).join("")); } console.log(y, row.join(" ")); }
