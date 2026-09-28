// compare-gates — is the restored source the source the agent built?
// The agent's last gate reports are in the journal (registry-final.json,
// layout-final.json, why-final.json, written by PowerShell `>` as UTF-16).
// Run the same three gates on the restored tree and compare the JSON.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const DAY = path.join(REPO, "journal", "2026-09-28");
const readAny = (file) => {
  const b = fs.readFileSync(file);
  const text = b[0] === 0xff && b[1] === 0xfe ? b.slice(2).toString("utf16le") : b.toString("utf8").replace(/^﻿/, "");
  return JSON.parse(text.slice(text.indexOf("{")));
};
// Run-dependent fields that say nothing about the source.
const VOLATILE = new Set(["at", "ms", "durationMs", "elapsedMs", "generatedAt", "checkedAt"]);
const strip = (v) => Array.isArray(v) ? v.map(strip) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([k]) => !VOLATILE.has(k)).map(([k, x]) => [k, strip(x)])) : v;
const diffPaths = (a, b, at = "") => {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a && b && typeof a === "object" && typeof b === "object" && Array.isArray(a) === Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((k) => diffPaths(a[k], b[k], `${at}/${k}`));
  }
  return [`${at}: agent=${JSON.stringify(a)?.slice(0, 90)} restored=${JSON.stringify(b)?.slice(0, 90)}`];
};

let same = true;
for (const [tool, file] of [["check-registry", "registry-final.json"], ["check-layout", "layout-final.json"], ["check-why", "why-final.json"]]) {
  const r = spawnSync(process.execPath, [`tools/${tool}.mjs`, "--json"], { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const now = strip(JSON.parse(r.stdout.slice(r.stdout.indexOf("{"))));
  const then = strip(readAny(path.join(DAY, file)));
  const d = diffPaths(then, now);
  console.log(`${tool}: ${d.length === 0 ? "identical to the agent's final report" : `${d.length} difference(s)`}`);
  for (const line of d.slice(0, 12)) console.log(`  ${line}`);
  if (d.length) same = false;
}
process.exit(same ? 0 : 1);
