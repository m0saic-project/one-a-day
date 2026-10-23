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
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/sports/disc-bag-matrix/v1` - a disc golf bag chart as a share
 * card: the speed x stability matrix the "rate my bag" threads are already
 * about, rendered deterministically from the four flight numbers every disc
 * carries (speed, glide, turn, fade) instead of screenshotted from a bag site.
 *
 * ONE CONCEPT: the bag as its own evidence. Every disc SLOTS ITSELF - the
 * stability slot is derived (s = turn + fade, never a user field), chips stack
 * inside their cell, and the empty cells keep a faint slot tint so "what am I
 * missing" answers itself from the picture.
 *
 * The rule that bites: the bag's DENSEST cell sizes every chip uniformly. If
 * that cell cannot fit at the chip floor at this canvas, render() refuses the
 * bag with the count in the error - a chip never collides, never leaves its
 * cell, and never ellipsizes (copy shrinks to fit; dense cells tier down from
 * name + numbers to name alone).
 */

export type DiscEntry = {
  /** The mold name, 1-20 ASCII characters. */
  name: string;
  /** Speed 1-14 (the x axis band). */
  speed: number;
  /** Glide 1-7 (printed on the chip, never slotted). */
  glide: number;
  /** Turn -5..2 (half the stability slot). */
  turn: number;
  /** Fade 0..5 (the other half). */
  fade: number;
};

export type ChipDetail = "name+numbers" | "name" | "numbers";
export type Preset = "dark" | "light";

export type DiscBagMatrixProps = {
  /** The bag: one entry per disc - {name, speed, glide, turn, fade}. 3-30 entries. */
  discs?: DiscEntry[] | string;
  /** Bag owner, the header's largest line. 1-40 ASCII. */
  title?: string;
  /** Second header line, e.g. "league bag - Oct 2026"; "" removes it. 0-48 ASCII. */
  subtitle?: string;
  /** What the chips print: "name+numbers" (tiered down when dense), "name" or "numbers". */
  chipDetail?: ChipDetail;
  /** Page and ink: "dark" share card or "light" printed chart. */
  preset?: Preset;
  /** The one accent - the header mark and the warm end of the row ramp - #rrggbb. */
  accent?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/sports/disc-bag-matrix/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
const ASCII = /^[\x20-\x7e]*$/;

/** Row ramp: cool (US) to the accent (BEEF) - the accent is the warm anchor. */
const COOL = "#4a7fb8";
const PAGE_DARK = "#101720";
const PAGE_LIGHT = "#f4efe4";

const FOOTER_CAPTION = "STABILITY = TURN + FADE";
const FOOTER_GLOSS = "US FLIPS - BEEF FADES";

/** Speed bands, left to right: the classes the community already uses. */
export const SPEED_BANDS = [
  { cls: "PUTTER", range: "1-3", min: 1, max: 3 },
  { cls: "MID", range: "4-5", min: 4, max: 5 },
  { cls: "FAIRWAY", range: "6-9", min: 6, max: 9 },
  { cls: "CONTROL", range: "10-11", min: 10, max: 11 },
  { cls: "DISTANCE", range: "12-14", min: 12, max: 14 },
] as const;

/** Stability bands, TOP to BOTTOM on the canvas (s = turn + fade): BEEF first. */
export const STAB_BANDS = [
  { name: "BEEF", hint: "s >= 4", min: 4, max: 99 },
  { name: "OS", hint: "s 2-3", min: 2, max: 3 },
  { name: "STABLE", hint: "s 0-1", min: 0, max: 1 },
  { name: "US", hint: "s <= -1", min: -99, max: -1 },
] as const;

const DEFAULT_DISCS: DiscEntry[] = [
  { name: "Aviar", speed: 2, glide: 3, turn: 0, fade: 1 },
  { name: "Berg", speed: 1, glide: 1, turn: 0, fade: 2 },
  { name: "Pig", speed: 3, glide: 1, turn: 0, fade: 3 },
  { name: "Pure", speed: 3, glide: 3, turn: -1, fade: 1 },
  { name: "Buzzz", speed: 5, glide: 4, turn: -1, fade: 1 },
  { name: "Roc3", speed: 5, glide: 4, turn: 0, fade: 3 },
  { name: "Comet", speed: 4, glide: 5, turn: -2, fade: 1 },
  { name: "Meteor", speed: 5, glide: 5, turn: -3, fade: 1 },
  { name: "Teebird", speed: 7, glide: 5, turn: 0, fade: 2 },
  { name: "Leopard3", speed: 7, glide: 5, turn: -2, fade: 1 },
  { name: "River", speed: 7, glide: 7, turn: -1, fade: 1 },
  { name: "Thunderbird", speed: 9, glide: 5, turn: 0, fade: 2 },
  { name: "Sidewinder", speed: 9, glide: 5, turn: -3, fade: 1 },
  { name: "Firebird", speed: 9, glide: 3, turn: 0, fade: 4 },
  { name: "Wraith", speed: 11, glide: 5, turn: -1, fade: 3 },
  { name: "Destroyer", speed: 12, glide: 5, turn: -1, fade: 3 },
  { name: "Shryke", speed: 13, glide: 6, turn: -2, fade: 2 },
  { name: "Tern", speed: 12, glide: 6, turn: -3, fade: 2 },
];

const DEFAULTS = {
  title: "Dana Kovac",
  subtitle: "league bag - Oct 2026",
  chipDetail: "name+numbers" as ChipDetail,
  preset: "dark" as Preset,
  accent: "#e8b33c",
  debugLayout: false,
};

const PROPS = ["discs", ...Object.keys(DEFAULTS)];

const propsSchema = definePropsSchema<DiscBagMatrixProps>({
  discs: {
    type: "json",
    required: false,
    description:
      'The bag: a list of 3-30 discs, each {name, speed, glide, turn, fade}. name is 1-20 ASCII; speed 1-14, glide 1-7, turn -5..2, fade 0-5. The stability slot is derived (turn + fade) - never a field. Example: [{"name":"Aviar","speed":2,"glide":3,"turn":0,"fade":1}].',
    meta: {
      constraints: {
        jsonSchema: {
          type: "array",
          minItems: 3,
          maxItems: 30,
          items: {
            type: "object",
            required: ["name", "speed", "glide", "turn", "fade"],
            properties: {
              name: { type: "string", minLength: 1, maxLength: 20 },
              speed: { type: "integer", minimum: 1, maximum: 14 },
              glide: { type: "integer", minimum: 1, maximum: 7 },
              turn: { type: "integer", minimum: -5, maximum: 2 },
              fade: { type: "integer", minimum: 0, maximum: 5 },
            },
          },
        },
      },
      control: { mono: true, placeholder: '[{"name":"Aviar","speed":2,"glide":3,"turn":0,"fade":1}]' },
      ui: { label: "Discs", order: 1, primary: true },
    },
  },
  title: {
    type: "string",
    required: false,
    description: "Bag owner - the header's largest line. 1-40 ASCII characters. The rect that shows it is bound to it.",
    meta: { control: { placeholder: DEFAULTS.title }, ui: { label: "Title", order: 2, primary: true } },
  },
  subtitle: {
    type: "string",
    required: false,
    description: 'Second header line, e.g. "league bag - Oct 2026". 0-48 ASCII characters; "" removes the line.',
    meta: { control: { placeholder: DEFAULTS.subtitle }, ui: { label: "Subtitle", order: 3 } },
  },
  chipDetail: {
    type: "string",
    required: false,
    description: 'What the chips print: "name+numbers" (name line + flight-number line, tiered down to the name when the cell is dense), "name" or "numbers".',
    meta: { constraints: { oneOf: ["name+numbers", "name", "numbers"] }, ui: { label: "Chip detail", order: 4 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "dark" share card or "light" printed chart.',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 5 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The one accent - the header mark and the warm end of the cool-to-warm row ramp - as #rrggbb.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 6 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, header and footer hold their bands) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ---------------- derived copy and validation ---------------- */

/** The chip's flight-number line, the community's own order: "9 5 -1 2". */
export function numbersLine(d: { speed: number; glide: number; turn: number; fade: number }): string {
  return `${d.speed} ${d.glide} ${d.turn} ${d.fade}`;
}

/** The column band index (0-4) a speed lands in; -1 outside 1-14 (validation refuses first). */
export function speedBandIndex(speed: number): number {
  return SPEED_BANDS.findIndex((b) => speed >= b.min && speed <= b.max);
}

/** The row band index (0=BEEF top ... 3=US bottom) a stability slot s lands in. */
export function stabBandIndex(s: number): number {
  return STAB_BANDS.findIndex((b) => s >= b.min && s <= b.max);
}

function fail(field: string, rule: string): never {
  throw new Error(`${ID}: ${field} ${rule}`);
}

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function pickText(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") fail(field, `must be a string, got ${JSON.stringify(value)}.`);
  const s = value.trim();
  const bad = [...s].find((ch) => !ASCII.test(ch));
  if (bad !== undefined)
    fail(
      field,
      `${JSON.stringify(s)} has the character ${JSON.stringify(bad)} (U+${bad.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}), which the card's font does not draw: use printable ASCII.`,
    );
  if (s.length < min || s.length > max)
    fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card allows ${min === 0 ? "0" : min} to ${max}.`);
  return s;
}

function pickWhole(value: unknown, field: string, min: number, max: number): number {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) fail(field, `must be a number, got ${JSON.stringify(value)}.`);
  if (!Number.isInteger(n)) fail(field, `must be a whole number, got ${JSON.stringify(value)}.`);
  if (n < min || n > max) fail(field, `must be from ${min} to ${max}, got ${JSON.stringify(value)}.`);
  return n;
}

function pickOne<T extends string>(value: unknown, options: readonly T[], field: string): T {
  if (typeof value !== "string" || !(options as readonly string[]).includes(value)) {
    fail(field, `must be one of ${options.map((o) => `"${o}"`).join(", ")}; got ${JSON.stringify(value)}.`);
  }
  return value as T;
}

const ENTRY_KEYS = ["name", "speed", "glide", "turn", "fade"];

function pickDiscs(value: unknown): DiscEntry[] {
  let v = value;
  if (typeof v === "string") {
    const raw = v;
    try {
      v = JSON.parse(raw);
    } catch {
      fail("discs", `is not valid JSON: ${JSON.stringify(raw.slice(0, 60))}. Pass a list of {name, speed, glide, turn, fade}.`);
    }
  }
  if (!Array.isArray(v)) fail("discs", 'must be a list of discs, e.g. [{"name":"Aviar","speed":2,"glide":3,"turn":0,"fade":1}].');
  if (v.length < 3 || v.length > 30) fail("discs", `has ${v.length} entries; the card holds 3 to 30 discs.`);
  return v.map((entry, i) => {
    const label = `discs entry ${i + 1}`;
    if (entry === null || typeof entry !== "object" || Array.isArray(entry))
      fail(label, `must be an object {name, speed, glide, turn, fade}, got ${JSON.stringify(entry)}.`);
    for (const k of Object.keys(entry)) {
      if (ENTRY_KEYS.includes(k)) continue;
      const near = ENTRY_KEYS.find((n) => distance(n.toLowerCase(), k.toLowerCase()) <= 2);
      fail(label, `has an unknown field '${k}'${near ? `; did you mean '${near}'?` : "."} The fields are ${ENTRY_KEYS.join(", ")}.`);
    }
    const e = entry as Record<string, unknown>;
    const name = pickText(e.name, `${label} name`, 1, 20);
    const speed = pickWhole(e.speed, `${label} speed`, 1, 14);
    const glide = pickWhole(e.glide, `${label} glide`, 1, 7);
    const turn = pickWhole(e.turn, `${label} turn`, -5, 2);
    const fade = pickWhole(e.fade, `${label} fade`, 0, 5);
    return { name, speed, glide, turn, fade };
  });
}

export type BagDisc = DiscEntry & {
  /** Position in the `discs` prop (the ORIGINAL index - bindings use it). */
  index: number;
  /** Derived stability slot: turn + fade. */
  s: number;
  /** Row band index, 0 = BEEF at the top. */
  row: number;
  /** Column band index, 0 = PUTTER on the left. */
  col: number;
};

export type BagModel = {
  discs: BagDisc[];
  title: string;
  subtitle: string;
  chipDetail: ChipDetail;
  preset: Preset;
  accent: MosaicColor;
  debugLayout: boolean;
  /** cells[row][col], each sorted by name then input order. */
  cells: BagDisc[][][];
  colCounts: number[];
  total: number;
  filled: number;
  empty: number;
};

export function normalizeDiscBagMatrix(props: DiscBagMatrixProps): BagModel {
  for (const k of Object.keys(props ?? {})) {
    if (PROPS.includes(k)) continue;
    const near = PROPS.find((n) => distance(n.toLowerCase(), k.toLowerCase()) <= 2);
    fail("props", `has an unknown prop '${k}'${near ? `; did you mean '${near}'?` : "."} The props are ${PROPS.join(", ")}.`);
  }
  const discs = pickDiscs(props.discs ?? DEFAULT_DISCS);
  const title = pickText(props.title ?? DEFAULTS.title, "title", 1, 40);
  const subtitle = pickText(props.subtitle ?? DEFAULTS.subtitle, "subtitle", 0, 48);
  const chipDetail = pickOne<ChipDetail>(props.chipDetail ?? DEFAULTS.chipDetail, ["name+numbers", "name", "numbers"], "chipDetail");
  const preset = pickOne<Preset>(props.preset ?? DEFAULTS.preset, ["dark", "light"], "preset");
  const accentRaw = props.accent ?? DEFAULTS.accent;
  if (typeof accentRaw !== "string" || !HEX.test(accentRaw.trim())) fail("accent", `${JSON.stringify(accentRaw)} must be #rrggbb.`);
  const debugLayout = props.debugLayout ?? DEFAULTS.debugLayout;
  if (typeof debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");

  const bag: BagDisc[] = discs.map((d, index) => {
    const s = d.turn + d.fade;
    return { ...d, index, s, row: stabBandIndex(s), col: speedBandIndex(d.speed) };
  });
  const cells: BagDisc[][][] = STAB_BANDS.map(() => SPEED_BANDS.map(() => [] as BagDisc[]));
  for (const d of bag) cells[d.row][d.col].push(d);
  // Stack order inside a cell: name, then input order. Deterministic by construction.
  for (const row of cells)
    for (const cell of row)
      cell.sort((a, b) => {
        const na = a.name.toLowerCase();
        const nb = b.name.toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : a.index - b.index;
      });
  const colCounts = SPEED_BANDS.map((_, c) => bag.filter((d) => d.col === c).length);
  const filled = cells.reduce((n, row) => n + row.filter((cell) => cell.length > 0).length, 0);
  return {
    discs: bag,
    title,
    subtitle,
    chipDetail,
    preset,
    accent: accentRaw.trim().toLowerCase() as MosaicColor,
    debugLayout,
    cells,
    colCounts,
    total: bag.length,
    filled,
    empty: STAB_BANDS.length * SPEED_BANDS.length - filled,
  };
}

/* ---------------- colors ---------------- */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): MosaicColor {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}` as MosaicColor;
}

/** The cool-to-warm row ramp: t=0 US (cool) to t=1 BEEF (the accent). */
function rowTint(t: number, accent: MosaicColor): MosaicColor {
  return mix(COOL, accent, t);
}

type Palette = {
  page: MosaicColor;
  ink: MosaicColor;
  dim: MosaicColor;
  slotFill: (t: number) => MosaicColor;
  chipFill: (t: number) => MosaicColor;
};

function paletteFor(m: BagModel): Palette {
  const page = m.preset === "dark" ? PAGE_DARK : PAGE_LIGHT;
  const ink = m.preset === "dark" ? "#eef2f7" : "#22201c";
  const dim = m.preset === "dark" ? "#93a3b4" : "#6d675c";
  const k = m.preset === "dark" ? 0.55 : 0.5;
  return {
    page: page as MosaicColor,
    ink: ink as MosaicColor,
    dim: dim as MosaicColor,
    slotFill: (t) => mix(rowTint(t, m.accent), page, 0.88),
    chipFill: (t) => mix(rowTint(t, m.accent), page, k),
  };
}

/** Row ramp position for band index r (0 = BEEF). */
function rowT(r: number): number {
  return 1 - r / (STAB_BANDS.length - 1);
}

/* ---------------- geometry ---------------- */

export type BagRect = { x: number; y: number; w: number; h: number };
export type BagFit = { text: string; px: number; width: number };
export type BagChip = {
  disc: BagDisc;
  tile: BagRect;
  nameRect: BagRect | null;
  name: BagFit | null;
  numsRect: BagRect | null;
  nums: BagFit | null;
};
export type BagLayout = {
  W: number;
  H: number;
  S: number;
  markRect: BagRect;
  title: BagFit;
  titleRect: BagRect;
  subtitle: BagFit | null;
  subtitleRect: BagRect | null;
  count: BagFit;
  countRect: BagRect;
  rows: Array<{ name: BagFit; nameRect: BagRect; hint: BagFit | null; hintRect: BagRect | null }>;
  cols: Array<{ range: BagFit; rangeRect: BagRect; cls: BagFit | null; clsRect: BagRect | null; count: BagFit | null; countRect: BagRect | null }>;
  cells: Array<{ row: number; col: number; rect: BagRect }>;
  chips: BagChip[];
  footerCaption: BagFit;
  footerCaptionRect: BagRect;
  footerGloss: BagFit;
  footerGlossRect: BagRect;
  footerSlots: BagFit;
  footerSlotsRect: BagRect;
};

function fitOne(text: string, maxW: number, maxPx: number, minPx: number, bold = false): BagFit {
  const px = fitLine(text, maxW, maxPx, minPx, bold);
  return { text, px, width: widthOf(text, px, bold) };
}

/**
 * Shrink one line until it fits `maxW`, never below `minPx` (never wraps,
 * never ellipsizes). The shared kit's fitter multiplies by 0.92, which stops
 * decrementing at px <= 6 and loops forever on a tight small canvas - this
 * one steps by 1 and always terminates.
 */
function fitLine(text: string, maxW: number, maxPx: number, minPx: number, bold = false): number {
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && widthOf(text, px, bold) > maxW) px -= 1;
  return px;
}

/**
 * The whole card as rects and measured fits - a pure function of the model and
 * the canvas. The bands are fixed fractions (header ~13% top, footer ~9%
 * bottom) and the matrix flexes between them at every aspect.
 */
export function layoutBag(m: BagModel, W: number, H: number): BagLayout {
  const S = Math.min(W, H);
  const margin = Math.max(6, Math.round(0.04 * S));
  const gap = Math.max(4, Math.round(0.015 * S));
  const minPx = Math.max(5, Math.round(0.013 * S));
  const nameFloor = Math.max(5, Math.round(0.0072 * S));
  const contentW = Math.max(40, W - 2 * margin);

  const headerH = Math.round(0.13 * H);
  const footerH = Math.round(0.09 * H);
  const headerTop = margin;
  const headerBottom = headerTop + headerH;
  const footerTop = H - margin - footerH;
  const matrixTop = headerBottom + gap;
  const matrixBottom = footerTop - gap;
  const matrixH = Math.max(40, matrixBottom - matrixTop);
  const colLabelH = Math.round(0.22 * matrixH);
  const gridH = Math.max(24, matrixH - colLabelH);
  const rowLabelW = Math.round(0.09 * W);
  const gridX = margin + rowLabelW;
  const gridW = Math.max(40, W - margin - gridX);
  const rowH = gridH / STAB_BANDS.length;
  const colW = gridW / SPEED_BANDS.length;

  // ---- header: accent mark, title, subtitle, disc count ----
  const markSide = Math.max(6, Math.round(0.22 * headerH));
  const markRect: BagRect = {
    x: margin,
    y: headerTop + Math.round((headerH - markSide) / 2),
    w: markSide,
    h: markSide,
  };
  const count = fitOne(`${m.total} DISCS`, budget(Math.round(0.3 * contentW)), Math.round(0.16 * headerH), minPx, true);
  const countW = Math.max(12, Math.ceil(count.width / 0.94) + 4);
  const countRect: BagRect = { x: W - margin - countW, y: headerTop, w: countW, h: headerH };
  const textX = markRect.x + markRect.w + Math.round(0.8 * gap);
  const textW = Math.max(24, countRect.x - gap - textX);
  const titleCap = Math.round(0.4 * headerH);
  const title = fitOne(m.title, budget(textW), titleCap, minPx, true);
  const titleH = Math.max(1, Math.round(1.25 * title.px));
  const subtitleCap = Math.round(0.17 * headerH);
  const subGap = Math.max(2, Math.round(0.2 * headerH * 0.17));
  const hasSub = m.subtitle !== "";
  const subtitle = hasSub ? fitOne(m.subtitle, budget(textW), subtitleCap, minPx) : null;
  const subH = subtitle ? Math.max(1, Math.round(1.25 * subtitle.px)) : 0;
  const blockH = hasSub ? titleH + subGap + subH : titleH;
  const blockY = headerTop + Math.max(0, Math.round((headerH - blockH) / 2));
  const titleRect: BagRect = { x: textX, y: blockY, w: textW, h: titleH };
  const subtitleRect: BagRect | null = subtitle ? { x: textX, y: blockY + titleH + subGap, w: textW, h: subH } : null;

  // ---- row labels: class name + dim s-range hint where it fits ----
  const rowNameCap = Math.round(0.026 * S);
  const rowHintCap = Math.round(0.014 * S);
  const rows = STAB_BANDS.map((b, r) => {
    const y0 = Math.round(matrixTop + r * rowH);
    const name = fitOne(b.name, budget(rowLabelW), rowNameCap, minPx, true);
    const hintNeed = Math.round(1.25 * Math.min(rowHintCap, nameFloor * 1.2));
    const wantHint = rowH >= Math.round(1.25 * name.px) + hintNeed + 2;
    const hint = wantHint ? fitOne(b.hint, budget(rowLabelW), rowHintCap, nameFloor) : null;
    const nameH = Math.max(1, Math.round(1.25 * name.px));
    const hintH = hint ? Math.max(1, Math.round(1.25 * hint.px)) : 0;
    const blockH2 = hint ? nameH + 2 + hintH : nameH;
    const y = y0 + Math.max(0, Math.round((rowH - blockH2) / 2));
    return {
      name,
      nameRect: { x: margin, y, w: rowLabelW, h: nameH } as BagRect,
      hint,
      hintRect: hint ? ({ x: margin, y: y + nameH + 2, w: rowLabelW, h: hintH } as BagRect) : null,
    };
  });

  // ---- column labels: range + class + count, tiered down to the range ----
  const rangeCap = Math.round(0.022 * S);
  const classCap = Math.round(0.026 * S);
  const colCountCap = Math.round(0.015 * S);
  const cols = SPEED_BANDS.map((b, c) => {
    const x0 = gridX + c * colW;
    const w = Math.round(gridX + (c + 1) * colW) - Math.round(x0);
    const x = Math.round(x0);
    const range = fitOne(b.range, budget(w), rangeCap, minPx);
    const n = m.colCounts[c];
    const countText = `${n} ${n === 1 ? "DISC" : "DISCS"}`;
    const classFits = widthOf(b.cls, nameFloor, true) <= budget(w);
    const countFits = widthOf(countText, nameFloor) <= budget(w);
    const cls = classFits ? fitOne(b.cls, budget(w), classCap, nameFloor, true) : null;
    const cnt = cls && countFits ? fitOne(countText, budget(w), colCountCap, nameFloor) : null;
    const rangeH = Math.max(1, Math.round(1.25 * range.px));
    const clsH = cls ? Math.max(1, Math.round(1.25 * cls.px)) : 0;
    const cntH = cnt ? Math.max(1, Math.round(1.25 * cnt.px)) : 0;
    const stack = rangeH + (cls ? 2 + clsH : 0) + (cnt ? 2 + cntH : 0);
    let y = matrixTop + gridH + Math.max(0, Math.round((colLabelH - stack) / 2));
    const rangeRect: BagRect = { x, y, w, h: rangeH };
    y += rangeH + 2;
    const clsRect: BagRect | null = cls ? { x, y, w, h: clsH } : null;
    if (cls) y += clsH + 2;
    const countRect2: BagRect | null = cnt ? { x, y, w, h: cntH } : null;
    return { range, rangeRect, cls, clsRect, count: cnt, countRect: countRect2 };
  });

  // ---- the grid: 20 slot tints and the chips ----
  const cells: BagLayout["cells"] = [];
  for (let r = 0; r < STAB_BANDS.length; r++) {
    for (let c = 0; c < SPEED_BANDS.length; c++) {
      const x = Math.round(gridX + c * colW);
      const y = Math.round(matrixTop + r * rowH);
      cells.push({ row: r, col: c, rect: { x, y, w: Math.round(gridX + (c + 1) * colW) - x, h: Math.round(matrixTop + (r + 1) * rowH) - y } });
    }
  }

  const chipGapY = Math.max(3, Math.round(0.005 * S));
  const chipPadX = Math.max(2, Math.round(0.006 * S));
  const chipPadY = Math.max(2, Math.round(0.003 * S));
  const nameCap = Math.max(nameFloor, Math.round(0.026 * S));
  const numsCap = Math.max(nameFloor, Math.round(0.016 * S));
  const kMax = Math.max(1, ...m.cells.map((row) => Math.max(...row.map((cell) => cell.length))));
  const chipH = Math.floor((rowH - (kMax + 1) * chipGapY) / kMax);
  const chipFloorH = Math.max(10, Math.round(0.017 * S));
  if (chipH < chipFloorH) {
    const densest = m.cells
      .flatMap((row, r) => row.map((cell, c) => ({ cell, r, c })))
      .sort((a, b) => b.cell.length - a.cell.length)[0];
    const maxK = Math.max(1, Math.floor((rowH - chipGapY) / (chipFloorH + chipGapY)));
    fail(
      "discs",
      `put ${densest.cell.length} discs in one slot (${STAB_BANDS[densest.r].name} ${SPEED_BANDS[densest.c].cls} band); at ${W}x${H} the grid holds at most ${maxK} per slot at the chip floor.`,
    );
  }

  const chips: BagChip[] = [];
  m.cells.forEach((row, r) => {
    row.forEach((cell, c) => {
      const box = cells[r * SPEED_BANDS.length + c].rect;
      const k = cell.length;
      if (k === 0) return;
      const totalH = k * chipH + (k - 1) * chipGapY;
      const y0 = box.y + Math.round((box.h - totalH) / 2);
      const tileW = box.w - 2 * chipPadX;
      const textW2 = Math.max(8, tileW - 2 * chipPadX);
      cell.forEach((d, j) => {
        const y = y0 + j * (chipH + chipGapY);
        const tile: BagRect = { x: box.x + chipPadX, y, w: tileW, h: chipH };
        const inner: BagRect = { x: tile.x + chipPadX, y: tile.y + chipPadY, w: textW2, h: chipH - 2 * chipPadY };
        let nameRect: BagRect | null = null;
        let name: BagFit | null = null;
        let numsRect: BagRect | null = null;
        let nums: BagFit | null = null;
        const numbers = numbersLine(d);
        // One line of text in a rect of height h needs about 1.25 * px - so the
        // cap is the width cap AND the height cap, never below the floor.
        const lineCap = (h: number) => Math.max(nameFloor, Math.round(h / 1.25));
        if (m.chipDetail === "numbers") {
          nums = fitOne(numbers, budget(inner.w), Math.min(numsCap, lineCap(inner.h)), nameFloor);
          numsRect = inner;
        } else if (m.chipDetail === "name") {
          name = fitOne(d.name, budget(inner.w), Math.min(nameCap, lineCap(inner.h)), nameFloor, true);
          nameRect = inner;
        } else {
          // name+numbers: tier A both lines when the cell's chips fit above the floor.
          const nameH = Math.round(inner.h * 0.52);
          const numsH = inner.h - nameH - 2;
          const tierA = lineCap(nameH) >= nameFloor + 2 && lineCap(numsH) >= nameFloor + 2;
          if (tierA) {
            name = fitOne(d.name, budget(inner.w), Math.min(nameCap, lineCap(nameH)), nameFloor, true);
            nameRect = { x: inner.x, y: inner.y, w: inner.w, h: nameH };
            nums = fitOne(numbers, budget(inner.w), Math.min(numsCap, lineCap(numsH)), nameFloor);
            numsRect = { x: inner.x, y: inner.y + nameH + 2, w: inner.w, h: numsH };
          } else {
            name = fitOne(d.name, budget(inner.w), Math.min(nameCap, lineCap(inner.h)), nameFloor, true);
            nameRect = inner;
          }
        }
        chips.push({ disc: d, tile, nameRect, name, numsRect, nums });
      });
    });
  });

  // ---- footer: caption + gloss left, slot coverage right ----
  const footerLeftW = Math.round(0.62 * contentW);
  const footerRightW = contentW - footerLeftW;
  const capH = Math.round(footerH * 0.55);
  const footerCaption = fitOne(FOOTER_CAPTION, budget(footerLeftW), Math.round(0.026 * S), minPx, true);
  const footerCaptionRect: BagRect = { x: margin, y: footerTop, w: footerLeftW, h: capH };
  const footerGloss = fitOne(FOOTER_GLOSS, budget(footerLeftW), Math.round(0.017 * S), nameFloor);
  const footerGlossRect: BagRect = { x: margin, y: footerTop + capH, w: footerLeftW, h: footerH - capH };
  const slotsText = `${STAB_BANDS.length * SPEED_BANDS.length} SLOTS - ${m.filled} FILLED - ${m.empty} EMPTY`;
  const footerSlots = fitOne(slotsText, budget(footerRightW), Math.round(0.022 * S), minPx, true);
  const footerSlotsRect: BagRect = { x: W - margin - footerRightW, y: footerTop, w: footerRightW, h: footerH };

  return {
    W, H, S,
    markRect,
    title, titleRect, subtitle, subtitleRect, count, countRect,
    rows, cols, cells, chips,
    footerCaption, footerCaptionRect,
    footerGloss, footerGlossRect,
    footerSlots, footerSlotsRect,
  };
}

/**
 * What the geometry promises (the brief's contract): every text fits its box
 * (measured against the real font), the header and footer hold their bands,
 * the row-label strip sits left of the grid and the column-label strip under
 * it, and every rendered chip and label is present. No pinned fractions beyond
 * the bands - the matrix flexes at every aspect.
 */
export function bagContract(L: BagLayout): LayoutConstraint[] {
  const constraints: LayoutConstraint[] = [
    textFitsMeasured("title", L.title.text, L.title.px, L.title.width),
    { label: "title", within: { yFrac: [0, 0.22] } },
    textFitsMeasured("disc-count", L.count.text, L.count.px, L.count.width),
    { label: "disc-count", within: { yFrac: [0, 0.22] } },
    { label: "accent-mark", aspect: 1, aspectTolerance: 0.15, within: { yFrac: [0, 0.22] } },
    textFitsMeasured("footer-caption", L.footerCaption.text, L.footerCaption.px, L.footerCaption.width),
    { label: "footer-caption", within: { yFrac: [0.8, 1] } },
    textFitsMeasured("footer-gloss", L.footerGloss.text, L.footerGloss.px, L.footerGloss.width),
    { label: "footer-gloss", within: { yFrac: [0.8, 1] } },
    textFitsMeasured("footer-slots", L.footerSlots.text, L.footerSlots.px, L.footerSlots.width),
    { label: "footer-slots", within: { yFrac: [0.8, 1] } },
  ];
  if (L.subtitle && L.subtitleRect) {
    constraints.push(textFitsMeasured("subtitle", L.subtitle.text, L.subtitle.px, L.subtitle.width), { label: "subtitle", within: { yFrac: [0, 0.22] } });
  }
  L.rows.forEach((row, r) => {
    constraints.push(textFitsMeasured(`row-name-${r}`, row.name.text, row.name.px, row.name.width), {
      label: `row-name-${r}`,
      within: { xFrac: [0, 0.14] },
    });
    if (row.hint) constraints.push(textFitsMeasured(`row-hint-${r}`, row.hint.text, row.hint.px, row.hint.width), { label: `row-hint-${r}`, within: { xFrac: [0, 0.14] } });
  });
  L.cols.forEach((col, c) => {
    constraints.push(textFitsMeasured(`col-range-${c}`, col.range.text, col.range.px, col.range.width), {
      label: `col-range-${c}`,
      within: { yFrac: [0.65, 0.93] },
    });
    if (col.cls) constraints.push(textFitsMeasured(`col-class-${c}`, col.cls.text, col.cls.px, col.cls.width), { label: `col-class-${c}`, within: { yFrac: [0.65, 0.93] } });
    if (col.count) constraints.push(textFitsMeasured(`col-count-${c}`, col.count.text, col.count.px, col.count.width), { label: `col-count-${c}`, within: { yFrac: [0.65, 0.93] } });
  });
  L.chips.forEach((chip) => {
    const i = chip.disc.index;
    if (chip.name) constraints.push(textFitsMeasured(`chip-name-${i}`, chip.name.text, chip.name.px, chip.name.width), { label: `chip-name-${i}` });
    if (chip.nums) constraints.push(textFitsMeasured(`chip-nums-${i}`, chip.nums.text, chip.nums.px, chip.nums.width), { label: `chip-nums-${i}` });
  });
  return constraints;
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-10-23/.
 */
const WHY: WhySpec = {
  day: 34,
  date: "2026-10-23",
  agent: "opencode",
  model: "mimo-v2.6-pro",
  id: ID,
  title: "Disc Bag Matrix",
  who: "Disc golfers on r/discgolf and r/mydiscbag posting 'rate my bag' / 'bag check' chart screenshots, and the spreadsheet builders behind them",
  problem: [
    "A 2026 r/discgolf bag check (98 points, 109 comments) opens \"Feeling like I'm missing something today\" with a bag chart image; every reply is slot talk: \"You are missing 4 or 5 14 speeds\". The chart IS the question.",
    "The tools draw it but own it: DiscField's \"speed and stability map plots each disc using manufacturer speed and turn + fade ratings\" with \"numbered points\" for its disc list; TaDisc sells \"stability grids\" to \"spot overlaps, find holes\".",
    "When the tool falls short, members hand-build the picture: spreadsheet posts ask \"where the disc stands on the Marshall Street flight chart\" and \"would love to... make plot charts\"; hole answers name empty cells - \"find something in the 10-11 speed range and -1 to -2\".",
  ],
  sources: [
    "https://discfield.com/bag-check",
    "https://tadisc.com/",
    "https://www.reddit.com/r/discgolf/comments/1s9o3c7/bag_check/",
    "https://www.reddit.com/r/mydiscbag/comments/12ratod/how_does_my_bag_look_any_holes/",
    "https://www.reddit.com/r/discgolf/comments/kunimh/i_created_a_spreadsheet_for_my_inventory/",
    "https://www.reddit.com/r/discgolf/comments/18g11z9/spreadsheet_of_disc_flight_numbers/",
  ],
  solution: [
    "One deterministic share card per bag: the props are the four flight numbers every disc already carries, so each disc slots itself into the speed x stability grid (s = turn + fade) and the empty slots stay tinted - the gap story reads from the picture alone.",
    "The design decision that matters: the bag's densest cell sizes every chip uniformly, so chips stack in their cell and never collide or clip; a bag that cannot fit at the chip floor is refused with the count in the error. Names shrink to fit and never ellipsize.",
  ],
  usage: {
    command: "m0saic make @one-a-day/sports/disc-bag-matrix/v1 --template-repo . -w 1920 -h 1080 -o bag.png",
    try: [
      'chipDetail "name" for crowded bags or "numbers" for the spreadsheet look',
      'preset "light" for the printed-chart paper look',
      'accent "#2f7bff" to re-anchor the cool-to-warm row ramp',
      'title and subtitle your own; subtitle "" drops the second line',
    ],
  },
  caveats: [
    "Bag websites already draw versions of this chart; this wins only as the clean deterministic share render - your own props, no account, no screenshot.",
    "The banded matrix discards the exact (speed, s) point inside a cell - a deliberate readability trade, not a scatter plot.",
    "Mold names are real product names used nominatively and the sample player is invented; the flight numbers are the real ones or the audience calls it out.",
  ],
  timeline: {
    source: "runner",
    phases: [
      {
        name: "scout",
        startMs: 0,
        durMs: 752951,
        calls: 24,
        tokens: 886512,
        costUsd: 0.07,
        tools: "bash 14, websearch 8, write 2",
      },
      {
        name: "plan",
        startMs: 752970,
        durMs: 471974,
        calls: 16,
        tokens: 394914,
        costUsd: 0.04,
        tools: "bash 13, read 2, write 1",
      },
      {
        name: "build",
        startMs: 1224964,
        durMs: 1182145,
        calls: 25,
        tokens: 788071,
        costUsd: 0.08,
        tools: "bash 24, grep 1",
      },
      {
        name: "build (2)",
        startMs: 2407117,
        durMs: 9909292,
        calls: 164,
        tokens: 27813708,
        costUsd: 0.39,
        tools: "bash 105, edit 37, read 12",
        status: "error",
      },
      {
        name: "critique",
        startMs: 12316464,
        durMs: 2135185,
        calls: 69,
        tokens: 2950628,
        costUsd: 0.13,
        tools: "bash 42, read 26, write 1",
        status: "error",
      },
    ],
    costBasis: "estimated",
    pricedAt: "2026-10-14",
  },
};

export const DiscBagMatrixV1 = defineMosaicTemplate<DiscBagMatrixProps>({
  id: asTemplateId(ID),
  label: "2026-10-23 \u00b7 Disc Bag Matrix",
  version: 1,
  description:
    "A disc golf bag matrix from the four flight numbers every disc carries: each disc slots itself into the speed x stability grid, chips stack name + numbers in their slot, tinted empty slots keep the holes in the bag readable, and the footer counts the slots filled.",
  capabilities: { tier: "core" },
  tags: ["sports", "2026-10-23", "day-034", "disc-golf", "bag-chart", "flight-numbers", "stability-matrix", "share-card"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Static bag chart for the post - 1920x1080 landscape; portrait and square reflow the same 5 x 4 matrix.",
  },

  propsSchema,
  defaultProps: {
    discs: DEFAULT_DISCS.map((d) => ({ ...d })),
    title: DEFAULTS.title,
    subtitle: DEFAULTS.subtitle,
    chipDetail: DEFAULTS.chipDetail,
    preset: DEFAULTS.preset,
    accent: DEFAULTS.accent,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default DiscBagMatrixV1;

async function render(props: DiscBagMatrixProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  const m = normalizeDiscBagMatrix(props);
  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const L = layoutBag(m, W, H);
  const pal = paletteFor(m);

  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const piece = (rect: BagRect, importance: number, source: MosaicSource) => pieces.push({ rect: { ...rect, importance }, source });

  // No backdrop rect: the page is document.backgroundColor below.

  // ---- header: the accent mark (bound), the title, the subtitle, the count ----
  piece(L.markRect, 1, bindProp(tag(makeColorTile(m.accent) as MosaicSource, "accent-mark"), "accent"));
  piece(L.titleRect, 3, bindProp(tag(textCell({ text: L.title.text, fontSize: L.title.px, color: pal.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "title"));
  if (L.subtitle && L.subtitleRect) {
    piece(L.subtitleRect, 3, bindProp(tag(textCell({ text: L.subtitle.text, fontSize: L.subtitle.px, color: pal.dim, hAlign: "left", vAlign: "middle", label: "subtitle" }), "subtitle"), "subtitle"));
  }
  piece(L.countRect, 3, tag(textCell({ text: L.count.text, fontSize: L.count.px, color: pal.dim, hAlign: "right", bold: true, vAlign: "middle", label: "disc-count" }), "disc-count"));

  // ---- the grid: slot tints first, chips over them ----
  L.cells.forEach((cell) => {
    piece(cell.rect, 0, tag(makeColorTile(pal.slotFill(rowT(cell.row))) as MosaicSource, `slot-${cell.row}-${cell.col}`));
  });

  L.chips.forEach((chip) => {
    const i = chip.disc.index;
    piece(chip.tile, 1, tag(makeColorTile(pal.chipFill(rowT(chip.disc.row))) as MosaicSource, `chip-bg-${i}`));
    if (chip.name && chip.nameRect) {
      piece(chip.nameRect, 2, bindPropPath(tag(textCell({ text: chip.name.text, fontSize: chip.name.px, color: pal.ink, hAlign: "center", bold: true, vAlign: "middle", label: `chip-name-${i}` }), `chip-name-${i}`), "discs", [i, "name"], "string"));
    }
    if (chip.nums && chip.numsRect) {
      piece(chip.numsRect, 2, tag(textCell({ text: chip.nums.text, fontSize: chip.nums.px, color: pal.dim, hAlign: "center", vAlign: "middle", label: `chip-nums-${i}` }), `chip-nums-${i}`));
    }
  });

  // ---- row labels (left strip) and column labels (under the grid) ----
  L.rows.forEach((row, r) => {
    piece(row.nameRect, 2, tag(textCell({ text: row.name.text, fontSize: row.name.px, color: pal.ink, hAlign: "right", bold: true, vAlign: "middle", label: `row-name-${r}` }), `row-name-${r}`));
    if (row.hint && row.hintRect) {
      piece(row.hintRect, 2, tag(textCell({ text: row.hint.text, fontSize: row.hint.px, color: pal.dim, hAlign: "right", vAlign: "middle", label: `row-hint-${r}` }), `row-hint-${r}`));
    }
  });
  L.cols.forEach((col, c) => {
    piece(col.rangeRect, 2, tag(textCell({ text: col.range.text, fontSize: col.range.px, color: pal.dim, hAlign: "center", vAlign: "middle", label: `col-range-${c}` }), `col-range-${c}`));
    if (col.cls && col.clsRect) {
      piece(col.clsRect, 2, tag(textCell({ text: col.cls.text, fontSize: col.cls.px, color: pal.ink, hAlign: "center", bold: true, vAlign: "middle", label: `col-class-${c}` }), `col-class-${c}`));
    }
    if (col.count && col.countRect) {
      piece(col.countRect, 2, tag(textCell({ text: col.count.text, fontSize: col.count.px, color: pal.dim, hAlign: "center", vAlign: "middle", label: `col-count-${c}` }), `col-count-${c}`));
    }
  });

  // ---- footer: the gloss on the map's axis, the slot coverage story ----
  piece(L.footerCaptionRect, 3, tag(textCell({ text: L.footerCaption.text, fontSize: L.footerCaption.px, color: pal.ink, hAlign: "left", bold: true, vAlign: "middle", label: "footer-caption" }), "footer-caption"));
  piece(L.footerGlossRect, 3, tag(textCell({ text: L.footerGloss.text, fontSize: L.footerGloss.px, color: pal.dim, hAlign: "left", vAlign: "middle", label: "footer-gloss" }), "footer-gloss"));
  piece(L.footerSlotsRect, 3, tag(textCell({ text: L.footerSlots.text, fontSize: L.footerSlots.px, color: pal.ink, hAlign: "right", bold: true, vAlign: "middle", label: "footer-slots" }), "footer-slots"));

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    size: { width: W, height: H },
    fps: ctx.target.fps,
    durationMs: 2000,
    backgroundColor: pal.page,
    sources: placed.sources,
    editor: { label: `Disc Bag Matrix - ${m.title}` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: bagContract(L), debug: m.debugLayout });
}
