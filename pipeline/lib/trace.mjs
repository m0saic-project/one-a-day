// trace — what the agent did, as numbers: per phase call, the tool calls it
// made (which tool, what it touched, how long), the tokens it spent, the
// wall time. Recorded by the adapters from the agent CLI's own event stream
// (nothing self-reported), merged by the runner into journal/<date>/trace.json,
// and copied by the ship-phase agent into the template's WHY.timeline — the
// last page of every why-tutorial (the harness agent-timeline card).
//
//   node pipeline/lib/trace.mjs --timeline journal/<date>/trace.json
//                       prints WHY.timeline as JSON, ready to paste
//
// Shapes it understands: Claude Code stream-json (assistant.message.usage,
// tool_use / tool_result blocks, the final result event) and Codex --json
// (item.* events, turn.completed usage). Anything else records wall time only.
import fs from "node:fs";
import path from "node:path";

const MAX_SPANS = 400;
const short = (x, n = 120) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** One phase call's recorder. Feed it every stdout line; `finish()` returns the record. */
export function createTraceRecorder({ phase, call = 1, startedAt = Date.now(), now = Date.now } = {}) {
  const spans = [];
  const open = new Map(); // tool_use id → span
  const tools = {};
  const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  let cost = null;
  let turns = 0;
  let errors = 0;
  let sawUsage = false;

  const openSpan = (id, tool, target) => {
    const span = { tool: short(tool, 40), target: short(target, 80), startMs: Math.max(0, now() - startedAt), durMs: 0 };
    if (spans.length < MAX_SPANS) spans.push(span);
    if (id) open.set(id, span);
    tools[span.tool] = (tools[span.tool] ?? 0) + 1;
  };
  const closeSpan = (id, isError) => {
    const span = id ? open.get(id) : undefined;
    if (!span) return;
    span.durMs = Math.max(0, now() - startedAt - span.startMs);
    if (isError) { span.status = "error"; errors += 1; }
    open.delete(id);
  };

  return {
    onLine(raw) {
      const line = String(raw ?? "").trim();
      if (!line) return;
      let o;
      try { o = JSON.parse(line); } catch { return; }
      // ── Claude Code stream-json ──
      if (o.type === "assistant") {
        turns += 1;
        const u = o.message?.usage;
        if (u) {
          sawUsage = true;
          tokens.input += Number(u.input_tokens ?? 0);
          tokens.output += Number(u.output_tokens ?? 0);
          tokens.cacheRead += Number(u.cache_read_input_tokens ?? 0);
          tokens.cacheWrite += Number(u.cache_creation_input_tokens ?? 0);
        }
        for (const b of o.message?.content ?? []) {
          if (b?.type === "tool_use") {
            const i = b.input ?? {};
            openSpan(b.id, b.name, i.command ?? i.file_path ?? i.pattern ?? i.query ?? i.url ?? i.description ?? i.prompt ?? i.path ?? "");
          }
        }
        return;
      }
      if (o.type === "user") {
        const c = o.message?.content;
        if (Array.isArray(c)) for (const b of c) if (b?.type === "tool_result") closeSpan(b.tool_use_id, b.is_error === true);
        return;
      }
      if (o.type === "result") {
        if (Number.isFinite(Number(o.total_cost_usd))) cost = Number(o.total_cost_usd);
        if (Number.isFinite(Number(o.num_turns))) turns = Math.max(turns, Number(o.num_turns));
        const u = o.usage;
        if (u && !sawUsage) {
          tokens.input += Number(u.input_tokens ?? 0);
          tokens.output += Number(u.output_tokens ?? 0);
          tokens.cacheRead += Number(u.cache_read_input_tokens ?? 0);
          tokens.cacheWrite += Number(u.cache_creation_input_tokens ?? 0);
        }
        return;
      }
      // ── Codex --json (best effort) ──
      if (o.type === "item.started" || o.type === "item.completed") {
        const it = o.item ?? {};
        const kind = it.type ?? "";
        const id = it.id ?? `${kind}-${spans.length}`;
        if (kind === "command_execution" || kind === "file_change" || kind === "web_search" || kind === "mcp_tool_call") {
          if (o.type === "item.started" || !open.has(id)) openSpan(id, kind === "command_execution" ? "shell" : kind === "file_change" ? "edit" : kind, it.command ?? (it.changes ?? []).map((c) => c.path).join(", ") ?? it.query ?? "");
          if (o.type === "item.completed") closeSpan(id, kind === "command_execution" && it.exit_code != null && it.exit_code !== 0);
        }
        return;
      }
      if (o.type === "turn.completed" || o.type === "thread.completed") {
        turns += 1;
        const u = o.usage;
        if (u) { tokens.input += Number(u.input_tokens ?? 0); tokens.output += Number(u.output_tokens ?? 0); tokens.cacheRead += Number(u.cached_input_tokens ?? 0); }
      }
    },
    finish({ exitCode = 0, timedOut = false } = {}) {
      const end = now();
      for (const [id] of open) closeSpan(id, false);
      const total = tokens.input + tokens.output + tokens.cacheRead + tokens.cacheWrite;
      return {
        phase,
        call,
        name: call > 1 ? `${phase} (${call})` : phase,
        startedAt: new Date(startedAt).toISOString(),
        durMs: Math.max(0, end - startedAt),
        exitCode,
        timedOut,
        status: timedOut || (exitCode !== 0 && exitCode !== null) ? "error" : "ok",
        calls: spans.length,
        toolErrors: errors,
        turns,
        tokens: { ...tokens, total },
        cost,
        tools,
        spans,
      };
    },
  };
}

/**
 * Cost: what the CLI reported (Claude Code's `total_cost_usd`, exact at the
 * time) or, failing that, an ESTIMATE from `pipeline/config.json` `pricing`
 * (USD per million tokens by model-name substring, dated). Devs read tokens,
 * leadership reads dollars; the card shows both and says which kind.
 */
export function estimateCost(tokens, model, pricing) {
  const table = pricing?.perMillion ?? {};
  const name = String(model ?? "").toLowerCase();
  const key = Object.keys(table).find((k) => name.includes(k.toLowerCase()));
  if (!key || !tokens) return null;
  const r = table[key];
  const usd = (Number(tokens.input ?? 0) * (r.input ?? 0) + Number(tokens.output ?? 0) * (r.output ?? 0) + Number(tokens.cacheRead ?? 0) * (r.cacheRead ?? 0) + Number(tokens.cacheWrite ?? 0) * (r.cacheWrite ?? 0)) / 1e6;
  return { usd: Math.round(usd * 10000) / 10000, rate: key, pricedAt: pricing?.pricedAt ?? null };
}

/** "Bash 41, Read 12, Edit 8" — the top three tools of a phase, ASCII. */
export function toolsLine(tools, top = 3) {
  return Object.entries(tools ?? {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([name, n]) => `${name} ${n}`)
    .join(", ");
}

export function tracePath(dayDir) { return path.join(dayDir, "trace.json"); }
export function readTrace(dayDir) { try { return JSON.parse(fs.readFileSync(tracePath(dayDir), "utf8")); } catch { return { phases: [] }; } }

/**
 * Merge one phase record into journal/<date>/trace.json (replacing a re-run
 * of the same phase call). `model` + `pricing` fill a cost estimate when the
 * record carries no reported cost.
 */
export function appendTrace(dayDir, record, { model = null, pricing = null } = {}) {
  const trace = readTrace(dayDir);
  const phases = (Array.isArray(trace.phases) ? trace.phases : []).filter((p) => !(p.phase === record.phase && p.call === record.call));
  const withCost = { ...record };
  if (withCost.cost == null) {
    const est = estimateCost(withCost.tokens, model, pricing);
    withCost.costEstimate = est ? { usd: est.usd, rate: est.rate, pricedAt: est.pricedAt } : null;
  }
  phases.push(withCost);
  phases.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  const t0 = Date.parse(phases[0]?.startedAt ?? record.startedAt);
  for (const p of phases) p.startMs = Math.max(0, Date.parse(p.startedAt) - t0);
  const next = { startedAt: new Date(t0).toISOString(), phases, totals: totalsOf(phases) };
  fs.mkdirSync(dayDir, { recursive: true });
  fs.writeFileSync(tracePath(dayDir), JSON.stringify(next, null, 2) + "\n");
  return next;
}

/** A phase's dollars: reported by the CLI, else the estimate, else null. */
export function costOf(p) {
  if (p?.cost != null) return { usd: Number(p.cost), basis: "reported" };
  if (p?.costEstimate?.usd != null) return { usd: Number(p.costEstimate.usd), basis: "estimated", pricedAt: p.costEstimate.pricedAt ?? null };
  return null;
}

export function totalsOf(phases) {
  const sum = (f) => phases.reduce((a, p) => a + (Number(f(p)) || 0), 0);
  const last = phases.reduce((m, p) => Math.max(m, (p.startMs ?? 0) + (p.durMs ?? 0)), 0);
  const costs = phases.map(costOf).filter(Boolean);
  const basis = costs.length === 0 ? null : costs.every((c) => c.basis === "reported") ? "reported" : "estimated";
  return { phases: phases.length, calls: sum((p) => p.calls), tokens: sum((p) => p.tokens?.total), costUsd: costs.length ? Math.round(costs.reduce((a, c) => a + c.usd, 0) * 100) / 100 : null, costBasis: basis, wallMs: last };
}

/** The WHY.timeline shape (the harness agent-timeline's phases), from a trace. */
export function timelineFromTrace(trace) {
  const list = Array.isArray(trace?.phases) ? trace.phases : [];
  const phases = list.map((p) => {
    const cost = costOf(p);
    return {
      name: String(p.name ?? p.phase),
      startMs: Math.round(p.startMs ?? 0),
      durMs: Math.round(p.durMs ?? 0),
      ...(p.calls > 0 ? { calls: p.calls } : {}),
      ...(p.tokens?.total > 0 ? { tokens: p.tokens.total } : {}),
      ...(cost ? { costUsd: Math.round(cost.usd * 100) / 100 } : {}),
      ...(Object.keys(p.tools ?? {}).length ? { tools: toolsLine(p.tools) } : {}),
      ...(p.status === "error" ? { status: "error" } : {}),
    };
  });
  const totals = totalsOf(list);
  const pricedAt = list.map(costOf).find((c) => c && c.basis === "estimated")?.pricedAt ?? null;
  return { source: "runner", phases, ...(totals.costBasis ? { costBasis: totals.costBasis } : {}), ...(pricedAt ? { pricedAt } : {}) };
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  const i = process.argv.indexOf("--timeline");
  if (i < 0 || !process.argv[i + 1]) { console.error("usage: node pipeline/lib/trace.mjs --timeline journal/<date>/trace.json"); process.exit(2); }
  const trace = JSON.parse(fs.readFileSync(process.argv[i + 1], "utf8"));
  process.stdout.write(JSON.stringify(timelineFromTrace(trace), null, 2) + "\n");
}
