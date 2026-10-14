import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { TenxtenChallengeCardV1, layoutTenxtenCard, normalizeTenxten } from "./tenxten-challenge-card";

const render = (
  props: Parameters<typeof TenxtenChallengeCardV1.render>[0] = {},
  w = 1920,
  h = 1080,
) => TenxtenChallengeCardV1.render({ ...TenxtenChallengeCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

// A 32-character name to stress the name column, ten rows.
const STRESS_GAMES = Array.from({ length: 10 }, (_, i) => ({
  name: i === 0 ? "Pandemic Legacy Season 1 Big Box" : `Sample Game Number ${i}`,
  plays: [10, 10, 10, 10, 10, 10, 8, 6, 4, 3][i],
}));

describe("@one-a-day/gaming/tenxten-challenge-card/v1", () => {
  it("binds the challenger, the year, every game cell and the accent - and nothing is rejected", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: TenxtenChallengeCardV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.challenger).toHaveLength(1);
    expect(byProp.year).toHaveLength(1);
    expect(byProp.games).toHaveLength(20); // 10 rows x (name + plays)
    expect(byProp.accent).toHaveLength(2); // the filled-pip mask + the pace bar (defaults are ahead)
  });

  it("computes the headline, the totals and the pace from the list - nothing typed twice", () => {
    const L = normalizeTenxten({});
    const plays = L.games.reduce((s, g) => s + g.plays, 0);
    expect(L.n).toBe(L.games.length);
    expect(L.target).toBe(L.n * L.goal);
    expect(L.playsTotal).toBe(plays);
    expect(plays).toBe(81); // the sample October: six games done, an 8-6-4-3 tail
    expect(L.playsText).toBe(`${plays} / 100`);
    expect(L.done).toBe(L.games.filter((g) => g.plays >= L.goal).length);
    expect(L.doneText).toBe("6 / 10");
    expect(L.headline).toBe("10 x 10 CHALLENGE");
    expect(L.pace).toBeCloseTo((100 * 287) / 365, 10);
    expect(L.paceText).toBe("2 ahead");
    expect(L.ahead).toBe(true);
  });

  it("follows the list and the goal - the headline cannot lie", () => {
    const five = normalizeTenxten({ games: STRESS_GAMES.slice(0, 5) });
    expect(five.headline).toBe("5 x 10 CHALLENGE");
    expect(five.target).toBe(50);
    expect(five.playsText).toBe(`${five.playsTotal} / 50`);
    expect(five.doneText).toBe(`${five.done} / 5`);
    const g5 = normalizeTenxten({ goal: 5 });
    expect(g5.headline).toBe("10 x 5 CHALLENGE");
    expect(g5.playsText).toBe("81 / 50");
    expect(g5.doneText).toBe("8 / 10");
    expect(normalizeTenxten({ dayOfYear: 366 }).paceText).toBe("19 behind");
    const onPace = normalizeTenxten({ games: STRESS_GAMES.map((g, i) => ({ ...g, plays: i < 7 ? 10 : [7, 1, 1][i - 7] })) });
    expect(onPace.playsTotal).toBe(79);
    expect(onPace.paceText).toBe("on pace");
    expect(onPace.ahead).toBe(false);
  });

  it("pips are square, one size, exactly goal per row, fill = min(plays, goal) - from the lattice", () => {
    const L = layoutTenxtenCard({}, 1920, 1080);
    expect(L.pips).toHaveLength(L.p.n * L.p.goal);
    // one size across the whole grid, square by construction (w = h = side)
    expect(new Set(L.pips.map((q) => q.side)).size).toBe(1);
    // every row has exactly goal pips, on the lattice's own columns
    for (let r = 0; r < L.p.n; r++) {
      const row = L.pips.filter((q) => q.row === r).sort((a, b) => a.k - b.k);
      expect(row).toHaveLength(L.p.goal);
      const filled = row.filter((q) => q.filled);
      expect(filled.length).toBe(Math.min(L.p.games[r].plays, L.p.goal));
      expect(filled.every((q) => q.k < filled.length)).toBe(true); // the FIRST pips fill
      for (const q of row) {
        expect(q.x).toBeGreaterThanOrEqual(L.trackX);
        expect(q.x + q.side).toBeLessThanOrEqual(L.trackX + L.trackW);
        expect(q.y + q.side).toBeLessThanOrEqual(L.maskRect.y + L.maskRect.h);
      }
    }
    // rows equal height: the lattice's row lines are one pitch (within the engine's 1px)
    const rowYs = [...new Set(L.pips.map((q) => q.y))];
    expect(rowYs).toHaveLength(L.p.n);
    rowYs.slice(1).forEach((yy, i) => expect(Math.abs(yy - rowYs[i] - L.rowPitch)).toBeLessThanOrEqual(1));
    // the lattice is the only geometry: the paths hold every pip - a solid
    // circle per filled pip (one M), a ring per empty pip (outer M + hole M)
    expect((L.filledPath.match(/M/g) ?? []).length).toBe(L.pips.filter((q) => q.filled).length);
    expect((L.emptyPath.match(/M/g) ?? []).length).toBe(2 * L.pips.filter((q) => !q.filled).length);
    expect((L.filledPath.match(/a/g) ?? []).length).toBe(2 * L.pips.filter((q) => q.filled).length);
  });

  it("over-goal clamps the track and the count tells; zero renders an empty track", () => {
    const over = layoutTenxtenCard({ games: [{ name: "Wingspan", plays: 12 }, { name: "Azul", plays: 0 }] }, 1920, 1080);
    const row = (r: number) => over.pips.filter((q) => q.row === r).sort((a, b) => a.k - b.k);
    expect(row(0).filter((q) => q.filled).length).toBe(10); // goal, not 12
    expect(over.cells.find((c) => c.label === "game-count-0")!.text).toBe("12");
    expect(row(1).filter((q) => q.filled).length).toBe(0);
    expect(over.cells.find((c) => c.label === "game-count-1")!.text).toBe("0");
    expect(over.pips.every((q) => q.side === over.pipSide)).toBe(true);
    const zero = layoutTenxtenCard({ games: [{ name: "Wingspan", plays: 0 }] }, 1920, 1080);
    expect(zero.filledPath).toBe(""); // no filled mask at all - nothing half-drawn
  });

  it("refuses a bad prop by name, not a clipped card", () => {
    expect(() => normalizeTenxten({ games: [] })).toThrow(/1 to 10 games/);
    expect(() => normalizeTenxten({ games: new Array(11).fill({ name: "Azul", plays: 1 }) })).toThrow(/1 to 10 games/);
    expect(() => normalizeTenxten({ games: [{ name: "", plays: 1 }] })).toThrow(/games\[0\]\.name/);
    expect(() => normalizeTenxten({ games: [{ name: "x".repeat(41), plays: 1 }] })).toThrow(/games\[0\]\.name/);
    expect(() => normalizeTenxten({ games: [{ name: "Azul, 2nd ed.", plays: 1.5 }] })).toThrow(/games\[0\]\.plays/);
    expect(() => normalizeTenxten({ games: [{ name: "Azul", plays: 100 }] })).toThrow(/games\[0\]\.plays/);
    expect(() => normalizeTenxten({ goal: 0 })).toThrow(/goal/);
    expect(() => normalizeTenxten({ dayOfYear: 367 })).toThrow(/dayOfYear/);
    expect(() => normalizeTenxten({ year: 1899 })).toThrow(/year/);
    expect(() => normalizeTenxten({ challenger: "x".repeat(33) })).toThrow(/challenger/);
    expect(() => normalizeTenxten({ accent: "brick" })).toThrow(/#rrggbb/);
    expect(() => normalizeTenxten({ accent: "#f0ead8" })).toThrow(/3:1/); // too close to the light page
    expect(() => normalizeTenxten({ preset: "dark", accent: "#20242a" })).toThrow(/3:1/); // and to the dark one
  });

  it("refuses a name that cannot fit its cell at a small canvas, naming the game", () => {
    const wide = Array.from({ length: 10 }, () => ({ name: "W".repeat(40), plays: 3 }));
    expect(() => layoutTenxtenCard({ games: wide }, 480, 270)).toThrow(/games\[0\]\.name/);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1920, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const overs: Partial<Parameters<typeof TenxtenChallengeCardV1.render>[0]>[] = [
      {},
      { games: STRESS_GAMES }, // a 32-character name, ten rows
      { challenger: "" },
      { preset: "dark" },
      { goal: 5 },
      { games: [{ name: "Wingspan", plays: 12 }, { name: "Azul", plays: 0 }] },
      { dayOfYear: 366 }, // 19 behind: no pace bar, the grid rises one bar's worth
    ];
    for (const over of overs) {
      await sweepLayout((p, ctx) => TenxtenChallengeCardV1.render(p, ctx).then(asDocument), "@one-a-day/gaming/tenxten-challenge-card/v1", { ...TenxtenChallengeCardV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("stacks the same sections on landscape, square and portrait - and the columns line up", () => {
    const order = (W: number, H: number) => {
      const L = layoutTenxtenCard({}, W, H);
      const y = (label: string) => L.cells.find((c) => c.label === label)!.rect.y;
      expect(y("mark")).toBeLessThan(y("tile-value-0"));
      expect(y("tile-value-0")).toBeLessThan(y("game-name-0"));
      expect(y("game-name-0")).toBeLessThan(y("game-name-9"));
      expect(y("game-count-9")).toBeLessThan(y("footnote"));
      // name cells share the left edge; counts share the right edge
      const names = L.cells.filter((c) => c.label.startsWith("game-name-"));
      const counts = L.cells.filter((c) => c.label.startsWith("game-count-"));
      expect(new Set(names.map((c) => c.rect.x)).size).toBe(1);
      expect(new Set(counts.map((c) => c.rect.x + c.rect.w)).size).toBe(1);
    };
    order(1920, 1080);
    order(1080, 1080);
    order(1080, 1920);
  });

  it("is deterministic and rejects props of the wrong kind", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ year: "2026" as never })).rejects.toThrow(/year/);
    await expect(render({ games: "Wingspan" as never })).rejects.toThrow(/games/);
    await expect(render({ preset: "paper" as never })).rejects.toThrow(/preset/);
  });
});
