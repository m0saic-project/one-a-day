import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicSource } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, bindPropPath, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag, wrapMeasured } from "@m0saic/template-utils";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/sports/cubing-average-card/v1` - one speedcubing average as a
 * card: the solves as bars, the dropped best and worst in parentheses with a
 * hollow bar, the average as the headline, and the delta against the old PB.
 *
 * ONE CONCEPT: the headline is COMPUTED, and the dropped solves stay on the
 * card. The user gives the solves; the count decides the kind (3 is a Mo3, 5
 * an Ao5, 12 an Ao12), so a "Mo3" label over five solves cannot happen. The
 * best and the worst are dropped (Ao5, Ao12), printed in parentheses and
 * drawn hollow; the average is the mean of what is left. Each bar says what
 * the footnote says: its distance from the average (`bar: "spread"`, the
 * default: left = faster, who carried the average and who dragged it) or its
 * length from zero (`bar: "length"`, the slowest fills the track, where a
 * 24-32 second session draws five near-identical bars).
 *
 * The rule that bites: all arithmetic is integer hundredths of a second. The
 * average is rounded to the nearest hundredth with halves going UP, as
 * floor((2 * sum + n) / (2 * n)); a float sum prints 28.34 for a 28.345
 * average. (This is the rounding the template chose; it does not cite a
 * regulation.) A DNF is always the worst solve; the average is DNF when a
 * DNF is still among the counting solves (two DNFs in an Ao5 or Ao12, one in
 * a Mo3). A slower average is printed with a plus sign in the ordinary ink:
 * no warning colour, no chip.
 */

export type CubingBar = "length" | "spread";
export type CubingAverageCardProps = {
  /** The event next to the kind chip: "3x3", "OH", "3BLD". "" removes it. */
  event?: string;
  /** The solves in the order they were made: 3 (Mo3), 5 (Ao5) or 12 (Ao12) strings. */
  solves?: string[];
  /** The previous PB for the same kind of average, as a time; "" or "DNF" means none. */
  previousPb?: string;
  /** The handle or name under the event. "" removes it. */
  cuber?: string;
  /** A free line next to the name. "" removes it. */
  date?: string;
  /** What a bar means: its length from zero, or its distance from the average. */
  bar?: CubingBar;
  /** A thin tick at the average in every track (`bar: "length"` only). */
  avgLine?: boolean;
  /** Counting bars, chips and the headline, as #rrggbb. */
  accent?: string;
  /** Page and ink. */
  preset?: "dark" | "light";
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/sports/cubing-average-card/v1";
const DEFAULT_ACCENT = "#ff8a1f";
const THEMES = {
  dark: { bg: "#10151c", ink: "#eef1f5", dim: "#8f9aa8" },
  light: { bg: "#f6f4ef", ink: "#161b22", dim: "#5d6672" },
} as const;

// An invented cuber after an invented Ao5: the best (24.19) and the worst
// (31.62) are dropped, 29.50+ carries a +2, and the average beats the old PB.
const DEFAULTS = {
  event: "3x3",
  solves: ["27.84", "24.19", "29.50+", "31.62", "26.07"],
  previousPb: "28.35",
  cuber: "mira_cubes",
  date: "Oct 4, 2026",
  bar: "spread" as CubingBar,
  avgLine: false,
  accent: DEFAULT_ACCENT,
  preset: "dark" as "dark" | "light",
  debugLayout: false,
};

const propsSchema = definePropsSchema<CubingAverageCardProps>({
  solves: {
    type: "json",
    required: false,
    description:
      'The solves in the order they were made: 3 (a Mo3, the mean of all three), 5 (an Ao5) or 12 (an Ao12), as strings: "27.84", "1:02.45", "29.50+" (the +2 is already in the number, as csTimer prints it) or "DNF" (csTimer\'s "DNF(15.20)" is read as DNF). The card works out which two are dropped; do not type the parentheses.',
    meta: {
      constraints: { jsonSchema: { type: "array", minItems: 3, maxItems: 12, items: { type: "string" } } },
      ui: { label: "Solves", order: 1, primary: true },
    },
  },
  previousPb: {
    type: "string",
    required: false,
    description: 'The previous PB for the same kind of average (an Ao5 PB for an Ao5), as a time: "28.35" or "1:05.00". Sets the delta line and the NEW PB chip. Empty or "DNF" removes both.',
    meta: { control: { placeholder: DEFAULTS.previousPb }, ui: { label: "Previous PB", order: 2 } },
  },
  event: {
    type: "string",
    required: false,
    description: 'The event next to the kind chip: "3x3", "OH", "3BLD", "Skewb". Free text, up to 24 characters. Empty removes it.',
    meta: { control: { placeholder: DEFAULTS.event }, ui: { label: "Event", order: 3 } },
  },
  cuber: {
    type: "string",
    required: false,
    description: "The handle or name under the event, up to 32 characters. Empty removes it. The sample is an invented handle.",
    meta: { control: { placeholder: DEFAULTS.cuber }, ui: { label: "Cuber", order: 4 } },
  },
  date: {
    type: "string",
    required: false,
    description: "A free line next to the name: the date, a session, a thread. Empty removes it.",
    meta: { control: { placeholder: DEFAULTS.date }, ui: { label: "Date", order: 5 } },
  },
  bar: {
    type: "string",
    required: false,
    description: 'What a bar means: "length" (the solve time from zero; the slowest fills the track) or "spread" (the distance from the average, left = faster, right = slower; the largest distance fills its half). With a DNF average there is no centre, so "spread" falls back to "length" and the footnote says so.',
    meta: { constraints: { oneOf: ["length", "spread"] }, ui: { label: "Bar shows", order: 6 } },
  },
  avgLine: {
    type: "boolean",
    required: false,
    description: 'A thin tick at the average in every track, named in the footnote. Only with bar "length" and an average that is not DNF.',
    meta: { ui: { label: "Average tick", order: 7 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The counting bars, the chips and the kind chip, as #rrggbb.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 8 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "dark" (default) or "light".',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 9 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, every solve has a track, the tracks are one size) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the arithmetic: pure, exported, and what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

const TIME = /^(?:(\d{1,2}):([0-5]\d)|(\d{1,2}))\.(\d{2})$/;
/** "27.84", "1:02.45" -> integer hundredths; null when it is not a time (or is zero). */
export function parseCubingTime(text: string): number | null {
  const m = TIME.exec(text);
  if (!m) return null;
  const cs = m[1] !== undefined ? (Number(m[1]) * 60 + Number(m[2])) * 100 + Number(m[4]) : Number(m[3]) * 100 + Number(m[4]);
  return cs > 0 ? cs : null;
}

/** Hundredths back to the way a scoresheet prints them: SS.hh under a minute, M:SS.hh above. */
export function formatCubingTime(cs: number): string {
  const two = (n: number) => String(n).padStart(2, "0");
  const min = Math.floor(cs / 6000), sec = Math.floor((cs % 6000) / 100), hun = cs % 100;
  return min > 0 ? `${min}:${two(sec)}.${two(hun)}` : `${sec}.${two(hun)}`;
}

export type ParsedSolve = { cs: number | null; plus: boolean };
/** One solve as csTimer prints it: "27.84", "29.50+", "DNF", "DNF(15.20)" (read as DNF). null when it is none of these. */
export function parseSolve(text: string): ParsedSolve | null {
  const s = text.trim();
  if (/^DNF(?:\((?:\d{1,2}:[0-5]\d|\d{1,3})\.\d{2}\))?$/i.test(s)) return { cs: null, plus: false };
  const plus = s.endsWith("+");
  const cs = parseCubingTime(plus ? s.slice(0, -1) : s);
  return cs === null ? null : { cs, plus };
}

/** delta = average - previous PB, with its sign: "-0.55" faster, "+0.31" slower, "0.00" equal. ASCII hyphen-minus. */
export function formatCubingDelta(deltaCs: number): string {
  return deltaCs < 0 ? `-${formatCubingTime(-deltaCs)}` : deltaCs > 0 ? `+${formatCubingTime(deltaCs)}` : "0.00";
}

export type CubingKind = "Mo3" | "Ao5" | "Ao12";
export type CubingSolve = {
  index: number;
  cs: number | null;
  plus: boolean;
  drop: "best" | "worst" | null;
  /** The time cell: "27.84", "29.50+", "DNF", and in parentheses when dropped. */
  text: string;
  /** What follows the last digit in `text` ("+", ")", "+)"): the cell hangs it past the column's digit edge. */
  suffix: string;
};
export type CubingResult = { n: number; kind: CubingKind; solves: CubingSolve[]; avgCs: number | null; counting: number };

/**
 * The drop rule and the average, from solve strings. Ao5 and Ao12 drop the
 * best (first of equal fastest) and the worst (last of equal slowest; a DNF
 * is always the worst, the last DNF if there are several), so the two are
 * always different solves. A Mo3 drops nothing. The average is the sum of
 * the counting solves over their count, to the nearest hundredth, halves up,
 * in integers; DNF when a DNF still counts.
 */
export function cubingAverage(raw: readonly string[]): CubingResult {
  if (!Array.isArray(raw)) fail("solves", "must be a list of 3, 5 or 12 solve strings.");
  const n = raw.length;
  if (n !== 3 && n !== 5 && n !== 12) {
    const below = [3, 5, 12].filter((c) => c < n).pop(), above = [3, 5, 12].find((c) => c > n);
    const need = [
      below !== undefined ? `${below} (drop the last ${n - below})` : null,
      above !== undefined ? `${above} (add ${above - n} more)` : null,
    ].filter(Boolean).join(" or ");
    fail("solves", `has ${n} ${n === 1 ? "entry" : "entries"}; one card is a Mo3 (3 solves), an Ao5 (5) or an Ao12 (12), so a count of ${n} would need ${need}.`);
  }
  const parsed = raw.map((r, i) => {
    const at = `solves[${i}]`;
    if (typeof r !== "string") fail(at, "must be a string.");
    if (/^\s*\(.*\)\s*$/.test(r)) fail(at, `${JSON.stringify(r)} is in parentheses: drop the parentheses - the card works out which solves are dropped.`);
    const s = parseSolve(r);
    if (!s) fail(at, `${JSON.stringify(r)} is not a solve: write "27.84", "1:02.45", "29.50+" (a +2 already in the number) or "DNF".`);
    return s;
  });

  const drop: Array<"best" | "worst" | null> = parsed.map(() => null);
  if (n >= 5) {
    let worst = -1, best = -1;
    parsed.forEach((s, i) => { if (s.cs === null) worst = i; });
    if (worst < 0) parsed.forEach((s, i) => { if (worst < 0 || (s.cs as number) >= (parsed[worst].cs as number)) worst = i; });
    parsed.forEach((s, i) => { if (s.cs !== null && (best < 0 || s.cs < (parsed[best].cs as number))) best = i; });
    // Every solve a DNF: nothing is fastest; the first DNF stands in as the best so two different solves are dropped.
    if (best < 0) best = 0;
    drop[best] = "best";
    drop[worst] = "worst";
  }
  const solves: CubingSolve[] = parsed.map((s, i) => {
    const base = s.cs === null ? "DNF" : formatCubingTime(s.cs) + (s.plus ? "+" : "");
    const dropped = drop[i] !== null;
    return {
      index: i + 1, cs: s.cs, plus: s.plus, drop: drop[i],
      text: dropped ? `(${base})` : base,
      suffix: s.cs === null ? (dropped ? ")" : "") : (s.plus ? "+" : "") + (dropped ? ")" : ""),
    };
  });
  const counting = solves.filter((s) => s.drop === null);
  const avgCs = counting.some((s) => s.cs === null)
    ? null
    : Math.floor((2 * counting.reduce((sum, s) => sum + (s.cs as number), 0) + counting.length) / (2 * counting.length));
  return { n, kind: n === 3 ? "Mo3" : n === 5 ? "Ao5" : "Ao12", solves, avgCs, counting: counting.length };
}

/**
 * Printable ASCII plus the accented Latin letters (Latin-1 and Latin
 * Extended-A, U+00C0-U+017F without the two maths signs): the bundled font has
 * a glyph for every one of them in both weights. Anything else is refused by
 * name instead of rendering as tofu.
 */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  if (!DRAWN.test(value)) fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use one line of printable ASCII and accented Latin letters (U+00C0-U+017F).`);
  const s = value.trim();
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
  return s;
}

export type CubingBarKind = "length" | "spread";
export type CubingCard = ReturnType<typeof normalizeCubingCard>;

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeCubingCard(props: CubingAverageCardProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const event = text(p.event, "event", 24);
  const cuber = text(p.cuber, "cuber", 32);
  const date = text(p.date, "date", 32);
  if (p.bar !== "length" && p.bar !== "spread") fail("bar", `${JSON.stringify(p.bar)} must be "length" or "spread".`);
  if (p.preset !== "dark" && p.preset !== "light") fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
  if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim())) fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
  if (typeof p.avgLine !== "boolean") fail("avgLine", "must be a boolean.");
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");
  const r = cubingAverage(p.solves);

  if (typeof p.previousPb !== "string") fail("previousPb", "must be a string.");
  const pbRaw = p.previousPb.trim();
  const pbCs = pbRaw === "" || pbRaw.toUpperCase() === "DNF" ? null : parseCubingTime(pbRaw);
  if (pbRaw !== "" && pbRaw.toUpperCase() !== "DNF" && pbCs === null) fail("previousPb", `${JSON.stringify(pbRaw)} is not a time: write "28.35" or "1:05.00" (a plain time, no +), or leave it empty for none.`);

  const kind = r.kind;
  const avg = r.avgCs;
  const headline = avg === null ? "DNF" : formatCubingTime(avg);
  const compared = avg !== null && pbCs !== null;
  const newPb = compared && (avg as number) < (pbCs as number);
  // The delta line is two cells: the words, then the old PB's own number (bound to previousPb).
  const pbText = pbCs === null ? "" : formatCubingTime(pbCs);
  const deltaText = !compared ? ""
    : (avg as number) === pbCs ? `ties previous ${kind} PB`
    : `${formatCubingDelta((avg as number) - (pbCs as number))} vs previous ${kind} PB`;

  // The scale. length: zero to the slowest non-DNF solve. spread: the largest
  // distance from the average fills its half; with a DNF average there is no
  // centre and the bars fall back to length. Fractions stay exact until a pixel.
  const times = r.solves.filter((s) => s.cs !== null).map((s) => s.cs as number);
  const maxCs = times.length ? Math.max(...times) : 0;
  const barKind: CubingBarKind = p.bar === "spread" && avg !== null ? "spread" : "length";
  const dist = (cs: number) => Math.abs(cs - (avg as number));
  const maxDist = barKind === "spread" && times.length ? Math.max(...times.map(dist)) : 0;
  const lines = r.solves.map((s) => {
    let share = 0, side: -1 | 0 | 1 = 0;
    if (s.cs !== null) {
      if (barKind === "length") share = maxCs > 0 ? s.cs / maxCs : 0;
      else { share = maxDist > 0 ? dist(s.cs) / maxDist : 0; side = s.cs < (avg as number) ? -1 : s.cs > (avg as number) ? 1 : 0; }
    }
    return { ...s, share, side };
  });
  const tick = barKind === "length" && p.avgLine === true && avg !== null && maxCs > 0 ? avg / maxCs : null;

  const hasPlus = r.solves.some((s) => s.plus);
  const sentences = [
    r.n === 3 ? `Mean of all 3 solves${avg === null ? "." : ", rounded to hundredths."}` : `Best and worst dropped (in parentheses). Average of the middle ${r.counting}${avg === null ? "." : ", rounded to hundredths."}`,
    ...(avg === null ? [r.n === 3 ? "A DNF in a Mo3 makes the mean DNF." : "Two or more DNFs make the average DNF."] : []),
    ...(hasPlus ? ["A trailing + is a +2, already included."] : []),
    ...(times.length === 0 ? []
      : barKind === "spread" ? ["Bars: distance from the average, left = faster."]
      : p.bar === "spread" ? ["No average, so bars are drawn from zero; the slowest fills the track."]
      : ["Bars are drawn from zero; the slowest fills the track." + (tick !== null ? " Tick = the average." : "")]),
  ];

  return {
    event, cuber, date, kind, chip: kind.toUpperCase(), headline, avg, pbCs, pbText, newPb, deltaText, lines, tick, maxCs, barKind,
    footnote: sentences.join(" "),
    bar: p.bar as CubingBar, avgLine: p.avgLine, preset: p.preset as "dark" | "light",
    accent: p.accent.trim().toLowerCase() as MosaicColor, debugLayout: p.debugLayout, counting: r.counting,
  };
}

/* ── colour ── */

// Not exported: the pack index is `export *`, and other templates export a `mix`.
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

export type CubingRect = { x: number; y: number; w: number; h: number };
type Bind = "event" | "cuber" | "date" | "previousPb" | null;
type Cell = { label: string; rect: CubingRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; solve: number | null; over: boolean };
type Tile = { label: string; rect: CubingRect; color: MosaicColor; radius: number; layer: number; accent?: boolean };

/** The largest whole size up to `maxPx` at which one line fits the cell's budget (`cell * 0.94 - 2px`). */
function fitPx(line: string, cellW: number, maxPx: number, bold: boolean): number {
  const top = Math.max(1, Math.round(maxPx));
  const room = budget(cellW), w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}
/** The narrowest cell that still fits `line` at `px` (the inverse of the budget). */
const cellFor = (line: string, px: number, bold = false) => Math.ceil((widthOf(line, px, bold) + 2) / 0.94) + 1;

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutCubingCard(props: CubingAverageCardProps, W: number, H: number) {
  const p = normalizeCubingCard(props);
  const theme = THEMES[p.preset];
  const ink = theme.ink as MosaicColor, dim = theme.dim as MosaicColor;
  const S = Math.min(W, H);
  // 16:9 and wider: header and headline in a left column, the solves in a right one.
  // Square and portrait: the header band, then the solves, then the footnote.
  const wide = W * 10 >= H * 13;
  const k = wide ? 1 : Math.max(1, Math.min(1.25, H / W));
  const m = Math.round(S * 0.055), CW = W - 2 * m;
  const gap = Math.round(S * 0.022);
  const floor = Math.max(6, Math.round(S * 0.016)), small = Math.max(5, Math.round(S * 0.013));
  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const unfit = (field: string): never => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
  /** One fitted line in `rect`; refuses below the floor instead of clipping. */
  const line = (label: string, rect: CubingRect, value: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; solve?: number; over?: boolean; field?: string; floor?: number } = {}) => {
    if (px < (o.floor ?? floor)) unfit(o.field ?? label);
    cells.push({ label, rect, text: value, px, width: widthOf(value, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? ink, bind: o.bind ?? null, solve: o.solve ?? null, over: o.over === true });
  };

  // Column geometry: the left column (wide) or the full width (stacked).
  const leftW = wide ? Math.round(CW * 0.39) : CW;
  const colGap = Math.round(S * 0.05);
  const rightX = m + leftW + colGap, rightW = W - m - rightX;

  // ── header: [AO5] chip and the event, then the cuber and the date ──
  const chipH = Math.round(S * (wide ? 0.07 : 0.06) * k);
  const chipPx = Math.round(chipH * 0.5);
  const chipPad = Math.round(chipH * 0.3);
  const chipW = cellFor(p.chip, chipPx, true) + 2 * chipPad;
  tiles.push({ label: "kind-chip", rect: { x: m, y: m, w: chipW, h: chipH }, color: p.accent, radius: 0.5, layer: 1, accent: true });
  line("kind", tiles[0].rect, p.chip, chipPx, { bold: true, align: "center", color: onColor(p.accent), over: true, floor: small });
  if (p.event !== "") {
    const evX = m + chipW + gap, evW = m + leftW - evX;
    line("event", { x: evX, y: m, w: evW, h: chipH }, p.event, fitPx(p.event, evW, chipH * 0.66, true), { bold: true, bind: "event", floor: small });
  }
  let y = m + chipH + Math.round(gap * 0.5);
  const lineH = Math.round(S * (wide ? 0.045 : 0.04) * k);
  const subTop = Math.round(lineH * 0.62);
  const both = p.cuber !== "" && p.date !== "";
  // Stacked: the cuber and the date share a line while both fit at the full size; otherwise a line each.
  const shared = !wide && both && cellFor(p.cuber, subTop) + cellFor(p.date, subTop) + 2 * gap <= leftW;
  const dateW = shared ? cellFor(p.date, subTop) : leftW, cuberW = shared ? leftW - dateW - gap : leftW;
  const subPx = Math.min(...[[p.cuber, cuberW], [p.date, dateW]].map(([t, w]) => (t === "" ? Infinity : fitPx(t as string, w as number, subTop, false))), subTop);
  if (p.cuber !== "") { line("cuber", { x: m, y, w: cuberW, h: lineH }, p.cuber, subPx, { color: dim, bind: "cuber", floor: small }); if (!shared) y += lineH; }
  if (p.date !== "") { line("date", { x: shared ? m + leftW - dateW : m, y, w: dateW, h: lineH }, p.date, subPx, { color: dim, align: shared ? "right" : "left", bind: "date", floor: small }); y += lineH; }
  y += Math.round(gap * 0.6);

  // ── headline: the average is the largest text, the NEW PB chip right after it, the delta under it ──
  const headMax = Math.round(S * 0.19 * k);
  const hH = Math.max(1, Math.min(headMax, Math.floor(H * 0.5) - y - 2));
  const pbH = Math.round(hH * 0.3), pbPx = Math.round(pbH * 0.5);
  const pbW = p.newPb ? cellFor("NEW PB", pbPx, true) + 2 * Math.round(pbH * 0.3) : 0;
  const headAvail = leftW - (p.newPb ? pbW + gap : 0);
  const headPx = fitPx(p.headline, headAvail, hH * 0.84, true);
  if (headPx < floor) unfit("the headline");
  const headCellW = Math.min(headAvail, cellFor(p.headline, headPx, true));
  line("headline", { x: m, y, w: headCellW, h: hH }, p.headline, headPx, { bold: true, color: p.avg === null ? ink : p.accent, field: "the headline" });
  if (p.newPb) {
    const rect: CubingRect = { x: m + headCellW + gap, y: y + Math.round(hH * 0.16), w: pbW, h: pbH };
    tiles.push({ label: "pb-chip", rect, color: p.accent, radius: 0.5, layer: 1 });
    line("pb", rect, "NEW PB", pbPx, { bold: true, align: "center", color: onColor(p.accent), over: true, floor: small });
  }
  y += hH;
  if (p.deltaText !== "") {
    const dH = Math.round(S * 0.05 * k);
    // The words, then the old PB's number as its own cell (bound to previousPb); one size for both,
    // chosen so the pair fits the column with a space between.
    const spaceW = Math.ceil(widthOf(" ", Math.round(dH * 0.64)) * 0.6);
    const pair = (px: number) => Math.ceil(widthOf(p.deltaText, px) * 1.03) + 2 + spaceW + cellFor(p.pbText, px);
    let dPx = Math.round(dH * 0.64);
    while (dPx > 1 && pair(dPx) > leftW) dPx--;
    const wordsW = Math.ceil(widthOf(p.deltaText, dPx) * 1.03) + 2;
    line("delta", { x: m, y, w: wordsW, h: dH }, p.deltaText, dPx, { field: "the delta line" });
    line("pb-value", { x: m + wordsW + spaceW, y, w: leftW - wordsW - spaceW, h: dH }, p.pbText, dPx, { bind: "previousPb", field: "the delta line" });
    y += dH;
  }
  const headerBottom = y;

  // ── footnote: stacked, two lines across the foot; wide, at the foot of the left column ──
  const footTop = Math.round(S * (wide ? 0.024 : 0.022) * k);
  const maxFootH = wide ? Math.floor(H * 0.2) - m - 2 : Infinity;
  const maxLines = wide ? 6 : 2;
  const footH = (n: number, px: number) => n * Math.round(px * 1.4) + 2;
  let footPx = footTop, footLines = wrapMeasured(p.footnote, footPx, budget(leftW));
  while ((footLines.length > maxLines || footH(footLines.length, footPx) > maxFootH) && footPx > 1) { footPx--; footLines = wrapMeasured(p.footnote, footPx, budget(leftW)); }
  if (footPx < small) unfit("the footnote");
  const footRect: CubingRect = { x: m, y: H - m - footH(footLines.length, footPx), w: leftW, h: footH(footLines.length, footPx) };
  cells.push({ label: "footnote", rect: footRect, text: footLines.join("\n"), px: footPx, width: Math.max(...footLines.map((l) => widthOf(l, footPx))), bold: false, align: "left", color: dim, bind: null, solve: null, over: false });

  // ── the solves: index, track, time; one row per solve, in the order they were made ──
  const n = p.lines.length;
  const bandTop = wide ? m : headerBottom + gap, bandBottom = wide ? H - m : footRect.y - gap;
  const areaX = wide ? rightX : m, areaW = wide ? rightW : CW;
  const cap = Math.round(S * (wide ? 0.17 : (n <= 3 ? 0.12 : 0.15) * k));
  const rowH = Math.max(1, Math.min(cap, Math.floor((bandBottom - bandTop) / n)));
  const g = Math.round(areaW * 0.02);
  const timeW = Math.round(areaW * (wide ? 0.25 : 0.27));
  // One size for every index and time: the smallest any row needs. The digits of every time end
  // on one edge R (so the decimal points stack); a "+" or ")" hangs past it, in the space reserved.
  let rowPx = Math.min(Math.round(rowH * 0.56), Math.round(S * 0.044 * k));
  const hangW = (px: number) => Math.max(0, ...p.lines.map((l) => Math.ceil(widthOf(l.suffix, px))));
  const fits = (px: number) => p.lines.every((l) => widthOf(l.text, px) <= budget(timeW - hangW(px) + Math.ceil(widthOf(l.suffix, px))));
  while (rowPx > 1 && !fits(rowPx)) rowPx--;
  if (rowPx < floor) unfit(`solves (${n} rows)`);
  const hang = hangW(rowPx);
  // The time column is as wide as its widest time needs, so the track takes the rest and the digits sit near their bars.
  const needW = hang + Math.max(...p.lines.map((l) => cellFor(l.text, rowPx) - Math.ceil(widthOf(l.suffix, rowPx))));
  const timeCol = Math.min(timeW, needW);
  const idxW = cellFor("12", rowPx), idxX = areaX;
  const trackX = idxX + idxW + g, timeX = areaX + areaW - timeCol;
  const trackW = timeX - g - trackX;
  const R = timeX + timeCol - hang;

  const trackColor = mix(theme.bg, theme.ink, 0.14);
  const trackH = Math.max(3, Math.min(Math.round(rowH * 0.5), Math.round(rowPx * 0.95)));
  const edge = Math.max(2, Math.round(trackH * 0.16));
  const minBar = Math.max(2, Math.round(trackW * 0.01));
  const rows = p.lines.map((l, i) => {
    const top = bandTop + i * rowH;
    const trackY = top + Math.round((rowH - trackH) / 2);
    const track: CubingRect = { x: trackX, y: trackY, w: trackW, h: trackH };
    tiles.push({ label: `track-${i}`, rect: track, color: trackColor, radius: 0.5, layer: 1 });
    const dropped = l.drop !== null;
    // A bar only for a time: a DNF row keeps its empty track. A solve exactly at the average has no distance to draw.
    // The floor keeps a real but tiny distance visible; a dropped bar also needs room for its hole. It never invents a bar for no distance.
    const floorW = dropped ? Math.max(minBar, 2 * edge + 2) : minBar;
    let bar: CubingRect | null = null, hole: CubingRect | null = null, centre: CubingRect | null = null, tick: CubingRect | null = null;
    if (l.cs !== null && l.share > 0) {
      if (p.barKind === "length") bar = { x: track.x, y: track.y, w: Math.min(track.w, Math.max(floorW, Math.round(track.w * l.share))), h: track.h };
      else {
        const half = Math.round(track.w / 2), w = Math.min(half, Math.max(floorW, Math.round(half * l.share)));
        bar = { x: l.side < 0 ? track.x + half - w : track.x + half, y: track.y, w, h: track.h };
      }
      if (dropped) hole = { x: bar.x + edge, y: bar.y + edge, w: bar.w - 2 * edge, h: bar.h - 2 * edge };
    }
    const cw = Math.max(2, Math.round(trackH * 0.08)), ch = Math.round(trackH * 1.5);
    if (p.barKind === "spread") centre = { x: track.x + Math.round(track.w / 2) - Math.floor(cw / 2), y: track.y + Math.round((track.h - ch) / 2), w: cw, h: ch };
    if (p.tick !== null) tick = { x: track.x + Math.round(track.w * p.tick) - Math.floor(cw / 2), y: track.y + Math.round((track.h - ch) / 2), w: cw, h: ch };
    if (bar) tiles.push({ label: `bar-${i}`, rect: bar, color: p.accent, radius: 0.5, layer: 2 });
    if (hole) tiles.push({ label: `hole-${i}`, rect: hole, color: trackColor, radius: 0.5, layer: 3 });
    if (centre) tiles.push({ label: `centre-${i}`, rect: centre, color: ink, radius: 0, layer: 4 });
    if (tick) tiles.push({ label: `tick-${i}`, rect: tick, color: ink, radius: 0, layer: 4 });
    const hangHere = Math.ceil(widthOf(l.suffix, rowPx));
    line(`index-${i}`, { x: idxX, y: top, w: idxW, h: rowH }, String(l.index), rowPx, { color: dim, field: `solves[${i}]` });
    // The cell ends where this row's digits end plus its own hang, so every row's digits end on R.
    line(`time-${i}`, { x: timeX, y: top, w: R + hangHere - timeX, h: rowH }, l.text, rowPx, { align: "right", color: dropped ? dim : ink, bold: !dropped, field: `solves[${i}]`, solve: i });
    return { top, track, bar, hole, centre, tick, line: l };
  });

  return { p, theme, wide, cells, tiles, rows, m, floor, small, rowH, rowPx, cap, headerBottom, bandTop, bandBottom, footLines: footLines.length, R, hang, trackColor };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 15,
  "date": "2026-10-04",
  "agent": "claude",
  "model": "claude-sonnet-5-5",
  "id": "@one-a-day/sports/cubing-average-card/v1",
  "title": "Cubing Average Card",
  "who": "Speedcubers on SpeedSolving.com forum competitions and race threads, who paste csTimer exports and follow the WCA averaging rules",
  "problem": [
    "Race threads report progress by pasting raw csTimer blocks: \"avg of 5: 27.59\", the solves with the dropped ones in parentheses, plus scramble strings and timestamps. PB and goal tables (single 14.93, ao5 20.63, ao12 24.88) are typed by hand.",
    "The forum's own timer says \"a PB notification pops up the moment you set a new record\", and blindfolded events show Mo3 because one DNF wipes out an Ao5. The moment exists; nothing turns it into a picture."
  ],
  "sources": [
    "https://www.speedsolving.com/threads/oh-race-d-yescubing-and-cubelite.95050/",
    "https://www.speedsolving.com/threads/new-speedsolving-timer.97451/"
  ],
  "solution": [
    "Give 3, 5 or 12 solves and the card works out the rest: Mo3, Ao5 or Ao12 from the count, the best and worst dropped (in parentheses, hollow bar), the average in integer hundredths, and the delta against the old PB.",
    "The one decision: the dropped solves stay on the card, drawn hollow, and a slower average is printed with a plus sign, never drawn red. Each bar says what the footnote says: the distance from the average, left = faster. bar \"length\" and avgLine are one prop away."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/sports/cubing-average-card/v1 --template-repo . -w 1080 -h 1080 -o journal/2026-10-04/cubing-average-card.png",
    "try": [
      "solves: 3, 5 or 12 strings - \"27.84\", \"29.50+\" (a +2), \"DNF\", or csTimer's \"DNF(15.20)\"",
      "previousPb \"\" removes the delta and the chip; a slower average gets a plus sign and no chip",
      "bar \"length\" draws each time from zero instead; avgLine true adds a tick at the average",
      "accent \"#2ec4b6\", preset \"light\", -w 1920 -h 1080: another colour, a light page, two columns"
    ]
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 162798,
        "calls": 25,
        "tokens": 1926031,
        "costUsd": 0.76,
        "tools": "Bash 11, WebSearch 10, Write 2"
      },
      {
        "name": "plan",
        "startMs": 162847,
        "durMs": 162741,
        "calls": 12,
        "tokens": 984534,
        "costUsd": 0.51,
        "tools": "Read 5, Bash 4, Write 2"
      },
      {
        "name": "build",
        "startMs": 325689,
        "durMs": 3262405,
        "calls": 60,
        "tokens": 16125989,
        "costUsd": 3.07,
        "tools": "Bash 33, Read 20, Write 3",
        "status": "error"
      },
      {
        "name": "critique",
        "startMs": 3588124,
        "durMs": 337818,
        "calls": 30,
        "tokens": 4339336,
        "costUsd": 0.94,
        "tools": "Read 15, Bash 14, Write 1"
      }
    ],
    "costBasis": "reported"
  },
  "caveats": [
    "It does not read a csTimer export: copy each time from the Time List into solves yourself (\"1. 27.39 <scramble> @...\" becomes \"27.39\").",
    "Only 3, 5 or 12 solves: no Ao50 or Ao100, no Bo3 or multi-blind. Times over ten minutes are not rounded to whole seconds.",
    "Spread bars show distance, not time (the number beside each is the time); a solve on the average has no bar. Half-up rounding is this template's choice, not checked against a regulation."
  ]
};

export const CubingAverageCardV1 = defineMosaicTemplate<CubingAverageCardProps>({
  id: asTemplateId(ID),
  label: "2026-10-04 · Cubing Average Card",
  version: 1,
  description: "A speedcubing average card: give 3, 5 or 12 solves and it works out the Mo3, Ao5 or Ao12, one bar per solve with the dropped best and worst in parentheses and hollow, the average as the headline, and the delta against the previous PB.",
  capabilities: { tier: "core" },
  tags: ["sports","2026-10-04","day-015","cubing","speedcubing","average","pb","cstimer"],

  outputHints: {
    width: 1080,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG. Square and portrait stack the header, the solves and the footnote; 16:9 and wider put the header and headline in a left column and the solves in a right one. Minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default CubingAverageCardV1;

async function render(props: CubingAverageCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutCubingCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  // Emitted layer by layer: placeInsetPieces puts a rect on the first overlay
  // layer it does not collide with, so tiles of one kind share a layer.
  for (const t of [...L.tiles].sort((a, b) => a.layer - b.layer)) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) } as MosaicSource, t.label);
    // `accent` paints the kind chip, so that is the rect that shows it.
    pieces.push({ rect: { ...t.rect, importance: t.layer }, source: t.accent ? bindProp(tile, "accent") : tile });
    constraints.push({ label: t.label });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; a time is bound to its solves entry (the text is that string, formatted); the headline, the delta and the footnote are derived and not.
    pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source: c.solve !== null ? bindPropPath(cell, "solves", [c.solve], "string") : c.bind === null ? cell : bindProp(cell, c.bind) });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises, against the labels: every text fits its box
  // (above); the headline lives in the top half and the footnote in the bottom
  // fifth; every solve has a track at least a fifth of the canvas wide, and the
  // tracks are one size; a solve with a time has its bar (above, as a presence
  // check on each bar tile).
  constraints.push({ label: "headline", within: { yFrac: [0, 0.5] } });
  constraints.push({ label: "footnote", within: { yFrac: [0.8, 1] } });
  L.rows.forEach((_, i) => constraints.push({ label: `track-${i}`, minWidthFrac: 0.2 }));
  const relations: RelationalConstraint[] = [{ label: L.rows.map((_, i) => `track-${i}`), equal: "size", tolerancePx: 2 }];

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
