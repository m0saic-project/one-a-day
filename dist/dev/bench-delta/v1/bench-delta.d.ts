import type { MosaicColor } from "@m0saic/types";
import type { LayoutConstraint } from "@m0saic/template-utils";
/**
 * `@one-a-day/dev/bench-delta/v1` — the before/after benchmark card, and
 * whether the change is real.
 *
 * ONE CONCEPT: **the rectangles carry the claim.** Every row's BASELINE bar
 * ends at the same x, so the whole card has ONE vertical rule, and the
 * CANDIDATE bar is drawn relative to its own baseline — so a bar's length is
 * the speedup and nothing else. Ratios, not magnitudes, are the shared
 * channel, which is what lets ns, MB and percent sit honestly on one card;
 * the magnitudes stay as printed text in the label column, where mixed units
 * cost nothing. Under the default smaller-is-better, a bar that crosses the
 * rule is a regression, readable as a shape before any label is read (with
 * `smallerIsBetter: false` the geometry is byte-identical and crossing is the
 * win — the footer states which direction the card is scoring).
 *
 * The second rectangle on each bar is the run-to-run interval — `range`, the
 * same optional field `github-action-benchmark` already carries — and the
 * VERDICT is derived from it, never from the ratio alone: disjoint intervals
 * are `better` / `worse`, overlapping intervals are `within noise`, and a row
 * where EITHER side failed to declare a range gets no verdict at all. That
 * last rule is the opinion this template exists to hold. A candidate run once
 * has not been measured, and silence on one side is not a claim of exactness,
 * so it earns no pill. An explicit `0` IS a claim — a deterministic metric
 * gets its verdict. For contrast, the action's own regression check fires when
 * a number is "worse than the previous exceeding 200% threshold", which has no
 * notion of noise at all.
 *
 * What the card computes is weaker than significance, so the footer says so
 * out loud: *a verdict means the two +/- ranges do not overlap*. A card that
 * names its own test can be argued with; one that only prints a verdict
 * cannot.
 *
 * The rule that bites: **svg text never wraps or shrinks by itself, and
 * benchmark names are arbitrary user strings** ("My Custom Smaller Is Better
 * Benchmark - CPU Load" is the real example in the action's own README). Every
 * cell is measured against the bundled font, one shared size per COLUMN so
 * neighbouring rows never differ, and the degrade ladder is: shrink, wrap to
 * two lines, WIDEN the label column, drop whole lines, and only then — at the
 * 480x270 contract floor, where the box holds one line of 7px type and the
 * alternative is dropping the benchmark — ellipsize. The footer degrades by
 * dropping whole clauses, lowest value first, so its disclosures survive; the
 * values line drops the unit before it would ever truncate a digit.
 *
 * Nothing here is drawn that carries no data, and that is a performance
 * contract as much as a design one: a decorative full-track wash under every
 * bar kept the tiles off the engine's grid sheet and pushed the overlay chain
 * to 27 at five rows — past the ~25 where ffmpeg SILENTLY degrades inline
 * masks, which is every glyph on this card. Pieces are also emitted kind by
 * kind rather than row by row, so each kind shares one overlay layer.
 *
 * Why it is a still. The scout's decisive find was a constraint, not an
 * opportunity: this audience distrusts animated charts ("They're
 * entertainment, not a tool for seriously comparing data", HN 30268920), and
 * nobody was asking for an animated benchmark clip. So the still IS the
 * product — the picture you commit next to the README. It also sidesteps a
 * real defect: an animated card whose motion builds from nothing renders a
 * near-blank browse still, because the browse still is frame 0.
 *
 * Day 002 of one-a-day. Scouted from GitHub and HN: the rows already exist
 * (`github-action-benchmark` needs `name`, `unit`, `value` + optional
 * `range`), the picture does not, and the current answer is a hand-committed
 * SVG or `plot_whisker.py` + numpy + matplotlib + scipy.
 */
/** One benchmark case: the two runs being compared, and how much each moved. */
export type BenchRow = {
    /** The benchmark's name, as the harness prints it. */
    name: string;
    /** Unit shown after the numbers ("ms", "MB", "ops/s"). Per row: units may differ. */
    unit?: string;
    /** The baseline measurement. Must be > 0 — every bar on the row is relative to it. */
    base: number;
    /** Run-to-run variance of the baseline, as +/- this much. Omit and the row has no verdict. */
    baseRange?: number;
    /** The candidate measurement. */
    value: number;
    /** Run-to-run variance of the candidate, as +/- this much. */
    range?: number;
};
export type BenchDeltaProps = {
    /** The benchmark cases. Up to 8 are drawn; the footer says so when more are given. */
    rows: BenchRow[];
    /** Headline: what is being compared. */
    title?: string;
    /** The conditions caveat - machine, run count, cache state. Empty removes the line. */
    subtitle?: string;
    /** Name of the baseline run; it labels the rule. */
    baselineLabel?: string;
    /** Name of the candidate run. */
    candidateLabel?: string;
    /** True when a LOWER number is better (times, bytes). False for throughput. */
    smallerIsBetter?: boolean;
    /** Hand-tuned background / ink / muted trio. */
    preset?: "dark" | "light";
    /** The colour an improvement is drawn in (#rrggbb). */
    accent?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** Drawn at most this many rows; the rest are counted in the footer. */
export declare const MAX_ROWS = 8;
/**
 * The default card IS the argument, and it is chosen to make every state the
 * template can reach visible with no inputs: a clear win whose intervals are
 * far apart; a 4% "improvement" whose intervals overlap, so it is noise; a
 * regression that crosses the rule; a row measured once on each side, so
 * there is no spread at all; and a row where only the BASELINE was measured
 * repeatedly - a 1.42x gap that still earns no claim, because one run is not
 * a measurement.
 */
export declare const SAMPLE_ROWS: BenchRow[];
export type VerdictKind = "better" | "worse" | "noise" | "unknown";
export type Verdict = {
    kind: VerdictKind;
    /** The true ratio, always >= 1 ("2.41x better"). Infinity when the candidate is 0. */
    ratio: number;
    /** Which side failed to declare a spread - the reason an `unknown` is unknown. */
    missing: "both" | "baseline" | "candidate" | null;
    /** Why the verdict says what it says - printed nowhere, asserted in the test. */
    reason: string;
};
/**
 * A number as a benchmark harness actually prints it. `github-action-benchmark`
 * declares `range` a string and its own canonical example ships `"range": "3"`;
 * in the wild it carries the sign too ("+/- 12"). Refusing those would put a
 * parsing chore between the rows a user already has and the picture, which is
 * the whole thing this template is trying to delete.
 */
export declare function toNum(v: unknown): number | null;
/**
 * The verdict, derived from the INTERVALS and never from the ratio alone.
 *
 * Two runs are only called apart when their `+/- range` intervals are
 * disjoint. Overlapping intervals are noise however large the ratio looks,
 * and a row that gave no range on either side gets no verdict at all — the
 * whole point of the template.
 */
export declare function verdictOf(row: BenchRow, smallerIsBetter: boolean): Verdict;
/** Compact, ASCII, four significant-ish digits - benchmark numbers as printed. */
export declare function fmtNum(n: number): string;
/** "2.41" / "12.4" / "140" / ">999" - the multiplier people actually write. */
export declare function fmtRatio(r: number): string;
/** The verdict in words, for the row's right-hand column. Unit-agnostic on purpose. */
export declare function verdictText(v: Verdict): string;
/** Blend two #rrggbb by `t` (0 = a, 1 = b). Deterministic, no clamp surprises. */
export declare function mix(a: string, b: string, t: number): MosaicColor;
export type BenchRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
/** A fitted block: the text as it will be drawn (newlines are the wrap), its size and measured width. */
export type BenchFit = {
    text: string;
    px: number;
    width: number;
    lines: number;
};
export type RowLayout = {
    row: BenchRow;
    verdict: Verdict;
    /** The row's band - the extent the pair of bars lives in. NOT painted. */
    band: BenchRect;
    baseBar: BenchRect;
    candBar: BenchRect;
    /** The +/- interval as a stripe over its bar; null when that side gave no range. */
    baseIv: BenchRect | null;
    candIv: BenchRect | null;
    name: BenchFit;
    nameRect: BenchRect;
    values: BenchFit;
    valuesRect: BenchRect;
    verdictFit: BenchFit;
    verdictRect: BenchRect;
};
export type BenchLayout = {
    W: number;
    H: number;
    /** The scale unit: min(H, 0.75 * W) - chrome never follows H alone. */
    S: number;
    margin: number;
    divider: BenchRect;
    title: BenchFit;
    titleRect: BenchRect;
    subtitle: BenchFit | null;
    subtitleRect: BenchRect;
    summary: BenchFit;
    summaryRect: BenchRect;
    /** The one vertical reference every baseline bar ends at. */
    rule: BenchRect;
    ruleLabel: BenchFit;
    ruleLabelRect: BenchRect;
    trackX: number;
    trackW: number;
    /** Track pixels one baseline is worth. Every bar on the card uses it. */
    ref: number;
    rows: RowLayout[];
    /**
     * One entry per channel. The CANDIDATE entry carries one swatch per verdict
     * present on the card, because the candidate bars are coloured by verdict -
     * a single swatch there would teach a rule the picture does not follow.
     */
    legend: Array<{
        swatches: Array<{
            rect: BenchRect;
            kind: VerdictKind | null;
        }>;
        label: BenchFit;
        labelRect: BenchRect;
        key: "base" | "cand" | "iv";
    }>;
    footer: BenchFit;
    footerRect: BenchRect;
    shown: number;
    total: number;
};
/**
 * The whole geometry as a pure function of the data and the canvas. Exported
 * so the test can assert the rects and the scale without parsing m0: that the
 * baseline bars all end at the rule, that a regression crosses it, that
 * nothing leaves its track, and that every fitted block fits its box.
 */
export declare function layoutBenchDelta(rows: BenchRow[], opts: {
    title: string;
    subtitle: string;
    baselineLabel: string;
    candidateLabel: string;
    smallerIsBetter: boolean;
}, W: number, H: number): BenchLayout;
/**
 * What the geometry promises. Text is calibrated from the MEASURED block, so
 * the check compares the true width with the realized box; the chrome the
 * design depends on gets a band. Labels are per row, because a label is
 * one-to-many and one row's calibration must not excuse another row's clip.
 */
export declare function benchLayoutContract(L: BenchLayout): LayoutConstraint[];
export declare const BenchDeltaV1: import("@m0saic/types").MosaicTemplate<BenchDeltaProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default BenchDeltaV1;
/** WCAG contrast ratio between two #rrggbb, 1..21. */
export declare function contrastRatio(a: string, b: string): number;
/**
 * Ink for text on a coloured fill: whichever of the two inks CONTRASTS better,
 * measured, not guessed. A luminance threshold put white on a mid-green at
 * 2.5:1 - below every readability floor there is - because mid-tones sit right
 * where a single cutoff is worst.
 */
export declare function onColor(hex: MosaicColor): MosaicColor;
