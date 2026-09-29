// restore-tree — put day 010's cut build back the way the session-limit guard
// would have kept it, so `node pipeline/run.mjs --from build` picks it up.
//
// What happened: the build call was 25 minutes in when the account's
// five-hour window rejected it (13:50:47Z, reset 17:20Z). The runner of the
// time re-called the phase twice into the rejected window, closed the day as
// a no-ship (6925f35) and reverted the tree. Nothing was wrong with the work:
// the last render-variant (13:49:36Z) had just snapshotted the source into
// variants/a/src/, and nothing touched src/ in the 70 seconds after it
// (logs/build-1.jsonl: the last Write/Edit is at 13:47:47Z, then only
// fingerprints:update, build and render-variant).
//
// The guard (maintain 2026-09-29) keeps the tree as
// journal/<date>/limited/tree.patch at the moment of the hit and restores it
// on the next run. This script makes that patch after the fact, from the
// agent's own snapshot and its own scaffold command, and writes the record
// the runner would have written, then leaves the tree clean for preflight.
//
//   node journal/2026-09-29/logs/restore-tree.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyChanges, porcelain, revertPaths, snapshotTree } from "../../../pipeline/lib/git.mjs";
import { patchRun, readRun } from "../../../pipeline/lib/journal.mjs";
import { runProcess } from "../../../pipeline/lib/spawn.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DATE = "2026-09-29";
const DAY_DIR = path.join(REPO, "journal", DATE);
const PACK = "gaming", SLUG = "crossword-grid-card", TITLE = "Crossword Grid Card";
const TEMPLATE_DIR = path.join(REPO, "src", PACK, SLUG, "v1");
const SNAPSHOT = path.join(DAY_DIR, "variants", "a", "src");
const PATCH = path.join(DAY_DIR, "limited", "tree.patch");
const LOG = path.join(DAY_DIR, "logs", "restore-tree.log");
const ENV = { M0SAIC_TELEMETRY: "ghost", M0SAIC_NO_UPDATE_CHECK: "1" };
// The pipeline's own spawner: it quotes for the Windows shell (the title has spaces) and logs.
const sh = async (cmd, args) => {
  const r = await runProcess({ cmd, args, cwd: REPO, env: ENV, timeoutMs: 15 * 60 * 1000, logFile: LOG });
  if (r.exitCode !== 0) { const e = new Error(`${cmd} ${args.join(" ")} exited ${r.exitCode}`); e.status = r.exitCode; e.stdout = r.stdout; throw e; }
  return r.stdout;
};
const say = (m) => console.log(`[restore-tree] ${m}`);

const dirty = porcelain(REPO).filter((e) => !e.path.startsWith(`journal/${DATE}/`));
if (dirty.length) { console.error(`tree has ${dirty.length} change(s) outside the journal - start from a clean tree`); process.exit(1); }
if (fs.existsSync(TEMPLATE_DIR)) { console.error(`${TEMPLATE_DIR} already exists`); process.exit(1); }
if (!fs.existsSync(path.join(SNAPSHOT, `${SLUG}.ts`))) { console.error(`no snapshot at ${SNAPSHOT}`); process.exit(1); }

// 1. The agent's own first step: the scaffold and the wiring (registry, barrel).
say(`npm run new -- ${PACK}/${SLUG}`);
await sh("npm", ["run", "new", "--", `${PACK}/${SLUG}`, "--title", TITLE]);
// 2. The agent's source over the scaffold's - template, test, layout fingerprint.
const files = fs.readdirSync(SNAPSHOT);
for (const f of files) fs.copyFileSync(path.join(SNAPSHOT, f), path.join(TEMPLATE_DIR, f));
say(`copied ${files.length} file(s) from variants/a/src/: ${files.join(", ")}`);
// 3. dist/ and the manifest, as the agent's last build left them.
say("npm run build");
let build = "ok";
try { await sh("npm", ["run", "build"]); } catch (e) { build = `exit ${e.status}`; say(`build ${build} - the resumed build call will see why`); }

// 3b. What the gate will ask of this template that the build gate did not:
//     the m0saic CLI moved to 0.3.0 this morning (the build gate's own
//     conventions are the 0.2.0 substrate in node_modules) and its doctor
//     holds an unshipped template to every 0.3.0 rule. Recorded for the
//     resumed agent, in the operator note the run is started with.
let findings = [];
{
  const r = await runProcess({ cmd: "m0saic", args: ["doctor", ".", "--json"], cwd: REPO, env: ENV, timeoutMs: 10 * 60 * 1000 });
  fs.writeFileSync(path.join(DAY_DIR, "logs", "doctor-0.3.0-before-resume.json"), r.stdout);
  try {
    const report = JSON.parse(r.stdout.slice(r.stdout.indexOf("{")));
    findings = (report.errors ?? []).filter((f) => f.templateId === `@one-a-day/${PACK}/${SLUG}/v1`);
    say(`doctor exit ${r.exitCode}: ${(report.errors ?? []).length} error(s) in all, ${findings.length} on this template`);
  } catch { say(`doctor exit ${r.exitCode}: report unreadable`); }
}
const lines = findings.length
  ? findings.map((f) => `- **${f.convention}** (${f.severity}): ${(f.violations ?? []).map((v) => `\`${v.key}\`: ${v.detail}`).join(" ")}\n  Fix: ${f.fix}`)
  : ["- none: `m0saic doctor . --json` had no error on this template before the resume."];
fs.appendFileSync(path.join(DAY_DIR, "logs", "resume-context.md"), `\n## What \`m0saic doctor\` (0.3.0) says about this template right now\n\n${lines.join("\n")}\n`);
say(`doctor: ${findings.length} finding(s) on the template, written to logs/resume-context.md`);

// 4. The patch the guard would have kept, then the tree as the gate left it.
const kept = snapshotTree(REPO, PATCH, { date: DATE });
say(`kept ${kept.length} path(s) in journal/${DATE}/limited/tree.patch: ${kept.join(", ")}`);
revertPaths(REPO, classifyChanges(porcelain(REPO), { date: DATE }).allowed.filter((e) => !e.path.startsWith("journal/")));
const left = porcelain(REPO).filter((e) => !e.path.startsWith(`journal/${DATE}/`));
if (left.length) { console.error(`tree still dirty: ${left.map((e) => e.path).join(", ")}`); process.exit(1); }
await sh("git", ["apply", "--check", "--binary", PATCH]);
say("patch applies cleanly to HEAD; tree clean");

// 5. The record the runner writes at a hit it cannot wait out. The hit
//    itself is read off the cut call's own stream.
const hitAt = "2026-09-29T13:50:47.392Z", resetsAt = "2026-09-29T17:20:00.000Z";
const run = readRun(DAY_DIR);
patchRun(DAY_DIR, {
  limits: {
    ...(run.limits ?? {}),
    windows: { five_hour: { utilization: 1.01, resetsAt }, seven_day: { utilization: 0.06, resetsAt: "2026-10-06T08:00:00.000Z" } },
    at: hitAt,
    hits: [{ phase: "build", call: 1, at: hitAt, window: "five_hour", resetsAt, message: "You've hit your session limit · resets 1:20pm (America/New_York)", kept: kept.length, note: "read off logs/build-1.jsonl after the fact: the runner had no guard yet and re-called the phase twice into the rejected window (build-2, build-3)" }],
    ended: { phase: "build", at: hitAt, window: "five_hour", resetsAt, reason: "session limit (five_hour at 101%) resets 13:20 - no guard yet; the day was closed as a no-ship (6925f35) and the tree reverted", kept: kept.length, resume: "node pipeline/run.mjs --from build", keptBy: "journal/2026-09-29/logs/restore-tree.mjs, from variants/a/src/ (the render snapshot of 13:49:36Z) and the scaffold, after the fact" },
  },
});
say(`run.json limits.ended written; resume with: node pipeline/run.mjs --from build  (build ${build})`);
