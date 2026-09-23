// gate-run — pipeline/lib/gate.mjs runGate, called with the arguments
// pipeline/run.mjs passes on its --gate-only path, from a day that was run by
// hand (see run.json runner.session). Nothing here re-derives who ran: run.mjs
// would overwrite runner.* with its adapter defaults, and this day's record is
// the interactive session. --no-push keeps the commit local; the founder's
// session pushes it after reading the gate's verdict.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runGate } from "../../../pipeline/lib/gate.mjs";
import { readState } from "../../../pipeline/lib/journal.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DATE = "2026-09-23";
const DAY_DIR = path.join(REPO, "journal", DATE);
const NO_PUSH = process.argv.includes("--no-push");
const say = (...a) => { const line = `[${new Date().toTimeString().slice(0, 8)}] ${a.join(" ")}`; console.log(line); fs.appendFileSync(path.join(DAY_DIR, "logs", "runner.log"), line + "\n"); };
const env = { M0SAIC_TELEMETRY: process.env.M0SAIC_TELEMETRY ?? "ghost", M0SAIC_NO_UPDATE_CHECK: process.env.M0SAIC_NO_UPDATE_CHECK ?? "1", ONE_A_DAY_DATE: DATE, ONE_A_DAY_DAY_DIR: DAY_DIR, ONE_A_DAY_REPO: REPO };
const started = Date.now();
say(`=== one-a-day · ${DATE} · day 4 · agent claude (claude-fable-5-1) · interactive session, gate only${NO_PUSH ? " · no push" : ""} ===`);
say(`[gate] decision=${readState(DAY_DIR).decision}`);
const result = await runGate({ repo: REPO, date: DATE, dayDir: DAY_DIR, noPush: NO_PUSH, remote: "origin", branch: "main", env, say });
say(`=== ${result.status.toUpperCase()}${result.templateId ? ` ${result.templateId}` : ""}${result.sha ? ` @ ${result.sha.slice(0, 7)}` : ""} — ${((Date.now() - started) / 60000).toFixed(1)} min ===`);
process.exit(result.ok ? 0 : 1);
