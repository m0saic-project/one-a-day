// limits — the account's session limit: how the agent CLI reports it, and
// what the runner does about one.
//
// Claude Code streams a `rate_limit_event` around every turn:
//
//   { type: "rate_limit_event", rate_limit_info: {
//       status: "allowed" | "allowed_warning" | "rejected",
//       rateLimitType: "five_hour", resetsAt: 1790702400,            // epoch seconds
//       unifiedWindows: { five_hour: { utilization: 0.73, resetsAt: 1790702400 },
//                         seven_day: { utilization: 0.04, resetsAt: 1791273600 } } } }
//
// and once the account is over, the call ends with a synthetic assistant
// message ("You've hit your session limit · resets 1:20pm") and a `result`
// whose api_error_status is 429. Day 010 (2026-09-29) met that 25 minutes
// into its build: the runner re-called the phase twice in five seconds,
// both rejected, and closed the day as a no-ship with the agent's work
// reverted. Nothing was wrong with the agent or the template.
//
// A five-hour window comes back on its own, never more than five hours out,
// so a call it rejects is waited out and made again, and the call that was
// cut does not count. A seven-day window comes back in no time a day can
// wait for, so it ends the day - with the tree kept in the journal.

export const WINDOWS = ["five_hour", "seven_day"];

/** `limits` in pipeline/config.json; these fill in whatever it leaves out. */
export const DEFAULTS = {
  /** Before a call: a five-hour window at or past this is waited out first. */
  waitAt: 0.9,
  /** Never wait longer than this (minutes). A five-hour window always fits; a seven-day one never does. */
  waitMaxMin: 300,
  /** Waits per day. A second rejection after a wait is not a window rolling, it is a day that does not fit. */
  waitsPerDay: 2,
  /** Added to every wait: the CLI's clock is not this machine's. */
  graceSec: 90,
  /** Preflight refuses the day when the seven-day window is past this. */
  sevenDayStopAt: 0.95,
};

export function limitsConfig(config) { return { ...DEFAULTS, ...(config?.limits ?? {}) }; }

const isoOf = (epochSeconds) => {
  const n = Number(epochSeconds);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null;
};

/**
 * One call's limit state from its own event stream. Feed it every stdout
 * line; `finish()` returns
 *   { seen, hit, window, resetsAt, status, windows: { five_hour?: { utilization, resetsAt }, seven_day?: … }, message }
 * `seen` is false when the CLI said nothing about limits (Codex, the fake).
 */
export function createLimitWatcher() {
  let info = null;
  let hit = false;
  let message = null;
  return {
    onLine(raw) {
      const line = String(raw ?? "").trim();
      if (!line) return;
      let o;
      try { o = JSON.parse(line); } catch { return; }
      if (o.type === "rate_limit_event" && o.rate_limit_info && typeof o.rate_limit_info === "object") {
        info = o.rate_limit_info;
        if (info.status === "rejected") hit = true;
        return;
      }
      if (o.type === "assistant" && o.error === "rate_limit") {
        hit = true;
        const text = (o.message?.content ?? []).filter((b) => b?.type === "text").map((b) => b.text).join(" ").trim();
        if (text && !message) message = text;
        return;
      }
      if (o.type === "result") {
        if (Number(o.api_error_status) === 429) hit = true;
        const text = String(o.result ?? "");
        if (o.is_error && /session limit|rate limit|usage limit/i.test(text)) { hit = true; if (!message) message = text; }
      }
    },
    finish() { return snapshotOf(info, hit, message); },
  };
}

/** The shape above, from one rate_limit_info (or none). */
export function snapshotOf(info, hit = false, message = null) {
  const windows = {};
  for (const w of WINDOWS) {
    const u = info?.unifiedWindows?.[w];
    if (u && Number.isFinite(Number(u.utilization))) windows[w] = { utilization: Number(u.utilization), resetsAt: isoOf(u.resetsAt) };
  }
  const window = hit ? (WINDOWS.includes(info?.rateLimitType) ? info.rateLimitType : "five_hour") : null;
  const resetsAt = hit ? (windows[window]?.resetsAt ?? isoOf(info?.resetsAt)) : null;
  return { seen: !!info, hit, window, resetsAt, status: info?.status ?? null, windows, message };
}

/**
 * Wait for a window, or not. Shared by the two decisions below.
 * @returns {{action:"wait", window, resetsAt, untilMs, ms, reason} | {action:"stop", window, resetsAt, reason} | {action:"go"}}
 */
function decideWait({ window, resetsAt, utilization, now, waits, cfg, why }) {
  const reset = Date.parse(resetsAt ?? "");
  const used = Number.isFinite(utilization) ? ` at ${pct(utilization)}` : "";
  const head = `${why} (${window}${used})`;
  if (!Number.isFinite(reset)) return { action: "stop", window, resetsAt: null, reason: `${head} with no reset time reported` };
  const untilMs = reset + cfg.graceSec * 1000;
  const ms = Math.max(0, untilMs - now);
  if (ms > cfg.waitMaxMin * 60_000) return { action: "stop", window, resetsAt, reason: `${head} resets ${fmtWhen(resetsAt, now)}, ${fmtWait(ms)} away - more than limits.waitMaxMin (${cfg.waitMaxMin} min)` };
  if (waits >= cfg.waitsPerDay) return { action: "stop", window, resetsAt, reason: `${head} hit again after ${waits} wait(s) today (limits.waitsPerDay)` };
  return { action: "wait", window, resetsAt, untilMs, ms, reason: `${head} resets ${fmtWhen(resetsAt, now)}` };
}

/** After a call the limit rejected. */
export function decideAfter(limit, { now = Date.now(), waits = 0, cfg = DEFAULTS } = {}) {
  if (!limit?.hit) return { action: "go" };
  const window = limit.window ?? "five_hour";
  return decideWait({ window, resetsAt: limit.resetsAt, utilization: limit.windows?.[window]?.utilization, now, waits, cfg, why: "session limit" });
}

/**
 * Before a call: an account with almost no five-hour window left is not
 * worth a call that will be cut in the middle. A window whose reset is
 * already behind us has rolled, whatever its last reading said. Never
 * stops a day on a prediction - only a rejection does that.
 */
export function decideBefore(windows, { now = Date.now(), waits = 0, cfg = DEFAULTS } = {}) {
  const f = windows?.five_hour;
  if (!f || !(f.utilization >= cfg.waitAt)) return { action: "go" };
  const reset = Date.parse(f.resetsAt ?? "");
  if (!Number.isFinite(reset) || reset <= now) return { action: "go" };
  const d = decideWait({ window: "five_hour", resetsAt: f.resetsAt, utilization: f.utilization, now, waits, cfg, why: "session window nearly spent" });
  return d.action === "wait" ? d : { action: "go" };
}

export const pct = (u) => `${Math.round(Number(u) * 100)}%`;

/** "3h29m", "12m", "45s". */
export function fmtWait(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}m`;
}

/** Machine-local "13:20", with the date when it is not today's. */
export function fmtWhen(iso, now = Date.now()) {
  const t = Date.parse(iso ?? "");
  if (!Number.isFinite(t)) return "?";
  const d = new Date(t);
  const hm = d.toTimeString().slice(0, 5);
  const day = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return day(d) === day(new Date(now)) ? hm : `${hm} on ${day(d)}`;
}

/** "five_hour 73% (resets 13:20) · seven_day 4%" for the log. */
export function describeWindows(windows, now = Date.now()) {
  const parts = [];
  for (const w of WINDOWS) {
    const u = windows?.[w];
    if (!u) continue;
    const reset = Date.parse(u.resetsAt ?? "");
    const soon = Number.isFinite(reset) && reset > now && u.utilization >= 0.5;
    parts.push(`${w} ${pct(u.utilization)}${soon ? ` (resets ${fmtWhen(u.resetsAt, now)})` : ""}`);
  }
  return parts.join(" · ") || "no window reported";
}
