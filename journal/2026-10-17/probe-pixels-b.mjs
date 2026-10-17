// Pixel probes for variant b (the accent-band chrome). Same method as
// probe-pixels.mjs: the agent cannot view images, so each claim is sampled.
import { execFileSync } from "node:child_process";

function crop(file, x, y, w, h) {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { maxBuffer: 1 << 28 });
  return new Uint8Array(buf);
}
const px = (img, w, x, y) => [img[(y * w + x) * 3], img[(y * w + x) * 3 + 1], img[(y * w + x) * 3 + 2]];
const near = (got, want, tol = 24) => got.every((c, i) => Math.abs(c - want[i]) <= tol);
const fmt = (c) => `rgb(${c.map(Math.round).join(",")})`;
const bright = (img) => { let n = 0; for (let i = 0; i < img.length; i += 3) if (img[i] > 150 && img[i + 1] > 150 && img[i + 2] > 150) n++; return n; };
const accentLike = (img) => { let n = 0; for (let i = 0; i < img.length; i += 3) if (Math.abs(img[i] - 28) < 40 && Math.abs(img[i + 1] - 111) < 40 && img[i + 2] > 150) n++; return n; };

let fails = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " - " + detail : ""}`); if (!ok) fails++; };

const A = [28, 111, 184], BG = [12, 26, 36], TRACK = [48, 61, 70];

{
  const f = "journal/2026-10-17/variants/b/stills/square.png";
  const one = (x, y) => px(crop(f, x, y, 1, 1), 1, 0, 0);
  check("b square: page background", near(one(540, 5), BG), fmt(one(540, 5)));
  check("b square: header rule is accent", near(one(540, 198), A), fmt(one(540, 198)));
  // The chip: page-coloured fill with an accent ring - probe the pill's edge row.
  const ring = crop(f, 803, 100, 230, 4);
  check("b square: the chip's ring is accent (edge pixels)", accentLike(ring) > 20, `${accentLike(ring)} accent px along the edge`);
  check("b square: the chip's inside is the page colour", near(one(918, 102), BG, 30), fmt(one(918, 102)));
  // The stat strip: accent fill away from the glyphs, light values over it.
  check("b square: the stat strip is accent (left end, off-text)", near(one(70, 870), A, 40), fmt(one(70, 870)));
  const stripBox = crop(f, 45, 816, 990, 104);
  check("b square: the strip fills most of its band", accentLike(stripBox) > 990 * 104 * 0.75, `${accentLike(stripBox)} accent px of ${990 * 104}`);
  check("b square: light values over the strip", bright(stripBox) > 800, `${bright(stripBox)} bright px`);
  // The rest of the card is unchanged chrome.
  check("b square: marker just left of 2:00 is accent", near(one(529, 674), A), fmt(one(529, 674)));
  check("b square: the empty track is its fill", near(one(300, 674), TRACK), fmt(one(300, 674)));
  const splitBand = crop(f, 45, 203, 990, 243);
  check("b square: the split paints ink", bright(splitBand) > 2000, `${bright(splitBand)} bright px`);
}

// Accent coverage comparison: how much of each card is accent (base vs band).
for (const v of ["a", "b"]) {
  const f = `journal/2026-10-17/variants/${v}/stills/square.png`;
  const img = crop(f, 0, 0, 1080, 1080);
  const n = accentLike(img);
  console.log(`variant ${v}: accent coverage ${(100 * n / (1080 * 1080)).toFixed(1)}% of the square canvas`);
}

console.log(fails === 0 ? "\nALL B PROBES PASS" : `\n${fails} PROBE(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
