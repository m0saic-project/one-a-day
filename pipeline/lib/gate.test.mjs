import test from "node:test";
import assert from "node:assert/strict";
import { commitMessage, encodeTemplateKey, templateIdForDir } from "./gate.mjs";
import { formatEvent } from "./stream-log.mjs";

test("template id from a new folder; asset key encoding", () => {
  assert.equal(templateIdForDir("@one-a-day", "src/dev/release-banner/v1/"), "@one-a-day/dev/release-banner/v1");
  assert.equal(templateIdForDir("@one-a-day", "src/dev/x.ts"), null);
  assert.equal(encodeTemplateKey("@one-a-day/dev/release-banner/v1"), "@one-a-day__dev__release-banner__v1");
});

test("commit messages carry the day, the id, and the Agent/Model trailers", () => {
  const m = commitMessage({ day: 7, templateId: "@one-a-day/dev/x/v1", title: "07 · X", agent: "codex", model: "gpt-5-codex" });
  assert.match(m, /^day 007: @one-a-day\/dev\/x\/v1 — 07 · X\n/);
  assert.match(m, /\nAgent: codex\nModel: gpt-5-codex \(self-declared\)\n$/);
  const n = commitMessage({ day: 8, agent: "claude", model: null, reason: "critique rejected every variant" });
  assert.match(n, /^day 008: no template — critique rejected every variant/);
  assert.match(n, /Model: undeclared/);
});

test("stream-log formats Claude and Codex events and drops noise", () => {
  assert.match(formatEvent(JSON.stringify({ type: "system", subtype: "init", model: "m" }), "x"), /session start \(model=m\)/);
  assert.match(formatEvent(JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Bash", input: { command: "npm run build" } }] } })), /Bash: npm run build/);
  assert.equal(formatEvent(JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", is_error: false }] } })), null);
  assert.match(formatEvent(JSON.stringify({ type: "result", total_cost_usd: 1.234, num_turns: 9 })), /END ok\s+cost=\$1\.23\s+turns=9/);
  assert.match(formatEvent(JSON.stringify({ type: "item.completed", item: { type: "command_execution", command: "ls", exit_code: 0 } })), /shell: ls → 0/);
  assert.equal(formatEvent(JSON.stringify({ type: "item.completed", item: { type: "reasoning" } })), null);
  assert.match(formatEvent("not json"), /not json/);
});
