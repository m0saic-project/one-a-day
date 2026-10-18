import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  Wh40kRosterCardV1,
  layoutWh40kRosterCard,
  normalizeWh40kRosterCard,
  type Wh40kUnit,
} from "./wh40k-roster-card";

const render = (
  props: Parameters<typeof Wh40kRosterCardV1.render>[0] = {},
  w = 1080,
  h = 1920,
) => Wh40kRosterCardV1.render({ ...Wh40kRosterCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

const labels = (doc: Awaited<ReturnType<typeof render>>) =>
  (doc.sources ?? []).map((s) => (s as { editor?: { label?: string } }).editor?.label ?? null);

describe("@one-a-day/gaming/wh40k-roster-card/v1", () => {
  const allCategories = ["HQ", "TR", "EL", "FA", "HS", "FL", "LW", "DT"].map((category, i) => ({
    name: `Unit ${i}`,
    models: i + 1,
    points: (i + 1) * 10,
    category,
    enhancement: i === 0 ? "Rites of War" : undefined,
    warlord: i === 0 ? "WARLORD" : undefined,
  }));
  const maxRows = new Array(20).fill(null).map((_, i) => ({
    name: `Unit ${i}`,
    models: 1,
    points: 10,
    category: (i % 2 === 0 ? "TR" : "EL") as "TR" | "EL",
  }));

  it("binds every prop that is shown on the canvas", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1920, { propsSchema: Wh40kRosterCardV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.armyName?.length).toBeGreaterThanOrEqual(1);
    expect(byProp.faction?.length).toBeGreaterThanOrEqual(1);
    expect(byProp.detachment?.length).toBeGreaterThanOrEqual(1);
    expect(byProp.pointsUsed?.length).toBeGreaterThanOrEqual(1);
    expect(byProp.pointsLimit?.length).toBeGreaterThanOrEqual(1);
    expect(byProp.units?.length).toBeGreaterThanOrEqual(24); // default 6 rows x at least 4 bound rects
    expect(byProp.accent?.length).toBeGreaterThanOrEqual(1);
  });

  it("shows the points totals in the header pill and the footer", async () => {
    const doc = await render();
    const texts = (doc.sources ?? [])
      .filter((s) => (s as { type?: string }).type === "text")
      .map((s) => (s as { layers?: Array<{ content?: { text?: string } }> }).layers?.[0]?.content?.text ?? "");
    expect(texts).toContain("1995/2000");
    expect(texts).toContain("1995 / 2000 PTS");
  });

  it("ships the briefed default points: 1995/2000 and units that sum to it", () => {
    const defaults = Wh40kRosterCardV1.defaultProps as { pointsUsed: number; pointsLimit: number; units: Wh40kUnit[] };
    expect(defaults.pointsUsed).toBe(1995);
    expect(defaults.pointsLimit).toBe(2000);
    expect(defaults.units.reduce((sum, u) => sum + u.points, 0)).toBe(1995);
  });

  it("refuses a bad prop by name, not a clipped card", () => {
    expect(() => normalizeWh40kRosterCard({ units: [] })).toThrow(/units.*at least 1/);
    expect(() =>
      normalizeWh40kRosterCard({ units: new Array(21).fill(null).map(() => ({ name: "x", models: 1, points: 1, category: "HQ" })) }),
    ).toThrow(/20/);
    expect(() => normalizeWh40kRosterCard({ units: [{ name: "Captain", models: 1, points: 1, category: "XX" }] })).toThrow(/HQ, TR, EL, FA, HS, FL, LW, DT/);
    expect(() => normalizeWh40kRosterCard({ units: [{ name: "x".repeat(49), models: 1, points: 1, category: "HQ" }] })).toThrow(/48/);
    expect(() => normalizeWh40kRosterCard({ units: [{ name: "Captain", models: -1, points: 1, category: "HQ" }] })).toThrow(/models.*outside/);
    expect(() => normalizeWh40kRosterCard({ armyName: "Legión" })).toThrow(/printable ASCII/);
    expect(() => normalizeWh40kRosterCard({ accent: "red" })).toThrow(/#rrggbb/);
    expect(() => normalizeWh40kRosterCard({ preset: "neon" as never })).toThrow(/must be "dark" or "light"/);
  });

  it("draws unit rows as one uniform list - equal height, in order", () => {
    const L = layoutWh40kRosterCard({}, 1080, 1920);
    expect(L.rows).toHaveLength(6);
    const heights = new Set(L.rows.map((r) => r.rect.h));
    expect(heights.size).toBe(1);
    for (let i = 1; i < L.rows.length; i++) expect(L.rows[i].rect.y).toBeGreaterThanOrEqual(L.rows[i - 1].rect.y);
  });

  it("draws category badges as equal squares", () => {
    const L = layoutWh40kRosterCard({}, 1080, 1920);
    expect(L.badges.length).toBe(6);
    const sizes = new Set(L.badges.map((b) => `${b.rect.w}x${b.rect.h}`));
    expect(sizes.size).toBe(1);
    for (const b of L.badges) expect(b.rect.w).toBe(b.rect.h);
  });

  it("uses two columns in landscape when there are enough rows", () => {
    const many = new Array(8).fill(null).map((_, i) => ({ name: `Unit ${i}`, models: 1, points: 10, category: "TR" as const }));
    const wide = layoutWh40kRosterCard({ units: many }, 1920, 1080);
    expect(wide.useTwoCols).toBe(true);
    expect(wide.cols).toBe(2);
    const tall = layoutWh40kRosterCard({ units: many }, 1080, 1920);
    expect(tall.useTwoCols).toBe(false);
    expect(tall.cols).toBe(1);
  });

  it("removes optional chips cleanly when not set", async () => {
    const withChips = labels(await render());
    expect(withChips.some((l) => l !== null && l.startsWith("warlord-"))).toBe(true);
    expect(withChips.some((l) => l !== null && l.startsWith("enh-"))).toBe(true);
    const defaults = Wh40kRosterCardV1.defaultProps.units as Wh40kUnit[];
    const noChips = labels(await render({ units: defaults.map((u) => ({ ...u, enhancement: undefined, warlord: "" })) }));
    expect(noChips.some((l) => l !== null && l.startsWith("warlord-"))).toBe(false);
    expect(noChips.some((l) => l !== null && l.startsWith("enh-"))).toBe(false);
  });

  it("keeps its layout contract at the seven contract canvases - defaults, long copy, all categories, light preset", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [
      {},
      { armyName: "An army name that runs to the full forty-eight", faction: "Adeptus Astartes", detachment: "Gladius Task Force" },
      { units: allCategories },
      { units: [{ name: "x", models: 0, points: 0, category: "HQ" }] },
      { preset: "light" as const, accent: "#1f618d" },
      { pointsUsed: 1995, pointsLimit: 2000 },
    ]) {
      await sweepLayout(
        (p, ctx) => Wh40kRosterCardV1.render(p, ctx).then(asDocument),
        "@one-a-day/gaming/wh40k-roster-card/v1",
        { ...Wh40kRosterCardV1.defaultProps, ...over },
        (w, h) => targetCtx(w, h),
      );
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("fits a full 20-row roster on a large landscape canvas", async () => {
    await sweepLayout(
      (p, ctx) => Wh40kRosterCardV1.render(p, ctx).then(asDocument),
      "@one-a-day/gaming/wh40k-roster-card/v1",
      { ...Wh40kRosterCardV1.defaultProps, units: maxRows },
      (w, h) => targetCtx(w, h),
      [[1920, 1080], [3840, 2160]],
    );
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1920 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("is deterministic and rejects props of the wrong kind", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ armyName: 42 as never })).rejects.toThrow(/must be a string/);
    await expect(render({ units: "1x Captain" as never })).rejects.toThrow(/must be a list/);
    await expect(render({ pointsUsed: "1995" as never })).rejects.toThrow(/whole number/);
  });
});
