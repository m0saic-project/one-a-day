import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendTrace, createTraceRecorder, estimateCost, timelineFromTrace, toolsLine } from "./trace.mjs";

const claudeLines = (t) => [
  { type: "system", subtype: "init", model: "m" },
  { type: "assistant", message: { usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 1000 }, content: [{ type: "tool_use", id: "t1", name: "Bash", input: { command: "npm run build" } }] } },
  { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", is_error: false }] } },
  { type: "assistant", message: { usage: { input_tokens: 120, output_tokens: 80 }, content: [{ type: "tool_use", id: "t2", name: "Read", input: { file_path: "a.ts" } }, { type: "tool_use", id: "t3", name: "Bash", input: { command: "ls" } }] } },
  { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t2" }, { type: "tool_result", tool_use_id: "t3", is_error: true }] } },
  { type: "result", total_cost_usd: 0.42, num_turns: 2 },
].map((o) => JSON.stringify(o));

test("records Claude stream-json: spans with tool + target + timing, usage, cost, the phase name for a retry", () => {
  let clock = 1000;
  const rec = createTraceRecorder({ phase: "build", call: 2, startedAt: 1000, now: () => clock });
  for (const line of claudeLines()) { rec.onLine(line); clock += 500; }
  rec.onLine("not json at all");
  const r = rec.finish({ exitCode: 0 });
  assert.equal(r.name, "build (2)");
  assert.equal(r.calls, 3);
  assert.deepEqual(r.tools, { Bash: 2, Read: 1 });
  assert.equal(r.spans[0].tool, "Bash");
  assert.equal(r.spans[0].target, "npm run build");
  assert.equal(r.spans[0].startMs, 500);
  assert.equal(r.spans[0].durMs, 500);
  assert.equal(r.spans[2].status, "error");
  assert.equal(r.toolErrors, 1);
  assert.deepEqual(r.tokens, { input: 220, output: 130, cacheRead: 1000, cacheWrite: 0, total: 1350 });
  assert.equal(r.cost, 0.42);
  assert.equal(r.turns, 2);
  assert.equal(r.status, "ok");
  assert.equal(createTraceRecorder({ phase: "scout" }).finish({ exitCode: 1 }).status, "error");
});

test("records Codex --json items and turn usage", () => {
  let clock = 0;
  const rec = createTraceRecorder({ phase: "scout", startedAt: 0, now: () => clock });
  rec.onLine(JSON.stringify({ type: "item.started", item: { id: "c1", type: "command_execution", command: "curl x" } })); clock += 700;
  rec.onLine(JSON.stringify({ type: "item.completed", item: { id: "c1", type: "command_execution", command: "curl x", exit_code: 2 } }));
  rec.onLine(JSON.stringify({ type: "item.completed", item: { id: "f1", type: "file_change", changes: [{ path: "src/x.ts" }] } }));
  rec.onLine(JSON.stringify({ type: "turn.completed", usage: { input_tokens: 10, output_tokens: 5, cached_input_tokens: 3 } }));
  const r = rec.finish();
  assert.equal(r.calls, 2);
  assert.deepEqual(r.tools, { shell: 1, edit: 1 });
  assert.equal(r.spans[0].durMs, 700);
  assert.equal(r.spans[0].status, "error");
  assert.equal(r.tokens.total, 18);
});

test("appendTrace merges phase calls into trace.json with startMs from the first phase; timelineFromTrace is the WHY shape", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trace-"));
  const rec = (phase, call, startedAt, ms, tools) => ({ phase, call, name: call > 1 ? `${phase} (${call})` : phase, startedAt: new Date(startedAt).toISOString(), durMs: ms, exitCode: 0, timedOut: false, status: "ok", calls: Object.values(tools).reduce((a, b) => a + b, 0), toolErrors: 0, turns: 1, tokens: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, total: 2 }, cost: 0.1, tools, spans: [] });
  appendTrace(dir, rec("scout", 1, 1_700_000_000_000, 60000, { Bash: 5, WebSearch: 2 }));
  appendTrace(dir, rec("build", 1, 1_700_000_100_000, 30000, { Bash: 9 }));
  appendTrace(dir, rec("build", 1, 1_700_000_100_000, 35000, { Bash: 10, Edit: 4, Read: 1, Write: 1 })); // a re-run replaces
  const trace = JSON.parse(fs.readFileSync(path.join(dir, "trace.json"), "utf8"));
  assert.equal(trace.phases.length, 2);
  assert.equal(trace.phases[1].startMs, 100000);
  assert.equal(trace.phases[1].durMs, 35000);
  assert.equal(trace.totals.calls, 23);
  assert.equal(trace.totals.wallMs, 135000);
  const tl = timelineFromTrace(trace);
  assert.equal(tl.source, "runner");
  assert.deepEqual(tl.phases[1], { name: "build", startMs: 100000, durMs: 35000, calls: 16, tokens: 2, costUsd: 0.1, tools: "Bash 10, Edit 4, Read 1" });
  assert.equal(tl.costBasis, "reported");
  assert.equal(toolsLine({ Read: 3, Bash: 3, Edit: 1, Write: 9 }), "Write 9, Bash 3, Read 3");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("cost: reported by the CLI wins; else an estimate from the dated price table; the timeline says which", () => {
  const pricing = { pricedAt: "2026-09-20", perMillion: { "claude-opus": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, codex: { input: 1.25, output: 10 } } };
  assert.deepEqual(estimateCost({ input: 1_000_000, output: 100_000, cacheRead: 2_000_000 }, "claude-opus-5[1m]", pricing), { usd: 25.5, rate: "claude-opus", pricedAt: "2026-09-20" });
  assert.equal(estimateCost({ input: 10 }, "kimi-k2", pricing), null);
  const dated = { pricedAt: "2026-09-20", perMillion: { "claude-opus-5-5": { input: 4, output: 20, pricedAt: "2026-09-26" }, "claude-opus": { input: 5, output: 25 } } };
  assert.deepEqual(estimateCost({ input: 1_000_000, output: 100_000 }, "claude-opus-5-5", dated), { usd: 6, rate: "claude-opus-5-5", pricedAt: "2026-09-26" });
  assert.equal(estimateCost({ input: 1_000_000 }, "claude-opus-5", dated).pricedAt, "2026-09-20");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trace-cost-"));
  const base = { call: 1, startedAt: "2026-09-20T10:00:00.000Z", durMs: 1000, exitCode: 0, timedOut: false, status: "ok", calls: 1, toolErrors: 0, turns: 1, tools: { Bash: 1 }, spans: [] };
  appendTrace(dir, { ...base, phase: "scout", name: "scout", tokens: { input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0, total: 1_000_000 }, cost: null }, { model: "gpt-5-codex", pricing });
  let tl = timelineFromTrace(JSON.parse(fs.readFileSync(path.join(dir, "trace.json"), "utf8")));
  assert.equal(tl.phases[0].costUsd, 1.25);
  assert.equal(tl.costBasis, "estimated");
  assert.equal(tl.pricedAt, "2026-09-20");
  appendTrace(dir, { ...base, phase: "plan", name: "plan", startedAt: "2026-09-20T10:01:00.000Z", tokens: { input: 5, output: 5, cacheRead: 0, cacheWrite: 0, total: 10 }, cost: 0.42 }, { model: "gpt-5-codex", pricing });
  tl = timelineFromTrace(JSON.parse(fs.readFileSync(path.join(dir, "trace.json"), "utf8")));
  assert.equal(tl.phases[1].costUsd, 0.42);
  assert.equal(tl.costBasis, "estimated"); // mixed: one phase estimated
  fs.rmSync(dir, { recursive: true, force: true });
});
