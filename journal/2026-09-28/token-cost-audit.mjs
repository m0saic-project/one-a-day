// token-cost-audit - what day 009 cost, tokens AND dollars, in two parts:
//
//   A. the agent's run (Codex, gpt-6-astra): the usage each phase call
//      reported in its `turn.completed` event (logs/<phase>-<n>.jsonl, local
//      only - the raw streams are gitignored), priced at the model's
//      published rates. The runner's trace.json carries no dollars for this
//      model (pipeline/config.json has no price row for it) and counts cached
//      input twice (see below), so this part is the corrected account.
//   B. the maintainer's restore session (Claude Code, claude-fable-5-1):
//      measured from the session's own transcript, one record per API
//      response, binned by logs/phase-marks.json. (day 008's method.)
//
//   node journal/2026-09-28/token-cost-audit.mjs [--until <iso>] [--transcript <path>]
//
// Writes: token-costs.json, 60-token-costs.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DAY_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATE = "2026-09-28";
const SESSION = "23c3112d-75d6-48be-96b4-14ef7df69b1f";
const PROJECT = path.join(os.homedir(), ".claude", "projects", "C--src-m0saic-production");
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const UNTIL = opt("--until") ? Date.parse(opt("--until")) : Infinity;
const MAIN = opt("--transcript") ?? path.join(PROJECT, `${SESSION}.jsonl`);
const PRICED_AT = "2026-09-28";
const round4 = (n) => Math.round(n * 10000) / 10000;
const n = (v) => v.toLocaleString("en-US");
const usd = (v) => `$${v.toFixed(2)}`;

// ── A. the agent's run ──
// Checked 2026-09-28 at https://developers.openai.com/api/docs/models/gpt-6-astra:
// input $10, cached input $1, output $50 per million; a request with more than
// 272K input tokens is priced at 2x input and cache and 1.5x output. Usage is
// reported per call, not per request, so the long-context rate cannot be
// applied; this is the standard-rate estimate.
const CODEX_SOURCE = "https://developers.openai.com/api/docs/models/gpt-6-astra";
const CODEX_RATES = { input: 10, cachedInput: 1, output: 50 };
const CALLS = ["scout-1", "plan-1", "build-1", "build-2", "build-3"];
const agentCalls = [];
for (const call of CALLS) {
  const file = path.join(DAY_DIR, "logs", `${call}.jsonl`);
  if (!fs.existsSync(file)) throw new Error(`${call}.jsonl is not on this machine - the raw streams are local only`);
  let u = null;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.type === "turn.completed" && e.usage) u = e.usage;
  }
  if (!u) throw new Error(`${call}.jsonl has no turn.completed usage`);
  // Codex's input_tokens INCLUDES cached_input_tokens.
  const cached = Number(u.cached_input_tokens ?? 0);
  const uncached = Number(u.input_tokens ?? 0) - cached;
  const output = Number(u.output_tokens ?? 0);
  agentCalls.push({
    call, input: Number(u.input_tokens ?? 0), cachedInput: cached, uncachedInput: uncached, output,
    reasoning: Number(u.reasoning_output_tokens ?? 0),
    tokens: Number(u.input_tokens ?? 0) + output,
    usd: round4((uncached * CODEX_RATES.input + cached * CODEX_RATES.cachedInput + output * CODEX_RATES.output) / 1e6),
  });
}
const sum = (k) => agentCalls.reduce((a, c) => a + c[k], 0);
const agentTotal = { input: sum("input"), cachedInput: sum("cachedInput"), uncachedInput: sum("uncachedInput"), output: sum("output"), reasoning: sum("reasoning"), tokens: sum("tokens"), usd: round4(sum("usd")) };
const trace = JSON.parse(fs.readFileSync(path.join(DAY_DIR, "trace.json"), "utf8"));
const traceTokens = trace.phases.reduce((a, p) => a + Number(p.tokens?.total ?? 0), 0);

// ── B. the restore session ──
// List prices checked 2026-09-28 at https://platform.claude.com/docs/en/about-claude/pricing.
const CLAUDE_SOURCE = "https://platform.claude.com/docs/en/about-claude/pricing";
const MODEL = "claude-fable-5-1";
const RATES = {
  "claude-fable-5-1": { input: 10, cacheWrite5m: 12.5, cacheWrite1h: 20, cacheRead: 0.25, output: 50 },
  "claude-opus-5-5": { input: 4, cacheWrite5m: 5, cacheWrite1h: 8, cacheRead: 0.2, output: 20 },
  "claude-sonnet-5": { input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.2, output: 10 },
  "claude-haiku-4-5": { input: 1, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, output: 5 },
  "claude-haiku-4-5-20251001": { input: 1, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, output: 5 },
};
const WEB_SEARCH_USD = 0.01;
const files = [MAIN];
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
    messages.set(id, { id, at: prev ? Math.min(prev.at, at) : at, model: e.message.model, usage: e.message.usage });
    for (const c of e.message.content ?? []) if (c?.type === "tool_use" && !toolUses.has(c.id)) toolUses.set(c.id, { name: c.name, at });
  }
}
const zero = () => ({ requests: 0, input: 0, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0, output: 0, webSearches: 0, usd: 0 });
function add(acc, m) {
  const u = m.usage;
  const cw1h = Number(u.cache_creation?.ephemeral_1h_input_tokens ?? 0);
  const cw5m = u.cache_creation ? Number(u.cache_creation.ephemeral_5m_input_tokens ?? 0) : Number(u.cache_creation_input_tokens ?? 0);
  const r = RATES[m.model];
  if (!r) throw new Error(`no list price for ${m.model} - add it to RATES`);
  const fast = u.speed === "fast" ? 2 : 1;
  acc.requests += 1;
  acc.input += Number(u.input_tokens ?? 0);
  acc.cacheWrite5m += cw5m;
  acc.cacheWrite1h += cw1h;
  acc.cacheRead += Number(u.cache_read_input_tokens ?? 0);
  acc.output += Number(u.output_tokens ?? 0);
  acc.usd += (fast * (Number(u.input_tokens ?? 0) * r.input + cw5m * r.cacheWrite5m + cw1h * r.cacheWrite1h + Number(u.cache_read_input_tokens ?? 0) * r.cacheRead + Number(u.output_tokens ?? 0) * r.output)) / 1e6;
}
const tokensOf = (a) => a.input + a.cacheWrite5m + a.cacheWrite1h + a.cacheRead + a.output;
const marks = JSON.parse(fs.readFileSync(path.join(DAY_DIR, "logs", "phase-marks.json"), "utf8")).marks.map((m) => ({ ...m, t: Date.parse(m.at) }));
const all = [...messages.values()].sort((a, b) => a.at - b.at);
const lastAt = Math.min(UNTIL, Math.max(...all.map((m) => m.at)));
const phaseOf = (t) => { let k = 0; for (let i = 0; i < marks.length; i++) if (marks[i].t <= t) k = i; return k; };
const phases = marks.map((m, i) => ({ name: m.phase, start: m.t, end: i + 1 < marks.length ? marks[i + 1].t : lastAt, usage: zero(), tools: 0 }));
const total = zero();
for (const m of all) { add(phases[phaseOf(m.at)].usage, m); add(total, m); }
for (const t of toolUses.values()) {
  if (t.at > UNTIL) continue;
  const p = phases[phaseOf(t.at)];
  p.tools += 1;
  // Claude Code runs WebSearch as a separate request that never reaches the
  // transcript: the fee is known, that request's tokens are not.
  if (t.name === "WebSearch") { p.usage.usd += WEB_SEARCH_USD; p.usage.webSearches += 1; total.usd += WEB_SEARCH_USD; total.webSearches += 1; }
}
const models = [...new Set(all.map((m) => m.model))].sort();
const toolCalls = [...toolUses.values()].filter((t) => t.at <= UNTIL).length;
const webFetches = [...toolUses.values()].filter((t) => t.name === "WebFetch" && t.at <= UNTIL).length;
const until = Number.isFinite(UNTIL) ? new Date(UNTIL).toISOString() : new Date(lastAt).toISOString();

const audit = {
  date: DATE,
  pricedAt: PRICED_AT,
  agentRun: {
    agent: "codex", model: "gpt-6-astra", selfDeclared: "gpt-6",
    pricingSource: CODEX_SOURCE, ratesUsdPerMillion: CODEX_RATES,
    basis: "API-equivalent estimate at standard rates, not an invoice: the run was on the founder's Codex plan. Usage as each call's turn.completed event reported it; input_tokens includes cached_input_tokens. The long-context rate (requests over 272K input tokens) is not applied because usage is reported per call, not per request.",
    calls: agentCalls, totals: agentTotal,
    runnerTrace: { tokens: traceTokens, note: "trace.json adds cached input to an input figure that already includes it, so the runner's total (and the tutorial card's 9.6M) counts cached input twice; it carries no dollars because pipeline/config.json has no price row for gpt-6-astra." },
  },
  restoreSession: {
    session: SESSION, model: MODEL, modelsInTranscript: models,
    pricingSource: CLAUDE_SOURCE, ratesUsdPerMillion: RATES[MODEL], webSearchUsdEach: WEB_SEARCH_USD, until,
    basis: "API-equivalent list-price estimate, not an invoice: the session ran on the founder's Claude plan. One record per API response (message.id). Not included: Claude Code's side requests that never reach the transcript (WebSearch, the small model that summarises WebFetch pages, session titling).",
    phases: phases.map((p) => ({ phase: p.name, startedAt: new Date(p.start).toISOString(), durMs: Math.max(0, p.end - p.start), ...p.usage, usd: round4(p.usage.usd), tokens: tokensOf(p.usage), toolCalls: p.tools })),
    totals: { ...total, usd: round4(total.usd), tokens: tokensOf(total), toolCalls, webFetches, wallMs: lastAt - marks[0].t },
  },
};
audit.day = { usd: round4(audit.agentRun.totals.usd + audit.restoreSession.totals.usd), tokens: audit.agentRun.totals.tokens + audit.restoreSession.totals.tokens };
fs.writeFileSync(path.join(DAY_DIR, "token-costs.json"), JSON.stringify(audit, null, 2) + "\n");

// ── the journal page ──
const mins = (ms) => `${Math.round(ms / 60000)} min`;
const A = audit.agentRun, B = audit.restoreSession, R = RATES[MODEL];
let md = `# Token cost audit - ${DATE}\n\n`;
md += `Tokens AND dollars, as the founder asked on 2026-09-26. Day 009 has two bills: the agent's run, which built the template and could not render it, and the maintainer's session, which found out why and shipped it. Generated by \`node journal/${DATE}/token-cost-audit.mjs\`.\n\n`;
md += `## A. The agent's run - Codex, gpt-6-astra\n\n`;
md += `- Source: the usage each phase call reported in its \`turn.completed\` event (\`logs/<phase>-<n>.jsonl\`; the raw streams are local only).\n`;
md += `- Rates checked ${PRICED_AT} at ${CODEX_SOURCE}, USD per million tokens: input $${CODEX_RATES.input}, cached input $${CODEX_RATES.cachedInput}, output $${CODEX_RATES.output}. Requests over 272K input tokens cost 2x input and cache and 1.5x output; usage is reported per call, not per request, so that rate is not applied. This is the standard-rate estimate.\n`;
md += `- API-equivalent, not an invoice: the run was on the founder's Codex plan.\n\n`;
md += `| Call | Input (includes cached) | Cached input | Output (reasoning) | Tokens | USD |\n| --- | ---: | ---: | ---: | ---: | ---: |\n`;
for (const c of A.calls) md += `| ${c.call} | ${n(c.input)} | ${n(c.cachedInput)} | ${n(c.output)} (${n(c.reasoning)}) | ${n(c.tokens)} | ${usd(c.usd)} |\n`;
md += `| **Total** | **${n(A.totals.input)}** | **${n(A.totals.cachedInput)}** | **${n(A.totals.output)} (${n(A.totals.reasoning)})** | **${n(A.totals.tokens)}** | **${usd(A.totals.usd)}** |\n\n`;
md += `**The tutorial card says 9.6M tokens and no dollars; both come from the runner, and the token figure is too high.** \`pipeline/lib/trace.mjs\` adds Codex's \`cached_input_tokens\` to an \`input_tokens\` that already includes them, so \`trace.json\` totals ${n(traceTokens)} where the calls reported ${n(A.totals.tokens)}. \`WHY.timeline\` has to agree with \`trace.json\` (the build checks it), so the card carries the runner's numbers. The dollars are missing because \`pipeline/config.json\` has no price row for gpt-6-astra. Both are pipeline fixes for a maintainer; every Codex day's card is affected.\n\n`;
md += `## B. The restore session - Claude Code, ${MODEL}\n\n`;
md += `- One interactive session${files.length > 1 ? `, plus ${files.length - 1} subagent transcript(s)` : ", no subagents"}; models in the transcript: ${models.map((m) => `\`${m}\``).join(", ")}. It began as a question (why did the day not ship), so the first phase is the diagnosis.\n`;
md += `- List prices checked ${PRICED_AT} at ${CLAUDE_SOURCE}, USD per million tokens: input $${R.input}, 5-minute cache write $${R.cacheWrite5m.toFixed(2)}, 1-hour cache write $${R.cacheWrite1h}, cache read $${R.cacheRead.toFixed(2)}, output $${R.output} (thinking is billed as output). Web search $10 per 1,000.\n`;
md += `- One record per API response; the transcript repeats a response's usage on every content-block line.\n`;
md += `- API-equivalent, not an invoice: the session ran on the founder's Claude plan. Outside the transcript and not measured: the tokens of ${B.totals.webSearches} web search and ${B.totals.webFetches} web fetch side requests (the search fees are counted), and session titling.\n`;
md += `- Phases are binned by \`logs/phase-marks.json\`.\n\n`;
md += `| Phase | Wall | Requests | Input | Cache write | Cache read | Output | Tool calls | USD |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n`;
for (const p of B.phases) md += `| ${p.phase} | ${mins(p.durMs)} | ${n(p.requests)} | ${n(p.input)} | ${n(p.cacheWrite1h + p.cacheWrite5m)} | ${n(p.cacheRead)} | ${n(p.output)} | ${p.toolCalls} | ${usd(p.usd)} |\n`;
const T = B.totals;
md += `| **Total** | **${mins(T.wallMs)}** | **${n(T.requests)}** | **${n(T.input)}** | **${n(T.cacheWrite1h + T.cacheWrite5m)}** | **${n(T.cacheRead)}** | **${n(T.output)}** | **${T.toolCalls}** | **${usd(T.usd)}** |\n\n`;
md += `Measured through ${until}: the last step before the gate. The gate, the push and the closing message came after it.\n\n`;
md += `## The day\n\n`;
md += `| | Tokens | USD |\n| --- | ---: | ---: |\n| Agent run (Codex, gpt-6-astra) | ${n(A.totals.tokens)} | ${usd(A.totals.usd)} |\n| Restore session (Claude, Fable 5.1) | ${n(T.tokens)} | ${usd(T.usd)} |\n| **Day 009** | **${n(audit.day.tokens)}** | **${usd(audit.day.usd)}** |\n`;
fs.writeFileSync(path.join(DAY_DIR, "60-token-costs.md"), md);
console.log(JSON.stringify({ until, agent: { tokens: A.totals.tokens, usd: A.totals.usd, traceTokens }, session: { requests: T.requests, tokens: T.tokens, usd: T.usd, phases: B.phases.map((p) => [p.phase, p.usd]) }, day: audit.day }));
