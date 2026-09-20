#!/usr/bin/env node
// render-variant — build, render and snapshot one template variant so a
// critic (human or agent) can judge it from files:
//
//   node pipeline/render/render-variant.mjs <templateId> <outDir> [--props @file.json] [--no-build] [--label a]
//
// Writes into <outDir>/:
//   src/                 a copy of src/<pack>/<slug>/vN/ at this moment (the variant's code)
//   renders/landscape.*  1920x1080 (mp4 or png — the template decides)
//   renders/portrait.*   1080x1920
//   renders/square.*     1080x1080
//   stills/<canvas>-{10,50,90}.png   frames cut from each mp4 (image templates: the png itself)
//   renders/tutorial.mp4 the why-tutorial (renderTutorial via --tutorial) at 1280x720
//   stills/tutorial-<n>.png          one frame per tutorial page (cover, problem, solution, use it, the template, how it was made)
//   report.json          exit codes, degraded flags (exit 3 = error mosaic), probes, file sizes
//
// Exit 0 when every render exited 0; exit 3 when any render was degraded;
// exit 1 on any other failure. The gate does NOT use this; the agent does.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const IS_WIN = process.platform === "win32";
const argv = process.argv.slice(2);
const positional = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && ["--props", "--label"].includes(argv[i - 1])));
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const [templateId, outDirArg] = positional;
if (!templateId || !outDirArg) { console.error("usage: node pipeline/render/render-variant.mjs <templateId> <outDir> [--props @file.json] [--no-build] [--label a]"); process.exit(2); }
const OUT = path.resolve(outDirArg);
const PROPS = opt("--props");
const NO_BUILD = argv.includes("--no-build");
const CANVASES = [["landscape", 1920, 1080], ["portrait", 1080, 1920], ["square", 1080, 1080]];

const q = (a) => (IS_WIN && /[\s"@()^&|<>]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
function sh(cmd, args, opts = {}) {
  const r = IS_WIN
    ? spawnSync([cmd, ...args.map(q)].join(" "), { shell: true, cwd: ROOT, encoding: "utf8", stdio: "pipe", ...opts })
    : spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe", ...opts });
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}

const report = { templateId, at: new Date().toISOString(), props: PROPS ?? null, build: null, kind: null, renders: [], stills: [], srcSnapshot: null, ok: true, degraded: false };
fs.mkdirSync(path.join(OUT, "renders"), { recursive: true });
fs.mkdirSync(path.join(OUT, "stills"), { recursive: true });

// 0. build (the CLI renders dist/, never src/)
if (!NO_BUILD) {
  const b = sh("npm", ["run", "build"]);
  report.build = { code: b.code };
  if (b.code !== 0) { console.error(b.out + b.err); report.ok = false; finish(1); }
}

// 1. what kind of output is it?
const v = sh("m0saic", ["make", templateId, "--template-repo", ROOT, "--validate-only", "--quiet", ...(PROPS ? ["--props", PROPS] : [])]);
const m = /output:\s+(\S+)/.exec(v.out);
report.kind = m ? (m[1].endsWith(".png") ? "image" : "video") : null;
report.validate = { code: v.code, degraded: v.code === 3 };
if (v.code !== 0) { console.error(v.out + v.err); report.ok = false; if (v.code === 3) report.degraded = true; finish(v.code === 3 ? 3 : 1); }
const ext = report.kind === "image" ? "png" : "mp4";

// 2. ffmpeg/ffprobe from the m0saic toolchain
let ffmpeg = process.env.M0SAIC_FFMPEG || "ffmpeg";
let ffprobe = process.env.M0SAIC_FFPROBE || "ffprobe";
try { const vj = JSON.parse(sh("m0saic", ["versions", "--json", "--quiet"]).out); if (vj.toolchain?.ffmpeg) ffmpeg = vj.toolchain.ffmpeg; if (vj.toolchain?.ffprobe) ffprobe = vj.toolchain.ffprobe; } catch { /* PATH fallback */ }

function probe(file) {
  const r = sh(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name:format=duration", "-of", "json", file]);
  try { const j = JSON.parse(r.out); return { width: j.streams?.[0]?.width, height: j.streams?.[0]?.height, codec: j.streams?.[0]?.codec_name, durationSec: j.format?.duration ? Number(j.format.duration) : undefined }; } catch { return null; }
}

// 3. render every canvas
for (const [name, w, h] of CANVASES) {
  const file = path.join(OUT, "renders", `${name}.${ext}`);
  const r = sh("m0saic", ["make", templateId, "--template-repo", ROOT, "-w", String(w), "-h", String(h), "-o", file, "--quiet", "--report", ...(PROPS ? ["--props", PROPS] : [])]);
  const entry = { canvas: name, width: w, height: h, file: path.relative(OUT, file), exitCode: r.code, degraded: r.code === 3, bytes: fs.existsSync(file) ? fs.statSync(file).size : 0, probe: fs.existsSync(file) ? probe(file) : null };
  if (r.code !== 0) { entry.stderr = (r.err || r.out).trim().split("\n").slice(-12).join("\n"); report.ok = false; if (r.code === 3) report.degraded = true; }
  report.renders.push(entry);
  console.log(`${r.code === 0 ? "ok " : "x  "} ${name} ${w}x${h} → ${entry.file} (exit ${r.code}${r.code === 3 ? " DEGRADED: error mosaic" : ""})`);
  if (!fs.existsSync(file)) continue;
  if (ext === "png") {
    const still = path.join(OUT, "stills", `${name}.png`);
    fs.copyFileSync(file, still);
    report.stills.push({ canvas: name, at: null, file: path.relative(OUT, still) });
  } else {
    const dur = entry.probe?.durationSec ?? 2;
    for (const pct of [10, 50, 90]) {
      const still = path.join(OUT, "stills", `${name}-${pct}.png`);
      const t = Math.max(0, Math.min(dur - 0.05, (dur * pct) / 100));
      const f = sh(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-ss", t.toFixed(3), "-i", file, "-frames:v", "1", still]);
      if (f.code === 0) report.stills.push({ canvas: name, at: Number(t.toFixed(3)), file: path.relative(OUT, still) });
    }
  }
}

// 3b. the why-tutorial: one 720p clip, one still per page. Its exit code
//     counts like a render's - the CLI exits 1 for a template with no
//     tutorial, and the gate refuses one whose tutorial does not validate.
{
  const file = path.join(OUT, "renders", "tutorial.mp4");
  const r = sh("m0saic", ["make", templateId, "--template-repo", ROOT, "--tutorial", "-w", "1280", "-h", "720", "-o", file, "--quiet"]);
  const entry = { canvas: "tutorial", width: 1280, height: 720, file: path.relative(OUT, file), exitCode: r.code, degraded: r.code === 3, bytes: fs.existsSync(file) ? fs.statSync(file).size : 0, probe: fs.existsSync(file) ? probe(file) : null };
  if (r.code !== 0) { entry.stderr = (r.err || r.out).trim().split("\n").slice(-12).join("\n"); report.ok = false; if (r.code === 3) report.degraded = true; }
  report.tutorial = entry;
  console.log(`${r.code === 0 ? "ok " : "x  "} tutorial 1280x720 → ${entry.file} (exit ${r.code}${r.code === 3 ? " DEGRADED: error mosaic" : ""})`);
  if (fs.existsSync(file) && entry.probe?.durationSec) {
    // The convention's pages are 7 / 14 / 12 / 10 s, the template, then "how it
    // was made" (10 s): cut the middle of each fixed page, the middle of the
    // template's stretch, and the middle of the last 10 s.
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
}

// 4. snapshot the source folder
const idm = /^@[^/]+\/([^/]+)\/([^/]+)\/(v\d+)$/.exec(templateId);
if (idm) {
  const srcDir = path.join(ROOT, "src", idm[1], idm[2], idm[3]);
  if (fs.existsSync(srcDir)) { fs.rmSync(path.join(OUT, "src"), { recursive: true, force: true }); fs.cpSync(srcDir, path.join(OUT, "src"), { recursive: true }); report.srcSnapshot = `src/`; }
}

finish(report.degraded ? 3 : report.ok ? 0 : 1);

function finish(code) {
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`\nrender-variant: ${report.ok ? "ok" : "FAILED"}${report.degraded ? " (DEGRADED)" : ""} — ${report.renders.length} render(s), ${report.stills.length} still(s) → ${path.relative(ROOT, OUT)}/report.json`);
  process.exit(code);
}
