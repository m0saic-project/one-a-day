import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  BenchDeltaV1,
  MAX_ROWS,
  SAMPLE_ROWS,
  contrastRatio,
  fmtRatio,
  layoutBenchDelta,
  onColor,
  toNum,
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

    it("refuses to call a change real unless BOTH sides declared a spread", () => {
      const none = verdictOf({ name: "a", base: 59, value: 44.5 }, true);
      expect(none.kind).toBe("unknown");
      expect(none.missing).toBe("both");
      expect(verdictText(none)).toBe("no spread given");
      // One side silent is NOT a claim of exactness. A candidate run once has
      // not been measured, so a 1.33x gap still earns no verdict - this is the
      // single thing the template exists to refuse.
      const half = verdictOf({ name: "a", base: 59, baseRange: 1, value: 44.5 }, true);
      expect(half.kind).toBe("unknown");
      expect(half.missing).toBe("candidate");
      expect(verdictText(half)).toBe("one side unmeasured");
      expect(verdictOf({ name: "a", base: 59, value: 44.5, range: 1 }, true).missing).toBe("baseline");
      // An explicit 0 IS a claim - a deterministic metric gets its verdict.
      const exact = verdictOf({ name: "a", base: 59, baseRange: 0, value: 44.5, range: 0 }, true);
      expect(exact.kind).toBe("better");
      expect(exact.missing).toBeNull();
    });

    it("says a percentage when the ratio has nothing left to say", () => {
      // "1.00x worse" is a number and a word disagreeing inside one pill.
      const tiny = verdictOf({ name: "a", base: 1000, baseRange: 0, value: 1004, range: 0 }, true);
      expect(tiny.kind).toBe("worse");
      expect(verdictText(tiny)).toBe("0.4% worse");
    });

    it("inverts with smallerIsBetter and changes nothing else", () => {
      const row = { name: "throughput", base: 1200, baseRange: 20, value: 1580, range: 25 };
      expect(verdictOf(row, true).kind).toBe("worse");
      expect(verdictOf(row, false).kind).toBe("better");
      // the ratio is direction-free: it is always the larger over the smaller
      expect(verdictOf(row, true).ratio).toBeCloseTo(verdictOf(row, false).ratio, 10);
    });

    it("shows every state it can reach at the defaults - the card is the argument", () => {
      const vs = SAMPLE_ROWS.map((r) => verdictOf(r, true));
      expect(new Set(vs.map((v) => v.kind))).toEqual(new Set(["better", "worse", "noise", "unknown"]));
      // and BOTH flavours of abstention: nothing measured, and half measured
      expect(vs.filter((v) => v.missing === "both")).toHaveLength(1);
      expect(vs.filter((v) => v.missing === "candidate")).toHaveLength(1);
      // the half-measured row has a 1.42x gap and still earns no claim
      const half = vs[4];
      expect(half.kind).toBe("unknown");
      expect(fmtRatio(half.ratio)).toBe("1.42");
    });
  });

  describe("one shared rule: the geometry states the claim", () => {
    it("keeps the rule spanning every lane it is the scale for", () => {
      // The layout contract can only catch a COLLAPSED rule (a canvas fraction
      // is the wrong proxy when the row count varies). The real invariant -
      // the rule covers every row it measures - is exact here.
      for (const rows of [SAMPLE_ROWS, manyRows(8), [SAMPLE_ROWS[0]]]) {
        for (const [W, H] of [[1920, 1080], [1080, 1920], [640, 360], [480, 270]] as Array<[number, number]>) {
          const L = layoutBenchDelta(rows, OPTS, W, H);
          for (const r of L.rows) {
            expect(L.rule.y).toBeLessThanOrEqual(r.band.y);
            expect(L.rule.y + L.rule.h).toBeGreaterThanOrEqual(r.band.y + r.band.h);
          }
          expect(L.rule.h).toBeGreaterThan(0);
          expect(L.rule.w).toBeGreaterThanOrEqual(2);
        }
      }
    });

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
          for (const rect of [r.baseBar, r.candBar, r.band, ...(r.baseIv ? [r.baseIv] : []), ...(r.candIv ? [r.candIv] : [])]) {
            expect(rect.x).toBeGreaterThanOrEqual(L.trackX);
            expect(rect.x + rect.w).toBeLessThanOrEqual(right);
          }
          // the bars sit inside their own lane
          expect(r.baseBar.y).toBeGreaterThanOrEqual(r.band.y);
          expect(r.candBar.y + r.candBar.h).toBeLessThanOrEqual(r.band.y + r.band.h);
        }
      }
    });

    it("never lets an interval leave the track, however wide the spread", () => {
      // A spread wider than the scale would draw the two intervals touching
      // while the pill says they are disjoint - the picture contradicting the
      // claim on the template's one idea.
      const L = layoutBenchDelta(
        [{ name: "wild", base: 100, baseRange: 250, value: 1000, range: 100 }],
        OPTS,
        1600,
        900,
      );
      const right = L.trackX + L.trackW;
      for (const r of L.rows) {
        for (const iv of [r.baseIv, r.candIv]) {
          expect(iv).not.toBeNull();
          expect(iv!.x).toBeGreaterThanOrEqual(L.trackX);
          expect(iv!.x + iv!.w).toBeLessThanOrEqual(right);
        }
      }
      // and the footer admits the row is no longer to scale
      expect(L.footer.text).toMatch(/not to scale/);
    });

    it("draws a sub-pixel interval as a caliper on the value, not a block beside it", () => {
      // A +/-0.05% spread is a real measurement; below the floor it used to
      // render as a 2px block anchored left of the value, which reads as
      // nothing AND biases the mark.
      const L = layoutBenchDelta(
        [{ name: "tight", base: 1000, baseRange: 0.5, value: 900, range: 0.5 }],
        OPTS,
        1600,
        900,
      );
      const r = L.rows[0];
      const centre = r.candIv!.x + r.candIv!.w / 2;
      const barEnd = r.candBar.x + r.candBar.w;
      expect(Math.abs(centre - barEnd)).toBeLessThanOrEqual(2);
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

  describe("it takes the rows a harness actually prints", () => {
    it("reads the numeric STRINGS github-action-benchmark emits", () => {
      // The action declares `range` a string; its own example ships "3", and
      // in the wild the sign rides along.
      expect(toNum(3)).toBe(3);
      expect(toNum("3")).toBe(3);
      expect(toNum(" 12 ")).toBe(12);
      expect(toNum("+/- 4")).toBe(4);
      expect(toNum("1,024")).toBe(1024);
      expect(toNum("")).toBeNull();
      expect(toNum("fast")).toBeNull();
      expect(toNum(undefined)).toBeNull();
      // and a whole row of them behaves exactly like the numeric one
      const asStrings = { name: "x", base: "412", baseRange: "14", value: "171", range: "6" } as unknown as Parameters<typeof verdictOf>[0];
      const asNumbers = { name: "x", base: 412, baseRange: 14, value: 171, range: 6 };
      expect(verdictOf(asStrings, true)).toEqual(verdictOf(asNumbers, true));
    });

    it("renders a card built from string-typed rows identically to the numeric one", async () => {
      const strung = SAMPLE_ROWS.map((r) => ({
        ...r,
        base: String(r.base),
        value: String(r.value),
        ...(r.baseRange === undefined ? {} : { baseRange: `+/- ${r.baseRange}` }),
        ...(r.range === undefined ? {} : { range: String(r.range) }),
      })) as unknown as BenchRow[];
      expect(await render({ rows: strung })).toEqual(await render());
    });
  });

  describe("the verdict pill, and the row that gets none", () => {
    it("gives every claim a pill and the abstention nothing behind it", async () => {
      const doc = await render();
      const labels = (doc.sources ?? []).map((s) => (s as { editor?: { label?: string } }).editor?.label);
      // one pill per claimed verdict on the default card: better, worse, noise
      expect(labels.filter((l) => l === "pill-better")).toHaveLength(1);
      expect(labels.filter((l) => l === "pill-worse")).toHaveLength(1);
      expect(labels.filter((l) => l === "pill-noise")).toHaveLength(1);
      // the pill IS the claim, so the no-spread row does not get one
      expect(labels.filter((l) => l === "pill-unknown")).toHaveLength(0);
      expect(labels.filter((l) => l === "verdict-3")).toHaveLength(1);
    });

    it("inks a pill with the ink that actually contrasts", () => {
      // A luminance cutoff put white on mid-green at 2.5:1. Every fill the
      // template can paint must clear a readable ratio against its chosen ink.
      for (const fill of ["#3fb950", "#f85149", "#d29922", "#8250df", "#ffffff", "#0d1117", "#9a6700"]) {
        expect(contrastRatio(fill, String(onColor(fill as never)))).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe("the legend teaches the encoding the card uses", () => {
    it("shows one candidate swatch per verdict ON the card, not a single colour", () => {
      const L = layoutBenchDelta(SAMPLE_ROWS, OPTS, 1600, 900);
      const cand = L.legend.find((l) => l.key === "cand")!;
      // the default card carries all four verdicts, so the legend carries four
      expect(cand.swatches.map((s) => s.kind)).toEqual(["better", "noise", "worse", "unknown"]);
      expect(cand.label.text).toContain("by verdict");
      // a card where every row agrees needs no such warning
      const allBetter = layoutBenchDelta(
        [
          { name: "a", base: 100, baseRange: 1, value: 50, range: 1 },
          { name: "b", base: 100, baseRange: 1, value: 60, range: 1 },
        ],
        OPTS,
        1600,
        900,
      );
      const one = allBetter.legend.find((l) => l.key === "cand")!;
      expect(one.swatches).toHaveLength(1);
      expect(one.label.text).toBe(OPTS.candidateLabel);
    });
  });

  describe("the degenerate card: a harness that reports no variance at all", () => {
    it("says it ONCE as a headline instead of a wall of grey rows", async () => {
      // go, googlecpp, julia and jmh emit no range at all through
      // github-action-benchmark, so this is a common card, not an edge case.
      const bare = manyRows(5).map(({ name, unit, base, value }) => ({ name, unit, base, value }));
      const L = layoutBenchDelta(bare, OPTS, 1600, 900);
      expect(L.summary.text).toContain("no spreads given");
      expect(L.summary.text).toContain("cannot say");
      expect(L.rows.every((r) => r.verdict.kind === "unknown")).toBe(true);
      const doc = await render({ rows: bare });
      expect(doc.kind).toBe("mosaic_document");
    });

    it("treats an explicit range of 0 as a claim of exactness, not as silence", async () => {
      // A deterministic metric (bytes on disk) reports 0 variance, and that is
      // a measurement. render() used to drop it and accuse the row of silence.
      const L = layoutBenchDelta(
        [{ name: "bundle", unit: "kB", base: 412, baseRange: 0, value: 388, range: 0 }],
        OPTS,
        1600,
        900,
      );
      expect(L.rows[0].verdict.kind).toBe("better");
      expect(L.rows[0].verdict.missing).toBeNull();
      // nothing is DRAWN for a zero-width interval
      expect(L.rows[0].baseIv).toBeNull();
      expect(L.rows[0].candIv).toBeNull();
      const doc = await render({ rows: [{ name: "bundle", base: 412, baseRange: 0, value: 388, range: 0 }] });
      const labels = (doc.sources ?? []).map((s) => (s as { editor?: { label?: string } }).editor?.label);
      expect(labels.filter((l) => l === "pill-better")).toHaveLength(1);
    });

    it("says on the card what test it actually ran", () => {
      const L = layoutBenchDelta(SAMPLE_ROWS, OPTS, 1600, 900);
      expect(L.footer.text).toContain("+/- ranges do not overlap");
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
      // The header summary counts EVERY row - a verdict is a property of the
      // measurement, not of whether there was room to draw it. The footer is
      // what says how many got drawn.
      const counted = L.summary.text.match(/(\d+)/g)!.map(Number).reduce((a, b) => a + b, 0);
      expect(counted).toBe(20);
      expect(L.shown).toBeLessThan(20);
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

  describe("what the card gives up first when the canvas runs out", () => {
    const tenRows: BenchRow[] = Array.from({ length: 10 }, (_, i) => ({
      name: `case ${i + 1}`,
      unit: "ms",
      base: 100,
      value: i === 0 ? 2000 : 95,
    }));

    it("keeps its DISCLOSURES and drops its explanations", () => {
      // The footer used to be one sentence that got ellipsized, so the two
      // clauses that matter - how many rows were dropped, how many bars are
      // not to scale - were the first characters cut, at exactly the canvas
      // where rows get dropped.
      for (const [W, H] of [[1600, 900], [640, 360], [480, 270]] as Array<[number, number]>) {
        const L = layoutBenchDelta(tenRows, OPTS, W, H);
        expect(L.footer.text).toContain("smaller is better");
        expect(L.footer.text).toContain(`showing ${L.shown} of 10 rows`);
        expect(L.footer.text).toContain("not to scale");
        expect(L.footer.text).not.toMatch(/\.\.\.$/);
        expect(L.footer.width).toBeLessThanOrEqual(L.footerRect.w);
      }
      // the explanation is what falls off, and only on the narrow canvases
      expect(layoutBenchDelta(tenRows, OPTS, 1600, 900).footer.text).toContain("relative to its own row's baseline");
      expect(layoutBenchDelta(tenRows, OPTS, 480, 270).footer.text).not.toContain("relative to its own row's baseline");
    });

    it("drops the unit before it ever truncates a measurement", () => {
      // Cutting the tail of "123456789 -> 98765432 nanoseconds" would print a
      // candidate number that is not the number that was measured.
      const L = layoutBenchDelta(
        [{ name: "huge", unit: "nanoseconds", base: 123456789, value: 98765432 }],
        OPTS,
        480,
        270,
      );
      expect(L.rows[0].values.text).toBe("123456789 -> 98765432");
      expect(L.rows[0].values.text).not.toMatch(/\.\.\./);
    });

    it("keeps the legend inside the margin every other element respects", () => {
      const longNames = {
        ...OPTS,
        baselineLabel: "a-very-long-baseline-run-name-v1.4.2",
        candidateLabel: "an-even-longer-candidate-run-name-v1.5.0-rc3",
      };
      for (const [W, H] of [[1600, 900], [640, 360], [480, 270]] as Array<[number, number]>) {
        const L = layoutBenchDelta(tenRows, longNames, W, H);
        const last = L.legend[L.legend.length - 1];
        expect(last.labelRect.x + last.labelRect.w).toBeLessThanOrEqual(L.margin + (W - 2 * L.margin));
      }
    });
  });

  describe("the document", () => {
    it("binds every drawn prop to its rect - Make's double-click edits in place", async () => {
      const doc = await render();
      const { byProp, rejected } = resolvePropBindings(doc, 1600, 900, { propsSchema: BenchDeltaV1.propsSchema });
      expect(rejected).toEqual([]);
      expect(byProp.title).toHaveLength(1);
      expect(byProp.subtitle).toHaveLength(1);
      // Only cells that show the prop ITSELF are bound. The legend's label is
      // exactly `baselineLabel`; the rule's reads "v1.4 baseline", so it is
      // NOT bound - an in-place edit there would write the whole string.
      expect(byProp.baselineLabel).toHaveLength(1);
      expect(byProp.candidateLabel).toHaveLength(1);
      // one name cell per drawn row - the values cell renders "412 -> 171 ms",
      // which is two props and a unit, so it carries no binding either
      expect(byProp.rows).toHaveLength(SAMPLE_ROWS.length);
      expect(byProp.accent).toHaveLength(1);
      expect(byProp.preset).toBeUndefined();
      // every binding resolves to a rect whose text IS the bound value
      const bound = byProp.rows.map((b) => b.stableKey);
      expect(new Set(bound).size).toBe(SAMPLE_ROWS.length);
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
