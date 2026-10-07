// session-trace - what the interactive session that built chess-game-recap/v3
// cost, measured from its own transcript, written as this follow-up's own
// trace.json (journal/2026-10-07/v3/ - v2's record and the day's runner
// trace are not touched) and as 60-token-costs.md (tokens AND dollars, the
// founder's standing ask since 2026-09-26).
//
//   node journal/2026-10-07/v3/logs/session-trace.mjs [--until <iso>] [--dry]
//
// Claude Code keeps every API response in ~/.claude/projects/<project>/<session>.jsonl
// with its `usage` (subagents under <session>/subagents/). Two traps, both
// handled: one response is written as SEVERAL lines (one per content block)
// that repeat the same usage - keep one record per `message.id`; and cache
// writes come in two prices (5-minute 1.25x input, 1-hour 2x input).
// Phases are binned by logs/phase-marks.json. --dry prints and writes nothing.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendTrace, timelineFromTrace, totalsOf } from "../../../../pipeline/lib/trace.mjs";

const LOGS = path.dirname(fileURLToPath(import.meta.url));
const OWN_DIR = path.dirname(LOGS);
const REPO = path.resolve(OWN_DIR, "..", "..", "..");
const DATE = "2026-10-07";
const SESSION = "8b37ae25-d129-46d4-8c75-3c69d3901003";
const PROJECT = path.join(os.homedir(), ".claude", "projects", "C--src-m0saic-production");
const MODEL = "claude-opus-5-5";
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const UNTIL = opt("--until") ? Date.parse(opt("--until")) : Infinity;
const DRY = argv.includes("--dry");

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

const messages = new Map();
const toolUses = new Map();
for (const file of files) {
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type !== "assistant" || !e.message?.usage) continue;
    if (e.message.model === "<synthetic>") continue;
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

const marks = JSON.parse(fs.readFileSync(path.join(LOGS, "phase-marks.json"), "utf8")).marks.map((m) => ({ ...m, t: Date.parse(m.at) }));
const all = [...messages.values()].sort((a, b) => a.at - b.at);
const lastAt = Math.min(UNTIL, Math.max(...all.map((m) => m.at)));
const binOf = (t) => { let k = -1; for (let i = 0; i < marks.length; i++) if (marks[i].t <= t) k = i; return k; };
const before = { name: "before v3", start: all[0].at, end: marks[0].t, usage: zero(), tools: {} };
const phases = marks.map((m, i) => ({ mark: m, name: m.phase, start: m.t, end: i + 1 < marks.length ? marks[i + 1].t : lastAt, usage: zero(), tools: {} }));
const pick = (t) => { const k = binOf(t); return k < 0 ? before : phases[k]; };
for (const m of all) add(pick(m.at).usage, m);
for (const t of toolUses.values()) { if (t.at > UNTIL) continue; const p = pick(t.at); p.tools[t.name] = (p.tools[t.name] ?? 0) + 1; }
const callsOf = (p) => Object.values(p.tools).reduce((a, b) => a + b, 0);
const own = zero();
for (const p of phases) for (const k of Object.keys(own)) own[k] += p.usage[k];
const models = [...new Set(all.map((m) => m.model))].sort();
const subRequests = all.filter((m) => m.sub).length;
const rate = rateOf(MODEL);
const round2 = (n) => Math.round(n * 100) / 100;

const records = phases.map((p) => ({
  phase: p.mark.phase,
  call: 1,
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
  phases: phases.map((p) => ({ name: p.name, min: round2((p.end - p.start) / 60000), requests: p.usage.requests, tokens: tokensOf(p.usage), usd: round2(p.usage.usd), calls: callsOf(p) })),
  v3: { requests: own.requests, tokens: tokensOf(own), usd: round2(own.usd) },
  session: { requests: own.requests + before.usage.requests, tokens: tokensOf(own) + tokensOf(before.usage), usd: round2(own.usd + before.usage.usd) },
};
if (DRY) { console.log(JSON.stringify(summary, null, 2)); process.exit(0); }

// A fresh trace: this folder's record is the session alone.
fs.rmSync(path.join(OWN_DIR, "trace.json"), { force: true });
let trace = { phases: [] };
for (const r of records) trace = appendTrace(OWN_DIR, r, { model: MODEL, pricing: CONFIG.pricing });
// appendTrace prices every token at the session model's row; the critic ran
// on Sonnet. Replace each estimate with the per-response, per-model sum above.
for (const tp of trace.phases) {
  const p = phases.find((x) => x.name === tp.name);
  const used = [...new Set(all.filter((m) => pick(m.at) === p).map((m) => rateOf(m.model).key))];
  tp.costEstimate = { usd: Math.round(p.usage.usd * 10000) / 10000, rate: used.join(" + ") || rate.key, pricedAt: rate.pricedAt };
}
trace.totals = totalsOf(trace.phases);
fs.writeFileSync(path.join(OWN_DIR, "trace.json"), JSON.stringify(trace, null, 2) + "\n");
const timeline = timelineFromTrace(trace);
fs.writeFileSync(path.join(LOGS, "session-timeline.json"), JSON.stringify({ note: "WHY.timeline for chess-game-recap/v3 as lib/trace.mjs prints it from v3/trace.json", until: summary.until, timeline }, null, 2) + "\n");

const n = (v) => Number(v).toLocaleString("en-US");
const usd = (v) => `$${Number(v).toFixed(2)}`;
const mins = (ms) => `${Math.round(ms / 60000)} min`;
const day = JSON.parse(fs.readFileSync(path.join(OWN_DIR, "..", "trace.json"), "utf8"));
let md = `# Token cost audit - ${DATE} v3\n\n`;
md += `Tokens AND dollars, as the founder asked on 2026-09-26. Generated by \`node journal/${DATE}/v3/logs/session-trace.mjs\` from this session's own transcript.\n\n`;
md += `## Basis\n\n`;
md += `- Model: \`${MODEL}\` (Opus 5.5), one interactive session${files.length > 1 ? `, plus ${files.length - 1} subagent transcript(s) (${n(subRequests)} requests)` : ", no subagents"}. Models in the transcripts: ${models.map((m) => `\`${m}\``).join(", ")}.\n`;
md += `- List prices from \`pipeline/config.json\` \`pricing\` (row \`${rate.key}\`, dated ${rate.pricedAt}), USD per million tokens: input $${rate.input}, 1-hour cache write $${rate.cacheWrite}, 5-minute cache write $${(rate.input * 1.25).toFixed(2)}, cache read $${rate.cacheRead.toFixed(2)}, output $${rate.output}.\n`;
md += `- One record per API response (\`message.id\`): ${n(all.length)} responses through ${summary.until}.\n`;
md += `- An API-equivalent estimate, not an invoice: the session ran on the founder's Claude plan. Not measured: Claude Code's side calls that never reach the transcript (session titling, and the small model that summarises a WebFetch page - four fetches this session). No web searches.\n`;
md += `- Phases are binned by \`logs/phase-marks.json\`. "direct" runs from the founder's message to the start of the build; its first request re-read the whole session after a 90-minute idle, so it paid a fresh cache write. "ship" is measured up to the moment the timeline was frozen into the template; the gate and the push came after.\n\n`;
md += `## The session (measured)\n\n`;
md += `| Phase | Wall | Requests | Input | Cache write | Cache read | Output | Tool calls | Tokens | USD |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n`;
for (const p of phases) md += `| ${p.name} | ${mins(p.end - p.start)} | ${n(p.usage.requests)} | ${n(p.usage.input)} | ${n(p.usage.cacheWrite1h + p.usage.cacheWrite5m)} | ${n(p.usage.cacheRead)} | ${n(p.usage.output)} | ${callsOf(p)} | ${n(tokensOf(p.usage))} | ${usd(p.usage.usd)} |\n`;
md += `| **v3** | **${mins(lastAt - marks[0].t)}** | **${n(own.requests)}** | **${n(own.input)}** | **${n(own.cacheWrite1h + own.cacheWrite5m)}** | **${n(own.cacheRead)}** | **${n(own.output)}** | **${phases.reduce((a, p) => a + callsOf(p), 0)}** | **${n(tokensOf(own))}** | **${usd(own.usd)}** |`;
md += String.fromCharCode(10, 10);
md += `Before the first mark the same session diagnosed v1, retired claude-haiku and built and shipped v2 (98e0177): ${n(before.usage.requests)} requests, ${n(tokensOf(before.usage))} tokens, ${usd(before.usage.usd)} (v2's own audit is ../v2/60-token-costs.md). Whole session through this freeze: ${n(tokensOf(own) + tokensOf(before.usage))} tokens, ${usd(own.usd + before.usage.usd)}.`;
md += String.fromCharCode(10, 10);
const v2 = JSON.parse(fs.readFileSync(path.join(OWN_DIR, "..", "v2", "trace.json"), "utf8"));
md += `## Against v2 and the day`;
md += String.fromCharCode(10, 10);
md += `v2 froze ${usd(v2.totals?.costUsd ?? 0)} into its tutorial; day 018's Haiku run reported ${usd(day.totals?.costUsd ?? 0)}. v3 - the same chess, rebuilt cell by cell with a platform knob - cost ${usd(own.usd)}.`;
md += String.fromCharCode(10);
fs.writeFileSync(path.join(OWN_DIR, "60-token-costs.md"), md);
fs.writeFileSync(path.join(OWN_DIR, "token-costs.json"), JSON.stringify({ session: SESSION, model: MODEL, rates: rate, ...summary, traceTotals: trace.totals }, null, 2) + "\n");
console.log(JSON.stringify({ ...summary, traceTotals: trace.totals }, null, 2));
