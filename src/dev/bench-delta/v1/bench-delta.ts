import type {
  MosaicColor,
  MosaicDocument,
  MosaicEngineContext,
  MosaicSource,
} from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import {
  bindProp,
  bindPropPath,
  defineMosaicTemplate,
  definePropsSchema,
  makeColorTile,
  placeInsetPieces,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, ellipsize, textCell, widthOf, wrapFit } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

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

const ID = "@one-a-day/dev/bench-delta/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Drawn at most this many rows; the rest are counted in the footer. */
export const MAX_ROWS = 8;
/**
 * The rule sits where the longest bar on the card still fits the track, but a
 * single catastrophic regression must not shrink every other bar to a stub -
 * so the scale stops widening here and an over-long bar is clamped to the
 * track. The printed ratio is always the true one.
 */
const MAX_REL = 3.2;
/** Headroom past the longest bar so it never touches the track's edge. */
const REL_PAD = 1.06;

/** Hand-tuned trios: dark is tuned, not derived from light. */
const PRESETS = {
  dark: {
    bg: "#0d1117" as MosaicColor,
    ink: "#e6edf3" as MosaicColor,
    dim: "#8b949e" as MosaicColor,
    base: "#6b7784" as MosaicColor,
    worse: "#f85149" as MosaicColor,
    noise: "#d29922" as MosaicColor,
    unknown: "#4a545f" as MosaicColor,
    rule: "#adbac7" as MosaicColor,
  },
  light: {
    bg: "#ffffff" as MosaicColor,
    ink: "#1f2328" as MosaicColor,
    dim: "#59636e" as MosaicColor,
    base: "#9fa9b4" as MosaicColor,
    worse: "#cf222e" as MosaicColor,
    noise: "#9a6700" as MosaicColor,
    unknown: "#c9d0d7" as MosaicColor,
    rule: "#424a53" as MosaicColor,
  },
};

const DEFAULT_ACCENT = "#3fb950";
const DEFAULT_TITLE = "v1.5 vs v1.4";
const DEFAULT_SUBTITLE = "best of 10 runs - 8-core M4 Pro - cold caches";
const DEFAULT_BASELINE = "v1.4";
const DEFAULT_CANDIDATE = "v1.5";

/**
 * The default card IS the argument, and it is chosen to make every state the
 * template can reach visible with no inputs: a clear win whose intervals are
 * far apart; a 4% "improvement" whose intervals overlap, so it is noise; a
 * regression that crosses the rule; a row measured once on each side, so
 * there is no spread at all; and a row where only the BASELINE was measured
 * repeatedly - a 1.42x gap that still earns no claim, because one run is not
 * a measurement.
 */
export const SAMPLE_ROWS: BenchRow[] = [
  { name: "parse 1MB json", unit: "ms", base: 412, baseRange: 14, value: 171, range: 6 },
  { name: "render 10k rows", unit: "ms", base: 88.2, baseRange: 9.6, value: 84.6, range: 8.4 },
  { name: "cold start", unit: "ms", base: 1240, baseRange: 61, value: 1395, range: 64 },
  { name: "gzip 4MB", unit: "ms", base: 59, value: 44.5 },
  { name: "resolve imports", unit: "ms", base: 210, baseRange: 9, value: 148 },
];

const propsSchema = definePropsSchema<BenchDeltaProps>({
  rows: {
    type: "list",
    required: true,
    description:
      "The benchmark cases, in the order they should read. Each row is the pair of runs for one benchmark: name, unit, the baseline number and the candidate number, plus the run-to-run variance of each (+/-). A row with no variance on either side gets no verdict - that is deliberate. Up to 8 rows are drawn.",
    meta: { constraints: { maxItems: 32 }, ui: { label: "Rows", order: 1, primary: true } },
    fields: {
      name: { type: "string", required: true, description: "The benchmark's name, as the harness prints it.", meta: { ui: { label: "Name" } } },
      unit: { type: "string", required: false, description: 'Unit shown after the numbers ("ms", "MB", "ops/s"). Units may differ per row - bars are ratios, not magnitudes.', meta: { control: { placeholder: "none" }, ui: { label: "Unit" } } },
      base: { type: "number", required: true, description: "The baseline measurement. Must be greater than zero: the whole row is drawn relative to it.", meta: { ui: { label: "Baseline" } } },
      baseRange: { type: "number", required: false, description: "Run-to-run variance of the baseline, as +/- this much (the same field github-action-benchmark calls range). BOTH sides need one before the row gets a verdict; 0 is a valid answer and means the metric is deterministic.", meta: { constraints: { min: 0 }, control: { placeholder: "none" }, ui: { label: "Baseline +/-" } } },
      value: { type: "number", required: true, description: "The candidate measurement.", meta: { ui: { label: "Candidate" } } },
      range: { type: "number", required: false, description: "Run-to-run variance of the candidate, as +/- this much. A string is accepted too - github-action-benchmark declares this field a string and emits \"3\".", meta: { constraints: { min: 0 }, control: { placeholder: "none" }, ui: { label: "Candidate +/-" } } },
    },
  },
  title: {
    type: "string",
    required: false,
    description: "Headline: what is being compared. The rect that shows it is bound to it, so Make's double-click edits it in place.",
    meta: { control: { placeholder: DEFAULT_TITLE }, ui: { label: "Title", order: 2, primary: true } },
  },
  subtitle: {
    type: "string",
    required: false,
    description: "The conditions caveat - machine, run count, cache state. A benchmark picture without one gets torn apart; empty removes the line anyway.",
    meta: { control: { placeholder: "none" }, ui: { label: "Subtitle", order: 3 } },
  },
  baselineLabel: {
    type: "string",
    required: false,
    description: "Name of the baseline run. It labels the vertical rule every baseline bar ends at.",
    meta: { control: { placeholder: DEFAULT_BASELINE }, ui: { label: "Baseline label", order: 4 } },
  },
  candidateLabel: {
    type: "string",
    required: false,
    description: "Name of the candidate run, shown in the legend.",
    meta: { control: { placeholder: DEFAULT_CANDIDATE }, ui: { label: "Candidate label", order: 5 } },
  },
  smallerIsBetter: {
    type: "boolean",
    required: false,
    description: "True when a LOWER number is better (times, bytes, allocations) - the default. False for throughput (ops/s, requests/s). Mirrors the action's customSmallerIsBetter / customBiggerIsBetter.",
    meta: { ui: { label: "Smaller is better", order: 6 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Hand-tuned background / ink / muted trio: "dark" (default) or "light". READMEs need both.',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 7 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The colour an improvement is drawn in, as #rrggbb. Regression, noise and no-spread colours are fixed by the preset - only the win is yours to brand.",
    meta: {
      constraints: { isColor: true },
      control: { colorPicker: true, defaultColor: DEFAULT_ACCENT },
      ui: { label: "Accent", order: 8 },
    },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the rule spans the rows, the bars stay on their track) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 9 } },
  },
});

/* ── the arithmetic: pure, exported, and what the test asserts ── */

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
export function toNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v.replace(/\u00b1/g, "").replace(/\+\/-/g, "").replace(/,/g, "").trim();
  if (s.length === 0) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** A finite, strictly positive number, or null. */
function pos(v: unknown): number | null {
  const n = toNum(v);
  return n !== null && n > 0 ? n : null;
}

/**
 * The verdict, derived from the INTERVALS and never from the ratio alone.
 *
 * Two runs are only called apart when their `+/- range` intervals are
 * disjoint. Overlapping intervals are noise however large the ratio looks,
 * and a row that gave no range on either side gets no verdict at all — the
 * whole point of the template.
 */
export function verdictOf(row: BenchRow, smallerIsBetter: boolean): Verdict {
  const base = pos(row.base);
  const v = toNum(row.value);
  const value = v !== null && v >= 0 ? v : null;
  if (base === null || value === null) return { kind: "unknown", ratio: 1, missing: "both", reason: "a measurement is missing" };
  const better = smallerIsBetter ? value < base : value > base;
  const hi = Math.max(base, value);
  const lo = Math.min(base, value);
  const ratio = lo > 0 ? hi / lo : Infinity;
  // A side DECLARES its spread when the field is there and parses - `0`
  // included, which is a real claim ("this metric is deterministic"). An
  // ABSENT field is not a claim of exactness, it is silence.
  const bR = toNum(row.baseRange);
  const vR = toNum(row.range);
  const bOk = bR !== null && bR >= 0;
  const vOk = vR !== null && vR >= 0;
  // BOTH sides, or no claim. Treating a silent side as an exact point makes
  // disjointness trivial to satisfy, and a candidate run once would earn a
  // confident pill - which is the single thing this template exists to refuse.
  if (!bOk || !vOk) {
    const missing = !bOk && !vOk ? "both" : !bOk ? "baseline" : "candidate";
    return {
      kind: "unknown",
      ratio,
      missing,
      reason: missing === "both" ? "no spread given on either side" : `no spread given for the ${missing}`,
    };
  }
  const b0 = base - (bR as number);
  const b1 = base + (bR as number);
  const v0 = value - (vR as number);
  const v1 = value + (vR as number);
  if (b0 <= v1 && v0 <= b1) return { kind: "noise", ratio, missing: null, reason: "the intervals overlap" };
  return { kind: better ? "better" : "worse", ratio, missing: null, reason: "the intervals are disjoint" };
}

/** Compact, ASCII, four significant-ish digits - benchmark numbers as printed. */
export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "-";
  const a = Math.abs(n);
  const r = a >= 1000 ? Math.round(n) : a >= 10 ? Math.round(n * 10) / 10 : a >= 1 ? Math.round(n * 100) / 100 : Math.round(n * 1000) / 1000;
  return String(r);
}

/** "2.41" / "12.4" / "140" / ">999" - the multiplier people actually write. */
export function fmtRatio(r: number): string {
  if (!Number.isFinite(r)) return ">999";
  if (r >= 100) return String(Math.round(r));
  if (r >= 10) return (Math.round(r * 10) / 10).toFixed(1);
  return (Math.round(r * 100) / 100).toFixed(2);
}

/** The verdict in words, for the row's right-hand column. Unit-agnostic on purpose. */
export function verdictText(v: Verdict): string {
  if (v.kind === "unknown") return v.missing === "both" ? "no spread given" : "one side unmeasured";
  if (v.kind === "noise") return "within noise";
  // "1.00x worse" is a number and a word disagreeing in the same pill. Under
  // half a percent the ratio has nothing left to say, so say the percentage.
  const r = fmtRatio(v.ratio);
  if (r === "1.00") {
    const pct = (v.ratio - 1) * 100;
    return `${pct < 0.05 ? "<0.1" : pct.toFixed(1)}% ${v.kind}`;
  }
  return `${r}x ${v.kind}`;
}

/* ── colour ── */

/** Blend two #rrggbb by `t` (0 = a, 1 = b). Deterministic, no clamp surprises. */
export function mix(a: string, b: string, t: number): MosaicColor {
  const k = Math.max(0, Math.min(1, t));
  const ch = (s: string, i: number) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k));
  return `#${out.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}

/* ── geometry ── */

export type BenchRect = { x: number; y: number; w: number; h: number };
/** A fitted block: the text as it will be drawn (newlines are the wrap), its size and measured width. */
export type BenchFit = { text: string; px: number; width: number; lines: number };

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
    swatches: Array<{ rect: BenchRect; kind: VerdictKind | null }>;
    label: BenchFit;
    labelRect: BenchRect;
    key: "base" | "cand" | "iv";
  }>;
  footer: BenchFit;
  footerRect: BenchRect;
  shown: number;
  total: number;
};

/** One line, shrunk until it fits; never wraps. */
function fitOne(text: string, maxW: number, maxPx: number, minPx: number, bold = false): BenchFit {
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && widthOf(text, px, bold) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
  // At the floor and still too wide there is nothing left to shrink; a
  // benchmark name is the user's word and cannot be reworded for them.
  const out = widthOf(text, px, bold) > maxW ? ellipsize(text, px, maxW, bold) : text;
  return { text: out, px, width: widthOf(out, px, bold), lines: 1 };
}

/**
 * The largest single-line size at which EVERY string fits `maxW` - one type
 * size for a whole column. Two adjacent rows at different sizes read as a
 * rendering bug, so the column shrinks together or not at all.
 */
function sharedLinePx(texts: string[], maxW: number, maxPx: number, minPx: number, bold = false): number {
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && texts.some((t) => widthOf(t, px, bold) > maxW)) px = Math.max(minPx, Math.round(px * 0.92));
  return px;
}

/** {@link sharedLinePx} for blocks that may wrap: every one must fit its box in `maxLines`. */
function sharedBlockPx(texts: string[], maxW: number, maxH: number, maxPx: number, minPx: number, maxLines: number, bold = false): number {
  const fitsAll = (px: number) =>
    texts.every((t) => {
      const lines = wrapFit(t, px, maxW);
      return (
        lines.length <= maxLines &&
        Math.max(...lines.map((l) => widthOf(l, px, bold))) <= maxW &&
        Math.ceil(px * 1.25 * lines.length) <= maxH
      );
    });
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && !fitsAll(px)) px = Math.max(minPx, Math.round(px * 0.92));
  return px;
}

/**
 * A one-line list of clauses, fitted by DROPPING whole clauses rather than
 * cutting the sentence. `segments` is ordered most-important first, so what
 * falls off the end is explanation and never a disclosure: an ellipsized
 * footer used to eat "showing 7 of 10 rows" at exactly the canvas where rows
 * get dropped, which is when a reader most needs to be told.
 */
function fitSegments(segments: string[], maxW: number, maxPx: number, minPx: number): { fit: BenchFit; dropped: number } {
  for (let n = segments.length; n >= 1; n--) {
    const text = segments.slice(0, n).join(" - ");
    let px = Math.max(minPx, Math.round(maxPx));
    while (px > minPx && widthOf(text, px) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
    if (widthOf(text, px) <= maxW) return { fit: { text, px, width: widthOf(text, px), lines: 1 }, dropped: segments.length - n };
  }
  // Even the first clause alone does not fit: shrink it and, only here, cut it.
  const one = fitOne(segments[0] ?? "", maxW, maxPx, minPx);
  return { fit: one, dropped: Math.max(0, segments.length - 1) };
}

/** Several AUTHORED lines at one shared size, shrunk until the widest fits. */
function fitLines(lines: string[], maxW: number, maxPx: number, minPx: number, bold = false): BenchFit {
  const wid = (p: number, ls: string[]) => Math.max(...ls.map((l) => widthOf(l, p, bold)));
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && wid(px, lines) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
  const out = wid(px, lines) > maxW ? lines.map((l) => ellipsize(l, px, maxW, bold)) : lines;
  return { text: out.join("\n"), px, width: wid(px, out), lines: out.length };
}

/**
 * The degrade ladder for a name nobody can shorten for us: shrink to the
 * floor, then wrap to `maxLines`, and only then ellipsize the last line.
 * Ellipsis is the floor's last resort, never the first move.
 */
function fitBlock(text: string, maxW: number, maxH: number, maxPx: number, minPx: number, maxLines: number, bold = false): BenchFit {
  const attempt = (px: number): BenchFit | null => {
    const lines = wrapFit(text, px, maxW);
    if (lines.length > maxLines) return null;
    const block = lines.join("\n");
    const w = Math.max(...lines.map((l) => widthOf(l, px, bold)));
    const h = Math.ceil(px * 1.25 * lines.length);
    if (w > maxW || h > maxH) return null;
    return { text: block, px, width: w, lines: lines.length };
  };
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx) {
    const fit = attempt(px);
    if (fit) return fit;
    px = Math.max(minPx, Math.round(px * 0.92));
  }
  const floor = attempt(minPx);
  if (floor) return floor;
  // Floor reached. Drop LINES before reaching for an ellipsis: keep only as
  // many as the box can actually hold at the floor size (a taller block than
  // the box is not a fit, it is a clip), then ellipsize the last one.
  const roomForLines = Math.max(1, Math.floor(maxH / Math.max(1, minPx * 1.25)));
  const keep = Math.max(1, Math.min(maxLines, roomForLines));
  const all = wrapFit(text, minPx, maxW);
  const lines = all.slice(0, keep);
  if (all.length > keep) {
    // Words are being dropped, so the last kept line must SAY so - ellipsize
    // the whole remainder, not just the line, or the name silently loses its
    // tail and the card reads as if that were the benchmark's real name.
    lines[keep - 1] = ellipsize(all.slice(keep - 1).join(" "), minPx, maxW, bold);
  }
  const block = lines.join("\n");
  return { text: block, px: minPx, width: Math.max(...lines.map((l) => widthOf(l, minPx, bold))), lines: lines.length };
}

/**
 * The whole geometry as a pure function of the data and the canvas. Exported
 * so the test can assert the rects and the scale without parsing m0: that the
 * baseline bars all end at the rule, that a regression crosses it, that
 * nothing leaves its track, and that every fitted block fits its box.
 */
export function layoutBenchDelta(
  rows: BenchRow[],
  opts: {
    title: string;
    subtitle: string;
    baselineLabel: string;
    candidateLabel: string;
    smallerIsBetter: boolean;
  },
  W: number,
  H: number,
): BenchLayout {
  // ── scale: chrome follows min(H, 0.75W), never H alone ──
  const S = Math.min(H, 0.75 * W);
  const margin = Math.max(6, Math.round(0.055 * S));
  const minPx = Math.max(7, Math.round(0.016 * S));
  const contentW = Math.max(32, W - 2 * margin);

  // ── header. The summary's HEIGHT is reserved before its text exists: it is
  //    always at most two lines, and it has to count the rows that are
  //    actually DRAWN, which is not known until the band below is measured. ──
  const titleW = Math.floor(contentW * 0.58);
  const sumW = contentW - titleW - Math.round(0.02 * contentW);
  const title = fitOne(opts.title, budget(titleW), Math.round(0.058 * S), minPx, true);
  const subPx = Math.max(minPx, Math.round(0.027 * S));
  const subtitle = opts.subtitle.length > 0 ? fitOne(opts.subtitle, budget(titleW), subPx, minPx) : null;
  const titleH = Math.round(1.25 * title.px);
  const subH = subtitle ? Math.round(1.5 * subtitle.px) : 0;
  const headerH = Math.max(titleH + subH, Math.round(subPx * 1.35 * 2));
  const titleRect: BenchRect = { x: margin, y: margin, w: titleW, h: titleH };
  const subtitleRect: BenchRect = { x: margin, y: margin + titleH, w: titleW, h: Math.max(1, subH) };
  const summaryRect: BenchRect = { x: margin + contentW - sumW, y: margin, w: sumW, h: headerH };

  const dividerH = Math.max(2, Math.round(0.0035 * S));
  const divider: BenchRect = { x: margin, y: margin + headerH + Math.round(0.45 * margin), w: contentW, h: dividerH };

  // ── the footer and legend bands: their HEIGHTS follow the type scale, not
  //    their copy, so the band between can be measured before either is worded ──
  let legendPx = Math.max(minPx, Math.round(0.026 * S));
  const legendH = Math.round(1.7 * legendPx);
  const footPx = Math.max(minPx, Math.round(0.023 * S));
  const footH = Math.round(1.5 * footPx);
  const footerRect: BenchRect = { x: margin, y: H - margin - footH, w: contentW, h: footH };
  const legendY = footerRect.y - Math.round(0.35 * margin) - legendH;

  // ── the rows band ──
  const rowsTop = divider.y + divider.h + Math.round(0.7 * margin);
  const ruleLabelPx = Math.max(minPx, Math.round(0.024 * S));
  const ruleLabelH = Math.round(1.35 * ruleLabelPx);
  const bandTop = rowsTop + ruleLabelH;
  const bandBottom = legendY - Math.round(0.5 * margin);
  const bandH = Math.max(24, bandBottom - bandTop);

  // How many rows actually fit. A row below the pitch floor is not drawn, and
  // the footer says how many were dropped rather than drawing a smear. This
  // count is the ONE source of truth: the summary above counts these rows too.
  // The floor is what a row genuinely needs - two bars, their gap, and a
  // legible name over its values - not a generous fraction of the canvas.
  // At 0.075*S a 1080p card could never fit MAX_ROWS, which is a budget that
  // lies about itself.
  const minPitch = Math.max(20, Math.round(0.05 * S));
  let shown = Math.min(rows.length, MAX_ROWS);
  while (shown > 1 && Math.floor(bandH / shown) < minPitch) shown -= 1;
  const drawn = rows.slice(0, shown);
  // The pitch is ALSO capped: a tall portrait band divided by four rows hands
  // each one ~390px, which draws four small panels adrift in empty space. Cap
  // it and centre the block in the band instead.
  const maxPitch = Math.max(minPitch, Math.round(0.17 * S));
  const pitch = Math.max(minPitch, Math.min(maxPitch, Math.floor(bandH / Math.max(1, shown))));
  const rowGap = Math.max(2, Math.round(pitch * 0.2));
  const rowH = Math.max(8, pitch - rowGap);
  const blockH = (shown - 1) * pitch + rowH;
  const blockTop = bandTop + Math.max(0, Math.floor((bandH - blockH) / 2));

  // ── Columns. The track is what is left after the label and the verdict.
  //    The label column WIDENS before a name is cut: that is a real rung of
  //    the degrade ladder (shrink, wrap, widen the column, drop lines, and
  //    only then ellipsize), and it costs the track a little width rather
  //    than costing the reader a word.
  const verdW = Math.round(contentW * 0.17);
  const colGap = Math.round(contentW * 0.015);
  const nameCapFor = (h: number) => Math.max(minPx, Math.min(Math.round(0.03 * S), Math.round(h * 0.42)));
  const nameBoxHFor = (h: number) => Math.round(h * 0.56);
  const labelFrac = (() => {
    const cap = nameCapFor(rowH);
    const comfortable = Math.max(minPx, Math.round(cap * 0.62));
    const boxH = nameBoxHFor(rowH);
    const names = rows.slice(0, shown).map((r) => r.name);
    const tried = [0.28, 0.32, 0.36].map((f) => {
      const w = budget(Math.round(contentW * f));
      const px = sharedBlockPx(names, w, boxH, cap, minPx, 2, true);
      // Would any name still LOSE WORDS at this width? Widening is a rung
      // above cutting, so a width that keeps every name whole wins even when
      // the type ends up smaller than comfortable.
      const cut = names.some((n) => fitBlock(n, w, boxH, px, minPx, 2, true).text.endsWith("..."));
      return { f, px, cut };
    });
    const whole = tried.filter((t) => !t.cut);
    if (whole.length > 0) return (whole.find((t) => t.px >= comfortable) ?? whole[0]).f;
    // Nothing fits whole at any width: the box is genuinely too small (the
    // 480x270 contract floor holds one line of 7px type). The ellipsis below
    // is the last rung, and it is reached only here.
    return tried[tried.length - 1].f;
  })();
  const labelW = Math.round(contentW * labelFrac);
  const trackX = margin + labelW + colGap;
  const trackW = Math.max(24, contentW - labelW - verdW - 2 * colGap);
  const verdX = margin + contentW - verdW;

  // ── the scale: one ref for the whole card ──
  let worst = 1;
  for (const r of drawn) {
    const b = pos(r.base);
    if (b === null) continue;
    const bHi = b + (typeof r.baseRange === "number" && r.baseRange > 0 ? r.baseRange : 0);
    const vHi = Math.max(0, r.value) + (typeof r.range === "number" && r.range > 0 ? r.range : 0);
    worst = Math.max(worst, bHi / b, vHi / b);
  }
  const rel = Math.max(1.02, Math.min(MAX_REL, worst * REL_PAD));
  const ref = Math.max(8, Math.floor(trackW / rel));

  // The pair of bars sits INSIDE the lane with air above and below: bars that
  // fill their row read as slabs and the lane stops framing anything.
  // The bar height is ALSO capped against the scale unit, not just the row:
  // a tall portrait canvas hands each row ~170px, and a bar that takes its
  // share of that stops being a bar and becomes a slab.
  const barBand = Math.max(6, Math.round(rowH * 0.78));
  const barGap = Math.max(2, Math.round(rowH * 0.11));
  const barH = Math.max(3, Math.min(Math.round(0.05 * S), Math.floor((barBand - barGap) / 2)));
  // The lane hugs the pair of bars rather than filling the row, so a tall
  // portrait row does not draw a mostly-empty wash around two thin bars.
  const pairH = 2 * barH + barGap;
  const laneH = Math.min(rowH, pairH + 2 * Math.max(2, Math.round(barH * 0.45)));
  const laneTop = Math.max(0, Math.floor((rowH - laneH) / 2));
  const barTop = laneTop + Math.max(0, Math.floor((laneH - pairH) / 2));
  const ivH = Math.max(2, Math.round(barH * 0.46));
  // A row that gave no spread gets a THINNER candidate bar. Colour alone is
  // ambiguous across presets; a bar that is visibly slighter says "this one
  // carries no confidence" in both, and the verdict column names it.
  const thinH = Math.max(2, Math.round(barH * 0.58));
  const minBar = Math.max(3, Math.round(0.004 * S));
  /** The smallest interval mark that still reads as a mark. */
  const minIv = Math.max(3, Math.round(0.005 * S));

  // ── ONE type size per column, shared by every row. Fitting each row on its
  //    own leaves neighbouring names at different sizes, which reads as a bug.
  //    A row that still cannot fit at the shared size degrades on its own. ──
  const verdicts = drawn.map((r) => verdictOf(r, opts.smallerIsBetter));
  const nameBoxW = budget(labelW);
  const nameBoxH = nameBoxHFor(rowH);
  const numbersOf = (r: BenchRow) => `${fmtNum(r.base)} -> ${fmtNum(r.value)}`;
  const valuesOf = (r: BenchRow) => {
    const unit = typeof r.unit === "string" && r.unit.trim().length > 0 ? ` ${r.unit.trim()}` : "";
    return `${numbersOf(r)}${unit}`;
  };
  const nameCap = nameCapFor(rowH);
  const valCap = Math.max(minPx, Math.min(Math.round(0.024 * S), Math.round(rowH * 0.32)));
  const verdCap = Math.max(minPx, Math.min(Math.round(0.027 * S), Math.round(rowH * 0.38)));
  const namePx = sharedBlockPx(drawn.map((r) => r.name), nameBoxW, nameBoxH, nameCap, minPx, 2, true);
  // The unit is the droppable part of this line. Cutting the tail instead
  // would truncate the candidate NUMBER, and a card that prints a number which
  // is not the measurement is worse than one that omits "ms".
  const valWidth = budget(labelW);
  const withUnit = sharedLinePx(drawn.map(valuesOf), valWidth, valCap, minPx);
  const unitFits = drawn.every((r) => widthOf(valuesOf(r), withUnit) <= valWidth);
  const valPx = unitFits ? withUnit : sharedLinePx(drawn.map(numbersOf), valWidth, valCap, minPx);
  const valueText = unitFits ? valuesOf : numbersOf;
  const verdPx = sharedLinePx(verdicts.map(verdictText), budget(verdW), verdCap, minPx, true);

  const out: RowLayout[] = drawn.map((row, i) => {
    const verdict = verdicts[i];
    const y = blockTop + i * pitch;
    const b = pos(row.base) ?? 1;
    const relPx = (v: number) => Math.max(0, Math.min(trackW, Math.round((Math.max(0, v) / b) * ref)));
    const ivOf = (v: number, r: number | undefined, slotY: number, h: number): BenchRect | null => {
      if (typeof r !== "number" || !Number.isFinite(r) || r <= 0) return null;
      const lo = relPx(v - r);
      const hi = relPx(v + r);
      const y = slotY + Math.round((h - ivH) / 2);
      const span = hi - lo;
      // Below the floor the interval would be a 2px block sitting at `lo`,
      // which both reads as nothing and biases the mark to the left of the
      // value it belongs to. Draw a caliper CENTRED on the value instead: it
      // reads as "measured, and tight", which is what the data says.
      if (span < minIv) {
        const x = Math.max(trackX, Math.min(trackX + trackW - minIv, trackX + relPx(v) - Math.round(minIv / 2)));
        return { x, y, w: minIv, h: ivH };
      }
      const w = Math.min(span, trackW);
      return { x: Math.max(trackX, Math.min(trackX + trackW - w, trackX + lo)), y, w, h: ivH };
    };

    const baseY = y + barTop;
    const candSlotY = y + barTop + barH + barGap;
    const candH = verdict.kind === "unknown" ? thinH : barH;
    const candY = candSlotY + Math.round((barH - candH) / 2);
    const baseBar: BenchRect = { x: trackX, y: baseY, w: Math.max(minBar, relPx(row.base)), h: barH };
    const candBar: BenchRect = { x: trackX, y: candY, w: Math.max(minBar, relPx(row.value)), h: candH };
    const baseIv = ivOf(row.base, row.baseRange, baseY, barH);
    const candIv = ivOf(row.value, row.range, candY, candH);

    // The label block hugs its own copy and centres in the row, so a tall
    // portrait row does not strand the name at the top and the value at the
    // bottom of an empty column.
    const name = fitBlock(row.name, nameBoxW, nameBoxH, namePx, minPx, 2, true);
    const values = fitOne(valueText(row), budget(labelW), valPx, minPx);
    const nameH = Math.min(nameBoxH, Math.ceil(name.px * 1.3 * name.lines));
    const valH = Math.ceil(values.px * 1.5);
    const blockY = y + Math.max(0, Math.floor((rowH - (nameH + valH)) / 2));
    const nameRect: BenchRect = { x: margin, y: blockY, w: labelW, h: nameH };
    const valuesRect: BenchRect = { x: margin, y: blockY + nameH, w: labelW, h: valH };
    const verdictFit = fitOne(verdictText(verdict), budget(verdW), verdPx, minPx, true);
    const verdictRect: BenchRect = { x: verdX, y, w: verdW, h: rowH };
    return {
      row, verdict,
      band: { x: trackX, y: y + laneTop, w: trackW, h: laneH },
      baseBar, candBar, baseIv, candIv,
      name, nameRect, values, valuesRect, verdictFit, verdictRect,
    };
  });

  // ── now that `shown` is settled, word the summary and the footer ──
  // Counted over EVERY row, not just the drawn ones: a verdict is a property
  // of the measurement, and a header that says "2 better" while 10 rows are
  // better is the card undercounting its own data. The footer says how many
  // of them got drawn.
  const counts = rows
    .map((r) => verdictOf(r, opts.smallerIsBetter))
    .reduce<Record<VerdictKind, number>>(
      (a, v) => { a[v.kind] += 1; return a; },
      { better: 0, worse: 0, noise: 0, unknown: 0 },
    );
  const parts = [
    ...(counts.better > 0 ? [`${counts.better} better`] : []),
    ...(counts.worse > 0 ? [`${counts.worse} worse`] : []),
    ...(counts.noise > 0 ? [`${counts.noise} within noise`] : []),
    ...(counts.unknown > 0 ? [`${counts.unknown} no spread`] : []),
  ];
  const half = Math.ceil(parts.length / 2);
  // Authored lines, not a wrap: the counts read as pairs, and a wrapper would
  // break them wherever the width happened to run out.
  // Four of the eleven tool dialects github-action-benchmark supports report no
  // variance at all. Repeating "no spread given" down every row turns that into
  // a wall of grey; say it ONCE, as the headline it actually is.
  const allUnmeasured = rows.length > 0 && counts.unknown === rows.length;
  const summaryLines =
    parts.length === 0
      ? ["no rows"]
      : allUnmeasured
        ? ["no spreads given", "this card cannot say if any change is real"]
        : parts.length <= 2
          ? [parts.join(" - ")]
          : [parts.slice(0, half).join(" - "), parts.slice(half).join(" - ")];
  const summary = fitLines(summaryLines, budget(sumW), subPx, minPx);

  // Any rectangle that is no longer to scale has to be declared, at BOTH ends:
  // a bar cut to the track at the top, and a bar raised to the minimum width at
  // the bottom (a 1000x win and a 100x win otherwise draw the same stub). The
  // printed ratio stays exact either way, and the footer says so.
  const trackEnd = trackX + trackW;
  const notToScale = out.filter((r) => {
    const cut = r.candBar.x + r.candBar.w >= trackEnd || (r.candIv !== null && r.candIv.x + r.candIv.w >= trackEnd) || (r.baseIv !== null && r.baseIv.x + r.baseIv.w >= trackEnd);
    const floored = r.candBar.w <= minBar && r.row.base > 0 && (r.row.value / r.row.base) * ref < minBar;
    return cut || floored;
  }).length;
  // Ordered by what a reader cannot afford to lose. The direction the card is
  // scoring comes first; then the two disclosures, which are the honest part;
  // then the method; and only then the explanation, which is the first thing
  // dropped when the canvas is too narrow to hold the sentence.
  const footerSegments = [
    opts.smallerIsBetter ? "smaller is better" : "bigger is better",
    ...(rows.length > shown ? [`showing ${shown} of ${rows.length} rows`] : []),
    ...(notToScale > 0 ? [`${notToScale} row${notToScale === 1 ? "" : "s"} not to scale - the printed ratio is exact`] : []),
    // State the method, not just the encoding: what was computed is whether
    // the two reported ranges overlap. That is weaker than a significance
    // test, and the card should not let a reader assume otherwise.
    "a verdict means the two +/- ranges do not overlap",
    "each bar is relative to its own row's baseline",
  ];
  const footer = fitSegments(footerSegments, budget(contentW), footPx, minPx).fit;

  // ── the rule, and the label that names it ──
  const ruleX = trackX + ref;
  const bandUsed = shown > 0 ? blockH : bandH;
  // The rule is drawn OVER the bars, so a candidate that crosses it visibly
  // crosses it. It is the one element the whole card is measured against.
  const ruleW = Math.max(2, Math.round(0.0048 * S));
  const rule: BenchRect = { x: ruleX - ruleW, y: blockTop - Math.round(0.35 * margin), w: ruleW, h: bandUsed + Math.round(0.7 * margin) };
  const ruleLabelText = `${opts.baselineLabel} baseline`;
  const ruleLabelW = Math.min(Math.round(contentW * 0.4), ruleX - trackX + Math.round(0.02 * contentW));
  const ruleLabel = fitOne(ruleLabelText, budget(ruleLabelW), ruleLabelPx, minPx);
  const ruleLabelRect: BenchRect = { x: rule.x + rule.w - ruleLabelW, y: rule.y - ruleLabelH, w: ruleLabelW, h: ruleLabelH };

  // ── legend: one entry per channel, left to right ──
  const sw = Math.max(6, Math.round(legendPx * 0.85));
  const swGap = Math.max(1, Math.round(legendPx * 0.22));
  // The candidate bars are coloured BY VERDICT, so the candidate entry shows
  // every verdict actually on this card. One green swatch beside the label
  // "v1.5" would say the v1.5 bars are green when three of four are not.
  // Spectrum order, not declaration order: better -> noise -> worse reads as a
  // scale, which is what the colours are.
  const kindsPresent = (["better", "noise", "worse", "unknown"] as VerdictKind[]).filter((k) =>
    out.some((r) => r.verdict.kind === k),
  );
  const legendKeys: Array<{ key: "base" | "cand" | "iv"; text: string; kinds: Array<VerdictKind | null> }> = [
    { key: "base", text: opts.baselineLabel, kinds: [null] },
    {
      key: "cand",
      text: kindsPresent.length > 1 ? `${opts.candidateLabel} - by verdict` : opts.candidateLabel,
      kinds: kindsPresent.length > 0 ? kindsPresent : [null],
    },
    { key: "iv", text: "run-to-run range", kinds: [null] },
  ];
  // The legend accumulates left to right, so long run labels used to push the
  // last entry past the content margin. Shrink the legend's type until the
  // whole row fits, and only then drop the most explanatory entry.
  const legendWidth = (px: number, keys: typeof legendKeys) => {
    const w = Math.max(6, Math.round(px * 0.85));
    const gap = Math.max(1, Math.round(px * 0.22));
    return keys.reduce((acc, k) => {
      const lw = Math.ceil(widthOf(k.text, px) / 0.94) + 4;
      return acc + k.kinds.length * w + (k.kinds.length - 1) * gap + Math.round(0.4 * px) + lw + Math.round(1.2 * px);
    }, 0);
  };
  let legendShown = legendKeys;
  while (legendPx > minPx && legendWidth(legendPx, legendShown) > contentW) legendPx = Math.max(minPx, Math.round(legendPx * 0.92));
  if (legendWidth(legendPx, legendShown) > contentW && legendShown.length > 2) legendShown = legendShown.slice(0, 2);
  let lx = margin;
  const legend = legendShown.map(({ key, text, kinds }) => {
    const label = fitOne(text, Math.max(16, Math.floor(contentW * 0.3)), legendPx, minPx);
    const swatches = kinds.map((kind, i) => ({
      rect: { x: lx + i * (sw + swGap), y: legendY + Math.round((legendH - sw) / 2), w: sw, h: sw },
      kind,
    }));
    const swEnd = lx + kinds.length * sw + (kinds.length - 1) * swGap;
    // Size the cell to the measured block through the SAME 0.94 budget the
    // fit used, plus the quantization allowance - a rect cut to the exact
    // measured width realizes one pixel short and the contract calls the clip.
    const labelRect: BenchRect = { x: swEnd + Math.round(0.4 * legendPx), y: legendY, w: Math.ceil(label.width / 0.94) + 4, h: legendH };
    lx = labelRect.x + labelRect.w + Math.round(1.2 * legendPx);
    return { swatches, label, labelRect, key };
  });

  return {
    W, H, S, margin, divider,
    title, titleRect, subtitle, subtitleRect, summary, summaryRect,
    rule, ruleLabel, ruleLabelRect, trackX, trackW, ref,
    rows: out, legend, footer, footerRect,
    shown, total: rows.length,
  };
}

/**
 * What the geometry promises. Text is calibrated from the MEASURED block, so
 * the check compares the true width with the realized box; the chrome the
 * design depends on gets a band. Labels are per row, because a label is
 * one-to-many and one row's calibration must not excuse another row's clip.
 */
export function benchLayoutContract(L: BenchLayout): LayoutConstraint[] {
  const text: LayoutConstraint[] = [
    textFitsMeasured("title", L.title.text, L.title.px, L.title.width),
    textFitsMeasured("summary", L.summary.text, L.summary.px, L.summary.width),
    textFitsMeasured("rule-label", L.ruleLabel.text, L.ruleLabel.px, L.ruleLabel.width),
    textFitsMeasured("footer", L.footer.text, L.footer.px, L.footer.width),
    ...(L.subtitle ? [textFitsMeasured("subtitle", L.subtitle.text, L.subtitle.px, L.subtitle.width)] : []),
    ...L.rows.flatMap((r, i) => [
      textFitsMeasured(`name-${i}`, r.name.text, r.name.px, r.name.width),
      textFitsMeasured(`values-${i}`, r.values.text, r.values.px, r.values.width),
      textFitsMeasured(`verdict-${i}`, r.verdictFit.text, r.verdictFit.px, r.verdictFit.width),
    ]),
    ...L.legend.map((l) => textFitsMeasured(`legend-${l.key}`, l.label.text, l.label.px, l.label.width)),
  ];
  return [
    ...text,
    // The rule IS the scale, so what must never happen is that it COLLAPSES or
    // goes missing - then the card stops stating what its bars are relative to.
    // A canvas fraction is a poor proxy for "spans the rows" (a one-row card
    // has a legitimately short rule), so the contract only catches the
    // collapse (a single-row portrait card has a legitimately short rule); that
    // it covers every lane is asserted exactly in the test, rects in hand.
    { label: "rule", minHeightFrac: 0.04, within: { yFrac: [0.05, 1] } },
    { label: "divider", minWidthFrac: 0.88, within: { yFrac: [0, 0.45] } },
    // Every bar lives on the track, right of the label column.
    { label: "bar-base", within: { xFrac: [0.24, 1] } },
    // The two interval rects ARE the verdict's evidence, so they are exactly
    // the elements that must never leave the track unnoticed.
    ...(L.rows.some((r) => r.baseIv) ? [{ label: "iv-base", within: { xFrac: [0.24, 1] } } as LayoutConstraint] : []),
    ...(L.rows.some((r) => r.candIv) ? [{ label: "iv-cand", within: { xFrac: [0.24, 1] } } as LayoutConstraint] : []),
    ...(["better", "worse", "noise", "unknown"] as VerdictKind[])
      .filter((k) => L.rows.some((r) => r.verdict.kind === k))
      .map((k): LayoutConstraint => ({ label: `bar-${k}`, within: { xFrac: [0.24, 1] } })),
    // The verdict pills are load-bearing: they are the card's claim, and a
    // row that made no claim deliberately has none - so only the kinds that
    // actually drew one are constrained, and `unknown` is absent by design.
    ...(["better", "worse", "noise"] as VerdictKind[])
      .filter((k) => L.rows.some((r) => r.verdict.kind === k))
      .map((k): LayoutConstraint => ({ label: `pill-${k}`, within: { xFrac: [0.7, 1] } })),
    // Presence: the legend is how a stranger reads which bar is which.
    ...L.legend.map((l): LayoutConstraint => ({ label: `swatch-${l.key}`, within: { yFrac: [0.6, 1] } })),
  ];
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-09-21/.
 */
const WHY: WhySpec = {
  day: 2,
  date: "2026-09-21",
  agent: "claude",
  model: "claude-opus-5[1m]",
  id: ID,
  title: "Bench Delta",
  who: "Maintainers of libraries, compilers, runtimes and dev tools who publish a performance claim every release; found on GitHub, CI bot PRs and Hacker News.",
  problem: [
    "Every release the same shaped numbers have to become the same picture again. The rows already exist: github-action-benchmark says each entry \"only needs to provide name, unit, and value. You can also provide optional range (results' variance)\". The picture does not.",
    "So it is made by hand. esbuild commits images/benchmark-light.svg and benchmark-dark.svg into its repo. hyperfine (28.9k stars) ships SIX plotting scripts for its own --export-json, and \"To make these scripts work, you will need numpy, matplotlib and scipy\".",
    "And the charts that do get posted are argued with. A coreutils co-maintainer, on one: \"I find it a bit frustrating that benchmarks are thrown out without any methodology or citations, because they are often trusted without question.\"",
  ],
  // Order matters: the tutorial's problem page prints the first six, so the
  // verified, load-bearing sources lead and the llvm-ld issue - which the
  // scout's verification pass demoted to one person's own repo - goes last.
  sources: [
    "https://github.com/benchmark-action/github-action-benchmark",
    "https://github.com/sharkdp/hyperfine/tree/master/scripts",
    "https://github.com/evanw/esbuild",
    "https://news.ycombinator.com/item?id=49370832",
    "https://news.ycombinator.com/item?id=30268920",
    "https://news.ycombinator.com/item?id=21535972",
    "https://github.com/oxc-project/bench-resolver/pull/184",
    "https://news.ycombinator.com/item?id=49770064",
    "https://news.ycombinator.com/item?id=49727511",
    "https://github.com/zackees/llvm-ld/issues/32",
  ],
  solution: [
    "Every baseline bar ends at ONE shared rule, and the candidate bar is drawn relative to its own baseline - so a bar's length is the speedup, not the magnitude, and ns, MB and percent sit on one card honestly. With smaller-is-better, a bar crossing the rule is a regression.",
    "The run-to-run range is a second rectangle and the verdict comes from it: disjoint intervals are better or worse, overlapping are within noise, and a row where EITHER side gave no range gets no verdict. One run is not a measurement, so it does not earn a claim.",
    "It is a still on purpose. HN 30268920: \"Animated charts ... are entertainment, not a tool for seriously comparing data.\" HN 21535972, on bar chart races: it \"forces you to wait for the animation to finish\". The picture you commit beside the README is the product.",
  ],
  usage: {
    command: "m0saic make @one-a-day/dev/bench-delta/v1 --template-repo . -w 1600 -h 900 --props @bench.json -o bench.png",
    try: [
      "drop every range: all four rows fall back to \"no spread given\"",
      "smallerIsBetter: false - the verdicts invert, the geometry does not",
      "preset: light - the other half of a README's picture pair",
      "debugLayout: true - the contract drawn over the card",
    ],
  },
  caveats: [
    "Rectangles stop being to scale past 3.2x and below the minimum bar width; the footer counts those rows and the printed ratio stays exact.",
    "Disjoint +/- intervals are not a significance test - they are what the harness reported, drawn honestly.",
    "Above 8 rows the extra are counted in the header and footer, not drawn; a tighter canvas draws fewer still.",
  ],
  // No runner trace.json for this run (an interactive session, not the
  // pipeline), so: phase boundaries are the journal's own file mtimes, the two
  // fanned-out phases report the harness's exact agent, tool-call and token
  // totals, and the main-loop tool counts are the agent's own count. Dollars
  // are omitted rather than guessed - the input/output split needed to price
  // them was not measurable from inside the session.
  timeline: {
    source: "self-reported",
    phases: [
      { name: "scout", startMs: 0, durMs: 1111000, calls: 28, tools: "Bash 24, Write 2, Workflow 1" },
      { name: "scout sweep (24 agents)", startMs: 151000, durMs: 2379655, calls: 907, tokens: 2603945, tools: "WebFetch, WebSearch, hn.mjs, Bash" },
      { name: "plan", startMs: 1111000, durMs: 90000, calls: 4, tools: "Write 2, Bash 2" },
      { name: "build", startMs: 1201000, durMs: 1869000, calls: 46, tools: "Bash 24, Edit 8, Read 9, Write 5" },
      { name: "critique (7 agents)", startMs: 3070000, durMs: 3028315, calls: 415, tokens: 1174492, tools: "Read, Bash, m0saic make, ffmpeg" },
      { name: "fix + ship", startMs: 4770000, durMs: 2400000, calls: 96, tools: "Bash 52, Edit 14, Read 16, Write 14" },
    ],
  },
};

export const BenchDeltaV1 = defineMosaicTemplate<BenchDeltaProps>({
  id: asTemplateId(ID),
  label: "2026-09-21 · Bench Delta",
  version: 1,
  description:
    "Before/after benchmark card. Every baseline bar ends at one shared rule and the candidate bar is drawn relative to its own baseline, so bar length is the speedup and mixed units sit on one card; the run-to-run range is a second rectangle, and the verdict - better, worse, within noise, or no spread given - is derived from whether the intervals overlap.",
  capabilities: { tier: "core" },
  tags: ["dev", "2026-09-21", "day-002", "benchmark", "regression", "before-after", "variance", "readme", "still"],

  outputHints: {
    width: 1600,
    height: 900,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "A still - the picture you commit beside the README. 1600x900 downsamples cleanly into GitHub's column; portrait and square re-lay the same rows.",
  },

  propsSchema,
  defaultProps: {
    rows: SAMPLE_ROWS,
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
    baselineLabel: DEFAULT_BASELINE,
    candidateLabel: DEFAULT_CANDIDATE,
    smallerIsBetter: true,
    preset: "dark",
    accent: DEFAULT_ACCENT,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default BenchDeltaV1;

/** WCAG relative luminance of a #rrggbb. */
function luminance(hex: string): number {
  const c = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}

/** WCAG contrast ratio between two #rrggbb, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Ink for text on a coloured fill: whichever of the two inks CONTRASTS better,
 * measured, not guessed. A luminance threshold put white on a mid-green at
 * 2.5:1 - below every readability floor there is - because mid-tones sit right
 * where a single cutoff is worst.
 */
export function onColor(hex: MosaicColor): MosaicColor {
  const fill = String(hex);
  const dark = "#0b1220";
  const light = "#ffffff";
  return (contrastRatio(fill, dark) >= contrastRatio(fill, light) ? dark : light) as MosaicColor;
}

/** An optional string prop: undefined = the default, "" = removed. */
function pickText(value: string | undefined, fallback: string, name: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") throw new Error(`${ID}: ${name} must be a string.`);
  return value.replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
}

function pickColor(value: string | undefined, fallback: MosaicColor, name: string): MosaicColor {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length === 0) return fallback;
  if (!HEX.test(s)) throw new Error(`${ID}: ${name} ${JSON.stringify(value)} must be #rrggbb.`);
  return s as MosaicColor;
}

async function render(props: BenchDeltaProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  const raw = Array.isArray(props.rows) ? props.rows : [];
  if (raw.length === 0) throw new Error(`${ID}: rows must hold at least one { name, base, value }.`);
  const rows: BenchRow[] = raw.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`${ID}: rows[${i}] is not an object.`);
    // Props arrive as JSON, so read the row loosely and normalize here - the
    // declared BenchRow is what the template PROMISES, not what a host sends.
    const r = row as unknown as Record<string, unknown>;
    const name = pickText(typeof r.name === "string" ? r.name : undefined, "", `rows[${i}].name`);
    if (name.length === 0) throw new Error(`${ID}: rows[${i}].name must not be empty.`);
    // Numbers are read through `toNum`, so the strings a real harness emits
    // ("3", " 12 ", "+/- 4", "1,024") land without a parsing step in between.
    const base = pos(r.base);
    if (base === null) throw new Error(`${ID}: rows[${i}].base must be a number greater than zero - every bar on the row is relative to it. Got ${JSON.stringify(r.base)}.`);
    const value = toNum(r.value);
    if (value === null || value < 0) throw new Error(`${ID}: rows[${i}].value must be a number of zero or more. Got ${JSON.stringify(r.value)}.`);
    const spread: Record<"baseRange" | "range", number | null> = { baseRange: null, range: null };
    for (const k of ["baseRange", "range"] as const) {
      const v = r[k];
      if (v === undefined || v === null || v === "") continue;
      const n = toNum(v);
      if (n === null || n < 0) throw new Error(`${ID}: rows[${i}].${k} must be a number of zero or more (it is a +/- spread). Got ${JSON.stringify(v)}.`);
      spread[k] = n;
    }
    return {
      name,
      ...(typeof r.unit === "string" && r.unit.trim().length > 0 ? { unit: pickText(r.unit, "", `rows[${i}].unit`) } : {}),
      base,
      // 0 is kept: it is a claim of exactness, and verdictOf needs to see it.
      // (Nothing is DRAWN for a zero-width interval - ivOf skips it.)
      ...(spread.baseRange !== null ? { baseRange: spread.baseRange } : {}),
      value,
      ...(spread.range !== null ? { range: spread.range } : {}),
    };
  });

  const smallerIsBetter = props.smallerIsBetter !== false;
  const theme = props.preset === "light" ? PRESETS.light : PRESETS.dark;
  const accent = pickColor(props.accent, DEFAULT_ACCENT as MosaicColor, "accent");
  const opts = {
    title: pickText(props.title, DEFAULT_TITLE, "title") || DEFAULT_TITLE,
    subtitle: pickText(props.subtitle, DEFAULT_SUBTITLE, "subtitle"),
    baselineLabel: pickText(props.baselineLabel, DEFAULT_BASELINE, "baselineLabel") || DEFAULT_BASELINE,
    candidateLabel: pickText(props.candidateLabel, DEFAULT_CANDIDATE, "candidateLabel") || DEFAULT_CANDIDATE,
    smallerIsBetter,
  };

  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const L = layoutBenchDelta(rows, opts, W, H);

  const barColor = (k: VerdictKind): MosaicColor =>
    k === "better" ? accent : k === "worse" ? theme.worse : k === "noise" ? theme.noise : theme.unknown;
  // The interval reads over its own bar AND over the empty track past it, so
  // it is the bar's colour pulled toward the ink, not toward the background.
  const ivColor = (c: MosaicColor): MosaicColor => mix(String(c), String(theme.ink), 0.55);

  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const piece = (rect: BenchRect, importance: number, source: MosaicSource) => pieces.push({ rect: { ...rect, importance }, source });
  const fill = (rect: BenchRect, importance: number, color: MosaicColor, label: string, radius = 0.35) =>
    piece(rect, importance, tag({ ...makeColorTile(color, radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: radius } } } : {}) } as MosaicSource, label));
  const text = (rect: BenchRect, importance: number, fit: BenchFit, color: MosaicColor, label: string, o: { hAlign?: "left" | "right" | "center"; bold?: boolean; vAlign?: "top" | "middle" } = {}) =>
    piece(rect, importance, tag(textCell({ text: fit.text, fontSize: fit.px, color, hAlign: o.hAlign ?? "left", bold: o.bold, vAlign: o.vAlign ?? "middle", label }), label));

  // ── Emission order is a PERFORMANCE contract, not a style choice.
  //    `placeInsetPieces` packs greedily: a rect goes on the first overlay
  //    layer it does not collide with. Emitting row by row (lane, bars,
  //    interval, text, lane, bars, ...) forces a new layer per row and the
  //    engine warned at 22 deep against its threshold of 20 - past ~25 ffmpeg
  //    SILENTLY degrades inline masks, which is every glyph on this card.
  //    Emitting KIND by kind lets each kind share one layer, because rects of
  //    the same kind never overlap each other.

  // 1. chrome the rest sits on
  fill(L.divider, 1, mix(String(theme.bg), String(theme.ink), 0.18), "divider", 0);
  // 2. the lane washes - one per row, never overlapping
  // NO lane wash. It was the only rect on this card that carried no data, and
  // it was expensive: a full-track rect under every bar and every interval
  // keeps the tiles off the engine's grid sheet, which pushed the overlay
  // chain to 27 at five rows - past the ~25 where ffmpeg SILENTLY degrades
  // inline masks, and every glyph here is an inline mask. Removing it drops
  // the warning entirely at any row count. The row still reads: the baseline
  // bar above is itself the full-length reference the wash was drawing.
  // 3. every bar, plus the pills and legend swatches, which live in columns
  //    the bars never reach
  for (const r of L.rows) {
    fill(r.baseBar, 2, theme.base, "bar-base");
    fill(r.candBar, 2, barColor(r.verdict.kind), `bar-${r.verdict.kind}`);
  }
  // The verdict is a filled PILL - a block of colour survives the thumbnail
  // the browse card is scaled to, where 20px of coloured type does not.
  //
  // Except for `unknown`. The pill IS the claim, so a row that made no claim
  // does not get one: it stays quiet dim type with nothing behind it. Drawing
  // it as a filled pill was variant b, and it read as a fourth verdict rather
  // than the absence of one.
  const pills = L.rows.map((r) => {
    if (r.verdict.kind === "unknown") return null;
    const padX = Math.round(r.verdictFit.px * 0.85);
    const pillH = Math.round(r.verdictFit.px * 2);
    const pillW = Math.min(r.verdictRect.w, Math.ceil(r.verdictFit.width / 0.94) + 2 * padX + 4);
    return {
      x: r.verdictRect.x + r.verdictRect.w - pillW,
      y: r.verdictRect.y + Math.round((r.verdictRect.h - pillH) / 2),
      w: pillW,
      h: pillH,
    } as BenchRect;
  });
  L.rows.forEach((r, i) => {
    const pill = pills[i];
    if (pill) fill(pill, 2, barColor(r.verdict.kind), `pill-${r.verdict.kind}`, 0.5);
  });
  for (const l of L.legend) {
    for (const sw of l.swatches) {
      const color = l.key === "base" ? theme.base : l.key === "cand" ? (sw.kind ? barColor(sw.kind) : accent) : ivColor(theme.base);
      const swatch = tag({ ...makeColorTile(color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: 0.35 } } }) } as MosaicSource, `swatch-${l.key}`);
      // `accent` paints the "better" swatch, so that is the rect that shows it.
      piece(sw.rect, 2, l.key === "cand" && sw.kind === "better" ? bindProp(swatch, "accent") : swatch);
    }
  }
  // 4. the intervals, which sit over their own bar and over nothing else
  for (const r of L.rows) {
    if (r.baseIv) fill(r.baseIv, 3, ivColor(theme.base), "iv-base", 0.6);
    if (r.candIv) fill(r.candIv, 3, ivColor(barColor(r.verdict.kind)), "iv-cand", 0.6);
  }
  // 5. the rule, over every bar: a candidate that crosses it visibly crosses it
  fill(L.rule, 4, theme.rule, "rule", 0);

  // 6. every text last - the label column, the verdicts, and the chrome copy
  piece(L.titleRect, 2, bindProp(tag(textCell({ text: L.title.text, fontSize: L.title.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "title"));
  if (L.subtitle) piece(L.subtitleRect, 2, bindProp(tag(textCell({ text: L.subtitle.text, fontSize: L.subtitle.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "subtitle" }), "subtitle"), "subtitle"));
  text(L.summaryRect, 2, L.summary, theme.dim, "summary", { hAlign: "right" });
  L.rows.forEach((r, i) => {
    piece(r.nameRect, 2, bindPropPath(tag(textCell({ text: r.name.text, fontSize: r.name.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: `name-${i}` }), `name-${i}`), "rows", [i, "name"], "string"));
    // NOT bound: this cell renders "412 -> 171 ms", which is two props and a
    // unit joined. Make edits a binding in place, so binding it to `value`
    // would write the whole visible string into one number. Bind the rect that
    // SHOWS the prop, never derived text.
    piece(r.valuesRect, 2, tag(textCell({ text: r.values.text, fontSize: r.values.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: `values-${i}` }), `values-${i}`));
    const pill = pills[i];
    if (pill) text(pill, 5, r.verdictFit, onColor(barColor(r.verdict.kind)), `verdict-${i}`, { hAlign: "center", bold: true });
    else text(r.verdictRect, 2, r.verdictFit, theme.dim, `verdict-${i}`, { hAlign: "right", bold: true });
  });
  // Also not bound: it renders "<baselineLabel> baseline". The legend's own
  // cell shows the label alone and carries that binding instead.
  piece(L.ruleLabelRect, 2, tag(textCell({ text: L.ruleLabel.text, fontSize: L.ruleLabel.px, color: theme.dim, hAlign: "right", vAlign: "middle", label: "rule-label" }), "rule-label"));
  for (const l of L.legend) {
    const cell = tag(textCell({ text: l.label.text, fontSize: l.label.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: `legend-${l.key}` }), `legend-${l.key}`);
    piece(l.labelRect, 2, l.key === "base" ? bindProp(cell, "baselineLabel") : l.key === "cand" ? bindProp(cell, "candidateLabel") : cell);
  }
  text(L.footerRect, 2, L.footer, mix(String(theme.bg), String(theme.ink), 0.55), "footer");

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    size: { width: W, height: H },
    backgroundColor: theme.bg,
    sources: placed.sources,
    editor: { label: `Bench Delta · ${L.shown} of ${L.total} rows · ${opts.title}` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: benchLayoutContract(L), debug: props.debugLayout === true });
}
