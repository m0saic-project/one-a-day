import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  BenchDeltaV1,
  MAX_ROWS,
  SAMPLE_ROWS,
  fmtRatio,
  layoutBenchDelta,
  verdictOf,
  verdictText,
} from "./bench-delta";
import type { BenchRow } from "./bench-delta";

const ID = "@one-a-day/dev/bench-delta/v1";
/** The hint plus the gate's three. */
const CANVASES: Array<[number, number]> = [
  [1600, 900],
  [1920, 1080],
  [1080, 1080],
  [1080, 1920],
];

const OPTS = {
  title: "v1.5 vs v1.4",
  subtitle: "best of 10 runs - 8-core M4 Pro - cold caches",
  baselineLabel: "v1.4",
  candidateLabel: "v1.5",
  smallerIsBetter: true,
};

/** A user-supplied name nobody can reword for them - the #1 defect risk. */
const LONG_NAME = "My Custom Smaller Is Better Benchmark - CPU Load Under Sustained Write Pressure";

const render = (
  props: Partial<Parameters<typeof BenchDeltaV1.render>[0]> = {},
  w = 1600,
  h = 900,
) => BenchDeltaV1.render({ ...BenchDeltaV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

const manyRows = (n: number): BenchRow[] =>
  Array.from({ length: n }, (_, i) => ({
    name: `case ${i + 1}`,
    unit: "ms",
    base: 100 + i,
    baseRange: 2,
    value: 90 + i,
    range: 2,
  }));

describe(ID, () => {
  describe("the verdict comes from the intervals, never the ratio alone", () => {
    it("calls disjoint intervals better or worse, and says which way round", () => {
      const better = verdictOf({ name: "a", base: 412, baseRange: 14, value: 171, range: 6 }, true);
      expect(better.kind).toBe("better");
      expect(better.reason).toMatch(/disjoint/);
      expect(fmtRatio(better.ratio)).toBe("2.41");
      const worse = verdictOf({ name: "a", base: 1240, baseRange: 61, value: 1395, range: 64 }, true);
      expect(worse.kind).toBe("worse");
      expect(verdictText(worse)).toBe("1.13x worse");
    });

    it("calls OVERLAPPING intervals noise however big the ratio looks", () => {
      // 4% apart, but +/- 11% each: the bars overlap, so there is no claim.
      const v = verdictOf({ name: "a", base: 88.2, baseRange: 9.6, value: 84.6, range: 8.4 }, true);
      expect(v.kind).toBe("noise");
      expect(v.reason).toMatch(/overlap/);
      expect(verdictText(v)).toBe("within noise");
      // Even a 2x gap is noise when the spreads are wide enough to touch.
      expect(verdictOf({ name: "a", base: 100, baseRange: 60, value: 50, range: 60 }, true).kind).toBe("noise");
    });

    it("refuses to call a change real when NO spread was given", () => {
      const v = verdictOf({ name: "a", base: 59, value: 44.5 }, true);
      expect(v.kind).toBe("unknown");
      expect(v.reason).toMatch(/no spread/);
      expect(verdictText(v)).toBe("no spread given");
      // One side alone is enough to decide: the other is read as exact.
      expect(verdictOf({ name: "a", base: 59, baseRange: 1, value: 44.5 }, true).kind).toBe("better");
    });

    it("inverts with smallerIsBetter and changes nothing else", () => {
      const row = { name: "throughput", base: 1200, baseRange: 20, value: 1580, range: 25 };
      expect(verdictOf(row, true).kind).toBe("worse");
      expect(verdictOf(row, false).kind).toBe("better");
      // the ratio is direction-free: it is always the larger over the smaller
      expect(verdictOf(row, true).ratio).toBeCloseTo(verdictOf(row, false).ratio, 10);
    });

    it("shows all four verdicts at the defaults - the card is the argument", () => {
      const kinds = SAMPLE_ROWS.map((r) => verdictOf(r, true).kind);
      expect(new Set(kinds)).toEqual(new Set(["better", "worse", "noise", "unknown"]));
    });
  });

  describe("one shared rule: the geometry states the claim", () => {
    it("ends EVERY baseline bar at the rule, at every canvas", () => {
      for (const [W, H] of CANVASES) {
        const L = layoutBenchDelta(SAMPLE_ROWS, OPTS, W, H);
        const ruleEnd = L.rule.x + L.rule.w;
        expect(ruleEnd).toBe(L.trackX + L.ref);
        for (const r of L.rows) expect(r.baseBar.x + r.baseBar.w).toBe(ruleEnd);
      }
    });

    it("draws the candidate relative to its OWN baseline, so bar length is the ratio", () => {
      const L = layoutBenchDelta(SAMPLE_ROWS, OPTS, 1600, 900);
      for (const r of L.rows) {
        const expected = Math.round((r.row.value / r.row.base) * L.ref);
        expect(r.candBar.w).toBe(Math.max(Math.round(0.004 * L.S), expected));
      }
      // mixed units and magnitudes do not distort each other: 1240ms and 59ms
      // sit on one card because neither bar is drawn in milliseconds.
      const mixed = layoutBenchDelta(
        [
          { name: "ns", unit: "ns", base: 2.1, value: 1.05 },
          { name: "MB", unit: "MB", base: 6433, value: 3216.5 },
        ],
        OPTS,
        1600,
        900,
      );
      expect(mixed.rows[0].candBar.w).toBe(mixed.rows[1].candBar.w);
    });

    it("makes a regression CROSS the rule and keeps everything else short of it", () => {
      const L = layoutBenchDelta(SAMPLE_ROWS, OPTS, 1600, 900);
      const ruleEnd = L.rule.x + L.rule.w;
      const crossing = L.rows.filter((r) => r.candBar.x + r.candBar.w > ruleEnd);
      expect(crossing).toHaveLength(1);
      expect(crossing[0].row.name).toBe("cold start");
      expect(crossing[0].verdict.kind).toBe("worse");
    });

    it("keeps every bar and interval on the track, at the seven canvases", () => {
      const canvases: Array<[number, number]> = [
        [1920, 1080], [1280, 720], [1080, 1920], [1080, 1080], [3840, 2160], [640, 360], [480, 270],
      ];
      for (const [W, H] of canvases) {
        const L = layoutBenchDelta([...SAMPLE_ROWS, ...manyRows(6)], OPTS, W, H);
        const right = L.trackX + L.trackW;
        for (const r of L.rows) {
          for (const rect of [r.baseBar, r.candBar, r.lane, ...(r.baseIv ? [r.baseIv] : []), ...(r.candIv ? [r.candIv] : [])]) {
            expect(rect.x).toBeGreaterThanOrEqual(L.trackX);
            expect(rect.x + rect.w).toBeLessThanOrEqual(right);
          }
          // the bars sit inside their own lane
          expect(r.baseBar.y).toBeGreaterThanOrEqual(r.lane.y);
          expect(r.candBar.y + r.candBar.h).toBeLessThanOrEqual(r.lane.y + r.lane.h);
        }
      }
    });

    it("stops widening the scale at a catastrophic regression instead of flattening the card", () => {
      const L = layoutBenchDelta(
        [
          { name: "normal", base: 100, value: 98 },
          { name: "blew up", base: 100, value: 4000 },
        ],
        OPTS,
        1600,
        900,
      );
      // the sane row still has a readable bar rather than a stub
      expect(L.rows[0].candBar.w).toBeGreaterThan(L.trackW * 0.2);
      // the runaway row is clamped to the track, and the NUMBER stays true
      expect(L.rows[1].candBar.x + L.rows[1].candBar.w).toBeLessThanOrEqual(L.trackX + L.trackW);
      expect(verdictText(L.rows[1].verdict)).toBe("no spread given");
      expect(fmtRatio(verdictOf({ name: "x", base: 100, value: 4000 }, true).ratio)).toBe("40.0");
    });
  });

  describe("text: measured, shared per column, and honest at the floor", () => {
    it("fits every fitted block inside its own box at the seven canvases", () => {
      const canvases: Array<[number, number]> = [
        [1920, 1080], [1280, 720], [1080, 1920], [1080, 1080], [3840, 2160], [640, 360], [480, 270],
      ];
      const rows: BenchRow[] = [{ ...SAMPLE_ROWS[0], name: LONG_NAME }, ...SAMPLE_ROWS.slice(1)];
      for (const [W, H] of canvases) {
        const L = layoutBenchDelta(rows, OPTS, W, H);
        for (const r of L.rows) {
          expect(r.name.width).toBeLessThanOrEqual(r.nameRect.w);
          expect(Math.ceil(r.name.px * 1.25 * r.name.lines)).toBeLessThanOrEqual(r.nameRect.h + 1);
          expect(r.values.width).toBeLessThanOrEqual(r.valuesRect.w);
          expect(r.verdictFit.width).toBeLessThanOrEqual(r.verdictRect.w);
        }
        for (const f of [L.title, L.summary, L.footer, L.ruleLabel]) expect(f.px).toBeGreaterThanOrEqual(7);
        expect(L.title.width).toBeLessThanOrEqual(L.titleRect.w);
        expect(L.footer.width).toBeLessThanOrEqual(L.footerRect.w);
        for (const l of L.legend) expect(l.label.width).toBeLessThanOrEqual(l.labelRect.w);
      }
    });

    it("gives a whole column ONE type size - neighbouring rows never differ", () => {
      const rows: BenchRow[] = [{ ...SAMPLE_ROWS[0], name: LONG_NAME }, ...SAMPLE_ROWS.slice(1)];
      const L = layoutBenchDelta(rows, OPTS, 1600, 900);
      expect(new Set(L.rows.map((r) => r.name.px)).size).toBe(1);
      expect(new Set(L.rows.map((r) => r.values.px)).size).toBe(1);
      expect(new Set(L.rows.map((r) => r.verdictFit.px)).size).toBe(1);
      // the long name pulled the WHOLE column down, it did not clip
      const short = layoutBenchDelta(SAMPLE_ROWS, OPTS, 1600, 900);
      expect(L.rows[0].name.px).toBeLessThan(short.rows[0].name.px);
    });

    it("shrinks and wraps before it ellipsizes, and says so when it drops words", () => {
      // roomy: the long name wraps rather than losing its tail
      const roomy = layoutBenchDelta([{ name: LONG_NAME, base: 10, value: 9 }], OPTS, 1600, 900);
      expect(roomy.rows[0].name.text).not.toMatch(/\.\.\./);
      expect(roomy.rows[0].name.text.replace(/\n/g, " ")).toBe(LONG_NAME);
      // at the contract floor there is nowhere left to go: the ellipsis is
      // the LAST rung, and it is present so the truncation is visible
      const tiny = layoutBenchDelta([{ name: LONG_NAME, base: 10, value: 9 }, ...manyRows(6)], OPTS, 480, 270);
      expect(tiny.rows[0].name.text).toMatch(/\.\.\.$/);
      expect(tiny.rows[0].name.text).not.toMatch(/\n/);
    });
  });

  describe("row budget", () => {
    it("draws at most MAX_ROWS, counts only what it drew, and says how many it dropped", async () => {
      const rows = manyRows(20);
      const L = layoutBenchDelta(rows, OPTS, 1600, 900);
      expect(L.shown).toBeLessThanOrEqual(MAX_ROWS);
      expect(L.rows).toHaveLength(L.shown);
      expect(L.total).toBe(20);
      expect(L.footer.text).toContain(`showing ${L.shown} of 20 rows`);
      // the header summary counts the SAME rows the card drew
      const counted = L.summary.text.match(/(\d+)/g)!.map(Number).reduce((a, b) => a + b, 0);
      expect(counted).toBe(L.shown);
      const doc = await render({ rows });
      expect(String((doc.editor as { label?: string }).label)).toContain(`${L.shown} of 20 rows`);
    });

    it("drops rows further when the canvas cannot hold them, rather than smearing", () => {
      const big = layoutBenchDelta(manyRows(8), OPTS, 1920, 1080);
      const small = layoutBenchDelta(manyRows(8), OPTS, 480, 270);
      expect(big.shown).toBe(8);
      expect(small.shown).toBeLessThanOrEqual(big.shown);
      expect(small.footer.text).toContain(`showing ${small.shown} of 8 rows`);
    });
  });

  describe("the document", () => {
    it("binds every drawn prop to its rect - Make's double-click edits in place", async () => {
      const doc = await render();
      const { byProp, rejected } = resolvePropBindings(doc, 1600, 900, { propsSchema: BenchDeltaV1.propsSchema });
      expect(rejected).toEqual([]);
      expect(byProp.title).toHaveLength(1);
      expect(byProp.subtitle).toHaveLength(1);
      // the rule label AND the legend swatch both show baselineLabel
      expect(byProp.baselineLabel).toHaveLength(2);
      expect(byProp.candidateLabel).toHaveLength(1);
      // one name cell + one values cell per drawn row, plus the accent swatch
      expect(byProp.rows).toHaveLength(SAMPLE_ROWS.length * 2);
      expect(byProp.accent).toHaveLength(1);
      expect(byProp.preset).toBeUndefined();
    });

    it("clears its safe minimum at its own hint and at the gate's three canvases", async () => {
      for (const [w, h] of CANVASES) {
        const ev = evaluateM0(String((await render({}, w, h)).m0), { width: w, height: h });
        expect(ev.feasible && ev.meetsPrecision).toBe(true);
      }
    });

    it("keeps its layout contract at the seven canvases, for the props that stress it", async () => {
      const doc = await render();
      const intent = layoutIntentOf(doc);
      expect(intent).not.toBeNull();
      const textLabels = (doc.sources ?? [])
        .filter((s) => (s as { type: string }).type === "text")
        .map((s) => (s as { editor?: { label?: string } }).editor?.label);
      for (const label of textLabels) expect(intent!.constraints.some((c) => c.label === label && c.textFits)).toBe(true);
      const cases = [
        {},
        { rows: [{ ...SAMPLE_ROWS[0], name: LONG_NAME }, ...SAMPLE_ROWS.slice(1)] },
        { rows: manyRows(20), subtitle: "" },
        { preset: "light" as const, accent: "#8250df", smallerIsBetter: false },
        { rows: [{ name: "only one", base: 1, value: 4000 }] },
      ];
      for (const over of cases) {
        await sweepLayout(
          (p, ctx) => BenchDeltaV1.render(p, ctx).then(asDocument),
          ID,
          { ...BenchDeltaV1.defaultProps, ...over },
          (w, h) => targetCtx(w, h),
        );
      }
      const debug = await render({ debugLayout: true });
      expect((debug.editor as { layoutContract?: { ok: boolean } }).layoutContract?.ok).toBe(true);
    });

    it("is deterministic, follows the preset, and fails fast on a bad row", async () => {
      expect(await render()).toEqual(await render());
      expect((await render()).backgroundColor).toBe("#0d1117");
      expect((await render({ preset: "light" })).backgroundColor).toBe("#ffffff");
      await expect(render({ rows: [] })).rejects.toThrow(/at least one/);
      await expect(render({ rows: [{ name: "", base: 1, value: 1 }] })).rejects.toThrow(/name must not be empty/);
      await expect(render({ rows: [{ name: "a", base: 0, value: 1 }] })).rejects.toThrow(/greater than zero/);
      await expect(render({ rows: [{ name: "a", base: -2, value: 1 }] })).rejects.toThrow(/greater than zero/);
      await expect(render({ rows: [{ name: "a", base: 1, value: -1 }] })).rejects.toThrow(/zero or more/);
      await expect(render({ rows: [{ name: "a", base: 1, value: 1, range: -3 }] })).rejects.toThrow(/\+\/- spread/);
      await expect(render({ accent: "green" })).rejects.toThrow(/#rrggbb/);
    });
  });
});
