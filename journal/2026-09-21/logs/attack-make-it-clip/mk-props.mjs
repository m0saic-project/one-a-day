import fs from "node:fs";
import path from "node:path";
const DIR = path.resolve("journal/2026-09-21/logs/attack-make-it-clip/props");
const W = (n) => "W".repeat(n);
const rep = (s, n) => s.repeat(Math.ceil(n / s.length)).slice(0, n);

const base4 = [
  { name: "parse 1MB json", unit: "ms", base: 412, baseRange: 14, value: 171, range: 6 },
  { name: "render 10k rows", unit: "ms", base: 88.2, baseRange: 9.6, value: 84.6, range: 8.4 },
  { name: "cold start", unit: "ms", base: 1240, baseRange: 61, value: 1395, range: 64 },
  { name: "gzip 4MB", unit: "ms", base: 59, value: 44.5 },
];

const NAME200 = rep("resolve deeply nested node_modules graph with symlink dedupe and peer hoisting enabled ", 200);
const TOK120 = W(0).length === 0 ? "" : "";
const UNBROKEN120 = rep("supercalifragilisticexpialidocious_benchmark_case_identifier_with_no_spaces_whatsoever_at_all_0123456789abcdefghij", 120);

const cases = {
  "01-name200": { rows: [{ ...base4[0], name: NAME200 }, ...base4.slice(1)] },
  "02-name200-all": { rows: base4.map((r, i) => ({ ...r, name: NAME200.slice(0, 200 - i) })) },
  "03-unbroken120": { rows: [{ ...base4[0], name: UNBROKEN120 }, ...base4.slice(1)] },
  "04-unbroken120-all": { rows: base4.map((r, i) => ({ ...r, name: UNBROKEN120.slice(0, 120 - i) })) },
  "05-wide-w60": { rows: base4.map((r, i) => ({ ...r, name: W(60 - i) })) },
  "06-wide-w200": { rows: [{ ...base4[0], name: W(200) }, ...base4.slice(1)] },
  "07-unit30": { rows: base4.map((r) => ({ ...r, unit: "megabytes_per_second_per_core" })) },
  "08-unit30-long": { rows: base4.map((r) => ({ ...r, unit: W(30) })) },
  "09-title-sub-long": {
    title: rep("v1.5.0-rc3+build.20260921 compared against the long-term support baseline v1.4.7 on every machine ", 200),
    subtitle: rep("best of 10 runs on an 8-core M4 Pro with cold caches, hyperfine 1.19, warmup 3, shell none, and the full methodology in docs ", 200),
  },
  "10-labels60": {
    baselineLabel: rep("release-1.4.7-lts-longterm-support-baseline-build ", 60),
    candidateLabel: rep("release-1.5.0-rc3-candidate-nightly-build-artifact ", 60),
  },
  "11-labels60-W": { baselineLabel: W(60), candidateLabel: W(60) },
  "12-rows8-long": {
    rows: Array.from({ length: 8 }, (_, i) => ({
      name: rep(`benchmark case ${i} resolve deeply nested module graph with symlink dedupe `, 46 + i * 6),
      unit: "ms",
      base: 100 + i * 37,
      baseRange: 4 + i,
      value: 60 + i * 41,
      range: 3 + i,
    })),
  },
  "13-rows8-W": {
    rows: Array.from({ length: 8 }, (_, i) => ({ name: W(60), unit: W(30), base: 100 + i, value: 50 + i * 20, baseRange: i % 2 ? 3 : undefined, range: i % 2 ? 3 : undefined })),
  },
  "14-everything": {
    title: W(200),
    subtitle: W(200),
    baselineLabel: W(60),
    candidateLabel: W(60),
    rows: Array.from({ length: 8 }, (_, i) => ({ name: W(200 - i), unit: W(30), base: 1000 + i, value: 500 + i * 200, baseRange: 5, range: 5 })),
  },
  "15-name46": { rows: base4.map((r) => ({ ...r, name: rep("resolve nested module graph with dedupe on ", 46) })) },
};
fs.mkdirSync(DIR, { recursive: true });
for (const [k, v] of Object.entries(cases)) fs.writeFileSync(path.join(DIR, k + ".json"), JSON.stringify(v, null, 2));
console.log("wrote", Object.keys(cases).length, "prop files to", DIR);
for (const [k, v] of Object.entries(cases)) {
  const n = v.rows ? v.rows.map((r) => r.name.length).join(",") : "-";
  console.log(k, "| rows:", v.rows ? v.rows.length : "default", "| nameLens:", n, "| title:", v.title ? v.title.length : "-", "| unit:", v.rows && v.rows[0].unit ? v.rows[0].unit.length : "-");
}
