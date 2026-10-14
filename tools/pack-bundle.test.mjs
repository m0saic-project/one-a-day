// Bundle builder vendored from m0saic-monorepo commit
// bbb141e96844a5a6638df94f22c2f8910d8ca2d5, packages/community-templates/tools/.
// Exercise the archives with the system tar, independently of the writer.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { packBundle } from "./pack-bundle.mjs";
import { computeTreeSha256 } from "./verify-release.mjs";

test("unsigned bundle extracts as a loadable repo, excludes authoring files, and is reproducible", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "one-a-day-bundle-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  const put = (rel, data) => {
    const file = path.join(repo, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
  };
  put("dist/index.js", "exports.templates = [{ id: '@one-a-day/test/v1' }];\n");
  put("dist/media/example.png", "runtime media");
  put("package.json", JSON.stringify({ name: "one-a-day", version: "0.1.0", main: "dist/index.js" }));
  put("template-manifest.json", JSON.stringify({
    repo: { repoId: "@one-a-day", displayName: "One a Day" },
    entryModule: "./dist/index.js",
    templates: [{ templateKey: "@one-a-day/test/v1", preview: { image: "assets/templates/test/preview.png" } }],
  }));
  put("assets/templates/test/preview.png", "preview");
  put("assets/templates/test/preview.renderFacts.json", "{}");
  put("src/test.ts", "source");
  put("journal/day/log.txt", "journal");
  put("node_modules/example/index.js", "dependency");
  put("release.json", JSON.stringify({ tag: "stale" }));
  put("LICENSE", "MIT");
  const git = () => ({ sha: "a".repeat(40), time: 1760000000, dirty: false });
  const options = { repoDir: repo, tag: "v2026.10.13.1", unsigned: true, git };
  const out = path.join(root, "out");
  const { bundle } = packBundle({ ...options, outDir: out });
  assert.equal(bundle.signed, false);
  assert.equal(bundle.repoId, "@one-a-day");
  assert.equal(bundle.tag, options.tag);
  assert.equal(bundle.previews.missing, 0);
  const host = path.join(root, "host");
  fs.mkdirSync(host);
  for (const archive of [bundle.runtime, bundle.previews]) {
    const file = path.join(out, archive.file);
    const bytes = fs.readFileSync(file);
    assert.equal(archive.sha256, crypto.createHash("sha256").update(bytes).digest("hex"));
    assert.equal(archive.size, bytes.length);
    const result = spawnSync("tar", ["-xzf", file, "-C", host], { encoding: "utf8" });
    assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  }
  assert.equal(computeTreeSha256(host), computeTreeSha256(repo));
  assert.equal(fs.readFileSync(path.join(host, "dist/media/example.png"), "utf8"), "runtime media");
  assert.equal(fs.readFileSync(path.join(host, "assets/templates/test/preview.png"), "utf8"), "preview");
  for (const excluded of ["src", "journal", "node_modules", "release.json", "assets/templates/test/preview.renderFacts.json"]) {
    assert.equal(fs.existsSync(path.join(host, excluded)), false, excluded);
  }
  const loaded = spawnSync(process.execPath, ["-e", "console.log(require('./').templates[0].id)"], { cwd: host, encoding: "utf8" });
  assert.equal(loaded.status, 0, loaded.stderr);
  assert.equal(loaded.stdout.trim(), "@one-a-day/test/v1");
  const second = path.join(root, "second");
  packBundle({ ...options, outDir: second });
  for (const file of ["bundle.json", "runtime.tgz", "previews.tgz"]) {
    assert.deepEqual(fs.readFileSync(path.join(out, file)), fs.readFileSync(path.join(second, file)));
  }
});
