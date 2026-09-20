// Kimi CLI adapter — NOT WIRED YET. The contract is in README.md; fill in the
// two functions below on the machine that has the CLI installed. Until then
// the runner refuses `--agent kimi` with the message from available().
import path from "node:path";
import { runProcess } from "../lib/spawn.mjs";

export async function available() {
  const r = await runProcess({ cmd: "kimi", args: ["--version"], timeoutMs: 20_000 });
  if (r.exitCode !== 0) return "kimi CLI not found on PATH";
  return "kimi adapter is a stub — edit pipeline/agents/kimi.mjs: pass the prompt non-interactively, cap with timeoutMs, tee output to logDir";
}

export async function run({ prompt, cwd, logDir, label, timeoutMs, model, env = {} }) {
  // Sketch (verify flags against the installed CLI):
  //   kimi --print [--model <m>] < prompt   (or whatever the headless flag is)
  const log = path.join(logDir, `${label}.log`);
  const args = model ? ["--model", model] : [];
  const res = await runProcess({ cmd: "kimi", args, cwd, env, input: prompt, timeoutMs, logFile: log });
  return { exitCode: res.exitCode, timedOut: res.timedOut, ms: res.ms, transcript: null, log };
}
