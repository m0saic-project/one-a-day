#!/usr/bin/env node
// stream-log — turn an agent's JSONL event stream into a readable activity
// feed. Knows Claude Code's stream-json and Codex's --json shapes; anything
// else is passed through untouched (one line per event, truncated).
//
//   claude -p ... --output-format stream-json | node pipeline/lib/stream-log.mjs scout
import readline from "node:readline";

const short = (x, n = 160) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const ts = () => new Date().toTimeString().slice(0, 8);

/** @returns {string|null} a formatted line, or null to drop the event */
export function formatEvent(raw, label = "") {
  const line = raw.trim();
  if (!line) return null;
  let o;
  try { o = JSON.parse(line); } catch { return `[${ts()}] ${label} ${short(line, 200)}`; }
  const tag = label ? `${label} ` : "";
  const sub = o.parent_tool_use_id ? "  └─ " : "";
  // ── Claude Code stream-json ──
  if (o.type === "system" && o.subtype === "init") return `[${ts()}] ${tag}◆ session start (model=${o.model ?? "?"})`;
  if (o.type === "assistant") {
    const out = [];
    for (const b of o.message?.content ?? []) {
      if (b.type === "text" && short(b.text)) out.push(`[${ts()}] ${tag}${sub}💬 ${short(b.text, 220)}`);
      if (b.type === "tool_use") {
        const i = b.input ?? {};
        const hint = i.command ?? i.file_path ?? i.pattern ?? i.query ?? i.url ?? i.description ?? i.prompt ?? i.path ?? "";
        out.push(`[${ts()}] ${tag}${sub}🔧 ${b.name}: ${short(hint, 140)}`);
      }
    }
    return out.length ? out.join("\n") : null;
  }
  if (o.type === "user") {
    const c = o.message?.content;
    if (Array.isArray(c)) {
      const errs = c.filter((b) => b && b.type === "tool_result" && b.is_error);
      if (errs.length) return `[${ts()}] ${tag}${sub}⚠ tool error: ${short(typeof errs[0].content === "string" ? errs[0].content : JSON.stringify(errs[0].content), 160)}`;
    }
    return null;
  }
  if (o.type === "result") {
    const cost = Number(o.total_cost_usd ?? 0);
    return `[${ts()}] ${tag}✅ END ${o.is_error ? "ERROR" : "ok"}  cost=$${cost.toFixed(2)}  turns=${o.num_turns ?? "?"}`;
  }
  // ── Codex --json events (best effort) ──
  if (typeof o.type === "string" && o.type.startsWith("item.")) {
    const it = o.item ?? {};
    const kind = it.type ?? "";
    if (kind === "agent_message" || kind === "message") return `[${ts()}] ${tag}💬 ${short(it.text ?? it.content, 220)}`;
    if (kind === "command_execution") return `[${ts()}] ${tag}🔧 shell: ${short(it.command, 140)}${it.exit_code !== undefined ? ` → ${it.exit_code}` : ""}`;
    if (kind === "file_change") return `[${ts()}] ${tag}✎ ${short((it.changes ?? []).map((c) => c.path).join(", "), 140)}`;
    if (kind === "reasoning") return null;
    return `[${ts()}] ${tag}· ${kind} ${short(it.text ?? "", 120)}`;
  }
  if (o.type === "turn.completed" || o.type === "thread.completed") return `[${ts()}] ${tag}✅ END ${o.type}${o.usage ? ` tokens=${JSON.stringify(o.usage)}` : ""}`;
  if (o.type === "error") return `[${ts()}] ${tag}⚠ ${short(o.message ?? line, 200)}`;
  return null;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  const label = process.argv[2] ?? "";
  const rl = readline.createInterface({ input: process.stdin });
  rl.on("line", (l) => { const f = formatEvent(l, label); if (f) process.stdout.write(f + "\n"); });
}
