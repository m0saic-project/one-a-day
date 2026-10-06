// usage: node px.cjs <png> x,y x,y ...  -> rgb hex at each point
const { execFileSync } = require("child_process");
const [png, ...pts] = process.argv.slice(2);
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "json", png]).toString());
const { width: W } = probe.streams[0];
const raw = execFileSync("ffmpeg", ["-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 28 });
for (const p of pts) { const [x, y] = p.split(",").map(Number); const o = (y * W + x) * 3; console.log(p, "#" + [raw[o], raw[o + 1], raw[o + 2]].map((v) => v.toString(16).padStart(2, "0")).join("")); }
