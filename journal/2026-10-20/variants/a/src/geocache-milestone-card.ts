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
 * `@one-a-day/community/geocache-milestone-card/v1` - the "I hit N finds" card
 * a geocacher posts on a milestone or a year-in-review, built from the numbers
 * their own My Finds pocket-query GPX already contains (find count, the
 * cache-type mix, FTFs, difficulty/terrain). One render per count, from numbers
 * typed in, never fetched.
 *
 * ONE CONCEPT: the milestone is computed, never typed. The big number is the
 * find count; the card derives the ordinal ("1,000th", "1,042nd") and whether
 * that count is a Project-GC milestone, and shows the MILESTONE badge only
 * when it is. Nobody hand-writes the thing the whole post is about, so the
 * card cannot disagree with itself.
 *
 * The rule that bites: the card prints what was typed and the count it derives,
 * nothing else. A misspelled cache type is refused by name (with a "did you
 * mean" hint), a type-mix that sums to more finds than findCount is refused,
 * and copy that cannot fit above the readability floor is refused naming the
 * field - because a silently wrong number on a public card is worse than no
 * card.
 */

export type TypeMixEntry = { type: string; count: number };

export type GeocacheMilestoneCardProps = {
  /** The cacher's handle, drawn in capitals in the header. */
  cacherName?: string;
  /** The find count, the hero number. Drives the derived ordinal and the milestone badge. */
  findCount?: number;
  /** First-to-find count, the FTF tile. */
  ftfCount?: number;
  /** Average difficulty, 1.0-5.0, printed to one decimal. */
  avgD?: number;
  /** Average terrain, 1.0-5.0, printed to one decimal. */
  avgT?: number;
  /** The "caching since" year, 2000-2026. */
  sinceYear?: number;
  /** The cache-type breakdown as a list of { type, count }; top 5 render, remainder is "Other". */
  typeMix?: TypeMixEntry[];
  /** The one accent, as #rrggbb: hero number, badge fill, header rule. */
  accent?: string;
  /** The bottom line; "" removes it and the space returns to the card. */
  footer?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/community/geocache-milestone-card/v1";
/** The page: document.backgroundColor, never a full-canvas rect (doctor: canvasFill). */
const PAPER = "#f6f4ee";
const INK = "#1b1f1c";
/** Labels and captions: 7:1 on the light paper. */
const DIM = "#4f5651";
/** The stat tiles' neutral fill; neutral so it survives the 4:2:0 intermediate flat. */
const TILE = "#fbfbfb";
/** The mix bar's track - the "Other" grey that shows through where segments do not cover. */
const TRACK = "#d8d4ca";
const DEFAULT_ACCENT = "#4a8f3c";

/** The fixed cache-type palette (bar segments use this, never the accent). */
const TYPE_PALETTE: Record<string, string> = {
  Traditional: "#2e7d32",
  Multi: "#1565c0",
  Mystery: "#6a1b9a",
  Letterbox: "#c62828",
  Earthcache: "#ef6c00",
  Virtual: "#00838f",
  Webcam: "#5e35b1",
  Event: "#f9a825",
  CITO: "#558b2f",
  Wherigo: "#ad1457",
  "Adventure Lab": "#5d4037",
};
/** Short legend names, so the one-line legend fits a narrow canvas. */
const TYPE_SHORT: Record<string, string> = {
  Traditional: "Trad",
  Multi: "Multi",
  Mystery: "Mystery",
  Letterbox: "Letterbox",
  Earthcache: "Earthcache",
  Virtual: "Virtual",
  Webcam: "Webcam",
  Event: "Event",
  CITO: "CITO",
  Wherigo: "Wherigo",
  "Adventure Lab": "Adventure Lab",
};
const TYPE_NAMES = Object.keys(TYPE_PALETTE);

// The invented sample: geohiker55 is the handle a local club congratulated on
// 1000 finds; the footer says the card is invented, like the neighbours.
const DEFAULT_TYPE_MIX: TypeMixEntry[] = [
  { type: "Traditional", count: 812 },
  { type: "Mystery", count: 121 },
  { type: "Multi", count: 38 },
  { type: "Letterbox", count: 9 },
  { type: "Event", count: 20 },
];
const DEFAULTS = {
  cacherName: "geohiker55",
  findCount: 1000,
  ftfCount: 24,
  avgD: 2.3,
  avgT: 1.8,
  sinceYear: 2015,
  typeMix: DEFAULT_TYPE_MIX,
  accent: DEFAULT_ACCENT,
  footer: "Sample card: the geocacher and the numbers are invented",
  debugLayout: false,
};

const propsSchema = definePropsSchema<GeocacheMilestoneCardProps>({
  cacherName: {
    type: "string",
    required: false,
    description: "The cacher's handle, drawn in capitals in the header. 1-40 characters of printable ASCII or accented Latin letters. A long name shrinks to fit; one that cannot fit above the readability floor is refused.",
    meta: { control: { placeholder: DEFAULTS.cacherName }, ui: { label: "Cacher name", order: 1, primary: true } },
  },
  findCount: {
    type: "number",
    required: false,
    description: "The find count, the hero number. A whole number 1-9999999. It drives the derived ordinal (1,000th, 1,042nd) and whether the MILESTONE badge shows (Project-GC milestones: 1, 10, 50, 100, then every hundred to 1000, every five hundred to 5000, then every thousand).",
    meta: { constraints: { min: 1, max: 9999999 }, control: { placeholder: String(DEFAULTS.findCount) }, ui: { label: "Find count", order: 2, primary: true } },
  },
  ftfCount: {
    type: "number",
    required: false,
    description: "The first-to-find count, the FTF tile. A whole number 0 to findCount.",
    meta: { constraints: { min: 0, max: 9999999 }, control: { placeholder: String(DEFAULTS.ftfCount) }, ui: { label: "FTF count", order: 3 } },
  },
  avgD: {
    type: "number",
    required: false,
    description: "The average difficulty, 1.0 to 5.0, printed to one decimal (2.3).",
    meta: { constraints: { min: 1, max: 5 }, control: { placeholder: String(DEFAULTS.avgD) }, ui: { label: "Avg difficulty", order: 4 } },
  },
  avgT: {
    type: "number",
    required: false,
    description: "The average terrain, 1.0 to 5.0, printed to one decimal (1.8).",
    meta: { constraints: { min: 1, max: 5 }, control: { placeholder: String(DEFAULTS.avgT) }, ui: { label: "Avg terrain", order: 5 } },
  },
  sinceYear: {
    type: "number",
    required: false,
    description: 'The "caching since" year, 2000-2026, printed as "caching since 2015".',
    meta: { constraints: { min: 2000, max: 2026 }, control: { placeholder: String(DEFAULTS.sinceYear) }, ui: { label: "Caching since", order: 6 } },
  },
  typeMix: {
    type: "json",
    required: false,
    description: 'The cache-type breakdown as a list of {"type":"<name>","count":<int>}. Recognized types: Traditional, Multi, Mystery, Letterbox, Earthcache, Virtual, Webcam, Event, CITO, Wherigo, Adventure Lab. An unknown type is refused by name (with a did-you-mean hint); counts are whole numbers >= 0. Only the top 5 by count render as bar segments; the remainder (findCount minus the shown) draws as a grey Other, so the bar always spans full width.',
    meta: {
      constraints: {
        jsonSchema: {
          type: "array",
          maxItems: 11,
          items: {
            type: "object",
            required: ["type", "count"],
            additionalProperties: false,
            properties: { type: { type: "string" }, count: { type: "integer", minimum: 0 } },
          },
        },
      },
      ui: { label: "Cache-type mix", order: 7, primary: true },
    },
  },
  accent: {
    type: "string",
    required: false,
    description: "The one accent, as #rrggbb: the hero number, the MILESTONE badge fill and the header rule. An accent with less than 3:1 contrast on the paper (the large-text bar) keeps the badge but leaves the hero number in ink. Empty falls back to the default green.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 8 } },
  },
  footer: {
    type: "string",
    required: false,
    description: "The bottom line. One line of printable ASCII or accented Latin letters; a long one shrinks, and only a line that cannot fit above the floor is refused. Empty removes it and the space returns to the card.",
    meta: { control: { placeholder: "none" }, ui: { label: "Footer", order: 9 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the name in the header band, the hero number and derived ordinal, the full-width mix bar, three equal stat tiles, the footer at the bottom) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the count: pure, exported, and what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

/** Printable ASCII plus Latin-1 and Latin Extended-A letters: what the bundled font draws. */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;

/** 1204 -> "1,204": ASCII digits and a thousands comma, never "1.2k". Internal: the pack already exports a formatCount. */
function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 1,000th / 1,042nd / 11th / 21st: thousands separators plus the English ordinal suffix. */
export function ordinal(n: number): string {
  const s = formatCount(n);
  const mod100 = n % 100;
  let suffix = "th";
  if (mod100 < 11 || mod100 > 13) {
    const d = n % 10;
    if (d === 1) suffix = "st";
    else if (d === 2) suffix = "nd";
    else if (d === 3) suffix = "rd";
  }
  return `${s}${suffix}`;
}

/** Project-GC's milestone ladder: 1, 10, 50, 100; then every hundred to 1000, every five hundred to 5000, then every thousand. */
export function isMilestone(n: number): boolean {
  if (!Number.isInteger(n) || n < 1) return false;
  if (n <= 100) return n === 1 || n === 10 || n === 50 || n === 100;
  if (n <= 1000) return n % 100 === 0;
  if (n <= 5000) return n % 500 === 0;
  return n % 1000 === 0;
}

/** Edit distance, for "did you mean" on a misspelled type or prop. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
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

export type MixBarEntry = { type: string; count: number; color: string };
export type NormalizedMix = { top: MixBarEntry[]; other: number; legend: string };

/** The typeMix list: recognized types only, whole counts, top 5 kept, remainder as Other. Throws naming the bad entry. */
export function parseTypeMix(value: unknown, findCount: number): NormalizedMix {
  // A json prop may arrive as the raw string its editor holds.
  if (typeof value === "string") {
    const raw = value;
    try { value = JSON.parse(raw); } catch { fail("typeMix", `is not valid JSON: ${JSON.stringify(raw.slice(0, 60))}.`); }
  }
  if (!Array.isArray(value)) fail("typeMix", "must be an array of { type, count } objects.");
  if (value.length > TYPE_NAMES.length) fail("typeMix", `has ${value.length} entries; at most ${TYPE_NAMES.length} (one per recognized type).`);
  const seen = new Set<string>();
  const entries = value.map((e, i) => {
    if (typeof e !== "object" || e === null || Array.isArray(e)) fail("typeMix", `entry ${i} must be an object { type, count }.`);
    const obj = e as Record<string, unknown>;
    const type = typeof obj.type === "string" ? obj.type.trim() : "";
    if (!TYPE_NAMES.includes(type)) {
      const near = TYPE_NAMES.find((n) => distance(n.toLowerCase(), type.toLowerCase()) <= 2);
      fail("typeMix", `entry ${i} has an unknown type ${JSON.stringify(type)}${near ? `; did you mean '${near}'?` : `. Recognized types: ${TYPE_NAMES.join(", ")}.`}`);
    }
    if (seen.has(type)) fail("typeMix", `'${type}' appears twice; give each type one entry.`);
    seen.add(type);
    const count = obj.count;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) fail("typeMix", `entry ${i} ('${type}') count must be a whole number >= 0, got ${JSON.stringify(count)}.`);
    return { type, count };
  });
  // Top 5 by count, ties keep input order (stable, deterministic).
  const top = entries
    .map((e, i) => ({ ...e, i }))
    .sort((a, b) => b.count - a.count || a.i - b.i)
    .slice(0, 5)
    .map(({ type, count }) => ({ type, count, color: TYPE_PALETTE[type] }));
  const sum = top.reduce((a, b) => a + b.count, 0);
  if (sum > findCount) fail("typeMix", `the shown types count ${sum} finds, more than findCount ${findCount}.`);
  const other = findCount - sum;
  const legendParts = top.map((e) => `${TYPE_SHORT[e.type]} ${formatCount(e.count)}`);
  if (other > 0) legendParts.push(`Other ${formatCount(other)}`);
  return { top, other, legend: legendParts.join(" / ") };
}

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeGeocacheMilestoneCard(props: GeocacheMilestoneCardProps) {
  const known = Object.keys(DEFAULTS);
  for (const k of Object.keys(props ?? {})) {
    if (known.includes(k)) continue;
    const near = known.find((n) => distance(n.toLowerCase(), k.toLowerCase()) <= 2);
    fail("props", `has an unknown prop '${k}'${near ? `; did you mean '${near}'?` : "."} The props are ${known.join(", ")}.`);
  }
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) } as typeof DEFAULTS;

  const nameRaw = drawn(p.cacherName, "cacherName", 40, false);
  const name = nameRaw.toUpperCase();
  if (!DRAWN.test(name)) fail("cacherName", `${JSON.stringify(nameRaw)} has a letter whose capital the card's font is not known to draw.`);

  if (typeof p.findCount !== "number" || !Number.isInteger(p.findCount) || p.findCount < 1 || p.findCount > 9999999) {
    fail("findCount", `must be a whole number from 1 to 9999999, got ${JSON.stringify(p.findCount)}.`);
  }
  if (typeof p.ftfCount !== "number" || !Number.isInteger(p.ftfCount) || p.ftfCount < 0 || p.ftfCount > p.findCount) {
    fail("ftfCount", `must be a whole number from 0 to findCount (${p.findCount}), got ${JSON.stringify(p.ftfCount)}.`);
  }
  const avg = (v: unknown, field: string) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 1 || v > 5) fail(field, `must be a number from 1.0 to 5.0, got ${JSON.stringify(v)}.`);
    return v;
  };
  const avgD = avg(p.avgD, "avgD");
  const avgT = avg(p.avgT, "avgT");
  if (typeof p.sinceYear !== "number" || !Number.isInteger(p.sinceYear) || p.sinceYear < 2000 || p.sinceYear > 2026) {
    fail("sinceYear", `must be a whole year from 2000 to 2026, got ${JSON.stringify(p.sinceYear)}.`);
  }
  const mix = parseTypeMix(p.typeMix, p.findCount);
  if (typeof p.accent !== "string") fail("accent", "must be a string.");
  const accentText = p.accent.trim() === "" ? DEFAULT_ACCENT : p.accent.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(accentText)) fail("accent", `${JSON.stringify(accentText)} must be #rrggbb.`);
  const footer = drawn(p.footer, "footer", 120, true);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");

  const accent = accentText.toLowerCase() as MosaicColor;
  const milestone = isMilestone(p.findCount);
  const ordinalText = ordinal(p.findCount);
  return {
    name,
    findCount: p.findCount,
    findText: formatCount(p.findCount),
    ordinalText,
    milestoneLine: `${ordinalText} find`,
    milestone,
    ftfText: formatCount(p.ftfCount),
    avgDText: avgD.toFixed(1),
    avgTText: avgT.toFixed(1),
    sinceLine: `caching since ${p.sinceYear}`,
    mix,
    accent,
    // The hero number is large bold text, so 3:1 (WCAG large-text) is the bar.
    heroInk: (contrast(accent, PAPER) >= 3 ? accent : INK) as MosaicColor,
    footer,
    debugLayout: p.debugLayout,
  };
}

/* ── geometry ── */

export type GmcRect = { x: number; y: number; w: number; h: number };
type Bind = "cacherName" | "findCount" | "ftfCount" | "avgD" | "avgT" | "sinceYear" | "typeMix" | "accent" | "footer" | null;
type Cell = { label: string; rect: GmcRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; over: boolean };
type Tile = { label: string; rect: GmcRect; color: MosaicColor; radius: number; bind?: "accent" };

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

const GEOCACHE_LABEL = "GEOCACHING";
const MILESTONE_WORD = "MILESTONE";
const TILE_DEFS = [
  { key: "ftf", label: "FTF", value: (p: ReturnType<typeof normalizeGeocacheMilestoneCard>) => p.ftfText, bind: "ftfCount" as Bind },
  { key: "d", label: "AVG D", value: (p: ReturnType<typeof normalizeGeocacheMilestoneCard>) => p.avgDText, bind: "avgD" as Bind },
  { key: "t", label: "AVG T", value: (p: ReturnType<typeof normalizeGeocacheMilestoneCard>) => p.avgTText, bind: "avgT" as Bind },
];

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutGeocacheMilestoneCard(props: GeocacheMilestoneCardProps, W: number, H: number) {
  const p = normalizeGeocacheMilestoneCard(props);
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
  let segmentCount = 0;
  const line = (label: string, rect: GmcRect, text: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; over?: boolean; field?: string; min?: number } = {}) => {
    if (px < (o.min ?? floor)) unfit(o.field ?? label, o.min ?? floor);
    cells.push({ label, rect, text, px, width: widthOf(text, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? (INK as MosaicColor), bind: o.bind ?? null, over: o.over === true });
  };

  // ── bands: footer sized by its line, the rest shared by weight ──
  const footerDesign = Math.max(floor, Math.round(S * 0.026));
  const footerPx = p.footer === "" ? 0 : Math.min(footerDesign, fitPx(p.footer, CW, footerDesign, false));
  if (p.footer !== "" && footerPx < floor) unfit("footer");
  const footerH = p.footer === "" ? 0 : lineH(footerPx);
  const weights = shape === "wide" ? [0.58, 0.22, 0.2] : [0.16, 0.42, 0.2, 0.22];
  const bandCount = weights.length;
  const footerGap = p.footer === "" ? 0 : gap;
  const avail = CH - footerH - footerGap - (bandCount - 1) * gap;
  const sumW = weights.reduce((a, b) => a + b, 0);
  const hs = weights.map((w) => Math.floor((avail * w) / sumW));
  hs[hs.length - 1] += avail - hs.reduce((a, b) => a + b, 0);

  let y = top;
  // Wide: header and hero side by side in the first band; square/tall: header then hero stacked.
  const leftW = shape === "wide" ? Math.round(CW * 0.34) : CW;
  const headRect: GmcRect = { x: m, y, w: leftW, h: hs[0] };
  const heroRect: GmcRect = shape === "wide"
    ? { x: m + leftW + gap, y, w: CW - leftW - gap, h: hs[0] }
    : { x: m, y: top + hs[0] + gap, w: CW, h: hs[1] };
  const mixY = shape === "wide" ? top + hs[0] + gap : top + hs[0] + gap + hs[1] + gap;
  const mixRect: GmcRect = { x: m, y: mixY, w: CW, h: hs[shape === "wide" ? 1 : 2] };
  const tilesRect: GmcRect = { x: m, y: mixRect.y + mixRect.h + gap, w: CW, h: hs[shape === "wide" ? 2 : 3] };

  // ── header: the sport label, the name in capitals, the since line, the accent rule ──
  const ruleH = Math.max(2, Math.round(S * 0.006));
  const gapSm = Math.max(1, Math.round(headRect.h * 0.04));
  const labelPx = Math.max(floor, Math.min(Math.round(headRect.h * 0.15), Math.round(S * 0.028)));
  const sincePx = Math.max(floor, Math.min(Math.round(headRect.h * 0.13), Math.round(S * 0.024)));
  const nameRoom = headRect.h - ruleH - lineH(labelPx) - lineH(sincePx) - 2 * gapSm;
  const namePx = fitPx(p.name, headRect.w, nameRoom / 1.22, true);
  if (namePx < floor) unfit("cacherName");
  {
    const lx = headRect.x, ly = headRect.y;
    line("geocache-label", { x: lx, y: ly, w: need(GEOCACHE_LABEL, labelPx, true), h: lineH(labelPx) }, GEOCACHE_LABEL, labelPx, { bold: true, color: DIM as MosaicColor, field: "the sport label" });
    line("cacher-name", { x: lx, y: ly + lineH(labelPx) + gapSm, w: need(p.name, namePx, true), h: lineH(namePx) }, p.name, namePx, { bold: true, bind: "cacherName", field: "cacherName" });
    line("caching-since", { x: lx, y: ly + lineH(labelPx) + gapSm + lineH(namePx) + gapSm, w: need(p.sinceLine, sincePx, false), h: lineH(sincePx) }, p.sinceLine, sincePx, { color: DIM as MosaicColor, bind: "sinceYear", field: "sinceYear" });
    tiles.push({ label: "header-rule", rect: { x: lx, y: headRect.y + headRect.h - ruleH, w: headRect.w, h: ruleH }, color: p.accent, radius: 0, bind: "accent" });
  }

  // ── hero: the find count, the derived ordinal line, the MILESTONE badge when it is one ──
  let findPx = 0;
  {
    const heroGap = Math.max(2, Math.round(S * 0.012));
    const linePx = Math.max(floor, Math.min(Math.round(heroRect.h * 0.16), Math.round(S * 0.03)));
    const badgePx = Math.max(small, Math.min(Math.round(S * 0.016), Math.round(linePx * 0.7)));
    const badgeSide = need(MILESTONE_WORD, badgePx, true);
    const rowH = p.milestone ? Math.max(lineH(linePx), badgeSide) : lineH(linePx);
    const findRoom = heroRect.h - rowH - heroGap;
    findPx = Math.min(Math.round(S * 0.3), Math.floor(findRoom / 1.22), fitPx(p.findText, heroRect.w, Math.round(S * 0.3), true));
    if (findPx < floor) unfit("findCount");
    line("find-count", { x: heroRect.x, y: heroRect.y, w: need(p.findText, findPx, true), h: lineH(findPx) }, p.findText, findPx, { bold: true, color: p.heroInk, bind: "findCount", field: "findCount" });
    const rowY = heroRect.y + lineH(findPx) + heroGap;
    line("milestone-line", { x: heroRect.x, y: rowY + Math.round((rowH - lineH(linePx)) / 2), w: need(p.milestoneLine, linePx, false), h: lineH(linePx) }, p.milestoneLine, linePx, { color: DIM as MosaicColor, field: "the ordinal line" });
    if (p.milestone) {
      const badge: GmcRect = { x: heroRect.x + need(p.milestoneLine, linePx, false) + gap, y: rowY, w: badgeSide, h: badgeSide };
      tiles.push({ label: "milestone-badge", rect: badge, color: p.accent, radius: 0.16, bind: "accent" });
      line("milestone-badge-text", badge, MILESTONE_WORD, badgePx, { bold: true, align: "center", color: onColor(p.accent), over: true, field: "the milestone badge", min: small });
    }
  }

  // ── mix: the full-width track, the top-5 segments over it, the legend line under ──
  {
    const barH = Math.max(2, Math.round(S * 0.02));
    const barY = mixRect.y;
    const track: GmcRect = { x: mixRect.x, y: barY, w: mixRect.w, h: barH };
    // typeMix is a json list - it renders as a structured form, so the bar is not prop-bound.
    tiles.push({ label: "type-mix-bar", rect: track, color: TRACK as MosaicColor, radius: 0 });
    let segX = mixRect.x;
    p.mix.top.forEach((e, i) => {
      const isLast = i === p.mix.top.length - 1 && p.mix.other === 0;
      const segW = isLast ? mixRect.x + mixRect.w - segX : Math.round((mixRect.w * e.count) / p.findCount);
      if (segW > 0) {
        tiles.push({ label: "type-mix-segment", rect: { x: segX, y: barY, w: segW, h: barH }, color: e.color as MosaicColor, radius: 0 });
        segmentCount++;
      }
      segX += segW;
    });
    const legendPx = Math.max(floor, Math.min(Math.round(S * 0.024), fitPx(p.mix.legend, CW, Math.round(S * 0.024), false)));
    if (legendPx < floor) unfit("the mix legend");
    line("mix-legend", { x: mixRect.x, y: barY + barH + Math.max(2, Math.round(S * 0.006)), w: need(p.mix.legend, legendPx, false), h: lineH(legendPx) }, p.mix.legend, legendPx, { color: DIM as MosaicColor, field: "the mix legend" });
  }

  // ── tiles: three equal stat tiles (FTF, avg D, avg T) ──
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
      const tile: GmcRect = { x: tx, y: tilesRect.y, w: tileW, h: tileH };
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

  return { p, shape, floor, cells, tiles, headRect, heroRect, mixRect, tilesRect, findPx, namePx, badgeShown: p.milestone, segmentCount };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 31,
  "date": "2026-10-20",
  "agent": "opencode",
  "model": "deepseek-v4-pro",
  "id": "@one-a-day/community/geocache-milestone-card/v1",
  "title": "Geocache Milestone Card",
  "who": "Geocachers hitting a milestone or building a stats card, gathered on the Geocaching forums, Project-GC, and their local clubs",
  "problem": [
    "Every Premium member can download their My Finds pocket query: a zipped GPX of every cache they logged. Project-GC's Milestones tab gives the ladder: 'the first milestones are 1, 10, 50 and 100 caches, after that and up to 1000 caches every hundredth cache is considered a milestone'.",
    "CacheSleuth reads the same GPX into a profile banner ('Upload your My Finds pocket query and see your geocaching statistics'), but the shareable 'I hit N finds' card is still hand-built; a local club just posts 'geohiker55 found his 1000th find yesterday'."
  ],
  "sources": [
    "https://www.cachesleuth.com/tools/profilestats",
    "https://project-gc.com/w/Milestones_tab",
    "https://www.geocaching.com/blog/2025/05/celebrating-25-years-of-geocaching-milestones",
    "https://www.geocaching.com/help/index.php?id=118&pg=kb.page",
    "https://www.yogosc.org/announcements/congratulations-to-geohiker55-on-1000-finds"
  ],
  "solution": [
    "One card per count, from numbers typed in, never fetched. The props mirror the My Finds GPX fields: findCount, the cache-type mix, ftfCount, avgD, avgT, sinceYear. It draws the count as the hero, the type mix as a full-width bar, and three FTF / difficulty / terrain tiles.",
    "The decision that matters: the milestone is computed, never typed. The card derives the ordinal (1,000th) and whether the count is a Project-GC milestone, and shows the MILESTONE badge only when it is. Nobody hand-writes the thing the whole post is about."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/community/geocache-milestone-card/v1 --template-repo . -w 1080 -h 1080 --props @card.json -o card.png",
    "try": [
      "card.json: {\"cacherName\":\"GeoHiker\",\"findCount\":1042,\"typeMix\":[{\"type\":\"Traditional\",\"count\":900}]}",
      "findCount 1042 prints 1,042nd with no badge; 1500 and 2000 print it (Project-GC milestones)",
      "-w 1920 -h 1080 puts the header beside the hero; -h 1920 stacks the bands",
      "footer \"\" removes the sample line; accent \"#b3261e\" recolours the hero and badge"
    ]
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 77498,
        "status": "error"
      },
      {
        "name": "scout (2)",
        "startMs": 77532,
        "durMs": 74463,
        "status": "error"
      },
      {
        "name": "scout (3)",
        "startMs": 26271235,
        "durMs": 147914,
        "calls": 18,
        "tokens": 576781,
        "costUsd": 0.07,
        "tools": "bash 6, websearch 6, read 3"
      },
      {
        "name": "plan",
        "startMs": 26419174,
        "durMs": 121509,
        "calls": 14,
        "tokens": 480173,
        "costUsd": 0.1,
        "tools": "read 12, write 2"
      }
    ],
    "costBasis": "reported"
  },
  "caveats": [
    "No importer: the numbers are retyped from the My Finds GPX (or a Project-GC screenshot); typeMix is JSON, not the GPX file.",
    "Only the top five cache types render as segments; the rest and any unlisted finds fold into a grey Other remainder.",
    "The Project-GC milestone ladder is hard-coded (1, 10, 50, 100, then hundreds to 1000, five-hundreds to 5000, thousands after)."
  ]
};

export const GeocacheMilestoneCardV1 = defineMosaicTemplate<GeocacheMilestoneCardProps>({
  id: asTemplateId(ID),
  label: "2026-10-20 · Geocache Milestone Card",
  version: 1,
  description: "A geocaching milestone card for one find count: the count as the hero, the Project-GC milestone and ordinal derived from it (never typed), the cache-type mix as a full-width bar, and FTF / difficulty / terrain tiles. Numbers typed in, never fetched.",
  capabilities: { tier: "core" },
  tags: ["community", "2026-10-20", "day-031", "geocaching", "milestone", "gpx", "stats", "ftf", "share-card"],

  outputHints: {
    width: 1080,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG, one card per count. 1080x1080 for the feed; 1920x1080 puts the header beside the hero, 1080x1920 stacks the four bands. Minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default GeocacheMilestoneCardV1;

async function render(props: GeocacheMilestoneCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutGeocacheMilestoneCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  for (const t of L.tiles) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) } as MosaicSource, t.label);
    // The mix track shows typeMix; the header rule and badge show accent.
    pieces.push({ rect: { ...t.rect, importance: 1 }, source: t.bind ? bindProp(tile, t.bind) : tile });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; derived copy (the ordinal, the labels, the legend) is not.
    pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source: c.bind === null ? cell : bindProp(cell, c.bind) });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises: every text fits (above); the name in the top
  // band; the hero number present; the derived ordinal under it; the mix bar
  // full-width; three equal stat tiles; the footer at the bottom; a square
  // badge when the count is a milestone.
  constraints.push({ label: "cacher-name", within: { yFrac: [0, 0.24] } });
  constraints.push({ label: "find-count" });
  constraints.push({ label: "milestone-line", within: { yFrac: [0.15, 0.6] } });
  constraints.push({ label: "type-mix-bar", minWidthFrac: 0.9, within: { yFrac: [0.3, 0.78] } });
  if (L.segmentCount > 0) constraints.push({ label: "type-mix-segment" });
  if (L.cells.some((c) => c.label === "footer")) constraints.push({ label: "footer", within: { yFrac: [0.86, 1] } });
  if (L.badgeShown) constraints.push({ label: "milestone-badge", aspect: 1, aspectTolerance: 0.08 });

  const relations: RelationalConstraint[] = [{ label: "stat-tile", equal: "size", tolerancePx: 2 }];

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    backgroundColor: PAPER as MosaicColor,
    sources: placed.sources,
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, relations, debug: props.debugLayout === true });
}
