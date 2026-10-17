// Focused probe: does the outlined chip render as intended - accent ring,
// page-coloured fill, ink text? Scans the whole chip box.
import { execFileSync } from "node:child_process";

function crop(file, x, y, w, h) {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { maxBuffer: 1 << 28 });
  return new Uint8Array(buf);
}
const f = "journal/2026-10-17/variants/b/stills/square.png";
// Chip rect from the geometry dump: 802,80 233x44.
const img = crop(f, 802, 80, 233, 44);
const W = 233, H = 44;
let accent = 0, bg = 0, bright = 0;
const accentAt = [], bgAt = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const r = img[(y * W + x) * 3], g = img[(y * W + x) * 3 + 1], b = img[(y * W + x) * 3 + 2];
  if (Math.abs(r - 28) < 40 && Math.abs(g - 111) < 40 && b > 150) { accent++; if (accentAt.length < 6) accentAt.push(`${x},${y}`); }
  else if (r < 40 && g < 45 && b < 55) { bg++; if (bgAt.length < 3) bgAt.push(`${x},${y}`); }
  else if (r > 150 && g > 150 && b > 150) bright++;
}
console.log(`chip box 233x44 = ${W * H} px: accent(ring) ${accent} (${(100 * accent / (W * H)).toFixed(1)}%), page-fill ${bg}, ink text ${bright}`);
console.log("accent sample positions (box-local):", accentAt.join(" | "));
console.log("bg sample positions:", bgAt.join(" | "));
// Where are the accent pixels concentrated? Histogram by column and row.
const cols = new Array(W).fill(0), rows = new Array(H).fill(0);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const r = img[(y * W + x) * 3], g = img[(y * W + x) * 3 + 1], b = img[(y * W + x) * 3 + 2];
  if (Math.abs(r - 28) < 40 && Math.abs(g - 111) < 40 && b > 150) { cols[x]++; rows[y]++; }
}
const colIdx = cols.map((n, x) => [n, x]).filter(([n]) => n > 0).map(([n, x]) => `x${x}:${n}`);
const rowIdx = rows.map((n, y) => [n, y]).filter(([n]) => n > 0).map(([n, y]) => `y${y}:${n}`);
console.log("accent columns:", colIdx.slice(0, 12).join(" "), "...", colIdx.slice(-6).join(" "));
console.log("accent rows:", rowIdx.join(" "));
