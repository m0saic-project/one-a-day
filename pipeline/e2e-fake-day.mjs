#!/usr/bin/env node
// e2e-fake-day — prove the runner and the gate end to end with NO model:
// copy this repo into a temp dir (node_modules symlinked), give it one commit,
// run a whole day with the `fake` adapter, and assert the outcome.
//
//   node pipeline/e2e-fake-day.mjs            a shipped day (default)
//   node pipeline/e2e-fake-day.mjs no-ship    the critic says no → journal-only commit
//   node pipeline/e2e-fake-day.mjs tamper     the agent edits AGENTS.md → reverted, day fails
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
execFileSync("rsync", ["-a", "--exclude", ".git", "--exclude", "node_modules", "--exclude", "journal/20*", "--exclude", "test-output", `${ROOT}/`, `${clone}/`]);
fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(clone, "node_modules"), "dir");
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

let exit = 0;
try {
  const out = execFileSync("node", ["pipeline/run.mjs", "--no-push", "--skip-preflight", "--date", date], { cwd: clone, env: runEnv, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  process.stdout.write(out);
} catch (e) { exit = e.status ?? 1; process.stdout.write(e.stdout ?? ""); }

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
} else if (mode === "tamper") {
  if (run.result?.status !== "failed") fail(`result ${run.result?.status}`); else ok("result failed (scope violation)");
  if (changed.includes("AGENTS.md")) fail("AGENTS.md tamper was committed"); else ok("AGENTS.md tamper reverted");
  if (changed.some((p) => p.startsWith("src/"))) fail("template leaked on a failed day"); else ok("template discarded");
}
if (!KEEP) fs.rmSync(tmp, { recursive: true, force: true }); else console.log(`kept: ${clone}`);
