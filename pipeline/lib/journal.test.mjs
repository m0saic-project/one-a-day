import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { dayNumber, ensureDay, patchRun, patchState, readRun, readState, renderTemplate, todayIso, upsertIndex, readIndex, isIsoDate } from "./journal.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "oad-journal-"));

test("todayIso and isIsoDate", () => {
  assert.equal(todayIso(new Date(2026, 8, 3)), "2026-09-03");
  assert.equal(isIsoDate("2026-09-03"), true);
  assert.equal(isIsoDate("yesterday"), false);
});

test("ensureDay creates the folder once; state and run patches merge", () => {
  const repo = tmp();
  const a = ensureDay(repo, "2026-09-21");
  assert.equal(a.created, true);
  assert.equal(ensureDay(repo, "2026-09-21").created, false);
  assert.ok(fs.existsSync(path.join(a.dir, "logs")));
  patchState(a.dir, { scout: "done", useCase: "x" });
  patchState(a.dir, { plan: "done" });
  assert.deepEqual(readState(a.dir), { scout: "done", useCase: "x", plan: "done" });
  patchRun(a.dir, { runner: { adapter: "claude" }, model: { selfDeclared: null, corrected: null } });
  patchRun(a.dir, { model: { selfDeclared: "claude-fable-5.1" }, phases: { scout: { calls: 1 } } });
  const r = readRun(a.dir);
  assert.equal(r.runner.adapter, "claude");
  assert.deepEqual(r.model, { selfDeclared: "claude-fable-5.1", corrected: null });
  assert.equal(r.phases.scout.calls, 1);
});

test("index rows upsert by date, stay sorted; day numbers count earlier rows", () => {
  const repo = tmp();
  fs.mkdirSync(path.join(repo, "journal"));
  upsertIndex(repo, { date: "2026-09-22", day: 2, status: "shipped" });
  upsertIndex(repo, { date: "2026-09-21", day: 1, status: "no-ship" });
  upsertIndex(repo, { date: "2026-09-22", day: 2, status: "failed" });
  const rows = readIndex(repo);
  assert.deepEqual(rows.map((r) => r.date), ["2026-09-21", "2026-09-22"]);
  assert.equal(rows[1].status, "failed");
  assert.equal(dayNumber(repo, "2026-09-23"), 3);
  assert.equal(dayNumber(repo, "2026-09-21"), 1);
});

test("renderTemplate substitutes known keys and leaves unknown ones", () => {
  assert.equal(renderTemplate("{{DATE}} / {{NOPE}}", { DATE: "d" }), "d / {{NOPE}}");
});
