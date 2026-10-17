// The why-tutorial's page 5 is "the template itself" at its defaults - probe
// that the still shows the CARD (page bg, accent rule, marker on the track),
// and page 6 shows the harness timeline card.
import { execFileSync } from "node:child_process";

function crop(file, x, y, w, h) {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { maxBuffer: 1 << 28 });
  return new Uint8Array(buf);
}
const px = (img, w, x, y) => [img[(y * w + x) * 3], img[(y * w + x) * 3 + 1], img[(y * w + x) * 3 + 2]];
const near = (got, want, tol) => got.every((c, i) => Math.abs(c - want[i]) <= tol);
const fmt = (c) => `rgb(${c.map(Math.round).join(",")})`;
const bright = (img) => { let n = 0; for (let i = 0; i < img.length; i += 3) if (img[i] > 150 && img[i + 1] > 150 && img[i + 2] > 150) n++; return n; };

let fails = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " - " + detail : ""}`); if (!ok) fails++; };

// Page 5 renders the card at defaults on a 1280x720 tutorial canvas. Layout
// there: S = min(720, 960) = 720; m = 40; CW = 1200; the marker sits at
// 40 + round(0.49*1200) = 628 on a track at y = trackY. Recompute quickly by
// importing the built layout.
const { layoutErgCard } = await import("../../dist/sports/erg-pb-card/v1/erg-pb-card.js");
const L = layoutErgCard({}, 1280, 720);
const f5 = "journal/2026-10-17/variants/a/stills/tutorial-5.png";
const one = (x, y) => px(crop(f5, x, y, 1, 1), 1, 0, 0);
const A = [28, 111, 184];
check("tutorial-5: the card's page background", near(one(640, 3), [12, 26, 36], 30), fmt(one(640, 3)));
check("tutorial-5: the card's header rule is accent", near(one(Math.round(L.m + L.track.w / 2), Math.round(L.tiles.find((t) => t.label === "header-rule").rect.y + 1)), A, 45), fmt(one(Math.round(L.m + L.track.w / 2), Math.round(L.tiles.find((t) => t.label === "header-rule").rect.y + 1))));
check("tutorial-5: the card's marker is accent on the track", near(one(Math.round(L.markerRect.x + 4), Math.round(L.track.y + L.track.h / 2)), A, 45), fmt(one(Math.round(L.markerRect.x + 4), Math.round(L.track.y + L.track.h / 2))));
const splitBand = crop(f5, L.m, Math.round(L.cells.find((c) => c.label === "split").rect.y), Math.round(L.track.w), Math.round(L.cells.find((c) => c.label === "split").rect.h));
check("tutorial-5: the card's split paints ink", bright(splitBand) > 2000, `${bright(splitBand)} bright px`);

// Page 6: the harness agent-timeline card - it has its own chrome (lighter
// panel bands); just confirm it is a dense, non-empty page distinct from 5.
const f6 = "journal/2026-10-17/variants/a/stills/tutorial-6.png";
const body = crop(f6, 100, 150, 1080, 500);
let nonBg = 0;
for (let i = 0; i < body.length; i += 3) if (body[i] > 25 || body[i + 1] > 30 || body[i + 2] > 35) nonBg++;
check("tutorial-6: the timeline card paints content", nonBg > 20000, `${nonBg} non-background px`);

console.log(fails === 0 ? "\nALL TUTORIAL PROBES PASS" : `\n${fails} PROBE(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
