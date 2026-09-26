// token-cost-audit - what day 007 cost, measured from the Claude Code
// session's own transcript (the founder asked for tokens AND dollars).
//
//   node journal/2026-09-26/token-cost-audit.mjs [--until <iso>] [--transcript <path>]
//
// Why a transcript and not a runner trace: the day was run by hand in one
// interactive session, so no adapter wrote journal/<date>/trace.json. Claude
// Code keeps every API response in ~/.claude/projects/<project>/<session>.jsonl
// with its `usage` (input, 5-minute and 1-hour cache writes, cache reads,
// output incl. thinking, server tool requests). Two traps, both handled:
//   1. One API response is written as SEVERAL lines (one per content block),
//      each repeating the same usage. Summing lines triples the bill; this
//      keeps one record per `message.id`.
//   2. Cache writes come in two prices (5-minute 1.25x, 1-hour 2x input);
//      Claude Code writes the 1-hour kind. `cache_creation` splits them.
// Subagent transcripts (<session>/subagents/*.jsonl) are included when present.
//
// Writes: token-costs.json, 60-token-costs.md, logs/session-timeline.json
// (the WHY.timeline block, phases binned by logs/phase-marks.json).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DAY_DIR = path.dirname(fileURLToPath(import.meta.url));
const SESSION = "1a51648f-4d60-4cf0-b9eb-9ea6fc7fb097";
const PROJECT = path.join(os.homedir(), ".claude", "projects", "C--src-m0saic-production");
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const UNTIL = opt("--until") ? Date.parse(opt("--until")) : Infinity;
const MAIN = opt("--transcript") ?? path.join(PROJECT, `${SESSION}.jsonl`);

// List prices, USD per million tokens, checked 2026-09-26 at
// https://platform.claude.com/docs/en/about-claude/pricing. Opus 5.5's cache
// read is 0.05x input (not the usual 0.1x). Web search is $10 per 1,000;
// web fetch has no charge beyond tokens. Fast mode is 2x and was not used.
const PRICED_AT = "2026-09-26";
const PRICING_SOURCE = "https://platform.claude.com/docs/en/about-claude/pricing";
const RATES = {
  "claude-opus-5-5": { input: 4, cacheWrite5m: 5, cacheWrite1h: 8, cacheRead: 0.2, output: 20 },
  "claude-haiku-4-5": { input: 1, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, output: 5 },
};
const WEB_SEARCH_USD = 0.01;

const files = [MAIN];
const subDir = path.join(PROJECT, SESSION, "subagents");
if (fs.existsSync(subDir)) for (const f of fs.readdirSync(subDir)) if (f.endsWith(".jsonl")) files.push(path.join(subDir, f));

// ── one record per API response ──
const messages = new Map();
const toolUses = new Map();
for (const file of files) {
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type !== "assistant" || !e.message?.usage) continue;
    const at = Date.parse(e.timestamp);
    if (!(at <= UNTIL)) continue;
    const id = e.message.id ?? `${file}:${e.uuid}`;
    const prev = messages.get(id);
    messages.set(id, { id, at: prev ? Math.min(prev.at, at) : at, model: e.message.model, usage: e.message.usage, file: path.basename(file) });
    for (const c of e.message.content ?? []) if (c?.type === "tool_use" && !toolUses.has(c.id)) toolUses.set(c.id, { name: c.name, at });
  }
}

const zero = () => ({ requests: 0, input: 0, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0, output: 0, thinking: 0, webSearches: 0, webFetches: 0, usd: 0 });
function add(acc, m) {
  const u = m.usage;
  const cw1h = Number(u.cache_creation?.ephemeral_1h_input_tokens ?? 0);
  const cw5m = u.cache_creation ? Number(u.cache_creation.ephemeral_5m_input_tokens ?? 0) : Number(u.cache_creation_input_tokens ?? 0);
  const r = RATES[m.model];
  if (!r) throw new Error(`no list price for ${m.model} - add it to RATES`);
  const fast = u.speed === "fast" ? 2 : 1;
  const searches = Number(u.server_tool_use?.web_search_requests ?? 0);
  acc.requests += 1;
  acc.input += Number(u.input_tokens ?? 0);
  acc.cacheWrite5m += cw5m;
  acc.cacheWrite1h += cw1h;
  acc.cacheRead += Number(u.cache_read_input_tokens ?? 0);
  acc.output += Number(u.output_tokens ?? 0);
  acc.thinking += Number(u.output_tokens_details?.thinking_tokens ?? 0);
  acc.webSearches += searches;
  acc.webFetches += Number(u.server_tool_use?.web_fetch_requests ?? 0);
  acc.usd += (fast * (Number(u.input_tokens ?? 0) * r.input + cw5m * r.cacheWrite5m + cw1h * r.cacheWrite1h + Number(u.cache_read_input_tokens ?? 0) * r.cacheRead + Number(u.output_tokens ?? 0) * r.output)) / 1e6 + searches * WEB_SEARCH_USD;
}
const tokensOf = (a) => a.input + a.cacheWrite5m + a.cacheWrite1h + a.cacheRead + a.output;
// Claude Code runs its WebSearch tool as a SEPARATE request that never reaches
// this transcript (server_tool_use stays 0 here): the per-search fee is known,
// that request's tokens are not. Count the tool calls, charge the fee.
const sideSearches = [...toolUses.values()].filter((t) => t.name === "WebSearch" && t.at <= UNTIL).length;
const sideFetches = [...toolUses.values()].filter((t) => t.name === "WebFetch" && t.at <= UNTIL).length;

// ── phases by the marks written as the session went ──
const marks = JSON.parse(fs.readFileSync(path.join(DAY_DIR, "logs", "phase-marks.json"), "utf8")).marks.map((m) => ({ ...m, t: Date.parse(m.at) }));
const all = [...messages.values()].sort((a, b) => a.at - b.at);
const lastAt = Math.min(UNTIL, Math.max(...all.map((m) => m.at)));
const phaseOf = (t) => { let k = 0; for (let i = 0; i < marks.length; i++) if (marks[i].t <= t) k = i; return k; };
const phases = marks.map((m, i) => ({ name: m.phase, start: m.t, end: i + 1 < marks.length ? marks[i + 1].t : lastAt, usage: zero(), tools: {} }));
const total = zero();
for (const m of all) { add(phases[phaseOf(m.at)].usage, m); add(total, m); }
for (const t of toolUses.values()) {
  if (t.at > UNTIL) continue;
  const p = phases[phaseOf(t.at)];
  p.tools[t.name] = (p.tools[t.name] ?? 0) + 1;
  if (t.name === "WebSearch") {
    p.usage.usd += WEB_SEARCH_USD;
    p.usage.webSearches += 1;
    total.usd += WEB_SEARCH_USD;
    total.webSearches += 1;
  }
}
const toolsLine = (tools) => Object.entries(tools).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([n, c]) => `${n} ${c}`).join(", ");
const t0 = marks[0].t;

const round4 = (n) => Math.round(n * 10000) / 10000;
const audit = {
  session: SESSION,
  model: "claude-opus-5-5",
  effort: "max",
  pricedAt: PRICED_AT,
  pricingSource: PRICING_SOURCE,
  ratesUsdPerMillion: RATES["claude-opus-5-5"],
  webSearchUsdEach: WEB_SEARCH_USD,
  until: Number.isFinite(UNTIL) ? new Date(UNTIL).toISOString() : new Date(lastAt).toISOString(),
  basis:
    "API-equivalent list-price estimate, not an invoice: the session ran on the founder's Claude plan. One record per API response (message.id), usage as the API returned it. Not included: Claude Code's own side calls that never reach the transcript (the small model that summarises WebFetch pages, session titling) and any request that failed before returning usage.",
  transcripts: files.map((f) => path.basename(f)),
  outsideTranscript: {
    webSearchCalls: sideSearches,
    webSearchFeesUsd: round4(sideSearches * WEB_SEARCH_USD),
    webFetchCalls: sideFetches,
    note: "Claude Code runs WebSearch as a separate request and summarises WebFetch pages with a small model; neither request is in the transcript. The search fees are counted in the totals; those requests' tokens are not measured.",
  },
  phases: phases.map((p) => ({
    phase: p.name,
    startedAt: new Date(p.start).toISOString(),
    durMs: Math.max(0, p.end - p.start),
    ...p.usage,
    usd: round4(p.usage.usd),
    tokens: tokensOf(p.usage),
    toolCalls: Object.values(p.tools).reduce((a, b) => a + b, 0),
    tools: p.tools,
  })),
  totals: { ...total, usd: round4(total.usd), tokens: tokensOf(total), toolCalls: toolUses.size, wallMs: lastAt - t0 },
};
fs.writeFileSync(path.join(DAY_DIR, "token-costs.json"), JSON.stringify(audit, null, 2) + "\n");

// ── the WHY.timeline block ──
const timeline = {
  source: "self-reported",
  costBasis: "estimated",
  pricedAt: PRICED_AT,
  phases: audit.phases.map((p) => ({
    name: p.phase,
    startMs: Math.round((Date.parse(p.startedAt) - t0) / 1000) * 1000,
    durMs: Math.round(p.durMs / 1000) * 1000,
    ...(p.toolCalls > 0 ? { calls: p.toolCalls } : {}),
    ...(p.tokens > 0 ? { tokens: p.tokens } : {}),
    costUsd: Math.round(p.usd * 100) / 100,
    ...(p.toolCalls > 0 ? { tools: toolsLine(p.tools) } : {}),
  })),
};
fs.writeFileSync(path.join(DAY_DIR, "logs", "session-timeline.json"), JSON.stringify({ note: "WHY.timeline for day 007, generated by token-cost-audit.mjs from the session transcript and logs/phase-marks.json", until: audit.until, timeline }, null, 2) + "\n");

// ── the journal page ──
const n = (v) => v.toLocaleString("en-US");
const usd = (v) => `$${v.toFixed(2)}`;
let md = `# Token cost audit - 2026-09-26\n\n`;
md += `The founder asked for tokens AND dollars. Day 6 (also a hand-run Claude session) left them out, saying they could not be measured from inside a session; they can: Claude Code writes every API response, with its usage, to the session transcript. This page is generated by \`node journal/2026-09-26/token-cost-audit.mjs\`.\n\n`;
md += `## Basis\n\n`;
md += `- Model: \`claude-opus-5-5\` (Opus 5.5), effort max, standard speed, one interactive session, no subagents${files.length > 1 ? ` (plus ${files.length - 1} subagent transcript(s))` : ""}.\n`;
md += `- List prices checked ${PRICED_AT} at ${PRICING_SOURCE}, USD per million tokens: input $4, 5-minute cache write $5, 1-hour cache write $8, cache read $0.20 (Opus 5.5 reads at 0.05x input), output $20 (thinking is billed as output). Web search $10 per 1,000; web fetch free beyond tokens.\n`;
md += `- One record per API response. The transcript repeats a response's usage on every content-block line (here ${n([...messages.values()].length)} responses were written as many more lines); summing lines would overstate the cost roughly threefold.\n`;
md += `- API-equivalent estimate, not an invoice: the session ran on the founder's Claude plan.\n`;
md += `- Outside the transcript: Claude Code runs each WebSearch as a separate request and summarises each WebFetch page with a small model. The fees of the ${sideSearches} searches ($10 per 1,000) are in the table; the tokens of those ${sideSearches} search and ${sideFetches} fetch side requests are not measured, nor is session titling.\n`;
md += `- Phases are binned by \`logs/phase-marks.json\`, written as each phase began. "orient + maintain" includes the maintenance commit (\`dd4779e\`, the scout directive) made in the same session before the day started.\n\n`;
md += `## Measured\n\n`;
md += `| Phase | Wall | Requests | Input | Cache write (1h) | Cache read | Output (thinking) | Web searches | Tool calls | USD |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n`;
const mins = (ms) => `${Math.round(ms / 60000)} min`;
for (const p of audit.phases) md += `| ${p.phase} | ${mins(p.durMs)} | ${n(p.requests)} | ${n(p.input)} | ${n(p.cacheWrite1h + p.cacheWrite5m)} | ${n(p.cacheRead)} | ${n(p.output)} (${n(p.thinking)}) | ${p.webSearches} | ${p.toolCalls} | ${usd(p.usd)} |\n`;
const T = audit.totals;
md += `| **Total** | **${mins(T.wallMs)}** | **${n(T.requests)}** | **${n(T.input)}** | **${n(T.cacheWrite1h + T.cacheWrite5m)}** | **${n(T.cacheRead)}** | **${n(T.output)} (${n(T.thinking)})** | **${T.webSearches}** | **${T.toolCalls}** | **${usd(T.usd)}** |\n\n`;
const part = (tok, rate) => (tok * rate) / 1e6;
const R = RATES["claude-opus-5-5"];
md += `Where the dollars went: cache reads ${usd(part(T.cacheRead, R.cacheRead))}, cache writes ${usd(part(T.cacheWrite1h, R.cacheWrite1h) + part(T.cacheWrite5m, R.cacheWrite5m))}, output ${usd(part(T.output, R.output))}, uncached input ${usd(part(T.input, R.input))}, web search ${usd(T.webSearches * WEB_SEARCH_USD)}. ${n(T.tokens)} tokens in all, measured through ${audit.until}.\n`;
fs.writeFileSync(path.join(DAY_DIR, "60-token-costs.md"), md);
console.log(JSON.stringify({ until: audit.until, requests: T.requests, tokens: T.tokens, usd: audit.totals.usd, phases: audit.phases.map((p) => [p.phase, p.usd]) }));
