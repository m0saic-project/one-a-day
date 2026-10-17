import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicSource } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag, wrapMeasured } from "@m0saic/template-utils";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/sports/erg-pb-card/v1` - one indoor rower's piece as a share
 * card: the /500m split as the hero figure on a fixed 1:00-3:00 pace track,
 * the piece's time or metres second, stroke rate, watts and drag as cells,
 * and the season-ranking percentile as a chip - from PM5/Logbook numbers
 * every rower already has.
 *
 * ONE CONCEPT: the split is the hero. /500m pace is the unit the community
 * compares in - a "5k 18:42,2" is read as 1:52.4 - so the card's hierarchy
 * is the forum's own: split biggest, the piece's result second, the PM5's
 * supporting numbers as cells, the percentile as a chip the rower supplies.
 *
 * The rule that bites: the template computes no claim it cannot verify. No
 * PB badge, no invented percentile (the ranking moves with season, age and
 * weight class), no cross-check between watts and split - the PM5 is
 * authoritative, every figure is entered, and the pace track is a FIXED
 * scale that claims nothing about ranking (the chip does that). A split
 * outside 1:00-3:00 clamps the MARKER to the track's end; the printed split
 * is always the truth.
 */

export type ErgPbCardProps = {
  /** The rower's name, the header's bold line. Up to 40 characters; accented Latin letters are drawn. */
  rower?: string;
  /** Second header line ("the 2026 season's median 2k"); "" removes it. Up to 48 characters. */
  note?: string;
  /** The split as the PM5 prints it, "m:ss.t" from 1:00.0 to 9:59.9 (e.g. "1:58.8"). The hero figure AND the marker position. */
  split?: string;
  /** The piece's result - a time ("7:55.0", "3:36:47") or metres ("7,096 m"); "" removes the figure and its caption. Up to 14 characters. */
  result?: string;
  /** The caption under the result ("2,000 m", "marathon"); "" removes it. Up to 16 characters. */
  piece?: string;
  /** Stroke rate; 10-60, or 0 to hide the cell. */
  spm?: number;
  /** Watts; 20-600, or 0 to hide the cell. */
  watts?: number;
  /** Drag factor; 50-250, or 0 to hide the cell. */
  drag?: number;
  /** The season-ranking percentile the rower supplies, 1-99; 0 hides the chip and its cohort line. */
  percentile?: number;
  /** The dim line under the chip ("2026 rower ranking"); "" hides it. Up to 40 characters. */
  percentileCohort?: string;
  /** The marker, the chip and the rules, as #rrggbb. */
  accent?: string;
  /** Page and ink. */
  preset?: "dark" | "light";
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/sports/erg-pb-card/v1";
export const TITLE = "Erg PB Card";
const DEFAULT_ACCENT = "#1c6fb8";
/** The page is document.backgroundColor, never a full-canvas rect (doctor: canvasFill). */
const THEMES = {
  dark: { bg: "#0c1a24", ink: "#eaf3f7", dim: "#7f95a1" },
  light: { bg: "#f4f8fa", ink: "#0f2230", dim: "#4f6270" },
} as const;

// An invented rower at the 2026 ranking's own median 2k: time 7:55.0 and the
// 50th percentile are the cited ranking page's printed 50th band (10,198
// ranked rowers); 1:58.8 is that time over 4; 209 W is 2.8 / (pace s/m)^3;
// spm and drag are illustrative. The WHY says which is which.
const DEFAULTS = {
  rower: "Marcus Alder",
  note: "the 2026 season's median 2k",
  split: "1:58.8",
  result: "7:55.0",
  piece: "2,000 m",
  spm: 26,
  watts: 209,
  drag: 110,
  percentile: 50,
  percentileCohort: "2026 rower ranking",
  accent: DEFAULT_ACCENT,
  preset: "dark" as "dark" | "light",
  debugLayout: false,
};

/** The pace track's fixed scale, in tenths of a second per 500m: 1:00 to 3:00. */
export const PACE_MIN_TENTHS = 600;
export const PACE_MAX_TENTHS = 1800;
/** The five ticks, labeled, at equal quarters of the track. */
export const PACE_TICKS = ["1:00", "1:30", "2:00", "2:30", "3:00"] as const;

const propsSchema = definePropsSchema<ErgPbCardProps>({
  split: {
    type: "string",
    required: false,
    description: 'The /500m split as the PM5 prints it: "m:ss.t" from 1:00.0 to 9:59.9 (e.g. "1:58.8"). The card\'s hero figure, and the marker on the 1:00-3:00 pace track. Only leaving it unset takes the sample split.',
    meta: { control: { placeholder: DEFAULTS.split }, ui: { label: "Split /500m", order: 1, primary: true } },
  },
  result: {
    type: "string",
    required: false,
    description: 'The piece\'s result: a time ("7:55.0", "3:36:47") or metres ("7,096 m"). Empty removes the figure and its caption. Up to 14 characters.',
    meta: { control: { placeholder: DEFAULTS.result }, ui: { label: "Result", order: 2 } },
  },
  piece: {
    type: "string",
    required: false,
    description: 'The caption under the result: "2,000 m", "1 hour", "marathon". Empty removes it. Up to 16 characters.',
    meta: { control: { placeholder: DEFAULTS.piece }, ui: { label: "Piece", order: 3 } },
  },
  rower: {
    type: "string",
    required: false,
    description: "The rower's name, the header's bold line. Up to 40 characters; accented Latin letters are drawn. The sample is an invented rower.",
    meta: { control: { placeholder: DEFAULTS.rower }, ui: { label: "Rower", order: 4 } },
  },
  note: {
    type: "string",
    required: false,
    description: 'The second header line (the default names where the sample numbers came from). Empty removes it. Up to 48 characters.',
    meta: { control: { placeholder: "none" }, ui: { label: "Note", order: 5 } },
  },
  spm: {
    type: "number",
    required: false,
    description: "Stroke rate as the PM5 shows it. Integer 10-60; 0 hides the cell.",
    meta: { constraints: { min: 0, max: 60 }, control: { placeholder: String(DEFAULTS.spm) }, ui: { label: "SPM", order: 6 } },
  },
  watts: {
    type: "number",
    required: false,
    description: "Watts as the PM5 shows it - entered, not computed from the split. Integer 20-600; 0 hides the cell.",
    meta: { constraints: { min: 0, max: 600 }, control: { placeholder: String(DEFAULTS.watts) }, ui: { label: "Watts", order: 7 } },
  },
  drag: {
    type: "number",
    required: false,
    description: "Drag factor as the PM5 shows it. Integer 50-250; 0 hides the cell.",
    meta: { constraints: { min: 0, max: 250 }, control: { placeholder: String(DEFAULTS.drag) }, ui: { label: "Drag", order: 8 } },
  },
  percentile: {
    type: "number",
    required: false,
    description: "The season-ranking percentile as a chip the rower supplies (the ranking page prints the bands; they move with season, age and weight class, so the card computes none). Integer 1-99; 0 hides the chip and its cohort line.",
    meta: { constraints: { min: 0, max: 99 }, control: { placeholder: String(DEFAULTS.percentile) }, ui: { label: "Percentile", order: 9 } },
  },
  percentileCohort: {
    type: "string",
    required: false,
    description: 'The dim line under the chip naming the cohort: "2026 rower ranking". Empty hides the line. Up to 40 characters.',
    meta: { control: { placeholder: "none" }, ui: { label: "Ranking cohort", order: 10 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The marker, the chip and the rules, as #rrggbb (the club or crew colour).",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 11 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "dark" (default) or "light".',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 12 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the marker is on the track, the ticks are one size) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the arithmetic: pure, exported, and what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

/** "1:58.8" -> 1188 tenths of a second; null when it is not a split the PM5 prints. */
export function parseErgSplit(text: string): number | null {
  const m = /^([1-9]):([0-5]\d)\.(\d)$/.exec(text);
  if (!m) return null;
  return (Number(m[1]) * 60 + Number(m[2])) * 10 + Number(m[3]);
}

/**
 * The marker's place on the 1:00-3:00 track, 0..1. A split at or under 1:00
 * pins the marker at the start, at or over 3:00 at the end - the MARKER
 * clamps, the printed split never changes.
 */
export function ergMarkerFrac(tenths: number): number {
  if (tenths <= PACE_MIN_TENTHS) return 0;
  if (tenths >= PACE_MAX_TENTHS) return 1;
  return (tenths - PACE_MIN_TENTHS) / (PACE_MAX_TENTHS - PACE_MIN_TENTHS);
}

/** 1 -> "1ST", 2 -> "2ND", 3 -> "3RD", 4 -> "4TH", 11 -> "11TH", 50 -> "50TH". */
export function ergOrdinal(n: number): string {
  const t = n % 100;
  const sfx = t >= 11 && t <= 13 ? "TH" : t % 10 === 1 ? "ST" : t % 10 === 2 ? "ND" : t % 10 === 3 ? "RD" : "TH";
  return `${n}${sfx}`;
}

/**
 * Printable ASCII plus the accented Latin letters (Latin-1 and Latin
 * Extended-A, U+00C0-U+017F without the two maths signs) - the set the swim
 * card proved the bundled font draws in both weights. Anything else is
 * refused by name instead of rendering as tofu.
 */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;
function text(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  if (!DRAWN.test(value)) fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use one line of printable ASCII and accented Latin letters (U+00C0-U+017F).`);
  const s = value.trim();
  if (s.length < min) fail(field, "must not be blank.");
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
  return s;
}

export type ErgStat = { key: "spm" | "watts" | "drag"; label: string; value: number };

export type NormalizedErgCard = {
  rower: string;
  note: string;
  piece: string;
  splitText: string;
  /** Tenths of a second; the parse is exact integer math. */
  splitTenths: number;
  /** The marker's place on the track, 0..1, clamped for out-of-track splits. */
  markerFrac: number;
  /** True when the split sits outside 1:00-3:00 and the marker clamped. */
  clamped: boolean;
  result: string;
  percentile: number;
  chipText: string;
  percentileCohort: string;
  stats: ErgStat[];
  footnote: string;
  accent: MosaicColor;
  preset: "dark" | "light";
  debugLayout: boolean;
};

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeErgCard(props: ErgPbCardProps): NormalizedErgCard {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const rower = text(p.rower, "rower", 1, 40);
  const note = text(p.note, "note", 0, 48);
  const piece = text(p.piece, "piece", 0, 16);
  const result = text(p.result, "result", 0, 14);
  const cohort = text(p.percentileCohort, "percentileCohort", 0, 40);
  if (p.preset !== "dark" && p.preset !== "light") fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
  if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim())) fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");
  if (typeof p.split !== "string") fail("split", 'must be a string, as the PM5 prints it ("1:58.8").');
  const splitText = p.split.trim();
  const splitTenths = parseErgSplit(splitText);
  if (splitTenths === null) fail("split", `${JSON.stringify(p.split)} is not a split: write m:ss.t from 1:00.0 to 9:59.9, as the PM5 prints it (e.g. "1:58.8").`);
  const whole = (v: unknown, field: string, lo: number, hi: number, what: string): number => {
    if (typeof v !== "number" || !Number.isFinite(v)) fail(field, `must be a number (${what}).`);
    if (!Number.isInteger(v)) fail(field, `must be a whole number (${what}).`);
    if (v === 0) return 0;
    if (v < lo || v > hi) fail(field, `${v} is outside ${lo}-${hi} (${what}); 0 hides it.`);
    return v;
  };
  const spm = whole(p.spm, "spm", 10, 60, "strokes per minute");
  const watts = whole(p.watts, "watts", 20, 600, "watts");
  const drag = whole(p.drag, "drag", 50, 250, "drag factor");
  const percentile = whole(p.percentile, "percentile", 1, 99, "the season-ranking percentile");
  const stats: ErgStat[] = [];
  if (spm > 0) stats.push({ key: "spm", label: "SPM", value: spm });
  if (watts > 0) stats.push({ key: "watts", label: "WATTS", value: watts });
  if (drag > 0) stats.push({ key: "drag", label: "DRAG", value: drag });
  // The footnote names what is entered and what the ranking depends on - the card's honesty line.
  const footnote = percentile > 0
    ? "Split, watts and percentile as entered. The ranking moves with season, age and weight class."
    : "Split and watts as entered.";
  return {
    rower, note, piece, result,
    splitText, splitTenths,
    markerFrac: ergMarkerFrac(splitTenths),
    clamped: splitTenths <= PACE_MIN_TENTHS || splitTenths >= PACE_MAX_TENTHS,
    percentile,
    chipText: percentile > 0 ? `${ergOrdinal(percentile)} PERCENTILE` : "",
    percentileCohort: percentile > 0 ? cohort : "",
    stats, footnote,
    accent: p.accent.trim().toLowerCase() as MosaicColor,
    preset: p.preset as "dark" | "light",
    debugLayout: p.debugLayout,
  };
}

/* ── colour ── */

// Not exported: the pack index is `export *`, and dev/bench-delta already exports a `mix`.
function mix(a: string, b: string, t: number): MosaicColor {
  const ch = (s: string, i: number) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}
function luminance(hex: string): number {
  const c = (i: number) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
/** The readable ink over a filled chip: dark or white, whichever contrasts more with the caller's accent. */
function onColor(fill: string): MosaicColor {
  const ratio = (other: string) => { const a = luminance(fill), b = luminance(other); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  return (ratio("#0b1220") >= ratio("#ffffff") ? "#0b1220" : "#ffffff") as MosaicColor;
}

/* ── geometry ── */

export type ErgRect = { x: number; y: number; w: number; h: number };
type Bind = "rower" | "note" | "piece" | "split" | "result" | "spm" | "watts" | "drag" | "percentile" | "percentileCohort" | null;
type Cell = { label: string; rect: ErgRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; over: boolean };
type Tile = { label: string; rect: ErgRect; color: MosaicColor; radius: number; layer: number; accent?: boolean };

/** The largest whole size up to `maxPx` at which one line fits the cell's budget (`cell * 0.94 - 2px`). */
function fitPx(line: string, cellW: number, maxPx: number, bold = false): number {
  const top = Math.max(1, Math.round(maxPx));
  const room = budget(cellW), w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutErgCard(props: ErgPbCardProps, W: number, H: number) {
  const p = normalizeErgCard(props);
  const theme = THEMES[p.preset];
  const ink = theme.ink as MosaicColor, dim = theme.dim as MosaicColor;
  // Chrome sizes off min(H, 0.75*W): a bare fraction of H would blow up on portrait.
  const S = Math.min(H, 0.75 * W);
  const m = Math.round(S * 0.055);
  const CW = W - 2 * m, CH = H - 2 * m;
  // Below these sizes copy is refused, not shrunk further: the figures and the
  // name at 1.8% of the short side, the chrome at 1.3%.
  const floor = Math.max(6, Math.round(Math.min(W, H) * 0.018));
  const small = Math.max(5, Math.round(Math.min(W, H) * 0.013));
  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const unfit = (field: string): never => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
  /** One fitted line in `rect`; refuses below the floor instead of clipping. */
  const line = (label: string, rect: ErgRect, value: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; over?: boolean; field?: string; floorAt?: number } = {}) => {
    if (px < (o.floorAt ?? floor)) unfit(o.field ?? label);
    cells.push({ label, rect, text: value, px, width: widthOf(value, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? ink, bind: o.bind ?? null, over: o.over === true });
  };

  // ── the bands: fixed ratios of the content height, the same at every aspect ──
  // (the brief's square ratios; the result-less card gives the freed band to the hero and the stats)
  let fr = { header: 0.16, hero: 0.295, result: 0.145, track: 0.1, stats: 0.175 };
  if (p.result === "") fr = { ...fr, hero: fr.hero + 0.0725, stats: fr.stats + 0.0725, result: 0 };
  const bandTop = {
    hero: m + Math.round(CH * fr.header),
    result: m + Math.round(CH * (fr.header + fr.hero)),
    track: m + Math.round(CH * (fr.header + fr.hero + fr.result)),
    stats: m + Math.round(CH * (fr.header + fr.hero + fr.result + fr.track)),
  };
  const footBandTop = m + Math.round(CH * 0.875);

  // ── the footnote first (bottom-anchored; everything above it stacks away from it) ──
  const footPx0 = Math.round(S * 0.023);
  let footPx = footPx0, footLines = [p.footnote];
  if (widthOf(p.footnote, footPx) > budget(CW)) {
    footLines = wrapMeasured(p.footnote, footPx, budget(CW));
    while (footLines.length > 2 && footPx > 1) { footPx--; footLines = wrapMeasured(p.footnote, footPx, budget(CW)); }
  }
  if (footPx < small) unfit("footnote");
  const footLineH = Math.round(footPx * 1.35);
  const footH = footLines.length * footLineH + 2;
  const footTop = H - m - footH;
  cells.push({ label: "footnote", rect: { x: m, y: footTop, w: CW, h: footH }, text: footLines.join("\n"), px: footPx, width: Math.max(...footLines.map((l) => widthOf(l, footPx))), bold: false, align: "left", color: dim, bind: null, over: false });

  // ── header: the name (bold) and its note left, the percentile chip and its cohort right ──
  const ruleH = Math.max(1, Math.round(S * 0.0035));
  const ruleY = bandTop.hero - ruleH - Math.max(2, Math.round(S * 0.004));
  const headGap = Math.max(2, Math.round(S * 0.01));
  const namePx0 = Math.round(S * 0.05), notePx0 = Math.round(S * 0.031);
  const chipPx0 = Math.round(S * 0.028), cohortPx0 = Math.round(S * 0.026);
  const chipPad = Math.max(2, Math.round(S * 0.014));
  const colGap = Math.max(4, Math.round(S * 0.02));
  let chipW = 0, chipH = 0, chipPx = 0, chipRect: ErgRect | null = null;
  let cohortW = 0, cohortH = 0, cohortPx = 0;
  if (p.percentile > 0) {
    // The chip is sized by its own text at its own size, before the name's
    // width is known - so the name column takes what is left.
    chipPx = fitPx(p.chipText, budget(Math.round(CW * 0.6)), chipPx0, true);
    if (chipPx < small) unfit("the percentile chip");
    chipW = Math.ceil((widthOf(p.chipText, chipPx, true) + 2) / 0.94) + 1 + 2 * chipPad;
    chipH = Math.round(chipPx * 1.9);
    chipRect = { x: W - m - chipW, y: 0, w: chipW, h: chipH };
  }
  if (p.percentileCohort !== "") {
    cohortPx = fitPx(p.percentileCohort, budget(Math.round(CW * 0.55)), cohortPx0);
    if (cohortPx < small) unfit("percentileCohort");
    cohortW = Math.ceil((widthOf(p.percentileCohort, cohortPx) + 2) / 0.94) + 1;
    cohortH = Math.round(cohortPx * 1.3);
  }
  const rightW = Math.max(chipW, cohortW);
  const nameW = p.percentile > 0 ? CW - rightW - colGap : CW;
  const namePx = fitPx(p.rower, budget(nameW), namePx0, true);
  const notePx = p.note === "" ? 0 : fitPx(p.note, budget(nameW), notePx0);
  const nameH = Math.round(namePx * 1.25);
  const noteH = notePx > 0 ? Math.round(notePx * 1.3) : 0;
  const leftH = nameH + (noteH > 0 ? headGap + noteH : 0);
  const rightH = (chipRect ? chipH : 0) + (cohortH > 0 ? Math.max(2, Math.round(S * 0.008)) + cohortH : 0);
  const headerAvail = ruleY - Math.max(2, Math.round(S * 0.006)) - m;
  if (leftH > headerAvail || rightH > headerAvail) unfit("the header");
  const leftTop = m + Math.max(0, Math.round((headerAvail - leftH) / 2));
  const rightTop = m + Math.max(0, Math.round((headerAvail - rightH) / 2));
  line("rower", { x: m, y: leftTop, w: nameW, h: nameH }, p.rower, namePx, { bold: true, bind: "rower" });
  if (noteH > 0) line("note", { x: m, y: leftTop + nameH + headGap, w: nameW, h: noteH }, p.note, notePx, { color: dim, bind: "note", floorAt: small });
  if (chipRect) {
    chipRect.y = rightTop;
    tiles.push({ label: "percentile-chip", rect: chipRect, color: p.accent, radius: 0.5, layer: 1 });
    line("percentile", chipRect, p.chipText, chipPx, { bold: true, align: "center", color: onColor(p.accent), bind: "percentile", over: true, floorAt: small });
    if (cohortH > 0) {
      line("percentile-cohort", { x: W - m - cohortW, y: rightTop + chipH + Math.max(2, Math.round(S * 0.008)), w: cohortW, h: cohortH }, p.percentileCohort, cohortPx, { color: dim, align: "right", bind: "percentileCohort", floorAt: small });
    }
  }
  tiles.push({ label: "header-rule", rect: { x: m, y: ruleY, w: CW, h: ruleH }, color: p.accent, radius: 0, layer: 1 });

  // ── hero: the split, the card's largest figure, with /500m immediately under it ──
  const heroBandH = bandTop.result - bandTop.hero;
  const heroK = H > W ? Math.min(1.25, H / W) : 1; // portrait stretches the hero a little
  const unitPx = fitPx("/500m", budget(CW), Math.round(S * 0.036));
  const unitH = Math.round(unitPx * 1.3);
  const heroGap = Math.max(2, Math.round(S * 0.014));
  const splitPx = Math.min(
    Math.round(S * 0.26 * heroK),
    fitPx(p.splitText, budget(CW), Math.round(S * 0.26 * heroK), true),
    Math.floor((heroBandH - unitH - heroGap) / 1.15),
  );
  if (splitPx < floor) unfit("split");
  const splitH = Math.round(splitPx * 1.15);
  const heroBlock = splitH + heroGap + unitH;
  const heroTop = bandTop.hero + Math.max(0, Math.round((heroBandH - heroBlock) / 2));
  line("split", { x: m, y: heroTop, w: CW, h: splitH }, p.splitText, splitPx, { bold: true, align: "center", bind: "split" });
  line("split-unit", { x: m, y: heroTop + splitH + heroGap, w: CW, h: unitH }, "/500m", unitPx, { color: dim, align: "center", floorAt: small });

  // ── the piece's result, second, with its caption under it ──
  let resultPx = 0, resultH = 0;
  if (p.result !== "") {
    const resBandH = bandTop.track - bandTop.result;
    const resGap = Math.max(2, Math.round(S * 0.01));
    let pieceH = 0, piecePx = 0;
    if (p.piece !== "") {
      piecePx = fitPx(p.piece, budget(CW), Math.round(S * 0.031));
      if (piecePx < small) unfit("piece");
      pieceH = Math.round(piecePx * 1.3);
    }
    resultPx = Math.min(
      fitPx(p.result, budget(CW), Math.round(S * 0.078), true),
      Math.floor((resBandH - pieceH - resGap) / 1.25),
    );
    if (resultPx < floor) unfit("result");
    resultH = Math.round(resultPx * 1.25);
    const resBlock = resultH + resGap + pieceH;
    const resTop = bandTop.result + Math.max(0, Math.round((resBandH - resBlock) / 2));
    line("result", { x: m, y: resTop, w: CW, h: resultH }, p.result, resultPx, { bold: true, align: "center", bind: "result" });
    if (pieceH > 0) line("piece", { x: m, y: resTop + resultH + resGap, w: CW, h: pieceH }, p.piece, piecePx, { color: dim, align: "center", bind: "piece", floorAt: small });
  }

  // ── the pace track: a fixed 1:00-3:00 scale, five equal ticks, the marker at the split ──
  const trackBandH = bandTop.stats - bandTop.track;
  const trackH = Math.max(4, Math.round(S * 0.016));
  const tickW = Math.max(2, Math.round(S * 0.0045));
  const tickH = Math.max(3, Math.round(trackH * 0.72));
  const markerW = Math.max(5, Math.round(S * 0.011));
  const markerH = Math.max(trackH + 2, Math.round(trackH * 2.2));
  const markerOver = Math.round((markerH - trackH) / 2);
  const tickPx = PACE_TICKS.reduce((px, t) => Math.min(px, fitPx(t, budget(Math.round(CW / 4)), Math.round(S * 0.026))), Math.round(S * 0.026));
  const tickLabelH = Math.round(tickPx * 1.3);
  // The labels clear the marker's overhang below the track.
  const labelGap = Math.max(Math.round(S * 0.006), markerOver + 2);
  const trackBlock = markerOver + trackH + labelGap + tickLabelH;
  const trackTop = bandTop.track + Math.max(0, Math.round((trackBandH - trackBlock) / 2));
  const trackY = trackTop + markerOver;
  const trackX = m, trackW = CW;
  const trackColor = mix(theme.bg, theme.ink, 0.16);
  const tickColor = mix(theme.bg, theme.ink, 0.5);
  tiles.push({ label: "pace-track", rect: { x: trackX, y: trackY, w: trackW, h: trackH }, color: trackColor, radius: 0.5, layer: 1 });
  PACE_TICKS.forEach((t, i) => {
    const cx = trackX + Math.round((i * trackW) / 4);
    tiles.push({ label: `pace-tick-${i}`, rect: { x: Math.min(Math.max(cx - Math.round(tickW / 2), trackX), trackX + trackW - tickW), y: trackY + Math.round((trackH - tickH) / 2), w: tickW, h: tickH }, color: tickColor, radius: 0, layer: 2 });
    const lw = Math.ceil((widthOf(t, tickPx) + 2) / 0.94) + 1;
    line(`pace-tick-label-${i}`, { x: Math.min(Math.max(cx - Math.round(lw / 2), m), W - m - lw), y: trackY + trackH + labelGap, w: lw, h: tickLabelH }, t, tickPx, { color: dim, align: "center", floorAt: small });
  });
  // The marker's CENTER lands on the split's place on the scale; at or beyond
  // 1:00 / 3:00 the frac is already clamped, so the marker straddles the track's
  // end. The printed split above never changes.
  const mcx = trackX + Math.round(p.markerFrac * trackW);
  const markerRect: ErgRect = { x: mcx - Math.round(markerW / 2), y: trackY - markerOver, w: markerW, h: markerH };
  tiles.push({ label: "pace-marker", rect: markerRect, color: p.accent, radius: 0.5, layer: 3, accent: true });

  // ── the stat band: one cell per shown PM5 number, value over label, rules between ──
  const n = p.stats.length;
  if (n > 0) {
    const statGap = Math.max(4, Math.round(S * 0.03));
    const cellW = Math.floor((CW - (n - 1) * statGap) / n);
    const valPx0 = Math.round(S * 0.052), labPx0 = Math.round(S * 0.024);
    let valPx = valPx0, labPx = labPx0;
    for (const s of p.stats) {
      valPx = Math.min(valPx, fitPx(String(s.value), budget(cellW), valPx0, true));
      labPx = Math.min(labPx, fitPx(s.label, budget(cellW), labPx0));
    }
    if (valPx < floor) unfit("the stat values");
    if (labPx < small) unfit("the stat labels");
    const valH = Math.round(valPx * 1.25), labH = Math.round(labPx * 1.3);
    const labGap = Math.max(2, Math.round(S * 0.008));
    const block = valH + labGap + labH;
    const statsAvail = footTop - Math.max(2, Math.round(S * 0.012)) - bandTop.stats;
    const statsTop = bandTop.stats + Math.max(0, Math.round((statsAvail - block) / 2));
    const divW = Math.max(1, Math.round(S * 0.003));
    p.stats.forEach((s, i) => {
      const x = m + i * (cellW + statGap);
      line(`stat-${s.key}`, { x, y: statsTop, w: cellW, h: valH }, String(s.value), valPx, { bold: true, align: "center", bind: s.key });
      line(`stat-label-${s.key}`, { x, y: statsTop + valH + labGap, w: cellW, h: labH }, s.label, labPx, { color: dim, align: "center", floorAt: small });
      if (i < n - 1) tiles.push({ label: `stat-divider-${i}`, rect: { x: x + cellW + Math.round((statGap - divW) / 2), y: statsTop, w: divW, h: block }, color: p.accent, radius: 0, layer: 1 });
    });
  }

  return {
    p, theme, wide: W > H,
    cells, tiles, m, floor, small,
    bandTop, footBandTop, footLines: footLines.length,
    heroK, splitPx, resultPx, namePx, markerRect,
    track: { x: trackX, y: trackY, w: trackW, h: trackH },
  };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 28,
  "date": "2026-10-17",
  "agent": "opencode",
  "model": "glm-5.3",
  "id": "@one-a-day/sports/erg-pb-card/v1",
  "title": TITLE,
  "who": "Indoor rowers - club and masters rowers, CrossFitters and home-erg owners - on c2forum.com, the Concept2 Online Logbook and r/Rowing's weekly erg screen threads",
  "problem": [
    "Every PR wants a record, and the records are typed numbers: the forum's PB thread (185 posts) opened to \"show off hard work & progress\" - one signature IS the ladder (\"63yo, 62kg, Erg 500m, 1:58.6; ... marathon, 3:36:47\"), another posts \"5k 18:42,2 81 drag rate 37\". Reddit rowers photograph the PM5 screen instead.",
    "The Logbook has the numbers and names the moment - \"Broken your personal best and want to shout it to the world\" - and the Utility exports every result as CSV, but neither hands back a picture. The public ranking page even prints the percentile bands (90th 6:50.8, 50th 7:55.0 at 2k) with nothing to post.",
  ],
  "sources": [
    "https://www.c2forum.com/viewtopic.php?t=156093",
    "https://log.concept2.com/rankings/2026/rower/2000",
    "https://www.concept2.com/logbook",
    "https://www.concept2.nl/en/service/software/concept2-utility/how-to-use/transferring-results-to-spreadsheet",
    "https://www.c2forum.com/viewtopic.php?t=202783",
  ],
  "solution": [
    "One card from one PM5 result: the /500m split as the hero figure, the piece's time or metres second, spm, watts and drag as cells, all entered exactly as the monitor shows them - the card cross-checks nothing and invents nothing.",
    "The one decision: the split is the hero, because /500m pace is the unit rowers compare in. The split also places a marker on a fixed 1:00-3:00 pace track (a scale that claims nothing about ranking); the season percentile the ranking page prints becomes a chip the rower supplies, with the cohort named under it.",
  ],
  "usage": {
    "command": "m0saic make @one-a-day/sports/erg-pb-card/v1 --template-repo . -w 1080 -h 1080 -o journal/2026-10-17/erg-pb-card.png",
    "try": [
      "split 2:05.5: the marker moves along the track; every figure stays as entered",
      "result 3:36:47, piece marathon: a distance piece on the same card",
      "percentile 0: the chip and its cohort line go, the name takes the header's width",
      "spm 0 (or drag 0): the stat band rebalances around the cells that remain",
    ],
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 330771,
        "calls": 31,
        "tokens": 813383,
        "costUsd": 0.43,
        "tools": "bash 13, websearch 8, read 5"
      },
      {
        "name": "plan",
        "startMs": 330783,
        "durMs": 281790,
        "calls": 16,
        "tokens": 495873,
        "costUsd": 0.4,
        "tools": "read 9, bash 3, grep 2"
      },
      {
        "name": "build",
        "startMs": 612593,
        "durMs": 3960349,
        "calls": 124,
        "tokens": 18224257,
        "costUsd": 6.01,
        "tools": "bash 59, edit 25, read 23",
        "status": "error"
      },
      {
        "name": "critique",
        "startMs": 4572979,
        "durMs": 508328,
        "calls": 41,
        "tokens": 1632774,
        "costUsd": 0.64,
        "tools": "read 20, bash 18, glob 1"
      }
    ],
    "costBasis": "reported"
  },
  "caveats": [
    "The percentile is supplied, not computed: it moves with season, age and weight class. The sample's 7:55.0 and 50th are the 2026 2k ranking's median band; the name, spm and drag are illustrative.",
    "The split is m:ss.t, 1:00.0-9:59.9. Outside 1:00-3:00 the marker clamps to the track's end; the printed split is always the truth.",
    "Watts, spm and drag are entered as the PM5 shows them (sample watts 209 is 2.8 / (pace s/m)^3 for 1:58.8); the card does not cross-check them against the split.",
  ],
};

export const ErgPbCardV1 = defineMosaicTemplate<ErgPbCardProps>({
  id: asTemplateId(ID),
  label: `2026-10-17 · ${TITLE}`,
  version: 1,
  description: "An indoor-rowing PR card from a PM5 result: the /500m split as the hero figure on a 1:00-3:00 pace track, the piece's time or metres beside it, stroke rate, watts and drag as cells, and the season-ranking percentile chip the rower supplies.",
  capabilities: { tier: "core" },
  tags: ["sports", "2026-10-17", "day-028", "rowing", "erg", "concept2", "split", "pb", "pm5", "percentile"],

  outputHints: {
    width: 1080,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG. The split is the hero at every aspect; portrait stretches it a little and the pace track loves width. Minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default ErgPbCardV1;

async function render(props: ErgPbCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutErgCard(props, W, H);
  const p = L.p;
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];
  const relations: RelationalConstraint[] = [];

  // Emitted kind by kind: tiles first (the chip under its text, the track
  // under its ticks, the marker over both), then every text cell.
  for (const t of [...L.tiles].sort((a, b) => a.layer - b.layer)) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) } as MosaicSource, t.label);
    // The marker paints the accent, so that is the rect that shows it.
    pieces.push({ rect: { ...t.rect, importance: t.layer }, source: t.accent ? bindProp(tile, "accent") : tile });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; derived text (the unit, the
    // ticks, the stat labels, the footnote) is not.
    const source = c.bind === null ? cell : bindProp(cell, c.bind);
    pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises, against the labels: every text fits its box
  // (above); the header - name, note, chip, cohort - lives in the top of the
  // card; the split in its hero zone with /500m immediately under it; the
  // result and its caption in the middle; the track at least 85% of the
  // canvas wide with its marker present and its five ticks one size; the stat
  // cells in a band of one size; the footnote at the bottom.
  const has = (label: string) => L.cells.some((c) => c.label === label);
  constraints.push({ label: "rower", within: { yFrac: [0, 0.3] } });
  // The rule spans the full content width (margins excluded - 91.7% at square,
  // 93.9% wide), exactly as wide as the pace track below it.
  constraints.push({ label: "header-rule", minWidthFrac: 0.9 });
  if (has("note")) constraints.push({ label: "note", within: { yFrac: [0, 0.3] } });
  if (p.percentile > 0) {
    constraints.push({ label: "percentile-chip", within: { yFrac: [0, 0.3] } });
    constraints.push({ label: "percentile", within: { yFrac: [0, 0.3] } });
    if (has("percentile-cohort")) constraints.push({ label: "percentile-cohort", within: { yFrac: [0, 0.3] } });
  }
  constraints.push({ label: "split", within: { yFrac: [0.16, 0.6] } });
  constraints.push({ label: "split-unit", within: { yFrac: [0.16, 0.62] } });
  if (has("result")) constraints.push({ label: "result", within: { yFrac: [0.4, 0.85] } });
  if (has("piece")) constraints.push({ label: "piece", within: { yFrac: [0.4, 0.85] } });
  constraints.push({ label: "pace-track", minWidthFrac: 0.85, within: { yFrac: [0.45, 0.8] } });
  constraints.push({ label: "pace-marker" });
  PACE_TICKS.forEach((_, i) => {
    constraints.push({ label: `pace-tick-${i}` });
    constraints.push({ label: `pace-tick-label-${i}`, within: { yFrac: [0.45, 0.85] } });
  });
  relations.push({ label: PACE_TICKS.map((_, i) => `pace-tick-${i}`), equal: "size", tolerancePx: 2 });
  relations.push({ label: ["header-rule", "pace-track"], equal: "width", tolerancePx: 2 });
  for (const s of p.stats) {
    constraints.push({ label: `stat-${s.key}`, within: { yFrac: [0.6, 0.95] } });
    constraints.push({ label: `stat-label-${s.key}`, within: { yFrac: [0.6, 0.95] } });
  }
  // The dividers between the stat cells: present, one per gap.
  for (const t of L.tiles) if (t.label.startsWith("stat-divider-")) constraints.push({ label: t.label });
  const statLabels = p.stats.map((s) => `stat-${s.key}`);
  if (statLabels.length >= 2) {
    relations.push({ label: statLabels, equal: "size", tolerancePx: 2 });
    relations.push({ label: p.stats.map((s) => `stat-label-${s.key}`), equal: "size", tolerancePx: 2 });
  }
  constraints.push({ label: "footnote", within: { yFrac: [0.88, 1] } });

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    backgroundColor: L.theme.bg as MosaicColor,
    sources: placed.sources,
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, relations, debug: props.debugLayout === true });
}
