// restore-source — rebuild the agent's template source from the agent's own
// event stream, after the no-ship gate reverted it (day 009, 672085d).
//
// Why this exists: every render of the day failed on a sandbox permission
// (EPERM on ~/m0saic/cache/masks), so render-variant never took its source
// snapshot (variants/a/src/ does not exist) and the gate's no-ship path
// reverted src/. The only copy of what Codex wrote is the commands it ran,
// kept verbatim in logs/build-1.jsonl. build-2 and build-3 changed no source.
// That stream is local to the machine that ran the day (raw streams are
// gitignored), so this script is the record of how the restore was done, not
// something a clone can re-run. What it produced is variants/a/src/.
//
// What it does: decodes each logged command back to the PowerShell text that
// ran, takes the here-string blocks that wrote under src/ (file bodies and
// the node one-liners that patched them), and replays them in the recorded
// order. Nothing is re-typed by hand. It does NOT replay the builds, tests,
// renders or journal writes around them.
//
//   npm run new -- events/bird-walk-sightings --title "Bird Walk Sightings"
//   node journal/2026-09-28/logs/restore-source.mjs [--dry-run]
//
// Byte-level differences from the agent's tree, on purpose: files are written
// UTF-8 without a BOM (PowerShell 5.1 Set-Content wrote one on the test file).
// The WHY literal comes from the journal's why-scaffold.json as the agent
// left it (its command 14), so that command is not replayed either.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const STREAM = path.join(REPO, "journal", "2026-09-28", "logs", "build-1.jsonl");
const DRY = process.argv.includes("--dry-run");
// The commands of build call 1 that wrote under src/, by their order in the stream.
const REPLAY = [15, 16, 17, 18, 20, 22, 23, 25, 34, 37];

// The stream logs argv joined POSIX-style; undo that to get the script text.
function shlexSplit(s) {
  const out = []; let cur = ""; let has = false; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "'") { const j = s.indexOf("'", i + 1); if (j < 0) throw new Error("unterminated '"); cur += s.slice(i + 1, j); has = true; i = j + 1; }
    else if (c === '"') {
      i++; has = true;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && i + 1 < s.length && '"\\$`\n'.includes(s[i + 1])) { cur += s[i + 1]; i += 2; }
        else { cur += s[i]; i++; }
      }
      if (s[i] !== '"') throw new Error('unterminated "');
      i++;
    }
    else if (c === "\\") { cur += s[i + 1] ?? ""; has = true; i += 2; }
    else if (/\s/.test(c)) { if (has) { out.push(cur); cur = ""; has = false; } i++; }
    else { cur += c; has = true; i++; }
  }
  if (has) out.push(cur);
  return out;
}

// @'<newline>body<newline>'@ | sink
function hereStrings(script) {
  const lines = script.split(/\r?\n/);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "@'") continue;
    const body = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith("'@")) body.push(lines[j++]);
    if (j >= lines.length) throw new Error("unterminated here-string");
    blocks.push({ body: body.join("\n"), sink: lines[j].replace(/^'@\s*\|\s*/, "").trim() });
    i = j;
  }
  return blocks;
}

const commands = [];
for (const line of fs.readFileSync(STREAM, "utf8").split("\n").filter(Boolean)) {
  let e; try { e = JSON.parse(line); } catch { continue; }
  if (e.type === "item.completed" && e.item?.type === "command_execution") commands.push(e.item);
}

let wrote = 0, patched = 0;
for (const n of REPLAY) {
  const item = commands[n - 1];
  if (!item) throw new Error(`command ${n} is not in the stream`);
  if (item.exit_code !== 0) throw new Error(`command ${n} did not exit 0 in the agent's run (${item.exit_code})`);
  const argv = shlexSplit(item.command);
  const script = argv.slice(argv.findIndex((a) => /^-Command$/i.test(a)) + 1).join(" ");
  for (const b of hereStrings(script)) {
    const set = /^Set-Content -Encoding utf8 (\S+)$/.exec(b.sink);
    if (set) {
      if (!set[1].startsWith("src/events/bird-walk-sightings/v1/")) throw new Error(`command ${n} writes outside the template folder: ${set[1]}`);
      console.log(`#${n} write  ${set[1]} (${b.body.length} chars)`);
      if (!DRY) fs.writeFileSync(path.join(REPO, set[1]), b.body + "\n", "utf8");
      wrote++;
    } else if (b.sink === "node") {
      const targets = [...b.body.matchAll(/'((?:src|journal)\/[^']+)'/g)].map((m) => m[1]);
      const outside = targets.filter((t) => !t.startsWith("src/events/") && t !== "journal/2026-09-28/why-scaffold.json");
      if (outside.length) throw new Error(`command ${n} touches ${outside.join(", ")}`);
      console.log(`#${n} patch  ${[...new Set(targets)].join(", ")}`);
      if (!DRY) {
        const r = spawnSync(process.execPath, [], { cwd: REPO, input: b.body + "\n", encoding: "utf8" });
        if (r.status !== 0) throw new Error(`command ${n} replay exited ${r.status}: ${r.stderr}`);
      }
      patched++;
    } else {
      throw new Error(`command ${n}: unknown sink ${JSON.stringify(b.sink)}`);
    }
  }
}
console.log(`${DRY ? "dry run: would replay" : "replayed"} ${wrote} file write(s) and ${patched} patch(es) from ${REPLAY.length} command(s)`);
