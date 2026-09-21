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
 * ends at the same x, so the card has ONE vertical rule; the CANDIDATE bar is
 * drawn relative to its own baseline, so its length is the speedup and
 * nothing else; and anything that crosses the rule is a regression, readable
 * as a shape before a label. Ratios — not magnitudes — are the shared channel,
 * which is what lets ns, MB and percent sit on one card without the scale
 * lying. The numbers stay as printed text in the label column, where mixed
 * units are fine.
 *
 * The second rectangle in each bar is the run-to-run interval (`range`, the
 * same optional field `github-action-benchmark` already carries), and the
 * VERDICT is derived from it, never from the ratio alone: disjoint intervals
 * are `better` / `worse`, overlapping intervals are `within noise`, and a row
 * with no range at all reads `no spread given`. That last one is the opinion
 * this template exists to hold — given no variance, it will not tell you a
 * change is real. The incumbent (the action's own check) calls a regression
 * when a number is "worse than the previous exceeding 200% threshold", which
 * has no notion of noise at all.
 *
 * The rule that bites: **svg text never wraps or shrinks by itself, and
 * benchmark names are arbitrary user strings.** Every cell here is measured
 * against the bundled font and fitted with a real degrade ladder — shrink,
 * then wrap to two lines, then (only at the floor, only for a name nobody can
 * shorten for the user) ellipsize. The layout contract is calibrated from the
 * measured width, so what the gate checks is the TRUE width against the
 * REALIZED box.
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
    lane: "#151a21" as MosaicColor,
    base: "#6b7784" as MosaicColor,
    worse: "#f85149" as MosaicColor,
    noise: "#d29922" as MosaicColor,
    unknown: "#98a2ad" as MosaicColor,
    rule: "#adbac7" as MosaicColor,
  },
  light: {
    bg: "#ffffff" as MosaicColor,
    ink: "#1f2328" as MosaicColor,
    dim: "#59636e" as MosaicColor,
    lane: "#eef1f4" as MosaicColor,
    base: "#9fa9b4" as MosaicColor,
    worse: "#cf222e" as MosaicColor,
    noise: "#9a6700" as MosaicColor,
    unknown: "#6e7781" as MosaicColor,
    rule: "#424a53" as MosaicColor,
  },
};

const DEFAULT_ACCENT = "#3fb950";
const DEFAULT_TITLE = "v1.5 vs v1.4";
const DEFAULT_SUBTITLE = "best of 10 runs - 8-core M4 Pro - cold caches";
const DEFAULT_BASELINE = "v1.4";
const DEFAULT_CANDIDATE = "v1.5";

/**
 * The default card is the argument: one clear win, one 4% "improvement" that
 * is within noise, one regression that crosses the rule, and one row with no
 * range at all - all four verdicts, visible with no inputs.
 */
export const SAMPLE_ROWS: BenchRow[] = [
  { name: "parse 1MB json", unit: "ms", base: 412, baseRange: 14, value: 171, range: 6 },
  { name: "render 10k rows", unit: "ms", base: 88.2, baseRange: 9.6, value: 84.6, range: 8.4 },
  { name: "cold start", unit: "ms", base: 1240, baseRange: 61, value: 1395, range: 64 },
  { name: "gzip 4MB", unit: "ms", base: 59, value: 44.5 },
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
      baseRange: { type: "number", required: false, description: "Run-to-run variance of the baseline, as +/- this much (the same field github-action-benchmark calls range).", meta: { constraints: { min: 0 }, control: { placeholder: "none" }, ui: { label: "Baseline +/-" } } },
      value: { type: "number", required: true, description: "The candidate measurement.", meta: { ui: { label: "Candidate" } } },
      range: { type: "number", required: false, description: "Run-to-run variance of the candidate, as +/- this much.", meta: { constraints: { min: 0 }, control: { placeholder: "none" }, ui: { label: "Candidate +/-" } } },
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
  /** Why the verdict says what it says - printed nowhere, asserted in the test. */
  reason: string;
};

/** A finite, strictly positive number, or null. */
function pos(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
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
  const value = typeof row.value === "number" && Number.isFinite(row.value) && row.value >= 0 ? row.value : null;
  if (base === null || value === null) return { kind: "unknown", ratio: 1, reason: "a measurement is missing" };
  const better = smallerIsBetter ? value < base : value > base;
  const hi = Math.max(base, value);
  const lo = Math.min(base, value);
  const ratio = lo > 0 ? hi / lo : Infinity;
  const bR = typeof row.baseRange === "number" && Number.isFinite(row.baseRange) && row.baseRange >= 0 ? row.baseRange : null;
  const vR = typeof row.range === "number" && Number.isFinite(row.range) && row.range >= 0 ? row.range : null;
  if (bR === null && vR === null) return { kind: "unknown", ratio, reason: "no spread given on either side" };
  // A side that gave a range keeps it; a side that did not is treated as exact
  // (a point interval), which is the most generous reading of what it said.
  const b0 = base - (bR ?? 0);
  const b1 = base + (bR ?? 0);
  const v0 = value - (vR ?? 0);
  const v1 = value + (vR ?? 0);
  if (b0 <= v1 && v0 <= b1) return { kind: "noise", ratio, reason: "the intervals overlap" };
  return { kind: better ? "better" : "worse", ratio, reason: "the intervals are disjoint" };
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
  if (v.kind === "unknown") return "no spread given";
  if (v.kind === "noise") return "within noise";
  return `${fmtRatio(v.ratio)}x ${v.kind}`;
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
  /** Track wash behind both bars. */
  lane: BenchRect;
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
  legend: Array<{ swatch: BenchRect; label: BenchFit; labelRect: BenchRect; key: "base" | "cand" | "iv" }>;
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
  const legendPx = Math.max(minPx, Math.round(0.026 * S));
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

  // Columns. The track is what is left after the label and verdict columns.
  const labelW = Math.round(contentW * 0.28);
  const verdW = Math.round(contentW * 0.17);
  const colGap = Math.round(contentW * 0.015);
  const trackX = margin + labelW + colGap;
  const trackW = Math.max(24, contentW - labelW - verdW - 2 * colGap);
  const verdX = margin + contentW - verdW;

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
  const pitch = Math.max(minPitch, Math.floor(bandH / Math.max(1, shown)));
  const rowGap = Math.max(2, Math.round(pitch * 0.2));
  const rowH = Math.max(8, pitch - rowGap);

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

  // ── ONE type size per column, shared by every row. Fitting each row on its
  //    own leaves neighbouring names at different sizes, which reads as a bug.
  //    A row that still cannot fit at the shared size degrades on its own. ──
  const verdicts = drawn.map((r) => verdictOf(r, opts.smallerIsBetter));
  const nameBoxW = budget(labelW);
  const nameBoxH = Math.round(rowH * 0.56);
  const valuesOf = (r: BenchRow) => {
    const unit = typeof r.unit === "string" && r.unit.trim().length > 0 ? ` ${r.unit.trim()}` : "";
    return `${fmtNum(r.base)} -> ${fmtNum(r.value)}${unit}`;
  };
  const nameCap = Math.max(minPx, Math.min(Math.round(0.03 * S), Math.round(rowH * 0.42)));
  const valCap = Math.max(minPx, Math.min(Math.round(0.024 * S), Math.round(rowH * 0.32)));
  const verdCap = Math.max(minPx, Math.min(Math.round(0.027 * S), Math.round(rowH * 0.38)));
  const namePx = sharedBlockPx(drawn.map((r) => r.name), nameBoxW, nameBoxH, nameCap, minPx, 2, true);
  const valPx = sharedLinePx(drawn.map(valuesOf), budget(labelW), valCap, minPx);
  const verdPx = sharedLinePx(verdicts.map(verdictText), budget(verdW), verdCap, minPx, true);

  const out: RowLayout[] = drawn.map((row, i) => {
    const verdict = verdicts[i];
    const y = bandTop + i * pitch;
    const b = pos(row.base) ?? 1;
    const relPx = (v: number) => Math.max(0, Math.min(trackW, Math.round((Math.max(0, v) / b) * ref)));
    const ivOf = (v: number, r: number | undefined, slotY: number, h: number): BenchRect | null =>
      typeof r === "number" && Number.isFinite(r) && r > 0
        ? { x: trackX + relPx(v - r), y: slotY + Math.round((h - ivH) / 2), w: Math.max(2, relPx(v + r) - relPx(v - r)), h: ivH }
        : null;

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
    const values = fitOne(valuesOf(row), budget(labelW), valPx, minPx);
    const nameH = Math.min(nameBoxH, Math.ceil(name.px * 1.3 * name.lines));
    const valH = Math.ceil(values.px * 1.5);
    const blockY = y + Math.max(0, Math.floor((rowH - (nameH + valH)) / 2));
    const nameRect: BenchRect = { x: margin, y: blockY, w: labelW, h: nameH };
    const valuesRect: BenchRect = { x: margin, y: blockY + nameH, w: labelW, h: valH };
    const verdictFit = fitOne(verdictText(verdict), budget(verdW), verdPx, minPx, true);
    const verdictRect: BenchRect = { x: verdX, y, w: verdW, h: rowH };
    return {
      row, verdict,
      lane: { x: trackX, y: y + laneTop, w: trackW, h: laneH },
      baseBar, candBar, baseIv, candIv,
      name, nameRect, values, valuesRect, verdictFit, verdictRect,
    };
  });

  // ── now that `shown` is settled, word the summary and the footer ──
  const counts = verdicts.reduce<Record<VerdictKind, number>>(
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
  const summaryLines =
    parts.length === 0
      ? ["no rows"]
      : parts.length <= 2
        ? [parts.join(" - ")]
        : [parts.slice(0, half).join(" - "), parts.slice(half).join(" - ")];
  const summary = fitLines(summaryLines, budget(sumW), subPx, minPx);

  const footerText = [
    opts.smallerIsBetter ? "smaller is better" : "bigger is better",
    "each bar is relative to its own row's baseline",
    "the rule is the baseline",
    ...(rows.length > shown ? [`showing ${shown} of ${rows.length} rows`] : []),
  ].join(" - ");
  const footer = fitOne(footerText, budget(contentW), footPx, minPx);

  // ── the rule, and the label that names it ──
  const ruleX = trackX + ref;
  const bandUsed = shown > 0 ? (shown - 1) * pitch + rowH : bandH;
  // The rule is drawn OVER the bars, so a candidate that crosses it visibly
  // crosses it. It is the one element the whole card is measured against.
  const ruleW = Math.max(2, Math.round(0.0048 * S));
  const rule: BenchRect = { x: ruleX - ruleW, y: bandTop - Math.round(0.12 * margin), w: ruleW, h: bandUsed + Math.round(0.5 * margin) };
  const ruleLabelText = `${opts.baselineLabel} baseline`;
  const ruleLabelW = Math.min(Math.round(contentW * 0.4), ruleX - trackX + Math.round(0.02 * contentW));
  const ruleLabel = fitOne(ruleLabelText, budget(ruleLabelW), ruleLabelPx, minPx);
  const ruleLabelRect: BenchRect = { x: rule.x + rule.w - ruleLabelW, y: rowsTop, w: ruleLabelW, h: ruleLabelH };

  // ── legend: three swatches, left to right ──
  const sw = Math.max(6, Math.round(legendPx * 0.85));
  const legendKeys: Array<{ key: "base" | "cand" | "iv"; text: string }> = [
    { key: "base", text: opts.baselineLabel },
    { key: "cand", text: opts.candidateLabel },
    { key: "iv", text: "run-to-run range" },
  ];
  let lx = margin;
  const legend = legendKeys.map(({ key, text }) => {
    const label = fitOne(text, Math.max(16, Math.floor(contentW * 0.26)), legendPx, minPx);
    const swatch: BenchRect = { x: lx, y: legendY + Math.round((legendH - sw) / 2), w: sw, h: sw };
    // Size the cell to the measured block through the SAME 0.94 budget the
    // fit used, plus the quantization allowance - a rect cut to the exact
    // measured width realizes one pixel short and the contract calls the clip.
    const labelRect: BenchRect = { x: lx + sw + Math.round(0.4 * legendPx), y: legendY, w: Math.ceil(label.width / 0.94) + 4, h: legendH };
    lx = labelRect.x + labelRect.w + Math.round(1.4 * legendPx);
    return { swatch, label, labelRect, key };
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
    // The rule IS the scale: if it is missing or collapsed the card stops
    // stating what its bars are relative to.
    // What matters about the rule is that it SPANS the rows - a collapsed or
    // missing rule is a card that no longer states what its bars mean. Its
    // exact top depends on how tall the header wrapped, so the band is loose
    // and the height is the real assertion.
    { label: "rule", minHeightFrac: 0.25, within: { yFrac: [0.05, 1] } },
    { label: "divider", minWidthFrac: 0.8, within: { yFrac: [0, 0.45] } },
    // Every bar and every lane lives on the track, right of the label column.
    { label: "lane", minWidthFrac: 0.35, within: { xFrac: [0.24, 1] } },
    { label: "bar-base", within: { xFrac: [0.24, 1] } },
    ...(["better", "worse", "noise", "unknown"] as VerdictKind[])
      .filter((k) => L.rows.some((r) => r.verdict.kind === k))
      .map((k): LayoutConstraint => ({ label: `bar-${k}`, within: { xFrac: [0.24, 1] } })),
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
  sources: [
    "https://github.com/benchmark-action/github-action-benchmark",
    "https://github.com/sharkdp/hyperfine/tree/master/scripts",
    "https://github.com/evanw/esbuild",
    "https://github.com/oxc-project/bench-resolver/pull/184",
    "https://github.com/zackees/llvm-ld/issues/32",
    "https://news.ycombinator.com/item?id=49370832",
    "https://news.ycombinator.com/item?id=49770064",
    "https://news.ycombinator.com/item?id=30268920",
    "https://news.ycombinator.com/item?id=21535972",
    "https://news.ycombinator.com/item?id=49727511",
  ],
  solution: [
    "Every baseline bar ends at ONE shared rule, and the candidate bar is drawn relative to its own baseline - so a bar's length is the speedup, not the magnitude, and ns, MB and percent sit on one card honestly. Anything crossing the rule is a regression, read as a shape.",
    "The run-to-run range is a second rectangle, and the verdict comes from it: disjoint intervals are better or worse, overlapping intervals are within noise, and a row with no range reads \"no spread given\". Given no variance it will not call a change real.",
    "It is a still on purpose. HN item 30268920: \"Animated charts are like that. They're entertainment, not a tool for seriously comparing data.\" Nobody asked for an animated benchmark. The picture you commit beside the README is the product.",
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
    "One catastrophic regression stops widening the scale at 3.2x; its bar clamps to the track and only the printed ratio stays exact.",
    "Disjoint +/- intervals are not a significance test - they are what the harness reported, drawn honestly.",
    "Above 8 rows the extra rows are counted in the footer, not drawn.",
  ],
  timeline: {
    source: "self-reported",
    phases: [{ name: "scout", startMs: 0, durMs: 1000 }],
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

/** Ink for text on a coloured fill: white on a dark one, near-black on a pale one (relative luminance). */
function onColor(hex: MosaicColor): MosaicColor {
  const c = (i: number) => {
    const v = parseInt(String(hex).slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
  return (lum > 0.4 ? "#0b1220" : "#ffffff") as MosaicColor;
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
  const rows: BenchRow[] = raw.map((r, i) => {
    if (!r || typeof r !== "object") throw new Error(`${ID}: rows[${i}] is not an object.`);
    const name = pickText(typeof r.name === "string" ? r.name : undefined, "", `rows[${i}].name`);
    if (name.length === 0) throw new Error(`${ID}: rows[${i}].name must not be empty.`);
    if (pos(r.base) === null) throw new Error(`${ID}: rows[${i}].base must be a number greater than zero - every bar on the row is relative to it.`);
    if (typeof r.value !== "number" || !Number.isFinite(r.value) || r.value < 0) throw new Error(`${ID}: rows[${i}].value must be a number of zero or more.`);
    for (const k of ["baseRange", "range"] as const) {
      const v = r[k];
      if (v !== undefined && v !== null && (typeof v !== "number" || !Number.isFinite(v) || v < 0)) throw new Error(`${ID}: rows[${i}].${k} must be a number of zero or more (it is a +/- spread).`);
    }
    return {
      name,
      ...(typeof r.unit === "string" && r.unit.trim().length > 0 ? { unit: pickText(r.unit, "", `rows[${i}].unit`) } : {}),
      base: r.base,
      ...(typeof r.baseRange === "number" && r.baseRange > 0 ? { baseRange: r.baseRange } : {}),
      value: r.value,
      ...(typeof r.range === "number" && r.range > 0 ? { range: r.range } : {}),
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

  // ── header ──
  piece(L.titleRect, 2, bindProp(tag(textCell({ text: L.title.text, fontSize: L.title.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "title"));
  if (L.subtitle) piece(L.subtitleRect, 2, bindProp(tag(textCell({ text: L.subtitle.text, fontSize: L.subtitle.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "subtitle" }), "subtitle"), "subtitle"));
  text(L.summaryRect, 2, L.summary, theme.dim, "summary", { hAlign: "right" });
  fill(L.divider, 1, mix(String(theme.bg), String(theme.ink), 0.18), "divider", 0);

  // ── rows: lane wash, the two bars, then each interval over its bar ──
  L.rows.forEach((r, i) => {
    fill(r.lane, 1, theme.lane, "lane", 0.2);
    fill(r.baseBar, 2, theme.base, "bar-base");
    fill(r.candBar, 2, barColor(r.verdict.kind), `bar-${r.verdict.kind}`);
    if (r.baseIv) fill(r.baseIv, 3, ivColor(theme.base), "iv-base", 0.6);
    if (r.candIv) fill(r.candIv, 3, ivColor(barColor(r.verdict.kind)), "iv-cand", 0.6);
    piece(r.nameRect, 2, bindPropPath(tag(textCell({ text: r.name.text, fontSize: r.name.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: `name-${i}` }), `name-${i}`), "rows", [i, "name"], "string"));
    piece(r.valuesRect, 2, bindPropPath(tag(textCell({ text: r.values.text, fontSize: r.values.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: `values-${i}` }), `values-${i}`), "rows", [i, "value"], "number"));
    // VARIANT B: the verdict is a filled pill rather than coloured words -
    // does a block of colour read at thumbnail size where 20px type does not?
    const fillColor = barColor(r.verdict.kind);
    const padX = Math.round(r.verdictFit.px * 0.85);
    const pillH = Math.round(r.verdictFit.px * 2);
    const pillW = Math.min(r.verdictRect.w, Math.ceil(r.verdictFit.width / 0.94) + 2 * padX + 4);
    const pill: BenchRect = {
      x: r.verdictRect.x + r.verdictRect.w - pillW,
      y: r.verdictRect.y + Math.round((r.verdictRect.h - pillH) / 2),
      w: pillW,
      h: pillH,
    };
    fill(pill, 2, fillColor, `pill-${r.verdict.kind}`, 0.5);
    text(pill, 3, r.verdictFit, onColor(fillColor), `verdict-${i}`, { hAlign: "center", bold: true });
  });

  // ── the rule, over the bars: a candidate that crosses it visibly crosses it ──
  fill(L.rule, 4, theme.rule, "rule", 0);
  piece(L.ruleLabelRect, 2, bindProp(tag(textCell({ text: L.ruleLabel.text, fontSize: L.ruleLabel.px, color: theme.dim, hAlign: "right", vAlign: "middle", label: "rule-label" }), "rule-label"), "baselineLabel"));

  // ── legend + footer ──
  for (const l of L.legend) {
    const color = l.key === "base" ? theme.base : l.key === "cand" ? accent : ivColor(theme.base);
    const swatch = tag({ ...makeColorTile(color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: 0.35 } } }) } as MosaicSource, `swatch-${l.key}`);
    piece(l.swatch, 2, l.key === "cand" ? bindProp(swatch, "accent") : swatch);
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
