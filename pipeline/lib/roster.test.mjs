import test from "node:test";
import assert from "node:assert/strict";
import { describeEntry, findRosterEntry, lastPickFrom, mulberry32, orderCandidates, pickOrder, rankOf, rosterEntries } from "./roster.mjs";

const CONFIG = {
  roster: {
    avoidRepeat: "hard",
    entries: [
      { id: "claude-opus-ultracode", agent: "claude", model: "opus", weight: 3, adapter: { ultracode: true, effort: "xhigh" } },
      { id: "claude-sonnet", agent: "claude", model: "sonnet", weight: 2 },
      { agent: "codex", model: null, weight: 3 },
      { id: "kimi", agent: "kimi", weight: 1, enabled: false },
    ],
  },
};

test("entries normalize: ids default, disabled sit out, bad rows drop", () => {
  const e = rosterEntries(CONFIG);
  assert.deepEqual(e.map((x) => x.id), ["claude-opus-ultracode", "claude-sonnet", "codex"]);
  assert.equal(e[2].model, null);
  assert.equal(e[0].adapter.ultracode, true);
  assert.deepEqual(rosterEntries({}), []);
  assert.deepEqual(rosterEntries({ roster: { entries: [{ weight: 2 }, null, "nope"] } }), []);
});

test("a weightless entry still draws, at weight 1", () => {
  const e = rosterEntries({ roster: { entries: [{ agent: "codex" }, { agent: "claude", weight: 0 }, { agent: "kimi", weight: -4 }] } });
  assert.deepEqual(e.map((x) => x.weight), [1, 1, 1]);
});

test("findRosterEntry pins a slot by id", () => {
  assert.equal(findRosterEntry(CONFIG, "claude-sonnet").model, "sonnet");
  assert.equal(findRosterEntry(CONFIG, "kimi"), null, "disabled slots are not pinnable");
  assert.equal(findRosterEntry(CONFIG, "nope"), null);
});

test("lastPickFrom takes the latest dated row that ran an agent", () => {
  assert.equal(lastPickFrom([]), null);
  assert.equal(lastPickFrom(null), null);
  const rows = [
    { date: "2026-09-20", agent: "claude", model: "claude-opus-5[1m]", rosterId: "claude-opus-ultracode" },
    { date: "2026-09-22", agent: "codex", model: "gpt-5.6-sol" },
    { date: "2026-09-21", agent: "claude" },
    { date: "2026-09-19", agent: null },
  ];
  assert.deepEqual(lastPickFrom(rows), { date: "2026-09-22", agent: "codex", model: "gpt-5.6-sol", rosterId: null });
});

test("rank: other agent < same agent other slot < the same slot again", () => {
  const [ultra, sonnet, codex] = rosterEntries(CONFIG);
  const last = { agent: "claude", rosterId: "claude-opus-ultracode" };
  assert.equal(rankOf(codex, last), 0);
  assert.equal(rankOf(sonnet, last), 1);
  assert.equal(rankOf(ultra, last), 2);
  assert.equal(rankOf(ultra, null), 0, "day one has no yesterday");
  assert.equal(rankOf(ultra, { agent: "claude", rosterId: null }), 1, "an older row records no slot");
});

test("hard mode: yesterday's agent is ordered last but never dropped", () => {
  const entries = rosterEntries(CONFIG);
  const last = { agent: "claude", rosterId: "claude-opus-ultracode" };
  for (let seed = 0; seed < 50; seed++) {
    const order = orderCandidates({ entries, last, avoidRepeat: "hard", rng: mulberry32(seed) });
    assert.equal(order.length, entries.length, "every slot stays in the order");
    assert.equal(order[0].id, "codex", "the other agent wins outright");
    assert.equal(order[order.length - 1].id, "claude-opus-ultracode", "the repeat slot is last");
  }
});

test("hard mode with one agent installed still yields a full order", () => {
  const solo = rosterEntries({ roster: { entries: [{ agent: "claude", model: "opus" }] } });
  const order = orderCandidates({ entries: solo, last: { agent: "claude", rosterId: "claude-opus" }, avoidRepeat: "hard", rng: mulberry32(7) });
  assert.deepEqual(order.map((e) => e.id), ["claude-opus"], "a one-slot roster never stalls");
});

test("soft mode damps yesterday instead of excluding it — repeats stay possible", () => {
  const entries = rosterEntries(CONFIG);
  const last = { agent: "claude", rosterId: "claude-opus-ultracode" };
  let repeats = 0;
  const runs = 600;
  for (let seed = 0; seed < runs; seed++) {
    const order = orderCandidates({ entries, last, avoidRepeat: "soft", rng: mulberry32(seed) });
    assert.equal(order.length, entries.length);
    if (order[0].agent === "claude") repeats++;
  }
  assert.ok(repeats > 0, "soft mode must sometimes repeat the agent");
  assert.ok(repeats < runs * 0.5, `soft mode must still prefer variety (got ${repeats}/${runs})`);
});

test("soft mode reports the declared weight, not the damped draw weight", () => {
  const entries = rosterEntries(CONFIG);
  const order = orderCandidates({ entries, last: { agent: "claude", rosterId: "claude-sonnet" }, avoidRepeat: "soft", rng: mulberry32(3) });
  assert.equal(order.find((e) => e.id === "claude-sonnet").weight, 2);
});

test("avoidRepeat false is a pure weighted draw over every slot", () => {
  const entries = rosterEntries(CONFIG);
  const seen = new Set();
  for (let seed = 0; seed < 200; seed++) {
    const order = orderCandidates({ entries, last: { agent: "claude", rosterId: "claude-opus-ultracode" }, avoidRepeat: false, rng: mulberry32(seed) });
    assert.ok(order.every((e) => e.rank === 0));
    seen.add(order[0].id);
  }
  assert.equal(seen.size, 3, "every slot can lead when there is no memory");
});

test("weights bend the draw the way they say", () => {
  const entries = rosterEntries({ roster: { entries: [{ agent: "a", weight: 9 }, { agent: "b", weight: 1 }] } });
  let a = 0;
  const runs = 1000;
  for (let seed = 0; seed < runs; seed++) if (orderCandidates({ entries, last: null, rng: mulberry32(seed) })[0].agent === "a") a++;
  assert.ok(a > runs * 0.8 && a < runs * 0.98, `9:1 should land near 90% (got ${a}/${runs})`);
});

test("the same rng seed draws the same order — a resumed day keeps its agent", () => {
  const entries = rosterEntries(CONFIG);
  const one = orderCandidates({ entries, last: null, rng: mulberry32(42) }).map((e) => e.id);
  const two = orderCandidates({ entries, last: null, rng: mulberry32(42) }).map((e) => e.id);
  assert.deepEqual(one, two);
});

test("pickOrder reads the mode off config and the previous day off the index", () => {
  const rows = [{ date: "2026-09-20", agent: "codex", rosterId: "codex" }];
  const { order, last, avoidRepeat } = pickOrder(CONFIG, rows, mulberry32(1));
  assert.equal(avoidRepeat, "hard");
  assert.equal(last.agent, "codex");
  assert.equal(order[0].agent, "claude");
  assert.equal(order[order.length - 1].id, "codex");
  assert.equal(pickOrder({ roster: { avoidRepeat: true, entries: [{ agent: "claude" }] } }, [], mulberry32(1)).avoidRepeat, "hard", "true is an alias for hard");
  assert.deepEqual(pickOrder({}, rows, mulberry32(1)).order, [], "no roster block = nothing to draw");
});

test("describeEntry says the slot, the model and whether ultracode is on", () => {
  const [ultra, , codex] = rosterEntries(CONFIG);
  assert.equal(describeEntry(ultra), "claude-opus-ultracode (claude · opus · ultracode)");
  assert.equal(describeEntry(codex), "codex (codex)");
  assert.equal(describeEntry(null), "none");
});
