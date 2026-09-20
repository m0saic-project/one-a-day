#!/usr/bin/env node
// submit — the one command a maintenance session calls before it is done:
// the ritual, then the commit, in a known shape. For work ON the repo
// (conventions, pipeline, harness, docs) by a human or an agent the human
// is driving. A DAILY run never calls this: the runner's gate is the day's
// commit, and this refuses to run inside one (ONE_A_DAY_DAY_DIR is set).
//
//   npm run submit -- "<one-line summary>" [--agent <name>] [--model <name>]
//                     [--refreeze] [--e2e] [--push] [--dry-run]
//
// The ritual, in order — any failure stops before git is touched:
//   1. on the configured branch, with something to commit
//   2. frozen files: unchanged, or --refreeze re-mints frozen.manifest.json
//      and the commit says which files were re-frozen (pre-publication or
//      a deliberate human act — a shipped template never changes on main)
//   3. npm run verify   (build → every convention gate → lint → tests →
//      loader contract → dependency policy)
//   4. m0saic doctor . --json  ok
//   5. --e2e: the fake day in ship / no-ship / tamper modes
//   6. git add -A; one commit:
//
//        maintain <date>: <summary>
//
//        Areas: <top-level folders touched, with file counts>
//        Re-frozen: <shipped files whose hash moved>   (only with --refreeze)
//        Frozen: <files frozen for the first time>
//
//        Ritual: verify ok - doctor ok (<n> rendered, <w> warnings) - freeze <n> files @ <tag> - e2e <ok|skipped>
//        Agent: <name>
//        Model: <name> (self-declared)
//
// The trailers mirror the day commits (`day NNN: …`), so `git log` reads the
// same way for a shipped day and for the work around it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "../pipeline/lib/spawn.mjs";
import { commitAll, currentBranch, git, porcelain, push } from "../pipeline/lib/git.mjs";
import { todayIso } from "../pipeline/lib/journal.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "pipeline", "config.json"), "utf8"));
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const summary = argv.find((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && ["--agent", "--model", "--tag"].includes(argv[i - 1])));
const AGENT = val("--agent") ?? process.env.ONE_A_DAY_AGENT ?? "human";
const MODEL = val("--model") ?? process.env.ONE_A_DAY_MODEL ?? null;
const TAG = val("--tag") ?? todayIso();
const REFREEZE = has("--refreeze");
const E2E = has("--e2e");
const PUSH = has("--push");
const DRY = has("--dry-run");
const ENV = { M0SAIC_TELEMETRY: process.env.M0SAIC_TELEMETRY ?? "ghost", M0SAIC_NO_UPDATE_CHECK: process.env.M0SAIC_NO_UPDATE_CHECK ?? "1" };

const say = (m) => console.log(`[submit] ${m}`);
const die = (m, code = 1) => { console.error(`[submit] ✗ ${m}`); process.exit(code); };
const run = (cmd, args, extra = {}) => runProcess({ cmd, args, cwd: ROOT, env: ENV, timeoutMs: 30 * 60 * 1000, ...extra });
const step = async (label, cmd, args, judge) => {
  const r = await run(cmd, args);
  const verdict = judge ? judge(r) : r.exitCode === 0 ? true : `exit ${r.exitCode}`;
  if (verdict !== true) {
    console.error((r.stdout + r.stderr).trim().split("\n").slice(-30).join("\n"));
    die(`${label} — ${verdict}`);
  }
  say(`✓ ${label}`);
  return r;
};

if (process.env.ONE_A_DAY_DAY_DIR) die("this is a daily run — the agent never commits; the runner's gate does (AGENTS.md).");
if (!summary || !summary.trim()) die('usage: npm run submit -- "<one-line summary>" [--agent <name>] [--model <name>] [--refreeze] [--e2e] [--push] [--dry-run]', 2);
if (/[\r\n]/.test(summary) || summary.length > 120) die("the summary is one line of at most 120 characters");

// ── 1. branch + something to commit ──
const branch = currentBranch(ROOT);
if (branch !== CONFIG.branch) die(`on branch ${branch}; maintenance commits land on ${CONFIG.branch}`);
const entries = porcelain(ROOT);
if (entries.length === 0) die("nothing to commit — the tree is clean");
const areas = new Map();
for (const e of entries) {
  const top = e.path.includes("/") ? e.path.slice(0, e.path.indexOf("/")) : "(root)";
  const key = top === "src" && e.path.split("/").length > 2 ? `src/${e.path.split("/")[1]}` : top;
  areas.set(key, (areas.get(key) ?? 0) + 1);
}
const areaLine = [...areas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, n]) => `${k} (${n})`).join(", ");
say(`${entries.length} path(s) to commit — ${areaLine}`);

// ── 2. the freeze — judged against HEAD's manifest, whenever the mint happened ──
const readManifest = (text) => { try { return JSON.parse(text).files ?? {}; } catch { return {}; } };
const headFrozen = readManifest((() => { try { return git(["show", "HEAD:frozen.manifest.json"], ROOT); } catch { return "{}"; } })());
let freezeCheck = await run("node", ["tools/check-freeze.mjs"]);
const treeChanged = (freezeCheck.stderr + freezeCheck.stdout).split("\n").filter((l) => /^\s+(changed|deleted)\s+/.test(l)).map((l) => l.trim().replace(/^(changed|deleted)\s+/, ""));
const unfrozenMatch = /(\d+) not yet frozen/.exec(freezeCheck.stdout + freezeCheck.stderr);
if (treeChanged.length > 0 || (unfrozenMatch && Number(unfrozenMatch[1]) > 0)) {
  if (treeChanged.length > 0 && !REFREEZE) {
    console.error((freezeCheck.stderr + freezeCheck.stdout).trim());
    die(`frozen files changed in the tree (${treeChanged.join(", ")}). A shipped template never changes on main; before publication, or as a deliberate human act, pass --refreeze — the commit will say which files were re-frozen.`);
  }
  await step(`mint the freeze (${treeChanged.length} changed, ${unfrozenMatch ? unfrozenMatch[1] : 0} new)`, "node", ["tools/check-freeze.mjs", "--update", "--tag", TAG]);
}
freezeCheck = await step("freeze intact", "node", ["tools/check-freeze.mjs"]);
const nowFrozen = readManifest(fs.readFileSync(path.join(ROOT, "frozen.manifest.json"), "utf8"));
const refrozen = Object.keys(headFrozen).filter((f) => nowFrozen[f] !== undefined && nowFrozen[f] !== headFrozen[f]);
const newlyFrozen = Object.keys(nowFrozen).filter((f) => headFrozen[f] === undefined);
const unfrozenNow = Object.keys(headFrozen).filter((f) => nowFrozen[f] === undefined);
if (refrozen.length > 0 && !REFREEZE) die(`frozen.manifest.json moves ${refrozen.length} shipped file(s) against HEAD (${refrozen.join(", ")}) — pass --refreeze to commit a re-freeze deliberately.`);
if (unfrozenNow.length > 0) die(`frozen.manifest.json DROPS ${unfrozenNow.join(", ")} — a frozen file never leaves the manifest.`);
if (refrozen.length) say(`re-frozen against HEAD: ${refrozen.join(", ")}`);
if (newlyFrozen.length) say(`newly frozen: ${newlyFrozen.join(", ")}`);
const frozenCount = Object.keys(nowFrozen).length;
const frozenTag = JSON.parse(fs.readFileSync(path.join(ROOT, "frozen.manifest.json"), "utf8")).release;

// ── 3 + 4. verify, doctor ──
await step("npm run verify (build, every convention gate, lint, tests, loader contract, dependency policy)", "npm", ["run", "verify"]);
let doctor = null;
await step("m0saic doctor . --json", "m0saic", ["doctor", ".", "--json"], (r) => {
  try { doctor = JSON.parse(r.stdout); } catch { return `unreadable report (exit ${r.exitCode})`; }
  return doctor.ok === true ? true : `${doctor.errors?.length ?? "?"} error(s)`;
});
const doctorLine = `doctor ok (${doctor.rendered} rendered, ${doctor.warnings?.length ?? 0} warnings)`;

// ── 5. e2e ──
let e2eLine = "e2e skipped";
if (E2E) {
  for (const mode of ["ship", "no-ship", "tamper"]) await step(`e2e fake day: ${mode}`, "node", ["pipeline/e2e-fake-day.mjs", mode]);
  e2eLine = "e2e ship/no-ship/tamper ok";
}

// ── 6. the commit ──
const message =
  `maintain ${TAG}: ${summary.trim()}\n\n` +
  `Areas: ${areaLine}\n` +
  (refrozen.length ? `Re-frozen: ${refrozen.join(", ")}\n` : "") +
  (newlyFrozen.length ? `Frozen: ${newlyFrozen.join(", ")}\n` : "") +
  `\nRitual: verify ok - ${doctorLine} - freeze ${frozenCount} files @ ${frozenTag} - ${e2eLine}\n` +
  `Agent: ${AGENT}\n` +
  `Model: ${MODEL ?? "undeclared"}${MODEL ? " (self-declared)" : ""}\n`;
console.log("\n" + message.replace(/^/gm, "    "));
if (DRY) { say("dry run — nothing committed"); process.exit(0); }
const sha = commitAll(ROOT, message);
say(`✓ committed ${sha?.slice(0, 7)} on ${branch}`);
if (PUSH) {
  try { push(ROOT, CONFIG.remote, CONFIG.branch); say(`✓ pushed to ${CONFIG.remote}/${CONFIG.branch}`); }
  catch (e) { die(`push failed: ${e.message.split("\n")[0]} (the commit is local)`); }
} else {
  const remotes = (() => { try { return git(["remote"], ROOT).trim(); } catch { return ""; } })();
  say(remotes ? `not pushed (pass --push)` : `not pushed — no remote configured yet`);
}
