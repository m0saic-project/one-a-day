import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { getOpentype, bundledFontPath, resolveFontFile, resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, checkLayoutIntent, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  ErgPbCardV1 as T,
  PACE_TICKS,
  ergMarkerFrac,
  ergOrdinal,
  layoutErgCard,
  normalizeErgCard,
  parseErgSplit,
} from "./erg-pb-card";
import type { ErgPbCardProps } from "./erg-pb-card";

const ID = "@one-a-day/sports/erg-pb-card/v1";
const render = (p: ErgPbCardProps = {}, w = 1080, h = 1080) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: ErgPbCardProps, w = 1080, h = 1080) => Object.fromEntries(layoutErgCard(p, w, h).cells.map((c) => [c.label, c.text.replace(/\n/g, " ")]));

// The copy that stresses the card: a 40-character name, a 45-character note, a
// 39-character cohort beside the chip, a marathon time as the result, and the
// slowest split the format allows (the marker clamps to the 3:00 end).
const LONG: ErgPbCardProps = {
  rower: "Maximiliana Wolfeschlegelstein",
  note: "the fastest 2k of the 2026 autumn head season",
  split: "9:59.9",
  result: "3:36:47",
  piece: "marathon",
  percentileCohort: "2026 rower ranking, heavyweight, 40-49",
  spm: 60,
  watts: 600,
  drag: 250,
};
const CASES: ErgPbCardProps[] = [
  {},
  { preset: "light" },
  { split: "1:00.0" },
  { split: "3:00.0" },
  { split: "2:00.0" },
  { percentile: 0 },
  { percentile: 0, percentileCohort: "" },
  { percentile: 1 },
  { percentile: 21 },
  { percentileCohort: "" },
  { result: "" },
  { result: "", piece: "" },
  { piece: "1 hour", result: "13,578 m" },
  { spm: 0 },
  { watts: 0 },
  { drag: 0 },
  { spm: 0, watts: 0, drag: 0 },
  { note: "" },
  { spm: 10, watts: 20, drag: 50 },
  LONG,
  { ...LONG, preset: "light", accent: "#e4572e" },
  { rower: "Zoë Åström-Niño" },
];

describe(ID, () => {
  it("shows the use case at its defaults: the 2026 ranking's own median 2k rower", () => {
    const t = textOf({});
    expect(t).toMatchObject({
      rower: "Marcus Alder", note: "the 2026 season's median 2k",
      split: "1:58.8", "split-unit": "/500m",
      result: "7:55.0", piece: "2,000 m",
      percentile: "50TH PERCENTILE", "percentile-cohort": "2026 rower ranking",
      "stat-spm": "26", "stat-label-spm": "SPM",
      "stat-watts": "209", "stat-label-watts": "WATTS",
      "stat-drag": "110", "stat-label-drag": "DRAG",
      "pace-tick-label-0": "1:00", "pace-tick-label-1": "1:30", "pace-tick-label-2": "2:00",
      "pace-tick-label-3": "2:30", "pace-tick-label-4": "3:00",
      footnote: "Split, watts and percentile as entered. The ranking moves with season, age and weight class.",
    });
    // 1:58.8 -> 0.49 of the way from the 1:00 end to the 3:00 end.
    expect(ergMarkerFrac(parseErgSplit("1:58.8")!)).toBeCloseTo(0.49, 12);
    expect(T.outputHints).toMatchObject({ width: 1080, height: 1080, format: { kind: "image" } });
  });

  it("parses splits in integer tenths and clamps the marker, never the printed split", () => {
    expect(parseErgSplit("1:58.8")).toBe(1188);
    expect(parseErgSplit("9:59.9")).toBe(5999);
    expect(parseErgSplit("1:00.0")).toBe(600);
    for (const bad of ["", "0:59.5", "10:15.0", "1:58", "1:58.85", "1:60.0", "1:5.8", "1,58.8", "1:58,8", " 1:58.8", "1:58.8 ", "abc"]) expect(parseErgSplit(bad)).toBeNull();
    expect([600, 601, 1188, 1200, 1800, 1805, 5999].map(ergMarkerFrac)).toEqual([0, 1 / 1200, 0.49, 0.5, 1, 1, 1]);
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 50, 99].map(ergOrdinal)).toEqual([
      "1ST", "2ND", "3RD", "4TH", "11TH", "12TH", "13TH", "21ST", "22ND", "23RD", "50TH", "99TH",
    ]);
    const n = normalizeErgCard({});
    expect([n.splitText, n.splitTenths, n.markerFrac, n.clamped]).toEqual(["1:58.8", 1188, 0.49, false]);
    // Outside the track: the marker clamps, the figure does not.
    const slow = normalizeErgCard({ split: "9:59.9" });
    expect([slow.splitText, slow.markerFrac, slow.clamped]).toEqual(["9:59.9", 1, true]);
    const fast = normalizeErgCard({ split: "1:00.0" });
    expect([fast.splitText, fast.markerFrac, fast.clamped]).toEqual(["1:00.0", 0, true]);
    // Every percentile the chip can show, in the chip's own words.
    expect(textOf({ percentile: 1 }).percentile).toBe("1ST PERCENTILE");
    expect(textOf({ percentile: 11 }).percentile).toBe("11TH PERCENTILE");
    expect(textOf({ percentile: 21 }).percentile).toBe("21ST PERCENTILE");
    // The footnote names what is entered and what the ranking depends on.
    expect(textOf({ percentile: 0 }).footnote).toBe("Split and watts as entered.");
  });

  it("draws the marker at (split - 60) / 120 of the track, just left of 2:00 by default", async () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      for (const split of ["1:58.8", "1:00.0", "2:00.0", "2:30.0", "3:00.0", "9:59.9"]) {
        const resolved = checkLayoutIntent(await render({ split }, w, h), w, h)!.resolved;
        const track = resolved["pace-track"][0].rect;
        const marker = resolved["pace-marker"][0].rect;
        const frac = ergMarkerFrac(parseErgSplit(split)!);
        // The marker's center lands on the split's place on the scale - a clamped
        // marker straddles the track's end rather than hiding inside it.
        expect(Math.abs(marker.x + marker.w / 2 - (track.x + frac * track.w))).toBeLessThanOrEqual(2);
        expect(marker.x + marker.w / 2).toBeGreaterThanOrEqual(track.x - 1);
        expect(marker.x + marker.w / 2).toBeLessThanOrEqual(track.x + track.w + 1);
        // A distinct mark: bigger than a tick, riding the track's line.
        const tick = resolved["pace-tick-2"][0].rect;
        expect(marker.w).toBeGreaterThan(tick.w);
        expect(marker.y).toBeLessThanOrEqual(track.y);
        expect(marker.y + marker.h).toBeGreaterThanOrEqual(track.y + track.h);
        // Five ticks: the interior ones centered on the quarters, the end ones flush with the track.
        const ticks = PACE_TICKS.map((_, i) => resolved[`pace-tick-${i}`][0].rect);
        for (const i of [1, 2, 3]) expect(Math.abs(ticks[i].x + ticks[i].w / 2 - (track.x + (i * track.w) / 4))).toBeLessThanOrEqual(2);
        expect(Math.abs(ticks[0].x - track.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(ticks[4].x + ticks[4].w - (track.x + track.w))).toBeLessThanOrEqual(1);
        // The labels: interior ones under their ticks, the end ones flush with the margins.
        const labels = PACE_TICKS.map((_, i) => resolved[`pace-tick-label-${i}`][0].rect);
        for (const i of [1, 2, 3]) expect(Math.abs(labels[i].x + labels[i].w / 2 - (track.x + (i * track.w) / 4))).toBeLessThanOrEqual(2);
        const m = layoutErgCard({ split }, w, h).m;
        expect(Math.abs(labels[0].x - m)).toBeLessThanOrEqual(2);
        expect(Math.abs(labels[4].x + labels[4].w - (w - m))).toBeLessThanOrEqual(2);
        // No tick label sits on the marker's overhang.
        for (const l of labels) expect(l.y).toBeGreaterThanOrEqual(marker.y + marker.h);
      }
      // The default split reads just left of the 2:00 tick, 49% of the way.
      const resolved = checkLayoutIntent(await render({}, w, h), w, h)!.resolved;
      const track = resolved["pace-track"][0].rect;
      const center = resolved["pace-marker"][0].rect.x + resolved["pace-marker"][0].rect.w / 2 - track.x;
      expect(center).toBeGreaterThan(track.w * 0.45);
      expect(center).toBeLessThan(track.w * 0.5);
    }
  });

  it("makes the split the hero: the tallest cell on the card, more than twice the result", () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutErgCard({}, w, h);
      const split = L.cells.find((c) => c.label === "split")!;
      const result = L.cells.find((c) => c.label === "result")!;
      const rower = L.cells.find((c) => c.label === "rower")!;
      expect(split.px).toBeGreaterThan(2 * result.px);
      expect(split.px).toBeGreaterThan(rower.px);
      expect(split.rect.h).toBeGreaterThan(result.rect.h);
      for (const c of L.cells) if (c !== split) expect(c.rect.h).toBeLessThan(split.rect.h);
      // /500m sits immediately under the split, centered on the same line.
      const unit = L.cells.find((c) => c.label === "split-unit")!;
      expect(unit.rect.y).toBe(split.rect.y + split.rect.h + Math.max(2, Math.round(Math.min(h, 0.75 * w) * 0.014)));
      expect(unit.rect.x + unit.rect.w / 2).toBe(split.rect.x + split.rect.w / 2);
    }
  });

  it("hides what is zero and rebalances: the chip's space, the stat band, the result", async () => {
    // No chip: no chip text, no cohort, and the name takes the header's full width.
    const noChip = layoutErgCard({ percentile: 0 }, 1080, 1080);
    expect(noChip.tiles.some((t) => t.label === "percentile-chip")).toBe(false);
    expect(noChip.cells.some((c) => c.label === "percentile" || c.label === "percentile-cohort")).toBe(false);
    expect(noChip.cells.find((c) => c.label === "rower")!.rect.w).toBe(1080 - 2 * noChip.m);
    // A chip without its cohort line still shows the pill.
    const noCohort = layoutErgCard({ percentileCohort: "" }, 1080, 1080);
    expect(noCohort.tiles.some((t) => t.label === "percentile-chip")).toBe(true);
    expect(noCohort.cells.some((c) => c.label === "percentile-cohort")).toBe(false);
    // Two stat cells when one is 0; none when all are; the survivors share the band.
    const two = layoutErgCard({ spm: 0 }, 1080, 1080);
    expect(two.cells.filter((c) => /^stat-(spm|watts|drag)$/.test(c.label)).map((c) => c.label)).toEqual(["stat-watts", "stat-drag"]);
    expect(two.tiles.filter((t) => t.label.startsWith("stat-divider-"))).toHaveLength(1);
    const none = layoutErgCard({ spm: 0, watts: 0, drag: 0 }, 1080, 1080);
    expect(none.cells.some((c) => c.label.startsWith("stat-"))).toBe(false);
    // No result: no figure, no caption, and the freed band went to the hero and the stats.
    const noResult = layoutErgCard({ result: "" }, 1080, 1080);
    expect(noResult.cells.some((c) => c.label === "result" || c.label === "piece")).toBe(false);
    const full = layoutErgCard({}, 1080, 1080);
    const heroBand = (L: ReturnType<typeof layoutErgCard>) => L.bandTop.result - L.bandTop.hero;
    const statsBand = (L: ReturnType<typeof layoutErgCard>) => L.footBandTop - L.bandTop.stats;
    expect(heroBand(noResult)).toBeGreaterThan(heroBand(full));
    expect(statsBand(noResult)).toBeGreaterThan(statsBand(full));
    expect(noResult.bandTop.stats - noResult.bandTop.track).toBe(full.bandTop.stats - full.bandTop.track);
    // The chip and its cohort read as one sentence: right column, right-aligned at the margin.
    const resolved = checkLayoutIntent(await render({}, 1080, 1080), 1080, 1080)!.resolved;
    const chip = resolved["percentile-chip"][0].rect;
    const cohort = resolved["percentile-cohort"][0].rect;
    expect(Math.abs(chip.x + chip.w - (1080 - full.m))).toBeLessThanOrEqual(2);
    expect(Math.abs(cohort.x + cohort.w - (1080 - full.m))).toBeLessThanOrEqual(2);
    expect(cohort.y).toBeGreaterThanOrEqual(chip.y + chip.h);
  });

  it("keeps its layout contract at the seven contract canvases, defaults and stress", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of CASES) {
      await sweepLayout((q, ctx) => T.render(q, ctx).then(asDocument), ID, over, (w, h) => targetCtx(w, h));
      for (const [w, h] of CONTRACT_CANVASES) {
        const doc = await render(over, w, h);
        const ev = evaluateM0(String(doc.m0), { width: w, height: h });
        expect(ev.feasible && ev.meetsPrecision).toBe(true);
        // Every source is labelled and promised something; every text promises that it fits.
        const intent = layoutIntentOf(doc)!;
        for (const s of doc.sources ?? []) {
          expect(s.editor?.label).toBeTruthy();
          expect(intent.constraints.some((c) => c.label === s.editor?.label) || intent.relations?.some((r) => r.label === s.editor?.label || (Array.isArray(r.label) && r.label.includes(s.editor?.label ?? "")))).toBe(true);
          if (s.type === "text") expect(intent.constraints.some((c) => c.label === s.editor?.label && c.textFits)).toBe(true);
        }
        // Inside the margins, never below the floor, never cut.
        const L = layoutErgCard(over, w, h);
        for (const c of L.cells) {
          expect(c.px).toBeGreaterThanOrEqual(L.small);
          expect(c.text).not.toContain("...");
          expect(c.rect.x).toBeGreaterThanOrEqual(L.m);
          expect(c.rect.y).toBeGreaterThanOrEqual(L.m);
          expect(c.rect.x + c.rect.w).toBeLessThanOrEqual(w - L.m);
          expect(c.rect.y + c.rect.h).toBeLessThanOrEqual(h - L.m);
        }
        // No two texts overlap, and no text sits on a tile it does not belong to.
        const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        for (let i = 0; i < L.cells.length; i++) for (let j = i + 1; j < L.cells.length; j++) {
          if (hit(L.cells[i].rect, L.cells[j].rect)) throw new Error(`${L.cells[i].label} overlaps ${L.cells[j].label} at ${w}x${h}`);
        }
        for (const t of L.tiles) for (const c of L.cells) {
          const own = (t.label === "percentile-chip" && c.label === "percentile")
            || (t.label === "stat-strip" && /^stat(-(spm|watts|drag)|-label-(spm|watts|drag))$/.test(c.label));
          if (!own && hit(t.rect, c.rect)) throw new Error(`${c.label} overlaps ${t.label} at ${w}x${h}`);
        }
      }
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
    expect((await render({ ...LONG, debugLayout: true }, 1920, 1080)).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("binds each text rect to the prop it shows; derived text and the track stay unbound", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    expect(Object.fromEntries(Object.entries(byProp).map(([key, v]) => [key, v.length]))).toEqual({
      rower: 1, note: 1, split: 1, result: 1, piece: 1,
      spm: 1, watts: 1, drag: 1, percentile: 1, percentileCohort: 1, accent: 1,
    });
    const trimmed = await render({ percentile: 0, percentileCohort: "", note: "", result: "", piece: "", spm: 0, drag: 0 });
    const { byProp: kept } = resolvePropBindings(trimmed, 1080, 1080, { propsSchema: T.propsSchema });
    expect(Object.fromEntries(Object.entries(kept).map(([key, v]) => [key, v.length]))).toEqual({ split: 1, watts: 1, accent: 1, rower: 1 });
  });

  it("follows the accent and the preset: the strip, the rule and the marker carry it, the chip is outlined", async () => {
    const dark = await render(), light = await render({ preset: "light", accent: "#e4572e" });
    expect([dark.backgroundColor, light.backgroundColor]).toEqual(["#0c1a24", "#f4f8fa"]);
    const L = layoutErgCard({ preset: "light", accent: "#e4572e" }, 1080, 1080);
    // The only accent FILLS: the marker, the header rule and the stat strip.
    expect([...new Set(L.tiles.filter((t) => t.color === "#e4572e").map((t) => t.label))].sort()).toEqual(["header-rule", "pace-marker", "stat-strip"]);
    // The chip drops its fill: page colour underneath, an accent ring, header ink inside.
    const chip = L.tiles.find((t) => t.label === "percentile-chip")!;
    expect(chip.color).toBe("#f4f8fa");
    expect(chip.stroke).toMatchObject({ color: "#e4572e" });
    expect(L.cells.find((c) => c.label === "percentile")!.color).toBe(L.theme.ink);
    // The stat values are the readable ink over the accent strip.
    const val = L.cells.find((c) => c.label === "stat-watts")!.color;
    expect(val === "#0b1220" || val === "#ffffff").toBe(true);
    // The track, its ticks and the dividers between cells stay neutral chrome.
    expect(L.tiles.find((t) => t.label === "pace-track")!.color).not.toBe("#e4572e");
    expect(L.tiles.find((t) => t.label === "pace-tick-2")!.color).not.toBe("#e4572e");
    expect(L.tiles.find((t) => t.label === "stat-divider-1")!.color).not.toBe("#e4572e");
  });

  it("draws accented Latin names: every character it accepts has a glyph in both weights", () => {
    const opentype = getOpentype() as { loadSync(path: string): { charToGlyph(ch: string): { index: number } } };
    for (const path of [bundledFontPath(), resolveFontFile({ weight: "bold" })!.path]) {
      const font = opentype.loadSync(path);
      for (let code = 0xc0; code <= 0x17f; code++) {
        if (code === 0xd7 || code === 0xf7) continue;
        expect(font.charToGlyph(String.fromCodePoint(code)).index).not.toBe(0);
      }
    }
    expect(textOf({ rower: "Zoë Åström" }).rower).toBe("Zoë Åström");
    // What it cannot promise to draw is refused by name, never drawn as tofu.
    expect(() => normalizeErgCard({ rower: "划船" })).toThrow(/rower .*not known to draw/);
    expect(() => normalizeErgCard({ note: "2k → PB" })).toThrow(/note .*not known to draw/);
  });

  it("is deterministic, follows ctx.target when nested, and never says best or PB itself", async () => {
    expect(await render()).toEqual(await render());
    const ctx = targetCtx(480, 270);
    ctx.output.width = 3840;
    ctx.output.height = 2160;
    expect(await T.render({}, ctx).then(asDocument)).toEqual(await render({}, 480, 270));
    for (const p of CASES) {
      const t = textOf(p);
      if (t.footnote) expect(t.footnote).toMatch(/as entered/);
    }
    const drawn = JSON.stringify((await render()).sources);
    expect(drawn).not.toMatch(/personal best/i);
  });

  it.each<[string, ErgPbCardProps, RegExp]>([
    ["an empty split", { split: "" }, /split "" is not a split: write m:ss\.t from 1:00\.0 to 9:59\.9/],
    ["a split that does not parse", { split: "1:58" }, /split "1:58" is not a split/],
    ["a split over 10 minutes", { split: "10:15.0" }, /split "10:15\.0" is not a split/],
    ["a split that is not a string", { split: 118.8 as never }, /split must be a string/],
    ["an spm below the range", { spm: 9 }, /spm 9 is outside 10-60/],
    ["an spm above the range", { spm: 61 }, /spm 61 is outside 10-60/],
    ["a fractional spm", { spm: 26.5 }, /spm must be a whole number/],
    ["watts below the range", { watts: 19 }, /watts 19 is outside 20-600/],
    ["watts above the range", { watts: 601 }, /watts 601 is outside 20-600/],
    ["drag below the range", { drag: 49 }, /drag 49 is outside 50-250/],
    ["drag above the range", { drag: 251 }, /drag 251 is outside 50-250/],
    ["a percentile of 100", { percentile: 100 }, /percentile 100 is outside 1-99/],
    ["a negative percentile", { percentile: -5 }, /percentile -5 is outside 1-99/],
    ["a blank rower", { rower: "  " }, /rower must not be blank/],
    ["a 41-character rower", { rower: "W".repeat(41) }, /rower .* is 41 characters; the card fits at most 40/],
    ["a 49-character note", { note: "n".repeat(49) }, /note .* is 49 characters; the card fits at most 48/],
    ["a 17-character piece", { piece: "p".repeat(17) }, /piece .* is 17 characters; the card fits at most 16/],
    ["a 15-character result", { result: "r".repeat(15) }, /result .* is 15 characters; the card fits at most 14/],
    ["a 41-character cohort", { percentileCohort: "c".repeat(41) }, /percentileCohort .* is 41 characters; the card fits at most 40/],
    ["a rower that is not a string", { rower: 42 as never }, /rower must be a string/],
    ["an unknown preset", { preset: "sepia" as never }, /preset "sepia" must be "dark" or "light"/],
    ["a bad accent", { accent: "teal" }, /accent "teal" must be #rrggbb/],
    ["a debugLayout that is not a boolean", { debugLayout: "yes" as never }, /debugLayout must be a boolean/],
  ])("rejects %s by name, without falling back to the sample", (_name, props, message) => {
    expect(() => normalizeErgCard(props)).toThrow(message);
    expect(() => normalizeErgCard(props)).toThrow(new RegExp(`^${ID.replace(/[/]/g, "\\/")}: `));
  });

  it("refuses copy it cannot fit instead of clipping it", () => {
    expect(() => layoutErgCard({ rower: "W".repeat(40) }, 160, 90)).toThrow(/cannot be fitted on 160x90/);
    expect(() => layoutErgCard({ rower: "W".repeat(40), percentileCohort: "c".repeat(40) }, 240, 135)).toThrow(/cannot be fitted on 240x135/);
  });
});
