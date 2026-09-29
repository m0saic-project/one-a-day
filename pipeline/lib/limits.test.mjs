import test from "node:test";
import assert from "node:assert/strict";
import { createLimitWatcher, decideAfter, decideBefore, describeWindows, fmtWait, limitsConfig, snapshotOf } from "./limits.mjs";

// The shapes Claude Code streamed on 2026-09-29, the day the limit cut the build.
const ALLOWED = { type: "rate_limit_event", rate_limit_info: { status: "allowed_warning", resetsAt: 1790702400, rateLimitType: "five_hour", unifiedWindows: { five_hour: { utilization: 0.87, resetsAt: 1790702400 }, seven_day: { utilization: 0.05, resetsAt: 1791273600 } } } };
const REJECTED = { type: "rate_limit_event", rate_limit_info: { status: "rejected", resetsAt: 1790702400, rateLimitType: "five_hour", unifiedWindows: { five_hour: { utilization: 1.01, resetsAt: 1790702400 }, seven_day: { utilization: 0.06, resetsAt: 1791273600 } } } };
const SYNTHETIC = { type: "assistant", error: "rate_limit", message: { model: "<synthetic>", content: [{ type: "text", text: "You've hit your session limit · resets 1:20pm (America/New_York)" }] } };
const RESULT_429 = { type: "result", subtype: "success", is_error: true, api_error_status: 429, result: "You've hit your session limit · resets 1:20pm (America/New_York)", total_cost_usd: 6.44 };
const RESULT_OK = { type: "result", subtype: "success", is_error: false, api_error_status: null, result: "done", total_cost_usd: 1 };
const feed = (...events) => { const w = createLimitWatcher(); for (const e of events) w.onLine(typeof e === "string" ? e : JSON.stringify(e)); return w.finish(); };

test("a rejected call is a hit on the five-hour window, with its reset time and the CLI's words", () => {
  const l = feed(ALLOWED, "not json", "", REJECTED, SYNTHETIC, RESULT_429);
  assert.equal(l.seen, true);
  assert.equal(l.hit, true);
  assert.equal(l.window, "five_hour");
  assert.equal(l.resetsAt, "2026-09-29T17:20:00.000Z");
  assert.equal(l.status, "rejected");
  assert.equal(l.windows.five_hour.utilization, 1.01);
  assert.equal(l.windows.seven_day.resetsAt, "2026-10-06T08:00:00.000Z");
  assert.match(l.message, /session limit/);
});

test("an allowed call is seen and not hit; a call that said nothing is not seen", () => {
  const l = feed(ALLOWED, RESULT_OK);
  assert.equal(l.seen, true);
  assert.equal(l.hit, false);
  assert.equal(l.window, null);
  assert.equal(l.resetsAt, null);
  assert.equal(l.status, "allowed_warning");
  assert.equal(l.windows.five_hour.utilization, 0.87);
  assert.deepEqual(feed(RESULT_OK), { seen: false, hit: false, window: null, resetsAt: null, status: null, windows: {}, message: null });
});

test("a 429 with no rate_limit_event is still a hit, with no reset time", () => {
  const l = feed(RESULT_429);
  assert.equal(l.hit, true);
  assert.equal(l.seen, false);
  assert.equal(l.resetsAt, null);
});

test("a seven-day rejection names its window", () => {
  const l = snapshotOf({ ...REJECTED.rate_limit_info, rateLimitType: "seven_day" }, true);
  assert.equal(l.window, "seven_day");
  assert.equal(l.resetsAt, "2026-10-06T08:00:00.000Z");
});

const cfg = limitsConfig({ limits: { graceSec: 60 } });
const NOW = Date.parse("2026-09-29T13:50:47.000Z");
const hit = (window, resetsAt) => ({ hit: true, window, resetsAt, windows: { [window]: { utilization: 1.01, resetsAt } } });

test("after a five-hour rejection: wait until the reset plus the grace, once or twice, never longer than the cap", () => {
  const d = decideAfter(hit("five_hour", "2026-09-29T17:20:00.000Z"), { now: NOW, waits: 0, cfg });
  assert.equal(d.action, "wait");
  assert.equal(d.untilMs, Date.parse("2026-09-29T17:21:00.000Z"));
  assert.equal(d.ms, Date.parse("2026-09-29T17:21:00.000Z") - NOW);
  assert.match(d.reason, /^session limit \(five_hour at 101%\) resets /);
  assert.equal(decideAfter(hit("five_hour", "2026-09-29T17:20:00.000Z"), { now: NOW, waits: 1, cfg }).action, "wait");
  const third = decideAfter(hit("five_hour", "2026-09-29T17:20:00.000Z"), { now: NOW, waits: 2, cfg });
  assert.equal(third.action, "stop");
  assert.match(third.reason, /hit again after 2 wait\(s\)/);
  const far = decideAfter(hit("five_hour", "2026-09-29T19:00:00.000Z"), { now: NOW, waits: 0, cfg });
  assert.equal(far.action, "stop");
  assert.match(far.reason, /more than limits.waitMaxMin/);
});

test("a reset that has already passed is a short wait, not a stop", () => {
  const d = decideAfter(hit("five_hour", "2026-09-29T13:50:00.000Z"), { now: NOW, waits: 0, cfg });
  assert.equal(d.action, "wait");
  assert.equal(d.ms, 13_000);
});

test("after a seven-day rejection, or one with no reset time: stop, and say why", () => {
  const week = decideAfter(hit("seven_day", "2026-10-02T10:00:00.000Z"), { now: NOW, waits: 0, cfg });
  assert.equal(week.action, "stop");
  assert.match(week.reason, /seven_day.*resets .* on 2026-10-02/);
  const blind = decideAfter({ hit: true, window: "five_hour", resetsAt: null, windows: {} }, { now: NOW, cfg });
  assert.equal(blind.action, "stop");
  assert.match(blind.reason, /no reset time/);
  assert.equal(decideAfter({ hit: false }, { now: NOW, cfg }).action, "go");
  assert.equal(decideAfter(undefined, { now: NOW, cfg }).action, "go");
});

test("before a call: a nearly spent five-hour window is waited out; a rolled one, a healthy one, or an unknown one is not", () => {
  const spent = decideBefore({ five_hour: { utilization: 0.93, resetsAt: "2026-09-29T17:20:00.000Z" } }, { now: NOW, cfg });
  assert.equal(spent.action, "wait");
  assert.match(spent.reason, /^session window nearly spent \(five_hour at 93%\)/);
  assert.equal(decideBefore({ five_hour: { utilization: 1.01, resetsAt: "2026-09-29T12:00:00.000Z" } }, { now: NOW, cfg }).action, "go");
  assert.equal(decideBefore({ five_hour: { utilization: 0.5, resetsAt: "2026-09-29T17:20:00.000Z" } }, { now: NOW, cfg }).action, "go");
  assert.equal(decideBefore({ seven_day: { utilization: 0.99, resetsAt: "2026-10-02T10:00:00.000Z" } }, { now: NOW, cfg }).action, "go");
  assert.equal(decideBefore(undefined, { now: NOW, cfg }).action, "go");
  // Out of waits: let the call try; only a rejection ends a day.
  assert.equal(decideBefore({ five_hour: { utilization: 0.93, resetsAt: "2026-09-29T17:20:00.000Z" } }, { now: NOW, waits: 2, cfg }).action, "go");
});

test("config fills in what it leaves out", () => {
  assert.equal(limitsConfig({}).waitAt, 0.9);
  assert.equal(limitsConfig({ limits: { waitAt: 0.8 } }).waitAt, 0.8);
  assert.equal(limitsConfig({ limits: { waitAt: 0.8 } }).waitMaxMin, 300);
});

test("the words on the log", () => {
  assert.equal(fmtWait(45_000), "45s");
  assert.equal(fmtWait(12 * 60_000), "12m");
  assert.equal(fmtWait((3 * 60 + 29) * 60_000 + 30_000), "3h30m");
  const text = describeWindows({ five_hour: { utilization: 0.73, resetsAt: "2026-09-29T17:20:00.000Z" }, seven_day: { utilization: 0.04, resetsAt: "2026-10-06T08:00:00.000Z" } }, NOW);
  assert.match(text, /^five_hour 73% \(resets \d\d:\d\d\) · seven_day 4%$/);
  assert.equal(describeWindows({}), "no window reported");
});
