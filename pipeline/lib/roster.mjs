// roster — who runs today. `node pipeline/run.mjs --agent random` resolves to
// one concrete (agent, model, adapter overrides) triple before the day starts;
// `--roster <id>` pins a named slot. The pick lands in run.json
// (`runner.roster`) and in the day's index row, so the journal records not
// just which CLI ran but which slot of the roster drew it.
//
// This module is pure and synchronous: it only ORDERS the candidates. The
// runner walks that order and takes the first adapter whose available() says
// yes, so a CLI that is not installed on the machine costs a log line, not
// the day.
//
// config.json `roster`:
//   entries[].id        slot name (default "<agent>-<model>"); --roster takes it
//   entries[].agent     which adapter in pipeline/agents/
//   entries[].model     passed to the adapter; null = that CLI's own default
//   entries[].weight    relative odds, > 0 (default 1)
//   entries[].adapter   overrides merged over adapters.<agent> for this slot
//   entries[].enabled   false sits the slot out without deleting it
//   avoidRepeat         "hard" (default) | "soft" | false — see below
//   repeatPenalty       soft mode only: { agent: 0.3, slot: 0.1 }
//
// avoidRepeat reads the previous day from journal/index.json:
//   "hard" — yesterday's agent is ordered behind every other agent, and
//            yesterday's exact slot behind its siblings. NOTE: with exactly
//            two agents installed this is a strict alternation — the weights
//            then only decide WHICH slot of the chosen agent runs.
//   "soft" — nothing is excluded, only damped by repeatPenalty, so the draw
//            stays genuinely random and a repeat day is possible.
//   false  — pure weighted draw, no memory of yesterday.
// No mode can stall: every enabled slot always stays in the order.

const DEFAULT_PENALTY = { agent: 0.3, slot: 0.1 };

/** Normalized, enabled slots in config order. Invalid entries are dropped, not thrown on. */
export function rosterEntries(config) {
  const raw = config?.roster?.entries;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e === "object" && typeof e.agent === "string" && e.agent && e.enabled !== false)
    .map((e, i) => ({
      id: String(e.id ?? (e.model ? `${e.agent}-${e.model}` : e.agent)),
      agent: e.agent,
      model: e.model ?? null,
      weight: Number.isFinite(e.weight) && e.weight > 0 ? e.weight : 1,
      adapter: e.adapter && typeof e.adapter === "object" ? e.adapter : {},
      order: i,
    }));
}

/** The slot `--roster <id>` names, or null. */
export function findRosterEntry(config, id) {
  return rosterEntries(config).find((e) => e.id === String(id)) ?? null;
}

/** The most recent day that actually ran an agent, from journal/index.json rows. */
export function lastPickFrom(rows) {
  const list = (Array.isArray(rows) ? rows : []).filter((r) => r && typeof r.agent === "string" && r.agent);
  if (!list.length) return null;
  const last = list.reduce((a, b) => (String(a.date ?? "") > String(b.date ?? "") ? a : b));
  return { date: last.date ?? null, agent: last.agent, model: last.model ?? null, rosterId: last.rosterId ?? null };
}

/** 0 = a different agent, 1 = the same agent another slot, 2 = yesterday's slot again. */
export function rankOf(entry, last) {
  if (!last) return 0;
  if (entry.agent !== last.agent) return 0;
  if (last.rosterId) return entry.id === last.rosterId ? 2 : 1;
  return 1; // an older row records no slot — "same agent" is all we know
}

/** Draw without replacement, odds proportional to weight. `rng` returns [0, 1). */
function weightedShuffle(list, rng) {
  const pool = list.slice();
  const out = [];
  while (pool.length) {
    let total = 0;
    for (const e of pool) total += e.weight;
    let r = rng() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].weight; if (r < 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/**
 * Every enabled slot, best candidate first. The runner takes the first one
 * whose adapter is installed.
 * @returns {{id,agent,model,weight,adapter,rank}[]}
 */
export function orderCandidates({ entries, last = null, avoidRepeat = "hard", penalty = DEFAULT_PENALTY, rng = Math.random }) {
  const list = entries.map((e) => ({ ...e, rank: avoidRepeat === false ? 0 : rankOf(e, last) }));
  if (!list.length) return [];
  if (avoidRepeat === "hard") {
    const out = [];
    for (const rank of [0, 1, 2]) {
      const group = list.filter((e) => e.rank === rank);
      if (group.length) out.push(...weightedShuffle(group, rng));
    }
    return out;
  }
  const damp = { ...DEFAULT_PENALTY, ...(penalty ?? {}) };
  const scaled = list.map((e) => ({ ...e, weight: e.weight * (e.rank === 2 ? damp.slot : e.rank === 1 ? damp.agent : 1) }));
  // Keep the caller's declared weight on the returned rows; only the draw is damped.
  const drawn = weightedShuffle(scaled, rng);
  return drawn.map((d) => ({ ...d, weight: list.find((e) => e.id === d.id).weight }));
}

/** Everything the runner needs to draw, straight from config + the journal index. */
export function pickOrder(config, indexRows, rng = Math.random) {
  const entries = rosterEntries(config);
  const last = lastPickFrom(indexRows);
  const mode = config?.roster?.avoidRepeat ?? "hard";
  const avoidRepeat = mode === true ? "hard" : mode;
  return { order: orderCandidates({ entries, last, avoidRepeat, penalty: config?.roster?.repeatPenalty, rng }), last, avoidRepeat };
}

/** One line for the runner's log. */
export function describeEntry(e) {
  if (!e) return "none";
  const bits = [e.agent];
  if (e.model) bits.push(e.model);
  if (e.adapter?.ultracode) bits.push("ultracode");
  return `${e.id} (${bits.join(" · ")})`;
}

/** Deterministic rng for tests and for re-running a day the same way. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
