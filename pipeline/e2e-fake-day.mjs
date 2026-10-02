#!/usr/bin/env node
// e2e-fake-day — prove the runner and the gate end to end with NO model:
// copy this repo into a temp dir (node_modules symlinked), give it one commit,
// run a whole day with the `fake` adapter, and assert the outcome.
//
//   node pipeline/e2e-fake-day.mjs            a shipped day (default)
//   node pipeline/e2e-fake-day.mjs no-ship    the critic says no, every round → journal-only commit, the tree kept in it
//   node pipeline/e2e-fake-day.mjs revise     the critic says no once → the build answers the verdict, the second look ships
//   node pipeline/e2e-fake-day.mjs rejected-resume
//                                            a day that ended rejected → `--from revise` restores its tree, one more round ships
//   node pipeline/e2e-fake-day.mjs rejected-replay
//                                            the same day run again with no flag (the scheduler replaying it) → the same
//   node pipeline/e2e-fake-day.mjs tamper     the agent edits AGENTS.md → reverted, day fails
//   node pipeline/e2e-fake-day.mjs limited    the session limit cuts the build → the runner waits the window out, the day ships
//   node pipeline/e2e-fake-day.mjs limited-resume
//                                            a seven-day limit ends the day with the tree kept → `--from build` restores it and ships
//   node pipeline/e2e-fake-day.mjs --keep     leave the temp clone on disk
//
// Needs the m0saic CLI (paid tier) and ffmpeg: it mints a real preview.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "ship";
const KEEP = process.argv.includes("--keep");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "one-a-day-e2e-"));
const clone = path.join(tmp, "repo");
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: clone, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });

console.log(`e2e (${mode}): cloning working tree → ${clone}`);
fs.mkdirSync(clone, { recursive: true });
// Copy with node, not rsync: this harness has to run on the machine that runs
// the pipeline, and that machine may be Windows. Same exclusions as before —
// the repo minus its history, its installed modules, past days and renders.
const SKIP = [/^\.git([\\/]|$)/, /^node_modules([\\/]|$)/, /^test-output([\\/]|$)/, /^journal[\\/]20/];
fs.cpSync(ROOT, clone, { recursive: true, filter: (src) => { const rel = path.relative(ROOT, src); return rel === "" || !SKIP.some((re) => re.test(rel)); } });
// A junction needs no elevation on Windows; elsewhere it is an ordinary dir symlink.
fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(clone, "node_modules"), process.platform === "win32" ? "junction" : "dir");
fs.writeFileSync(path.join(clone, "journal", "index.json"), "[]\n");
const env = { ...process.env, GIT_AUTHOR_NAME: "e2e", GIT_AUTHOR_EMAIL: "e2e@test", GIT_COMMITTER_NAME: "e2e", GIT_COMMITTER_EMAIL: "e2e@test" };
sh("git", ["init", "-q", "-b", "main"], { env });
sh("git", ["config", "commit.gpgsign", "false"], { env });
sh("git", ["add", "-A"], { env });
sh("git", ["commit", "-q", "-m", "scaffold"], { env });
const before = sh("git", ["rev-parse", "HEAD"]).trim();

const date = "2026-01-15"; // a fixed day so ids are stable
const runEnv = { ...env, ONE_A_DAY_AGENT: "fake", ONE_A_DAY_FAKE_PACK: "dev", ONE_A_DAY_FAKE_SLUG: "e2e-card" };
if (mode === "no-ship") runEnv.ONE_A_DAY_FAKE_DECISION = "no-ship";
if (mode === "tamper") runEnv.ONE_A_DAY_FAKE_OUT_OF_SCOPE = "1";
// A simulated window resets in a second; no grace on top, or the wait is 91 s.
if (mode === "limited") { runEnv.ONE_A_DAY_FAKE_LIMIT = "five_hour"; runEnv.ONE_A_DAY_LIMIT_GRACE_SEC = "0"; }
if (mode === "limited-resume") { runEnv.ONE_A_DAY_FAKE_LIMIT = "seven_day"; runEnv.ONE_A_DAY_LIMIT_GRACE_SEC = "0"; }
// The fake critic says no until the build has answered it this many times.
const ROUNDS_MAX = JSON.parse(fs.readFileSync(path.join(ROOT, "pipeline", "config.json"), "utf8")).revise?.maxRounds ?? 0;
if (mode === "revise") runEnv.ONE_A_DAY_FAKE_REJECT_ROUNDS = "1";
const REJECTED_AGAIN = mode === "rejected-resume" || mode === "rejected-replay";
if (REJECTED_AGAIN) runEnv.ONE_A_DAY_FAKE_REJECT_ROUNDS = String(ROUNDS_MAX + 1);

const runDay = (args, env) => {
  try {
    const out = execFileSync("node", ["pipeline/run.mjs", "--no-push", "--skip-preflight", "--date", date, ...args], { cwd: clone, env, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
    process.stdout.write(out);
    return 0;
  } catch (e) { process.stdout.write(e.stdout ?? ""); return e.status ?? 1; }
};
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(clone, rel), "utf8"));

let exit = runDay([], runEnv);
// The limited day ended; a person comes back after the window and resumes it.
let first = null;
const firstRun = () => ({ sha: sh("git", ["rev-parse", "HEAD"]).trim(), run: readJson(`journal/${date}/run.json`), state: readJson(`journal/${date}/state.json`), status: sh("git", ["status", "--porcelain"]).trim(), exit });
if (mode === "limited-resume") {
  first = firstRun();
  const { ONE_A_DAY_FAKE_LIMIT: _cut, ...resumeEnv } = runEnv;
  exit = runDay(["--from", "build"], resumeEnv);
}
// The day ended rejected with every round spent; a person takes it up again.
if (REJECTED_AGAIN) {
  first = firstRun();
  exit = runDay(mode === "rejected-replay" ? [] : ["--from", "revise"], runEnv);
}

const after = sh("git", ["rev-parse", "HEAD"]).trim();
const subject = sh("git", ["log", "-1", "--format=%s%n%b"]).trim();
const run = JSON.parse(fs.readFileSync(path.join(clone, "journal", date, "run.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(path.join(clone, "journal", "index.json"), "utf8"));
const changed = sh("git", ["diff", "--name-only", before, after]).trim().split("\n").filter(Boolean);
const status = sh("git", ["status", "--porcelain"]).trim();
const fail = (m) => { console.error(`e2e ✗ ${m}`); process.exitCode = 1; };
const ok = (m) => console.log(`e2e ✓ ${m}`);

if (after === before) fail("no commit was made"); else ok(`commit ${after.slice(0, 7)}: ${subject.split("\n")[0]}`);
if (status) fail(`tree not clean after the day:\n${status}`); else ok("tree clean after commit");
if (!/Agent: fake\nModel: fake-model \(self-declared\)/.test(subject)) fail(`trailers missing:\n${subject}`); else ok("Agent/Model trailers");
if (index.length !== 1 || index[0].date !== date) fail("index.json row missing"); else ok(`index row status=${index[0].status}`);

if (mode === "ship") {
  if (exit !== 0) fail(`runner exit ${exit}`);
  if (run.result?.status !== "shipped") fail(`result ${run.result?.status}: ${run.result?.reason}`); else ok("result shipped");
  if (!changed.includes("src/dev/e2e-card/v1/e2e-card.ts")) fail("template not committed");
  if (!changed.includes("assets/templates/@one-a-day__dev__e2e-card__v1/preview.png")) fail("preview not committed");
  if (!changed.includes("frozen.manifest.json")) fail("freeze manifest not updated");
  const frozen = JSON.parse(fs.readFileSync(path.join(clone, "frozen.manifest.json"), "utf8"));
  if (!frozen.files["src/dev/e2e-card/v1/e2e-card.ts"]) fail("new template not frozen"); else ok("new template frozen");
  // dist/index.js only changes when the day adds a NEW pack; the template's own
  // built file changes on every shipped day.
  if (!changed.includes("dist/dev/e2e-card/v1/e2e-card.js")) fail("dist not committed"); else ok("dist + manifest + preview committed");
} else if (mode === "no-ship") {
  if (run.result?.status !== "no-ship") fail(`result ${run.result?.status}`); else ok("result no-ship");
  if (changed.some((p) => p.startsWith("src/") || p.startsWith("dist/"))) fail(`src/dist leaked on a no-ship day: ${changed.join(", ")}`); else ok("only the journal landed");
  // The critic's no is a review: the build answered it every round the config allows before the verdict stood.
  const state = readJson(`journal/${date}/state.json`);
  if ((state.revision ?? 0) !== ROUNDS_MAX) fail(`state.revision ${state.revision}, expected ${ROUNDS_MAX} round(s)`); else ok(`the build answered the verdict ${ROUNDS_MAX} time(s) before it stood`);
  if (run.phases?.build?.calls !== 1 + ROUNDS_MAX || run.phases?.critique?.calls !== 1 + ROUNDS_MAX) fail(`build/critique calls ${run.phases?.build?.calls}/${run.phases?.critique?.calls}, expected ${1 + ROUNDS_MAX} each`); else ok("one build and one critique call per round");
  for (let n = 1; n <= ROUNDS_MAX; n++) if (!changed.includes(`journal/${date}/40-critique.r${n}.md`)) fail(`the verdict round ${n} answered is not in the journal`);
  if (!changed.includes(`journal/${date}/40-critique.md`)) fail("the last verdict is not in the journal");
  if (!changed.includes(`journal/${date}/rejected/tree.patch`)) fail("the rejected tree was not kept in the journal"); else ok(`the rejected tree rode along in the journal (${run.revise?.kept?.paths} path(s); ${run.revise?.resume})`);
} else if (mode === "tamper") {
  if (run.result?.status !== "failed") fail(`result ${run.result?.status}`); else ok("result failed (scope violation)");
  if (changed.includes("AGENTS.md")) fail("AGENTS.md tamper was committed"); else ok("AGENTS.md tamper reverted");
  if (changed.some((p) => p.startsWith("src/"))) fail("template leaked on a failed day"); else ok("template discarded");
} else if (mode === "limited") {
  if (exit !== 0) fail(`runner exit ${exit}`);
  if (run.result?.status !== "shipped") fail(`result ${run.result?.status}: ${run.result?.reason}`); else ok("result shipped, after the wait");
  if ((run.limits?.hits ?? []).length !== 1) fail(`${(run.limits?.hits ?? []).length} hit(s) on record, expected 1`); else ok(`the hit is on record (${run.limits.hits[0].window}, kept ${run.limits.hits[0].kept} path(s))`);
  if ((run.limits?.waits ?? []).length !== 1) fail(`${(run.limits?.waits ?? []).length} wait(s), expected 1`); else ok("the runner waited for the window once");
  if (run.phases?.build?.calls !== 2) fail(`build calls ${run.phases?.build?.calls}, expected 2: the cut call must not count`); else ok("the cut call did not count against the phase");
  if (!changed.includes(`journal/${date}/limited/tree.patch`)) fail("the kept tree was not committed with the journal"); else ok("the kept tree rode along in the journal");
  if (!changed.includes("src/dev/e2e-card/v1/e2e-card.ts")) fail("template not committed"); else ok("template committed");
  const trace = readJson(`journal/${date}/trace.json`);
  const names = trace.phases.map((p) => p.name);
  if (!names.includes("build") || !names.includes("build (2)")) fail(`trace phases ${names.join(", ")}: both build calls expected`); else ok("both build calls are on the timeline");
} else if (mode === "limited-resume") {
  if (first.run.result?.status !== "no-ship") fail(`first run ended ${first.run.result?.status}`); else ok("first run: no-ship");
  if (!/^session limit/.test(String(first.state.noShipReason))) fail(`first run's reason: ${first.state.noShipReason}`); else ok(`first run: the reason names the limit (${first.run.limits?.ended?.window})`);
  if (first.status) fail(`tree not clean after the limited day:\n${first.status}`); else ok("first run: tree clean, the work reverted");
  const firstFiles = sh("git", ["show", "--stat=200", "--format=", first.sha]);
  if (!firstFiles.includes(`journal/${date}/limited/tree.patch`)) fail("first run: the kept tree was not committed"); else ok("first run: the kept tree is in the journal commit");
  if (/\bsrc\/dev\/e2e-card\//.test(firstFiles)) fail("first run: the template leaked into the no-ship commit");
  if (exit !== 0) fail(`resume exit ${exit}`);
  if (run.result?.status !== "shipped") fail(`resume ended ${run.result?.status}: ${run.result?.reason}`); else ok("resume: shipped");
  if (!run.limits?.restored) fail("resume: the tree was not restored from the patch"); else ok(`resume: restored ${run.limits.restored.paths} path(s) from the patch`);
  if (run.phases?.build?.calls !== 2) fail(`resume: build calls ${run.phases?.build?.calls}, expected 2 (numbered after the cut one)`); else ok("resume: the build call was numbered after the cut one");
  if (!changed.includes("src/dev/e2e-card/v1/e2e-card.ts")) fail("resume: template not committed"); else ok("resume: template committed");
  if (after === first.sha) fail("resume made no commit");
} else if (mode === "revise") {
  if (exit !== 0) fail(`runner exit ${exit}`);
  if (run.result?.status !== "shipped") fail(`result ${run.result?.status}: ${run.result?.reason}`); else ok("result shipped, after the revision");
  const state = readJson(`journal/${date}/state.json`);
  if (state.revision !== 1 || run.revise?.rounds !== 1) fail(`revision ${state.revision} / run.revise.rounds ${run.revise?.rounds}, expected 1`); else ok("one revision round on record");
  if (run.phases?.build?.calls !== 2 || run.phases?.critique?.calls !== 2) fail(`build/critique calls ${run.phases?.build?.calls}/${run.phases?.critique?.calls}, expected 2/2`); else ok("build and critique were each called again");
  if (!changed.includes(`journal/${date}/40-critique.r1.md`)) fail("the verdict the revision answered is not in the journal"); else ok("the first verdict is kept as 40-critique.r1.md");
  if (state.decision !== "ship" || state.pick !== "b") fail(`decision ${state.decision}, pick ${state.pick}: the revised variant b should ship`); else ok("the second look shipped the revised variant");
  if (!/## Revision 1/.test(fs.readFileSync(path.join(clone, "journal", date, "30-build.md"), "utf8"))) fail("30-build.md has no Revision 1 section");
  const logs = path.join(clone, "journal", date, "logs");
  if (!fs.existsSync(path.join(logs, "build.r1.prompt.md")) || !fs.existsSync(path.join(logs, "critique.r1.prompt.md")) || !fs.existsSync(path.join(logs, "build.prompt.md"))) fail("the round's prompts were not logged beside the first pass's"); else ok("the round's prompts are logged beside the first pass's");
  if (changed.includes(`journal/${date}/rejected/tree.patch`)) fail("a shipped day kept a rejected tree");
  if (!changed.includes("src/dev/e2e-card/v1/e2e-card.ts")) fail("template not committed"); else ok("template committed");
  const names = readJson(`journal/${date}/trace.json`).phases.map((p) => p.name);
  if (!names.includes("build (2)") || !names.includes("critique (2)")) fail(`trace phases ${names.join(", ")}: the round's calls expected`); else ok("the round is on the timeline");
} else if (REJECTED_AGAIN) {
  if (first.run.result?.status !== "no-ship") fail(`first run ended ${first.run.result?.status}`); else ok("first run: no-ship");
  if (first.state.revision !== ROUNDS_MAX) fail(`first run: revision ${first.state.revision}, expected ${ROUNDS_MAX}`); else ok(`first run: ${ROUNDS_MAX} round(s) spent`);
  if (first.status) fail(`tree not clean after the rejected day:\n${first.status}`); else ok("first run: tree clean, the work reverted");
  const firstFiles = sh("git", ["show", "--stat=200", "--format=", first.sha]);
  if (!firstFiles.includes(`journal/${date}/rejected/tree.patch`)) fail("first run: the rejected tree was not committed"); else ok("first run: the rejected tree is in the journal commit");
  if (/\bsrc\/dev\/e2e-card\//.test(firstFiles)) fail("first run: the template leaked into the no-ship commit");
  if (exit !== 0) fail(`resume exit ${exit}`);
  if (run.result?.status !== "shipped") fail(`resume ended ${run.result?.status}: ${run.result?.reason}`); else ok("resume: shipped");
  if (!run.revise?.restored) fail("resume: the tree was not restored from the patch"); else ok(`resume: restored ${run.revise.restored.paths} path(s) from the patch`);
  const state = readJson(`journal/${date}/state.json`);
  if (state.revision !== ROUNDS_MAX + 1) fail(`resume: revision ${state.revision}, expected ${ROUNDS_MAX + 1}`); else ok(`resume: opened round ${state.revision}, numbered after the ones already spent`);
  if (run.phases?.build?.calls !== ROUNDS_MAX + 2) fail(`resume: build calls ${run.phases?.build?.calls}, expected ${ROUNDS_MAX + 2}`); else ok("resume: the build call was numbered after the earlier ones");
  if (!changed.includes("src/dev/e2e-card/v1/e2e-card.ts")) fail("resume: template not committed"); else ok("resume: template committed");
  if (after === first.sha) fail("resume made no commit");
}
if (!KEEP) fs.rmSync(tmp, { recursive: true, force: true }); else console.log(`kept: ${clone}`);
