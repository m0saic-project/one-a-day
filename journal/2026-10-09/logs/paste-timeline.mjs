// paste-timeline - copy the finished timeline from this day's trace.json
// into the template's WHY.timeline, verbatim (what
// `node pipeline/lib/trace.mjs --timeline journal/2026-10-09/trace.json` prints).
//
//   node journal/2026-10-09/logs/paste-timeline.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTrace, timelineFromTrace } from "../../../pipeline/lib/trace.mjs";

const DAY_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPO = path.resolve(DAY_DIR, "..", "..");
const file = path.join(REPO, "src", "community", "ancestor-birthplace-chart", "v1", "ancestor-birthplace-chart.ts");
const timeline = timelineFromTrace(readTrace(DAY_DIR));
const block = JSON.stringify(timeline, null, 2).split("\n").map((l, i) => (i === 0 ? l : `  ${l}`)).join("\n");
const src = fs.readFileSync(file, "utf8");
// The FIRST close of WHY after its timeline (UNBOUND is declared later in the file; never anchor on the export).
// The scaffold wrote the WHY keys quoted ("timeline": {...}); accept either spelling.
const re = /\n  "?timeline"?: [\s\S]*?\n};\n/;
if (!re.test(src)) { console.error("WHY.timeline not found in the template"); process.exit(1); }
fs.writeFileSync(file, src.replace(re, () => `\n  "timeline": ${block},\n};\n`));
console.log(`pasted ${timeline.phases.length} phases (${timeline.phases.map((p) => p.name).join(", ")}), costBasis ${timeline.costBasis ?? "none"}`);
