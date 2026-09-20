// OpenAI Codex adapter — `codex exec` with JSONL events.
import fs from "node:fs";
import path from "node:path";
import { runProcess } from "../lib/spawn.mjs";
import { formatEvent } from "../lib/stream-log.mjs";
import { createTraceRecorder } from "../lib/trace.mjs";

export async function available() {
  const r = await runProcess({ cmd: "codex", args: ["--version"], timeoutMs: 20_000 });
  return r.exitCode === 0 ? true : `codex CLI not runnable (${r.stderr.trim() || r.exitCode})`;
}

export async function run({ prompt, cwd, logDir, label, timeoutMs, model, config = {}, env = {} }) {
  const transcript = path.join(logDir, `${label}.jsonl`);
  const log = path.join(logDir, `${label}.log`);
  const raw = fs.createWriteStream(transcript, { flags: "a" });
  const m = /^(.*?)-(\d+)$/.exec(label);
  const trace = createTraceRecorder({ phase: m ? m[1] : label, call: m ? Number(m[2]) : 1 });
  const args = [
    "exec",
    "-s", config.sandbox ?? "workspace-write",
    "--skip-git-repo-check",
    "--json",
    "-o", path.join(logDir, `${label}.last.md`),
    // The scout phase needs the network. Codex's sandbox key for this has
    // moved between versions — check `codex exec --help` / config docs on the
    // laptop and adjust `networkConfig` in pipeline/config.json if it errors.
    ...(config.networkConfig ? ["-c", config.networkConfig] : ["-c", "sandbox_workspace_write.network_access=true"]),
    "-",
  ];
  if (model) args.splice(1, 0, "-m", model);
  const res = await runProcess({
    cmd: "codex", args, cwd, env, input: prompt, timeoutMs, logFile: log,
    onLine: (line, stream) => {
      if (stream === "stdout") { raw.write(line + "\n"); trace.onLine(line); const f = formatEvent(line, label); if (f) fs.appendFileSync(log, f + "\n"); }
    },
  });
  raw.end();
  return { exitCode: res.exitCode, timedOut: res.timedOut, ms: res.ms, transcript, log, trace: trace.finish({ exitCode: res.exitCode, timedOut: res.timedOut }) };
}
