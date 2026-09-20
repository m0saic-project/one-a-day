// Run with: node --test tools/check-freeze.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  FREEZE_MANIFEST_FILE, checkTree, collectFrozenFiles, hashBytes, isFrozenSeed, judgeStaged, mintManifest, relativeImportSpecifiers,
} from "./check-freeze.mjs";

function pkg() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cfreeze-"));
  const w = (rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
  w("src/cards/hello/v1/hello.ts", 'import { helper } from "../../_shared/theme";\nexport const a = helper(1);\n');
  w("src/cards/hello/v1/hello.test.ts", "test('x', () => {});\n");
  w("src/cards/_shared/theme.ts", 'import { base } from "../../util/base";\nexport const helper = (n) => base + n;\n');
  w("src/util/base.ts", "export const base = 1;\n");
  w("src/cards/registry.ts", "export const cardsRegistry = [];\n");
  w("src/repo.ts", "export const TEMPLATE_REPO = { repoId: \"@x\" };\n");
  w("src/cards/hello/v1/uses-repo.ts", 'import { TEMPLATE_REPO } from "../../../repo";\nexport const r = TEMPLATE_REPO;\n');
  w("src/cards/index.ts", "export {};\n");
  w("src/__testutils__/render.ts", "export const ctx = 1;\n");
  w("src/basics/hello-world/v1/hello-world.ts", "export const hw = 1;\n");
  w("src/lab/flow/v1/flow.ts", "export const m = 1;\n");
  return { root, w };
}

test("seeds are vN / _shared .ts files under src/, never tests, registries or testutils", () => {
  assert.equal(isFrozenSeed("src/cards/hello/v1/hello.ts"), true);
  assert.equal(isFrozenSeed("src/cards/_shared/theme.ts"), true);
  assert.equal(isFrozenSeed("src/basics/hello-world/v1/hello-world.ts"), true);
  assert.equal(isFrozenSeed("src/cards/hello/v1/hello.test.ts"), false);
  assert.equal(isFrozenSeed("src/cards/registry.ts"), false);
  assert.equal(isFrozenSeed("src/template-registry.ts"), false);
  assert.equal(isFrozenSeed("src/repo.ts"), false);
});

test("the frozen set is seeds + their import closure, minus __testutils__ and excluded packs", () => {
  const { root } = pkg();
  assert.deepEqual(collectFrozenFiles(root, ["src/lab/"]), [
    "src/basics/hello-world/v1/hello-world.ts",
    "src/cards/_shared/theme.ts",
    "src/cards/hello/v1/hello.ts",
    "src/cards/hello/v1/uses-repo.ts",
    "src/util/base.ts",
  ]); // src/repo.ts is imported by a frozen file yet never frozen
  assert.ok(collectFrozenFiles(root).includes("src/lab/flow/v1/flow.ts"));
});

test("import scan ignores commented-out imports", () => {
  assert.deepEqual(relativeImportSpecifiers('// import x from "./dead";\n/* import y from "./dead2" */\nimport z from "./live";\nimport "@m0saic/types";'), ["./live"]);
});

test("hashes are CRLF-agnostic", () => {
  assert.equal(hashBytes(Buffer.from("a\r\nb\rc\n")), hashBytes(Buffer.from("a\nb\nc\n")));
});

test("checkTree: unchanged passes, a byte edit (even a comment) fails, a deletion fails, new work is unfrozen", () => {
  const { root, w } = pkg();
  const m = mintManifest(root, { tag: "v1", commit: "abc", excluded: ["src/lab/"] });
  assert.equal(Object.keys(m.files).length, 5);
  assert.equal(checkTree(root, m).ok, true);
  w("src/cards/hello/v1/hello.ts", '// a comment\nimport { helper } from "../../_shared/theme";\nexport const a = helper(1);\n');
  let r = checkTree(root, m);
  assert.equal(r.ok, false);
  assert.deepEqual(r.changed, ["src/cards/hello/v1/hello.ts"]);
  fs.rmSync(path.join(root, "src/util/base.ts"));
  r = checkTree(root, m);
  assert.deepEqual(r.deleted, ["src/util/base.ts"]);
  w("src/cards/hello/v2/hello.ts", "export const a = 2;\n");
  assert.ok(checkTree(root, m).unfrozen.includes("src/cards/hello/v2/hello.ts"));
  assert.equal(checkTree(root, { ...m, hashVersion: 99 }).hashVersionMismatch !== undefined, true);
});

test("judgeStaged: the index is judged against the manifest at HEAD; the manifest is additive-only", () => {
  const { root, w } = pkg();
  const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
  git("init", "-q");
  git("config", "commit.gpgsign", "false");
  const m = mintManifest(root, { tag: "v1", commit: "abc", excluded: ["src/lab/"] });
  fs.writeFileSync(path.join(root, FREEZE_MANIFEST_FILE), JSON.stringify(m, null, 2) + "\n");
  git("add", "-A");
  git("commit", "-q", "-m", "frozen");
  // new work stages clean
  w("src/cards/hello/v2/hello.ts", "export const a = 2;\n");
  git("add", "-A");
  assert.equal(judgeStaged(root, "").code, 0);
  // a frozen edit is caught in the INDEX even if the working tree is later restored
  w("src/cards/hello/v1/hello.ts", "export const a = 3;\n");
  git("add", "-A");
  let v = judgeStaged(root, "");
  assert.equal(v.code, 1);
  assert.ok(v.lines.some((l) => l.startsWith("changed  src/cards/hello/v1/hello.ts")));
  git("checkout", "HEAD", "--", "src/cards/hello/v1/hello.ts");
  assert.equal(judgeStaged(root, "").code, 0);
  // blessing the edit by staging a re-minted manifest is refused
  w("src/cards/hello/v1/hello.ts", "export const a = 3;\n");
  const remint = mintManifest(root, { tag: "v1", commit: "abc", excluded: m.excluded });
  fs.writeFileSync(path.join(root, FREEZE_MANIFEST_FILE), JSON.stringify(remint, null, 2) + "\n");
  git("add", "-A");
  v = judgeStaged(root, "");
  assert.equal(v.code, 1);
  assert.ok(v.lines.some((l) => l.startsWith("manifest moves")));
  // deleting a frozen file is refused
  git("checkout", "HEAD", "--", ".");
  git("rm", "-q", "src/util/base.ts");
  v = judgeStaged(root, "");
  assert.equal(v.code, 1);
  assert.ok(v.lines.some((l) => l.startsWith("DELETED  src/util/base.ts")));
});
