#!/usr/bin/env node
// run — one day of one-a-day. Fresh agent call per phase; the journal folder
// is the only memory; the gate decides what ships.
//
//   node pipeline/run.mjs                      today, every phase, then gate + push
//   node pipeline/run.mjs --no-push            same, commit stays local (dry run)
//   node pipeline/run.mjs --phase build        one phase only (no gate)
//   node pipeline/run.mjs --from critique      resume from a phase (then gate)
//   node pipeline/run.mjs --from revise        take up a day the critic rejected: restore its tree, revise, judge again (then gate)
//   node pipeline/run.mjs --gate-only          skip the agent, run the gate on the tree
//   node pipeline/run.mjs --date 2026-09-21    a specific journal day
//   node pipeline/run.mjs --agent codex        override pipeline/config.json / ONE_A_DAY_AGENT
//   node pipeline/run.mjs --agent random       draw one slot from config.json `roster` (what the scheduler runs)
//   node pipeline/run.mjs --roster <id>        pin one roster slot by name (ONE_A_DAY_ROSTER)
//   node pipeline/run.mjs --model <name>       passed to the adapter (ONE_A_DAY_MODEL)
//   node pipeline/run.mjs --context "<text>"   an operator note appended to every phase prompt (ONE_A_DAY_CONTEXT)
//   node pipeline/run.mjs --context-file <p>   the same, read from a file (ONE_A_DAY_CONTEXT_FILE)
//   node pipeline/run.mjs --skip-preflight     (development only)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runProcess } from "./lib/spawn.mjs";
import { currentBranch, isClean, porcelain, pullFfOnly, restoreTree, snapshotTree } from "./lib/git.mjs";
import { dayDir as dayDirOf, ensureDay, isIsoDate, patchRun, patchState, readIndex, readRun, readState, renderTemplate, todayIso, dayNumber, readJson } from "./lib/journal.mjs";
import { runGate } from "./lib/gate.mjs";
import { decideAfter, decideBefore, describeWindows, fmtWait, limitsConfig, pct } from "./lib/limits.mjs";
import { openRevision, rejectedByCritic, reviseConfig, revisionOf, verdictFile } from "./lib/revise.mjs";
import { appendTrace } from "./lib/trace.mjs";
import { describeEntry, findRosterEntry, pickOrder, rosterEntries } from "./lib/roster.mjs";

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
const PHASE_IDS = CONFIG.phases.map((p) => p.id);
if (ONLY && !PHASE_IDS.includes(ONLY)) { console.error(`--phase must be one of ${PHASE_IDS.join(", ")}, got ${ONLY}`); process.exit(2); }
if (FROM && FROM !== "revise" && !PHASE_IDS.includes(FROM)) { console.error(`--from must be one of ${[...PHASE_IDS, "revise"].join(", ")}, got ${FROM}`); process.exit(2); }
const NO_PUSH = has("--no-push");
const GATE_ONLY = has("--gate-only");
const SKIP_PREFLIGHT = has("--skip-preflight");
const AGENT_REQ = val("--agent") ?? process.env.ONE_A_DAY_AGENT ?? CONFIG.agent;
const ROSTER_REQ = val("--roster") ?? process.env.ONE_A_DAY_ROSTER ?? null;
const MODEL_REQ = val("--model") ?? process.env.ONE_A_DAY_MODEL ?? null;
// Resolved by resolveAgent() before the banner: `random` draws a roster slot,
// anything else is taken literally. Nothing below reads them before then.
let AGENT = AGENT_REQ === "random" ? null : AGENT_REQ;
let MODEL = MODEL_REQ;
let ADAPTER_CFG = {};
let ROSTER_PICK = null;

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
// Moves out by however long the day waited for a session window: the cap is
// on the day's work, not on the account's clock.
let deadline = started + (CONFIG.dayTimeoutMin ?? 270) * 60 * 1000;
const LIMITS = limitsConfig(CONFIG);
if (process.env.ONE_A_DAY_LIMIT_GRACE_SEC !== undefined) LIMITS.graceSec = Number(process.env.ONE_A_DAY_LIMIT_GRACE_SEC) || 0;
let waits = 0;
const REVISE = reviseConfig(CONFIG);
const REJECTED_PATCH = path.join(DAY_DIR, "rejected", "tree.patch");

/* ── the operator note ── */
// One message from whoever started the run, appended to every phase prompt and
// kept in the journal as journal/<date>/context.md. It steers today's work; it
// never overrides AGENTS.md, and the gate does not care that it exists.
const CONTEXT = (() => {
  const parts = [];
  const inline = val("--context") ?? process.env.ONE_A_DAY_CONTEXT ?? null;
  if (inline) parts.push(String(inline).trim());
  const file = val("--context-file") ?? process.env.ONE_A_DAY_CONTEXT_FILE ?? null;
  if (file) {
    try { parts.push(fs.readFileSync(path.resolve(REPO, file), "utf8").trim()); }
    catch (e) { console.error(`--context-file unreadable: ${e.message}`); process.exit(2); }
  }
  const text = parts.filter(Boolean).join("\n\n").trim();
  return text || null;
})();

/* ── adapter ── */
async function loadAdapter(name) {
  const file = path.join(PIPELINE, "agents", `${name}.mjs`);
  if (!fs.existsSync(file)) throw new Error(`no adapter pipeline/agents/${name}.mjs`);
  const mod = await import(pathToFileURL(file).href);
  if (typeof mod.run !== "function") throw new Error(`adapter ${name} exports no run()`);
  if (typeof mod.available === "function") { const why = await mod.available(); if (why !== true) throw new Error(`adapter ${name} unavailable: ${why}`); }
  return mod;
}

/* ── who runs today ── */
// Three ways in, in order of authority: --roster <id> pins a slot; --agent
// random draws one; anything else is the agent named. A day that is resumed
// (--from, or a second call after a crash) keeps the agent it started with —
// the pick is re-read from run.json, never re-drawn, so phases of one day
// never disagree about who wrote them; that holds for a hand-typed resume
// too, unless --agent is typed with it. An explicit --model always wins.
// Returns the loaded adapter, or null when there is nothing to load.
async function resolveAgent() {
  const resuming = !val("--agent") && !!readRun(DAY_DIR).runner?.roster?.id;
  const apply = (entry, why) => {
    AGENT = entry.agent;
    MODEL = MODEL_REQ ?? entry.model ?? CONFIG.adapters?.[entry.agent]?.model ?? null;
    ADAPTER_CFG = { ...(CONFIG.adapters?.[entry.agent] ?? {}), ...(entry.adapter ?? {}) };
    ROSTER_PICK = { id: entry.id, agent: entry.agent, model: entry.model ?? null, weight: entry.weight ?? null, why };
  };
  const plain = (name) => {
    AGENT = name;
    MODEL = MODEL_REQ ?? CONFIG.adapters?.[name]?.model ?? null;
    ADAPTER_CFG = { ...(CONFIG.adapters?.[name] ?? {}) };
  };

  if (ROSTER_REQ) {
    const entry = findRosterEntry(CONFIG, ROSTER_REQ);
    if (!entry) {
      const known = rosterEntries(CONFIG).map((e) => e.id).join(", ") || "none configured";
      say(`✗ no roster slot "${ROSTER_REQ}" — known slots: ${known}`);
      process.exit(2);
    }
    apply(entry, "pinned with --roster");
  } else if (AGENT_REQ === "random" || resuming) {
    const previous = readRun(DAY_DIR).runner?.roster ?? null;
    const entries = rosterEntries(CONFIG);
    if (!entries.length) { say(`✗ --agent random needs a "roster" block in pipeline/config.json`); process.exit(2); }
    if (previous?.id) {
      const again = findRosterEntry(CONFIG, previous.id);
      if (again) { apply(again, "resumed — the slot this day started on"); }
      else { plain(previous.agent); ROSTER_PICK = { ...previous, why: "resumed — the slot is gone from the roster" }; }
    } else if (GATE_ONLY) {
      plain(CONFIG.agent); // the gate calls no agent; this only names the commit trailer
    } else {
      const { order, last, avoidRepeat } = pickOrder(CONFIG, readIndex(REPO));
      say(`[roster] ${entries.length} slot(s), avoidRepeat=${avoidRepeat}${last ? `, yesterday: ${last.agent}${last.rosterId ? ` (${last.rosterId})` : ""}` : ", no previous day"}`);
      say(`[roster] draw order: ${order.map((e) => e.id).join(" → ")}`);
      for (const entry of order) {
        try {
          const mod = await loadAdapter(entry.agent);
          apply(entry, order[0].id === entry.id ? "drawn" : "drawn after skipping an unavailable agent");
          say(`[roster] ✓ ${describeEntry(entry)}`);
          return mod;
        } catch (e) { say(`[roster] ✗ ${entry.id} — ${e.message}`); }
      }
      say(`✗ no roster slot has a usable agent CLI on this machine — no run today`);
      process.exit(2);
    }
  } else {
    plain(AGENT_REQ);
  }

  if (GATE_ONLY) return null;
  try { return await loadAdapter(AGENT); } catch (e) { say(`✗ ${e.message}`); process.exit(2); }
}

/* ── preflight ── */
async function preflight(adapter) {
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
  // The account's session windows, before a scout and a plan are spent on
  // an account that cannot finish the day. A five-hour window nearly gone
  // is waited out before the first call; a seven-day window nearly gone
  // cannot be waited for, so there is no day.
  if (typeof adapter?.headroom === "function") {
    let h = null;
    try { h = await adapter.headroom({ cwd: REPO, env: CHILD_ENV, logFile: path.join(DAY_DIR, "logs", "preflight.log") }); }
    catch (e) { say(`[preflight] ⚠ session headroom: ${String(e.message).split("\n")[0]}`); }
    if (h?.seen) {
      patchRun(DAY_DIR, { limits: { windows: h.windows, at: new Date().toISOString() } });
      const seven = h.windows.seven_day;
      const spent = !!seven && seven.utilization >= LIMITS.sevenDayStopAt;
      say(`[preflight] ${spent ? "✗" : "✓"} session headroom: ${describeWindows(h.windows)}${spent ? ` — the seven-day window is past limits.sevenDayStopAt (${pct(LIMITS.sevenDayStopAt)}); a day would be cut and could not wait for it` : ""}`);
      if (spent) problems.push("seven-day session limit");
    } else if (h) say(`[preflight] · session headroom: the CLI reported no window${h.exitCode !== 0 ? ` (probe exit ${h.exitCode})` : ""}`);
  }
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
  // A revision round (state.json `revision`, opened when the critic said no)
  // is the same phase with the round's own section after it: the build
  // answers the verdict, the critic takes a second look. Read off the state,
  // not off this process, so a round a session limit cut resumes as a round.
  const revision = revisionOf(readState(DAY_DIR));
  const revising = revision > 0 && !!phase.revisePrompt;
  const body = fs.readFileSync(path.join(PIPELINE, "prompts", phase.prompt), "utf8") + (revising ? `\n\n${fs.readFileSync(path.join(PIPELINE, "prompts", phase.revisePrompt), "utf8")}` : "");
  const vars = { DATE, DAY_DIR: path.relative(REPO, DAY_DIR).split(path.sep).join("/"), REPO, PHASE: phase.id, OUTPUT: phase.output, DAY: String(dayNumber(REPO, DATE)), VARIANTS_MAX: String(CONFIG.variantsMax ?? 3), PACKS: (CONFIG.packs?.vocabulary ?? []).join(", "), AGENT: AGENT, REVISION: String(revision), REJECTED: verdictFile(revision) };
  const note = CONTEXT ? `\n\n## Operator note for this run\n\nThe human who started this run added the lines below, and they apply to every\nphase of today. They steer what you work on; they never override AGENTS.md or\nthe hard rules, and the gate does not know they exist.\n\n${CONTEXT}\n` : "";
  const prompt = renderTemplate(`${preamble}\n\n${body}`, vars) + note;
  fs.writeFileSync(path.join(DAY_DIR, "logs", `${phase.id}${revising ? `.r${revision}` : ""}.prompt.md`), prompt);
  // A resumed phase (--from, or a second run of the day) numbers its calls
  // after the ones already made, so their transcripts and trace records are
  // not written over, and gets a call budget of its own: resuming is a
  // decision somebody took.
  const prior = Number(readRun(DAY_DIR).phases?.[phase.id]?.calls ?? 0) || 0;
  let budget = prior + (phase.maxCalls ?? 1);
  for (let call = prior + 1; call <= budget; call++) {
    if (Date.now() > deadline) { say(`[${phase.id}] day deadline reached — stopping`); return false; }
    // An account with almost no five-hour window left is not worth a call
    // that will be cut in the middle: wait for the window first.
    const before = decideBefore(readRun(DAY_DIR).limits?.windows, { waits, cfg: LIMITS });
    if (before.action === "wait") await waitOut(phase, before);
    const label = `${phase.id}-${call}`;
    const timeoutMs = Math.min((phase.timeoutMin ?? 20) * 60 * 1000, Math.max(60_000, deadline - Date.now()));
    say(`[${phase.id}] ▶ call ${call}/${budget} via ${AGENT}${MODEL ? ` (${MODEL})` : ""}, cap ${(timeoutMs / 60000).toFixed(0)} min`);
    const t0 = Date.now();
    const res = await adapter.run({ prompt, cwd: REPO, logDir: path.join(DAY_DIR, "logs"), label, timeoutMs, model: MODEL, config: ADAPTER_CFG, env: CHILD_ENV });
    // journal/<date>/trace.json: the phase's tool calls, tokens and timing, from the
    // agent CLI's own stream — the ship phase copies it into WHY.timeline.
    if (res.trace) {
      const declared = readRun(DAY_DIR).model?.selfDeclared ?? MODEL ?? ADAPTER_CFG.model ?? AGENT;
      try { appendTrace(DAY_DIR, res.trace, { model: declared, pricing: CONFIG.pricing ?? null }); } catch (e) { say(`[${phase.id}] ⚠ trace not recorded: ${e.message}`); }
    }
    // The account's windows as this call last saw them: the next call reads
    // them before it starts.
    if (res.limit?.seen) patchRun(DAY_DIR, { limits: { windows: res.limit.windows, at: new Date().toISOString() } });
    const done = phaseDone(phase);
    patchRun(DAY_DIR, { phases: { [phase.id]: { calls: call, lastExitCode: res.exitCode, timedOut: !!res.timedOut, ms: Date.now() - t0, done } } });
    say(`[${phase.id}] ◀ exit ${res.exitCode}${res.timedOut ? " (timed out)" : ""} after ${((Date.now() - t0) / 60000).toFixed(1)} min — ${done ? "done" : "not done"}${res.limit?.seen ? ` · ${describeWindows(res.limit.windows)}` : ""}`);
    if (done) return true;
    if (res.limit?.hit) {
      // The account's window, not the agent's work: keep the tree, and the
      // call does not count. Wait for the window, or end the day with what
      // there is - the journal carries the tree either way.
      const kept = keepTree(phase);
      patchRun(DAY_DIR, { limits: { hits: [...(readRun(DAY_DIR).limits?.hits ?? []), { phase: phase.id, call, at: new Date().toISOString(), window: res.limit.window, resetsAt: res.limit.resetsAt, message: res.limit.message, kept }] } });
      const after = decideAfter(res.limit, { waits, cfg: LIMITS });
      if (after.action === "wait") { budget += 1; await waitOut(phase, after); continue; }
      say(`[${phase.id}] ✗ ${after.reason} — ending the day here${kept ? "; the tree is kept in the journal" : ""}`);
      patchRun(DAY_DIR, { limits: { ended: { phase: phase.id, at: new Date().toISOString(), window: after.window, resetsAt: after.resetsAt ?? null, reason: after.reason, kept, resume: `node pipeline/run.mjs --from ${phase.id}` } } });
      return false;
    }
  }
  return false;
}

/* ── the account's session limit ── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Wait for a session window, in half-hour steps so the console shows life. */
async function waitOut(phase, decision) {
  say(`[${phase.id}] ⏸ ${decision.reason} — waiting ${fmtWait(decision.ms)}`);
  patchRun(DAY_DIR, { limits: { waits: [...(readRun(DAY_DIR).limits?.waits ?? []), { phase: phase.id, at: new Date().toISOString(), until: new Date(decision.untilMs).toISOString(), window: decision.window, reason: decision.reason }] } });
  let left = decision.ms;
  while (left > 0) {
    const step = Math.min(left, 30 * 60_000);
    await sleep(step);
    left -= step;
    if (left > 0) say(`[${phase.id}] ⏸ still waiting — ${fmtWait(left)} to go`);
  }
  deadline += decision.ms;
  waits += 1;
  // The window rolled; the reading on record is from before it did.
  const windows = { ...(readRun(DAY_DIR).limits?.windows ?? {}) };
  delete windows[decision.window];
  patchRun(DAY_DIR, { limits: { windows } });
  say(`[${phase.id}] ▶ the ${decision.window} window reset — resuming; the day's deadline moved by ${fmtWait(decision.ms)}`);
}
/** The work so far, as a patch in the journal. Returns how many paths it holds. */
function keepTree(phase) {
  const file = path.join(DAY_DIR, "limited", "tree.patch");
  try {
    const paths = snapshotTree(REPO, file, { date: DATE });
    if (paths.length) say(`[${phase.id}] ⧉ kept ${paths.length} changed path(s) in journal/${DATE}/limited/tree.patch`);
    return paths.length;
  } catch (e) {
    say(`[${phase.id}] ⚠ could not keep the tree: ${String(e.message).split("\n")[0]}`);
    return 0;
  }
}

/* ── the phases, in order ── */
/** Run the configured phases (from one, or only one). False when a phase did not complete: the day ends there. */
async function runPhases(adapter, { from = null, only = null } = {}) {
  let active = !from;
  for (const phase of CONFIG.phases) {
    if (only && phase.id !== only) continue;
    if (from && phase.id === from) active = true;
    if (!active) continue;
    if (!phaseApplies(phase)) { say(`[${phase.id}] skipped (runs only when ${phase.onlyIf})`); continue; }
    if (phaseDone(phase) && !only) { say(`[${phase.id}] already done — skipping`); continue; }
    const done = await runPhase(adapter, phase);
    if (!done) {
      const ended = readRun(DAY_DIR).limits?.ended;
      const byLimit = ended?.phase === phase.id && !readRun(DAY_DIR).limits?.restored;
      say(`[${phase.id}] did not complete — ending the day here${byLimit ? ` (${ended.resume} picks it up)` : ""}`);
      if (phase.id !== "ship") patchState(DAY_DIR, { decision: "no-ship", noShipReason: byLimit ? `session limit — ${ended.reason}; resume: ${ended.resume}` : `${phase.id} phase did not complete` });
      return false;
    }
  }
  return true;
}

/* ── a rejected day ── */
/**
 * The tree of a day that ends rejected, as a patch in the journal: the gate
 * reverts a no-ship day, and without this the work survives only as the
 * variants' source snapshots. `--from revise` puts it back.
 */
function keepRejected() {
  try {
    const paths = snapshotTree(REPO, REJECTED_PATCH, { date: DATE });
    if (!paths.length) return 0;
    const resume = `node pipeline/run.mjs --date ${DATE} --from revise`;
    say(`[revise] ⧉ kept ${paths.length} changed path(s) in journal/${DATE}/rejected/tree.patch — ${resume} takes the day up again`);
    patchRun(DAY_DIR, { revise: { kept: { paths: paths.length, at: new Date().toISOString() }, resume } });
    return paths.length;
  } catch (e) {
    say(`[revise] ⚠ could not keep the tree: ${String(e.message).split("\n")[0]}`);
    return 0;
  }
}
/** `--from revise`: the rejected tree back in place before the round opens. Never over work already in the tree. */
function restoreRejected() {
  const dirty = porcelain(REPO).filter((e) => !e.path.startsWith(`journal/${DATE}/`));
  if (dirty.length) { say(`[revise] the tree already has ${dirty.length} change(s) outside the journal — revising it as it is`); return true; }
  if (!fs.existsSync(REJECTED_PATCH)) { say(`✗ nothing to revise: the tree is clean and journal/${DATE}/rejected/tree.patch does not exist`); return false; }
  const r = restoreTree(REPO, REJECTED_PATCH);
  if (!r.ok) { say(`✗ journal/${DATE}/rejected/tree.patch did not apply: ${r.error}`); return false; }
  say(`[revise] restored ${r.paths.length} path(s) from journal/${DATE}/rejected/tree.patch${r.threeWay ? " (three-way)" : ""}`);
  patchRun(DAY_DIR, { revise: { restored: { at: new Date().toISOString(), paths: r.paths.length, threeWay: !!r.threeWay } } });
  return true;
}

/* ── main ── */
(async () => {
  ensureDay(REPO, DATE);
  const day = dayNumber(REPO, DATE);
  if (FROM === "revise" && !rejectedByCritic(DAY_DIR)) { say(`✗ --from revise takes up a day the critic rejected; journal/${DATE}/state.json is not one (critique done, decision no-ship, at least one variant)`); process.exit(2); }
  const adapter = await resolveAgent();
  say(`=== one-a-day · ${DATE} · day ${day} · agent ${AGENT}${MODEL ? ` (${MODEL})` : ""}${ROSTER_PICK ? ` · roster ${ROSTER_PICK.id}` : ""}${ADAPTER_CFG.ultracode ? " · ultracode" : ""} ===`);
  if (CONTEXT) {
    fs.writeFileSync(path.join(DAY_DIR, "context.md"), `# Operator note — ${DATE}\n\n${CONTEXT}\n`, "utf8");
    say(`[context] ${CONTEXT.split("\n")[0].slice(0, 80)}${CONTEXT.length > 80 ? "…" : ""} (journal/${DATE}/context.md, appended to every phase)`);
  }
  const versions = readJson(path.join(REPO, "node_modules", "m0saic", "package.json"), null);
  patchRun(DAY_DIR, { date: DATE, day, startedAt: readRun(DAY_DIR).startedAt ?? new Date().toISOString(), runner: { adapter: AGENT, modelFlag: MODEL, roster: ROSTER_PICK, ultracode: ADAPTER_CFG.ultracode === true, effort: ADAPTER_CFG.effort ?? null, budgetUsd: ADAPTER_CFG.budgetUsd ?? null, context: CONTEXT ? `context.md (${CONTEXT.length} chars)` : null, host: os.hostname(), platform: process.platform, node: process.version, noPush: NO_PUSH, m0saic: versions?.version ?? null }, model: { selfDeclared: readRun(DAY_DIR).model?.selfDeclared ?? null, corrected: readRun(DAY_DIR).model?.corrected ?? null } });

  if (!GATE_ONLY) {
    if (!SKIP_PREFLIGHT && !ONLY) {
      const problems = await preflight(adapter);
      if (problems.length) { say(`✗ preflight failed: ${problems.join(", ")} — no run today`); patchRun(DAY_DIR, { result: { status: "aborted", reason: `preflight: ${problems.join(", ")}` } }); process.exit(1); }
    }
    // A day the session limit ended carries its tree in the journal: put it
    // back before the phase that was cut runs again. Once only, and never
    // over work already in the tree.
    const limits = readRun(DAY_DIR).limits ?? {};
    const patch = path.join(DAY_DIR, "limited", "tree.patch");
    if (limits.ended && !limits.restored && fs.existsSync(patch)) {
      const dirty = porcelain(REPO).filter((e) => !e.path.startsWith(`journal/${DATE}/`));
      if (dirty.length) say(`[resume] journal/${DATE}/limited/tree.patch left alone — the tree already has ${dirty.length} change(s) outside the journal`);
      else {
        const r = restoreTree(REPO, patch);
        if (r.ok) {
          say(`[resume] restored ${r.paths.length} path(s) from journal/${DATE}/limited/tree.patch${r.threeWay ? " (three-way)" : ""} — picking up at ${limits.ended.phase}`);
          patchRun(DAY_DIR, { limits: { restored: { at: new Date().toISOString(), paths: r.paths.length, threeWay: !!r.threeWay } } });
          // The no-ship the limit wrote is not this run's verdict.
          const st = readState(DAY_DIR);
          if (st.decision === "no-ship" && /^session limit/.test(String(st.noShipReason ?? ""))) patchState(DAY_DIR, { decision: undefined, noShipReason: undefined });
        } else say(`[resume] ✗ journal/${DATE}/limited/tree.patch did not apply: ${r.error} — ${limits.ended.phase} starts from the tree as it is`);
      }
    }
    let completed = true;
    if (FROM === "revise") { if (!restoreRejected()) process.exit(2); }
    else completed = await runPhases(adapter, { from: FROM, only: ONLY });
    if (ONLY) { say(`phase ${ONLY} finished (no gate with --phase)`); process.exit(0); }
    // The critic said no over work that exists: that is a review. The build
    // is called again with the verdict, the critic looks again, and only the
    // last verdict is the day's - at most revise.maxRounds rounds a run (a
    // run somebody started with --from revise gets at least one).
    const roundsMax = FROM === "revise" ? Math.max(1, REVISE.maxRounds) : REVISE.maxRounds;
    let rounds = 0;
    while (completed && rejectedByCritic(DAY_DIR)) {
      if (rounds >= roundsMax) { say(`[revise] ${rounds ? `rejected again after ${rounds} round(s) of ${roundsMax}` : "revise.maxRounds is 0"} — the verdict stands`); break; }
      if (Date.now() > deadline) { say("[revise] day deadline reached — the verdict stands"); break; }
      // A day that was closed before this run started (the scheduler replayed
      // it, or somebody ran it again) has no work in the tree: the gate
      // reverted it. It comes back from the journal, or there is no round.
      if (rounds === 0 && FROM !== "revise" && !porcelain(REPO).some((e) => !e.path.startsWith("journal/")) && !restoreRejected()) break;
      const opened = openRevision(DAY_DIR);
      rounds += 1;
      patchRun(DAY_DIR, { revise: { rounds: opened.round } });
      say(`[revise] ↻ round ${opened.round} (${rounds}/${roundsMax} this run) — the critic said no-ship${opened.rejected ? `: ${String(opened.rejected).slice(0, 160)}` : ""}`);
      say(`[revise] the verdict is kept as journal/${DATE}/${opened.verdict}; build answers it, then the critic looks again`);
      completed = await runPhases(adapter, { from: "build" });
    }
  }

  // Still rejected: the gate is about to revert the tree. Keep it first.
  if (rejectedByCritic(DAY_DIR)) keepRejected();
  const st = readState(DAY_DIR);
  if (st.decision === undefined) patchState(DAY_DIR, { decision: "no-ship", noShipReason: st.noShipReason ?? "no critique decision recorded" });
  say(`[gate] decision=${readState(DAY_DIR).decision}`);
  const result = await runGate({ repo: REPO, date: DATE, dayDir: DAY_DIR, noPush: NO_PUSH, remote: CONFIG.remote, branch: CONFIG.branch, env: CHILD_ENV, say });
  say(`=== ${result.status.toUpperCase()}${result.templateId ? ` ${result.templateId}` : ""}${result.sha ? ` @ ${result.sha.slice(0, 7)}` : ""} — ${((Date.now() - started) / 60000).toFixed(1)} min ===`);
  process.exit(result.ok ? 0 : 1);
})().catch((e) => { say(`✗ runner crashed: ${e.stack ?? e}`); process.exit(2); });
