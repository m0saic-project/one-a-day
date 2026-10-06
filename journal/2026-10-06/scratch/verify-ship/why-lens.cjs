const fs = require("fs");
const path = require("path");
const ROOT = "C:/src/m0saic-production/one-a-day";
process.env.M0SAIC_CLI ??= "/usr/bin/false";
const why = require(ROOT + "/dist/_shared/why.js");
require(ROOT + "/dist/index.js");
const spec = why.whySpecFor("@one-a-day/community/weekly-run-report/v1");
const tl = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const isDeep = require("util").isDeepStrictEqual;
console.log("dist WHY.timeline deepEqual trace --timeline:", isDeep(spec.timeline, tl));
// parse src WHY literal
const src = fs.readFileSync(ROOT + "/src/community/weekly-run-report/v1/weekly-run-report.ts", "utf8");
const start = src.indexOf("const WHY: WhySpec = ") + "const WHY: WhySpec = ".length;
const end = src.indexOf("\n};\n", start) + 2;
const lit = src.slice(start, end);
const srcSpec = JSON.parse(lit);
console.log("src WHY parses as JSON: yes");
console.log("src WHY.timeline deepEqual trace --timeline:", isDeep(srcSpec.timeline, tl));
console.log("src WHY deepEqual dist spec:", isDeep(srcSpec, spec));
if (!isDeep(srcSpec, spec)) { for (const k of new Set([...Object.keys(srcSpec), ...Object.keys(spec)])) if (!isDeep(srcSpec[k], spec[k])) console.log(" differs:", k); }
// key order check
console.log("src timeline JSON === trace JSON (string, order-sensitive):", JSON.stringify(srcSpec.timeline) === JSON.stringify(tl));
// ASCII
const bad = [];
const walk = (v, p) => { if (typeof v === "string") { [...v].forEach((ch, i) => { if (ch.charCodeAt(0) > 126 || ch.charCodeAt(0) < 32) bad.push(`${p}[${i}] U+${ch.charCodeAt(0).toString(16)}`); }); } else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, p + "." + k); };
walk(srcSpec, "WHY");
console.log("non-ASCII chars in WHY strings:", bad.length ? bad : "none");
const run = JSON.parse(fs.readFileSync(ROOT + "/journal/2026-10-06/run.json", "utf8"));
console.log("WHY.model", srcSpec.model, "run.model.selfDeclared", run.model.selfDeclared, srcSpec.model === run.model.selfDeclared);
console.log("WHY.day", srcSpec.day, "run.day", run.day, srcSpec.day === run.day);
console.log("WHY.agent", srcSpec.agent, "run.runner.adapter", run.runner.adapter);
console.log("WHY.date", srcSpec.date, "run.date", run.date);
