#!/usr/bin/env node
// run — one day of one-a-day. Fresh agent call per phase; the journal folder
// is the only memory; the gate decides what ships.
//
//   node pipeline/run.mjs                      today, every phase, then gate + push
//   node pipeline/run.mjs --no-push            same, commit stays local (dry run)
//   node pipeline/run.mjs --phase build        one phase only (no gate)
//   node pipeline/run.mjs --from critique      resume from a phase (then gate)
//   node pipeline/run.mjs --gate-only          skip the agent, run the gate on the tree
//   node pipeline/run.mjs --date 2026-09-21    a specific journal day
//   node pipeline/run.mjs --agent codex        override pipeline/config.json / ONE_A_DAY_AGENT
//   node pipeline/run.mjs --model <name>       passed to the adapter (ONE_A_DAY_MODEL)
//   node pipeline/run.mjs --skip-preflight     (development only)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runProcess } from "./lib/spawn.mjs";
import { currentBranch, isClean, porcelain, pullFfOnly } from "./lib/git.mjs";
import { dayDir as dayDirOf, ensureDay, isIsoDate, patchRun, patchState, readRun, readState, renderTemplate, todayIso, dayNumber, readJson } from "./lib/journal.mjs";
import { runGate } from "./lib/gate.mjs";

const PIPELINE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(PIPELINE, "..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(PIPELINE, "config.json"), "utf8"));

/* ── args ── */
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const DATE = val("--date") ?? todayIso();
if (!isIsoDate(DATE)) { console.error(`--date must be YYYY-MM-DD, got ${DATE}`); process.exit(2); }
const ONLY = val("--phase");
const FROM = val("--from");
const NO_PUSH = has("--no-push");
const GATE_ONLY = has("--gate-only");
const SKIP_PREFLIGHT = has("--skip-preflight");
const AGENT = val("--agent") ?? process.env.ONE_A_DAY_AGENT ?? CONFIG.agent;
const MODEL = val("--model") ?? process.env.ONE_A_DAY_MODEL ?? CONFIG.adapters?.[AGENT]?.model ?? null;

const DAY_DIR = dayDirOf(REPO, DATE);
const say = (...a) => { const line = `[${new Date().toTimeString().slice(0, 8)}] ${a.join(" ")}`; console.log(line); try { fs.appendFileSync(path.join(DAY_DIR, "logs", "runner.log"), line + "\n"); } catch { /* before the dir exists */ } };
const CHILD_ENV = {
  M0SAIC_TELEMETRY: process.env.M0SAIC_TELEMETRY ?? "ghost",
  M0SAIC_NO_UPDATE_CHECK: process.env.M0SAIC_NO_UPDATE_CHECK ?? "1",
  ONE_A_DAY_DATE: DATE,
  ONE_A_DAY_DAY_DIR: DAY_DIR,
  ONE_A_DAY_REPO: REPO,
};
const started = Date.now();
const deadline = started + (CONFIG.dayTimeoutMin ?? 270) * 60 * 1000;

/* ── adapter ── */
async function loadAdapter(name) {
  const file = path.join(PIPELINE, "agents", `${name}.mjs`);
  if (!fs.existsSync(file)) throw new Error(`no adapter pipeline/agents/${name}.mjs`);
  const mod = await import(pathToFileURL(file).href);
  if (typeof mod.run !== "function") throw new Error(`adapter ${name} exports no run()`);
  if (typeof mod.available === "function") { const why = await mod.available(); if (why !== true) throw new Error(`adapter ${name} unavailable: ${why}`); }
  return mod;
}

/* ── preflight ── */
async function preflight() {
  const problems = [];
  const check = async (label, cmd, args, test) => {
    const r = await runProcess({ cmd, args, cwd: REPO, env: CHILD_ENV, timeoutMs: 15 * 60 * 1000, logFile: path.join(DAY_DIR, "logs", "preflight.log") });
    const verdict = test ? test(r) : r.exitCode === 0;
    say(`[preflight] ${verdict === true ? "✓" : "✗"} ${label}${verdict === true ? "" : ` — ${typeof verdict === "string" ? verdict : `exit ${r.exitCode}`}`}`);
    if (verdict !== true) problems.push(label);
    return r;
  };
  const branch = currentBranch(REPO);
  if (branch !== CONFIG.branch) { say(`[preflight] ✗ on branch ${branch}, expected ${CONFIG.branch}`); problems.push("branch"); }
  const dirty = porcelain(REPO).filter((e) => !e.path.startsWith(`journal/${DATE}/`));
  if (dirty.length) { say(`[preflight] ✗ working tree not clean (${dirty.length} path(s)): ${dirty.slice(0, 5).map((e) => e.path).join(", ")}`); problems.push("dirty tree"); }
  if (!problems.length) {
    try { pullFfOnly(REPO, CONFIG.remote, CONFIG.branch); say("[preflight] ✓ git pull --ff-only"); }
    catch (e) { say(`[preflight] ⚠ git pull failed (${e.message.split("\n")[0]}) — continuing on the local tree`); }
  }
  const lockBefore = readJson(path.join(REPO, "node_modules", ".package-lock.json"), {});
  const lockNow = readJson(path.join(REPO, "package-lock.json"), {});
  if (!fs.existsSync(path.join(REPO, "node_modules")) || JSON.stringify(lockBefore.packages?.[""] ?? null) !== JSON.stringify(lockNow.packages?.[""] ?? null)) {
    await check("npm ci", "npm", ["ci", "--no-audit", "--no-fund"]);
  }
  await check("m0saic versions", "m0saic", ["versions", "--json", "--quiet"], (r) => { try { const v = JSON.parse(r.stdout); return v.ffmpeg?.runtime?.found ? true : "ffmpeg not found — run m0saic setup"; } catch { return "unreadable"; } });
  await check("m0saic license is paid", "m0saic", ["license"], (r) => (/tier:\s+paid/.test(r.stdout) ? true : "free tier — previews would carry the QR stamp; set M0SAIC_PRODUCT_KEY"));
  await check("npm run verify (untouched tree)", "npm", ["run", "verify"]);
  return problems;
}

/* ── one phase ── */
function phaseDone(phase) {
  const st = readState(DAY_DIR);
  if (st[phase.id] !== "done") return false;
  return fs.existsSync(path.join(DAY_DIR, phase.output));
}
function phaseApplies(phase) {
  if (!phase.onlyIf) return true;
  const [k, v] = phase.onlyIf.split("=");
  return String(readState(DAY_DIR)[k]) === v;
}
async function runPhase(adapter, phase) {
  const preamble = fs.readFileSync(path.join(PIPELINE, "prompts", "_preamble.md"), "utf8");
  const body = fs.readFileSync(path.join(PIPELINE, "prompts", phase.prompt), "utf8");
  const vars = { DATE, DAY_DIR: path.relative(REPO, DAY_DIR).split(path.sep).join("/"), REPO, PHASE: phase.id, OUTPUT: phase.output, DAY: String(dayNumber(REPO, DATE)), VARIANTS_MAX: String(CONFIG.variantsMax ?? 3), PACKS: (CONFIG.packs?.vocabulary ?? []).join(", "), AGENT: AGENT };
  const prompt = renderTemplate(`${preamble}\n\n${body}`, vars);
  fs.writeFileSync(path.join(DAY_DIR, "logs", `${phase.id}.prompt.md`), prompt);
  const maxCalls = phase.maxCalls ?? 1;
  for (let call = 1; call <= maxCalls; call++) {
    if (Date.now() > deadline) { say(`[${phase.id}] day deadline reached — stopping`); return false; }
    const label = `${phase.id}-${call}`;
    const timeoutMs = Math.min((phase.timeoutMin ?? 20) * 60 * 1000, Math.max(60_000, deadline - Date.now()));
    say(`[${phase.id}] ▶ call ${call}/${maxCalls} via ${AGENT}${MODEL ? ` (${MODEL})` : ""}, cap ${(timeoutMs / 60000).toFixed(0)} min`);
    const t0 = Date.now();
    const res = await adapter.run({ prompt, cwd: REPO, logDir: path.join(DAY_DIR, "logs"), label, timeoutMs, model: MODEL, config: CONFIG.adapters?.[AGENT] ?? {}, env: CHILD_ENV });
    const done = phaseDone(phase);
    patchRun(DAY_DIR, { phases: { [phase.id]: { calls: call, lastExitCode: res.exitCode, timedOut: !!res.timedOut, ms: Date.now() - t0, done } } });
    say(`[${phase.id}] ◀ exit ${res.exitCode}${res.timedOut ? " (timed out)" : ""} after ${((Date.now() - t0) / 60000).toFixed(1)} min — ${done ? "done" : "not done"}`);
    if (done) return true;
  }
  return false;
}

/* ── main ── */
(async () => {
  ensureDay(REPO, DATE);
  const day = dayNumber(REPO, DATE);
  say(`=== one-a-day · ${DATE} · day ${day} · agent ${AGENT}${MODEL ? ` (${MODEL})` : ""} ===`);
  const versions = readJson(path.join(REPO, "node_modules", "m0saic", "package.json"), null);
  patchRun(DAY_DIR, { date: DATE, day, startedAt: readRun(DAY_DIR).startedAt ?? new Date().toISOString(), runner: { adapter: AGENT, modelFlag: MODEL, host: os.hostname(), platform: process.platform, node: process.version, noPush: NO_PUSH, m0saic: versions?.version ?? null }, model: { selfDeclared: readRun(DAY_DIR).model?.selfDeclared ?? null, corrected: readRun(DAY_DIR).model?.corrected ?? null } });

  if (!GATE_ONLY) {
    let adapter;
    try { adapter = await loadAdapter(AGENT); } catch (e) { say(`✗ ${e.message}`); process.exit(2); }
    if (!SKIP_PREFLIGHT && !ONLY) {
      const problems = await preflight();
      if (problems.length) { say(`✗ preflight failed: ${problems.join(", ")} — no run today`); patchRun(DAY_DIR, { result: { status: "aborted", reason: `preflight: ${problems.join(", ")}` } }); process.exit(1); }
    }
    const phases = CONFIG.phases;
    let active = !FROM;
    for (const phase of phases) {
      if (ONLY && phase.id !== ONLY) continue;
      if (FROM && phase.id === FROM) active = true;
      if (!active) continue;
      if (!phaseApplies(phase)) { say(`[${phase.id}] skipped (${phase.onlyIf})`); continue; }
      if (phaseDone(phase) && !ONLY) { say(`[${phase.id}] already done — skipping`); continue; }
      const done = await runPhase(adapter, phase);
      if (!done) {
        say(`[${phase.id}] did not complete — ending the day here`);
        if (phase.id !== "ship") patchState(DAY_DIR, { decision: "no-ship", noShipReason: `${phase.id} phase did not complete` });
        break;
      }
    }
    if (ONLY) { say(`phase ${ONLY} finished (no gate with --phase)`); process.exit(0); }
  }

  const st = readState(DAY_DIR);
  if (st.decision === undefined) patchState(DAY_DIR, { decision: "no-ship", noShipReason: st.noShipReason ?? "no critique decision recorded" });
  say(`[gate] decision=${readState(DAY_DIR).decision}`);
  const result = await runGate({ repo: REPO, date: DATE, dayDir: DAY_DIR, noPush: NO_PUSH, remote: CONFIG.remote, branch: CONFIG.branch, env: CHILD_ENV, say });
  say(`=== ${result.status.toUpperCase()}${result.templateId ? ` ${result.templateId}` : ""}${result.sha ? ` @ ${result.sha.slice(0, 7)}` : ""} — ${((Date.now() - started) / 60000).toFixed(1)} min ===`);
  process.exit(result.ok ? 0 : 1);
})().catch((e) => { say(`✗ runner crashed: ${e.stack ?? e}`); process.exit(2); });
