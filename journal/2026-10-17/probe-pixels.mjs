// Pixel probes of the rendered stills: the build agent cannot view images in
// this session, so each claim about the picture is checked by sampling the
// actual pixels ffmpeg rasterized. RGB24 crops dumped via ffmpeg rawvideo.
import { execFileSync } from "node:child_process";

const FFMPEG = "ffmpeg";
function crop(file, x, y, w, h) {
  const buf = execFileSync(FFMPEG, ["-v", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { maxBuffer: 1 << 28 });
  return new Uint8Array(buf);
}
const px = (img, w, x, y) => [img[(y * w + x) * 3], img[(y * w + x) * 3 + 1], img[(y * w + x) * 3 + 2]];
const near = (got, want, tol = 24) => got.every((c, i) => Math.abs(c - want[i]) <= tol);
const fmt = (c) => `rgb(${c.map(Math.round).join(",")})`;
const bright = (img) => { let n = 0; for (let i = 0; i < img.length; i += 3) if (img[i] > 150 && img[i + 1] > 150 && img[i + 2] > 150) n++; return n; };
const mid = (img) => { let n = 0; for (let i = 0; i < img.length; i += 3) if (img[i] > 80 && img[i + 1] > 80 && img[i + 2] > 80) n++; return n; };

let fails = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " - " + detail : ""}`); if (!ok) fails++; };

// Accent #1c6fb8 = (28,111,184); bg #0c1a24 = (12,26,36); track #303d46 = (48,61,70); tick #7b878e = (123,135,142).
const A = [28, 111, 184], BG = [12, 26, 36], TRACK = [48, 61, 70], TICK = [123, 135, 142];

// ── square.png (1080x1080) ──
{
  const f = "journal/2026-10-17/variants/a/stills/square.png";
  const one = (x, y) => { const w = 1, h = 1; return px(crop(f, x, y, w, h), w, 0, 0); };
  check("square: page background at the top margin", near(one(540, 5), BG), fmt(one(540, 5)));
  check("square: header rule is accent across the content width", near(one(540, 198), A), fmt(one(540, 198)));
  check("square: percentile chip is accent", near(one(810, 85), A), fmt(one(810, 85)));
  check("square: marker just left of the 2:00 tick is accent", near(one(529, 674), A), fmt(one(529, 674)));
  check("square: the empty track is its neutral fill", near(one(300, 674), TRACK), fmt(one(300, 674)));
  check("square: the 2:00 tick is the tick grey", near(one(540, 674), TICK), fmt(one(540, 674)));
  check("square: stat divider between SPM and WATTS is accent", near(one(371, 850), A), fmt(one(371, 850)));
  // Text presence: bright ink in the split band, the stat values, the footnote.
  const splitBand = crop(f, 45, 203, 990, 243);
  check("square: the split figure paints bright ink (thousands of px)", bright(splitBand) > 2000, `${bright(splitBand)} bright px`);
  const chipBox = crop(f, 802, 80, 233, 44);
  check("square: the chip carries its light text", bright(chipBox) > 50, `${bright(chipBox)} bright px`);
  const statWatts = crop(f, 383, 826, 314, 53);
  check("square: the WATTS value paints ink", bright(statWatts) > 300, `${bright(statWatts)} bright px`);
  const foot = crop(f, 45, 1007, 990, 28);
  check("square: the footnote paints dim ink", mid(foot) > 100, `${mid(foot)} mid px`);
  const name = crop(f, 45, 73, 741, 51);
  check("square: the rower name paints ink", bright(name) > 200, `${bright(name)} bright px`);
}

// ── landscape.png (1920x1080): the same chrome, the wide arrangement ──
{
  const f = "journal/2026-10-17/variants/a/stills/landscape.png";
  const one = (x, y) => px(crop(f, x, y, 1, 1), 1, 0, 0);
  check("landscape: page background", near(one(960, 5), BG), fmt(one(960, 5)));
  check("landscape: header rule is accent", near(one(960, 206), A), fmt(one(960, 206)));
  check("landscape: marker at 49% of the track is accent", near(one(942, 665), A), fmt(one(942, 665)));
  check("landscape: chip is accent", near(one(1600, 90), A), fmt(one(1600, 90)));
  const splitBand = crop(f, 59, 214, 1802, 217);
  check("landscape: the split paints ink", bright(splitBand) > 2000, `${bright(splitBand)} bright px`);
}

// ── portrait.png (1080x1920): the stretched hero ──
{
  const f = "journal/2026-10-17/variants/a/stills/portrait.png";
  const one = (x, y) => px(crop(f, x, y, 1, 1), 1, 0, 0);
  check("portrait: page background", near(one(540, 5), BG), fmt(one(540, 5)));
  check("portrait: marker at 49% is accent", near(one(529, 1220), A), fmt(one(529, 1220)));
  check("portrait: the empty track is its fill", near(one(300, 1220), TRACK), fmt(one(300, 1220)));
  check("portrait: chip is accent", near(one(810, 153), A), fmt(one(810, 153)));
  const splitBand = crop(f, 45, 433, 990, 302);
  check("portrait: the stretched split paints ink", bright(splitBand) > 2000, `${bright(splitBand)} bright px`);
}

// ── the why-tutorial pages: problem and solution pages tell the story ──
{
  const f2 = "journal/2026-10-17/variants/a/stills/tutorial-2.png";
  const f3 = "journal/2026-10-17/variants/a/stills/tutorial-3.png";
  const ink2 = mid(crop(f2, 200, 150, 880, 500));
  const ink3 = mid(crop(f3, 200, 150, 880, 500));
  check("tutorial page 2 (the problem) carries body text", ink2 > 2000, `${ink2} mid px`);
  check("tutorial page 3 (the solution) carries body text", ink3 > 2000, `${ink3} mid px`);
}

console.log(fails === 0 ? "\nALL PROBES PASS" : `\n${fails} PROBE(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
