#!/usr/bin/env node
// render-variant-split — pipeline/render/render-variant.mjs, one STEP per call.
//
// Why this exists (day 004, 2026-09-23): the day was run by hand in a Claude
// Code session. Its one background render of variant a was stopped by the
// session harness for low system memory (16 GB laptop, ~5 GB free), and a
// foreground call is capped at ten minutes - shorter than three 305 s
// canvases plus the tutorial. So the same steps run one per call, and the
// report accumulates in <outDir>/report.json with the same shape
// render-variant writes (renders[], stills[], tutorial, srcSnapshot, ok,
// degraded), so the critique reads it the same way.
//
//   node journal/<date>/logs/render-variant-split.mjs <templateId> <outDir> --step build|landscape|portrait|square|tutorial|snapshot [--props @file.json]
//
// Logic is copied from pipeline/render/render-variant.mjs verbatim where it
// matters (the CLI invocations, the still cuts, the tutorial page bounds);
// pipeline/ itself is protected and untouched.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const IS_WIN = process.platform === "win32";
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const positional = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && ["--props", "--step"].includes(argv[i - 1])));
const [templateId, outDirArg] = positional;
const STEP = opt("--step");
const PROPS = opt("--props");
if (!templateId || !outDirArg || !STEP) { console.error("usage: node render-variant-split.mjs <templateId> <outDir> --step build|landscape|portrait|square|tutorial|snapshot [--props @file.json]"); process.exit(2); }
const OUT = path.resolve(outDirArg);
const CANVASES = { landscape: [1920, 1080], portrait: [1080, 1920], square: [1080, 1080] };
if (process.env.M0SAIC_ROOT) { console.error(`ignoring M0SAIC_ROOT=${process.env.M0SAIC_ROOT}`); delete process.env.M0SAIC_ROOT; }

const q = (a) => (IS_WIN && /[\s"@()^&|<>]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
function sh(cmd, args, opts = {}) {
  const r = IS_WIN
    ? spawnSync([cmd, ...args.map(q)].join(" "), { shell: true, cwd: ROOT, encoding: "utf8", stdio: "pipe", ...opts })
    : spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe", ...opts });
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}

fs.mkdirSync(path.join(OUT, "renders"), { recursive: true });
fs.mkdirSync(path.join(OUT, "stills"), { recursive: true });
const REPORT = path.join(OUT, "report.json");
const report = fs.existsSync(REPORT)
  ? JSON.parse(fs.readFileSync(REPORT, "utf8"))
  : { templateId, at: new Date().toISOString(), props: PROPS ?? null, build: null, kind: null, renders: [], stills: [], srcSnapshot: null, ok: true, degraded: false, split: { runner: "journal/2026-09-23/logs/render-variant-split.mjs", steps: [] } };
const save = () => fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");
const mark = (step, extra = {}) => { report.split.steps.push({ step, at: new Date().toISOString(), ...extra }); save(); };

let ffmpeg = process.env.M0SAIC_FFMPEG || "ffmpeg";
let ffprobe = process.env.M0SAIC_FFPROBE || "ffprobe";
try { const vj = JSON.parse(sh("m0saic", ["versions", "--json", "--quiet"]).out); if (vj.toolchain?.ffmpeg) ffmpeg = vj.toolchain.ffmpeg; if (vj.toolchain?.ffprobe) ffprobe = vj.toolchain.ffprobe; } catch { /* PATH fallback */ }
function probe(file) {
  const r = sh(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name:format=duration", "-of", "json", file]);
  try { const j = JSON.parse(r.out); return { width: j.streams?.[0]?.width, height: j.streams?.[0]?.height, codec: j.streams?.[0]?.codec_name, durationSec: j.format?.duration ? Number(j.format.duration) : undefined }; } catch { return null; }
}

const t0 = Date.now();
if (STEP === "build") {
  const b = sh("npm", ["run", "build"]);
  report.build = { code: b.code };
  if (b.code !== 0) { console.error(b.out + b.err); report.ok = false; mark("build", { code: b.code }); process.exit(1); }
  const v = sh("m0saic", ["make", templateId, "--template-repo", ROOT, "--validate-only", "--quiet", ...(PROPS ? ["--props", PROPS] : [])]);
  const m = /output:\s+(\S+)/.exec(v.out);
  report.kind = m ? (m[1].endsWith(".png") ? "image" : "video") : null;
  report.validate = { code: v.code, degraded: v.code === 3 };
  if (v.code !== 0) { console.error(v.out + v.err); report.ok = false; if (v.code === 3) report.degraded = true; }
  mark("build", { code: b.code, validate: v.code, kind: report.kind, ms: Date.now() - t0 });
  console.log(`build ${b.code === 0 ? "ok" : "FAILED"} - validate-only exit ${v.code} - kind ${report.kind}`);
  process.exit(v.code === 3 ? 3 : v.code === 0 ? 0 : 1);
}

if (CANVASES[STEP]) {
  const ext = report.kind === "image" ? "png" : "mp4";
  const [w, h] = CANVASES[STEP];
  const file = path.join(OUT, "renders", `${STEP}.${ext}`);
  const r = sh("m0saic", ["make", templateId, "--template-repo", ROOT, "-w", String(w), "-h", String(h), "-o", file, "--quiet", "--report", ...(PROPS ? ["--props", PROPS] : [])]);
  const entry = { canvas: STEP, width: w, height: h, file: path.relative(OUT, file), exitCode: r.code, degraded: r.code === 3, bytes: fs.existsSync(file) ? fs.statSync(file).size : 0, probe: fs.existsSync(file) ? probe(file) : null, ms: Date.now() - t0 };
  if (r.code !== 0) { entry.stderr = (r.err || r.out).trim().split("\n").slice(-12).join("\n"); report.ok = false; if (r.code === 3) report.degraded = true; }
  report.renders = report.renders.filter((e) => e.canvas !== STEP).concat([entry]);
  report.stills = report.stills.filter((s) => s.canvas !== STEP);
  console.log(`${r.code === 0 ? "ok " : "x  "} ${STEP} ${w}x${h} -> ${entry.file} (exit ${r.code}${r.code === 3 ? " DEGRADED: error mosaic" : ""}) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (fs.existsSync(file)) {
    if (ext === "png") {
      const still = path.join(OUT, "stills", `${STEP}.png`);
      fs.copyFileSync(file, still);
      report.stills.push({ canvas: STEP, at: null, file: path.relative(OUT, still) });
    } else {
      const dur = entry.probe?.durationSec ?? 2;
      for (const pct of [10, 50, 90]) {
        const still = path.join(OUT, "stills", `${STEP}-${pct}.png`);
        const t = Math.max(0, Math.min(dur - 0.05, (dur * pct) / 100));
        const f = sh(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-ss", t.toFixed(3), "-i", file, "-frames:v", "1", still]);
        if (f.code === 0) report.stills.push({ canvas: STEP, at: Number(t.toFixed(3)), file: path.relative(OUT, still) });
      }
    }
  }
  mark(STEP, { exit: r.code, ms: Date.now() - t0 });
  process.exit(r.code === 3 ? 3 : r.code === 0 ? 0 : 1);
}

if (STEP === "tutorial") {
  const file = path.join(OUT, "renders", "tutorial.mp4");
  const r = sh("m0saic", ["make", templateId, "--template-repo", ROOT, "--tutorial", "-w", "1280", "-h", "720", "-o", file, "--quiet"]);
  const entry = { canvas: "tutorial", width: 1280, height: 720, file: path.relative(OUT, file), exitCode: r.code, degraded: r.code === 3, bytes: fs.existsSync(file) ? fs.statSync(file).size : 0, probe: fs.existsSync(file) ? probe(file) : null, ms: Date.now() - t0 };
  if (r.code !== 0) { entry.stderr = (r.err || r.out).trim().split("\n").slice(-12).join("\n"); report.ok = false; if (r.code === 3) report.degraded = true; }
  report.tutorial = entry;
  report.stills = report.stills.filter((s) => s.canvas !== "tutorial");
  console.log(`${r.code === 0 ? "ok " : "x  "} tutorial 1280x720 -> ${entry.file} (exit ${r.code}${r.code === 3 ? " DEGRADED: error mosaic" : ""}) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (fs.existsSync(file) && entry.probe?.durationSec) {
    const total = entry.probe.durationSec;
    const bounds = [0, 7, 21, 33, 43, Math.max(43, total - 10), total];
    for (let i = 0; i + 1 < bounds.length; i++) {
      const t = Math.min(entry.probe.durationSec - 0.05, (bounds[i] + Math.min(bounds[i + 1], entry.probe.durationSec)) / 2);
      if (!(t > bounds[i])) continue;
      const still = path.join(OUT, "stills", `tutorial-${i + 1}.png`);
      const f = sh(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-ss", t.toFixed(3), "-i", file, "-frames:v", "1", still]);
      if (f.code === 0) report.stills.push({ canvas: "tutorial", at: Number(t.toFixed(3)), file: path.relative(OUT, still) });
    }
  }
  mark("tutorial", { exit: r.code, ms: Date.now() - t0 });
  process.exit(r.code === 3 ? 3 : r.code === 0 ? 0 : 1);
}

if (STEP === "snapshot") {
  const idm = /^@[^/]+\/([^/]+)\/([^/]+)\/(v\d+)$/.exec(templateId);
  if (idm) {
    const srcDir = path.join(ROOT, "src", idm[1], idm[2], idm[3]);
    if (fs.existsSync(srcDir)) { fs.rmSync(path.join(OUT, "src"), { recursive: true, force: true }); fs.cpSync(srcDir, path.join(OUT, "src"), { recursive: true }); report.srcSnapshot = "src/"; }
  }
  mark("snapshot");
  console.log(`render-variant (split): ${report.ok ? "ok" : "FAILED"}${report.degraded ? " (DEGRADED)" : ""} - ${report.renders.length} render(s), ${report.stills.length} still(s) -> ${path.relative(ROOT, OUT)}/report.json`);
  process.exit(report.degraded ? 3 : report.ok ? 0 : 1);
}

console.error(`unknown --step ${STEP}`);
process.exit(2);
