// paste-timeline - copy the finished timeline from this follow-up's trace.json
// into the template's WHY.timeline, verbatim (what
// `node pipeline/lib/trace.mjs --timeline <dir>/trace.json` prints).
//
//   node journal/2026-10-07/v2/logs/paste-timeline.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTrace, timelineFromTrace } from "../../../../pipeline/lib/trace.mjs";

const OWN_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPO = path.resolve(OWN_DIR, "..", "..", "..");
const file = path.join(REPO, "src", "sports", "chess-game-recap", "v2", "chess-game-recap.ts");
const timeline = timelineFromTrace(readTrace(OWN_DIR));
const block = JSON.stringify(timeline, null, 2).split("\n").map((l, i) => (i === 0 ? l : `  ${l}`)).join("\n");
const src = fs.readFileSync(file, "utf8");
const re = /\n  timeline: [\s\S]*?\n};\n\nexport const ChessGameRecapV2/;
if (!re.test(src)) { console.error("WHY.timeline not found in the template"); process.exit(1); }
fs.writeFileSync(file, src.replace(re, () => `\n  timeline: ${block},\n};\n\nexport const ChessGameRecapV2`));
console.log(`pasted ${timeline.phases.length} phases (${timeline.phases.map((p) => p.name).join(", ")}), costBasis ${timeline.costBasis ?? "none"}`);
