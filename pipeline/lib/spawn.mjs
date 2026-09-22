// runProcess — spawn a child with a wall-clock cap, tee its output to a log,
// and never throw. Cross-platform: on Windows, npm/m0saic/claude are .cmd
// shims, so those go through a shell with quoted arguments.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const IS_WIN = process.platform === "win32";
const CAPTURE_CAP = 16 * 1024 * 1024; // bytes of stdout/stderr kept in memory

function quoteWin(arg) {
  return /[\s"@()^&|<>]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

/**
 * @param {object} o
 * @param {string} o.cmd
 * @param {string[]} [o.args]
 * @param {string} [o.cwd]
 * @param {Record<string,string>} [o.env]   merged over process.env
 * @param {string} [o.input]                written to stdin, then stdin closed
 * @param {number} [o.timeoutMs]            SIGTERM at the cap, SIGKILL 5s later
 * @param {string} [o.logFile]              appended with both streams, prefixed
 * @param {(line: string, stream: "stdout"|"stderr") => void} [o.onLine]
 * @returns {Promise<{exitCode: number|null, signal: string|null, timedOut: boolean, stdout: string, stderr: string, ms: number}>}
 */
export function runProcess({ cmd, args = [], cwd, env, input, timeoutMs, logFile, onLine }) {
  return new Promise((resolve) => {
    const started = Date.now();
    const useShell = IS_WIN;
    // Children (agents, the gate's own m0saic calls) always see the machine's
    // real m0saic root: a redirected M0SAIC_ROOT has no license or toolchain
    // and stalls video renders (day 003). The agent can still set it inside
    // its own shell; pipeline/render/render-variant.mjs drops it again there.
    const childEnv = { ...process.env, ...env };
    delete childEnv.M0SAIC_ROOT;
    const child = useShell
      ? spawn([cmd, ...args.map(quoteWin)].join(" "), { cwd, env: childEnv, shell: true, stdio: ["pipe", "pipe", "pipe"], windowsHide: true })
      : spawn(cmd, args, { cwd, env: childEnv, stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let killTimer = null;
    let hardTimer = null;
    const log = logFile ? fs.createWriteStream(logFile, { flags: "a" }) : null;
    if (log) log.write(`\n===== ${new Date().toISOString()} $ ${cmd} ${args.join(" ")}\n`);

    const lineBuffers = { stdout: "", stderr: "" };
    const feed = (stream, chunk) => {
      const text = chunk.toString("utf8");
      if (stream === "stdout") { if (stdout.length < CAPTURE_CAP) stdout += text; } else { if (stderr.length < CAPTURE_CAP) stderr += text; }
      if (log) log.write(text);
      if (onLine) {
        lineBuffers[stream] += text;
        let i;
        while ((i = lineBuffers[stream].indexOf("\n")) >= 0) {
          const line = lineBuffers[stream].slice(0, i);
          lineBuffers[stream] = lineBuffers[stream].slice(i + 1);
          try { onLine(line, stream); } catch { /* a log formatter must never kill the run */ }
        }
      }
    };
    child.stdout.on("data", (c) => feed("stdout", c));
    child.stderr.on("data", (c) => feed("stderr", c));
    child.on("error", (err) => {
      if (log) log.write(`\n[spawn error] ${err.message}\n`);
      stderr += `\n[spawn error] ${err.message}\n`;
    });

    if (timeoutMs && timeoutMs > 0) {
      killTimer = setTimeout(() => {
        timedOut = true;
        if (log) log.write(`\n[timeout] ${timeoutMs}ms — SIGTERM\n`);
        try { child.kill("SIGTERM"); } catch { /* already gone */ }
        hardTimer = setTimeout(() => { try { child.kill("SIGKILL"); } catch { /* gone */ } }, 5000);
      }, timeoutMs);
    }

    child.on("close", (code, signal) => {
      if (killTimer) clearTimeout(killTimer);
      if (hardTimer) clearTimeout(hardTimer);
      for (const s of ["stdout", "stderr"]) if (onLine && lineBuffers[s]) { try { onLine(lineBuffers[s], s); } catch { /* ignore */ } }
      const ms = Date.now() - started;
      // Resolve only once the log file is flushed and closed. Ending the
      // stream is asynchronous, so returning early let a late write land
      // AFTER the gate had staged and committed that log — which leaves the
      // tree dirty and aborts the next morning's preflight on a clean-tree
      // check. Intermittent by nature; the e2e caught it.
      const done = () => resolve({ exitCode: code, signal, timedOut, stdout, stderr, ms });
      if (log) { log.write(`\n===== exit ${code ?? signal} after ${ms}ms${timedOut ? " (TIMED OUT)" : ""}\n`); log.end(done); }
      else done();
    });

    if (input !== undefined) child.stdin.write(input);
    child.stdin.end();
  });
}

/** `npm` / `npx` / `m0saic` resolve through PATH; on Windows the shell finds the .cmd shim. */
export function npmCmd() { return "npm"; }

export function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); return p; }
export function logPath(logDir, label) { ensureDir(logDir); return path.join(logDir, `${label}.log`); }
