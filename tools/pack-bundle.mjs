#!/usr/bin/env node
/**
 * pack-bundle: turn a built template repo into the bundle the m0saic CLI and
 * Mosaic Desktop install.
 *
 * Node built-ins only, like verify-release.mjs beside it, whose tree listing
 * this reuses (the two files travel together): it runs in a public repo's CI
 * and in a fresh clone with nothing installed.
 *
 * A host needs two things from a template repo and never the rest (src/,
 * tests, tools, fixtures, journals):
 *
 *   bundle/runtime.tgz   what a host loads and runs: dist/**,
 *                        template-manifest.json, template-catalog.json,
 *                        package.json, release.json (only when it signs this
 *                        tree), LICENSE / NOTICE. The CLI and Desktop both
 *                        install it.
 *   bundle/previews.tgz  the gallery previews, found the way Desktop finds
 *                        them (resolveTemplatePreview in @m0saic/platform):
 *                        an entry's explicit `preview` paths when any of them
 *                        exists, else <templatesDir>/<templateKey, "/" as
 *                        "__">/preview.png | preview.mp4 | poster.png.
 *                        Desktop only; the CLI never fetches it.
 *   bundle/bundle.json   the index: repo id, tag, commit, and per archive its
 *                        sha256, size and file count. The runtime entry also
 *                        carries treeSha256, the listing release.json signs.
 *
 * Both archives hold repo-relative paths with no wrapping folder: extract
 * runtime.tgz, then previews.tgz, into one empty directory and that directory
 * loads like a checkout (`--template-repo <dir>`, a Desktop source).
 *
 * Publishing is a GitHub release on the tag with the three files attached:
 *
 *   gh release create v2026.10.1 bundle/bundle.json bundle/runtime.tgz bundle/previews.tgz
 *
 * The file names never change, so `releases/latest/download/bundle.json`
 * always names the newest release.
 *
 * Signed repos: release.json rides in runtime.tgz only when its treeSha256 is
 * this tree's. One signed for another tree (dist/ rebuilt after signing, or a
 * repo started from a signed one) is refused: re-sign, or pass --unsigned to
 * publish without it. The signature itself is the host's to check, against
 * the keys it embeds.
 *
 * Refused, never skipped: a symlink, special file or node_modules inside
 * dist/, a runtime or preview file that is not a regular file, and a preview
 * path outside the repo. A node_modules at the repo root is fine (it is never
 * packed), so an authoring checkout packs as it is.
 *
 * Reproducible: sorted entries, fixed owner and mode, every mtime the HEAD
 * commit's time (0 outside git), the gzip header's OS byte fixed. Packing the
 * same commit twice with the same Node gives the same bytes. Each archive is
 * read back and checked against the files before bundle.json is written.
 *
 * Usage:
 *   node tools/pack-bundle.mjs [--repo <dir>] [--out <dir>] [--tag <tag>]
 *                              [--unsigned] [--no-previews] [--json]
 *
 *   --repo         the built repo to pack (default: this repo's root).
 *   --out          where the three files go (default: <repo>/bundle).
 *   --tag          the release tag; must equal release.json's when both exist.
 *   --unsigned     leave release.json out.
 *   --no-previews  runtime only (bundle.json says `previews: null`).
 *   --json         print bundle.json instead of prose.
 *
 * Exit 0 when the bundle is written; 1 when the repo is refused; 2 on bad usage.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { RELEASE_FILE, SIGNED_DIR, SIGNED_FILES, computeTreeSha256 } from "./verify-release.mjs";

export const BUNDLE_SCHEMA_VERSION = 1;
export const BUNDLE_KIND = "m0saic-template-bundle";
export const BUNDLE_FILE = "bundle.json";
export const RUNTIME_ARCHIVE = "runtime.tgz";
export const PREVIEWS_ARCHIVE = "previews.tgz";
export const DEFAULT_OUT_DIR = "bundle";
export const DEFAULT_TEMPLATES_DIR = "assets/templates";
export const CONVENTION_PREVIEW_FILES = ["preview.png", "preview.mp4", "poster.png"];
/** Every root file the signature covers, plus the catalog hosts read; the first two are required. */
export const RUNTIME_ROOT_FILES = [...new Set(["template-manifest.json", "package.json", ...SIGNED_FILES, "template-catalog.json"])];
const REQUIRED_ROOT_FILES = ["template-manifest.json", "package.json"];
const NOTICE_FILE = /^(LICENSE|LICENCE|NOTICE)(\.(md|txt))?$/i;
const TAG_PATTERN = /^[A-Za-z0-9][\w.-]*$/;
const FOREIGN_MODULES_DIR = "node_modules";
const BLOCK = 512;
const FILE_MODE = 0o644;
// Built at runtime rather than written as an escape, as in verify-release.mjs.
const BOM = String.fromCharCode(0xfeff);

const stripBom = (text) => (text.startsWith(BOM) ? text.slice(1) : text);
const sha256Hex = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const absOf = (repoDir, rel) => path.join(repoDir, ...rel.split("/"));

export class BundleError extends Error {
  constructor(reason, detail) {
    super(`${reason}: ${detail}`);
    this.name = "BundleError";
    this.reason = reason;
    this.detail = detail;
  }
}

function lstatKind(abs) {
  try {
    const st = fs.lstatSync(abs);
    if (st.isSymbolicLink()) return "symlink";
    if (st.isDirectory()) return "dir";
    if (st.isFile()) return "file";
    return "special";
  } catch {
    return "missing";
  }
}

function refuseKind(kind, rel) {
  if (kind === "symlink") throw new BundleError("symlink-in-tree", rel);
  if (kind !== "file") throw new BundleError("special-file-in-tree", rel);
}

function walkDist(absDir, relDir, out) {
  const entries = fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => byCodeUnit(a.name, b.name));
  for (const ent of entries) {
    const rel = `${relDir}/${ent.name}`;
    if (ent.isSymbolicLink()) throw new BundleError("symlink-in-tree", rel);
    if (ent.isDirectory()) {
      if (ent.name.toLowerCase() === FOREIGN_MODULES_DIR) throw new BundleError("foreign-modules", rel);
      walkDist(path.join(absDir, ent.name), rel, out);
    } else if (ent.isFile()) {
      out.push(rel);
    } else {
      throw new BundleError("special-file-in-tree", rel);
    }
  }
}

/** The runtime set, sorted, release.json excluded (packBundle decides that one). Throws BundleError. */
export function collectRuntimeFiles(repoDir) {
  const distKind = lstatKind(path.join(repoDir, SIGNED_DIR));
  if (distKind === "missing") throw new BundleError("no-build", `no ${SIGNED_DIR}/ (build the repo first)`);
  if (distKind !== "dir") refuseKind(distKind, SIGNED_DIR);
  const files = [];
  walkDist(path.join(repoDir, SIGNED_DIR), SIGNED_DIR, files);
  for (const f of RUNTIME_ROOT_FILES) {
    const kind = lstatKind(path.join(repoDir, f));
    if (kind === "missing") {
      if (REQUIRED_ROOT_FILES.includes(f)) throw new BundleError("no-build", `no ${f} (build the repo first)`);
      continue;
    }
    refuseKind(kind, f);
    files.push(f);
  }
  for (const name of fs.readdirSync(repoDir)) {
    if (!NOTICE_FILE.test(name)) continue;
    const kind = lstatKind(path.join(repoDir, name));
    if (kind === "dir") continue;
    refuseKind(kind, name);
    files.push(name);
  }
  return files.sort(byCodeUnit);
}

/** A manifest path as a safe repo-relative POSIX path, or null when it leaves the repo. */
function repoRelative(p) {
  const norm = path.posix.normalize(String(p).replace(/\\/g, "/"));
  if (norm.startsWith("/") || /^[A-Za-z]:/.test(norm) || norm === ".." || norm.startsWith("../")) return null;
  return norm.replace(/^\.\//, "");
}

/** Mirrors fileExists in resolveTemplatePreview: stat (following links) says a regular file. */
function previewExists(repoDir, rel) {
  try {
    return fs.statSync(path.resolve(repoDir, rel)).isFile();
  } catch {
    return false;
  }
}

/**
 * The preview set: per manifest entry, the files Desktop would show. Files
 * already in the runtime set are left to it. Returns `{ files, missing }`,
 * `missing` being the template keys with no preview at all. Throws BundleError.
 */
export function collectPreviewFiles(repoDir, manifest, runtimeSet = new Set()) {
  const templatesDir = manifest?.repo?.assets?.templatesDir ?? DEFAULT_TEMPLATES_DIR;
  const realRepo = fs.realpathSync(repoDir);
  const picked = new Set();
  const missing = [];
  for (const entry of manifest?.templates ?? []) {
    const explicit = entry.preview
      ? [entry.preview.image, entry.preview.video, entry.preview.poster].filter((p) => typeof p === "string" && p)
      : [];
    let found = explicit.filter((p) => previewExists(repoDir, p));
    if (found.length === 0) {
      const folder = `${templatesDir}/${String(entry.templateKey).replace(/\//g, "__")}`;
      found = CONVENTION_PREVIEW_FILES.map((f) => `${folder}/${f}`).filter((p) => previewExists(repoDir, p));
    }
    if (found.length === 0) missing.push(entry.templateKey);
    for (const p of found) {
      const rel = repoRelative(p);
      if (!rel) throw new BundleError("preview-outside-repo", `${entry.templateKey}: ${p}`);
      if (runtimeSet.has(rel)) continue;
      refuseKind(lstatKind(absOf(repoDir, rel)), rel);
      // A folder on the way may be a link; what gets packed must still live in the repo.
      const inside = path.relative(realRepo, fs.realpathSync(absOf(repoDir, rel)));
      if (inside.startsWith("..") || path.isAbsolute(inside)) throw new BundleError("preview-outside-repo", `${entry.templateKey}: ${p}`);
      picked.add(rel);
    }
  }
  return { files: [...picked].sort(byCodeUnit), missing };
}

// ── tar (ustar, with a PAX record for a path ustar cannot hold) ─────────────

function octal(value, width) {
  const digits = value.toString(8);
  if (digits.length > width - 1) throw new BundleError("file-too-large", `${value} bytes`);
  return digits.padStart(width - 1, "0") + "\0";
}

function tarHeader({ name, prefix = "", size, mtime, type = "0" }) {
  const h = Buffer.alloc(BLOCK);
  h.write(name, 0, 100, "utf8");
  h.write(octal(FILE_MODE, 8), 100, "ascii");
  h.write(octal(0, 8), 108, "ascii");
  h.write(octal(0, 8), 116, "ascii");
  h.write(octal(size, 12), 124, "ascii");
  h.write(octal(mtime, 12), 136, "ascii");
  h.write("        ", 148, "ascii");
  h.write(type, 156, "ascii");
  h.write("ustar\0", 257, "ascii");
  h.write("00", 263, "ascii");
  h.write(prefix, 345, 155, "utf8");
  let sum = 0;
  for (const b of h) sum += b;
  h.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, "ascii");
  return h;
}

/** Split a path into ustar `prefix` (155 bytes) + `name` (100 bytes) at a "/", or null when it cannot fit. */
export function ustarPath(p) {
  if (Buffer.byteLength(p) <= 100) return { name: p, prefix: "" };
  for (let i = p.indexOf("/"); i > 0; i = p.indexOf("/", i + 1)) {
    const prefix = p.slice(0, i);
    const name = p.slice(i + 1);
    if (Buffer.byteLength(prefix) > 155) return null;
    if (name && Buffer.byteLength(name) <= 100) return { name, prefix };
  }
  return null;
}

function paxRecord(key, value) {
  const body = ` ${key}=${value}\n`;
  const n = Buffer.byteLength(body);
  let len = n + 1;
  while (n + String(len).length !== len) len = n + String(len).length;
  return Buffer.from(`${len}${body}`, "utf8");
}

function padding(size) {
  const r = size % BLOCK;
  return r ? Buffer.alloc(BLOCK - r) : null;
}

/** `[{ path, data }]` → an uncompressed tar, in the order given. */
export function writeTar(files, mtime = 0) {
  const chunks = [];
  const push = (buf) => {
    chunks.push(buf);
    const pad = padding(buf.length);
    if (pad) chunks.push(pad);
  };
  for (const f of files) {
    let split = ustarPath(f.path);
    if (!split) {
      const record = paxRecord("path", f.path);
      chunks.push(tarHeader({ name: "PaxHeader", size: record.length, mtime, type: "x" }));
      push(record);
      // The PAX path wins; the ustar name is only what a PAX-blind reader would see.
      let base = path.posix.basename(f.path);
      while (Buffer.byteLength(base) > 100) base = base.slice(1);
      split = { name: base, prefix: "" };
    }
    chunks.push(tarHeader({ ...split, size: f.data.length, mtime }));
    push(f.data);
  }
  chunks.push(Buffer.alloc(BLOCK * 2));
  return Buffer.concat(chunks);
}

function cString(buf) {
  const z = buf.indexOf(0);
  return (z >= 0 ? buf.subarray(0, z) : buf).toString("utf8");
}

/** An uncompressed tar → `[{ path, type, data }]`. Checks every header's checksum. */
export function readTar(buf) {
  const out = [];
  let off = 0;
  let paxPath = null;
  while (off + BLOCK <= buf.length) {
    const h = buf.subarray(off, off + BLOCK);
    if (h.every((b) => b === 0)) break;
    let sum = 0;
    for (let i = 0; i < BLOCK; i++) sum += i >= 148 && i < 156 ? 0x20 : h[i];
    if (sum !== parseInt(cString(h.subarray(148, 156)).trim(), 8)) throw new BundleError("bad-archive", `checksum at byte ${off}`);
    const size = parseInt(cString(h.subarray(124, 136)).trim() || "0", 8);
    const type = cString(h.subarray(156, 157)) || "0";
    const data = buf.subarray(off + BLOCK, off + BLOCK + size);
    off += BLOCK + Math.ceil(size / BLOCK) * BLOCK;
    if (type === "x") {
      const m = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(data.toString("utf8"));
      paxPath = m ? m[1] : null;
      continue;
    }
    const name = cString(h.subarray(0, 100));
    const prefix = cString(h.subarray(345, 500));
    out.push({ path: paxPath ?? (prefix ? `${prefix}/${name}` : name), type, data: Buffer.from(data) });
    paxPath = null;
  }
  return out;
}

/** Tar + gzip the files, then read the archive back and check it holds exactly them. */
function buildArchive(repoDir, rels, mtime) {
  const files = rels.map((rel) => ({ path: rel, data: fs.readFileSync(absOf(repoDir, rel)) }));
  const gz = zlib.gzipSync(writeTar(files, mtime));
  gz[9] = 0xff; // gzip OS byte: "unknown" on every platform, so the bytes do not depend on the packer's OS
  const back = readTar(zlib.gunzipSync(gz));
  const same =
    back.length === files.length &&
    back.every((e, i) => e.type === "0" && e.path === files[i].path && e.data.equals(files[i].data));
  if (!same) throw new BundleError("bad-archive", "the archive did not read back as the files packed");
  return {
    gz,
    sha256: sha256Hex(gz),
    size: gz.length,
    files: files.length,
    unpackedSize: files.reduce((n, f) => n + f.data.length, 0),
  };
}

function readJson(repoDir, rel) {
  try {
    return JSON.parse(stripBom(fs.readFileSync(path.join(repoDir, rel), "utf8")));
  } catch {
    throw new BundleError("unreadable-json", rel);
  }
}

/** release.json as an object, or null when there is none. Throws BundleError. */
export function readRelease(repoDir) {
  const kind = lstatKind(path.join(repoDir, RELEASE_FILE));
  if (kind === "missing") return null;
  refuseKind(kind, RELEASE_FILE);
  const release = readJson(repoDir, RELEASE_FILE);
  if (!release || typeof release !== "object") throw new BundleError("unreadable-json", RELEASE_FILE);
  return release;
}

/** HEAD's sha and commit time, and whether the runtime roots differ from it; null outside git. */
export function readGit(repoDir) {
  const git = (args) => spawnSync("git", args, { cwd: repoDir, encoding: "utf8" });
  const head = git(["log", "-1", "--format=%H %ct"]);
  if (head.status !== 0 || !head.stdout.trim()) return null;
  const [sha, ct] = head.stdout.trim().split(" ");
  const status = git(["status", "--porcelain", "--", SIGNED_DIR, ...RUNTIME_ROOT_FILES]);
  return { sha, time: Number(ct), dirty: status.status === 0 ? status.stdout.trim().length > 0 : null };
}

/**
 * Pack `repoDir` into `outDir` (bundle.json + runtime.tgz [+ previews.tgz]).
 * Returns `{ bundle, missingPreviews }`. Throws BundleError when refused.
 */
export function packBundle({ repoDir, outDir, tag = null, unsigned = false, previews = true, git = readGit }) {
  if (tag != null && !TAG_PATTERN.test(tag)) throw new BundleError("bad-tag", String(tag));
  const out = path.resolve(outDir ?? path.join(repoDir, DEFAULT_OUT_DIR));
  const relOut = path.relative(path.resolve(repoDir, SIGNED_DIR), out);
  if (relOut === "" || (!relOut.startsWith("..") && !path.isAbsolute(relOut))) {
    throw new BundleError("out-inside-tree", `${out} is inside ${SIGNED_DIR}/`);
  }

  const runtimeFiles = collectRuntimeFiles(repoDir);
  const manifest = readJson(repoDir, "template-manifest.json");
  const pkg = readJson(repoDir, "package.json");
  const treeSha256 = computeTreeSha256(repoDir);
  const release = unsigned ? null : readRelease(repoDir);
  if (release) {
    if (release.treeSha256 !== treeSha256) {
      throw new BundleError(
        "release-mismatch",
        `${RELEASE_FILE} signs tree ${String(release.treeSha256).slice(0, 12)} (${release.tag}), this build is ${treeSha256.slice(0, 12)}: re-sign, or pack with --unsigned`,
      );
    }
    if (tag && release.tag !== tag) throw new BundleError("tag-mismatch", `--tag ${tag}, but ${RELEASE_FILE} is signed for ${release.tag}`);
    runtimeFiles.push(RELEASE_FILE);
    runtimeFiles.sort(byCodeUnit);
  }

  const commit = git(repoDir);
  const mtime = commit?.time ?? 0;
  const runtime = buildArchive(repoDir, runtimeFiles, mtime);
  const previewSet = previews ? collectPreviewFiles(repoDir, manifest, new Set(runtimeFiles)) : null;
  const previewArchive = previewSet && previewSet.files.length > 0 ? buildArchive(repoDir, previewSet.files, mtime) : null;

  fs.mkdirSync(out, { recursive: true });
  for (const f of [BUNDLE_FILE, RUNTIME_ARCHIVE, PREVIEWS_ARCHIVE]) fs.rmSync(path.join(out, f), { force: true });
  fs.writeFileSync(path.join(out, RUNTIME_ARCHIVE), runtime.gz);
  if (previewArchive) fs.writeFileSync(path.join(out, PREVIEWS_ARCHIVE), previewArchive.gz);

  const describe = (file, a) => ({ file, sha256: a.sha256, size: a.size, files: a.files, unpackedSize: a.unpackedSize });
  const bundle = {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    kind: BUNDLE_KIND,
    repoId: manifest?.repo?.repoId ?? null,
    displayName: manifest?.repo?.displayName ?? null,
    package: { name: pkg?.name ?? null, version: pkg?.version ?? null },
    tag: tag ?? release?.tag ?? null,
    signed: Boolean(release),
    commit: commit ? { sha: commit.sha, time: new Date(commit.time * 1000).toISOString(), dirty: commit.dirty } : null,
    templates: Array.isArray(manifest?.templates) ? manifest.templates.length : 0,
    runtime: { ...describe(RUNTIME_ARCHIVE, runtime), treeSha256 },
    previews: previewArchive ? { ...describe(PREVIEWS_ARCHIVE, previewArchive), missing: previewSet.missing.length } : null,
  };
  fs.writeFileSync(path.join(out, BUNDLE_FILE), JSON.stringify(bundle, null, 2) + "\n");
  return { bundle, outDir: out, missingPreviews: previewSet?.missing ?? [] };
}

export function parseArgs(argv, defaultRepo) {
  const val = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const known = new Set(["--repo", "--out", "--tag", "--unsigned", "--no-previews", "--json"]);
  for (const flag of ["--repo", "--out", "--tag"]) {
    if (argv.includes(flag) && (!val(flag) || val(flag).startsWith("--"))) return { ok: false, error: `${flag} needs a value` };
  }
  const unknown = argv.find((a) => a.startsWith("--") && !known.has(a));
  if (unknown) return { ok: false, error: `unknown option ${unknown}` };
  const repoDir = path.resolve(val("--repo") ?? defaultRepo);
  return {
    ok: true,
    repoDir,
    outDir: val("--out") ? path.resolve(val("--out")) : undefined,
    tag: val("--tag") ?? null,
    unsigned: argv.includes("--unsigned"),
    previews: !argv.includes("--no-previews"),
    json: argv.includes("--json"),
  };
}

const USAGE =
  "Usage: node tools/pack-bundle.mjs [--repo <dir>] [--out <dir>] [--tag <tag>] [--unsigned] [--no-previews] [--json]";

function mb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function main() {
  const defaultRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const args = parseArgs(process.argv.slice(2), defaultRepo);
  if (!args.ok) {
    console.error(`${args.error}\n${USAGE}`);
    process.exit(2);
  }
  let result;
  try {
    result = packBundle(args);
  } catch (err) {
    if (!(err instanceof BundleError)) throw err;
    console.error(`✗ not packed: ${err.message}`);
    process.exit(1);
  }
  const { bundle, outDir, missingPreviews } = result;
  if (args.json) {
    console.log(JSON.stringify(bundle, null, 2));
    return;
  }
  const near = path.relative(process.cwd(), outDir);
  const rel = near === "" ? "." : near.startsWith("..") || path.isAbsolute(near) ? outDir : near;
  const signedNote = bundle.signed ? `signed ${bundle.tag}` : "unsigned";
  console.log(`✓ ${bundle.repoId ?? bundle.package.name} (${bundle.templates} templates) → ${rel}/`);
  console.log(`  ${RUNTIME_ARCHIVE}   ${mb(bundle.runtime.size)}  ${bundle.runtime.files} files  ${signedNote}  treeSha256 ${bundle.runtime.treeSha256.slice(0, 12)}`);
  if (bundle.previews) console.log(`  ${PREVIEWS_ARCHIVE}  ${mb(bundle.previews.size)}  ${bundle.previews.files} files`);
  else console.log(`  ${PREVIEWS_ARCHIVE}  none${args.previews ? " (no preview files found)" : " (--no-previews)"}`);
  if (missingPreviews.length > 0) {
    console.log(`  ! ${missingPreviews.length} template(s) without a preview: ${missingPreviews.slice(0, 5).join(", ")}${missingPreviews.length > 5 ? ", ..." : ""}`);
  }
  if (bundle.commit?.dirty) console.log("  ! the packed files differ from HEAD: commit before you publish");
  const files = [BUNDLE_FILE, RUNTIME_ARCHIVE, ...(bundle.previews ? [PREVIEWS_ARCHIVE] : [])].map((f) => `${rel}/${f}`);
  console.log(`\nPublish: gh release create ${bundle.tag ?? "<tag>"} ${files.join(" ")}`);
}

/** Run only when invoked directly, compared by real path (see verify-release.mjs). */
function isMainModule() {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main();
}
