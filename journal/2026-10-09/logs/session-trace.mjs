// session-trace - what the interactive session that took over day 020 cost,
// measured from its own transcript, appended to the runner's trace.json as
// the phases the runner never finished (build call 2, critique, ship), and
// written up as 60-token-costs.md (the founder asked for tokens AND dollars).
//
//   node journal/2026-10-09/logs/session-trace.mjs [--until <iso>] [--dry]
//
// Why both a trace and a transcript: the scheduled run (Opus 5.5, the
// claude-opus-ultracode slot) left a real trace.json - scout, plan, and a
// build call that died on a network error - so tools/check-why.mjs holds
// WHY.timeline to it (source "runner", every phase named in the trace).
// The session's phases therefore go INTO the trace, through the pipeline's
// own appendTrace, each marked with where its numbers came from. Claude Code
// keeps every API response in ~/.claude/projects/<project>/<session>.jsonl
// with its `usage`. Two traps, both handled (day 007's audit found them):
//   1. One API response is written as SEVERAL lines (one per content block),
//      each repeating the same usage: keep one record per `message.id`.
//   2. Cache writes come in two prices (5-minute 1.25x, 1-hour 2x input).
// --dry prints the numbers and writes nothing (the closing total after the push).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendTrace, readTrace, timelineFromTrace } from "../../../pipeline/lib/trace.mjs";

const LOGS = path.dirname(fileURLToPath(import.meta.url));
const DAY_DIR = path.dirname(LOGS);
const REPO = path.resolve(DAY_DIR, "..", "..");
const DATE = "2026-10-09";
const SESSION = "debf1069-a698-4c04-a8c6-6e36e0634dd6";
const PROJECT = path.join(os.homedir(), ".claude", "projects", "C--src-m0saic-production");
const MODEL = "claude-fable-5-1";
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const UNTIL = opt("--until") ? Date.parse(opt("--until")) : Infinity;
const DRY = argv.includes("--dry");

// List prices: pipeline/config.json `pricing` (USD per million tokens, by
// model-name substring, first match wins - the rule lib/trace.mjs estimateCost
// uses). Its cacheWrite is the 1-hour write; a 5-minute write is 1.25x input.
const CONFIG = JSON.parse(fs.readFileSync(path.join(REPO, "pipeline", "config.json"), "utf8"));
const TABLE = CONFIG.pricing.perMillion;
const rateOf = (model) => {
  const key = Object.keys(TABLE).find((k) => String(model).toLowerCase().includes(k.toLowerCase()));
  if (!key) throw new Error(`no list price for ${model} in pipeline/config.json pricing`);
  return { key, ...TABLE[key], pricedAt: TABLE[key].pricedAt ?? CONFIG.pricing.pricedAt };
};

const files = [path.join(PROJECT, `${SESSION}.jsonl`)];
const subDir = path.join(PROJECT, SESSION, "subagents");
if (fs.existsSync(subDir)) for (const f of fs.readdirSync(subDir)) if (f.endsWith(".jsonl")) files.push(path.join(subDir, f));

// one record per API response
const messages = new Map();
const toolUses = new Map();
for (const file of files) {
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type !== "assistant" || !e.message?.usage) continue;
    if (e.message.model === "<synthetic>") continue; // never an API response
    const at = Date.parse(e.timestamp);
    if (!(at <= UNTIL)) continue;
    const id = e.message.id ?? `${file}:${e.uuid}`;
    const prev = messages.get(id);
    messages.set(id, { id, at: prev ? Math.min(prev.at, at) : at, model: e.message.model, usage: e.message.usage, sub: file !== files[0] });
    for (const c of e.message.content ?? []) if (c?.type === "tool_use" && !toolUses.has(c.id)) toolUses.set(c.id, { name: c.name, at });
  }
}

const zero = () => ({ requests: 0, input: 0, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0, output: 0, usd: 0 });
function add(acc, m) {
  const u = m.usage;
  const r = rateOf(m.model);
  const cw1h = Number(u.cache_creation?.ephemeral_1h_input_tokens ?? 0);
  const cw5m = u.cache_creation ? Number(u.cache_creation.ephemeral_5m_input_tokens ?? 0) : Number(u.cache_creation_input_tokens ?? 0);
  const fast = u.speed === "fast" ? 2 : 1;
  acc.requests += 1;
  acc.input += Number(u.input_tokens ?? 0);
  acc.cacheWrite5m += cw5m;
  acc.cacheWrite1h += cw1h;
  acc.cacheRead += Number(u.cache_read_input_tokens ?? 0);
  acc.output += Number(u.output_tokens ?? 0);
  acc.usd += (fast * (Number(u.input_tokens ?? 0) * r.input + cw5m * r.input * 1.25 + cw1h * r.cacheWrite + Number(u.cache_read_input_tokens ?? 0) * r.cacheRead + Number(u.output_tokens ?? 0) * r.output)) / 1e6;
}
const tokensOf = (a) => a.input + a.cacheWrite5m + a.cacheWrite1h + a.cacheRead + a.output;

// bins: everything before the first mark is the session's earlier work (none today: the first mark is the founder's message)
const marks = JSON.parse(fs.readFileSync(path.join(LOGS, "phase-marks.json"), "utf8")).marks.map((m) => ({ ...m, t: Date.parse(m.at) }));
const all = [...messages.values()].sort((a, b) => a.at - b.at);
const lastAt = Math.min(UNTIL, Math.max(...all.map((m) => m.at)));
const binOf = (t) => { let k = -1; for (let i = 0; i < marks.length; i++) if (marks[i].t <= t) k = i; return k; };
const before = { name: "before the day", start: all[0].at, end: marks[0].t, usage: zero(), tools: {} };
const phases = marks.map((m, i) => ({ mark: m, name: (m.call ?? 1) > 1 ? `${m.phase} (${m.call})` : m.phase, start: m.t, end: i + 1 < marks.length ? marks[i + 1].t : lastAt, usage: zero(), tools: {} }));
const pick = (t) => { const k = binOf(t); return k < 0 ? before : phases[k]; };
for (const m of all) add(pick(m.at).usage, m);
for (const t of toolUses.values()) { if (t.at > UNTIL) continue; const p = pick(t.at); p.tools[t.name] = (p.tools[t.name] ?? 0) + 1; }
const callsOf = (p) => Object.values(p.tools).reduce((a, b) => a + b, 0);
const day = zero();
for (const p of phases) for (const k of Object.keys(day)) day[k] += p.usage[k];
const models = [...new Set(all.map((m) => m.model))].sort();
const subRequests = all.filter((m) => m.sub).length;
const rate = rateOf(MODEL);
const round2 = (n) => Math.round(n * 100) / 100;

// the session's phases into the runner's trace
const records = phases.map((p) => ({
  phase: p.mark.phase,
  call: p.mark.call ?? 1,
  name: p.name,
  startedAt: new Date(p.start).toISOString(),
  durMs: Math.max(0, p.end - p.start),
  exitCode: 0,
  timedOut: false,
  status: "ok",
  calls: callsOf(p),
  turns: p.usage.requests,
  tokens: { input: p.usage.input, output: p.usage.output, cacheRead: p.usage.cacheRead, cacheWrite: p.usage.cacheWrite5m + p.usage.cacheWrite1h, total: tokensOf(p.usage) },
  cost: null,
  tools: p.tools,
  spans: [],
  source: "interactive Claude Code session: tokens from its transcript, one usage per API response (logs/session-trace.mjs); dollars estimated at list prices",
}));
const summary = {
  until: new Date(lastAt).toISOString(),
  models,
  subagentRequests: subRequests,
  before: { requests: before.usage.requests, tokens: tokensOf(before.usage), usd: round2(before.usage.usd), calls: callsOf(before) },
  phases: phases.map((p) => ({ name: p.name, min: round2((p.end - p.start) / 60000), requests: p.usage.requests, tokens: tokensOf(p.usage), usd: round2(p.usage.usd), calls: callsOf(p), cacheWrite5m: p.usage.cacheWrite5m })),
  day: { requests: day.requests, tokens: tokensOf(day), usd: round2(day.usd) },
  session: { requests: day.requests + before.usage.requests, tokens: tokensOf(day) + tokensOf(before.usage), usd: round2(day.usd + before.usage.usd) },
};
if (DRY) { console.log(JSON.stringify(summary, null, 2)); process.exit(0); }

let trace = readTrace(DAY_DIR);
for (const r of records) trace = appendTrace(DAY_DIR, r, { model: MODEL, pricing: CONFIG.pricing });
// appendTrace prices every token at the session model's row; a critic subagent may run on another model.
for (const tp of trace.phases) {
  if (!tp.source) continue;
  const p = phases.find((x) => x.name === tp.name);
  if (!p) continue;
  const used = [...new Set(all.filter((m) => pick(m.at) === p).map((m) => rateOf(m.model).key))];
  tp.costEstimate = { usd: Math.round(p.usage.usd * 10000) / 10000, rate: used.join(" + ") || rate.key, pricedAt: rate.pricedAt };
}
const { totalsOf } = await import("../../../pipeline/lib/trace.mjs");
trace.totals = totalsOf(trace.phases);
fs.writeFileSync(path.join(DAY_DIR, "trace.json"), JSON.stringify(trace, null, 2) + "\n");
const timeline = timelineFromTrace(trace);
fs.writeFileSync(path.join(LOGS, "session-timeline.json"), JSON.stringify({ note: "WHY.timeline for day 020 as lib/trace.mjs prints it from trace.json after logs/session-trace.mjs appended the session's phases", until: summary.until, timeline }, null, 2) + "\n");

// the journal page
const n = (v) => Number(v).toLocaleString("en-US");
const usd = (v) => `$${Number(v).toFixed(2)}`;
const mins = (ms) => `${Math.round(ms / 60000)} min`;
const runner = trace.phases.filter((p) => !p.source);
const runnerUsd = runner.reduce((a, p) => a + (Number(p.cost) || 0), 0);
let md = `# Token cost audit - ${DATE}\n\n`;
md += `Tokens AND dollars, as the founder asked on 2026-09-26. Day 020 has two halves: the scheduled run on the claude-opus-ultracode slot (scout, plan, one build call that died on a network error), recorded by the runner in \`trace.json\` with the dollars Claude Code reported, and the Claude Code session (Fable 5.1) that took the day over, built, judged and shipped the template, measured here from its transcript and appended to the same trace. Generated by \`node journal/${DATE}/logs/session-trace.mjs\`.\n\n`;
md += `## Basis\n\n`;
md += `- Session model: \`${MODEL}\` (Fable 5.1), one interactive session${files.length > 1 ? `, plus ${files.length - 1} subagent transcript(s) (${n(subRequests)} requests)` : ", no subagents"}. Models in the transcript: ${models.map((m) => `\`${m}\``).join(", ")}.\n`;
md += `- List prices from \`pipeline/config.json\` \`pricing\` (row \`${rate.key}\`, dated ${rate.pricedAt}), USD per million tokens: input $${rate.input}, 1-hour cache write $${rate.cacheWrite}, 5-minute cache write $${(rate.input * 1.25).toFixed(2)}, cache read $${rate.cacheRead.toFixed(2)}, output $${rate.output} (thinking is billed as output).\n`;
md += `- One record per API response (\`message.id\`): ${n(all.length)} responses through ${summary.until}. The transcript repeats a response's usage on every content-block line; summing lines would overstate the cost roughly threefold.\n`;
md += `- An API-equivalent estimate, not an invoice: the session ran on the founder's Claude plan. Not measured: Claude Code's own side calls that never reach the transcript (session titling) and any request that failed before returning usage. The session made no web searches.\n`;
md += `- Phases are binned by \`logs/phase-marks.json\`, stamped as each began. "direct" is the founder's message and the session reading the journal before it stopped the runner. "build (2)" is wall clock, and it holds a stall of almost four hours (13:33-17:32 PT) in which the session's own usage window was closed and nothing ran; its tokens and dollars are the work. "ship" is measured up to the moment the timeline was frozen into the template; the gate and the push came after.\n\n`;
md += `## The Claude session (measured)\n\n`;
md += `| Phase | Wall | Requests | Input | Cache write | Cache read | Output | Tool calls | Tokens | USD |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n`;
for (const p of phases) md += `| ${p.name} | ${mins(p.end - p.start)} | ${n(p.usage.requests)} | ${n(p.usage.input)} | ${n(p.usage.cacheWrite1h + p.usage.cacheWrite5m)} | ${n(p.usage.cacheRead)} | ${n(p.usage.output)} | ${callsOf(p)} | ${n(tokensOf(p.usage))} | ${usd(p.usage.usd)} |\n`;
md += `| **Day 020, session half** | **${mins(lastAt - marks[0].t)}** | **${n(day.requests)}** | **${n(day.input)}** | **${n(day.cacheWrite1h + day.cacheWrite5m)}** | **${n(day.cacheRead)}** | **${n(day.output)}** | **${phases.reduce((a, p) => a + callsOf(p), 0)}** | **${n(tokensOf(day))}** | **${usd(day.usd)}** |\n\n`;
if (before.usage.requests > 0) md += `Before the first mark the same session spent ${mins(before.end - before.start)} on work that is not part of the day: ${n(before.usage.requests)} requests, ${n(tokensOf(before.usage))} tokens, ${usd(before.usage.usd)}.\n\n`;
md += `## The runner's half (the runner's trace, dollars as Claude Code reported them)\n\n`;
md += `| Phase | Wall | Tool calls | Tokens | USD | Status |\n| --- | ---: | ---: | ---: | ---: | --- |\n`;
for (const p of runner) md += `| ${p.name} | ${p.durMs >= 60000 ? mins(p.durMs) : `${Math.round(p.durMs / 1000)} s`} | ${p.calls ?? 0} | ${n(p.tokens?.total ?? 0)} | ${p.cost != null ? usd(p.cost) : "-"} | ${p.status} |\n`;
md += `\nThe runner's half: ${usd(runnerUsd)} reported (Opus 5.5 at list, the build call's $17.36 bought a scaffold and 43 turns that ended in "API Error: Can't reach the API server - ENOTFOUND"). Whole day, both halves: ${usd(runnerUsd + day.usd)}.\n`;
fs.writeFileSync(path.join(DAY_DIR, "60-token-costs.md"), md);
fs.writeFileSync(path.join(DAY_DIR, "token-costs.json"), JSON.stringify({ session: SESSION, model: MODEL, rates: rate, ...summary, runnerUsd: round2(runnerUsd), traceTotals: trace.totals }, null, 2) + "\n");
console.log(JSON.stringify({ ...summary, runnerUsd: round2(runnerUsd), traceTotals: trace.totals }, null, 2));
