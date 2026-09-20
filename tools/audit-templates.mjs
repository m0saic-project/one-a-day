#!/usr/bin/env node
/**
 * Template audit — the author's report for this repo's whole shelf.
 *
 * Renders every core-tier template at its `defaultProps` and reports, per
 * template:
 *
 *  1. CONVENTIONS — the same render-time rules the build gate runs
 *     (`tools/check-registry.mjs`), plus the standard-canvas sweep the gate
 *     only runs with `--sweep`: bindings resolve, displayed props are bound,
 *     svg glyphs exist, and the layout clears its safe minimum at its hinted
 *     canvas and on 1080p landscape / portrait / square.
 *  2. POSITIONING — the floors probe from the m0saic shelf audit: render on a
 *     grid of canvases (square / portrait / desktop × 240p → 4K), read the
 *     flattened layout's feasibility + precision floors at each, and watch how
 *     precision responds to the canvas. Precision that TRACKS the canvas
 *     (slope ≈ 1) means absolute, per-pixel positioning (placeRects) — fine
 *     for a head, but it does not nest. Precision that stays FLAT means ratio
 *     positioning (weighted splits) — composes anywhere.
 *
 * Deterministic (defaults only, no clock, no random), no ffmpeg: resolve +
 * parse only. Capability-tier templates and templates whose required inputs
 * have no default are listed, not probed.
 *
 *   node tools/audit-templates.mjs                 # markdown to stdout
 *   node tools/audit-templates.mjs --write         # also writes TEMPLATE-AUDIT.md
 *   node tools/audit-templates.mjs --only weighted # id substring filter
 *   node tools/audit-templates.mjs --fast          # 2 heights instead of 4
 *
 * Read the "⚠ Attention" table first: it is the list of things to fix.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.M0SAIC_CLI ??= "/usr/bin/false"; // no template may re-invoke a CLI from an audit

const argv = process.argv.slice(2);
const WRITE = argv.includes("--write");
const FAST = argv.includes("--fast");
const ONLY = (() => { const i = argv.indexOf("--only"); return i >= 0 ? String(argv[i + 1] ?? "") : ""; })();

let templates;
let templateUtils;
let platform;
try {
  ({ templates } = require(path.join(ROOT, "dist/index.js")));
  templateUtils = require("@m0saic/template-utils");
  platform = require("@m0saic/platform");
} catch (err) {
  console.error(`audit-templates: the built templates refused to load — run \`npm run build\` first.\n${err?.message ?? err}`);
  process.exit(1);
}
for (const t of templates) templateUtils.registerTemplate(t); // nested invocations resolve as in a host

// ── Probe grid (mirrors the m0saic shelf audit) ─────────────────────────────
const ASPECTS = [
  { name: "square", ratio: 1 },
  { name: "portrait", ratio: 9 / 16 },
  { name: "desktop", ratio: 16 / 9 },
];
const HEIGHTS = FAST ? [540, 1080] : [240, 540, 1080, 2160];
/** |slope| of precision-vs-canvas above which the layout is called absolute. */
const ABSOLUTE_SLOPE = 0.3;

const ctxFor = (w, h) => {
  const t = { width: w, height: h, fps: 30, durationMs: 2000 };
  return { mode: "render", target: t, output: { ...t, workspaceDir: path.join(ROOT, "test-output", "audit") }, media: {} };
};
const dims = (c) => `${c.width}×${c.height}`;
const slope = (xs, ys) => {
  const n = xs.length; if (n < 2) return 0;
  const sx = xs.reduce((a, b) => a + b, 0), sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, b) => a + b * b, 0), sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
  const d = n * sxx - sx * sx; return d === 0 ? 0 : (n * sxy - sx * sy) / d;
};

/**
 * The m0 that describes a rendered layout: the FLATTENED string when the
 * children inline (the usual case), else the root's own string marked
 * `root` (a pipeline-valued child is a leaf the flattener cannot inline;
 * the root's split structure is still the honest thing to probe). Null for
 * a pipeline of refs — nothing spatial to read here.
 */
function layoutM0(renderable, w, h) {
  const doc = renderable?.kind === "mosaic_pipeline" ? renderable.steps?.find((s) => s.file)?.file : renderable;
  if (!doc || doc.kind !== "mosaic_document") return null;
  try {
    const flat = platform.flattenMosaicDocument({ file: doc, width: w, height: h, resolveRef: () => null });
    if (flat.ok) return { m0: String(flat.file.m0), scope: "flat" };
  } catch { /* fall through */ }
  return { m0: String(doc.m0), scope: "root" };
}

async function probe(t) {
  const id = String(t.id);
  const tier = t.capabilities?.tier ?? "(none)";
  const missing = Object.entries(t.propsSchema ?? {}).filter(([k, d]) => d?.required && (t.defaultProps ?? {})[k] === undefined).map(([k]) => k);
  const base = { id, tier, findings: [], notes: [], grid: {}, hint: null };
  if (tier === "capability") return { ...base, status: "skipped", note: "capability tier — may hit APIs / side effects" };
  if (missing.length) return { ...base, status: "skipped", note: `requires inputs with no default: ${missing.join(", ")}` };

  // 1. conventions at the hint + the standard sweep
  const audit = await templateUtils.auditRenderedTemplate(t, { sweepCanvases: templateUtils.STANDARD_SWEEP_CANVASES, record: false });
  if (audit.skipped) return { ...base, status: "skipped", note: audit.skipped };
  base.findings = audit.findings;
  base.notes = audit.notes;
  base.hint = audit.canvas;

  // 2. positioning grid. A render that THROWS at a probe canvas is the
  //    template refusing it (fail-fast is the house style) — reported in the
  //    grid, not as a defect. A pipeline of refs has no layout to read.
  let refused = 0;
  let noLayout = 0;
  for (const a of ASPECTS) {
    base.grid[a.name] = [];
    for (const h of HEIGHTS) {
      const w = Math.round(h * a.ratio);
      try {
        const r = await t.render(JSON.parse(JSON.stringify(t.defaultProps ?? {})), ctxFor(w, h));
        const layout = layoutM0(r, w, h);
        const f = layout ? platform.computeLayoutFloors(layout.m0) : null;
        base.grid[a.name].push(f ? { w, h, floors: f, scope: layout.scope } : { w, h, floors: null });
        if (!f) noLayout++;
      } catch (err) {
        base.grid[a.name].push({ w, h, floors: null, refused: String(err?.message ?? err).split("\n")[0].replace(/^@[^:]+: /, "").slice(0, 70) });
        refused++;
      }
    }
  }
  const rows = Object.values(base.grid).flat().filter((r) => r.floors);
  const sY = Math.abs(slope(rows.map((r) => r.h), rows.map((r) => r.floors.precision.height)));
  const sX = Math.abs(slope(rows.map((r) => r.w), rows.map((r) => r.floors.precision.width)));
  const maxSlope = Math.max(sX, sY);
  const verdict = rows.length === 0 ? "n/a" : maxSlope > ABSOLUTE_SLOPE ? "absolute" : "ratio";
  return { ...base, status: "ok", verdict, maxSlope, refused, noLayout, probed: rows.length };
}

// ── Report ──────────────────────────────────────────────────────────────────
const short = (id) => id.replace(/^@[^/]+\//, "");
function attentionRows(results) {
  const rows = [];
  for (const r of results) {
    for (const f of r.findings ?? []) {
      const sev = f.severity === "error" ? "✗ error" : "⚠ warning";
      rows.push(`| \`${short(r.id)}\` | ${sev} | ${f.convention} | ${f.violations.map((v) => v.key).join(", ")} |`);
    }

  }
  return rows;
}
function gridTable(r) {
  const out = [`| aspect | ${HEIGHTS.map((h) => `${h}p`).join(" | ")} |`, `|---|${HEIGHTS.map(() => "---").join("|")}|`];
  for (const a of ASPECTS) {
    const cells = r.grid[a.name].map((c) =>
      c.floors
        ? `${dims(c.floors.safeMin)}${c.scope === "root" ? " (root)" : ""}${c.w < c.floors.safeMin.width || c.h < c.floors.safeMin.height ? " ⚠" : ""}`
        : c.refused
          ? `refused: ${c.refused}`
          : "—",
    );
    out.push(`| ${a.name} | ${cells.join(" | ")} |`);
  }
  return out;
}
function renderMd(results) {
  const ok = results.filter((r) => r.status === "ok");
  const attention = attentionRows(results);
  const out = [];
  out.push("# Template audit");
  out.push("");
  out.push("> Generated by `tools/audit-templates.mjs` (do not edit by hand). Every core-tier template rendered at its defaults: the build gate's render-time conventions plus the standard-canvas sweep, and a positioning probe across square / portrait / desktop × " + HEIGHTS.map((h) => `${h}p`).join(" / ") + ". A **safe canvas** is the smallest w×h that renders AND looks right (feasibility ∨ precision, per axis); a cell marked ⚠ is a probe canvas BELOW that floor. A safe canvas that climbs across a row tracks the canvas ⇒ **absolute** positioning (a head; does not nest); one that stays flat ⇒ **ratio** (composes). `refused:` is the template's own fail-fast check declining that canvas (by design); `(root)` means a child could not be inlined, so the root's own layout was read.");
  out.push("");
  out.push(`## ⚠ Attention (${attention.length})`);
  out.push("");
  if (attention.length === 0) out.push("_Nothing. Every probed template passes every rule on every canvas._");
  else out.push("| template | severity | rule | where |", "|---|---|---|---|", ...attention);
  out.push("");
  const skipped = results.filter((r) => r.status !== "ok");
  if (skipped.length) {
    out.push(`## Not probed (${skipped.length})`, "", "| template | reason |", "|---|---|");
    for (const r of skipped) out.push(`| \`${short(r.id)}\` | ${r.note} |`);
    out.push("");
  }
  out.push(`**${ok.length} probed** · ${ok.filter((r) => r.verdict === "ratio").length} ratio · ${ok.filter((r) => r.verdict === "absolute").length} absolute · ${ok.filter((r) => r.verdict === "n/a").length} n/a · ${attention.length} attention rows · ${skipped.length} skipped.`);
  out.push("");
  out.push("## All templates");
  out.push("");
  for (const r of results) {
    out.push(`### ${short(r.id)}`, "");
    if (r.status !== "ok") { out.push(`- **skipped** — ${r.note}`, ""); continue; }
    const verdict = r.verdict === "n/a" ? "n/a (a pipeline of refs — no layout to probe)" : `${r.verdict === "absolute" ? "**ABSOLUTE**" : "ratio"} (max precision slope ${r.maxSlope.toFixed(2)})`;
    out.push(`- verdict: ${verdict} · hinted canvas ${dims(r.hint)}${r.refused ? ` · refuses ${r.refused} probe canvas(es) by its own fail-fast check` : ""}`);
    for (const f of r.findings) for (const v of f.violations) out.push(`- ${f.severity === "error" ? "✗" : "⚠"} ${f.convention} \`${v.key}\`: ${v.detail}`);
    for (const n of r.notes) out.push(`- note: ${n}`);
    out.push("", "Safe canvas per probe:", "", ...gridTable(r), "");
  }
  return out.join("\n") + "\n";
}

const started = Date.now();
const picked = templates.filter((t) => !ONLY || String(t.id).includes(ONLY));
const results = [];
for (const t of picked) results.push(await probe(t));
const md = renderMd(results);
if (WRITE) {
  const file = path.join(ROOT, "TEMPLATE-AUDIT.md");
  fs.writeFileSync(file, md);
  console.log(`audit-templates: wrote ${path.relative(ROOT, file)} — ${results.length} templates in ${((Date.now() - started) / 1000).toFixed(1)}s`);
} else {
  process.stdout.write(md);
  console.error(`audit-templates: ${results.length} templates in ${((Date.now() - started) / 1000).toFixed(1)}s (add --write for TEMPLATE-AUDIT.md)`);
}
