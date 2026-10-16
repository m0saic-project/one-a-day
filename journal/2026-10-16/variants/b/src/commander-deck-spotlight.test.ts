import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  CommanderDeckSpotlightV1,
  layoutSpotlightCard,
  normalizeSpotlight,
} from "./commander-deck-spotlight";

const render = (
  props: Parameters<typeof CommanderDeckSpotlightV1.render>[0] = {},
  w = 1920,
  h = 1080,
) => CommanderDeckSpotlightV1.render({ ...CommanderDeckSpotlightV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

const labels = (doc: Awaited<ReturnType<typeof render>>) =>
  (doc.sources ?? []).map((s) => (s as { editor?: { label?: string } }).editor?.label ?? null);

describe("@one-a-day/gaming/commander-deck-spotlight/v1", () => {
  it("binds every rect that shows a prop to it - deck, commander, pills, chips, curve, rows, plan", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: CommanderDeckSpotlightV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.deckName).toHaveLength(1);
    expect(byProp.commander).toHaveLength(1);
    expect(byProp.bracket).toHaveLength(1);
    expect(byProp.record).toHaveLength(1);
    expect(byProp.plan).toHaveLength(1);
    expect(byProp.manaIdentity).toHaveLength(6); // 3 chips + 3 chip letters
    expect(byProp.curve).toHaveLength(16); // 8 bars + 8 count labels (all default buckets non-zero)
    expect(byProp.highlights).toHaveLength(12); // 4 rows x (qty, name, note)
  });

  it("computes AVG MV and the spell count from the curve - never typed", () => {
    const L = normalizeSpotlight({});
    // independent recomputation of the default buckets
    const curve = [4, 10, 16, 13, 9, 6, 3, 2];
    const spells = curve.reduce((s, c) => s + c, 0);
    const weighted = curve.reduce((s, c, mv) => s + mv * c, 0);
    expect(L.spells).toBe(63);
    expect(L.avgText).toBe("2.84");
    expect(weighted).toBe(179);
    expect(L.figuresText).toBe("AVG MV 2.84 - 63 SPELLS");
    expect(L.avgMv).toBeCloseTo(179 / 63, 12);
    // and they follow the buckets when the buckets move
    const moved = normalizeSpotlight({ curve: [0, 0, 0, 0, 0, 0, 0, 4] });
    expect(moved.spells).toBe(4);
    expect(moved.avgText).toBe("7.00");
    expect(moved.figuresText).toBe("AVG MV 7.00 - 4 SPELLS");
  });

  it("draws one square mana chip per letter, in canonical WUBRG order", () => {
    expect(normalizeSpotlight({ manaIdentity: "WBR" }).colorLetters).toEqual(["W", "B", "R"]);
    expect(normalizeSpotlight({ manaIdentity: "RBW" }).colorLetters).toEqual(["W", "B", "R"]);
    expect(normalizeSpotlight({ manaIdentity: "gu" }).colorLetters).toEqual(["U", "G"]);
    expect(normalizeSpotlight({ manaIdentity: "" }).colorLetters).toEqual([]);
    const L = layoutSpotlightCard({}, 1920, 1080);
    const chips = L.tiles.filter((t) => /^chip-[WUBRG]$/.test(t.label));
    expect(chips.map((t) => t.label)).toEqual(["chip-W", "chip-B", "chip-R"]);
    for (const c of chips) expect(c.rect.w).toBe(c.rect.h);
  });

  it("bars are count / max(count) of the track, the longest fills it, and zero buckets draw no bar", () => {
    const L = layoutSpotlightCard({}, 1920, 1080);
    const bars = L.bars.filter((b) => b.rect !== null);
    expect(bars).toHaveLength(8);
    const longest = bars.reduce((a, b) => (b.rect!.w > a.rect!.w ? b : a));
    expect(longest.rect!.w).toBe(L.trackW);
    expect(longest.count).toBe(16);
    for (const b of bars) expect(b.rect!.w).toBe(Math.max(1, Math.round((L.trackW * b.count) / 16)));
    const one = layoutSpotlightCard({ curve: [0, 5, 0, 0, 0, 0, 0, 0] }, 1920, 1080);
    expect(one.bars.filter((b) => b.rect !== null)).toHaveLength(1);
    expect(one.bars[0].rect).toBeNull();
  });

  it("refuses a bad prop by name, not a clipped card", () => {
    expect(() => normalizeSpotlight({ curve: [1, 1, 1, 1, 1, 1, 1] })).toThrow(/curve.*exactly 8/);
    expect(() => normalizeSpotlight({ curve: [0, 0, 0, 0, 0, 0, 0, 0] })).toThrow(/curve.*sums to 0/);
    expect(() => normalizeSpotlight({ curve: [0, 0, 0, 0, 0, 0, 0, 100] })).toThrow(/outside 0 to 99/);
    expect(() => normalizeSpotlight({ bracket: 0 })).toThrow(/bracket.*outside 1 to 5/);
    expect(() => normalizeSpotlight({ bracket: 2.5 })).toThrow(/bracket.*whole number/);
    expect(() => normalizeSpotlight({ manaIdentity: "WZ" })).toThrow(/WUBRG/);
    expect(() => normalizeSpotlight({ manaIdentity: "WWB" })).toThrow(/repeats W/);
    expect(() => normalizeSpotlight({ highlights: [{ name: "A", qty: 1 }, { name: "B", qty: 1 }] })).toThrow(/3 to 6/);
    expect(() =>
      normalizeSpotlight({
        highlights: new Array(7).fill(null).map(() => ({ name: "Card", note: "", qty: 1 })),
      }),
    ).toThrow(/3 to 6/);
    expect(() => normalizeSpotlight({ highlights: [{ name: "x".repeat(49), qty: 1 }, { name: "B", qty: 1 }, { name: "C", qty: 1 }] }))
      .toThrow(/48/);
    expect(() => normalizeSpotlight({ highlights: [{ name: "A", qty: 0 }, { name: "B", qty: 1 }, { name: "C", qty: 1 }] }))
      .toThrow(/qty.*outside 1 to 99/);
    expect(() => normalizeSpotlight({ deckName: "Caesar\u2019s Legion" })).toThrow(/printable ASCII/);
    expect(() => normalizeSpotlight({ plan: "x".repeat(91) })).toThrow(/90/);
  });

  it("removes a part cleanly: an empty record or plan drops the pill or the footer, never a blank", async () => {
    const full = labels(await render());
    expect(full).toContain("record-pill");
    expect(full).toContain("plan");
    const noRecord = labels(await render({ record: "" }));
    expect(noRecord).not.toContain("record-pill");
    expect(noRecord).toContain("bracket-pill");
    const noPlan = labels(await render({ plan: "" }));
    expect(noPlan).not.toContain("plan");
    const noChips = labels(await render({ manaIdentity: "" }));
    expect(noChips.some((l) => l !== null && l.startsWith("chip-"))).toBe(false);
  });

  it("keeps its layout contract at the seven contract canvases - long copy, emptied parts, 3 and 6 rows", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const six = {
      highlights: new Array(6).fill(null).map((_, i) => ({
        name: `A card name that runs to the full forty-eight ${i}`.slice(0, 48),
        note: "a note at the full 28 charac",
        qty: i + 1,
      })),
    };
    for (const over of [
      {},
      { deckName: "A deck name running to the full forty-eight", commander: "A commander name at forty characters he" },
      six,
      { highlights: [{ name: "Sol Ring", note: "", qty: 1 }, { name: "Arcane Signet", note: "ramp", qty: 1 }, { name: "Command Tower", qty: 1 }] },
      { record: "", plan: "", manaIdentity: "" },
      { bracket: 1, record: "10-10-10", preset: "light" as const },
      { bracket: 5, curve: [0, 0, 0, 1, 0, 0, 0, 0] },
    ]) {
      await sweepLayout(
        (p, ctx) => CommanderDeckSpotlightV1.render(p, ctx).then(asDocument),
        "@one-a-day/gaming/commander-deck-spotlight/v1",
        { ...CommanderDeckSpotlightV1.defaultProps, ...over },
        (w, h) => targetCtx(w, h),
      );
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("stacks the same bands on portrait - curve over highlights, both inside the body", () => {
    const L = layoutSpotlightCard({}, 1080, 1920);
    expect(L.sideBySide).toBe(false);
    expect(L.curveCell.y).toBeLessThan(L.hlCell.y);
    expect(L.curveCell.y + L.curveCell.h).toBeLessThanOrEqual(L.hlCell.y);
    expect(L.hlCell.y + L.hlCell.h).toBeLessThanOrEqual(L.bodyBottom + 1);
    const wide = layoutSpotlightCard({}, 1920, 1080);
    expect(wide.sideBySide).toBe(true);
    expect(wide.curveCell.x).toBeLessThan(wide.hlCell.x);
  });

  it("draws highlight cards as one uniform tile grid - equal size, in reading order", () => {
    const L = layoutSpotlightCard({}, 1920, 1080);
    expect(L.rows).toHaveLength(4);
    const sizes = new Set(L.rows.map((r) => `${r.rect.w}x${r.rect.h}`));
    expect(sizes.size).toBe(1);
    for (let i = 1; i < L.rows.length; i++) expect(L.rows[i].rect.y).toBeGreaterThanOrEqual(L.rows[i - 1].rect.y);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1920, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("is deterministic and rejects props of the wrong kind", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ deckName: 42 as never })).rejects.toThrow(/must be a string/);
    await expect(render({ highlights: "1x Skullclamp" as never })).rejects.toThrow(/must be a list/);
    await expect(render({ curve: "4,10,16" as never })).rejects.toThrow(/must be a list/);
    await expect(render({ bracket: "3" as never })).rejects.toThrow(/bracket/);
  });
});
