// Claude Code adapter — `claude -p` with a stream-json transcript.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "../lib/spawn.mjs";
import { formatEvent } from "../lib/stream-log.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export async function available() {
  const r = await runProcess({ cmd: "claude", args: ["--version"], timeoutMs: 20_000 });
  return r.exitCode === 0 ? true : `claude CLI not runnable (${r.stderr.trim() || r.exitCode})`;
}

export async function run({ prompt, cwd, logDir, label, timeoutMs, model, config = {}, env = {} }) {
  const transcript = path.join(logDir, `${label}.jsonl`);
  const log = path.join(logDir, `${label}.log`);
  const raw = fs.createWriteStream(transcript, { flags: "a" });
  const args = [
    "-p",
    "--permission-mode", config.permissionMode ?? "bypassPermissions",
    "--permission-prompts", "none",
    "--settings", path.join(HERE, "claude.settings.json"),
    "--output-format", "stream-json", "--verbose",
    "--no-session-persistence",
  ];
  if (model) args.push("--model", model);
  if (config.effort) args.push("--effort", config.effort);
  if (config.budgetUsd) args.push("--max-budget-usd", String(config.budgetUsd));
  const res = await runProcess({
    cmd: "claude", args, cwd, env, input: prompt, timeoutMs, logFile: log,
    onLine: (line, stream) => {
      if (stream === "stdout") { raw.write(line + "\n"); const f = formatEvent(line, label); if (f) fs.appendFileSync(log, f + "\n"); }
    },
  });
  raw.end();
  return { exitCode: res.exitCode, timedOut: res.timedOut, ms: res.ms, transcript, log };
}
