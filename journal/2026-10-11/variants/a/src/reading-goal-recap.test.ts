import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { fmtInt, fmtRating, normalizeReadingCard, readingPace, ReadingGoalRecapV1 } from "./reading-goal-recap";

const render = (
  props: Parameters<typeof ReadingGoalRecapV1.render>[0] = {},
  w = 1280,
  h = 720,
) => ReadingGoalRecapV1.render({ ...ReadingGoalRecapV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

describe("@one-a-day/personal/reading-goal-recap/v1", () => {
  it("computes the pace line the wrap-ups compute by hand: pace = goal x dayOfYear / 365", () => {
    // 52 books at day 304: pace 43.3, so 46 is three ahead - the default card's claim.
    const p = readingPace(52, 46, 304);
    expect(p.pace).toBeCloseTo((52 * 304) / 365, 6);
    expect(p.deltaText).toBe("3 ahead of pace");
    // Kami's line: 88 of 125 well into the year is behind.
    expect(readingPace(125, 88, 304).deltaText).toBe("16 behind pace");
    // Exactly on pace rounds to the honest words.
    expect(readingPace(52, 43, 302).deltaText).toBe("on pace");
  });

  it("keeps every printed number consistent: progress, pct, clamped fill, and the goal text", () => {
    const n = normalizeReadingCard({ goalTotal: 52, booksSoFar: 46, dayOfYear: 304 });
    expect(n.progress).toBeCloseTo(46 / 52, 6);
    expect(n.pctText).toBe("88% of goal");
    expect(n.goalText).toBe("46 of 52");
    expect(n.fillFrac).toBeCloseTo(0.8846, 3);
    expect(n.paceFrac).toBeCloseTo(304 / 365, 3);
    // Past the goal (159 of 100 happens): the fill clamps at full, the delta still tells.
    const over = normalizeReadingCard({ goalTotal: 100, booksSoFar: 159, dayOfYear: 304 });
    expect(over.fillFrac).toBe(1);
    expect(over.pctText).toBe("159% of goal");
    expect(over.deltaText).toContain("ahead");
  });

  it("formats numbers and ratings deterministically", () => {
    expect(fmtInt(4703)).toBe("4,703");
    expect(fmtInt(1000000)).toBe("1,000,000");
    expect(fmtInt(42)).toBe("42");
    expect(fmtRating(5)).toBe("5");
    expect(fmtRating(4.5)).toBe("4.5");
  });

  it("binds every displayed prop - Make's double-click edits it in place", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1280, 720, { propsSchema: ReadingGoalRecapV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const prop of ["month", "reader", "books", "pages", "avgRating", "goalTotal", "booksSoFar", "dayOfYear", "titles", "accent"]) {
      expect(byProp[prop]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1920, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases - defaults and the copy that stresses it", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [
      {},
      { month: "September 2026", titles: [{ title: "A title long enough to have to shrink before it fits its row on a narrow canvas", rating: 4.5 }] },
      { titles: [], reader: "" },
      { goalTotal: 100, booksSoFar: 159, dayOfYear: 304 },
    ]) {
      await sweepLayout((p, ctx) => ReadingGoalRecapV1.render(p, ctx).then(asDocument), "@one-a-day/personal/reading-goal-recap/v1", { ...ReadingGoalRecapV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
  });

  it("refuses bad input by name: half-step ratings, out-of-range counts, a long title", async () => {
    await expect(render({ titles: [{ title: "Fine", rating: 4.7 }] })).rejects.toThrow(/half step/);
    await expect(render({ books: -1 })).rejects.toThrow(/books/);
    await expect(render({ dayOfYear: 400 })).rejects.toThrow(/dayOfYear/);
    await expect(render({ goalTotal: 0 })).rejects.toThrow(/goalTotal/);
    await expect(render({ month: 42 as never })).rejects.toThrow(/must be a string/);
    await expect(render({ titles: [{ title: "x".repeat(81), rating: 5 }] })).rejects.toThrow(/80/);
  });
});
