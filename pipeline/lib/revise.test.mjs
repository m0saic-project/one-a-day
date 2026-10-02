import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { patchState, readState, writeJson } from "./journal.mjs";
import { openRevision, rejectedByCritic, reviseConfig, revisionOf, variantsOf, verdictFile } from "./revise.mjs";

const day = (state) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "one-a-day-revise-"));
  writeJson(path.join(dir, "state.json"), state);
  return dir;
};
// Day 013 as the critic left it.
const REJECTED = { scout: "done", plan: "done", scaffolded: true, variants: ["a"], inPlace: "a", build: "done", decision: "no-ship", pick: null, noShipReason: "the delta bars are missing", critique: "done" };

test("only a critic's no-ship over work that exists is worth a round", () => {
  assert.equal(rejectedByCritic(day(REJECTED)), true);
  assert.equal(rejectedByCritic(day({ ...REJECTED, decision: "ship" })), false);
  // The runner's own no-ship: a phase ran out of calls, or the session limit ended the day.
  assert.equal(rejectedByCritic(day({ ...REJECTED, critique: undefined, noShipReason: "build phase did not complete" })), false);
  // The build got nothing through the gate: there is nothing to revise.
  assert.equal(rejectedByCritic(day({ ...REJECTED, variants: [] })), false);
  assert.equal(rejectedByCritic(day({})), false);
});

test("a builder that forgot state.variants is read off the variants folder", () => {
  const dir = day({ ...REJECTED, variants: undefined });
  assert.deepEqual(variantsOf(dir), []);
  fs.mkdirSync(path.join(dir, "variants", "a", "src"), { recursive: true });
  fs.mkdirSync(path.join(dir, "variants", "b"), { recursive: true }); // rendered nothing
  assert.deepEqual(variantsOf(dir), ["a"]);
  assert.equal(rejectedByCritic(dir), true);
});

test("opening a round moves the verdict aside and owes build and critique again", () => {
  const dir = day(REJECTED);
  fs.writeFileSync(path.join(dir, "40-critique.md"), "# Critique\n\n## Decision: NO SHIP\n");
  const r = openRevision(dir, new Date("2026-10-02T13:22:05.000Z"));
  assert.deepEqual(r, { round: 1, verdict: "40-critique.r1.md", rejected: "the delta bars are missing" });
  assert.equal(fs.existsSync(path.join(dir, "40-critique.md")), false);
  assert.match(fs.readFileSync(path.join(dir, "40-critique.r1.md"), "utf8"), /NO SHIP/);
  const st = readState(dir);
  assert.equal(st.revision, 1);
  assert.deepEqual(st.revisions, [{ round: 1, at: "2026-10-02T13:22:05.000Z", rejected: "the delta bars are missing", verdict: "40-critique.r1.md" }]);
  for (const k of ["build", "critique", "decision", "pick", "noShipReason"]) assert.equal(k in st, false, `${k} is owed again`);
  // What the day already has is kept.
  assert.equal(st.scaffolded, true);
  assert.deepEqual(st.variants, ["a"]);
  assert.equal(st.plan, "done");
  assert.equal(rejectedByCritic(dir), false);
});

test("rounds count up across runs: a resumed day opens the next one", () => {
  const dir = day(REJECTED);
  fs.writeFileSync(path.join(dir, "40-critique.md"), "first");
  openRevision(dir);
  patchState(dir, { build: "done", critique: "done", decision: "no-ship", noShipReason: "still wrong", variants: ["a", "b"] });
  fs.writeFileSync(path.join(dir, "40-critique.md"), "second");
  const r = openRevision(dir);
  assert.equal(r.round, 2);
  assert.equal(fs.readFileSync(path.join(dir, "40-critique.r1.md"), "utf8"), "first");
  assert.equal(fs.readFileSync(path.join(dir, "40-critique.r2.md"), "utf8"), "second");
  assert.deepEqual(readState(dir).revisions.map((x) => [x.round, x.rejected]), [[1, "the delta bars are missing"], [2, "still wrong"]]);
});

test("config and state are read defensively", () => {
  assert.deepEqual(reviseConfig({ revise: { maxRounds: 2 } }), { maxRounds: 2 });
  assert.deepEqual(reviseConfig({ revise: { maxRounds: 2.9 } }), { maxRounds: 2 });
  assert.deepEqual(reviseConfig({ revise: { maxRounds: 0 } }), { maxRounds: 0 });
  assert.deepEqual(reviseConfig({}), { maxRounds: 0 });
  assert.equal(revisionOf({ revision: 2 }), 2);
  assert.equal(revisionOf({ revision: "x" }), 0);
  assert.equal(revisionOf({}), 0);
  assert.equal(verdictFile(3), "40-critique.r3.md");
});
