#!/usr/bin/env node
/**
 * The layout-contract gate — every template says what its geometry promises,
 * and the promise holds at every canvas the convention sweeps.
 *
 * Runs at the end of `npm run build` (after check-registry: dist/ is fresh
 * and the platform conventions hold). For every template except the repo's
 * front door (`repo.helloWorld`) — harness fixtures included — it checks:
 *
 *   1. A default render carries a layout intent (`editor.layoutIntent`,
 *      stamped by `withLayoutIntent` from src/_shared/layout.ts) with at
 *      least one constraint.
 *   2. Every `type: "text"` source is tagged (`editor.label`) and covered by a
 *      `textFits` constraint — svg text never wraps or shrinks by itself, and
 *      an unfitted string clips silently. (Use `textFitsMeasured` when the
 *      template measures with the real font; the default 0.72 em ruler is
 *      deliberately coarse.)
 *   3. The template declares the `debugLayout` knob (boolean, default false):
 *      the standard way to SEE the contract in Make; with it on, the hinted
 *      canvas render reports `editor.layoutContract.ok`.
 *   4. The intent holds at the 7-canvas set (1920x1080 · 1280x720 · 1080x1920
 *      · 1080x1080 · 3840x2160 · 640x360 · 480x270) at the template's
 *      defaults — `checkLayout` through the stamped intent, so what the test
 *      sweeps and what the build sweeps is the same contract.
 *
 * Templates whose required inputs have no default are skipped, not failed
 * (the same posture as check-registry). Debug-only at render by ruling: a
 * production render never blocks on a violation; this gate and the test are
 * where a violation bites.
 *
 *   node tools/check-layout.mjs          human log lines, exit 1 on any error
 *   node tools/check-layout.mjs --json   one report on stdout, same exit code
 */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.M0SAIC_CLI ??= "/usr/bin/false";
const JSON_OUT = process.argv.includes("--json");

const report = { ok: true, templates: 0, checked: 0, skipped: [], errors: [], warnings: [], notes: [] };
const say = (...a) => { if (!JSON_OUT) console.log(...a); };
const fail = (...a) => { if (!JSON_OUT) console.error(...a); };
const finish = (code) => {
  if (JSON_OUT) { report.ok = code === 0; process.stdout.write(JSON.stringify(report, null, 2) + "\n"); }
  process.exit(code);
};
const FIX =
  "declare the layout contract: tag every source (editor.label), build `constraints` (textFitsMeasured / textFitsAll for every text label; " +
  "`within`, `minWidthFrac`, `aspect` for the chrome the design depends on), add the `debugLayout` boolean knob (default false), and return " +
  "`withLayoutIntent(doc, ctx, { templateId, constraints, debug: props.debugLayout === true })` from render(). Sweep it in the test with `sweepLayout` " +
  "(src/_shared/layout.ts). A violation is a design decision: shrink, compact the wording, drop the row - never ellipsis at the floor.";
const error = (templateId, key, detail) => report.errors.push({ templateId, convention: "layoutContract", severity: "error", key, detail, fix: FIX });
const warn = (templateId, key, detail) => report.warnings.push({ templateId, convention: "layoutContract", severity: "warning", key, detail, fix: FIX });

let entry, layout;
try {
  entry = require("../dist/index.js");
  layout = require("../dist/_shared/layout.js");
} catch (err) {
  fail(`\n[check-layout] ✗ could not load dist/ (run the build first): ${err && err.message ? err.message : err}\n`);
  finish(1);
}

const templates = Array.isArray(entry.templates) ? entry.templates : [];
const repo = entry.repo ?? entry.TEMPLATE_REPO ?? {};
const frontDoor = repo.helloWorld ? String(repo.helloWorld) : null;
report.templates = templates.length;
const CANVASES = layout.CONTRACT_CANVASES ?? [[1920, 1080], [1280, 720], [1080, 1920], [1080, 1080], [3840, 2160], [640, 360], [480, 270]];

const ctxFor = (width, height) => {
  const target = { width, height, fps: 30, durationMs: 2000 };
  return { mode: "render", target, output: { ...target, workspaceDir: path.join(ROOT, "test-output", "layout") }, media: {} };
};
const docOf = (renderable) => (renderable && renderable.kind === "mosaic_document" ? renderable : renderable && renderable.kind === "mosaic_pipeline" ? null : null);

for (const t of templates) {
  const id = String(t.id);
  if (frontDoor && id === frontDoor) { report.notes.push(`${id}: the front door is exempt (human-placed)`); continue; }
  report.checked += 1;
  const hint = t.outputHints ?? {};
  const hw = Number(hint.width) > 0 ? Number(hint.width) : 1280;
  const hh = Number(hint.height) > 0 ? Number(hint.height) : 720;

  // ── 1 + 2: the intent, and every text covered ──
  let renderable;
  try { renderable = await t.render(t.defaultProps ?? {}, ctxFor(hw, hh)); }
  catch (err) { report.skipped.push({ templateId: id, reason: `defaults do not render: ${err && err.message ? err.message.split("\n")[0] : err}` }); continue; }
  const doc = docOf(renderable);
  if (!doc) {
    if (renderable && renderable.kind === "mosaic_pipeline") { report.notes.push(`${id}: renders a pipeline - the layout gate checks documents only (declare the contract on the steps' documents)`); continue; }
    error(id, "render", "defaults did not render a document"); continue;
  }
  const intent = layout.layoutIntentOf(doc);
  if (!intent) { error(id, "missing", "no layout contract - render() does not return withLayoutIntent(...)"); continue; }
  if (!intent.constraints.length) error(id, "empty", "the layout contract declares no constraints");
  const texts = (doc.sources ?? []).map((s, i) => ({ i, s })).filter(({ s }) => s && s.type === "text");
  for (const { i, s } of texts) {
    const label = s.editor && s.editor.label ? String(s.editor.label) : "";
    if (!label) { error(id, "untagged", `text source #${i} has no editor.label - tag it so the contract can find it`); continue; }
    if (!intent.constraints.some((c) => c.label === label && c.textFits)) error(id, "text-fit", `text "${label}" has no textFits constraint`);
  }

  // ── 3: the debug knob ──
  const knob = t.propsSchema && t.propsSchema.debugLayout;
  if (!knob || knob.type !== "boolean") error(id, "knob", "no `debugLayout` boolean prop - the standard way to see the contract in Make");
  else if (t.defaultProps && t.defaultProps.debugLayout !== false) error(id, "knob", "`debugLayout` must default to false");
  else {
    try {
      const dbg = docOf(await t.render({ ...(t.defaultProps ?? {}), debugLayout: true }, ctxFor(hw, hh)));
      const stamp = dbg && dbg.editor && dbg.editor.layoutContract;
      if (!stamp) error(id, "knob", "with debugLayout on, the render carries no editor.layoutContract stamp - withLayoutIntent is not wired to the knob");
      else if (stamp.ok !== true) error(id, "knob", `with debugLayout on at ${hw}x${hh} the contract fails: ${(stamp.violations ?? []).slice(0, 3).map((v) => v.detail).join(" | ")}`);
    } catch (err) { error(id, "knob", `render with debugLayout on threw: ${err && err.message ? err.message.split("\n")[0] : err}`); }
  }

  // ── 4: the sweep ──
  for (const [w, h] of CANVASES) {
    let d;
    try { d = docOf(await t.render(t.defaultProps ?? {}, ctxFor(w, h))); }
    catch (err) { error(id, "sweep", `defaults threw at ${w}x${h}: ${err && err.message ? err.message.split("\n")[0] : err}`); continue; }
    if (!d) continue;
    const check = layout.checkLayoutIntent(d, w, h);
    if (!check) { error(id, "sweep", `no layout intent at ${w}x${h}`); continue; }
    for (const v of check.violations) error(id, "sweep", `at ${w}x${h}: ${v.detail}`);
  }
}

if (report.errors.length) {
  fail(`[check-layout] ✗ ${report.errors.length} layout-contract error(s) across ${report.checked} template(s):`);
  for (const e of report.errors) fail(`  ✗ ${e.templateId} — ${e.key}: ${e.detail}`);
  fail(`[check-layout] ${FIX}`);
  finish(1);
}
for (const w of report.warnings) say(`  ⚠ ${w.templateId} — ${w.key}: ${w.detail}`);
for (const s of report.skipped) say(`  · ${s.templateId} skipped — ${s.reason}`);
say(`[check-layout] ✓ ${report.checked} template(s) keep their layout contract at ${CANVASES.length} canvases (${report.skipped.length} skipped: inputs required${frontDoor ? "; front door exempt" : ""}).`);
finish(0);
