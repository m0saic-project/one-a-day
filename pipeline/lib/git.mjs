// git — thin wrappers plus the SCOPE GUARD: the deterministic rule for what a
// day's run is allowed to change. The agent edits files; the runner decides
// what ships. Anything outside the allowed set is reverted before the commit.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

export function headSha(cwd) { try { return git(["rev-parse", "HEAD"], cwd).trim(); } catch { return null; } }
export function currentBranch(cwd) { try { return git(["rev-parse", "--abbrev-ref", "HEAD"], cwd).trim(); } catch { return null; } }

/** `git status --porcelain` → [{ status, path }] (renames reported as their new path). */
export function porcelain(cwd) {
  const out = git(["status", "--porcelain", "--untracked-files=all"], cwd);
  const entries = [];
  for (const raw of out.split("\n")) {
    if (!raw) continue;
    const status = raw.slice(0, 2).trim() || "??";
    let p = raw.slice(3);
    if (p.includes(" -> ")) p = p.split(" -> ")[1];
    if (p.startsWith('"') && p.endsWith('"')) p = JSON.parse(p);
    entries.push({ status, path: p });
  }
  return entries;
}

export function isClean(cwd) { return porcelain(cwd).length === 0; }

export function pullFfOnly(cwd, remote, branch) {
  return git(["pull", "--ff-only", remote, branch], cwd);
}

/* ── the scope guard ── */

/** Exact paths and prefixes no daily run may touch. */
export const PROTECTED = {
  prefixes: ["pipeline/", "tools/", ".github/", "node_modules/"],
  files: new Set([
    "AGENTS.md", "CLAUDE.md", "README.md", "LICENSE", "NOTICE.md",
    "package.json", "package-lock.json", "dep-allowlist.json",
    "eslint.config.mjs", "jest.config.cjs", "tsconfig.json", "tsconfig.build.json",
    ".gitignore", ".gitattributes", "journal/README.md",
  ]),
};

const VERSION_DIR_RE = /^src\/([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)\/(v[1-9]\d*)\//;
const ASSET_DIR_RE = /^assets\/templates\/([^/]+)\//;

/**
 * SCRATCH: files a day's run leaves behind that are nobody's work and never
 * ship — the gate deletes them and moves on, instead of failing the day.
 *
 *   - untracked render outputs at the repo root: what `m0saic make` writes
 *     when the agent forgets `-o` (`out.png`, `out.mp4`) or asks for a
 *     report beside it (`out.validate.json`, `out.output.json`), and the
 *     `why.mp4` the docs suggest. Day 003 (2026-09-22) failed as a "scope
 *     violation" over one `out.validate.json`.
 *   - runtime caches an agent pointed into the day's journal
 *     (`journal/<date>/cache/`, `journal/<date>/m0saic-runtime/`): 241 mask
 *     PNGs rode into the day-003 commit that way. `.gitignore` covers the
 *     manual case; this covers the gate's `git add -A`.
 */
const SCRATCH_ROOT_RE = /^(out|why)(?:[.-][\w-]+)*\.(png|jpe?g|gif|webp|mp4|mov|webm|json)$/i;
const SCRATCH_REPORT_RE = /^[^/]+\.(validate|output)\.json$/i;
const SCRATCH_JOURNAL_DIRS = ["cache/", "m0saic-runtime/"];
function scratchReason(p, status, date) {
  if (!p.includes("/") && status === "??" && (SCRATCH_ROOT_RE.test(p) || SCRATCH_REPORT_RE.test(p))) return "stray render output at the repo root";
  const inDay = p.startsWith(`journal/${date}/`) ? p.slice(`journal/${date}/`.length) : null;
  if (inDay && SCRATCH_JOURNAL_DIRS.some((d) => inDay.startsWith(d))) return "runtime cache inside the day's journal";
  return null;
}

/**
 * Classify a day's working-tree changes.
 * @returns {{ allowed: {status:string,path:string}[], forbidden: {status:string,path:string,reason:string}[], scratch: {status:string,path:string,reason:string}[], newTemplateDirs: string[], touchedAssetDirs: string[] }}
 */
export function classifyChanges(entries, { date }) {
  const allowed = [];
  const forbidden = [];
  const scratch = [];
  const newDirs = new Set();
  const assetDirs = new Set();
  const isNew = (s) => s === "??" || s === "A" || s === "AM";
  for (const e of entries) {
    const p = e.path;
    const deny = (reason) => forbidden.push({ ...e, reason });
    const junk = scratchReason(p, e.status, date);
    if (junk) { scratch.push({ ...e, reason: junk }); continue; }
    if (PROTECTED.files.has(p)) { deny("protected file"); continue; }
    if (PROTECTED.prefixes.some((x) => p.startsWith(x))) { deny("protected folder"); continue; }
    if (p.startsWith("journal/")) {
      if (p === "journal/index.json" || p.startsWith(`journal/${date}/`)) { allowed.push(e); continue; }
      deny("another day's journal"); continue;
    }
    if (p.startsWith("dist/") || p === "template-manifest.json" || p === "frozen.manifest.json") { allowed.push(e); continue; }
    const am = ASSET_DIR_RE.exec(p);
    if (am) { assetDirs.add(am[1]); allowed.push(e); continue; }
    if (p.startsWith("src/")) {
      const vm = VERSION_DIR_RE.exec(p);
      if (vm) {
        const dir = `src/${vm[1]}/${vm[2]}/${vm[3]}/`;
        if (isNew(e.status)) { newDirs.add(dir); allowed.push(e); continue; }
        deny("a shipped template folder was modified or deleted (shipped templates are frozen — a fix is a new vN+1)"); continue;
      }
      // registries, barrels, repo.ts, template-registry.ts, index.ts — the wiring
      allowed.push(e); continue;
    }
    deny("outside the daily scope");
  }
  return { allowed, forbidden, scratch, newTemplateDirs: [...newDirs].sort(), touchedAssetDirs: [...assetDirs].sort() };
}

/** Restore tracked paths from HEAD and delete untracked ones. Runner-only. */
export function revertPaths(cwd, entries) {
  const tracked = entries.filter((e) => e.status !== "??").map((e) => e.path);
  const untracked = entries.filter((e) => e.status === "??").map((e) => e.path);
  if (tracked.length) {
    try { git(["checkout", "HEAD", "--", ...tracked], cwd); } catch { /* deleted-at-HEAD paths fall through */ }
    for (const p of tracked) { try { git(["ls-files", "--error-unmatch", p], cwd); } catch { fs.rmSync(path.join(cwd, p), { recursive: true, force: true }); } }
  }
  for (const p of untracked) fs.rmSync(path.join(cwd, p), { recursive: true, force: true });
}

export function commitAll(cwd, message) {
  git(["add", "-A"], cwd);
  const tmp = path.join(cwd, ".git", "ONE_A_DAY_COMMIT_MSG");
  fs.writeFileSync(tmp, message, "utf8");
  try { git(["commit", "-q", "-F", tmp], cwd); } finally { fs.rmSync(tmp, { force: true }); }
  return headSha(cwd);
}

export function push(cwd, remote, branch) {
  return git(["push", remote, `HEAD:${branch}`], cwd);
}
