#!/usr/bin/env node
// check-freeze — the one-a-day template freeze, enforced.
//
// A template that has shipped (been committed to main by a daily run) is
// frozen: its files never change again — a fix is a new vN+1 folder beside
// it, and the old one is deprecated (`deprecated: { replacement }`), never
// edited. This script is the machinery behind that sentence:
//
//   node tools/check-freeze.mjs                   the gate (build / CI): exit 1 if a
//                                                 frozen file changed or vanished
//   node tools/check-freeze.mjs --require-complete  …and exit 1 if any frozen-shaped
//                                                 file is not in the manifest yet
//   node tools/check-freeze.mjs --staged          the commit-time gate: judges the git
//                                                 INDEX against the manifest at HEAD
//   node tools/check-freeze.mjs --update --tag …  add the tree's shipped files to
//                                                 frozen.manifest.json (the RUNNER's act,
//                                                 after a day's gate passed — never the agent's)
//
// Node built-ins only, on purpose: CI runs THIS file on a bare clone, the
// same way it runs tools/contract-check.mjs.
//
// WHAT IS FROZEN. Every non-test `.ts` under src/ whose path has a `/vN/` or
// `_shared` segment (a shipped template and the helpers it shares), plus
// everything under src/ they reach through relative imports. NOT frozen:
// src/__testutils__/, the pack registries and barrels (src/<pack>/registry.ts,
// src/<pack>/index.ts), src/repo.ts, src/index.ts, src/template-registry.ts,
// src/registry-types.ts, the manifest generator — the files a new template
// has to touch to exist (NEVER_FROZEN_FILES; the import closure stops there).
//
// HOW IT HASHES. Bytes — sha256 over the file with CRLF/CR normalized to LF.
// No comment-stripping: a comment edit to a frozen file is a change here
// (byte freeze, no tokenizer to drift; hashVersion 1).
//
// WHICH LINE. `release` is the m0saic line the mint ships at
// (MAJOR.MINOR.PATCH, read off `m0saic --version` or passed as --release),
// and `shipped` says which line EACH template folder shipped at. `m0saic
// doctor` (0.3.0+) holds a shipped template to the conventions of its own
// line — a rule added later is "lagging", never an error — and an unshipped
// one to every current rule. A manifest whose release is not a line (this
// repo's used to be the day's date) makes doctor treat the whole fleet as
// unshipped, which is how day 010 met seven errors on frozen templates.
// `tag` is the mint's own name: the day, for the runner.
//
// Exit 0 clean · 1 freeze violated · 2 the gate could not run (fails CLOSED).
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const FREEZE_MANIFEST_FILE = "frozen.manifest.json";
export const FREEZE_HASH_VERSION = 1;
/** A m0saic line, MAJOR.MINOR.PATCH: what `release` and every `shipped` entry must be. */
export const LINE_RE = /^\d+\.\d+\.\d+$/;
export const FROZEN_SEED_ROOTS = ["src"];
export const NEVER_FROZEN_PREFIXES = ["src/__testutils__/"];
/** Wiring a new template must touch these; they are never frozen even when a
 *  frozen template imports them (the closure stops here). */
export const NEVER_FROZEN_FILES = new Set([
  "src/repo.ts",
  "src/index.ts",
  "src/template-registry.ts",
  "src/registry-types.ts",
  "src/gen-template-manifest.ts",
]);
const NEVER_FROZEN_PACK_FILE = /^src\/[^/]+\/(registry|index)\.ts$/;
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ── hashing ─────────────────────────────────────────────────────────────── */

export function hashBytes(buf) {
  const text = buf.toString("utf8").replace(/\r\n?/g, "\n");
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/* ── the frozen set ──────────────────────────────────────────────────────── */

const toPosix = (p) => p.split(path.sep).join("/");
const isFreezableSource = (rel) => rel.endsWith(".ts") && !rel.endsWith(".test.ts") && !rel.endsWith(".d.ts");

/**
 * `src/<pack>/<slug>/vN` for a file inside a template folder — the key
 * `shipped` uses, the same reading `m0saic doctor` makes. Shared helpers
 * (`_shared`, any `_`-prefixed pack or slug) are not templates: null.
 */
export function templateFolderOf(rel) {
  const m = /^src\/([^/]+)\/([^/]+)\/(v\d+)\//.exec(rel);
  if (!m || m[1].startsWith("_") || m[2].startsWith("_")) return null;
  return `src/${m[1]}/${m[2]}/${m[3]}`;
}

/** A frozen SEED: a shipped template file or a shared helper beside one. */
export function isFrozenSeed(rel) {
  if (!isFreezableSource(rel)) return false;
  if (!FROZEN_SEED_ROOTS.some((r) => rel.startsWith(r + "/"))) return false;
  const segments = rel.split("/");
  return segments.some((s) => /^v\d+$/.test(s) || s === "_shared");
}

export function isExcluded(rel, excluded) {
  if (NEVER_FROZEN_FILES.has(rel) || NEVER_FROZEN_PACK_FILE.test(rel)) return true;
  return NEVER_FROZEN_PREFIXES.some((p) => rel.startsWith(p)) || (excluded || []).some((p) => rel.startsWith(p));
}

/** Comment-free-ish import scan: `from "./x"`, `import "./x"`, `import("./x")`, `require("./x")`. */
export function relativeImportSpecifiers(src) {
  const text = src.replace(/\r\n?/g, "\n").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
  const re = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;
  const out = [];
  let m;
  while ((m = re.exec(text))) if (m[1].startsWith("./") || m[1].startsWith("../")) out.push(m[1]);
  return out;
}

function resolveImport(packageRoot, fromAbs, spec) {
  const srcRoot = path.join(packageRoot, "src");
  const target = path.resolve(path.dirname(fromAbs), spec);
  const candidates = target.endsWith(".ts") ? [target] : target.endsWith(".js") ? [target.slice(0, -3) + ".ts"] : [target + ".ts", path.join(target, "index.ts")];
  for (const abs of candidates) {
    if (!abs.startsWith(srcRoot + path.sep)) continue;
    let isFile = false;
    try { isFile = fs.statSync(abs).isFile(); } catch { /* absent */ }
    if (!isFile) continue;
    const rel = toPosix(path.relative(packageRoot, abs));
    return isFreezableSource(rel) ? rel : undefined;
  }
  return undefined;
}

/** Every frozen file on disk, package-relative, sorted: seeds + their import closure inside src/. */
export function collectFrozenFiles(packageRoot, excluded = []) {
  const seeds = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) { walk(abs); continue; }
      const rel = toPosix(path.relative(packageRoot, abs));
      if (isFrozenSeed(rel) && !isExcluded(rel, excluded)) seeds.push(rel);
    }
  };
  for (const root of FROZEN_SEED_ROOTS) walk(path.join(packageRoot, root));
  const frozen = new Set(seeds);
  const queue = [...seeds];
  while (queue.length) {
    const rel = queue.pop();
    let src;
    try { src = fs.readFileSync(path.join(packageRoot, rel), "utf8"); } catch { continue; }
    for (const spec of relativeImportSpecifiers(src)) {
      const dep = resolveImport(packageRoot, path.join(packageRoot, rel), spec);
      if (dep !== undefined && !isExcluded(dep, excluded) && !frozen.has(dep)) { frozen.add(dep); queue.push(dep); }
    }
  }
  return [...frozen].sort();
}

/* ── manifest ────────────────────────────────────────────────────────────── */

export function readManifest(packageRoot) {
  const p = path.join(packageRoot, FREEZE_MANIFEST_FILE);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * Mint from the tree. `line` is the m0saic line this mint ships at; `tag` is
 * the mint's own name (the day). `shipped` carries the line each template
 * folder shipped at: a folder the previous manifest already hashed keeps its
 * line — from a manifest written before `shipped` existed, that manifest's
 * `release` when it is a line, else `shippedBefore` — and a folder new to
 * this mint shipped at `line`. A folder that was frozen but whose line nobody
 * can name is refused: guessing it would hold shipped work to rules it never
 * had, or excuse it from rules it did.
 */
export function mintManifest(packageRoot, { tag, line, commit, note, excluded = [], previous = null, shippedBefore = null, now = new Date() }) {
  if (!LINE_RE.test(String(line ?? ""))) throw new Error(`the mint needs the m0saic line it ships at (MAJOR.MINOR.PATCH), got ${JSON.stringify(line)}`);
  if (shippedBefore != null && !LINE_RE.test(String(shippedBefore))) throw new Error(`--shipped-before must be a m0saic line, got ${JSON.stringify(shippedBefore)}`);
  const files = {};
  for (const rel of collectFrozenFiles(packageRoot, excluded)) files[rel] = hashBytes(fs.readFileSync(path.join(packageRoot, rel)));
  const before = new Set(Object.keys(previous?.files ?? {}).map(templateFolderOf).filter(Boolean));
  const beforeLine = LINE_RE.test(String(previous?.release ?? "")) ? previous.release : shippedBefore;
  const shipped = {};
  for (const rel of Object.keys(files)) {
    const folder = templateFolderOf(rel);
    if (!folder || shipped[folder]) continue;
    const kept = previous?.shipped?.[folder] ?? (before.has(folder) ? beforeLine : null);
    if (before.has(folder) && !kept) throw new Error(`${folder} is already frozen but no manifest says which m0saic line it shipped at — pass --shipped-before <line> for the folders the old manifest hashed`);
    shipped[folder] = kept ?? line;
  }
  return {
    release: line,
    tag: tag ?? null,
    commit,
    mintedAt: now.toISOString(),
    note: note || "Frozen once shipped. A template committed to main never changes again — comments included (byte hashes). A fix is a new vN+1 folder; deprecate the old one and point `deprecated.replacement` at the new id. See AGENTS.md. The daily runner appends to this file after each shipped day; agents never touch it. `release` is the m0saic line of the newest mint and `shipped` the line each folder shipped at: doctor holds a template to the rules of its own line.",
    hashVersion: FREEZE_HASH_VERSION,
    excluded: [...excluded].sort(),
    shipped,
    files,
  };
}

/** What the manifest calls itself on a log line: "2026-09-29 (m0saic 0.3.0)". */
export function manifestLabel(manifest) {
  return manifest.tag ? `${manifest.tag} (m0saic ${manifest.release})` : String(manifest.release);
}

/** The installed CLI's line, for a mint that was not told one. */
export function detectLine() {
  try {
    const out = execFileSync("m0saic", ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32", timeout: 20_000, env: { ...process.env, M0SAIC_NO_UPDATE_CHECK: "1", M0SAIC_TELEMETRY: process.env.M0SAIC_TELEMETRY ?? "ghost" } }).trim();
    return LINE_RE.test(out) ? out : null;
  } catch { return null; }
}

/** Working tree vs manifest. */
export function checkTree(packageRoot, manifest) {
  const report = { ok: true, unchanged: [], changed: [], deleted: [], unfrozen: [] };
  if ((manifest.hashVersion ?? 1) !== FREEZE_HASH_VERSION) {
    report.ok = false;
    report.hashVersionMismatch = `manifest hashVersion ${manifest.hashVersion} != checker ${FREEZE_HASH_VERSION}`;
    return report;
  }
  const excluded = manifest.excluded || [];
  const present = new Set(collectFrozenFiles(packageRoot, excluded));
  for (const rel of Object.keys(manifest.files)) if (!present.has(rel) && fs.existsSync(path.join(packageRoot, rel))) present.add(rel);
  for (const rel of Object.keys(manifest.files)) if (!fs.existsSync(path.join(packageRoot, rel))) report.deleted.push(rel);
  for (const rel of [...present].sort()) {
    const expected = manifest.files[rel];
    if (expected === undefined) { report.unfrozen.push(rel); continue; }
    const actual = hashBytes(fs.readFileSync(path.join(packageRoot, rel)));
    (actual === expected ? report.unchanged : report.changed).push(rel);
  }
  report.ok = report.changed.length === 0 && report.deleted.length === 0;
  return report;
}

/* ── the commit-time gate ────────────────────────────────────────────────── */

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** Staged entries `{ status, path }` (repo-relative), renames split, typechanges included. */
export function listStaged(repoRoot) {
  const out = git(["diff", "--cached", "--name-status", "--diff-filter=ACDMRT", "--no-renames", "-z"], repoRoot);
  const parts = out.split("\0");
  const entries = [];
  for (let i = 0; i + 1 < parts.length; i += 2) if (parts[i]) entries.push({ status: parts[i][0], path: parts[i + 1] });
  return entries;
}

/**
 * Judge the index against the manifest at HEAD. `prefix` = the package as git
 * prints paths ("packages/community-templates/" in the monorepo, "" in the
 * public repo). Pure apart from git reads; returns { code, lines }.
 */
export function judgeStaged(repoRoot, prefix) {
  const manifestPath = prefix + FREEZE_MANIFEST_FILE;
  let head;
  try { head = JSON.parse(git(["show", `HEAD:${manifestPath}`], repoRoot)); }
  catch {
    const wt = path.join(repoRoot, manifestPath);
    if (!fs.existsSync(wt)) return { code: 0, lines: [`no ${manifestPath} at HEAD or in the tree — nothing is frozen yet`] };
    head = JSON.parse(fs.readFileSync(wt, "utf8"));
  }
  if ((head.hashVersion ?? 1) !== FREEZE_HASH_VERSION) {
    return { code: 2, lines: [`manifest hashVersion ${head.hashVersion} != checker ${FREEZE_HASH_VERSION} — staged files cannot be judged; re-mint at a release`] };
  }
  const lines = [];
  let violated = false;
  for (const { status, path: p } of listStaged(repoRoot)) {
    if (!p.startsWith(prefix)) continue;
    const rel = p.slice(prefix.length);
    if (rel === FREEZE_MANIFEST_FILE) {
      if (status === "D") { violated = true; lines.push(`DELETED  ${p}  (the freeze manifest is law; removing it is not a change, it is a release re-mint)`); continue; }
      let next;
      try { next = JSON.parse(git(["show", `:${p}`], repoRoot)); } catch { violated = true; lines.push(`unreadable staged ${p}`); continue; }
      for (const f of Object.keys(head.files)) {
        if (next.files?.[f] === undefined) { violated = true; lines.push(`manifest drops  ${f}  (frozen files are additive-only; a re-mint is a release act: git commit --no-verify)`); }
        else if (next.files[f] !== head.files[f]) { violated = true; lines.push(`manifest moves  ${f}  (its frozen hash changed — that is an edit to a frozen file, blessed after the fact)`); }
      }
      continue;
    }
    const expected = head.files?.[rel];
    if (expected === undefined) continue; // not frozen: new work
    if (status === "D") { violated = true; lines.push(`DELETED  ${p}  (removing shipped behaviour)`); continue; }
    if (status === "T") { violated = true; lines.push(`typechange  ${p}  (a frozen file became something else)`); continue; }
    let staged;
    try { staged = execFileSync("git", ["show", `:${p}`], { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] }); }
    catch { violated = true; lines.push(`unreadable staged ${p}`); continue; }
    if (hashBytes(staged) !== expected) { violated = true; lines.push(`changed  ${p}`); }
  }
  return { code: violated ? 1 : 0, lines };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */

function main(argv) {
  const has = (f) => argv.includes(f);
  const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const packageRoot = val("--repo") ? path.resolve(val("--repo")) : PACKAGE_ROOT;

  if (has("--staged")) {
    let repoRoot;
    try { repoRoot = git(["rev-parse", "--show-toplevel"], packageRoot).trim(); }
    catch { console.error("[check-freeze] not a git checkout — the staged gate cannot run"); return 2; }
    const prefix = toPosix(path.relative(repoRoot, packageRoot));
    const { code, lines } = judgeStaged(repoRoot, prefix ? prefix + "/" : "");
    for (const l of lines) console.error(`    ${l}`);
    if (code === 1) console.error("\n[check-freeze] ✗ FROZEN TEMPLATE MODIFIED in the index — see AGENTS.md: a fix is a new vN+1 folder; deprecate the old one.");
    else if (code === 0) console.log(`[check-freeze] ✓ staged files respect the freeze`);
    return code;
  }

  if (has("--update")) {
    const tag = val("--tag") || "(pending)";
    const excluded = argv.flatMap((a, i) => (a === "--exclude" && argv[i + 1] ? [argv[i + 1]] : []));
    let commit = "unknown";
    try { commit = git(["rev-parse", "HEAD"], packageRoot).trim(); } catch { /* not a checkout */ }
    const previous = readManifest(packageRoot);
    const line = val("--release") ?? detectLine();
    if (!LINE_RE.test(String(line ?? ""))) {
      console.error(`[check-freeze] ✗ which m0saic line does this mint ship at? \`m0saic --version\` gave ${JSON.stringify(line)} — pass --release <MAJOR.MINOR.PATCH>`);
      return 2;
    }
    let manifest;
    try { manifest = mintManifest(packageRoot, { tag, line, commit, excluded, note: previous?.note, previous, shippedBefore: val("--shipped-before") ?? null }); }
    catch (e) { console.error(`[check-freeze] ✗ ${e.message}`); return 2; }
    fs.writeFileSync(path.join(packageRoot, FREEZE_MANIFEST_FILE), JSON.stringify(manifest, null, 2) + "\n");
    const folders = Object.keys(manifest.shipped).length;
    console.log(`[check-freeze] ✎ minted ${FREEZE_MANIFEST_FILE}: ${Object.keys(manifest.files).length} frozen files, ${folders} template folder(s), at ${manifestLabel(manifest)} (${commit.slice(0, 7)})${excluded.length ? `, excluded: ${excluded.join(", ")}` : ""} — commit it.`);
    return 0;
  }

  const manifest = readManifest(packageRoot);
  if (!manifest) {
    console.error(`[check-freeze] ✗ ${FREEZE_MANIFEST_FILE} IS MISSING — the freeze gate cannot run. It is a committed file: restore it, never re-mint to clear this.`);
    return 2;
  }
  const r = checkTree(packageRoot, manifest);
  if (r.hashVersionMismatch) { console.error(`[check-freeze] ✗ ${r.hashVersionMismatch} — re-mint at a release`); return 2; }
  if (!r.ok) {
    console.error(`\n[check-freeze] ✗ FROZEN TEMPLATE MODIFIED — ${manifestLabel(manifest)} shipped these; someone holds their output.\n`);
    for (const f of r.changed) console.error(`    changed  ${f}`);
    for (const f of r.deleted) console.error(`    DELETED  ${f}  (removing shipped behaviour)`);
    console.error(`\n[check-freeze] A frozen file never changes — comments included. Copy the template into a NEW vN+1/ folder,`);
    console.error(`[check-freeze] make the change there, and set \`deprecated: { replacement }\` on the old version.`);
    console.error(`[check-freeze] (The runner freezes a shipped day with: node tools/check-freeze.mjs --update --tag <date>)\n`);
    return 1;
  }
  console.log(`[check-freeze] ✓ freeze (${manifestLabel(manifest)}): ${r.unchanged.length} frozen files unchanged, ${r.unfrozen.length} not yet frozen (new work).`);
  if (has("--require-complete") && r.unfrozen.length) {
    console.error(`\n[check-freeze] ✗ ${r.unfrozen.length} frozen-shaped file(s) are not in the manifest — a release must freeze what it ships:`);
    for (const f of r.unfrozen) console.error(`    unfrozen  ${f}`);
    console.error(`[check-freeze] Freeze first: node tools/check-freeze.mjs --update --tag <date>, then commit.\n`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
