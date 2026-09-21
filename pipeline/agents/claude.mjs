// Claude Code adapter — `claude -p` with a stream-json transcript.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "../lib/spawn.mjs";
import { formatEvent } from "../lib/stream-log.mjs";
import { createTraceRecorder } from "../lib/trace.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS = path.join(HERE, "claude.settings.json");

/**
 * Ultracode is a SESSION SETTING, not a CLI flag (there is no --ultracode).
 * It rides in the same --settings we already pass, and it needs xhigh effort:
 * an explicit `--effort high` alongside it turns it back off *silently*, which
 * is why the effort is forced here rather than trusted from config. The
 * effective settings are written into the day's logs so the journal records
 * exactly what the agent ran under.
 */
function effectiveSettings(logDir, ultracode) {
  if (!ultracode) return SETTINGS;
  const merged = { ...JSON.parse(fs.readFileSync(SETTINGS, "utf8")), ultracode: true };
  const file = path.join(logDir, "claude.settings.effective.json");
  fs.writeFileSync(file, JSON.stringify(merged, null, 2) + "\n", "utf8");
  return file;
}

export async function available() {
  const r = await runProcess({ cmd: "claude", args: ["--version"], timeoutMs: 20_000 });
  return r.exitCode === 0 ? true : `claude CLI not runnable (${r.stderr.trim() || r.exitCode})`;
}

export async function run({ prompt, cwd, logDir, label, timeoutMs, model, config = {}, env = {} }) {
  const transcript = path.join(logDir, `${label}.jsonl`);
  const log = path.join(logDir, `${label}.log`);
  const raw = fs.createWriteStream(transcript, { flags: "a" });
  // The trace: tool calls, tokens and timing from the stream itself (never self-reported).
  const m = /^(.*?)-(\d+)$/.exec(label);
  const trace = createTraceRecorder({ phase: m ? m[1] : label, call: m ? Number(m[2]) : 1 });
  const ultracode = config.ultracode === true;
  const args = [
    "-p",
    "--permission-mode", config.permissionMode ?? "bypassPermissions",
    "--permission-prompts", "none",
    "--settings", effectiveSettings(logDir, ultracode),
    "--output-format", "stream-json", "--verbose",
    "--no-session-persistence",
  ];
  if (model) args.push("--model", model);
  const effort = ultracode ? "xhigh" : config.effort;
  if (effort) args.push("--effort", effort);
  if (config.budgetUsd) args.push("--max-budget-usd", String(config.budgetUsd));
  const res = await runProcess({
    cmd: "claude", args, cwd, env, input: prompt, timeoutMs, logFile: log,
    onLine: (line, stream) => {
      if (stream === "stdout") { raw.write(line + "\n"); trace.onLine(line); const f = formatEvent(line, label); if (f) fs.appendFileSync(log, f + "\n"); }
    },
  });
  raw.end();
  return { exitCode: res.exitCode, timedOut: res.timedOut, ms: res.ms, transcript, log, trace: trace.finish({ exitCode: res.exitCode, timedOut: res.timedOut }) };
}
