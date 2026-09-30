import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { classifyChanges, patchPaths, porcelain, PROTECTED, restoreTree, snapshotTree } from "./git.mjs";

const D = "2026-09-21";
const e = (status, path) => ({ status, path });

test("a clean shipped day: one new template folder, wiring, dist, manifest, previews, journal", () => {
  const r = classifyChanges([
    e("??", "src/dev/release-banner/v1/release-banner.ts"),
    e("??", "src/dev/release-banner/v1/release-banner.test.ts"),
    e("??", "src/dev/release-banner/v1/release-banner.layout.m0"),
    e("??", "src/dev/registry.ts"), e("??", "src/dev/index.ts"),
    e("M", "src/repo.ts"), e("M", "src/template-registry.ts"), e("M", "src/index.ts"),
    e("M", "dist/index.js"), e("??", "dist/dev/index.js"), e("M", "template-manifest.json"),
    e("??", "assets/templates/@one-a-day__dev__release-banner__v1/preview.png"),
    e("??", `journal/${D}/10-scout.md`), e("??", `journal/${D}/variants/a/report.json`), e("M", "journal/index.json"),
  ], { date: D });
  assert.equal(r.forbidden.length, 0);
  assert.deepEqual(r.newTemplateDirs, ["src/dev/release-banner/v1/"]);
  assert.deepEqual(r.touchedAssetDirs, ["@one-a-day__dev__release-banner__v1"]);
});

test("the generated directory page is a day's to change, like the manifest; the README it is linked from is not", () => {
  const r = classifyChanges([e("M", "TEMPLATES.md"), e("M", "template-manifest.json"), e("M", "README.md"), e("??", "GALLERY.md")], { date: D });
  assert.deepEqual(r.allowed.map((a) => a.path), ["TEMPLATES.md", "template-manifest.json"]);
  assert.deepEqual(r.forbidden.map((f) => f.path).sort(), ["GALLERY.md", "README.md"]);
});

test("protected files and folders are forbidden whatever the status", () => {
  const r = classifyChanges([
    e("M", "AGENTS.md"), e("M", "pipeline/config.json"), e("??", "tools/x.mjs"), e("M", ".github/workflows/ci.yml"),
    e("M", "package.json"), e("M", "dep-allowlist.json"), e("??", "journal/README.md"), e("??", "secret.txt"),
  ], { date: D });
  assert.equal(r.allowed.length, 0);
  assert.equal(r.forbidden.length, 8);
  for (const f of PROTECTED.files) assert.ok(typeof f === "string");
});

test("editing or deleting an existing template folder is forbidden; a second new folder is counted", () => {
  const r = classifyChanges([
    e("M", "src/basics/hello-world/v1/hello-world.ts"),
    e("D", "src/social/quote/v1/quote.ts"),
    e("??", "src/dev/a/v1/a.ts"), e("??", "src/dev/b/v1/b.ts"),
  ], { date: D });
  assert.equal(r.forbidden.length, 2);
  assert.match(r.forbidden[0].reason, /frozen/);
  assert.deepEqual(r.newTemplateDirs, ["src/dev/a/v1/", "src/dev/b/v1/"]);
});

test("another day's journal is forbidden, today's is allowed", () => {
  const r = classifyChanges([e("M", "journal/2026-09-01/50-ship.md"), e("??", `journal/${D}/x.md`)], { date: D });
  assert.equal(r.forbidden.length, 1);
  assert.equal(r.allowed.length, 1);
});

test("stray render outputs at the repo root are scratch, not a scope violation (day 003)", () => {
  const r = classifyChanges([
    e("??", "out.validate.json"), e("??", "out.png"), e("??", "out.mp4"), e("??", "why.mp4"),
    e("??", "review.output.json"), e("??", "out-2.tutorial.png"),
    e("??", "secret.txt"), e("??", "notes.json"),
  ], { date: D });
  assert.deepEqual(r.scratch.map((s) => s.path).sort(), ["out-2.tutorial.png", "out.mp4", "out.png", "out.validate.json", "review.output.json", "why.mp4"]);
  for (const s of r.scratch) assert.match(s.reason, /stray render output/);
  assert.deepEqual(r.forbidden.map((f) => f.path).sort(), ["notes.json", "secret.txt"]);
  assert.equal(r.allowed.length, 0);
});

test("a tracked file with a scratch-looking name is not scratch", () => {
  const r = classifyChanges([e("M", "out.png")], { date: D });
  assert.equal(r.scratch.length, 0);
  assert.equal(r.forbidden.length, 1);
});

test("runtime caches inside the day's journal are scratch; the rest of the journal is allowed", () => {
  const r = classifyChanges([
    e("??", `journal/${D}/cache/masks/mask-0184071edfdaf7a9.png`),
    e("??", `journal/${D}/m0saic-runtime/cache/masks/mask-036adc24351db32e.png`),
    e("??", `journal/${D}/variants/a/report.json`),
    e("??", "journal/2026-09-01/cache/masks/x.png"),
  ], { date: D });
  assert.equal(r.scratch.length, 2);
  for (const s of r.scratch) assert.match(s.reason, /runtime cache/);
  assert.deepEqual(r.allowed.map((a) => a.path), [`journal/${D}/variants/a/report.json`]);
  assert.equal(r.forbidden.length, 1, "another day's cache is still another day's journal");
});

test("a kept tree round-trips: the day's work outside the journal, tracked and untracked, binary included, and nothing else", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "one-a-day-keep-"));
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
  const g = (...a) => execFileSync("git", a, { cwd: tmp, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const w = (rel, data) => { fs.mkdirSync(path.join(tmp, path.dirname(rel)), { recursive: true }); fs.writeFileSync(path.join(tmp, rel), data); };
  try {
    g("init", "-q", "-b", "main");
    g("config", "commit.gpgsign", "false");
    // As the repo itself: LF in the tree whatever the machine's autocrlf says.
    w(".gitattributes", "* text=auto eol=lf\n");
    w("src/dev/registry.ts", "export const templates = [];\n");
    w("template-manifest.json", "{}\n");
    w("dist/dev/index.js", "// old\n");
    w(`journal/${D}/state.json`, "{}\n");
    g("add", "-A");
    g("commit", "-q", "-m", "scaffold");
    // A day's work: a new template (text and a binary sidecar), the wiring
    // edited, dist rebuilt, the journal written - plus a stray render at the
    // root that is scratch, not work.
    w("src/dev/card/v1/card.ts", "export const card = 1;\n");
    w("src/dev/card/v1/card.png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 0xff, 0xfe, 0x0d, 0x0a, 0x1a]));
    w("src/dev/registry.ts", "export const templates = [card];\n");
    w("dist/dev/index.js", "// new\n");
    w(`journal/${D}/30-build.md`, "# Build\n");
    w("out.png", "junk");

    const patch = path.join(tmp, "journal", D, "limited", "tree.patch");
    const kept = snapshotTree(tmp, patch, { date: D });
    assert.deepEqual(kept.sort(), ["dist/dev/index.js", "src/dev/card/v1/card.png", "src/dev/card/v1/card.ts", "src/dev/registry.ts"]);
    assert.deepEqual(patchPaths(patch).sort(), kept.sort());
    assert.equal(g("diff", "--cached", "--name-only").trim(), "", "the index is left as it was found");
    assert.ok(porcelain(tmp).some((x) => x.status === "??" && x.path === "src/dev/card/v1/card.ts"), "the new file is still untracked");

    // The gate's revert: tracked back to HEAD, untracked work deleted.
    g("checkout", "HEAD", "--", "src/dev/registry.ts", "dist/dev/index.js");
    fs.rmSync(path.join(tmp, "src/dev/card"), { recursive: true });
    fs.rmSync(path.join(tmp, "out.png"));
    assert.equal(fs.existsSync(path.join(tmp, "src/dev/card/v1/card.ts")), false);

    const r = restoreTree(tmp, patch);
    assert.equal(r.ok, true, r.error);
    assert.equal(r.threeWay, false);
    assert.equal(fs.readFileSync(path.join(tmp, "src/dev/card/v1/card.ts"), "utf8"), "export const card = 1;\n");
    assert.deepEqual([...fs.readFileSync(path.join(tmp, "src/dev/card/v1/card.png"))], [0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 0xff, 0xfe, 0x0d, 0x0a, 0x1a]);
    assert.equal(fs.readFileSync(path.join(tmp, "src/dev/registry.ts"), "utf8"), "export const templates = [card];\n");
    assert.equal(fs.readFileSync(path.join(tmp, "dist/dev/index.js"), "utf8"), "// new\n");
    assert.equal(fs.existsSync(path.join(tmp, "out.png")), false, "scratch was never kept");
    assert.equal(g("diff", "--cached", "--name-only").trim(), "", "restored into the working tree only");
    assert.ok(porcelain(tmp).some((x) => x.status === "??" && x.path === "src/dev/card/v1/card.ts"), "restored work looks like the agent's own writes");

    // Applied over HEAD that moved on (the journal-only commit a no-ship day makes): three-way.
    g("checkout", "HEAD", "--", "src/dev/registry.ts", "dist/dev/index.js");
    fs.rmSync(path.join(tmp, "src/dev/card"), { recursive: true });
    g("add", "-A");
    g("commit", "-q", "-m", "no-ship: journal only");
    const again = restoreTree(tmp, patch);
    assert.equal(again.ok, true, again.error);
    assert.equal(fs.readFileSync(path.join(tmp, "src/dev/card/v1/card.ts"), "utf8"), "export const card = 1;\n");

    assert.deepEqual(snapshotTree(tmp, path.join(tmp, "none.patch"), { date: "2000-01-01" }), snapshotTree(tmp, path.join(tmp, "none.patch"), { date: "2000-01-01" }));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("a tree with nothing to keep writes no patch", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "one-a-day-keep-"));
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
  const g = (...a) => execFileSync("git", a, { cwd: tmp, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    g("init", "-q", "-b", "main");
    g("config", "commit.gpgsign", "false");
    fs.writeFileSync(path.join(tmp, "a.txt"), "a\n");
    g("add", "-A");
    g("commit", "-q", "-m", "one");
    fs.mkdirSync(path.join(tmp, "journal", D), { recursive: true });
    fs.writeFileSync(path.join(tmp, "journal", D, "state.json"), "{}\n");
    const patch = path.join(tmp, "journal", D, "limited", "tree.patch");
    assert.deepEqual(snapshotTree(tmp, patch, { date: D }), []);
    assert.equal(fs.existsSync(patch), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
