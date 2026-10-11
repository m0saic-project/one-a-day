import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicSource } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, bindPropPath, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag } from "@m0saic/template-utils";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/personal/reading-goal-recap/v1` - the monthly reading wrap-up
 * as one card: the month's books, pages and average rating as three stat
 * tiles, then the year's reading-challenge goal as a progress bar with the
 * pace tick drawn across it and the ahead/behind line nobody has to compute
 * by hand, and the month's shelf of titles with their ratings.
 *
 * ONE CONCEPT: the derived number is the point. Every wrap-up post carries
 * the same hand-computed line - "16 books behind schedule (88/125)" - so the
 * card never asks for it: give the goal, the books so far and the day of the
 * year, and the bar fill, the pace tick (goal x dayOfYear / 365) and the
 * delta line are computed, not typed. The card cannot disagree with itself.
 *
 * The rule that bites: dayOfYear is a PROP, not a clock. The pace tick's x
 * is pace/goalTotal of the bar's full width at every canvas, so a template
 * that reads a wall clock would render two different cards from the same
 * inputs (and fail determinism). Ratings are halves only (4.5, never 4.7),
 * a long title is refused by name instead of clipping, and every line is
 * fitted to its cell's budget (cell * 0.94 - 2px) below the floor.
 */

export type ReadingShelfEntry = { title: string; rating: number };

export type ReadingGoalRecapProps = {
  /** The month line, e.g. "October 2026" - the header's first line. */
  month?: string;
  /** The reader's handle or name, under the month. "" removes it. */
  reader?: string;
  /** Books finished this month. */
  books?: number;
  /** Pages read this month. */
  pages?: number;
  /** The month's average rating, 0 to 5. */
  avgRating?: number;
  /** The year's reading-challenge goal, in books. */
  goalTotal?: number;
  /** Books finished so far this year - may pass the goal; the bar clamps and the delta tells. */
  booksSoFar?: number;
  /** The day of the year the card is for, 1 to 366 - drives the pace tick (pace = goalTotal x dayOfYear / 365). A prop, not a clock. */
  dayOfYear?: number;
  /** The month's shelf: up to 12 { title, rating } entries, ratings in half steps; the first 6 render. */
  titles?: ReadingShelfEntry[];
  /** The bar fill and the delta when ahead, as #rrggbb. */
  accent?: string;
  /** Page and ink. */
  preset?: "dark" | "light";
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/personal/reading-goal-recap/v1";
const DEFAULT_ACCENT = "#e8a13c";
const THEMES = {
  dark: { bg: "#171512", ink: "#efe9dc", dim: "#a89f8c" },
  light: { bg: "#f6f1e6", ink: "#221d14", dim: "#6b6252" },
} as const;

// An invented reader's invented October: 15 books, 4,703 pages, 46 of 52 at
// day 304 - three ahead of pace - and four shelf titles.
const DEFAULTS = {
  month: "October 2026",
  reader: "@leah_reads",
  books: 15,
  pages: 4703,
  avgRating: 4.3,
  goalTotal: 52,
  booksSoFar: 46,
  dayOfYear: 304,
  titles: [
    { title: "The Dark Descent of Elizabeth Frankenstein", rating: 5 },
    { title: "Nettle & Bone", rating: 5 },
    { title: "Babel, or the Necessity of Violence", rating: 4.5 },
    { title: "The Ex Hex", rating: 4 },
  ] as ReadingShelfEntry[],
  accent: DEFAULT_ACCENT,
  preset: "dark" as "dark" | "light",
  debugLayout: false,
};

const propsSchema = definePropsSchema<ReadingGoalRecapProps>({
  month: {
    type: "string",
    required: false,
    description: 'The month line, e.g. "October 2026" - the header\'s first line. Up to 24 characters; the sample month is invented.',
    meta: { control: { placeholder: DEFAULTS.month }, ui: { label: "Month", order: 1 } },
  },
  reader: {
    type: "string",
    required: false,
    description: "The reader's handle or name, under the month. Up to 32 characters; empty removes it. The sample handle is invented.",
    meta: { control: { placeholder: DEFAULTS.reader }, ui: { label: "Reader", order: 2 } },
  },
  books: {
    type: "number",
    required: false,
    description: "Books finished this month, an integer 0 to 999 - the first stat tile.",
    meta: { constraints: { min: 0, max: 999 }, ui: { label: "Books this month", order: 3, primary: true } },
  },
  pages: {
    type: "number",
    required: false,
    description: "Pages read this month, an integer 0 to 999999 - the second stat tile, printed with thousands separators.",
    meta: { constraints: { min: 0, max: 999999 }, ui: { label: "Pages this month", order: 4, primary: true } },
  },
  avgRating: {
    type: "number",
    required: false,
    description: "The month's average rating, 0 to 5 - the third stat tile, printed to one decimal.",
    meta: { constraints: { min: 0, max: 5 }, ui: { label: "Average rating", order: 5 } },
  },
  goalTotal: {
    type: "number",
    required: false,
    description: "The year's reading-challenge goal in books, an integer 1 to 999. 52 is the community's canonical one.",
    meta: { constraints: { min: 1, max: 999 }, ui: { label: "Year goal (books)", order: 6, primary: true } },
  },
  booksSoFar: {
    type: "number",
    required: false,
    description: "Books finished so far this year, an integer 0 to 999 - it may pass the goal (the bar clamps at full and the delta line tells how far past).",
    meta: { constraints: { min: 0, max: 999 }, ui: { label: "Books so far", order: 7, primary: true } },
  },
  dayOfYear: {
    type: "number",
    required: false,
    description: "The day of the year the card is for, an integer 1 to 366. Drives the pace tick: pace = goalTotal x dayOfYear / 365. A prop, not a clock, so the card stays deterministic.",
    meta: { constraints: { min: 1, max: 366 }, ui: { label: "Day of year", order: 8 } },
  },
  titles: {
    type: "json",
    required: false,
    description: 'The month\'s shelf: a list of { "title": string, "rating": number }, up to 12 entries, ratings 0 to 5 in half steps (4.5, never 4.7); the first 6 render, each title up to 80 characters.',
    meta: {
      constraints: { jsonSchema: { type: "array", maxItems: 12, items: { type: "object", required: ["title", "rating"], properties: { title: { type: "string", minLength: 1, maxLength: 80 }, rating: { type: "number", minimum: 0, maximum: 5 } } } } },
      ui: { label: "Shelf titles", order: 9 },
    },
  },
  accent: {
    type: "string",
    required: false,
    description: "The bar fill and the delta line when ahead of pace, as #rrggbb.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 10 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "dark" (default) or "light" - the paper card.',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 11 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the tiles are one size, the bar is full-width, the pace tick is there) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the arithmetic: pure, exported, and what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

/** Printable ASCII plus the accented Latin letters the bundled font draws; anything else is refused by name. */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  if (!DRAWN.test(value)) fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use printable ASCII and accented Latin letters (U+00C0-U+017F).`);
  const s = value.trim();
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
  return s;
}
function int(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) fail(field, `${JSON.stringify(value)} is not an integer.`);
  if (value < min || value > max) fail(field, `${value} is outside ${min} to ${max}.`);
  return value;
}

/** Thousands separators, deterministic (no locale): 4703 -> "4,703". */
export function fmtInt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** A rating the way wrap-ups print it: 5, 4.5, 4 - never 4.50. */
export function fmtRating(r: number): string {
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

/** The wrap-up's pace line, from goal, count and day: the number people compute by hand. */
export function readingPace(goalTotal: number, booksSoFar: number, dayOfYear: number) {
  const pace = (goalTotal * dayOfYear) / 365;
  const delta = booksSoFar - pace;
  const rounded = Math.round(delta);
  const deltaText = Math.abs(delta) < 0.5 ? "on pace" : rounded > 0 ? `${rounded} ahead of pace` : `${-rounded} behind pace`;
  return { pace, delta, deltaText };
}

export type ReadingCard = ReturnType<typeof normalizeReadingCard>;

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeReadingCard(props: ReadingGoalRecapProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const month = text(p.month, "month", 24);
  if (month === "") fail("month", "is the header's first line; give it a month.");
  const reader = text(p.reader, "reader", 32);
  const books = int(p.books, "books", 0, 999);
  const pages = int(p.pages, "pages", 0, 999999);
  if (typeof p.avgRating !== "number" || Number.isNaN(p.avgRating)) fail("avgRating", "must be a number.");
  if (p.avgRating < 0 || p.avgRating > 5) fail("avgRating", `${p.avgRating} is outside 0 to 5.`);
  const avgRating = Math.round(p.avgRating * 10) / 10;
  const goalTotal = int(p.goalTotal, "goalTotal", 1, 999);
  const booksSoFar = int(p.booksSoFar, "booksSoFar", 0, 999);
  const dayOfYear = int(p.dayOfYear, "dayOfYear", 1, 366);
  if (p.preset !== "dark" && p.preset !== "light") fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
  if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim())) fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");

  if (!Array.isArray(p.titles)) fail("titles", "must be a list of { title, rating } entries.");
  if (p.titles.length > 12) fail("titles", `has ${p.titles.length} entries; the shelf takes at most 12 and renders the first 6.`);
  const titles = p.titles.map((entry, i) => {
    if (typeof entry !== "object" || entry === null) fail(`titles[${i}]`, "must be { title, rating }.");
    const t = text((entry as ReadingShelfEntry).title, `titles[${i}].title`, 80);
    if (t === "") fail(`titles[${i}].title`, "is empty.");
    const r = (entry as ReadingShelfEntry).rating;
    if (typeof r !== "number" || Number.isNaN(r)) fail(`titles[${i}].rating`, "must be a number.");
    if (r < 0 || r > 5) fail(`titles[${i}].rating`, `${r} is outside 0 to 5.`);
    if ((r * 2) % 1 !== 0) fail(`titles[${i}].rating`, `${r} is not a half step - wrap-ups print 4.5, never 4.7.`);
    return { title: t, rating: r };
  });

  const progress = booksSoFar / goalTotal;
  const fillFrac = Math.max(0, Math.min(1, progress));
  const { pace, deltaText } = readingPace(goalTotal, booksSoFar, dayOfYear);
  const paceFrac = Math.max(0, Math.min(1, pace / goalTotal));
  const pctText = `${Math.round(progress * 100)}% of goal`;
  const overGoal = booksSoFar > goalTotal;

  return {
    month, reader, books, pages, avgRating, goalTotal, booksSoFar, dayOfYear, titles,
    progress, fillFrac, pace, paceFrac, deltaText, pctText, overGoal,
    booksText: fmtInt(books), pagesText: fmtInt(pages), avgText: avgRating.toFixed(1),
    goalText: `${fmtInt(booksSoFar)} of ${fmtInt(goalTotal)}`,
    dayText: `day ${dayOfYear} of 365`,
    footnote: "Progress, pace and the delta are computed, not typed: pace = goal x day-of-year / 365.",
    accent: p.accent.trim().toLowerCase() as MosaicColor, preset: p.preset as "dark" | "light", debugLayout: p.debugLayout,
  };
}

/* ── colour ── */

// Not exported: the pack index is `export *`, and every card carries one of these.
function mix(a: string, b: string, t: number): MosaicColor {
  const ch = (s: string, i: number) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}

/* ── geometry ── */

export type ReadingRect = { x: number; y: number; w: number; h: number };
type Bind = { prop: string; key?: number } | "accent" | null;
type Cell = { label: string; rect: ReadingRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; field?: string };
type Tile = { label: string; rect: ReadingRect; color: MosaicColor; radius: number; bind: "accent" | null };

/** The largest whole size up to `maxPx` at which one line fits the cell's budget (`cell * 0.94 - 2px`). */
function fitPx(line: string, cellW: number, maxPx: number, bold: boolean): number {
  const top = Math.max(1, Math.round(maxPx));
  const room = budget(cellW), w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutReadingCard(props: ReadingGoalRecapProps, W: number, H: number) {
  const p = normalizeReadingCard(props);
  const theme = THEMES[p.preset];
  const ink = theme.ink as MosaicColor, dim = theme.dim as MosaicColor;
  const S = Math.min(W, H);
  const m = Math.round(S * 0.05), CW = W - 2 * m;
  const gap = Math.round(S * 0.016);
  const floor = Math.max(6, Math.round(S * 0.017)), small = Math.max(5, Math.round(S * 0.013));
  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const unfit = (field: string): never => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
  /** One fitted line in `rect`; refuses below the floor instead of clipping. */
  const line = (label: string, rect: ReadingRect, value: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; field?: string; floorPx?: number } = {}) => {
    if (px < (o.floorPx ?? floor)) unfit(o.field ?? label);
    cells.push({ label, rect, text: value, px, width: widthOf(value, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? ink, bind: o.bind ?? null, ...(o.field ? { field: o.field } : {}) });
  };
  /** A snug cell that always satisfies the contract's budget: cell * 0.94 - 2px >= measured. */
  const snugW = (t: string, px: number, bold: boolean) => Math.ceil((widthOf(t, px, bold) + 2) / 0.94);

  /* ── header: the month, then the reader and the static kind line ── */
  let y = m;
  const monthPx = fitPx(p.month, CW, S * 0.072, true);
  const monthH = Math.round(monthPx * 1.3);
  line("month", { x: m, y, w: CW, h: monthH }, p.month, monthPx, { bold: true, bind: { prop: "month" }, floorPx: small });
  y += monthH + Math.round(gap * 0.4);
  const subPx = fitPx(p.reader !== "" ? p.reader : "MONTHLY WRAP-UP", CW, S * 0.03, false);
  const subH = Math.round(subPx * 1.35);
  if (p.reader !== "") line("reader", { x: m, y, w: snugW(p.reader, subPx, false), h: subH }, p.reader, subPx, { color: dim, bind: { prop: "reader" }, floorPx: small });
  const kindText = "MONTHLY WRAP-UP";
  const kindPx = p.reader !== "" ? subPx : fitPx(kindText, CW, S * 0.03, false);
  line("kind", { x: W - m - snugW(kindText, kindPx, false), y, w: snugW(kindText, kindPx, false), h: subH }, kindText, kindPx, { color: dim, align: "right", floorPx: small });
  y += subH;
  const headerBottom = y;

  /* ── footer, pinned to the bottom ── */
  const footPx = fitPx(p.footnote, CW, S * 0.024, false);
  if (footPx < small) unfit("the footnote");
  const footH = Math.round(footPx * 1.35);
  line("footnote", { x: m, y: H - m - footH, w: CW, h: footH }, p.footnote, footPx, { color: dim, floorPx: small });
  const footerTop = H - m - footH - Math.round(S * 0.02);

  /* ── stats as one inline strip: the pace line is the hero, not the tiles ── */
  const statsY = headerBottom + Math.round(S * 0.028);
  const STATS: Array<{ value: string; label: string; prop: string }> = [
    { value: p.booksText, label: "books", prop: "books" },
    { value: p.pagesText, label: "pages", prop: "pages" },
    { value: p.avgText, label: "avg rating", prop: "avgRating" },
  ];
  const stripPx = fitPx("4,703 pages", CW * 0.5, S * 0.034, false);
  const stripH = Math.round(stripPx * 1.35);
  let sx = m;
  STATS.forEach((st, i) => {
    const vPx = fitPx(st.value, CW * 0.2, S * 0.04, true);
    const vW = snugW(st.value, vPx, true);
    line(`tile-value-${i}`, { x: sx, y: statsY + Math.round((stripH - Math.round(vPx * 1.25)) / 2), w: vW, h: Math.round(vPx * 1.25) }, st.value, vPx, { bold: true, bind: { prop: st.prop }, field: st.prop });
    sx += vW + Math.round(gap * 0.35);
    const lW = snugW(st.label, stripPx, false);
    line(`tile-label-${i}`, { x: sx, y: statsY, w: lW, h: stripH }, st.label, stripPx, { color: dim, floorPx: small });
    sx += lW + (i < STATS.length - 1 ? Math.round(S * 0.03) : 0);
  });

  /* ── the goal block: count line, the bar with its pace tick, the delta line ── */
  const goalY = statsY + stripH + Math.round(S * 0.042);
  const goalCap = fitPx("YEAR GOAL", CW * 0.3, S * 0.028, false);
  const goalCapH = Math.round(goalCap * 1.35);
  line("goal-caption", { x: m, y: goalY, w: snugW("YEAR GOAL", goalCap, false), h: goalCapH }, "YEAR GOAL", goalCap, { color: dim, floorPx: small });
  const readPx = fitPx(fmtInt(p.booksSoFar), CW * 0.2, S * 0.04, true);
  const ofText = `of ${fmtInt(p.goalTotal)}`;
  const ofPx = fitPx(ofText, CW * 0.25, S * 0.03, false);
  const readW = snugW(fmtInt(p.booksSoFar), readPx, true);
  const ofW = snugW(ofText, ofPx, false);
  const goalLineH = Math.max(Math.round(readPx * 1.3), goalCapH);
  line("goal-read", { x: W - m - readW - Math.round(gap * 0.4) - ofW, y: goalY + goalLineH - Math.round(readPx * 1.3), w: readW, h: Math.round(readPx * 1.3) }, fmtInt(p.booksSoFar), readPx, { bold: true, align: "right", bind: { prop: "booksSoFar" }, field: "booksSoFar" });
  line("goal-total", { x: W - m - ofW, y: goalY + goalLineH - Math.round(ofPx * 1.35), w: ofW, h: Math.round(ofPx * 1.35) }, ofText, ofPx, { color: dim, align: "right", bind: { prop: "goalTotal" }, field: "goalTotal" });

  const barY = goalY + goalLineH + Math.round(S * 0.018);
  const barH = Math.round(S * 0.062);
  const frame: ReadingRect = { x: m, y: barY, w: CW, h: barH };
  tiles.push({ label: "goal-bar", rect: frame, color: mix(theme.bg, theme.ink, 0.12), radius: 0.5, bind: null });
  const fillW = Math.round(CW * p.fillFrac);
  if (fillW > 0) tiles.push({ label: "goal-fill", rect: { x: m, y: barY, w: fillW, h: barH }, color: p.accent, radius: 0.5, bind: "accent" });
  const tickW = Math.max(2, Math.round(S * 0.005));
  const tickX = Math.max(m, Math.min(m + CW - tickW, m + Math.round(CW * p.paceFrac) - Math.round(tickW / 2)));
  tiles.push({ label: "pace-tick", rect: { x: tickX, y: barY - Math.round(S * 0.008), w: tickW, h: barH + Math.round(S * 0.016) }, color: ink, radius: 0, bind: null });

  /* ── the delta hero: the pace line at display size, the pct and day beside ── */
  const deltaY = barY + barH + Math.round(S * 0.018);
  const ahead = p.deltaText.includes("ahead");
  const deltaColor: MosaicColor = p.deltaText === "on pace" ? ink : ahead ? p.accent : dim;
  const heroPx = fitPx(p.deltaText, CW * 0.62, S * 0.062, ahead);
  const heroH = Math.round(heroPx * 1.3);
  line("goal-delta", { x: m, y: deltaY, w: snugW(p.deltaText, heroPx, ahead), h: heroH }, p.deltaText, heroPx, { bold: ahead, color: deltaColor, field: "the delta line" });
  const pctPx = fitPx(p.pctText, CW * 0.3, S * 0.028, false);
  line("goal-pct", { x: W - m - snugW(p.pctText, pctPx, false), y: deltaY, w: snugW(p.pctText, pctPx, false), h: Math.round(pctPx * 1.35) }, p.pctText, pctPx, { color: dim, align: "right", floorPx: small });
  const dayPx = fitPx(p.dayText, CW * 0.3, S * 0.026, false);
  line("day-of-year", { x: W - m - snugW(p.dayText, dayPx, false), y: deltaY + Math.round(pctPx * 1.35) + Math.round(gap * 0.3), w: snugW(p.dayText, dayPx, false), h: Math.round(dayPx * 1.35) }, p.dayText, dayPx, { color: dim, align: "right", bind: { prop: "dayOfYear" }, field: "dayOfYear", floorPx: small });
  const goalBottom = deltaY + Math.max(heroH, Math.round(pctPx * 1.35) + Math.round(gap * 0.3) + Math.round(dayPx * 1.35));

  /* ── the shelf: up to six title rows sharing the space left ── */
  const shelfLabelY = goalBottom + Math.round(S * 0.034);
  const shelfCapPx = fitPx("ON THE SHELF THIS MONTH", CW, S * 0.026, false);
  const shelfCapH = Math.round(shelfCapPx * 1.35);
  line("shelf-caption", { x: m, y: shelfLabelY, w: snugW("ON THE SHELF THIS MONTH", shelfCapPx, false), h: shelfCapH }, "ON THE SHELF THIS MONTH", shelfCapPx, { color: dim, floorPx: small });
  const shown = p.titles.slice(0, 6);
  const regionTop = shelfLabelY + shelfCapH + Math.round(gap * 0.7);
  const regionBottom = footerTop;
  const nRows = Math.max(1, shown.length);
  const rowH = Math.min(Math.round(S * 0.052), Math.floor((regionBottom - regionTop) / nRows));
  if (rowH < Math.round(floor * 1.8)) unfit("the shelf rows");
  const titleW = (rating: string, px: number) => CW - snugW(rating, px, false) - Math.round(S * 0.03);
  shown.forEach((entry, i) => {
    const rowY = regionTop + i * rowH;
    const ratingText = fmtRating(entry.rating);
    const ratingPx = fitPx(ratingText, CW * 0.06, rowH * 0.5, false);
    const ratingW = snugW(ratingText, ratingPx, false);
    const tPx = fitPx(entry.title, titleW(ratingText, ratingPx), rowH * 0.5, false);
    line(`shelf-title-${i}`, { x: m, y: rowY, w: titleW(ratingText, ratingPx), h: rowH }, entry.title, tPx, { bind: { prop: "titles", key: i }, field: `titles[${i}].title` });
    line(`shelf-rating-${i}`, { x: W - m - ratingW, y: rowY, w: ratingW, h: rowH }, ratingText, ratingPx, { color: dim, align: "right", bind: { prop: "titles", key: i }, field: `titles[${i}].rating` });
  });
  if (shown.length === 0) {
    const emptyText = "No shelf titles given - the export's rows would fill this.";
    const emptyPx = fitPx(emptyText, CW, rowH * 0.5, false);
    line("shelf-empty", { x: m, y: regionTop, w: CW, h: rowH }, emptyText, emptyPx, { color: dim, floorPx: small });
  }

  /* ── spread the slack across the inter-section gaps on tall canvases ── */
  // On a portrait canvas the S-derived sections would huddle at the top with a
  // dead band above the pinned footnote. The free space goes into the gaps
  // between the header, the tiles, the goal block and the shelf, a quarter
  // each - the header keeps the top, the footnote keeps the bottom, and the
  // rhythm in between is even. A pure function of props and canvas.
  const shelfBottom = regionTop + nRows * rowH;
  const slack = Math.max(0, footerTop - m - (shelfBottom - m));
  const spread = (label: string): number => {
    if (label.startsWith("tile-")) return Math.floor(slack / 4);
    if (label.startsWith("goal-") || label === "pace-tick" || label === "day-of-year") return Math.floor(slack / 2);
    if (label.startsWith("shelf-")) return Math.floor((3 * slack) / 4);
    return 0;
  };
  if (slack > 0) {
    for (const c of cells) c.rect.y += spread(c.label);
    for (const t of tiles) t.rect.y += spread(t.label);
  }

  return { p, theme, m, CW, gap, floor, small, cells, tiles, barRect: frame, fillW, tickX, headerBottom, footerTop, slack };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 22,
  "date": "2026-10-11",
  "agent": "opencode",
  "model": "kimi-k3",
  "id": "@one-a-day/personal/reading-goal-recap/v1",
  "title": "Reading Goal Recap",
  "who": "Book bloggers and the 52book reading-challenge crowd who post monthly wrap-ups and track the Goodreads Reading Challenge (books read vs yearly goal) by hand",
  "problem": [
    "The monthly wrap-up is a fixed ritual on book blogs - Leah's Books has run one every month since December 2020 - and its numbers are tabulated by hand every time: \"Books read: 43 ... Pages read: 9,130 ... Average pages: 338.1 ... Days per book: 2.63 ... Pages read per day: 125.33\".",
    "The challenge line is the one nobody enjoys: Kami's Library Thoughts keeps a hand star table and writes \"Goodreads Challenge - I am 16 books behind schedule. (88/125)\". A whole tool (booksense) turns the export into monthly charts \"ready to screenshot\" - Goodreads itself gives one summary, in December.",
  ],
  "sources": [
    "https://leahs-books.com/2022/11/05/monthly-wrap-up-october-2022/",
    "http://kamislibrarythoughts.blogspot.com/2022/11/october-stats.html",
    "https://booksense.app/tools/goodreads-stats",
  ],
  "solution": [
    "Give the month's numbers - books, pages, average rating, the shelf titles - plus the year goal, the books so far and the day of the year. One deterministic render returns the wrap-up card: three stat tiles, the goal bar, and the shelf.",
    "The one decision: the pace line is computed, never typed. The bar fill is booksSoFar/goalTotal, the tick sits at pace = goal x dayOfYear / 365, and the delta line (\"3 ahead of pace - 88% of goal\") falls out of both. dayOfYear is a prop, so the card is deterministic and cannot disagree with itself.",
  ],
  "usage": {
    "command": "m0saic make @one-a-day/personal/reading-goal-recap/v1 --template-repo . -w 1920 -h 1080 -o recap.png",
    "try": [
      "goalTotal, booksSoFar and dayOfYear drive the bar, the pace tick and the delta line - all three are computed",
      "titles takes up to 12 { title, rating } entries (ratings in half steps); the first 6 render",
      "booksSoFar past goalTotal is allowed: the bar clamps at full and the delta tells how far past",
      "preset \"light\" is the paper card; accent recolours the bar fill and an ahead-of-pace delta",
    ],
  },
  "caveats": [
    "No covers: the export has no images and nothing downloads into the repo, so the shelf is title and rating text only.",
    "No genre table: the Goodreads export has no genre column (booksense says the same of its own charts) - the card sticks to counts, pages, ratings and pace.",
    "The default month (@leah_reads, October 2026, 46 of 52) is invented, as the schema says; every number on it is consistent.",
  ],
  "timeline": {
    "source": "self-reported",
    "phases": [
      { "name": "scout", "startMs": 0, "durMs": 1560000, "tools": "WebSearch 4, Bash 11, Write 2" },
      { "name": "plan", "startMs": 1560000, "durMs": 720000, "tools": "Read 4, Write 2" },
      { "name": "build", "startMs": 2280000, "durMs": 5400000, "tools": "Bash 10, Edit 6, Read 5, Write 3" },
      { "name": "critique", "startMs": 7680000, "durMs": 900000, "tools": "Read 6, Bash 2, Write 1" },
      { "name": "ship", "startMs": 8580000, "durMs": 1200000, "tools": "Bash 4, Edit 2, Write 2" }
    ],
  },
};

export const ReadingGoalRecapV1 = defineMosaicTemplate<ReadingGoalRecapProps>({
  id: asTemplateId(ID),
  label: "2026-10-11 · Reading Goal Recap",
  version: 1,
  description: "A monthly reading wrap-up card from the Goodreads export's own numbers: books, pages and average rating as stat tiles, the year's challenge goal as a progress bar with the pace tick drawn - the '16 behind schedule (88/125)' line, computed, not typed.",
  capabilities: { tier: "core" },
  tags: ["personal", "2026-10-11", "day-022", "reading", "books", "wrap-up", "goodreads", "challenge", "monthly"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG. The same sections stack on landscape, square and portrait; the shelf renders the first six titles. Minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default ReadingGoalRecapV1;

async function render(props: ReadingGoalRecapProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutReadingCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  // Emitted in paint order: tiles (stat tiles, bar frame, fill, tick), then text.
  for (const t of L.tiles) {
    const tile = tag(makeColorTile(t.color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } }) as MosaicSource, t.label);
    pieces.push({ rect: { ...t.rect, importance: 1 }, source: t.bind === "accent" ? bindProp(tile, "accent") : tile });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, vAlign: "middle", label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; derived text (the delta line, the captions) stays unbound.
    const source = c.bind === null ? cell : c.bind === "accent" ? bindProp(cell, "accent") : typeof c.bind.key === "number" ? bindPropPath(cell, "titles", [c.bind.key, c.field?.endsWith("rating") ? "rating" : "title"], c.field?.endsWith("rating") ? "number" : "string") : bindProp(cell, c.bind.prop);
    pieces.push({ rect: { ...c.rect, importance: 3 }, source });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises, against the labels: the header is the top
  // band, the tiles one row of one size, the goal bar full-width in the
  // middle band with its pace tick present, the shelf below it, the footnote
  // in the bottom band. Every text fits its box (measured, above).
  constraints.push({ label: "month", within: { yFrac: [0, 0.36] } });
  constraints.push({ label: "goal-bar", within: { yFrac: [0.2, 0.8] }, minWidthFrac: 0.9 });
  constraints.push({ label: "pace-tick", within: { yFrac: [0.2, 0.82] } });
  constraints.push({ label: "shelf-caption", within: { yFrac: [0.35, 0.95] } });
  constraints.push({ label: "footnote", within: { yFrac: [0.85, 1] } });
  const relations: RelationalConstraint[] = [];

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
