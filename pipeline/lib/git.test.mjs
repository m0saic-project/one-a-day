import test from "node:test";
import assert from "node:assert/strict";
import { classifyChanges, PROTECTED } from "./git.mjs";

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
