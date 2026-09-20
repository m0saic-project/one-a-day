#!/usr/bin/env node
/**
 * Bake the one-a-day M — the brand M's 33 tiles, every tile a robot face —
 * into ONE PNG: the mark on this repo's front door (hello-world).
 *
 * Same mechanism as the official community repo's front door, which bakes
 * the Community M (one contributor per tile) with `buildMarkDoc` from
 * `@m0saic/templates`. Here the tiles are the robots that write the repo:
 * generated SVGs (tools/robot-faces.mjs), deterministic from a seed, no
 * bitmaps and no emoji package.
 *
 *   node tools/bake-mark.mjs [--side 544] [--seed one-a-day] [--dormant 0] [--out <png>] [--keep]
 *
 *   --side     square side; MUST be a multiple of 272 (the masks are authored
 *              in 272-space). Default 544 — the card draws the mark at ~317px.
 *   --seed     the face generator's seed. Change it and every robot changes.
 *   --dormant  leave this many tiles unclaimed (the dormant grey), spread
 *              deterministically — "mostly faces" rather than all.
 *   --out      default src/basics/hello-world/v1/assets/one-a-day-m.png
 *              (copy-assets mirrors it into dist/ on the next build).
 *
 * Needs the m0saic CLI (renders the .mosaic). The PNG is committed; this
 * tool runs when a human wants new robots, never in the daily pipeline.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { DEFAULT_SEED, hashSeed, robotFaces, rng, svgDataUri } from "./robot-faces.mjs";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IS_WIN = process.platform === "win32";
export const MARK_DEST = path.join(ROOT, "src/basics/hello-world/v1/assets/one-a-day-m.png");
/** The hello card's own navy (helloWorld.ts NAVY) — the square composites invisibly. */
export const CARD_NAVY = "#050314";
export const ACCENT = "#f97316";
export const DORMANT = "#34343A";
export const TILE_COUNT = 33;

const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const side = Number(val("--side", 544));
const seed = val("--seed", DEFAULT_SEED);
const dormant = Number(val("--dormant", 0));
const out = path.resolve(val("--out", MARK_DEST));
const keep = argv.includes("--keep");
if (!Number.isInteger(side) || side <= 0 || side % 272 !== 0) { console.error(`--side must be a positive multiple of 272 (got ${side})`); process.exit(1); }

/** Which tiles stay dormant: a deterministic spread, never the tip (tile 0 area reads as the M's point). */
export function dormantTiles(count, seedStr) {
  const r = rng(hashSeed(`${seedStr}#dormant`));
  const pool = Array.from({ length: TILE_COUNT }, (_, i) => i).slice(1);
  const chosen = new Set();
  while (chosen.size < Math.min(count, pool.length)) chosen.add(pool[Math.floor(r() * pool.length)]);
  return chosen;
}

const { buildMarkDoc } = require("@m0saic/templates/dist/m0saic/brand/community-m/v1/mark.js");
const { serializeMosaicDocument } = require("@m0saic/platform");

const faces = robotFaces(TILE_COUNT, seed);
const skip = dormantTiles(dormant, seed);
const claims = new Map();
faces.forEach((svg, tile) => { if (!skip.has(tile)) claims.set(tile, { image: { kind: "data-uri", uri: svgDataUri(svg) } }); });

const doc = buildMarkDoc({ side, fps: 1, durationMs: 1, claims, dormantColor: DORMANT, canvasColor: CARD_NAVY, accentColor: ACCENT, rootReserved: false });
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "one-a-day-bake-"));
const mosaicPath = path.join(tmpDir, "one-a-day-m.mosaic");
fs.writeFileSync(mosaicPath, serializeMosaicDocument(doc), "utf8");
fs.mkdirSync(path.dirname(out), { recursive: true });

const cli = process.env.M0SAIC_CLI || "m0saic";
const args = ["make", mosaicPath, "--output", out, "--width", String(side), "--height", String(side), "--output-kind", "image", "--quiet"];
const res = IS_WIN
  ? spawnSync([cli, ...args.map((a) => (/[\s"@()^&|<>]/.test(a) ? `"${a}"` : a))].join(" "), { shell: true, stdio: "inherit" })
  : spawnSync(cli, args, { stdio: "inherit" });
if (res.status !== 0) { console.error(`render failed (exit ${res.status}) — the .mosaic is at ${mosaicPath}`); process.exit(1); }
if (!keep) fs.rmSync(tmpDir, { recursive: true, force: true }); else console.log(`  (kept ${mosaicPath})`);
if (!fs.existsSync(out)) { console.error(`render produced no file: ${out}`); process.exit(1); }
console.log(`bake-mark: ${claims.size} robot tiles, ${skip.size} dormant, seed "${seed}" → ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
console.log("bake-mark: now `npm run build && node tools/gen-previews.mjs --force && npm run build` so the card and its previews pick it up.");
