// gate-run — pipeline/lib/gate.mjs runGate, called with the arguments
// pipeline/run.mjs passes on its --gate-only path, from a day whose build,
// critique and ship were run by hand (see run.json runner.session). Nothing
// here re-derives who ran: run.mjs would overwrite runner.* with its adapter
// defaults, and this day's record is the Codex run plus the interactive
// session that finished it. --no-push keeps the commit local; the session
// pushes it after reading the gate's verdict. --classify prints what the gate
// would make of the tree and touches nothing. (day-004's runner, via day-008's,
// re-dated.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runGate } from "../../../pipeline/lib/gate.mjs";
import { classifyChanges, porcelain } from "../../../pipeline/lib/git.mjs";
import { readState } from "../../../pipeline/lib/journal.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DATE = "2026-09-30";
const DAY_DIR = path.join(REPO, "journal", DATE);
const NO_PUSH = process.argv.includes("--no-push");

if (process.argv.includes("--classify")) {
  const c = classifyChanges(porcelain(REPO), { date: DATE });
  console.log(JSON.stringify({ allowed: c.allowed.length, forbidden: c.forbidden, scratch: c.scratch, newTemplateDirs: c.newTemplateDirs, touchedAssetDirs: c.touchedAssetDirs, decision: readState(DAY_DIR).decision }, null, 2));
  process.exit(0);
}

const say = (...a) => { const line = `[${new Date().toTimeString().slice(0, 8)}] ${a.join(" ")}`; console.log(line); fs.appendFileSync(path.join(DAY_DIR, "logs", "runner.log"), line + "\n"); };
const env = { M0SAIC_TELEMETRY: process.env.M0SAIC_TELEMETRY ?? "ghost", M0SAIC_NO_UPDATE_CHECK: process.env.M0SAIC_NO_UPDATE_CHECK ?? "1", ONE_A_DAY_DATE: DATE, ONE_A_DAY_DAY_DIR: DAY_DIR, ONE_A_DAY_REPO: REPO };
const started = Date.now();
say(`=== one-a-day · ${DATE} · day 11 · agent claude (claude-fable-5-1) · interactive session finishing the Codex run, gate only${NO_PUSH ? " · no push" : ""} ===`);
say(`[gate] decision=${readState(DAY_DIR).decision}`);
const result = await runGate({ repo: REPO, date: DATE, dayDir: DAY_DIR, noPush: NO_PUSH, remote: "origin", branch: "main", env, say });
say(`=== ${result.status.toUpperCase()}${result.templateId ? ` ${result.templateId}` : ""}${result.sha ? ` @ ${result.sha.slice(0, 7)}` : ""} — ${((Date.now() - started) / 60000).toFixed(1)} min ===`);
process.exit(result.ok ? 0 : 1);
