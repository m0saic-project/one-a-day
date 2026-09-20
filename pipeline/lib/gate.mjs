// gate — the deterministic half of the day. The agent produced files; this
// decides what ships, exactly the same way every day:
//
//   1. scope guard   — only the day's allowed paths may differ from HEAD;
//                      anything else is reverted, and the day fails
//   2. no-ship days  — everything but the journal is reverted
//   3. verify        — npm run verify, tools/check-freeze.mjs, m0saic doctor --json
//   4. the template  — exactly one new src/<pack>/<slug>/vN/, validate-only exit 0
//                      (never 3: an error mosaic is a picture of a failure),
//                      its why-tutorial validates through the CLI (--tutorial),
//                      a preview.png of real size
//   5. freeze        — the new folder is added to frozen.manifest.json
//   6. commit + push — one commit with Agent:/Model: trailers
//
// Every step logs to journal/<date>/logs/gate.log and records its verdict in
// run.json. Nothing here calls an agent.
import fs from "node:fs";
import path from "node:path";
import { runProcess } from "./spawn.mjs";
import { classifyChanges, commitAll, porcelain, push, revertPaths } from "./git.mjs";
import { dayNumber, patchRun, readJson, readRun, readState, upsertIndex } from "./journal.mjs";

const PREVIEW_MIN_BYTES = 5 * 1024;

export function templateIdForDir(repoId, dir) {
  const m = /^src\/([^/]+)\/([^/]+)\/(v\d+)\/$/.exec(dir);
  return m ? `${repoId}/${m[1]}/${m[2]}/${m[3]}` : null;
}
export function encodeTemplateKey(id) { return id.replace(/\//g, "__"); }

export function commitMessage({ day, templateId, title, agent, model, reason }) {
  const head = templateId ? `day ${String(day).padStart(3, "0")}: ${templateId} — ${title ?? ""}`.trimEnd() : `day ${String(day).padStart(3, "0")}: no template — ${reason ?? "see journal"}`;
  return `${head}\n\nAgent: ${agent ?? "unknown"}\nModel: ${model ?? "undeclared"} (self-declared)\n`;
}

/**
 * @returns {Promise<{ok:boolean,status:"shipped"|"no-ship"|"failed",templateId:string|null,reasons:string[],sha:string|null}>}
 */
export async function runGate({ repo, date, dayDir, noPush = false, remote = "origin", branch = "main", env = {}, say = console.log }) {
  const logFile = path.join(dayDir, "logs", "gate.log");
  const reasons = [];
  const fail = (r) => { reasons.push(r); say(`[gate] ✗ ${r}`); };
  const ok = (r) => say(`[gate] ✓ ${r}`);
  const run = (cmd, args, extra = {}) => runProcess({ cmd, args, cwd: repo, env, logFile, timeoutMs: 20 * 60 * 1000, ...extra });
  const state = readState(dayDir);
  const runRec = readRun(dayDir);
  const day = dayNumber(repo, date);
  const agent = runRec.runner?.adapter ?? "unknown";
  const model = runRec.model?.selfDeclared ?? null;
  const wantShip = state.decision === "ship";

  // ── 1. scope guard ──
  let changes = classifyChanges(porcelain(repo), { date });
  if (changes.forbidden.length) {
    for (const f of changes.forbidden) fail(`out of scope: ${f.path} (${f.reason}) — reverted`);
    revertPaths(repo, changes.forbidden);
    changes = classifyChanges(porcelain(repo), { date });
  }
  const scopeViolated = reasons.length > 0;

  // ── 2. no-ship days: keep the journal, drop everything else ──
  if (!wantShip || scopeViolated) {
    const nonJournal = changes.allowed.filter((e) => !e.path.startsWith("journal/"));
    if (nonJournal.length) { revertPaths(repo, nonJournal); say(`[gate] reverted ${nonJournal.length} non-journal change(s) (${wantShip ? "scope violated" : "no-ship day"})`); }
    const reason = scopeViolated ? "scope violation" : (state.noShipReason ?? "critique rejected every variant");
    const status = scopeViolated ? "failed" : "no-ship";
    patchRun(dayDir, { result: { status, templateId: null, reason }, gate: { reasons, at: new Date().toISOString() } });
    upsertIndex(repo, { date, day, agent, model, status, templateId: null, title: null, useCase: state.useCase ?? null, tags: state.tags ?? [], sources: state.sources ?? [] });
    const sha = commitAll(repo, commitMessage({ day, agent, model, reason }));
    if (!noPush) { try { push(repo, remote, branch); ok(`pushed ${sha?.slice(0, 7)}`); } catch (e) { fail(`push failed: ${e.message}`); } }
    return { ok: !scopeViolated, status, templateId: null, reasons, sha };
  }

  // ── 3. exactly one new template ──
  if (changes.newTemplateDirs.length !== 1) {
    fail(`expected exactly one new template folder, found ${changes.newTemplateDirs.length}: ${changes.newTemplateDirs.join(", ") || "(none)"}`);
    return finishFailed();
  }
  const newDir = changes.newTemplateDirs[0];
  if (/^src\/harness\//.test(newDir)) { fail(`${newDir} is in the harness pack - internal fixtures are human-maintained; a day's template goes in a public pack`); return finishFailed(); }
  const manifest = readJson(path.join(repo, "template-manifest.json"), null);
  const repoId = manifest?.repo?.repoId;
  const templateId = repoId ? templateIdForDir(repoId, newDir) : null;
  if (!templateId) { fail("template-manifest.json unreadable or missing repo.repoId"); return finishFailed(); }
  const entry = (manifest.templates ?? []).find((t) => t.templateKey === templateId);
  if (!entry) { fail(`${templateId} is not in template-manifest.json — the build did not register it`); return finishFailed(); }
  const badAssets = changes.touchedAssetDirs.filter((d) => d !== encodeTemplateKey(templateId));
  if (badAssets.length) { fail(`preview assets of other templates were touched: ${badAssets.join(", ")}`); return finishFailed(); }
  ok(`one new template: ${templateId}`);

  // ── 4. verify + freeze + doctor ──
  let r = await run("npm", ["run", "verify"]);
  if (r.exitCode !== 0) { fail(`npm run verify exited ${r.exitCode}${r.timedOut ? " (timed out)" : ""}`); return finishFailed(); }
  ok("npm run verify");
  r = await run("node", ["tools/check-freeze.mjs"]);
  if (r.exitCode !== 0) { fail(`check-freeze exited ${r.exitCode}`); return finishFailed(); }
  ok("freeze intact");
  r = await run("m0saic", ["doctor", ".", "--json"]);
  let doctor = null;
  try { doctor = JSON.parse(r.stdout); } catch { /* handled below */ }
  if (!doctor || doctor.ok !== true) { fail(`m0saic doctor: ${doctor ? `${doctor.errors?.length ?? "?"} error(s)` : `unreadable report (exit ${r.exitCode})`}`); return finishFailed(); }
  ok(`m0saic doctor (${doctor.rendered} rendered, ${doctor.warnings?.length ?? 0} warning(s))`);

  // ── 5. the render is real ──
  r = await run("m0saic", ["make", templateId, "--template-repo", ".", "--validate-only", "--quiet"]);
  if (r.exitCode !== 0) { fail(`validate-only exited ${r.exitCode}${r.exitCode === 3 ? " — the render would be an error mosaic" : ""}`); return finishFailed(); }
  ok("validate-only exit 0");
  r = await run("m0saic", ["make", templateId, "--template-repo", ".", "--tutorial", "--validate-only", "--quiet"]);
  if (r.exitCode !== 0) { fail(`tutorial validate-only exited ${r.exitCode} — the why-tutorial does not render (npm run build ran tools/check-why.mjs; see its report)`); return finishFailed(); }
  ok("why-tutorial validates (--tutorial)");
  const previewPng = path.join(repo, "assets", "templates", encodeTemplateKey(templateId), "preview.png");
  const size = fs.existsSync(previewPng) ? fs.statSync(previewPng).size : 0;
  if (size < PREVIEW_MIN_BYTES) { fail(`preview.png missing or tiny (${size} bytes) at ${path.relative(repo, previewPng)}`); return finishFailed(); }
  ok(`preview.png ${(size / 1024).toFixed(0)} KB`);
  if (!fs.existsSync(path.join(dayDir, "50-ship.md"))) { fail("journal/<date>/50-ship.md missing"); return finishFailed(); }
  if (!model) say("[gate] ⚠ model.selfDeclared is empty — recorded as undeclared");

  // ── 6. freeze the new folder, commit, push ──
  r = await run("node", ["tools/check-freeze.mjs", "--update", "--tag", date]);
  if (r.exitCode !== 0) { fail(`check-freeze --update exited ${r.exitCode}`); return finishFailed(); }
  patchRun(dayDir, { result: { status: "shipped", templateId, title: entry.title ?? null, reason: null }, gate: { reasons, doctorWarnings: doctor.warnings?.length ?? 0, at: new Date().toISOString() } });
  upsertIndex(repo, { date, day, agent, model, status: "shipped", templateId, title: entry.title ?? null, pack: entry.pack ?? null, useCase: state.useCase ?? null, tags: entry.tags ?? [], sources: state.sources ?? [] });
  const sha = commitAll(repo, commitMessage({ day, templateId, title: entry.title, agent, model }));
  ok(`committed ${sha?.slice(0, 7)}`);
  if (!noPush) { try { push(repo, remote, branch); ok(`pushed to ${remote}/${branch}`); } catch (e) { fail(`push failed: ${e.message} (the commit is local; tomorrow's preflight pulls first)`); } }
  return { ok: true, status: "shipped", templateId, reasons, sha };

  function finishFailed() {
    // The template did not clear the gate: keep the journal, drop the rest,
    // record why, commit the journal only.
    const rest = classifyChanges(porcelain(repo), { date }).allowed.filter((e) => !e.path.startsWith("journal/"));
    if (rest.length) revertPaths(repo, rest);
    patchRun(dayDir, { result: { status: "failed", templateId: null, reason: reasons[reasons.length - 1] ?? "gate failed" }, gate: { reasons, at: new Date().toISOString() } });
    upsertIndex(repo, { date, day, agent, model, status: "failed", templateId: null, title: null, useCase: state.useCase ?? null, tags: state.tags ?? [], sources: state.sources ?? [] });
    const sha = commitAll(repo, commitMessage({ day, agent, model, reason: `gate failed — ${reasons[reasons.length - 1] ?? ""}` }));
    if (!noPush) { try { push(repo, remote, branch); } catch (e) { fail(`push failed: ${e.message}`); } }
    return { ok: false, status: "failed", templateId: null, reasons, sha };
  }
}
