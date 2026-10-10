import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, checkLayoutIntent, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { GolfRoundScorecardV1 as T, golfMarkOf, golfMarkPath, golfSigned, layoutGolfCard, normalizeGolfCard } from "./golf-round-scorecard";
import type { GolfRoundScorecardProps } from "./golf-round-scorecard";

const ID = "@one-a-day/sports/golf-round-scorecard/v1";
const render = (p: GolfRoundScorecardProps = {}, w = 1920, h = 1080) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: GolfRoundScorecardProps, w = 1920, h = 1080) => Object.fromEntries(layoutGolfCard(p, w, h).cells.map((c) => [c.label, c.text.replace(/\n/g, " ")]));
const PARS = T.defaultProps!.pars as number[];
const SCORES = T.defaultProps!.scores as number[];
const NINE = { pars: PARS.slice(0, 9), scores: SCORES.slice(0, 9) };
const EAGLE_ROUND: GolfRoundScorecardProps = {
  ...T.defaultProps,
  // hole 11: a par 4 in 2 is an eagle (two rings); hole 3 (par 5, 6) stays a bogey.
  scores: SCORES.map((s, i) => (i === 10 ? 2 : s)),
};
const ACE_ROUND: GolfRoundScorecardProps = { ...T.defaultProps, scores: SCORES.map((s, i) => (i === 3 ? 1 : s)) };

// The copy that stresses the card: a 40-character course, a 28-character tees
// line, the longest golfer and date, an eagle and an ace in the same round.
const LONG: GolfRoundScorecardProps = {
  course: "Juniper Links Golf and Country Club, N.",
  tees: "Blue - 72.8/143 championship",
  golfer: "the_quick_brown_fox_jumps_ov",
  date: "Sat, Oct 10, 2026 - the 4-ball",
  pars: PARS,
  scores: [4, 4, 6, 1, 5, 6, 3, 6, 4, 7, 3, 5, 3, 5, 4, 6, 5, 8],
};
const CASES: GolfRoundScorecardProps[] = [
  {},
  LONG,
  { ...LONG, preset: "light" },
  NINE,
  { ...NINE, tees: "", golfer: "", date: "" },
  EAGLE_ROUND,
  ACE_ROUND,
  { course: "Zoë Åström Muni", golfer: "Zoë Åström", date: "Łódź, 10 Oct" },
  { accent: "#E4572E", preset: "light" },
];

describe(ID, () => {
  it("shows the use case at its defaults: a course, two strips, the nines, the totals and the legend", () => {
    const t = textOf({});
    expect(t).toMatchObject({
      course: "Juniper Links", tees: "White - 69.6/128", golfer: "dana_h", date: "Oct 10, 2026",
      "gutter-0-hole": "HOLE", "gutter-0-par": "PAR", "gutter-0-score": "SCORE",
      "hole-0": "1", "par-0": "4", "score-0": "5",
      "hole-6": "7", "par-6": "4", "score-6": "3",
      "nine-0": "OUT", "nine-par-0": "36", "nine-score-0": "42",
      "nine-1": "IN", "nine-par-1": "36", "nine-score-1": "47",
      nines: "OUT 42 (+6) - IN 47 (+11) - par 72",
      total: "89", vspar: "+17 vs par",
      "legend-0": "1 under", "legend-1": "2+ under", "legend-2": "1 over", "legend-3": "2+ over",
      footnote: "These are the paper scorecard's own marks; a filled ring is a hole in one.",
    });
    expect(Object.keys(t).filter((k) => /^hole-/.test(k))).toHaveLength(18);
    expect(Object.keys(t).filter((k) => /^par-/.test(k))).toHaveLength(18);
    expect(Object.keys(t).filter((k) => /^score-/.test(k))).toHaveLength(18);
    expect(T.outputHints).toMatchObject({ width: 1920, height: 1080, format: { kind: "image" } });
    expect(T.defaultProps).toMatchObject({ preset: "dark", course: "Juniper Links" });
  });

  it("works out the marks, the nines and the totals from pars and scores alone", () => {
    expect([-3, 0, 6, 17].map(golfSigned)).toEqual(["-3", "E", "+6", "+17"]);
    // The default round: a birdie on 7, a double on 8, a triple on 18, pars elsewhere.
    expect(golfMarkOf(4, 3)).toBe("ring");
    expect(golfMarkOf(5, 3)).toBe("ring2");
    expect(golfMarkOf(4, 5)).toBe("square");
    expect(golfMarkOf(4, 6)).toBe("square2");
    expect(golfMarkOf(5, 8)).toBe("square2");
    expect(golfMarkOf(3, 3)).toBe("none");
    expect(golfMarkOf(3, 1)).toBe("ace");
    expect(golfMarkOf(5, 1)).toBe("ace");
    const p = normalizeGolfCard({});
    expect([p.total, p.parTotal, p.toPar]).toEqual([89, 72, 17]);
    expect(p.nines.map((n) => [n.name, n.par, n.score, n.toPar])).toEqual([["OUT", 36, 42, 6], ["IN", 36, 47, 11]]);
    expect(p.holes.filter((h) => h.mark === "ring")).toEqual([expect.objectContaining({ hole: 7 })]);
    expect(p.holes.filter((h) => h.mark === "square2").map((h) => h.hole)).toEqual([8, 10, 16, 17, 18]);
    expect(p.holes.filter((h) => h.mark === "square").map((h) => h.hole)).toEqual([1, 3, 5, 6, 9, 12, 14]);
    expect(p.holes.filter((h) => h.mark === "none").map((h) => h.hole)).toEqual([2, 4, 11, 13, 15]);
    // A 9-hole round renders one strip and its own totals.
    const nine = normalizeGolfCard(NINE);
    expect([nine.nines.length, nine.total, nine.toPar]).toEqual([1, 42, 6]);
    expect(nine.nineLine).toBe("OUT 42 (+6) - par 36");
    expect(textOf(NINE).total).toBe("42");
    expect(textOf(NINE)["nine-1"]).toBeUndefined();
    // An under-par round prints the to-par line with the minus sign.
    const under = normalizeGolfCard({ pars: PARS, scores: PARS });
    expect([under.total, under.toPar, under.vsText]).toEqual([72, 0, "E vs par"]);
    expect(normalizeGolfCard({ pars: PARS, scores: SCORES.map((s) => s - 2) }).vsText).toBe("-19 vs par");
  });

  it("draws every mark the round earns - snug around its number, inside its cell - and none it does not", async () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      for (const q of [{}, EAGLE_ROUND, ACE_ROUND, NINE]) {
        const L = layoutGolfCard(q, w, h);
        const p = L.p;
        const resolved = checkLayoutIntent(await render(q, w, h), w, h)!.resolved;
        p.holes.forEach((hole, i) => {
          const mk = L.marks.find((x) => x.label === `mark-${i}`);
          if (hole.mark === "none") { expect(mk).toBeUndefined(); return; }
          expect(mk).toBeDefined();
          expect(mk!.kind).toBe(hole.mark);
          expect(resolved[`mark-${i}`]).toBeDefined();
          // square and centred in its cell, never wider or taller than the cell
          expect(Math.abs(mk!.rect.w - mk!.rect.h)).toBeLessThanOrEqual(1);
          const cell = resolved[`score-${i}`][0].rect;
          expect(Math.abs(mk!.rect.x + mk!.rect.w / 2 - (cell.x + cell.w / 2))).toBeLessThanOrEqual(2);
          expect(Math.abs(mk!.rect.y + mk!.rect.h / 2 - (cell.y + cell.h / 2))).toBeLessThanOrEqual(2);
          expect(Math.max(mk!.rect.w, mk!.rect.h)).toBeLessThanOrEqual(Math.min(cell.w, cell.h) * 0.96 + 2);
        });
        // the legend always shows the four shape kinds, whatever the round earned
        for (const kind of ["ring", "ring2", "square", "square2"] as const) {
          expect(L.marks.filter((x) => x.label.startsWith("legend-mark-") && x.kind === kind)).toHaveLength(1);
        }
        // an ace paints its mark in the accent and its digit in the readable ink over it
        const ace = p.holes.find((x) => x.mark === "ace");
        if (ace) {
          const mk = L.marks.find((x) => x.label === `mark-${ace.hole - 1}`)!;
          expect(mk.color).toBe(p.accent);
          expect(golfMarkPath("ace", mk.rect.w)).toMatch(/^M[^z]+z$/);
        }
      }
    }
    expect(layoutGolfCard({ ...T.defaultProps, scores: PARS } as GolfRoundScorecardProps, 1920, 1080).marks.filter((x) => !x.label.startsWith("legend-"))).toHaveLength(0);
  });

  it("keeps its contract from 9 to 18 holes at the seven contract canvases, with nothing colliding", async () => {
    for (const p of CASES) {
      await sweepLayout((q, ctx) => T.render(q, ctx).then(asDocument), ID, p, targetCtx);
      for (const [w, h] of CONTRACT_CANVASES) {
        const L = layoutGolfCard(p, w, h);
        const doc = await render(p, w, h);
        const ev = evaluateM0(String(doc.m0), { width: w, height: h });
        expect(ev.feasible && ev.meetsPrecision).toBe(true);
        // Every source is labelled and promised something; every text promises that it fits.
        const intent = layoutIntentOf(doc)!;
        for (const s of doc.sources ?? []) {
          expect(s.editor?.label).toBeTruthy();
          expect(intent.constraints.some((c) => c.label === s.editor?.label)).toBe(true);
          if (s.type === "text") expect(intent.constraints.some((c) => c.label === s.editor?.label && c.textFits)).toBe(true);
        }

        // Inside the margins, never below the floor, never cut, never ellipsized.
        for (const c of L.cells) {
          expect(c.px).toBeGreaterThanOrEqual(L.small);
          expect(c.text).not.toContain("...");
          expect(c.rect.x).toBeGreaterThanOrEqual(L.m);
          expect(c.rect.y).toBeGreaterThanOrEqual(L.m);
          expect(c.rect.x + c.rect.w).toBeLessThanOrEqual(w - L.m);
          expect(c.rect.y + c.rect.h).toBeLessThanOrEqual(h - L.m);
        }
        // No two texts overlap; a text overlaps only the mark that belongs to its own hole.
        const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        for (let i = 0; i < L.cells.length; i++) for (let j = i + 1; j < L.cells.length; j++) {
          if (hit(L.cells[i].rect, L.cells[j].rect)) throw new Error(`${L.cells[i].label} overlaps ${L.cells[j].label} at ${w}x${h}`);
        }
        for (const mk of L.marks) for (const c of L.cells) {
          const own = c.label === `score-${mk.label.slice(5)}`;
          if (!own && hit(mk.rect, c.rect)) throw new Error(`${c.label} overlaps ${mk.label} at ${w}x${h}`);
        }
        // The strips are one height, the hole columns one size, the gutter one width; the score row is the tallest.
        for (const s of L.strips) {
          expect(s.colX).toHaveLength(9);
          expect(new Set(s.colX.map((x, i) => Math.round((s.colX[i === 0 ? 1 : i] - x)))).size).toBeLessThanOrEqual(2);
          expect(s.rowH[2]).toBeGreaterThan(s.rowH[0]);
        }
        if (L.strips.length === 2) expect(Math.abs(L.strips[0].rect.h - L.strips[1].rect.h)).toBeLessThanOrEqual(2);
        // The bands: header in the top quarter, footnote in the bottom fifth, the total the largest text on the card.
        const cell = (label: string) => L.cells.find((c) => c.label === label)!;
        expect(cell("course").rect.y + cell("course").rect.h).toBeLessThanOrEqual(h * 0.3);
        expect(cell("footnote").rect.y).toBeGreaterThanOrEqual(h * 0.8);
        const others = Math.max(...L.cells.filter((c) => c.label !== "total").map((c) => c.px));
        expect(cell("total").px).toBeGreaterThanOrEqual(others * 1.4);
        // One score size everywhere, and every hole column equal within the pixel or two quantization takes.
        expect(new Set(L.cells.filter((c) => /^score-/.test(c.label)).map((c) => c.px)).size).toBe(1);
        const resolved = checkLayoutIntent(doc, w, h)!.resolved;
        const first = resolved["par-0"][0].rect;
        for (let i = 1; i < 9; i++) {
          const r = resolved[`par-${i}`][0].rect;
          expect(Math.abs(r.w - first.w)).toBeLessThanOrEqual(2);
          expect(Math.abs(r.x - (first.x + i * first.w))).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("binds what it shows: the header lines, every par and every score; derived text stays unbound", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    expect(Object.fromEntries(Object.entries(byProp).map(([key, v]) => [key, v.length]))).toEqual({ course: 1, tees: 1, golfer: 1, date: 1, accent: 1, pars: 18, scores: 18 });
    const bare = (await render({ tees: "", golfer: "", date: "" })).sources!.filter((s) => s.editor?.binding).length;
    expect(bare).toBe(2 + 18 + 18);
  });

  it("follows the accent and the preset, with the page as the document background", async () => {
    const dark = await render(), light = await render({ preset: "light", accent: "#E4572E" });
    expect([dark.backgroundColor, light.backgroundColor]).toEqual(["#0e1613", "#f4f1e8"]);
    const L = layoutGolfCard({ preset: "light", accent: "#E4572E" }, 1920, 1080);
    expect(L.cells.find((c) => c.label === "total")!.color).toBe("#e4572e");
    expect(L.tiles.map((t) => t.color)).toEqual(["#e3e1d8", "#e3e1d8"]);
  });

  it("draws accented Latin names: every character it accepts has a glyph in both weights", () => {
    expect(textOf({ course: "Zoë Åström Muni" }).course).toBe("Zoë Åström Muni");
    expect(() => normalizeGolfCard({ course: "魔方" as unknown as string })).toThrow(/course .*not known to draw/);
    expect(() => normalizeGolfCard({ tees: "White → Blue" })).toThrow(/tees .*not known to draw/);
  });

  it("is deterministic, follows ctx.target when nested, and passes its own contract with the overlay on", async () => {
    expect(await render()).toEqual(await render());
    const ctx = targetCtx(480, 270);
    ctx.output.width = 3840;
    ctx.output.height = 2160;
    expect(await T.render({}, ctx).then(asDocument)).toEqual(await render({}, 480, 270));
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
    expect((await render({ ...LONG, debugLayout: true }, 1080, 1920)).editor).toMatchObject({ layoutContract: { ok: true } });
    expect((await render({ ...ACE_ROUND, debugLayout: true }, 640, 360)).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it.each<[string, GolfRoundScorecardProps, RegExp]>([
    ["ten pars", { pars: [...PARS.slice(0, 9), 4] }, /pars has 10 entries; a round is 9 holes \(one strip\) or 18 \(two\)/],
    ["eight pars", { pars: PARS.slice(0, 8) }, /pars has 8 entries/],
    ["scores against the pars", { scores: SCORES.slice(0, 9) }, /scores has 9 entries against 18 pars; every hole needs both/],
    ["a par of 2", { pars: PARS.map((v, i) => (i === 0 ? 2 : v)) }, /pars\[0\] 2 is outside 3 to 6/],
    ["a par of 7", { pars: PARS.map((v, i) => (i === 0 ? 7 : v)) }, /pars\[0\] 7 is outside 3 to 6/],
    ["a score of 0", { scores: SCORES.map((v, i) => (i === 0 ? 0 : v)) }, /scores\[0\] 0 is outside 1 to 99/],
    ["a fractional score", { scores: SCORES.map((v, i) => (i === 0 ? 4.5 : v)) }, /scores\[0\] 4\.5 is not an integer/],
    ["pars that is not a list", { pars: "4,4,5" as unknown as number[] }, /pars must be a list of 9 or 18 integers/],
    ["a 41-character course", { course: "W".repeat(41) }, /course .* is 41 characters; the card fits at most 40/],
    ["a 29-character tees", { tees: "W".repeat(29) }, /tees .* is 29 characters/],
    ["a course that is not a string", { course: 42 as unknown as string }, /course must be a string/],
    ["an unknown preset", { preset: "sepia" as never }, /preset "sepia" must be "dark" or "light"/],
    ["a bad accent", { accent: "fairway" }, /accent "fairway" must be #rrggbb/],
    ["a debugLayout that is not a boolean", { debugLayout: "yes" as never }, /debugLayout must be a boolean/],
  ])("rejects %s by name, without falling back to the sample", (_name, props, message) => {
    expect(() => normalizeGolfCard(props)).toThrow(message);
    expect(() => normalizeGolfCard(props)).toThrow(new RegExp(`^${ID.replace(/[/]/g, "\\/")}: `));
  });

  it("refuses copy it cannot fit instead of clipping it", () => {
    expect(() => layoutGolfCard({ course: "W".repeat(40), tees: "W".repeat(28), golfer: "W".repeat(32), date: "W".repeat(32) }, 160, 90)).toThrow(/cannot be fitted on 160x90/);
  });
});
