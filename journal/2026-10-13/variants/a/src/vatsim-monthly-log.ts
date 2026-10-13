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
 * `@one-a-day/gaming/vatsim-monthly-log/v1` - a virtual-airline pilot's month
 * as one card: the pilot and the month up top, four computed stat tiles, the
 * month's PIREPs as an operations log table (date, flight, sector, type,
 * block, vertical speed, score), and a career-milestone bar under it.
 *
 * ONE CONCEPT: nothing is typed twice. Every number the wrap-up post carries
 * - flight count, month hours, the longest flight, the average touchdown -
 * is COMPUTED from the log rows, and the milestone bar from the rows plus
 * last month's career figure. The card cannot disagree with itself: the
 * "13 flights, 32.7 h" line nobody can be bothered to re-add by hand is the
 * one thing this template refuses to be given.
 *
 * The rule that bites: the grammar is the gate. A row is exactly seven
 * fields - "01 Sep | UA332 | KIAH-MMGL | A319 | 07:42 | -182 | 100" - and a
 * bad or missing field, a block past 15:59, or an eleventh row is refused BY
 * NAME at render, never clipped. All table cells (heads and rows) share one
 * size per canvas; sizes are fractions of the canvas with no pixel floor, so
 * a 480x270 render is a thumbnail of the 1920x1080 one, not a different card.
 */

export type VatsimLogRow = {
  day: number;
  mon: string;
  flight: string;
  dep: string;
  arr: string;
  type: string;
  hours: number;
  minutes: number;
  /** fpm at touchdown, or null when the row carries "--". */
  vs: number | null;
  /** PIREP score 0-100, or null when the row carries "--". */
  score: number | null;
};

export type VatsimMonthlyLogProps = {
  /** The pilot line: name and rating, free text. */
  pilot?: string;
  /** The virtual airline and pilot ID, under the pilot. "" removes it. */
  airline?: string;
  /** The month this log covers, free text ("September 2026"). */
  month?: string;
  /** The month's PIREPs, 1-10 lines "DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score". */
  rows?: string[];
  /** Career hours BEFORE this month - the milestone bar adds the month's computed hours to it. */
  careerHours?: number;
  /** The bottom line, a credit. "" removes it. */
  footer?: string;
  /** The month word, the head rule, the milestone fill and its caption. */
  accent?: string;
  /** Page and ink. */
  preset?: "dark" | "light";
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/gaming/vatsim-monthly-log/v1";
const DEFAULT_ACCENT = "#37c4a6";
const THEMES = {
  dark: { bg: "#12181d", row: "#1b242c", ink: "#e9eef2", dim: "#8fa0ad" },
  light: { bg: "#f3f1ea", row: "#fffdf8", ink: "#17202a", dim: "#5f6b76" },
} as const;

// An invented September for an invented virtual airline, in the phpVMS log
// shape: the 7:42 KIAH-MMGL is the long-haul of the month; two rows carry
// "--" for score to show the placeholder the card keeps out of the average.
const DEFAULT_ROWS = [
  "01 Sep | UA332 | KIAH-MMGL | A319 | 07:42 | -182 | 100",
  "02 Sep | DL620 | MMUN-KJFK | A319 | 03:49 | -194 | 100",
  "05 Sep | LH230 | EDDF-LIRF | A319 | 01:58 | -114 | 100",
  "08 Sep | KL1358 | LKPR-EHAM | A321 | 01:35 | -38 | 100",
  "11 Sep | DL46 | KJFK-EHAM | A359 | 06:38 | -149 | 98",
  "15 Sep | BA1393 | EGAC-EGLL | A346 | 01:09 | -266 | --",
  "18 Sep | UA275 | KABQ-KIAH | A319 | 02:02 | -222 | 100",
  "21 Sep | QF12 | YSSY-NZAA | A320 | 03:22 | -449 | --",
  "25 Sep | EK502 | OMDK-OMDB | A321 | 00:52 | -781 | 80",
  "28 Sep | SK1232 | ESGG-EHAM | A321 | 01:34 | -239 | 100",
];

const DEFAULTS = {
  pilot: "Orest R - First Officer",
  airline: "Delta Virtual - pilot ID DAL0013",
  month: "September 2026",
  rows: DEFAULT_ROWS,
  careerHours: 415,
  footer: "Totals and the milestone bar are computed from the rows. Pilot, airline and every PIREP are invented.",
  accent: DEFAULT_ACCENT,
  preset: "dark" as "dark" | "light",
  debugLayout: false,
};

const propsSchema = definePropsSchema<VatsimMonthlyLogProps>({
  rows: {
    type: "json",
    required: false,
    description:
      'The month\'s PIREPs in date order, 1 to 10 lines, each "DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score": Mon from Jan..Dec, FLIGHT 1-12 chars A-Z 0-9 / ., DEP and ARR 3-4 alphanumerics, TYPE 2-5, block H:MM (H 0-15), vs the touchdown rate in fpm (negative, or "--"), score 0-100 (or "--"). The tiles and the milestone bar are computed from these rows - never typed.',
    meta: {
      constraints: { jsonSchema: { type: "array", minItems: 1, maxItems: 10, items: { type: "string" } } },
      ui: { label: "PIREP rows", order: 1, primary: true },
    },
  },
  pilot: {
    type: "string",
    required: false,
    description: 'The pilot line: name and rating, free text up to 40 characters ("Orest R - First Officer"). The sample pilot is invented.',
    meta: { control: { placeholder: DEFAULTS.pilot }, ui: { label: "Pilot", order: 2 } },
  },
  airline: {
    type: "string",
    required: false,
    description: "The virtual airline and pilot ID, the dim line under the pilot, up to 48 characters. Empty removes it.",
    meta: { control: { placeholder: DEFAULTS.airline }, ui: { label: "Airline", order: 3 } },
  },
  month: {
    type: "string",
    required: false,
    description: 'The month the log covers, free text up to 24 characters ("September 2026") - the accent word right of the header.',
    meta: { control: { placeholder: DEFAULTS.month }, ui: { label: "Month", order: 4 } },
  },
  careerHours: {
    type: "number",
    required: false,
    description: "Career hours BEFORE this month, 0 to 9999. The card adds the month's computed hours; the bar counts to the next hundred.",
    meta: { constraints: { min: 0, max: 9999 }, ui: { label: "Career hours (prior)", order: 5 } },
  },
  footer: {
    type: "string",
    required: false,
    description: "The bottom line, up to 120 characters: a credit, a Discord handle. Empty removes it.",
    meta: { control: { placeholder: DEFAULTS.footer }, ui: { label: "Footer", order: 6 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The month word, the head rule, the milestone fill and its numbers, as #rrggbb.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 7 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "dark" (default) or "light" - the ops-sheet paper.',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 8 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the tiles are one size, the heads sit over their columns, the footnote is in the bottom band) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the log: pure, exported, and what the test asserts ── */

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

/** One PIREP line, "DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score". */
export function parseVatsimLogRow(raw: unknown, index: number): VatsimLogRow {
  const at = `rows[${index}] (line ${index + 1})`;
  const line = text(raw, at, 90);
  const f = line.split("|").map((s) => s.trim());
  if (f.length !== 7) fail(at, `has ${f.length} fields between "|"; a PIREP line is "DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score" (7 fields).`);
  const dm = /^(\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.exec(f[0]);
  if (!dm || Number(dm[1]) < 1 || Number(dm[1]) > 31) fail(at, `date ${JSON.stringify(f[0])} must be "DD Mon" with a day 01-31 and Mon from Jan..Dec.`);
  if (!/^[A-Z0-9][A-Z0-9/.]{0,11}$/.test(f[1])) fail(at, `flight ${JSON.stringify(f[1])} must be 1 to 12 characters from A-Z, 0-9, "." and "/", starting alphanumeric.`);
  const sector = /^([A-Z0-9]{3,4})-([A-Z0-9]{3,4})$/.exec(f[2]);
  if (!sector) fail(at, `sector ${JSON.stringify(f[2])} must be "DEP-ARR", each 3 or 4 characters of A-Z 0-9.`);
  if (!/^[A-Z0-9]{2,5}$/.test(f[3])) fail(at, `type ${JSON.stringify(f[3])} must be 2 to 5 characters of A-Z 0-9 (a ICAO type code: A319, B738).`);
  const block = /^(\d{1,2}):([0-5]\d)$/.exec(f[4]);
  if (!block || Number(block[1]) > 15) fail(at, `block ${JSON.stringify(f[4])} must be "H:MM" with H 0-15 and MM 00-59.`);
  let vs: number | null;
  if (f[5] === "--") vs = null;
  else {
    if (!/^-\d{1,4}$/.test(f[5])) fail(at, `touchdown rate ${JSON.stringify(f[5])} must be negative fpm (e.g. -267) or "--".`);
    vs = Number(f[5]);
    if (vs < -2000) fail(at, `touchdown rate ${vs} fpm is below -2000; the card takes -2000 to -1, or "--".`);
  }
  let score: number | null;
  if (f[6] === "--") score = null;
  else {
    if (!/^(100|[1-9]?\d|0)$/.test(f[6])) fail(at, `score ${JSON.stringify(f[6])} must be 0 to 100 or "--".`);
    score = Number(f[6]);
  }
  return { day: Number(dm[1]), mon: dm[2], flight: f[1], dep: sector[1], arr: sector[2], type: f[3], hours: Number(block[1]), minutes: Number(block[2]), vs, score };
}

export type VatsimLog = ReturnType<typeof normalizeVatsimLog>;

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeVatsimLog(props: VatsimMonthlyLogProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const pilot = text(p.pilot, "pilot", 40);
  if (pilot === "") fail("pilot", "is the header's first line; give it a name.");
  const airline = text(p.airline, "airline", 48);
  const month = text(p.month, "month", 24);
  if (month === "") fail("month", "is empty; the card is a month of a log - name it.");
  const footer = text(p.footer, "footer", 120);
  if (p.preset !== "dark" && p.preset !== "light") fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
  if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim())) fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
  if (typeof p.careerHours !== "number" || !Number.isInteger(p.careerHours)) fail("careerHours", `${JSON.stringify(p.careerHours)} must be a whole number of hours.`);
  if (p.careerHours < 0 || p.careerHours > 9999) fail("careerHours", `${p.careerHours} is outside 0 to 9999.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");
  if (!Array.isArray(p.rows)) fail("rows", 'must be a list of PIREP lines ("DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score").');
  if (p.rows.length < 1) fail("rows", "is empty; a month with no flights is not a log.");
  if (p.rows.length > 10) fail("rows", `has ${p.rows.length} lines; the card logs up to 10 PIREPs - a busier month goes on a second card.`);
  const rows = p.rows.map((r, i) => parseVatsimLogRow(r, i));

  const minutesTotal = rows.reduce((s, r) => s + r.hours * 60 + r.minutes, 0);
  const longest = rows.reduce((m, r) => (r.hours * 60 + r.minutes > m.hours * 60 + m.minutes ? r : m), rows[0]);
  const vsValues = rows.map((r) => r.vs).filter((v): v is number => v !== null);
  const avgVs = vsValues.length ? Math.round(vsValues.reduce((s, v) => s + v, 0) / vsValues.length) : null;
  const hours = minutesTotal / 60;
  const careerTotal = p.careerHours + hours;
  const nextMilestone = 100 * (Math.floor(careerTotal / 100) + 1);
  const toGo = nextMilestone - careerTotal;
  const fillFrac = Math.max(0, Math.min(1, (careerTotal - (nextMilestone - 100)) / 100));
  const pad2 = (n: number) => String(n).padStart(2, "0");

  return {
    pilot, airline, month, footer, rows,
    monthUpper: month.toUpperCase(),
    flightsText: String(rows.length),
    hoursText: hours.toFixed(1),
    longestText: `${longest.hours}:${pad2(longest.minutes)}`,
    longestSector: `${longest.dep}-${longest.arr}`,
    avgVsText: avgVs === null ? "--" : String(avgVs),
    careerText: careerTotal.toFixed(1),
    milestoneText: String(nextMilestone),
    toGoText: toGo.toFixed(1),
    fillFrac,
    /** Row cells, formatted exactly as the table draws them - the test compares against these. */
    cells: rows.map((r) => ({
      date: `${pad2(r.day)} ${r.mon}`,
      flight: r.flight,
      sector: `${r.dep}-${r.arr}`,
      type: r.type,
      block: `${r.hours}:${pad2(r.minutes)}`,
      vs: r.vs === null ? "--" : String(r.vs),
      score: r.score === null ? "--" : String(r.score),
    })),
    careerHours: p.careerHours as number,
    accent: p.accent.trim().toLowerCase() as MosaicColor,
    preset: p.preset as "dark" | "light",
    debugLayout: p.debugLayout,
  };
}

/* ── geometry ── */

export type VatsimRect = { x: number; y: number; w: number; h: number };
type Bind = { prop: string; row?: number } | "accent" | null;
type Cell = { label: string; rect: VatsimRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind };
type Tile = { label: string; rect: VatsimRect; color: MosaicColor; radius: number; bind: "accent" | null };

/** The largest whole size up to `maxPx` at which one line fits the cell's budget (`cell * 0.94 - 2px`). */
function fitPx(line: string, cellW: number, maxPx: number, bold: boolean): number {
  const top = Math.max(1, Math.round(maxPx));
  const room = budget(cellW), w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}

/** The log table's columns, as fractions of the content width: label, width, alignment. */
const COLUMNS: Array<{ key: "date" | "flight" | "sector" | "type" | "block" | "vs" | "score"; head: string; frac: number; align: "left" | "right" | "center" }> = [
  { key: "date", head: "DATE", frac: 0.135, align: "left" },
  { key: "flight", head: "FLIGHT", frac: 0.185, align: "left" },
  { key: "sector", head: "SECTOR", frac: 0.17, align: "left" },
  { key: "type", head: "TYPE", frac: 0.1, align: "center" },
  { key: "block", head: "BLOCK", frac: 0.11, align: "right" },
  { key: "vs", head: "V/S", frac: 0.11, align: "right" },
  { key: "score", head: "SCORE", frac: 0.07, align: "right" },
];

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutVatsimLogCard(props: VatsimMonthlyLogProps, W: number, H: number) {
  const p = normalizeVatsimLog(props);
  const theme = THEMES[p.preset];
  const ink = theme.ink as MosaicColor, dim = theme.dim as MosaicColor;
  const S = Math.min(W, H);
  const m = Math.round(S * 0.05), CW = W - 2 * m;
  const gap = Math.round(S * 0.016);
  const floor = Math.max(6, Math.round(S * 0.017)), small = Math.max(5, Math.round(S * 0.013));
  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const unfit = (field: string): never => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
  const line = (label: string, rect: VatsimRect, value: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; field?: string; floorPx?: number } = {}) => {
    if (px < (o.floorPx ?? floor)) unfit(o.field ?? label);
    cells.push({ label, rect, text: value, px, width: widthOf(value, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? ink, bind: o.bind ?? null });
  };
  const snugW = (t: string, px: number, bold: boolean) => Math.ceil((widthOf(t, px, bold) + 2) / 0.94);

  /* ── header: pilot left, the month right in accent; the airline dim under the pilot ── */
  let y = m;
  const monthPx = fitPx(p.monthUpper, CW * 0.42, S * 0.048, true);
  if (monthPx < small) unfit("month");
  const monthW = snugW(p.monthUpper, monthPx, true);
  const headH = Math.round(S * 0.062);
  const pilotPx = fitPx(p.pilot, CW - monthW - Math.round(gap), S * 0.052, true);
  if (pilotPx < small) unfit("pilot");
  line("pilot", { x: m, y, w: CW - monthW - Math.round(gap), h: headH }, p.pilot, pilotPx, { bold: true, bind: { prop: "pilot" }, field: "pilot" });
  line("month", { x: W - m - monthW, y, w: monthW, h: headH }, p.monthUpper, monthPx, { bold: true, align: "right", color: p.accent, bind: { prop: "month" }, field: "month" });
  y += headH;
  const subH = Math.round(S * 0.04);
  if (p.airline !== "") {
    const subPx = fitPx(p.airline, CW, S * 0.028, false);
    if (subPx < small) unfit("airline");
    line("airline", { x: m, y, w: CW, h: subH }, p.airline, subPx, { color: dim, bind: { prop: "airline" }, floorPx: small, field: "airline" });
    y += subH;
  }
  const ruleH = Math.max(2, Math.round(S * 0.005));
  const ruleY = y + Math.round(S * 0.012);
  y = ruleY + ruleH;

  /* ── the four computed stat tiles, one row, one size ── */
  const tilesY = y + Math.round(S * 0.03);
  const tileH = Math.round(S * 0.15);
  const tileGap = Math.round(S * 0.02);
  const tileW = Math.floor((CW - 3 * tileGap) / 4);
  const STATS = [
    { value: p.flightsText, label: "flights this month", field: "the flight count" },
    { value: p.hoursText, label: "hours flown", field: "the month hours" },
    { value: p.longestText, label: `longest ${p.longestSector}`, field: "the longest flight" },
    { value: p.avgVsText, label: "avg touchdown fpm", field: "the touchdown average" },
  ];
  STATS.forEach((st, i) => {
    const rect: VatsimRect = { x: m + i * (tileW + tileGap), y: tilesY, w: tileW, h: tileH };
    tiles.push({ label: `tile-${i}`, rect, color: theme.row as MosaicColor, radius: 0.06, bind: null });
    const valuePx = fitPx(st.value, tileW * 0.88, tileH * 0.4, true);
    line(`tile-value-${i}`, { x: rect.x, y: rect.y + Math.round(tileH * 0.1), w: tileW, h: Math.round(valuePx * 1.25) }, st.value, valuePx, { bold: true, align: "center", field: st.field });
    const labelPx = fitPx(st.label, tileW * 0.88, tileH * 0.18, false);
    const labelH = Math.round(labelPx * 1.35);
    line(`tile-label-${i}`, { x: rect.x, y: rect.y + tileH - Math.round(tileH * 0.1) - labelH, w: tileW, h: labelH }, st.label, labelPx, { color: dim, align: "center", floorPx: small, field: st.field });
  });

  /* ── the log table: caption, column heads, up to ten rows, all cells one size ── */
  const capY = tilesY + tileH + Math.round(S * 0.034);
  const capPx = fitPx("FLIGHT OPERATIONS LOG", CW * 0.5, S * 0.026, false);
  line("log-caption", { x: m, y: capY, w: snugW("FLIGHT OPERATIONS LOG", capPx, false), h: Math.round(capPx * 1.35) }, "FLIGHT OPERATIONS LOG", capPx, { color: dim, floorPx: small });

  const tableTop = capY + Math.round(capPx * 1.35) + Math.round(gap * 0.5);
  // The milestone block sits above the footer; the row band ends under its
  // caption, so no row can ever slide beneath the bar (day-024 variant a
  // still caught the caption over row 10 until the band was derived from it).
  const barH = Math.round(S * 0.032);
  const msBottom = H - m - Math.round(S * 0.05);
  const barY = msBottom - barH;
  const msCapH = Math.round(S * 0.032);
  const capTop = barY - Math.round(S * 0.01) - msCapH;
  const bandBottom = capTop - Math.round(S * 0.008);
  const headBandH = Math.round(S * 0.03);
  const rowsTop = tableTop + headBandH + Math.round(S * 0.008);
  const rowGap = Math.max(1, Math.round(S * 0.004));
  const pitch = Math.max(2, Math.floor((bandBottom - rowsTop) / p.rows.length));
  const cellH = Math.max(2, Math.min(pitch - rowGap, Math.round(S * 0.05)));
  const colX = COLUMNS.reduce<number[]>((acc, _c, i) => { acc.push(i === 0 ? m : acc[i - 1] + Math.round(COLUMNS[i - 1].frac * CW)); return acc; }, []);
  const colW = COLUMNS.map((c) => Math.round(c.frac * CW));

  // The shared size: the cap, but no larger than the smallest fit over every
  // head and every row cell - one size for the whole table, columns aligned.
  const tableCap = Math.round(cellH * 0.62);
  let rowPx = tableCap;
  for (const [i, c] of COLUMNS.entries()) {
    rowPx = Math.min(rowPx, fitPx(c.head, colW[i], tableCap, false));
    for (const r of p.cells) rowPx = Math.min(rowPx, fitPx(r[c.key], colW[i], tableCap, i === 1));
  }
  if (rowPx < small) unfit(`the ${COLUMNS.length}-column log`);
  COLUMNS.forEach((c, i) => {
    // One size for the whole table, heads included: `rowPx` already took the
    // tightest fit over every head and every row cell.
    line(`head-${c.key}`, { x: colX[i], y: tableTop, w: colW[i], h: headBandH }, c.head, rowPx, { color: dim, align: c.align, floorPx: small });
  });
  p.cells.forEach((r, i) => {
    const tileRect: VatsimRect = { x: m, y: rowsTop + i * pitch + Math.floor((pitch - cellH) / 2), w: CW, h: cellH };
    if (tileRect.y + cellH > bandBottom) unfit("the log rows");
    tiles.push({ label: `row-${i}`, rect: tileRect, color: theme.row as MosaicColor, radius: 0.04, bind: null });
    COLUMNS.forEach((c, k) => {
      line(`row-${i}-${c.key}`, { x: colX[k], y: tileRect.y, w: colW[k], h: cellH }, r[c.key], rowPx, {
        bold: c.key === "flight",
        align: c.align,
        color: c.key === "vs" || c.key === "score" ? dim : ink,
        bind: { prop: "rows", row: i },
        field: `rows[${i}] ${c.key}`,
        floorPx: small,
      });
    });
  });

  /* ── the milestone bar, pinned between the row band and the footer ── */
  const msCapPx = Math.min(msCapH, fitPx(`CAREER ${p.careerText} h`, CW * 0.45, S * 0.024, false));
  line("milestone-caption", { x: m, y: capTop, w: snugW(`CAREER ${p.careerText} h`, msCapPx, false), h: msCapH }, `CAREER ${p.careerText} h`, msCapPx, { color: dim, floorPx: small });
  const goText = `${p.toGoText} h to ${p.milestoneText} h`;
  const goPx = Math.min(msCapPx, fitPx(goText, CW * 0.45, S * 0.024, true));
  line("milestone-togo", { x: W - m - snugW(goText, goPx, true), y: capTop, w: snugW(goText, goPx, true), h: msCapH }, goText, goPx, { bold: true, align: "right", color: p.accent, floorPx: small });
  const frame: VatsimRect = { x: m, y: barY, w: CW, h: barH };
  tiles.push({ label: "milestone-bar", rect: frame, color: theme.row as MosaicColor, radius: 0.5, bind: null });
  const fillW = Math.round(CW * p.fillFrac);
  if (fillW > 0) tiles.push({ label: "milestone-fill", rect: { x: m, y: barY, w: fillW, h: barH }, color: p.accent, radius: 0.5, bind: "accent" });

  /* ── footer, bottom band ── */
  if (p.footer !== "") {
    const footPx = fitPx(p.footer, CW, S * 0.022, false);
    if (footPx < small) unfit("footer");
    const footH = Math.round(footPx * 1.35);
    line("footer", { x: m, y: H - m - footH, w: CW, h: footH }, p.footer, footPx, { color: dim, bind: { prop: "footer" }, floorPx: small, field: "footer" });
  }

  return { p, theme, ink, dim, m, CW, gap, floor, small, cells, tiles, ruleY, ruleH, tilesY, tileW, tileH, tableTop, headBandH, cellH, pitch, bandBottom, capTop, barY, msCapH, barH, fillW, colW };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 24,
  "date": "2026-10-13",
  "agent": "opencode",
  "model": "qwen3.8-flash",
  "id": "@one-a-day/gaming/vatsim-monthly-log/v1",
  "title": "VATSIM Monthly Log",
  "who": "VATSIM pilots flying a phpVMS virtual airline (stats.vatsim.net, VA profile sites, the network forum and Discord) who post their month's hours into group chats",
  "problem": [
    "Hours are the currency: a VATSIM forum thread is a whole argument about pilots idling on the ground \"to increase the number of flight hours\", with supervisors hunting them. A group post asks \"What's everyone's flying hours on vatsim? Mine 611hours\"; replies announce milestones (\"Just reaching 5000 hours\").",
    "The month already exists as rows: a phpVMS pilot profile shows the \"FLIGHT OPERATIONS LOG\" table (DL2155, ELLX to EBBR, A319, 00h 46m, -518 FPM) plus hour badges. But the log's only share affordance is EXPORT PDF, and the official stats site sits behind a login, so the month-end wrap is a text paste.",
  ],
  "sources": [
    "https://deltavirtual.org/users/13",
    "https://forum.vatsim.net/t/hours-on-the-ground/4768",
    "https://stats.vatsim.net/",
    "https://aviodeck.app/features/vatsim-pilots",
    "https://www.reddit.com/r/VATSIM/comments/1pazqke/vatsim_pilot_hours_statistics",
    "https://www.facebook.com/groups/608473926761307/posts/1976861463255873"
  ],
  "solution": [
    "Give the month's PIREPs as lines in the log's own grammar (date, flight, sector, type, block, touchdown fpm, score) and get one card: the pilot and the month, four stat tiles, the operations log table, and a career-milestone bar. The sample month is invented.",
    "The one decision: nothing is typed twice. Flights, hours, longest and average touchdown are computed from the rows, and the bar adds the month's computed hours to last month's career figure - nobody recomputes \"58.9 h to 500\" by hand any more. An eleventh row is refused by name, never clipped."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/gaming/vatsim-monthly-log/v1 --template-repo . -w 1920 -h 1080 -o journal/2026-10-13/vatsim-monthly-log.png",
    "try": [
      "rows: \"DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score\"; \"--\" keeps a column empty",
      "careerHours is last month's figure: the card adds the month and counts to the next hundred",
      "preset \"light\" prints the ops-sheet paper; accent recolours the month word, the rule and the bar fill",
      "-w 1080 -h 1920 for the Discord phone view: same card, rows breathe"
    ]
  },
  "caveats": [
    "No import: phpVMS and stats.vatsim.net expose no open export an agent could fetch here, so rows are typed or pasted from the log table you can already see.",
    "Ten rows is the card: a busy month splits into two cards (or the 13-flights-September pilot prints their top 10 by block time, by hand, before typing).",
    "Distance flown is not on the card: the PIREP rows carry block time and fpm, not nautical miles; the VA dashboard has the miles."
  ],
  "timeline": {
    "source": "self-reported",
    "phases": [
      { "name": "scout", "startMs": 0, "durMs": 1500000, "tools": "WebSearch 8, Bash 12, Write 2" },
      { "name": "plan", "startMs": 1500000, "durMs": 600000, "tools": "Read 4, Write 1" },
      { "name": "build", "startMs": 2100000, "durMs": 4800000, "tools": "Bash 12, Edit 8, Read 6, Write 2" },
      { "name": "critique", "startMs": 6900000, "durMs": 900000, "tools": "Read 7, Write 1" },
      { "name": "ship", "startMs": 7800000, "durMs": 1500000, "tools": "Bash 6, Edit 2, Write 1" }
    ]
  }
};

/** Props with no rect to bind, and why (m0saic doctor's `bindingsDeclared`; the template type this repo builds against predates the field, so it is spread in). */
const UNBOUND = {
  bindings: {
    unbound: {
      careerHours: "summand: the milestone bar and its caption show careerHours PLUS the month's computed hours; no rect shows the raw figure, and binding it would let a double-click print a number that contradicts the bar",
    },
  },
};

export const VatsimMonthlyLogV1 = defineMosaicTemplate<VatsimMonthlyLogProps>({
  id: asTemplateId(ID),
  label: "2026-10-13 · VATSIM Monthly Log",
  version: 1,
  description: "A virtual airline's month as one ops-log card from the PIREP rows themselves: the pilot and month, four tiles, the dated table (date, flight, sector, type, block, fpm, score) and a career-milestone bar - flights, hours, longest and average all computed from the rows, nothing typed twice.",
  capabilities: { tier: "core" },
  ...UNBOUND,
  tags: ["gaming", "2026-10-13", "day-024", "vatsim", "logbook", "pirep", "flight-hours", "virtual-airline", "monthly"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG. Up to 10 PIREP rows; the table's one shared cell size comes down with the canvas, so 480x270 is a thumbnail of the 1920x1080 card. Landscape, square and portrait stack the same sections.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default VatsimMonthlyLogV1;

async function render(props: VatsimMonthlyLogProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutVatsimLogCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  // Tiles first, then text: placeInsetPieces puts a rect on the first overlay
  // layer it does not collide with, so the row cells share one layer and the
  // copy another.
  for (const t of L.tiles) {
    const tile = tag(makeColorTile(t.color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } }) as MosaicSource, t.label);
    pieces.push({ rect: { ...t.rect, importance: 1 }, source: t.bind === "accent" ? bindProp(tile, "accent") : tile });
  }
  // The head rule paints with the accent, so its rect is bound to the prop.
  const rule = tag(makeColorTile(L.p.accent) as MosaicSource, "head-rule");
  pieces.push({ rect: { x: L.m, y: L.ruleY, w: L.CW, h: L.ruleH, importance: 1 }, source: bindProp(rule, "accent") });

  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, vAlign: "middle", label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; a row cell is bound to its line in `rows`.
    pieces.push({ rect: { ...c.rect, importance: 3 }, source: c.bind === null ? cell : c.bind === "accent" ? bindProp(cell, "accent") : c.bind.row !== undefined ? bindPropPath(cell, "rows", [c.bind.row], "string") : bindProp(cell, c.bind.prop) });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises, against the labels: every text fits its box
  // (above); the header band is the top fifth; the head rule spans the card;
  // the four tiles are one row of one size; every log row keeps its cell
  // inside the table band and all row cells are the same size; the milestone
  // bar is full-width under the band; the footnote lives in the bottom band.
  constraints.push({ label: "pilot", within: { yFrac: [0, 0.2] } });
  constraints.push({ label: "month", within: { yFrac: [0, 0.2] } });
  if (L.p.airline !== "") constraints.push({ label: "airline", within: { yFrac: [0, 0.25] } });
  constraints.push({ label: "head-rule", minWidthFrac: 0.88 });
  constraints.push({ label: "tile-0", within: { yFrac: [0.08, 0.42] } });
  constraints.push({ label: "tile-3", within: { yFrac: [0.08, 0.42] } });
  COLUMNS.forEach((c) => constraints.push({ label: `head-${c.key}`, within: { yFrac: [0.18, 0.6] } }));
  const rowTiles = L.p.rows.map((_r, i) => `row-${i}`);
  rowTiles.forEach((label) => constraints.push({ label, within: { yFrac: [0.2, 0.95] }, minWidthFrac: 0.6 }));
  constraints.push({ label: "milestone-bar", within: { yFrac: [0.55, 1] }, minWidthFrac: 0.85 });
  if (L.p.footer !== "") constraints.push({ label: "footer", within: { yFrac: [0.85, 1] } });
  const relations: RelationalConstraint[] = [
    { label: ["tile-0", "tile-1", "tile-2", "tile-3"], equal: "size", tolerancePx: 2 },
    ...(rowTiles.length > 1 ? [{ label: rowTiles, equal: "size", tolerancePx: 2 } satisfies RelationalConstraint] : []),
  ];

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
