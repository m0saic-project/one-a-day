import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicSource } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag } from "@m0saic/template-utils";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/gaming/typing-pb-card/v1` - the personal-best share card a
 * Monkeytype user posts on a new PB, built from the result object's own
 * fields (wpm, raw, acc, consistency, mode, pb, chartData.wpm). One render
 * per result, from numbers typed in, never fetched.
 *
 * ONE CONCEPT: the PB is computed, never typed. The hero is the wpm; the
 * card derives whether it beats `pb` and by how much, and shows the NEW PB
 * badge and the "+N vs PB" line only when it does. Nobody hand-writes the
 * thing the whole post is about, so the card cannot disagree with itself.
 *
 * The rule that bites: raw wpm includes mistakes, net wpm does not, so
 * `raw` below `wpm` is impossible and the card refuses it by name - a
 * silently impossible number on a public card is worse than no card.
 */

export type TypingPbCardProps = {
  /** The typist's handle, drawn in capitals in the header. Monkeytype names are 1-16 characters. */
  handle?: string;
  /** Net wpm, the hero number (the result's `wpm`). */
  wpm?: number;
  /** Raw wpm including mistakes (the result's `rawWpm`), the RAW tile. Must be >= wpm. */
  raw?: number;
  /** Accuracy percent, the ACC tile (0-100, printed to one decimal). */
  acc?: number;
  /** Consistency (0-100, the result's `consistency`), the CONS tile. */
  consistency?: number;
  /** The mode line under the handle, e.g. "english - time 60". */
  mode?: string;
  /** The best wpm for this mode before this test. Drives the computed NEW PB badge and delta. */
  pb?: number;
  /** Per-second wpm, the result's chartData.wpm: 2-120 numbers (0-400), one bar each. */
  chart?: number[];
  /** The one accent, as #rrggbb: hero number, NEW PB badge, header rule, peak bar. */
  accent?: string;
  /** The bottom line; "" removes it and the space returns to the card. */
  footer?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/gaming/typing-pb-card/v1";
/** The page: document.backgroundColor, never a full-canvas rect (doctor: canvasFill). */
const PAGE = "#16161d";
const INK = "#f4f4f6";
/** Labels and captions on the dark page. */
const DIM = "#8f8f9c";
/** The stat tiles' fill; neutral so it survives the 4:2:0 intermediate flat. */
const TILE = "#202029";
/** The chart track the bars stand on. */
const TRACK = "#26262f";
/** A normal second's bar. */
const BAR = "#9c9cab";
const DEFAULT_ACCENT = "#e2b714";

const SPORT_LABEL = "TYPING TEST";
const UNIT = "WPM";
const BADGE_WORD = "NEW PB";

// The invented sample: a 60-second english run that ramps from the 90s to a
// 112 peak at 41s. The footer says the card is invented, like the neighbours.
const DEFAULT_CHART: number[] = [
  92, 94, 93, 96, 95, 98, 97, 99, 98, 100,
  99, 101, 100, 102, 101, 103, 102, 104, 103, 105,
  104, 106, 105, 107, 106, 108, 107, 109, 108, 110,
  109, 111, 110, 109, 110, 111, 110, 111, 110, 111,
  112, 111, 112, 111, 110, 111, 110, 109, 110, 109,
  110, 109, 108, 109, 108, 107, 108, 107, 106, 104,
];
const DEFAULTS = {
  handle: "keyrunner",
  wpm: 102,
  raw: 108,
  acc: 98.2,
  consistency: 84.5,
  mode: "english - time 60",
  pb: 99,
  chart: DEFAULT_CHART,
  accent: DEFAULT_ACCENT,
  footer: "Sample card: the typist and the numbers are invented",
  debugLayout: false,
};

const propsSchema = definePropsSchema<TypingPbCardProps>({
  handle: {
    type: "string",
    required: false,
    description: "The typist's handle, drawn in capitals in the header. 1-16 characters of printable ASCII or accented Latin letters (the site's own name limit). A long handle shrinks to fit; one that cannot fit above the readability floor is refused.",
    meta: { control: { placeholder: DEFAULTS.handle }, ui: { label: "Handle", order: 1, primary: true } },
  },
  wpm: {
    type: "number",
    required: false,
    description: "Net wpm, the hero number - the result's `wpm` field. 0.1 to 400, at most one decimal. Drives the computed PB: the badge and the +N line appear only when it beats `pb`.",
    meta: { constraints: { min: 0.1, max: 400 }, control: { placeholder: String(DEFAULTS.wpm) }, ui: { label: "WPM", order: 2, primary: true } },
  },
  raw: {
    type: "number",
    required: false,
    description: "Raw wpm, mistakes included - the result's `rawWpm` field, the RAW tile. 0.1 to 400. Raw counts every keystroke as a word-character, so it can never be below `wpm`; the card refuses the impossible pair by name.",
    meta: { constraints: { min: 0.1, max: 400 }, control: { placeholder: String(DEFAULTS.raw) }, ui: { label: "Raw WPM", order: 3 } },
  },
  acc: {
    type: "number",
    required: false,
    description: "Accuracy in percent - the result's `acc` field, the ACC tile, printed to one decimal (98.2). 0 to 100.",
    meta: { constraints: { min: 0, max: 100 }, control: { placeholder: String(DEFAULTS.acc) }, ui: { label: "Accuracy", order: 4 } },
  },
  consistency: {
    type: "number",
    required: false,
    description: "Consistency, 0 to 100 - the result's `consistency` field, the CONS tile, printed to one decimal (84.5).",
    meta: { constraints: { min: 0, max: 100 }, control: { placeholder: String(DEFAULTS.consistency) }, ui: { label: "Consistency", order: 5 } },
  },
  mode: {
    type: "string",
    required: false,
    description: 'The mode line under the handle, e.g. "english - time 60" or "code_javascript - words 50". Up to 28 printable ASCII characters; one line, printed as typed.',
    meta: { control: { placeholder: DEFAULTS.mode }, ui: { label: "Mode", order: 6 } },
  },
  pb: {
    type: "number",
    required: false,
    description: "The best wpm for this mode BEFORE this test, 0.1 to 400. Never drawn as typed: the card computes whether `wpm` beats it and by how much, and shows the NEW PB badge and the +N line only when it does.",
    meta: { constraints: { min: 0.1, max: 400 }, control: { placeholder: String(DEFAULTS.pb) }, ui: { label: "Previous best", order: 7 } },
  },
  chart: {
    type: "json",
    required: false,
    description: "Per-second wpm, the result's `chartData.wpm`: a plain array of 2 to 120 numbers, each 0 to 400 (a 15s test holds 15, a 60s test 60). One bar per second on a full-width track; height is the value's share of the peak, and the peak second draws in the accent. The caption's peak value and second are computed from the list, never typed.",
    meta: {
      constraints: {
        jsonSchema: { type: "array", minItems: 2, maxItems: 120, items: { type: "number", minimum: 0, maximum: 400 } },
      },
      ui: { label: "WPM each second", order: 8, primary: true },
    },
  },
  accent: {
    type: "string",
    required: false,
    description: "The one accent, as #rrggbb: the hero number, the NEW PB badge fill, the header rule and the peak bar. An accent with less than 3:1 contrast on the dark page (the large-text bar) keeps the badge but leaves the hero number in ink. Empty falls back to the default yellow.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 9 } },
  },
  footer: {
    type: "string",
    required: false,
    description: "The bottom line. One line of printable ASCII or accented Latin letters; a long one shrinks, and only a line that cannot fit above the floor is refused. Empty removes it and the space returns to the card.",
    meta: { control: { placeholder: "none" }, ui: { label: "Footer", order: 10 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the handle in the header band, the hero wpm, the derived delta line, the full-width chart track, three equal stat tiles, the footer at the bottom) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── pure helpers: what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

/** Printable ASCII plus Latin-1 and Latin Extended-A letters: what the bundled font draws. */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;

/** Edit distance, for "did you mean" on a misspelled prop. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** 102 -> "102", 102.37 -> "102.4": never more than one decimal, never a trailing zero. */
export function formatWpm(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** The derived PB line: +3 vs PB / ties PB / 1 under PB - computed from wpm and pb, never typed. */
export function pbDelta(wpm: number, pb: number): { isNew: boolean; line: string } {
  const d = Math.round((wpm - pb) * 10) / 10;
  if (d > 0) return { isNew: true, line: `+${formatWpm(d)} vs PB` };
  if (d === 0) return { isNew: false, line: "ties PB" };
  return { isNew: false, line: `${formatWpm(-d)} under PB` };
}

/** The peak second of a chart: the first occurrence of the highest value, seconds 1-based. */
export function peakOf(chart: number[]): { value: number; second: number } {
  let value = chart[0];
  let second = 1;
  for (let i = 1; i < chart.length; i++) {
    if (chart[i] > value) { value = chart[i]; second = i + 1; }
  }
  return { value, second };
}

/** The chart list: 2-120 finite numbers, each 0-400, at least one above 0. Throws naming the entry. */
export function parseChart(value: unknown): number[] {
  // A json prop may arrive as the raw string its editor holds.
  if (typeof value === "string") {
    const raw = value;
    try { value = JSON.parse(raw); } catch { fail("chart", `is not valid JSON: ${JSON.stringify(raw.slice(0, 60))}.`); }
  }
  if (!Array.isArray(value)) fail("chart", "must be an array of per-second wpm numbers.");
  if (value.length < 2 || value.length > 120) fail("chart", `has ${value.length} entries; a chart holds 2 to 120 seconds.`);
  const out = value.map((v, i) => {
    if (typeof v !== "number" || !Number.isFinite(v)) fail("chart", `entry ${i} must be a number, got ${JSON.stringify(v)}.`);
    if (v < 0 || v > 400) fail("chart", `entry ${i} (${v}) must be 0 to 400.`);
    return v;
  });
  if (!out.some((v) => v > 0)) fail("chart", "needs at least one second above 0 (the peak scales the bars).");
  return out;
}

function luminance(hex: string): number {
  const c = (i: number) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** The readable ink on a filled badge: white or ink, whichever contrasts more. */
function onColor(fill: string): MosaicColor {
  return (contrast(fill, "#ffffff") >= contrast(fill, INK) ? "#ffffff" : INK) as MosaicColor;
}

function str(value: unknown, field: string): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  return value.trim();
}

function drawn(value: unknown, field: string, max: number, allowEmpty: boolean): string {
  const s = str(value, field);
  if (!allowEmpty && s === "") fail(field, "must not be empty.");
  const bad = [...s].find((ch) => !DRAWN.test(ch));
  if (bad !== undefined) fail(field, `${JSON.stringify(s)} has the character ${JSON.stringify(bad)} (U+${bad.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}), which the card's font is not known to draw: use printable ASCII and accented Latin letters.`);
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
  return s;
}

const num = (v: unknown, field: string, min: number, max: number): number => {
  if (typeof v !== "number" || !Number.isFinite(v)) fail(field, `must be a number, got ${JSON.stringify(v)}.`);
  if (v < min || v > max) fail(field, `must be from ${min} to ${max}, got ${JSON.stringify(v)}.`);
  return v;
};

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeTypingPbCard(props: TypingPbCardProps) {
  const known = Object.keys(DEFAULTS);
  for (const k of Object.keys(props ?? {})) {
    if (known.includes(k)) continue;
    const near = known.find((n) => distance(n.toLowerCase(), k.toLowerCase()) <= 2);
    fail("props", `has an unknown prop '${k}'${near ? `; did you mean '${near}'?` : "."} The props are ${known.join(", ")}.`);
  }
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) } as typeof DEFAULTS;

  const handleRaw = drawn(p.handle, "handle", 16, false);
  const handle = handleRaw.toUpperCase();
  if (!DRAWN.test(handle)) fail("handle", `${JSON.stringify(handleRaw)} has a letter whose capital the card's font is not known to draw.`);

  const wpm = num(p.wpm, "wpm", 0.1, 400);
  const raw = num(p.raw, "raw", 0.1, 400);
  if (raw < wpm) fail("raw", `is ${formatWpm(raw)} but wpm is ${formatWpm(wpm)}: raw wpm counts mistakes too, so it can never be below the net wpm.`);
  const acc = num(p.acc, "acc", 0, 100);
  const consistency = num(p.consistency, "consistency", 0, 100);
  const mode = drawn(p.mode, "mode", 28, false);
  const pb = num(p.pb, "pb", 0.1, 400);
  const chart = parseChart(p.chart);
  if (typeof p.accent !== "string") fail("accent", "must be a string.");
  const accentText = p.accent.trim() === "" ? DEFAULT_ACCENT : p.accent.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(accentText)) fail("accent", `${JSON.stringify(accentText)} must be #rrggbb.`);
  const footer = drawn(p.footer, "footer", 120, true);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");

  const accent = accentText.toLowerCase() as MosaicColor;
  const delta = pbDelta(wpm, pb);
  const peak = peakOf(chart);
  return {
    handle,
    wpmText: formatWpm(wpm),
    rawText: formatWpm(raw),
    accText: `${acc.toFixed(1)}%`,
    consText: consistency.toFixed(1),
    mode,
    delta,
    chart,
    peak,
    peakText: `wpm each second - peak ${formatWpm(peak.value)} at ${peak.second}s`,
    accent,
    // The hero number is large bold text, so 3:1 (WCAG large-text) is the bar.
    heroInk: (contrast(accent, PAGE) >= 3 ? accent : INK) as MosaicColor,
    footer,
    debugLayout: p.debugLayout,
  };
}

/* ── geometry ── */

export type TpcRect = { x: number; y: number; w: number; h: number };
type Bind = "handle" | "wpm" | "raw" | "acc" | "consistency" | "mode" | "footer" | "accent" | null;
type Cell = { label: string; rect: TpcRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; over: boolean };
type Tile = { label: string; rect: TpcRect; color: MosaicColor; radius: number; bind?: "accent" };

/** The cell width a line needs at `px` under the fit rule (`cell * 0.94 - 2px`). */
function need(text: string, px: number, bold: boolean): number {
  return Math.ceil((widthOf(text, px, bold) + 2) / 0.94) + 1;
}
/** One line in a cell: the largest whole size up to `maxPx` that fits the cell's budget. */
function fitPx(line: string, cellW: number, maxPx: number, bold: boolean): number {
  const top = Math.max(1, Math.round(maxPx)), room = budget(cellW), w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}
/** The line box a size needs (the font's ascent + descent with a little air). */
const lineH = (px: number) => Math.ceil(px * 1.22);

const TILE_DEFS = [
  { key: "acc", label: "ACC", value: (p: ReturnType<typeof normalizeTypingPbCard>) => p.accText, bind: "acc" as Bind },
  { key: "cons", label: "CONS", value: (p: ReturnType<typeof normalizeTypingPbCard>) => p.consText, bind: "consistency" as Bind },
  { key: "raw", label: "RAW", value: (p: ReturnType<typeof normalizeTypingPbCard>) => p.rawText, bind: "raw" as Bind },
];

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutTypingPbCard(props: TypingPbCardProps, W: number, H: number) {
  const p = normalizeTypingPbCard(props);
  const S = Math.min(W, H), aspect = W / H;
  const shape: "wide" | "square" | "tall" = aspect >= 1.25 ? "wide" : aspect >= 0.8 ? "square" : "tall";
  const floor = Math.max(6, Math.round(S * 0.022));
  const small = Math.max(6, Math.round(S * 0.014));
  const unfit = (field: string, min = floor): never => fail(field, `cannot be fitted on ${W}x${H} above the ${min}px readability floor: shorten it or render a larger canvas.`);

  const m = Math.round(S * 0.045), CW = W - 2 * m;
  const top = m, bottom = H - m, CH = H - 2 * m;
  const gap = Math.max(2, Math.round(S * 0.022));

  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  let barCount = 0;
  const line = (label: string, rect: TpcRect, text: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; over?: boolean; field?: string; min?: number } = {}) => {
    if (px < (o.min ?? floor)) unfit(o.field ?? label, o.min ?? floor);
    cells.push({ label, rect, text, px, width: widthOf(text, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? (INK as MosaicColor), bind: o.bind ?? null, over: o.over === true });
  };

  // ── bands: footer sized by its line, the rest shared by weight ──
  const footerDesign = Math.max(floor, Math.round(S * 0.026));
  const footerPx = p.footer === "" ? 0 : Math.min(footerDesign, fitPx(p.footer, CW, footerDesign, false));
  if (p.footer !== "" && footerPx < floor) unfit("footer");
  const footerH = p.footer === "" ? 0 : lineH(footerPx);
  const weights = shape === "wide" ? [0.56, 0.24, 0.2] : [0.14, 0.36, 0.26, 0.24];
  const bandCount = weights.length;
  const footerGap = p.footer === "" ? 0 : gap;
  const avail = CH - footerH - footerGap - (bandCount - 1) * gap;
  const sumW = weights.reduce((a, b) => a + b, 0);
  const hs = weights.map((w) => Math.floor((avail * w) / sumW));
  hs[hs.length - 1] += avail - hs.reduce((a, b) => a + b, 0);

  const y = top;
  // Wide: header and hero side by side in the first band; square/tall: stacked.
  const leftW = shape === "wide" ? Math.round(CW * 0.32) : CW;
  const headRect: TpcRect = { x: m, y, w: leftW, h: hs[0] };
  const heroRect: TpcRect = shape === "wide"
    ? { x: m + leftW + gap, y, w: CW - leftW - gap, h: hs[0] }
    : { x: m, y: top + hs[0] + gap, w: CW, h: hs[1] };
  const chartY = shape === "wide" ? top + hs[0] + gap : top + hs[0] + gap + hs[1] + gap;
  const chartRect: TpcRect = { x: m, y: chartY, w: CW, h: hs[shape === "wide" ? 1 : 2] };
  const tilesRect: TpcRect = { x: m, y: chartRect.y + chartRect.h + gap, w: CW, h: hs[shape === "wide" ? 2 : 3] };

  // ── header: the sport label, the handle in capitals, the mode line, the accent rule ──
  const ruleH = Math.max(2, Math.round(S * 0.006));
  const gapSm = Math.max(1, Math.round(headRect.h * 0.04));
  const labelPx = Math.max(floor, Math.min(Math.round(headRect.h * 0.15), Math.round(S * 0.028)));
  const modePx = Math.max(floor, Math.min(Math.round(headRect.h * 0.13), Math.round(S * 0.024)));
  const handleRoom = headRect.h - ruleH - lineH(labelPx) - lineH(modePx) - 2 * gapSm;
  const handlePx = fitPx(p.handle, headRect.w, handleRoom / 1.22, true);
  if (handlePx < floor) unfit("handle");
  {
    const lx = headRect.x, ly = headRect.y;
    line("typing-label", { x: lx, y: ly, w: need(SPORT_LABEL, labelPx, true), h: lineH(labelPx) }, SPORT_LABEL, labelPx, { bold: true, color: DIM as MosaicColor, field: "the sport label" });
    line("handle", { x: lx, y: ly + lineH(labelPx) + gapSm, w: need(p.handle, handlePx, true), h: lineH(handlePx) }, p.handle, handlePx, { bold: true, bind: "handle", field: "handle" });
    line("mode-line", { x: lx, y: ly + lineH(labelPx) + gapSm + lineH(handlePx) + gapSm, w: need(p.mode, modePx, false), h: lineH(modePx) }, p.mode, modePx, { color: DIM as MosaicColor, bind: "mode", field: "mode" });
    tiles.push({ label: "header-rule", rect: { x: lx, y: headRect.y + headRect.h - ruleH, w: headRect.w, h: ruleH }, color: p.accent, radius: 0, bind: "accent" });
  }

  // ── hero: the wpm + unit, the derived delta line, the NEW PB badge when it is one ──
  let wpmPx = 0;
  {
    const heroGap = Math.max(2, Math.round(S * 0.012));
    const linePx = Math.max(floor, Math.min(Math.round(heroRect.h * 0.16), Math.round(S * 0.03)));
    const badgePx = Math.max(small, Math.min(Math.round(S * 0.016), Math.round(linePx * 0.7)));
    const badgeSide = need(BADGE_WORD, badgePx, true);
    const rowH = p.delta.isNew ? Math.max(lineH(linePx), badgeSide) : lineH(linePx);
    const unitPx = Math.max(floor, Math.min(Math.round(S * 0.06), Math.round(heroRect.h * 0.3)));
    const numberRoom = heroRect.h - rowH - heroGap - lineH(unitPx) - Math.max(2, Math.round(S * 0.008));
    wpmPx = Math.min(Math.round(S * 0.3), Math.floor(numberRoom / 1.22), fitPx(p.wpmText, heroRect.w, Math.round(S * 0.3), true));
    if (wpmPx < floor) unfit("wpm");
    line("wpm-count", { x: heroRect.x, y: heroRect.y, w: need(p.wpmText, wpmPx, true), h: lineH(wpmPx) }, p.wpmText, wpmPx, { bold: true, color: p.heroInk, bind: "wpm", field: "wpm" });
    const unitY = heroRect.y + lineH(wpmPx) + Math.max(2, Math.round(S * 0.008));
    line("wpm-unit", { x: heroRect.x, y: unitY, w: need(UNIT, unitPx, true), h: lineH(unitPx) }, UNIT, unitPx, { bold: true, color: DIM as MosaicColor, field: "the wpm unit" });
    const rowY = unitY + lineH(unitPx) + heroGap;
    line("delta-line", { x: heroRect.x, y: rowY + Math.round((rowH - lineH(linePx)) / 2), w: need(p.delta.line, linePx, false), h: lineH(linePx) }, p.delta.line, linePx, { color: DIM as MosaicColor, field: "the delta line" });
    if (p.delta.isNew) {
      const badge: TpcRect = { x: heroRect.x + need(p.delta.line, linePx, false) + gap, y: rowY, w: badgeSide, h: badgeSide };
      tiles.push({ label: "pb-badge", rect: badge, color: p.accent, radius: 0.16, bind: "accent" });
      line("pb-badge-text", badge, BADGE_WORD, badgePx, { bold: true, align: "center", color: onColor(p.accent), over: true, field: "the new PB badge", min: small });
    }
  }

  // ── chart: the full-width track, one bar per second, the peak in accent, the caption under ──
  {
    const capPx = Math.max(floor, Math.min(Math.round(S * 0.024), fitPx(p.peakText, CW, Math.round(S * 0.024), false)));
    if (capPx < floor) unfit("the chart caption");
    const capH = lineH(capPx);
    const trackH = Math.max(2, chartRect.h - capH - Math.max(2, Math.round(S * 0.006)));
    const track: TpcRect = { x: chartRect.x, y: chartRect.y, w: chartRect.w, h: trackH };
    tiles.push({ label: "chart-track", rect: track, color: TRACK as MosaicColor, radius: 0 });
    const n = p.chart.length;
    const base = track.y + trackH;
    for (let i = 0; i < n; i++) {
      // Split the track into n bars so the row spans the full width exactly.
      const x0 = track.x + Math.round((track.w * i) / n);
      const x1 = track.x + Math.round((track.w * (i + 1)) / n);
      const barW = x1 - x0 - (n > 1 ? 1 : 0);
      if (barW <= 0) continue;
      const h = Math.max(2, Math.round((trackH * p.chart[i]) / p.peak.value));
      const isPeak = p.chart[i] === p.peak.value && i === p.peak.second - 1;
      tiles.push({ label: isPeak ? "chart-peak" : "chart-bar", rect: { x: x0, y: base - h, w: barW, h }, color: isPeak ? p.accent : (BAR as MosaicColor), radius: 0, ...(isPeak ? { bind: "accent" as const } : {}) });
      barCount++;
    }
    line("chart-caption", { x: chartRect.x, y: track.y + trackH + Math.max(2, Math.round(S * 0.006)), w: need(p.peakText, capPx, false), h: capH }, p.peakText, capPx, { color: DIM as MosaicColor, field: "the chart caption" });
  }

  // ── tiles: three equal stat tiles (ACC, CONS, RAW) ──
  {
    const tileW = Math.floor((CW - 2 * gap) / 3);
    const tileH = tilesRect.h;
    const tilePad = Math.max(2, Math.round(Math.min(tileW, tileH) * 0.1));
    const innerW = tileW - 2 * tilePad, innerH = tileH - 2 * tilePad;
    const labelCap = Math.round(S * 0.03);
    const labels = TILE_DEFS.map((d) => d.label);
    const tileLabelPx = Math.min(labelCap, Math.floor((innerH * 0.3) / 1.22), ...labels.map((l) => fitPx(l, innerW, labelCap, false)));
    if (tileLabelPx < floor) unfit("the tile labels");
    const gapT = Math.max(1, Math.round(tileLabelPx * 0.25));
    const valueCap = Math.round(S * 0.14);
    const tileValuePx = Math.min(valueCap, Math.floor((innerH - lineH(tileLabelPx) - gapT) / 1.22), ...TILE_DEFS.map((d) => fitPx(d.value(p), innerW, valueCap, true)));
    if (tileValuePx < floor) unfit("the tile values");
    TILE_DEFS.forEach((d, i) => {
      const tx = tilesRect.x + i * (tileW + gap);
      const tile: TpcRect = { x: tx, y: tilesRect.y, w: tileW, h: tileH };
      tiles.push({ label: "stat-tile", rect: tile, color: TILE as MosaicColor, radius: 0 });
      const blockH = lineH(tileValuePx) + gapT + lineH(tileLabelPx);
      const y0 = tile.y + Math.round((tile.h - blockH) / 2);
      line(`tile-${d.key}-value`, { x: tile.x + tilePad, y: y0, w: innerW, h: lineH(tileValuePx) }, d.value(p), tileValuePx, { bold: true, align: "center", bind: d.bind, over: true, field: `the ${d.label} tile` });
      line(`tile-${d.key}-label`, { x: tile.x + tilePad, y: y0 + lineH(tileValuePx) + gapT, w: innerW, h: lineH(tileLabelPx) }, d.label, tileLabelPx, { align: "center", color: DIM as MosaicColor, over: true, field: "the tile labels" });
    });
  }

  // ── footer: one line at the bottom, shrunk alone to the floor ──
  if (p.footer !== "") {
    const fy = bottom - footerH;
    line("footer", { x: m, y: fy + Math.round((footerH - lineH(footerPx)) / 2), w: need(p.footer, footerPx, false), h: lineH(footerPx) }, p.footer, footerPx, { color: DIM as MosaicColor, bind: "footer", field: "footer" });
  }

  return { p, shape, floor, cells, tiles, headRect, heroRect, chartRect, tilesRect, wpmPx, handlePx, badgeShown: p.delta.isNew, barCount };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 32,
  "date": "2026-10-21",
  "agent": "opencode",
  "model": "glm-5.3",
  "id": "@one-a-day/gaming/typing-pb-card/v1",
  "title": "Typing PB Card",
  "who": "Monkeytype users sharing a personal best on r/monkeytype, r/typing and r/learntyping, and the app's own Discord, where a bot assigns a role for every new PB",
  "problem": [
    "Monkeytype institutionalizes the PB: the README's Discord bot 'auto-assign(s) optional roles based on typing performance', and an account system saves 'your typing speed history' - but the share that follows a new best is still a screenshot of the result screen.",
    "The numbers are already structured: the API's /results rows carry wpm, rawWpm, acc, consistency, mode, language, isPb and chartData.wpm - the whole result, per second. 'WPM (Words Per Minute = characters/5, normalized to 60 seconds)', 'Raw WPM (ignores mistakes)'.",
  ],
  "sources": [
    "https://github.com/monkeytypegame/monkeytype",
    "https://api.monkeytype.com/docs",
    "https://github.com/conner-mcnicholas/MonkeyTypeLeaderboard",
  ],
  "solution": [
    "One card per result, from numbers typed in, never fetched. The props mirror the result object (handle, wpm, raw, acc, consistency, mode, pb, chartData.wpm); it draws the wpm as the hero with the raw/acc/consistency tiles, and the per-second wpm as a full-width bar row a screenshot does not carry.",
    "The decision that matters: the PB is computed, never typed. The card derives whether wpm beats pb and by how much, and shows the NEW PB badge and the +N line only when it does. Raw below wpm is impossible and refused by name.",
  ],
  "usage": {
    "command": "m0saic make @one-a-day/gaming/typing-pb-card/v1 --template-repo . -w 1080 -h 1080 -o card.png",
    "try": [
      "wpm 102 vs pb 99 prints +3 vs PB with the NEW PB badge; wpm 98 prints 1 under PB with no badge",
      "chart holds chartData.wpm: 15 values for a 15s test, 60 for a 60s test; the peak second draws in the accent",
      "raw must stay >= wpm (raw counts mistakes); acc and consistency stay 0-100",
      "-w 1920 -h 1080 puts the header beside the hero; accent #e2b714 is the default serika yellow",
    ],
  },
  "timeline": {
    "source": "self-reported",
    "phases": [
      { name: "scout", startMs: 0, durMs: 900000, calls: 16, tools: "websearch 3, webfetch 6, read 5, edit 1, write 1" },
      { name: "plan", startMs: 900000, durMs: 240000, calls: 4, tools: "read 6, write 2" },
      { name: "build", startMs: 1140000, durMs: 1500000, calls: 10, tools: "read 6, write 2, edit 3, bash 6" },
      { name: "critique", startMs: 2640000, durMs: 300000, calls: 4, tools: "read 5, write 1" },
      { name: "ship", startMs: 2940000, durMs: 600000, calls: 5, tools: "bash 4, edit 1, write 1" },
    ],
  },
  "caveats": [
    "No importer: the numbers are retyped from the result screen or the results CSV/API row; chart is a JSON list of per-second wpm, not the file.",
    "The timeline is self-reported: this day ran as one hand-driven opencode session after the runner's preflight aborted (see journal/2026-10-21/), so no runner trace.json exists to copy.",
    "Only the peak second draws in the accent; ties behind the first peak stay plain (the first occurrence is the peak).",
  ],
};

/** Props with no rect to bind, and why (m0saic doctor's `bindingsDeclared`; the template type this repo builds against predates the field, so it is spread in). */
const UNBOUND = {
  bindings: {
    unbound: {
      pb: "source: the delta line and the NEW PB badge are derived from wpm vs pb (computed, never typed); no single rect shows the raw pb",
      chart: "source: the bar row is derived from the list (heights share the peak, the peak second draws in the accent); no single rect shows the raw list, and a json list edits as a structured form",
    },
  },
};

export const TypingPbCardV1 = defineMosaicTemplate<TypingPbCardProps>({
  ...UNBOUND,
  id: asTemplateId(ID),
  label: "2026-10-21 · Typing PB Card",
  version: 1,
  description: "A typing-test result card from the Monkeytype result object: the hero wpm with the NEW PB badge and +N delta computed against pb (never typed), raw/acc/consistency tiles, and the per-second chartData.wpm as a full-width bar row.",
  capabilities: { tier: "core" },
  tags: ["gaming", "2026-10-21", "day-032", "monkeytype", "typing", "wpm", "personal-best", "result-card"],

  outputHints: {
    width: 1080,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG, one card per result. 1080x1080 for the feed; 1920x1080 puts the header beside the hero, 1080x1920 stacks the bands. Minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default TypingPbCardV1;

async function render(props: TypingPbCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutTypingPbCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  for (const t of L.tiles) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) } as MosaicSource, t.label);
    // The header rule, the NEW PB badge and the peak bar show accent; the track and the plain bars do not.
    pieces.push({ rect: { ...t.rect, importance: t.label === "chart-bar" ? 2 : 1 }, source: t.bind ? bindProp(tile, t.bind) : tile });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; derived copy (the delta, the badge word, the labels, the caption) is not.
    pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source: c.bind === null ? cell : bindProp(cell, c.bind) });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises: every text fits (above); the handle in the top
  // band; the hero wpm present; the derived delta line under it; the chart
  // track full-width with its bars; three equal stat tiles; the footer at the
  // bottom; a square NEW PB badge when the wpm beats the pb.
  constraints.push({ label: "handle", within: { yFrac: [0, 0.24] } });
  constraints.push({ label: "wpm-count" });
  constraints.push({ label: "delta-line", within: { yFrac: [0.15, 0.6] } });
  constraints.push({ label: "chart-track", minWidthFrac: 0.9, within: { yFrac: [0.3, 0.82] } });
  if (L.barCount > 0) constraints.push({ label: "chart-bar" });
  if (L.cells.some((c) => c.label === "footer")) constraints.push({ label: "footer", within: { yFrac: [0.86, 1] } });
  if (L.badgeShown) constraints.push({ label: "pb-badge", aspect: 1, aspectTolerance: 0.08 });

  const relations: RelationalConstraint[] = [{ label: "stat-tile", equal: "size", tolerancePx: 2 }];

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    backgroundColor: PAGE as MosaicColor,
    sources: placed.sources,
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, relations, debug: props.debugLayout === true });
}
