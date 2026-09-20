#!/usr/bin/env node
/**
 * The why-tutorial gate — every template in this repo explains itself.
 *
 * Runs at the end of `npm run build` (after check-registry, so dist/ is
 * fresh and every template already passed the platform conventions) and in
 * the daily gate. For every template except the repo's front door
 * (`repo.helloWorld`, the one human-placed template) and the `harness` pack
 * (internal fixtures, human-maintained, never a day's work) it checks:
 *
 *   1. `renderTutorial` exists and was built by `whyTutorial(WHY, render)`
 *      from src/_shared/why.ts — the spec is in the helper's registry.
 *   2. The spec agrees with the journal: `journal/<date>/` exists, `day` is
 *      that date's day number, and when `journal/<date>/run.json` is there,
 *      `agent` / `model` match what the runner and the agent recorded. These
 *      are ERRORS for a template that is not frozen yet (today's work - the
 *      journal must agree before it ships) and WARNINGS for a frozen one (it
 *      cannot change any more; a pruned journal must not break the build).
 *   3. It renders (1280x720 and 1080x1920, design mode, no media) as a
 *      pipeline of at least six steps: the four chrome pages in order
 *      (cover, problem, solution, use it), the template itself (its m0
 *      equals the template's own default render), then "how it was made"
 *      (the harness timeline) last — and every step's m0 validates and
 *      keeps its page's layout contract.
 *   4. `WHY.timeline` agrees with `journal/<date>/trace.json` when the runner
 *      wrote one: every phase named is in the trace and its duration is
 *      within 25% (the ship phase is exempt - it is still running when the
 *      agent writes the spec). A `self-reported` timeline with a trace on
 *      disk is an error while unfrozen.
 *
 * The spec's content rules (budget, ASCII, real URLs, no scaffold
 * placeholder) throw at import inside `whyTutorial`, so a bad spec already
 * failed at `require("../dist/index.js")` above; this file is about presence,
 * honesty against the journal, and the rendered shape.
 *
 *   node tools/check-why.mjs          human log lines, exit 1 on any error
 *   node tools/check-why.mjs --json   one report on stdout, same exit code
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.M0SAIC_CLI ??= "/usr/bin/false";
const JSON_OUT = process.argv.includes("--json");

const report = { ok: true, templates: 0, checked: 0, errors: [], warnings: [], notes: [] };
const say = (...a) => { if (!JSON_OUT) console.log(...a); };
const fail = (...a) => { if (!JSON_OUT) console.error(...a); };
const finish = (code) => {
  if (JSON_OUT) { report.ok = code === 0; process.stdout.write(JSON.stringify(report, null, 2) + "\n"); }
  process.exit(code);
};
const error = (templateId, key, detail) => report.errors.push({ templateId, convention: "whyTutorial", severity: "error", key, detail, fix: FIX });
const warn = (templateId, key, detail) => report.warnings.push({ templateId, convention: "whyTutorial", severity: "warning", key, detail, fix: FIX });
const FIX =
  "every template explains why it exists: `renderTutorial: whyTutorial(WHY, render)` from src/_shared/why.ts, with WHY filled from the day's journal " +
  "(day, date, agent, model as run.json declares them; who; the observed problem; the sources actually opened; the solution; the render one-liner). " +
  "The scaffold writes the skeleton; replace every " + "[fill me]" + "; copy timeline from journal/<date>/trace.json in the ship phase. It renders as six steps: cover, problem, solution, use it, the template, how it was made.";

let entry, why, layout, dsl;
try {
  entry = require("../dist/index.js");
  why = require("../dist/_shared/why.js");
  layout = require("../dist/_shared/layout.js");
  dsl = require("@m0saic/dsl");
} catch (err) {
  fail(`\n[check-why] ✗ could not load dist/ (run the build first): ${err && err.message ? err.message : err}\n`);
  finish(1);
}

const templates = Array.isArray(entry.templates) ? entry.templates : [];
const repo = entry.repo ?? entry.TEMPLATE_REPO ?? {};
const frontDoor = repo.helloWorld ? String(repo.helloWorld) : null;
report.templates = templates.length;

const ctxFor = (width, height) => {
  const target = { width, height, fps: 30, durationMs: 2000 };
  return { mode: "design", target, output: { ...target, workspaceDir: path.join(ROOT, "test-output", "why") }, media: {} };
};

const readJson = (file, fallback = null) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };
const indexRows = (() => { const v = readJson(path.join(ROOT, "journal", "index.json"), []); return Array.isArray(v) ? v : []; })();
const frozenFiles = Object.keys(readJson(path.join(ROOT, "frozen.manifest.json"), {})?.files ?? {});
const srcDirOf = (id) => { const m = /^@[^/]+\/([^/]+)\/([^/]+)\/(v\d+)$/.exec(id); return m ? `src/${m[1]}/${m[2]}/${m[3]}/` : null; };
const dayNumberFor = (date) => {
  const existing = indexRows.find((r) => r.date === date);
  if (existing && existing.day) return existing.day;
  return indexRows.filter((r) => r.date < date).length + 1;
};

for (const t of templates) {
  const id = String(t.id);
  if (frontDoor && id === frontDoor) { report.notes.push(`${id}: the front door is exempt (human-placed, not a day's work)`); continue; }
  if (id.startsWith(`${repo.repoId ?? "@one-a-day"}/harness/`)) { report.notes.push(`${id}: harness fixtures are exempt (internal, human-maintained)`); continue; }
  report.checked += 1;

  // ── 1. presence, via the helper ──
  if (typeof t.renderTutorial !== "function") { error(id, "missing", "no renderTutorial - the template does not explain why it exists"); continue; }
  const spec = typeof why.whySpecFor === "function" ? why.whySpecFor(id) : undefined;
  if (!spec) { error(id, "not-why", "renderTutorial is not built by whyTutorial() from src/_shared/why.ts (no spec registered for this id)"); continue; }

  // ── 2. honesty against the journal (hard while unfrozen, soft once shipped) ──
  const dir = srcDirOf(id);
  const shipped = dir ? frozenFiles.some((f) => f.startsWith(dir)) : false;
  const journalIssue = shipped ? warn : error;
  const dayDir = path.join(ROOT, "journal", spec.date);
  if (!fs.existsSync(dayDir)) journalIssue(id, "journal", `WHY.date ${spec.date} has no journal/${spec.date}/ folder${shipped ? " (frozen template; journal pruned?)" : ""}`);
  else {
    const expectedDay = dayNumberFor(spec.date);
    if (spec.day !== expectedDay) journalIssue(id, "day", `WHY.day is ${spec.day}; journal/index.json makes ${spec.date} day ${expectedDay}`);
    const run = readJson(path.join(dayDir, "run.json"), null);
    if (!run) warn(id, "run", `journal/${spec.date}/run.json is missing - agent / model could not be cross-checked`);
    else {
      const adapter = run.runner && run.runner.adapter ? String(run.runner.adapter) : null;
      const model = run.model && run.model.selfDeclared ? String(run.model.selfDeclared) : null;
      if (adapter && spec.agent !== adapter) journalIssue(id, "agent", `WHY.agent is ${JSON.stringify(spec.agent)}; run.json says the adapter was ${JSON.stringify(adapter)}`);
      if (model && spec.model !== model) journalIssue(id, "model", `WHY.model is ${JSON.stringify(spec.model)}; run.json model.selfDeclared is ${JSON.stringify(model)}`);
      if (!model) warn(id, "model", `run.json has no model.selfDeclared yet; WHY.model ${JSON.stringify(spec.model)} is unverified`);
    }
    // ── the timeline against the runner's trace ──
    const trace = readJson(path.join(dayDir, "trace.json"), null);
    const tl = spec.timeline;
    if (trace && Array.isArray(trace.phases) && tl) {
      if (tl.source !== "runner") journalIssue(id, "timeline-source", `WHY.timeline.source is ${JSON.stringify(tl.source)} but journal/${spec.date}/trace.json exists - copy the runner's numbers`);
      const byName = new Map(trace.phases.map((ph) => [String(ph.name), ph]));
      for (const ph of tl.phases) {
        const rec = byName.get(String(ph.name));
        if (!rec) { journalIssue(id, "timeline-phase", `WHY.timeline names phase ${JSON.stringify(ph.name)}, which is not in trace.json`); continue; }
        if (String(ph.name).startsWith("ship")) continue;
        const ref = Number(rec.durMs ?? 0);
        if (ref > 0 && Math.abs(ph.durMs - ref) > 0.25 * ref) journalIssue(id, "timeline-duration", `WHY.timeline ${ph.name} lasts ${ph.durMs} ms; trace.json says ${ref} ms`);
      }
    } else if (tl && tl.source === "runner") {
      warn(id, "timeline-source", `WHY.timeline.source is "runner" but journal/${spec.date}/trace.json is missing - unverified`);
    }
    const scout = path.join(dayDir, "10-scout.md");
    if (fs.existsSync(scout)) {
      const text = fs.readFileSync(scout, "utf8");
      const uncited = spec.sources.filter((u) => !text.includes(u));
      if (uncited.length) warn(id, "sources", `${uncited.length} WHY source(s) do not appear in journal/${spec.date}/10-scout.md: ${uncited.slice(0, 3).join(", ")}${uncited.length > 3 ? ", ..." : ""}`);
    }
  }
  if (spec.id !== id) error(id, "id", `WHY.id is ${JSON.stringify(spec.id)}`);
  // the display title and the tags carry the day: "<date> · <Title>", tags <date> + day-NNN
  const label = String(t.label ?? "");
  if (!label.startsWith(`${spec.date} · `)) journalIssue(id, "title", `label ${JSON.stringify(label)} does not start with WHY.date "${spec.date} · " (the day is the ordinal)`);
  if (label !== `${spec.date} · ${spec.title}`) warn(id, "title", `label ${JSON.stringify(label)} is not "${spec.date} · ${spec.title}" (WHY.title is the human title)`);
  const tags = Array.isArray(t.tags) ? t.tags.map(String) : [];
  const dayTag = `day-${String(spec.day).padStart(3, "0")}`;
  if (!tags.includes(spec.date) || !tags.includes(dayTag)) journalIssue(id, "tags", `tags must carry "${spec.date}" and "${dayTag}" - got [${tags.join(", ")}]`);

  // ── 3. the rendered shape ──
  for (const [w, h] of [[1280, 720], [1080, 1920]]) {
    let pipeline;
    try { pipeline = await t.renderTutorial(t.defaultProps ?? {}, ctxFor(w, h)); }
    catch (err) { error(id, "render", `renderTutorial threw at ${w}x${h}: ${err && err.message ? err.message.split("\n")[0] : err}`); continue; }
    if (!pipeline || pipeline.kind !== "mosaic_pipeline" || !Array.isArray(pipeline.steps)) { error(id, "shape", `renderTutorial at ${w}x${h} did not return a mosaic_pipeline`); continue; }
    const labels = why.WHY_PAGE_LABELS ?? [];
    const madeLabel = why.WHY_MADE_LABEL ?? "why: how it was made";
    if (pipeline.steps.length < labels.length + 2) error(id, "steps", `tutorial at ${w}x${h} has ${pipeline.steps.length} step(s); the convention is ${labels.length} pages, the template, then how it was made`);
    const lastDoc = pipeline.steps[pipeline.steps.length - 1]?.file;
    if (!lastDoc || String(lastDoc.editor?.label ?? "") !== madeLabel) error(id, "made", `the last step at ${w}x${h} is not the "how it was made" page (${JSON.stringify(madeLabel)})`);
    pipeline.steps.forEach((step, i) => {
      if (!(step.durationMs > 0)) error(id, "duration", `step ${i} at ${w}x${h} has no positive durationMs`);
      const doc = step.file;
      if (!doc || doc.kind !== "mosaic_document") { if (!step.ref) error(id, "step", `step ${i} at ${w}x${h} carries neither an inline document nor a ref`); return; }
      const v = typeof dsl.validateM0String === "function" ? dsl.validateM0String(String(doc.m0)) : { ok: true };
      const ok = v === true || (v && (v.ok === true || v.valid === true));
      if (!ok) error(id, "m0", `step ${i} at ${w}x${h}: m0 does not validate`);
      if (i < labels.length) {
        const label = doc.editor && doc.editor.label ? String(doc.editor.label) : "";
        if (!label.startsWith(labels[i])) error(id, "page", `step ${i} at ${w}x${h} is labelled ${JSON.stringify(label)}, expected ${JSON.stringify(labels[i])}...`);
      }
      // every chrome page carries a layout contract that holds (the template's own step is check-layout's job)
      const isTemplateStep = i >= labels.length && i < pipeline.steps.length - 1;
      if (!isTemplateStep && typeof layout.checkLayoutIntent === "function") {
        const check = layout.checkLayoutIntent(doc, w, h);
        if (!check) error(id, "page-contract", `step ${i} at ${w}x${h} carries no layout contract`);
        else for (const v of check.violations) error(id, "page-contract", `step ${i} at ${w}x${h}: ${v.detail}`);
      }
    });
    // the step(s) before the last ARE the template at its defaults
    try {
      const own = await t.render(t.defaultProps ?? {}, ctxFor(w, h));
      const body = pipeline.steps.slice(0, -1);
      const last = body[body.length - 1];
      if (own && own.kind === "mosaic_document") {
        if (!last || !last.file || String(last.file.m0) !== String(own.m0)) error(id, "template-step", `the step before "how it was made" at ${w}x${h} is not the template's own default render`);
      } else if (own && own.kind === "mosaic_pipeline") {
        const tail = body.slice(-own.steps.length);
        if (tail.length !== own.steps.length || tail.some((s, i) => String(s.file?.m0 ?? s.ref) !== String(own.steps[i].file?.m0 ?? own.steps[i].ref))) error(id, "template-step", `the steps before "how it was made" at ${w}x${h} are not the template's own default pipeline`);
      }
    } catch (err) {
      report.notes.push(`${id}: own render threw at ${w}x${h} (${err && err.message ? err.message.split("\n")[0] : err}) - the tutorial's last page must say so`);
    }
  }
}

if (report.errors.length) {
  fail(`[check-why] ✗ ${report.errors.length} why-tutorial error(s) across ${report.checked} template(s):`);
  for (const e of report.errors) fail(`  ✗ ${e.templateId} — ${e.key}: ${e.detail}`);
  fail(`[check-why] ${FIX}`);
  finish(1);
}
for (const w of report.warnings) say(`  ⚠ ${w.templateId} — ${w.key}: ${w.detail}`);
say(`[check-why] ✓ ${report.checked} template(s) explain why they exist (${report.warnings.length} warning(s)${frontDoor ? "; front door exempt" : ""}).`);
finish(0);
