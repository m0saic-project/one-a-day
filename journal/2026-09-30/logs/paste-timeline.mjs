// paste-timeline - copy the finished timeline from trace.json into the
// template's WHY.timeline, verbatim, the way the ship prompt asks
// (`node pipeline/lib/trace.mjs --timeline journal/<date>/trace.json`), without
// retyping eight phases by hand.
//
//   node journal/2026-09-30/logs/paste-timeline.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTrace, timelineFromTrace } from "../../../pipeline/lib/trace.mjs";

const DAY_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPO = path.resolve(DAY_DIR, "..", "..");
const file = path.join(REPO, "src", "events", "homebrew-serving-card", "v1", "homebrew-serving-card.ts");
const timeline = timelineFromTrace(readTrace(DAY_DIR));
const block = JSON.stringify(timeline, null, 2).split("\n").map((l, i) => (i === 0 ? l : `  ${l}`)).join("\n");
const src = fs.readFileSync(file, "utf8");
const re = /"timeline": \{[\s\S]*?\n  \},\n  "caveats"/;
if (!re.test(src)) { console.error("WHY.timeline block not found in the template"); process.exit(1); }
fs.writeFileSync(file, src.replace(re, () => `"timeline": ${block},\n  "caveats"`));
console.log(`pasted ${timeline.phases.length} phases (${timeline.phases.map((p) => p.name).join(", ")}), costBasis ${timeline.costBasis ?? "none"}`);
