// OpenCode adapter — `opencode run --format json` with the prompt on stdin.
//
// One CLI, many providers: the model is `provider/model` (the roster rides
// OpenCode Go, `opencode-go/<model>`; `opencode models` lists what this
// machine can reach). The runner's deny list lives in opencode.json next to
// this file and reaches the child through OPENCODE_CONFIG; `--auto` approves
// everything that list does not forbid, which is what an unattended day needs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "../lib/spawn.mjs";
import { formatEvent } from "../lib/stream-log.mjs";
import { createTraceRecorder } from "../lib/trace.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = path.join(HERE, "opencode.json");
const AUTH = path.join(os.homedir(), ".local", "share", "opencode", "auth.json");

/** Provider ids with a stored credential (`opencode auth login`). The free `opencode/*` models need none. */
export function credentialedProviders(file = AUTH) {
  try {
    const o = JSON.parse(fs.readFileSync(file, "utf8"));
    return o && typeof o === "object" ? Object.keys(o) : [];
  } catch { return []; }
}

/** "Installed and logged in", the roster's rule: the binary runs and at least one provider has a credential. */
export async function available() {
  const r = await runProcess({ cmd: "opencode", args: ["--version"], timeoutMs: 20_000 });
  if (r.exitCode !== 0) return `opencode CLI not runnable (${r.stderr.trim() || r.exitCode})`;
  if (!credentialedProviders().length) return "opencode has no provider credentials - run `opencode auth login` (OpenCode Go) on this machine";
  return true;
}

const LIMIT_RE = /rate.?limit|usage limit|limit (?:reached|exceeded|hit)|quota|too many requests|\b429\b|insufficient (?:balance|credits)/i;

/**
 * OpenCode Go's limits are per model, as monthly dollars with a five-hour and
 * a weekly slice, and the stream does not say when they reset. A rejection is
 * reported as a hit with no reset time, which `lib/limits.mjs` turns into
 * "stop, keep the tree": the next day draws another slot anyway.
 */
export function createGoLimitWatcher() {
  let hit = false;
  let message = null;
  return {
    onLine(raw) {
      let o;
      try { o = JSON.parse(String(raw ?? "").trim()); } catch { return; }
      if (o?.type !== "error" || !o.error) return;
      const text = typeof o.error === "string" ? o.error : JSON.stringify(o.error);
      if (LIMIT_RE.test(text)) { hit = true; if (!message) message = String(o.error?.data?.message ?? o.error?.message ?? text).slice(0, 300); }
    },
    finish() {
      return hit
        ? { seen: true, hit: true, window: "five_hour", resetsAt: null, status: "rejected", windows: {}, message }
        : { seen: false, hit: false, window: null, resetsAt: null, status: null, windows: {}, message: null };
    },
  };
}

export async function run({ prompt, cwd, logDir, label, timeoutMs, model, config = {}, env = {} }) {
  const transcript = path.join(logDir, `${label}.jsonl`);
  const log = path.join(logDir, `${label}.log`);
  const m = /^(.*?)-(\d+)$/.exec(label);
  const trace = createTraceRecorder({ phase: m ? m[1] : label, call: m ? Number(m[2]) : 1 });
  const limit = createGoLimitWatcher();

  // A slot on a provider this machine has no key for is a configuration
  // mistake, not a model failure: say so in the log and spend nothing.
  const provider = String(model ?? "").includes("/") ? String(model).split("/")[0] : null;
  if (provider && provider !== "opencode" && !credentialedProviders().includes(provider)) {
    const why = `[${label}] no credential for provider "${provider}" - run: opencode auth login`;
    fs.appendFileSync(log, why + "\n");
    return { exitCode: 1, timedOut: false, ms: 0, transcript: null, log, trace: trace.finish({ exitCode: 1 }), limit: limit.finish() };
  }

  const raw = fs.createWriteStream(transcript, { flags: "a" });
  const args = ["run", "--format", "json", "--title", label];
  if (config.auto !== false) args.push("--auto");
  if (config.pure !== false) args.push("--pure");
  if (model) args.push("--model", model);
  if (config.variant) args.push("--variant", String(config.variant));
  if (config.agent) args.push("--agent", String(config.agent));
  const res = await runProcess({
    cmd: "opencode", args, cwd, env: { ...env, OPENCODE_CONFIG: CONFIG }, input: prompt, timeoutMs, logFile: log,
    onLine: (line, stream) => {
      if (stream === "stdout") { raw.write(line + "\n"); trace.onLine(line); limit.onLine(line); const f = formatEvent(line, label); if (f) fs.appendFileSync(log, f + "\n"); }
    },
  });
  raw.end();
  return { exitCode: res.exitCode, timedOut: res.timedOut, ms: res.ms, transcript, log, trace: trace.finish({ exitCode: res.exitCode, timedOut: res.timedOut }), limit: limit.finish() };
}
