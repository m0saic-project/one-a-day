// token-cost-audit - what day 010 cost, tokens AND dollars, in two parts:
//
//   A. the day's own run (claude-opus-ultracode, opus[1m]): every phase call
//      the runner made, morning and resumed, from journal/2026-09-29/trace.json.
//      Claude Code reports total_cost_usd per call, so these dollars are
//      REPORTED, not estimated. The two calls the limit rejected outright
//      (build-2, build-3, $0) are in there too.
//   B. the maintainer's session (Claude Code, claude-fable-5-1) that found
//      out why, wrote the session-limit guard, fixed the gate for m0saic
//      0.3.0 and resumed the day: measured from the session transcript, one
//      record per API response, today's turns only, binned by the founder's
//      messages. (day 009's method.)
//
//   node journal/2026-09-29/token-cost-audit.mjs [--until <iso>]
//
// Writes: token-costs.json, 60-token-costs.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DAY_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATE = "2026-09-29";
const PROJECT = path.join(os.homedir(), ".claude", "projects", "C--src-m0saic-production");
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const UNTIL = opt("--until") ? Date.parse(opt("--until")) : Infinity;
// Local midnight of the day, as UTC: the session file also holds yesterday.
const SINCE = Date.parse("2026-09-29T04:00:00.000Z");
const PRICED_AT = "2026-09-29";
const round4 = (n) => Math.round(n * 10000) / 10000;
const n = (v) => Number(v ?? 0).toLocaleString("en-US");
const usd = (v) => `$${Number(v ?? 0).toFixed(2)}`;

// ── A. the day's run, from the runner's trace ──
const trace = JSON.parse(fs.readFileSync(path.join(DAY_DIR, "trace.json"), "utf8"));
const calls = (trace.phases ?? []).map((p) => ({
  call: p.name, startedAt: p.startedAt, durMs: p.durMs, status: p.status, toolCalls: p.calls,
  tokens: p.tokens?.total ?? 0, cacheRead: p.tokens?.cacheRead ?? 0, output: p.tokens?.output ?? 0,
  usd: p.cost != null ? Number(p.cost) : p.costEstimate?.usd ?? null, basis: p.cost != null ? "reported" : p.costEstimate ? "estimated" : "none",
}));
const dayRun = {
  agent: "claude", model: "claude-opus-5-5 (opus[1m], ultracode, effort xhigh)", slot: "claude-opus-ultracode",
  basis: "Dollars as Claude Code reported them per call (total_cost_usd, API list price at the time of the call); the run itself was on the founder's Claude plan. Tokens as the CLI's usage events summed them.",
  calls,
  totals: { calls: calls.length, tokens: calls.reduce((a, c) => a + c.tokens, 0), usd: round4(calls.reduce((a, c) => a + (c.usd ?? 0), 0)), wallMs: trace.totals?.wallMs ?? null, basis: calls.every((c) => c.basis === "reported") ? "reported" : "mixed" },
};

// ── B. the maintainer's session ──
// List prices checked 2026-09-28 at https://platform.claude.com/docs/en/about-claude/pricing (unchanged today).
const CLAUDE_SOURCE = "https://platform.claude.com/docs/en/about-claude/pricing";
const RATES = {
  "claude-fable-5-1": { input: 10, cacheWrite5m: 12.5, cacheWrite1h: 20, cacheRead: 0.25, output: 50 },
  "claude-opus-5-5": { input: 4, cacheWrite5m: 5, cacheWrite1h: 8, cacheRead: 0.2, output: 20 },
  "claude-sonnet-5": { input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.2, output: 10 },
  "claude-haiku-4-5": { input: 1, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, output: 5 },
  "claude-haiku-4-5-20251001": { input: 1, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, output: 5 },
};
const WEB_SEARCH_USD = 0.01;
// The session is the one whose transcript holds today's opening question.
const MARKER = "yep limit was hit";
const files = [];
for (const f of fs.readdirSync(PROJECT)) {
  if (!f.endsWith(".jsonl")) continue;
  const p = path.join(PROJECT, f);
  if (fs.readFileSync(p, "utf8").includes(MARKER)) files.push(p);
}
if (!files.length) throw new Error(`no transcript in ${PROJECT} contains ${JSON.stringify(MARKER)}`);
const SESSION = path.basename(files[0], ".jsonl");
const subDir = path.join(PROJECT, SESSION, "subagents");
if (fs.existsSync(subDir)) for (const f of fs.readdirSync(subDir)) if (f.endsWith(".jsonl")) files.push(path.join(subDir, f));

const messages = new Map();
const toolUses = new Map();
const userTurns = [];
for (const file of files) {
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    const at = Date.parse(e.timestamp ?? "");
    if (!(at >= SINCE && at <= UNTIL)) continue;
    if (e.type === "user" && typeof e.message?.content === "string" && !e.isMeta && file === files[0]) {
      const text = e.message.content.replace(/\s+/g, " ").trim();
      if (text && !text.startsWith("<")) userTurns.push({ at, text: text.slice(0, 60) });
      continue;
    }
    if (e.type !== "assistant" || !e.message?.usage) continue;
    if (e.message.model === "<synthetic>") continue;
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
userTurns.sort((a, b) => a.at - b.at);
const all = [...messages.values()].sort((a, b) => a.at - b.at);
const lastAt = Math.min(UNTIL, Math.max(...all.map((m) => m.at)));
const phaseOf = (t) => { let k = 0; for (let i = 0; i < userTurns.length; i++) if (userTurns[i].at <= t) k = i; return k; };
const phases = userTurns.map((u, i) => ({ name: `"${u.text}"`, start: u.at, end: i + 1 < userTurns.length ? userTurns[i + 1].at : lastAt, usage: zero(), tools: 0 }));
const total = zero();
for (const m of all) { add(phases[phaseOf(m.at)].usage, m); add(total, m); }
for (const t of toolUses.values()) {
  const p = phases[phaseOf(t.at)];
  p.tools += 1;
  if (t.name === "WebSearch") { p.usage.usd += WEB_SEARCH_USD; p.usage.webSearches += 1; total.usd += WEB_SEARCH_USD; total.webSearches += 1; }
}
const models = [...new Set(all.map((m) => m.model))].sort();
const until = Number.isFinite(UNTIL) ? new Date(UNTIL).toISOString() : new Date(lastAt).toISOString();
const session = {
  session: SESSION, model: "claude-fable-5-1", modelsInTranscript: models, pricingSource: CLAUDE_SOURCE, ratesUsdPerMillion: RATES["claude-fable-5-1"], webSearchUsdEach: WEB_SEARCH_USD, since: new Date(SINCE).toISOString(), until,
  basis: "API-equivalent list-price estimate, not an invoice: the session ran on the founder's Claude plan. One record per API response (message.id), today's turns only (the session file also holds day 009's work). Not included: Claude Code's side requests that never reach the transcript (WebSearch, the small model that summarises WebFetch pages, session titling); the search fees are counted.",
  phases: phases.map((p) => ({ phase: p.name, startedAt: new Date(p.start).toISOString(), durMs: Math.max(0, p.end - p.start), ...p.usage, usd: round4(p.usage.usd), tokens: tokensOf(p.usage), toolCalls: p.tools })),
  totals: { ...total, usd: round4(total.usd), tokens: tokensOf(total), toolCalls: toolUses.size, wallMs: lastAt - (userTurns[0]?.at ?? lastAt) },
};
const audit = { date: DATE, pricedAt: PRICED_AT, dayRun, session, day: { usd: round4(dayRun.totals.usd + session.totals.usd), tokens: dayRun.totals.tokens + session.totals.tokens } };
fs.writeFileSync(path.join(DAY_DIR, "token-costs.json"), JSON.stringify(audit, null, 2) + "\n");

const mins = (ms) => `${Math.round((ms ?? 0) / 60000)} min`;
let md = `# Token cost audit - ${DATE}\n\n`;
md += `Tokens AND dollars, as the founder asked on 2026-09-26. Day 010 has two bills: the day's own run, cut by the session limit in the morning and resumed after the guard was built, and the maintainer's session that built it. Generated by \`node journal/${DATE}/token-cost-audit.mjs\`.\n\n`;
md += `## A. The day's run - ${dayRun.slot}\n\n- ${dayRun.basis}\n\n| Call | Started (UTC) | Wall | Status | Tool calls | Tokens | Output | USD (${dayRun.totals.basis}) |\n| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |\n`;
for (const c of calls) md += `| ${c.call} | ${String(c.startedAt).slice(11, 19)} | ${mins(c.durMs)} | ${c.status} | ${c.toolCalls} | ${n(c.tokens)} | ${n(c.output)} | ${c.usd == null ? "-" : usd(c.usd)} |\n`;
md += `| **Total** | | **${mins(dayRun.totals.wallMs)}** | | | **${n(dayRun.totals.tokens)}** | | **${usd(dayRun.totals.usd)}** |\n\n`;
md += `## B. The maintainer's session - claude-fable-5-1\n\n- ${session.basis}\n- List prices checked 2026-09-28 at ${CLAUDE_SOURCE}: input $10, 1-hour cache write $20, cache read $0.25, output $50 per million; web search $10 per 1,000. Models in the transcript: ${models.map((m) => `\`${m}\``).join(", ")}.\n- Phases are the founder's messages, in order.\n\n| Phase (the founder's message) | Wall | Requests | Cache write | Cache read | Output | Tool calls | USD |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n`;
for (const p of session.phases) md += `| ${p.phase} | ${mins(p.durMs)} | ${n(p.requests)} | ${n(p.cacheWrite1h + p.cacheWrite5m)} | ${n(p.cacheRead)} | ${n(p.output)} | ${p.toolCalls} | ${usd(p.usd)} |\n`;
const T = session.totals;
md += `| **Total** | **${mins(T.wallMs)}** | **${n(T.requests)}** | **${n(T.cacheWrite1h + T.cacheWrite5m)}** | **${n(T.cacheRead)}** | **${n(T.output)}** | **${T.toolCalls}** | **${usd(T.usd)}** |\n\nMeasured through ${until}.\n\n`;
md += `## The day\n\n| | Tokens | USD |\n| --- | ---: | ---: |\n| The day's run (${dayRun.slot}, reported) | ${n(dayRun.totals.tokens)} | ${usd(dayRun.totals.usd)} |\n| The maintainer's session (Fable 5.1, estimated) | ${n(T.tokens)} | ${usd(T.usd)} |\n| **Day 010** | **${n(audit.day.tokens)}** | **${usd(audit.day.usd)}** |\n`;
fs.writeFileSync(path.join(DAY_DIR, "60-token-costs.md"), md);
console.log(JSON.stringify({ session: SESSION, until, dayRun: dayRun.totals, session_: { requests: T.requests, tokens: T.tokens, usd: T.usd }, day: audit.day }));
