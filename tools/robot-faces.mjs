// robot-faces — deterministic robot-face SVGs, one per tile of the M.
//
// The one-a-day front door paints the brand M with 33 tiles the way the
// Community M does — except every tile here is a ROBOT, because every
// template in this repo is written by one. No emoji package, no bitmaps: each
// face is a few SVG shapes chosen by a seeded generator, so the set is
// reproducible (same seed → same 33 faces) and every face is distinct.
//
//   node tools/robot-faces.mjs [--n 33] [--seed one-a-day] [--out dir]   writes <out>/robot-NN.svg
//
// Used by tools/bake-mark.mjs (data URIs, no files) and tested by
// tools/robot-faces.test.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_SEED = "one-a-day";

/** FNV-1a → 32-bit seed. */
export function hashSeed(s) {
  let h = 0x811c9dc5;
  for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
/** mulberry32 — small, deterministic, good enough for picking shapes. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Body colours: readable on the card's navy, none of them the brand orange (that is the accent's job). */
export const BODIES = ["#8fd3c7", "#f2c14e", "#c9b6f5", "#9ad0f5", "#f5a78f", "#b7e39a", "#f0a8d0", "#d9d2c5", "#7fb8a4", "#e6b85c", "#a9b8f5", "#f28e8e"];
export const INKS = ["#0b1220", "#1b1633", "#102a2a"];
const EYES = ["round", "square", "visor", "dots", "cross", "sleepy", "wide"];
const MOUTHS = ["grill", "smile", "line", "zigzag", "o", "speaker"];
const ANTENNAS = ["single", "double", "none", "bolt", "dish"];
const HEADS = ["rounded", "circle", "tall", "wide"];
const EARS = ["bolts", "caps", "none"];

const pick = (r, list) => list[Math.floor(r() * list.length)];

/** One face as an SVG string. `index` seeds it together with `seed`. */
export function robotFaceSvg(index, seed = DEFAULT_SEED) {
  const r = rng(hashSeed(`${seed}#${index}`));
  const body = pick(r, BODIES);
  const ink = pick(r, INKS);
  const eyes = pick(r, EYES);
  const mouth = pick(r, MOUTHS);
  const antenna = pick(r, ANTENNAS);
  const head = pick(r, HEADS);
  const ears = pick(r, EARS);
  const glow = ["#f97316", "#ffd166", "#7ee8fa", "#ffffff", "#b5ff7d"][Math.floor(r() * 5)];
  const tilt = Math.round((r() - 0.5) * 8);
  const parts = [];

  // background: a soft tint of the body so a cover-fit crop never shows navy
  parts.push(`<rect width="100" height="100" fill="${body}" opacity="0.28"/>`);

  // head
  const H = { rounded: { x: 18, y: 24, w: 64, h: 58, rx: 12 }, circle: { x: 20, y: 22, w: 60, h: 60, rx: 30 }, tall: { x: 24, y: 18, w: 52, h: 66, rx: 10 }, wide: { x: 12, y: 30, w: 76, h: 50, rx: 14 } }[head];
  const g = [`<g transform="rotate(${tilt} 50 50)">`];
  // antenna
  if (antenna === "single") g.push(`<rect x="48" y="${H.y - 12}" width="4" height="12" fill="${ink}"/><circle cx="50" cy="${H.y - 14}" r="4" fill="${glow}"/>`);
  if (antenna === "double") g.push(`<rect x="${H.x + 12}" y="${H.y - 10}" width="4" height="10" fill="${ink}"/><rect x="${H.x + H.w - 16}" y="${H.y - 10}" width="4" height="10" fill="${ink}"/><circle cx="${H.x + 14}" cy="${H.y - 12}" r="3.5" fill="${glow}"/><circle cx="${H.x + H.w - 14}" cy="${H.y - 12}" r="3.5" fill="${glow}"/>`);
  if (antenna === "bolt") g.push(`<path d="M52 ${H.y - 16} l-6 9 h5 l-3 8 l8 -11 h-5 z" fill="${glow}"/>`);
  if (antenna === "dish") g.push(`<rect x="48" y="${H.y - 8}" width="4" height="8" fill="${ink}"/><path d="M38 ${H.y - 8} a12 6 0 0 1 24 0 z" fill="${ink}"/><circle cx="50" cy="${H.y - 9}" r="2.5" fill="${glow}"/>`);
  // ears
  if (ears === "bolts") g.push(`<rect x="${H.x - 7}" y="${H.y + H.h / 2 - 7}" width="8" height="14" rx="2" fill="${ink}"/><rect x="${H.x + H.w - 1}" y="${H.y + H.h / 2 - 7}" width="8" height="14" rx="2" fill="${ink}"/>`);
  if (ears === "caps") g.push(`<circle cx="${H.x - 3}" cy="${H.y + H.h / 2}" r="6" fill="${ink}"/><circle cx="${H.x + H.w + 3}" cy="${H.y + H.h / 2}" r="6" fill="${ink}"/>`);
  // head plate
  g.push(`<rect x="${H.x}" y="${H.y}" width="${H.w}" height="${H.h}" rx="${H.rx}" fill="${body}" stroke="${ink}" stroke-width="3"/>`);
  // eyes
  const ey = H.y + H.h * 0.42;
  const exl = H.x + H.w * 0.32;
  const exr = H.x + H.w * 0.68;
  if (eyes === "round") g.push(`<circle cx="${exl}" cy="${ey}" r="7" fill="${ink}"/><circle cx="${exr}" cy="${ey}" r="7" fill="${ink}"/><circle cx="${exl + 2}" cy="${ey - 2}" r="2" fill="${glow}"/><circle cx="${exr + 2}" cy="${ey - 2}" r="2" fill="${glow}"/>`);
  if (eyes === "square") g.push(`<rect x="${exl - 7}" y="${ey - 6}" width="14" height="12" rx="2" fill="${ink}"/><rect x="${exr - 7}" y="${ey - 6}" width="14" height="12" rx="2" fill="${ink}"/><rect x="${exl - 4}" y="${ey - 3}" width="8" height="6" fill="${glow}"/><rect x="${exr - 4}" y="${ey - 3}" width="8" height="6" fill="${glow}"/>`);
  if (eyes === "visor") g.push(`<rect x="${H.x + 8}" y="${ey - 7}" width="${H.w - 16}" height="14" rx="7" fill="${ink}"/><rect x="${H.x + 14}" y="${ey - 3}" width="${H.w - 28}" height="6" rx="3" fill="${glow}"/>`);
  if (eyes === "dots") g.push(`<circle cx="${exl}" cy="${ey}" r="3.5" fill="${ink}"/><circle cx="${exr}" cy="${ey}" r="3.5" fill="${ink}"/>`);
  if (eyes === "cross") g.push(`<path d="M${exl - 5} ${ey - 5} l10 10 M${exl + 5} ${ey - 5} l-10 10" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><circle cx="${exr}" cy="${ey}" r="6" fill="${ink}"/><circle cx="${exr + 2}" cy="${ey - 2}" r="2" fill="${glow}"/>`);
  if (eyes === "sleepy") g.push(`<path d="M${exl - 7} ${ey} q7 6 14 0 M${exr - 7} ${ey} q7 6 14 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  if (eyes === "wide") g.push(`<ellipse cx="${exl}" cy="${ey}" rx="9" ry="6" fill="${ink}"/><ellipse cx="${exr}" cy="${ey}" rx="9" ry="6" fill="${ink}"/><circle cx="${exl}" cy="${ey}" r="2.5" fill="${glow}"/><circle cx="${exr}" cy="${ey}" r="2.5" fill="${glow}"/>`);
  // mouth
  const my = H.y + H.h * 0.72;
  const mx = H.x + H.w * 0.5;
  if (mouth === "grill") g.push(`<rect x="${mx - 14}" y="${my - 5}" width="28" height="10" rx="2" fill="${ink}"/><path d="M${mx - 7} ${my - 5} v10 M${mx} ${my - 5} v10 M${mx + 7} ${my - 5} v10" stroke="${body}" stroke-width="2"/>`);
  if (mouth === "smile") g.push(`<path d="M${mx - 12} ${my - 3} q12 12 24 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  if (mouth === "line") g.push(`<rect x="${mx - 12}" y="${my - 2}" width="24" height="4" rx="2" fill="${ink}"/>`);
  if (mouth === "zigzag") g.push(`<path d="M${mx - 14} ${my} l5 -5 l5 5 l5 -5 l5 5 l4 -4" stroke="${ink}" stroke-width="3" fill="none" stroke-linejoin="round"/>`);
  if (mouth === "o") g.push(`<circle cx="${mx}" cy="${my}" r="5" fill="${ink}"/>`);
  if (mouth === "speaker") g.push(`<circle cx="${mx - 8}" cy="${my}" r="2.2" fill="${ink}"/><circle cx="${mx}" cy="${my}" r="2.2" fill="${ink}"/><circle cx="${mx + 8}" cy="${my}" r="2.2" fill="${ink}"/>`);
  g.push("</g>");
  parts.push(g.join(""));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${parts.join("")}</svg>`;
}

/** n faces; when two indexes collide on every trait, the later one is re-rolled until distinct. */
export function robotFaces(n, seed = DEFAULT_SEED) {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    let salt = 0;
    let svg = robotFaceSvg(i, seed);
    while (seen.has(svg)) { salt += 1; svg = robotFaceSvg(`${i}.${salt}`, seed); }
    seen.add(svg);
    out.push(svg);
  }
  return out;
}

export function svgDataUri(svg) { return `data:image/svg+xml,${encodeURIComponent(svg)}`; }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
  const n = Number(val("--n", 33));
  const seed = val("--seed", DEFAULT_SEED);
  const out = path.resolve(val("--out", "test-output/robots"));
  fs.mkdirSync(out, { recursive: true });
  robotFaces(n, seed).forEach((svg, i) => fs.writeFileSync(path.join(out, `robot-${String(i + 1).padStart(2, "0")}.svg`), svg));
  console.log(`robot-faces: wrote ${n} faces (seed "${seed}") → ${out}`);
}
