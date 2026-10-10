// mark - append a phase mark (UTC, the clock's now) to logs/phase-marks.json
// as the interactive session moves from one phase to the next.
//
//   node journal/2026-10-09/logs/mark.mjs <phase> "<what this phase does>"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "phase-marks.json");
const [phase, what] = process.argv.slice(2);
if (!phase || !what) { console.error('usage: node journal/2026-10-09/logs/mark.mjs <phase> "<what>"'); process.exit(2); }
const marks = JSON.parse(fs.readFileSync(file, "utf8"));
marks.marks.push({ phase, at: new Date().toISOString(), what });
fs.writeFileSync(file, JSON.stringify(marks, null, 2) + "\n");
console.log(`${phase} ${marks.marks[marks.marks.length - 1].at}`);
