// restore-tree — put day 013's rejected build back the way the runner now
// keeps one, so `node pipeline/run.mjs --date 2026-10-02 --from revise` can
// take the day up.
//
// What happened: the critic said NO SHIP at 09:22 (the delta bars the brief
// was about are not in the picture) and the runner of the time took that as
// the end of the day - 22 minutes into a 270-minute day - reverted the tree
// and committed the journal (51fcb01). The revision loop (maintain
// 2026-10-02, pipeline/lib/revise.mjs) sends a rejected day back to the build
// and, when a day still ends rejected, keeps its tree as
// journal/<date>/rejected/tree.patch. This script makes that patch after the
// fact, from what the build call itself left in the journal:
//   - its scaffold command (logs/build-1.jsonl):
//       npm run new -- sports/lap-telemetry-card --title "Sim Racing Lap Card"
//   - its source snapshot, variants/a/src/ (the template and its test)
//   - its edit of the registry row (logs/build-1.jsonl), below verbatim
// and leaves the tree clean for preflight. The build call never ran
// fingerprints:update, so there is no <slug>.layout.m0 to restore.
//
//   node journal/2026-10-02/logs/restore-tree.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyChanges, porcelain, revertPaths, snapshotTree } from "../../../pipeline/lib/git.mjs";
import { patchRun } from "../../../pipeline/lib/journal.mjs";
import { rejectedByCritic } from "../../../pipeline/lib/revise.mjs";
import { runProcess } from "../../../pipeline/lib/spawn.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DATE = "2026-10-02";
const DAY_DIR = path.join(REPO, "journal", DATE);
const PACK = "sports", SLUG = "lap-telemetry-card", TITLE = "Sim Racing Lap Card";
const TEMPLATE_DIR = path.join(REPO, "src", PACK, SLUG, "v1");
const SNAPSHOT = path.join(DAY_DIR, "variants", "a", "src");
const PATCH = path.join(DAY_DIR, "rejected", "tree.patch");
const LOG = path.join(DAY_DIR, "logs", "restore-tree.log");
const ENV = { M0SAIC_TELEMETRY: "ghost", M0SAIC_NO_UPDATE_CHECK: "1" };
// The registry row as the build call left it (its Edit of src/sports/registry.ts).
const ROW_PLACEHOLDER = `"${TITLE}: describe the ONE concept this template teaches, in one line, for the Templates page."`;
const ROW_DESCRIPTION = `"A sim racing lap card: track name, lap time and delta vs PB, sector breakdown with times and delta bars (green for faster, red for slower), driver name, and top speed."`;
const ROW_TAGS_SCAFFOLD = `tags: ["sports","2026-10-02","day-013"],`;
const ROW_TAGS = `tags: ["sports","2026-10-02","day-013","racing","telemetry","sector","delta"],`;
// The pipeline's own spawner: it quotes for the Windows shell (the title has spaces) and logs.
const sh = async (cmd, args) => {
  const r = await runProcess({ cmd, args, cwd: REPO, env: ENV, timeoutMs: 15 * 60 * 1000, logFile: LOG });
  if (r.exitCode !== 0) { const e = new Error(`${cmd} ${args.join(" ")} exited ${r.exitCode}`); e.status = r.exitCode; e.stdout = r.stdout; throw e; }
  return r.stdout;
};
const say = (m) => console.log(`[restore-tree] ${m}`);

if (!rejectedByCritic(DAY_DIR)) { console.error("state.json is not a day the critic rejected - nothing to restore"); process.exit(1); }
const dirty = porcelain(REPO).filter((e) => !e.path.startsWith(`journal/${DATE}/`));
if (dirty.length) { console.error(`tree has ${dirty.length} change(s) outside the journal - start from a clean tree`); process.exit(1); }
if (fs.existsSync(TEMPLATE_DIR)) { console.error(`${TEMPLATE_DIR} already exists`); process.exit(1); }
if (!fs.existsSync(path.join(SNAPSHOT, `${SLUG}.ts`))) { console.error(`no snapshot at ${SNAPSHOT}`); process.exit(1); }

// 1. The agent's own first step: the scaffold and the wiring (registry, barrel).
say(`npm run new -- ${PACK}/${SLUG}`);
await sh("npm", ["run", "new", "--", `${PACK}/${SLUG}`, "--title", TITLE]);
// 2. The agent's source over the scaffold's, and its registry row.
const files = fs.readdirSync(SNAPSHOT);
for (const f of files) fs.copyFileSync(path.join(SNAPSHOT, f), path.join(TEMPLATE_DIR, f));
say(`copied ${files.length} file(s) from variants/a/src/: ${files.join(", ")}`);
const registry = path.join(REPO, "src", PACK, "registry.ts");
const before = fs.readFileSync(registry, "utf8");
if (!before.includes(ROW_PLACEHOLDER) || !before.includes(ROW_TAGS_SCAFFOLD)) { console.error("the scaffold's registry row is not the one the build call edited - not guessing"); process.exit(1); }
fs.writeFileSync(registry, before.replace(ROW_PLACEHOLDER, ROW_DESCRIPTION).replace(ROW_TAGS_SCAFFOLD, ROW_TAGS));
say("src/sports/registry.ts: the row's description and tags as the build call wrote them");
// 3. dist/ and the manifest, as the agent's last build left them.
say("npm run build");
let build = "ok";
try { await sh("npm", ["run", "build"]); } catch (e) { build = `exit ${e.status}`; say(`build ${build} - the revision's build call will see why`); }

// 4. The patch the runner now keeps, then the tree as the gate left it.
const kept = snapshotTree(REPO, PATCH, { date: DATE });
say(`kept ${kept.length} path(s) in journal/${DATE}/rejected/tree.patch: ${kept.join(", ")}`);
revertPaths(REPO, classifyChanges(porcelain(REPO), { date: DATE }).allowed.filter((e) => !e.path.startsWith("journal/")));
const left = porcelain(REPO).filter((e) => !e.path.startsWith(`journal/${DATE}/`));
if (left.length) { console.error(`tree still dirty: ${left.map((e) => e.path).join(", ")}`); process.exit(1); }
await sh("git", ["apply", "--check", "--binary", PATCH]);
say("patch applies cleanly to HEAD; tree clean");

// 5. The record the runner writes when a day ends rejected.
const resume = `node pipeline/run.mjs --date ${DATE} --from revise`;
patchRun(DAY_DIR, { revise: { kept: { paths: kept.length, at: new Date().toISOString(), keptBy: `journal/${DATE}/logs/restore-tree.mjs, after the fact: the scaffold, variants/a/src/ and the registry row from logs/build-1.jsonl (build ${build})` }, resume } });
say(`run.json revise.kept written; take the day up with: ${resume}  (build ${build})`);
