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
 * `@one-a-day/music/radio-top-30-chart/v1` - a radio station's weekly chart
 * as one card: the station, a computed `TOP 30`, the week, and every row as
 * rank / artist / title / label, from the lines a music director already
 * types (`Artist | Title | Label | last week`).
 *
 * ONE CONCEPT: the fit rule is the template. A row is two lines (the artist,
 * bold; then the title with the label after it in dimmer ink), every row cell
 * is the same size, and thirty rows share one artist size and one title size
 * so the columns read as columns. Long copy goes down a ladder, in this
 * order:
 *   1. the shared sizes come down together, by at most 15%, for every line
 *      that can be fitted inside that allowance;
 *   2. a line that needs more shrinks ALONE, to no less than half its cap,
 *      and costs the other rows nothing;
 *   3. past that the render refuses, naming the row and the canvas. No
 *      ellipsis, no clipping, no dropped label.
 * The grid follows the aspect: up to 10 rows a column on a wide canvas
 * (3 x 10), up to 15 on a square or portrait one (2 x 15); ranks read down a
 * column, then the next.
 *
 * The rule that bites: nothing here is typed twice. The rank is the position
 * in the list, the count in the title is the number of rows, and the marker
 * under a rank is last week's rank minus this week's (`+3`, `-2`, `=`, `NEW`,
 * `RE`), as text: the bundled font has no arrows, and up is the accent, down
 * is dim ink, never red or green. Sizes are fractions of the canvas with no
 * pixel floor, so a 480x270 render is a thumbnail of the 1920x1080 one, not a
 * different card.
 */

export type RadioTop30ChartProps = {
  /** The header mark: call sign and frequency, free text. */
  station?: string;
  /** The line under the station. "" removes it. */
  weekOf?: string;
  /** Prefix of the chart title: "Loud Rock" gives LOUD ROCK TOP 10. "" gives TOP 30. */
  genre?: string;
  /** The chart, in rank order: 1-30 lines of "Artist | Title | Label" or "Artist | Title | Label | LW". */
  rows?: string[];
  /** The bottom line: a URL, a credit. "" removes the line. */
  footer?: string;
  /** Rank numerals, the chart title, up / NEW / RE markers, as #rrggbb. */
  accent?: string;
  /** Page and ink. */
  preset?: "dark" | "light";
  /** Rank 1 as a full-width lead row above the grid. */
  lead?: boolean;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/music/radio-top-30-chart/v1";
const DEFAULT_ACCENT = "#ff3d9a";
const THEMES = {
  dark: { bg: "#131117", row: "#1e1b25", ink: "#f4f2f6", dim: "#a09bab" },
  light: { bg: "#f1eee7", row: "#fffdf9", ink: "#18151c", dim: "#6b6674" },
} as const;

// An invented station and an invented chart. 91.6 is an even-tenth frequency,
// which is not a US FM channel, so the default cannot be mistaken for a real
// station's chart. Row 7's title is 53 characters on purpose: it is the row
// that shows what the fit ladder does.
const DEFAULT_ROWS = [
  "Paper Lanterns | Night Bus Home | Tidewater | 2",
  "Glass Orchard | Slow Weather | Half Moon Recordings | 1",
  "The Marigolds | Kitchen Radio | Fern & Flint | 5",
  "Delta Kiosk | Parking Lot Hymns | Low Tide | 4",
  'Nora Vance | "Blue Receipt" [Single] | Self-Released | NEW',
  "Static Bloom | Greenhouse | Tidewater | 3",
  "Hollow Pines | A Field Guide to Leaving Early Without Saying Goodbye | Brass Key | 12",
  "Juno Park | Soft Machines [EP] | Night Shift | 6",
  "Cardigan Sea | Postcards | Half Moon Recordings | 9",
  "Vera & the Lowlights | Last Call | Brass Key | 15",
  "Mothwing | Porchlight | Fern & Flint | 8",
  "Tall Grass Choir | Everything Is Fine Here | Low Tide | NEW",
  "Okapi | Signal Hill | Night Shift | 7",
  "Rosa Calloway | Late Bloomer | Tidewater | 10",
  "Sunday Arcade | High Score [EP] | Self-Released | 22",
  "The Understudies | Second String | Brass Key | 11",
  "Pilot Light | Embers | Low Tide | 13",
  "Ferris | Midway | Half Moon Recordings | RE",
  "Lakehouse Tapes | Volume Two | Self-Released | 14",
  'Anya Brook | "Cold Coffee" [Single] | Fern & Flint | NEW',
  "Quiet Motors | Idle | Night Shift | 16",
  "Marble Run | Gravity Songs | Tidewater | 19",
  "The Night Clerks | Room 12 | Brass Key | 17",
  "Wren Abbott | Small Hours | Low Tide | 27",
  "Copper Wire | Loose Ends | Half Moon Recordings | 18",
  "Day Camp | Bug Juice | Self-Released | 20",
  "Sister Static | AM Gold | Night Shift | 30",
  "Halloway | Winter Coat | Fern & Flint | 21",
  "Plum Street | Corner Store | Tidewater | NEW",
  "The Long Weekend | Monday | Brass Key | 24",
];

const DEFAULTS = {
  station: "KOAD 91.6 FM",
  weekOf: "Week of Oct 6, 2026",
  genre: "",
  rows: DEFAULT_ROWS,
  footer: "Sample chart: artists, titles and labels are invented",
  accent: DEFAULT_ACCENT,
  preset: "light" as "dark" | "light",
  lead: false,
  debugLayout: false,
};

const propsSchema = definePropsSchema<RadioTop30ChartProps>({
  rows: {
    type: "json",
    required: false,
    description:
      'The chart in rank order, 1 to 30 lines, each "Artist | Title | Label" or "Artist | Title | Label | LW". LW is last week\'s rank (1-200), NEW, RE, or empty for no marker on that row. The rank is the position in the list and the count sets the title (TOP 30, TOP 10); the card does not sort or re-rank. NACC conventions such as "Title" [Single] and Title [EP] pass through as typed.',
    meta: {
      constraints: { jsonSchema: { type: "array", minItems: 1, maxItems: 30, items: { type: "string" } } },
      ui: { label: "Chart rows", order: 1, primary: true },
    },
  },
  station: {
    type: "string",
    required: false,
    description: 'The header mark: call sign and frequency, free text, 1 to 32 characters ("WXYZ 90.1 FM"). The sample station is invented.',
    meta: { control: { placeholder: DEFAULTS.station }, ui: { label: "Station", order: 2 } },
  },
  weekOf: {
    type: "string",
    required: false,
    description: "The line under the station, free text (no date parsing), up to 48 characters. Empty removes it.",
    meta: { control: { placeholder: DEFAULTS.weekOf }, ui: { label: "Week of", order: 3 } },
  },
  genre: {
    type: "string",
    required: false,
    description: 'A prefix for the chart title, up to 24 characters: "Loud Rock" with ten rows gives LOUD ROCK TOP 10. Empty gives TOP 30.',
    meta: { control: { placeholder: "Loud Rock" }, ui: { label: "Genre", order: 4 } },
  },
  footer: {
    type: "string",
    required: false,
    description: 'The bottom line, up to 90 characters: the station\'s URL, "As reported to NACC". Empty removes the line.',
    meta: { control: { placeholder: DEFAULTS.footer }, ui: { label: "Footer", order: 5 } },
  },
  lead: {
    type: "boolean",
    required: false,
    description: "Rank 1 leaves the grid and becomes a full-width lead row under the header; ranks 2 and up fill the grid.",
    meta: { ui: { label: "Lead row for #1", order: 6 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The rank numerals, the chart title, the header rule and the up / NEW / RE markers, as #rrggbb. On the light page a pale accent is darkened until it reads.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 7 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "dark" (default) or "light".',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 8 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the header and footer sit in their bands, every row has a cell and the cells are one size) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the chart: pure, exported, and what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

/**
 * Printable ASCII plus the accented Latin letters (Latin-1 and Latin
 * Extended-A, U+00C0-U+017F without the two maths signs): the bundled font
 * has a glyph for every one of them in both weights. Anything else is refused
 * by name instead of rendering as tofu.
 */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  if (!DRAWN.test(value)) fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use one line of printable ASCII and accented Latin letters (U+00C0-U+017F).`);
  const s = value.trim();
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card takes at most ${max}.`);
  return s;
}

export type RadioChartMove = "up" | "down" | "same" | "new" | "re";
export type RadioChartRow = {
  rank: number;
  artist: string;
  title: string;
  label: string;
  /** "+3", "-2", "=", "NEW", "RE"; "" when the line has no last-week field. */
  marker: string;
  move: RadioChartMove | null;
};

/** One chart line, "Artist | Title | Label" or "Artist | Title | Label | LW", at list position `index` (rank index + 1). */
export function parseRadioChartRow(raw: unknown, index: number): RadioChartRow {
  const rank = index + 1;
  const at = `rows[${index}] (line ${rank})`;
  const line = text(raw, at, 240);
  const f = line.split("|").map((s) => s.trim());
  if (f.length < 3 || f.length > 4) {
    fail(at, `${JSON.stringify(line)} has ${f.length} field${f.length === 1 ? "" : "s"} between "|"; write "Artist | Title | Label" or "Artist | Title | Label | LW" (a "|" inside a name cannot be written).`);
  }
  const [artist, title, label] = f;
  (["artist", "title", "label"] as const).forEach((name, k) => {
    if (f[k] === "") fail(at, `has an empty ${name}; a chart row carries an artist, a title and a label.`);
    const max = name === "label" ? 40 : 80;
    if (f[k].length > max) fail(at, `${name} is ${f[k].length} characters; the card takes at most ${max}.`);
  });
  const lw = (f[3] ?? "").toUpperCase();
  let marker = "", move: RadioChartMove | null = null;
  if (lw === "NEW") { marker = "NEW"; move = "new"; }
  else if (lw === "RE") { marker = "RE"; move = "re"; }
  else if (lw !== "") {
    const n = /^\d{1,3}$/.test(lw) ? Number(lw) : NaN;
    if (!(n >= 1 && n <= 200)) fail(at, `last week ${JSON.stringify(f[3])} must be a rank from 1 to 200, NEW, RE, or empty.`);
    const d = n - rank;
    marker = d > 0 ? `+${d}` : d < 0 ? `-${-d}` : "=";
    move = d > 0 ? "up" : d < 0 ? "down" : "same";
  }
  return { rank, artist, title, label, marker, move };
}

export type RadioChart = ReturnType<typeof normalizeRadioChart>;

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeRadioChart(props: RadioTop30ChartProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const station = text(p.station, "station", 32);
  if (station === "") fail("station", "is empty; the card is headed by the station (call sign and frequency).");
  const weekOf = text(p.weekOf, "weekOf", 48);
  const genre = text(p.genre, "genre", 24);
  const footer = text(p.footer, "footer", 90);
  if (p.preset !== "dark" && p.preset !== "light") fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
  if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim())) fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
  if (typeof p.lead !== "boolean") fail("lead", "must be a boolean.");
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");
  if (!Array.isArray(p.rows)) fail("rows", 'must be a list of chart lines ("Artist | Title | Label").');
  if (p.rows.length < 1) fail("rows", "is empty; a chart needs at least one line.");
  if (p.rows.length > 30) fail("rows", `has ${p.rows.length} lines; a station chart is 30, and a longer list needs a second card.`);
  const rows = p.rows.map((r, i) => parseRadioChartRow(r, i));
  return {
    station, weekOf, genre, footer, rows,
    /** Computed from the rows, never typed, so the title cannot contradict the list. */
    chartTitle: `${genre === "" ? "" : `${genre.toUpperCase()} `}TOP ${rows.length}`,
    hasMarkers: rows.some((r) => r.marker !== ""),
    accent: p.accent.trim().toLowerCase() as MosaicColor,
    preset: p.preset as "dark" | "light", lead: p.lead, debugLayout: p.debugLayout,
  };
}

/* ── colour ── */

// Not exported: the repo index is `export *`, and other templates export a `mix`.
function mix(a: string, b: string, t: number): MosaicColor {
  const ch = (s: string, i: number) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}
function luminance(hex: string): number {
  const c = (i: number) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** The accent as INK on a row: itself when it reads there, otherwise pulled toward the page's ink until it does. */
function accentInk(accent: string, on: string, ink: string): MosaicColor {
  let t = 0;
  while (t < 0.6 && contrast(mix(accent, ink, t), on) < 3.6) t += 0.1;
  return mix(accent, ink, t);
}

/* ── geometry ── */

/** The shared sizes may come down by this much for the lines that can be caught; a line that needs more shrinks alone. */
export const RADIO_CHART_SHARED_FLOOR = 0.85;
/** A line alone goes no lower than this fraction of its cap; past it the render refuses. */
export const RADIO_CHART_ALONE_FLOOR = 0.5;
/** The lead row (`lead: true`) is this many grid rows tall. */
const LEAD_ROWS = 1.7;

export type RadioChartRect = { x: number; y: number; w: number; h: number };
type Bind = "station" | "weekOf" | "footer" | "genre" | null;
type Cell = { label: string; rect: RadioChartRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; row: number | null };
type Tile = { label: string; rect: RadioChartRect; color: MosaicColor; accent?: boolean };
export type RadioChartRowLayout = {
  row: RadioChartRow;
  /** Its cell: `row-<i>` in the grid, `lead` for the lead row. */
  tile: RadioChartRect;
  lead: boolean;
  /** Grid column and position in it; -1 for the lead row. */
  column: number;
  slot: number;
  artistPx: number;
  titlePx: number;
  /** True when that line could not be caught by the shared size and shrank alone. */
  artistAlone: boolean;
  titleAlone: boolean;
};

/** Sizes are 64ths of a pixel, not whole pixels: on a 480x270 thumbnail a whole pixel is a 20% step, and the fit has to stay proportional. */
const STEP = 1 / 64;
const q = (px: number) => Math.max(STEP, Math.floor(px / STEP) * STEP);
/** Width of one line per pixel of font size (the rasterizer's metrics are linear in the size). */
const em = (line: string, bold = false) => widthOf(line, 100, bold) / 100;
/** The largest size up to `cap` at which one line fits the cell's budget (`cell * 0.94 - 2px`). */
function fitPx(line: string, cellW: number, cap: number, bold: boolean): number {
  const room = budget(cellW), e = em(line, bold);
  let px = q(e > 0 ? Math.min(cap, room / e) : cap);
  while (px > STEP && widthOf(line, px, bold) > room) px -= STEP;
  return px;
}
/** The narrowest cell whose budget fits `line` at `px`. */
const cellFor = (line: string, px: number, bold = false) => Math.ceil((widthOf(line, px, bold) + 2) / 0.94) + 1;
/** A snug cell for text placed on an exact rect: the measured width with the 2% the contract's ruler asks for, and a pixel. */
const snug = (line: string, px: number, bold = false) => Math.ceil(widthOf(line, px, bold) * 1.02) + 1;

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutRadioChart(props: RadioTop30ChartProps, W: number, H: number) {
  const p = normalizeRadioChart(props);
  const theme = THEMES[p.preset];
  const ink = theme.ink as MosaicColor, dim = theme.dim as MosaicColor;
  const accent = accentInk(p.accent, theme.row, theme.ink);
  const S = Math.min(W, H);
  // 16:9 and wider: up to 10 rows a column. Square and portrait: up to 15.
  const wide = W * 10 >= H * 13;
  const m = Math.round(S * 0.04), CW = W - 2 * m;
  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const unfit = (what: string, how: string): never => fail(what, `cannot be fitted on ${W}x${H}: ${how}`);
  const put = (label: string, rect: RadioChartRect, value: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; row?: number } = {}) => {
    cells.push({ label, rect, text: value, px, width: widthOf(value, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? ink, bind: o.bind ?? null, row: o.row ?? null });
  };

  // ── header: the station (the largest text on the card) and the chart title on one line, the week under the station ──
  const hb = Math.round(H * 0.095);
  const stationH = Math.round(hb * 0.64), weekH = hb - stationH;
  const stationCap = Math.min(stationH * 0.76, CW * 0.075);
  const headGap = Math.round(S * 0.03);
  // The station and the chart title share the line: both come down together until they fit side by side.
  let hk = Math.min(1, (budget(CW) - headGap) / ((em(p.station, true) + 0.8 * em(p.chartTitle, true)) * stationCap));
  let stationPx = 0, chartPx = 0, chartW = 0, stationW = 0;
  for (;; hk -= 0.01) {
    if (hk < 0.45) unfit("station and the chart title", `shorten the station${p.genre === "" ? "" : " or the genre"}.`);
    stationPx = q(stationCap * hk); chartPx = q(stationPx * 0.8);
    chartW = cellFor(p.chartTitle, chartPx, true); stationW = CW - chartW - headGap;
    if (stationW > 0 && widthOf(p.station, stationPx, true) <= budget(stationW)) break;
  }
  // With no week line the station and the title take the middle of the band.
  const headY = p.weekOf === "" ? m + Math.round((hb - stationH) / 2) : m;
  put("station", { x: m, y: headY, w: stationW, h: stationH }, p.station, stationPx, { bold: true, bind: "station" });
  put("chart-title", { x: m + CW - chartW, y: headY, w: chartW, h: stationH }, p.chartTitle, chartPx, { bold: true, align: "right", color: accent, bind: p.genre === "" ? null : "genre" });
  if (p.weekOf !== "") {
    const cap = Math.min(weekH * 0.62, S * 0.024), px = fitPx(p.weekOf, CW, cap, false);
    if (px < cap * RADIO_CHART_ALONE_FLOOR) unfit("weekOf", "shorten it.");
    put("week-of", { x: m, y: m + stationH, w: CW, h: weekH }, p.weekOf, px, { color: dim, bind: "weekOf" });
  }
  const ruleH = Math.max(2, Math.round(S * 0.004));
  const ruleY = m + hb + Math.round(S * 0.012);
  tiles.push({ label: "header-rule", rect: { x: m, y: ruleY, w: CW, h: ruleH }, color: p.accent, accent: true });

  // ── footer: one dim line ──
  const footH = Math.round(H * 0.035), footY = H - Math.round(S * 0.03) - footH;
  if (p.footer !== "") {
    const cap = Math.min(footH * 0.5, S * 0.019), px = fitPx(p.footer, CW, cap, false);
    if (px < cap * RADIO_CHART_ALONE_FLOOR) unfit("footer", "shorten it.");
    put("footer", { x: m, y: footY, w: CW, h: footH }, p.footer, px, { color: dim, bind: "footer" });
  }

  // ── the grid: columns = ceil(n / cap), rows per column = ceil(n / columns); every row cell one size ──
  const bandTop = ruleY + ruleH + Math.round(S * 0.014), bandBottom = footY - Math.round(S * 0.008);
  const hasLead = p.lead && p.rows.length > 1;
  const gridRows = hasLead ? p.rows.slice(1) : p.rows;
  const n = gridRows.length;
  const columns = Math.ceil(n / (wide ? 10 : 15));
  const perColumn = Math.ceil(n / columns);
  const hair = Math.max(1, Math.round(S * 0.002));
  // A Top 5 does not become slabs: the pitch is capped and the rows group at the top of the band.
  const pitch = Math.max(2, Math.min(Math.round(S * 0.11), Math.floor((bandBottom - bandTop) / (perColumn + (hasLead ? LEAD_ROWS : 0)))));
  const leadH = hasLead ? Math.round(pitch * LEAD_ROWS) : 0;
  const gutter = Math.round(S * 0.025);
  const colW = Math.floor((CW - (columns - 1) * gutter) / columns);
  const gridTop = bandTop + leadH;

  /** One row class (the grid rows, or the lead row): where the rank, the two lines and their caps sit in a cell. */
  const geometry = (cellW: number, cellH: number) => {
    const artistCap = Math.min(cellH * 0.41, cellW * 0.045), titleCap = artistCap * 0.76;
    const rankPx = q(artistCap), markPx = q(titleCap * 0.86);
    // Fixed for the card: wide enough for "30" and for "NEW".
    const rankW = Math.max(cellFor("30", rankPx, true), p.hasMarkers ? cellFor("NEW", markPx, true) : 0);
    const padL = Math.round(cellW * 0.014), gapR = Math.round(cellW * 0.02), padR = Math.round(cellW * 0.02);
    const textX = padL + rankW + gapR, textW = cellW - textX - padR;
    const artistH = Math.min(cellH - 1, Math.round(artistCap * 1.22)), titleH = Math.max(1, Math.min(cellH - artistH, Math.round(titleCap * 1.28)));
    return { artistCap, titleCap, rankPx, markPx, rankW, padL, textX, textW, artistH, titleH, top: Math.floor((cellH - artistH - titleH) / 2), labelGap: Math.round(titleCap * 0.7) };
  };
  type Geometry = ReturnType<typeof geometry>;

  const artistFits = (r: RadioChartRow, g: Geometry, px: number) => widthOf(r.artist, px, true) <= budget(g.textW);
  // Where the label starts on line 2: the title's snug cell, then what is left of the gap once the
  // cell's own slack is taken off, so the ink-to-ink gap is the same on every row.
  const labelX = (r: RadioChartRow, g: Geometry, px: number) => {
    const cell = snug(r.title, px);
    return cell + Math.max(2, g.labelGap - (cell - Math.ceil(widthOf(r.title, px))));
  };
  // The title, a fixed gap, the label: the line fits when the ink fits the budget and the two cells fit the column.
  const titleFits = (r: RadioChartRow, g: Geometry, px: number) =>
    widthOf(r.title, px) + g.labelGap + widthOf(r.label, px) <= budget(g.textW) && labelX(r, g, px) + snug(r.label, px) <= g.textW;
  /** How far below its cap a line has to go to fit: 1 = fits at the cap. */
  const artistNeed = (r: RadioChartRow, g: Geometry) => Math.min(1, budget(g.textW) / (em(r.artist, true) * g.artistCap));
  const titleNeed = (r: RadioChartRow, g: Geometry) => Math.min(1, (budget(g.textW) - g.labelGap) / ((em(r.title) + em(r.label)) * g.titleCap));
  /** A line on its own: the largest size from `from` down that fits; refuses below the floor. */
  const alone = (r: RadioChartRow, field: "artist" | "title", cap: number, from: number, fits: (px: number) => boolean) => {
    let px = q(from);
    while (px > STEP && !fits(px)) px -= STEP;
    if (px < cap * RADIO_CHART_ALONE_FLOOR || !fits(px)) {
      unfit(`row ${r.rank} ${field}`, field === "title" ? `shorten it (${r.title.length} characters next to a ${r.label.length}-character label).` : `shorten it (${r.artist.length} characters).`);
    }
    return px;
  };

  /** Draw one row in its cell at the sizes the ladder gave it. */
  const draw = (i: number, r: RadioChartRow, tile: RadioChartRect, g: Geometry, artistPx: number, titlePx: number) => {
    const y1 = tile.y + g.top, y2 = y1 + g.artistH;
    const rankRect = p.hasMarkers ? { x: tile.x + g.padL, y: y1, w: g.rankW, h: g.artistH } : { x: tile.x + g.padL, y: tile.y, w: g.rankW, h: tile.h };
    put(`rank-${i}`, rankRect, String(r.rank), fitPx(String(r.rank), g.rankW, g.rankPx, true), { bold: true, align: "center", color: accent });
    if (r.marker !== "") {
      const up = r.move === "up" || r.move === "new" || r.move === "re";
      put(`marker-${i}`, { x: tile.x + g.padL, y: y2, w: g.rankW, h: g.titleH }, r.marker, fitPx(r.marker, g.rankW, g.markPx, true), { bold: true, align: "center", color: up ? accent : dim });
    }
    const x = tile.x + g.textX;
    put(`artist-${i}`, { x, y: y1, w: g.textW, h: g.artistH }, r.artist, artistPx, { bold: true, row: i });
    const lx = labelX(r, g, titlePx);
    put(`title-${i}`, { x, y: y2, w: snug(r.title, titlePx), h: g.titleH }, r.title, titlePx, { row: i });
    put(`label-${i}`, { x: x + lx, y: y2, w: g.textW - lx, h: g.titleH }, r.label, titlePx, { color: dim, row: i });
  };

  const rows: RadioChartRowLayout[] = [];
  if (hasLead) {
    // The lead row is one row at a larger scale, across the full width; its two lines are fitted on their own.
    const r = p.rows[0], tile: RadioChartRect = { x: m, y: bandTop, w: CW, h: leadH - hair };
    const g = geometry(tile.w, tile.h);
    const artistPx = alone(r, "artist", g.artistCap, g.artistCap, (px) => artistFits(r, g, px));
    const titlePx = alone(r, "title", g.titleCap, g.titleCap, (px) => titleFits(r, g, px));
    tiles.push({ label: "lead", rect: tile, color: theme.row as MosaicColor });
    draw(0, r, tile, g, artistPx, titlePx);
    rows.push({ row: r, tile, lead: true, column: -1, slot: -1, artistPx, titlePx, artistAlone: artistPx < q(g.artistCap), titleAlone: titlePx < q(g.titleCap) });
  }

  const g = geometry(colW, pitch - hair);
  // The ladder. Step 1: the shared sizes follow the neediest line that is still inside the allowance.
  const needs = gridRows.flatMap((r) => [artistNeed(r, g), titleNeed(r, g)]);
  const shared = Math.min(1, ...needs.filter((k) => k >= RADIO_CHART_SHARED_FLOOR));
  const artistShared = q(g.artistCap * shared), titleShared = q(g.titleCap * shared);
  gridRows.forEach((r, j) => {
    const i = hasLead ? j + 1 : j;
    const column = Math.floor(j / perColumn), slot = j % perColumn;
    const tile: RadioChartRect = { x: m + column * (colW + gutter), y: gridTop + slot * pitch, w: colW, h: pitch - hair };
    // Step 2: a line the shared size cannot catch shrinks alone. Step 3 (inside `alone`): past the floor, refuse.
    const artistAlone = !artistFits(r, g, artistShared), titleAlone = !titleFits(r, g, titleShared);
    const artistPx = artistAlone ? alone(r, "artist", g.artistCap, Math.min(artistShared, g.artistCap * artistNeed(r, g)), (px) => artistFits(r, g, px)) : artistShared;
    const titlePx = titleAlone ? alone(r, "title", g.titleCap, Math.min(titleShared, g.titleCap * titleNeed(r, g)), (px) => titleFits(r, g, px)) : titleShared;
    tiles.push({ label: `row-${i}`, rect: tile, color: theme.row as MosaicColor });
    draw(i, r, tile, g, artistPx, titlePx);
    rows.push({ row: r, tile, lead: false, column, slot, artistPx, titlePx, artistAlone, titleAlone });
  });

  return { p, theme, wide, cells, tiles, rows, m, columns, perColumn, pitch, colW, gutter, bandTop, bandBottom, gridTop, shared, artistShared, titleShared, artistCap: g.artistCap, titleCap: g.titleCap, rankW: g.rankW };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 16,
  "date": "2026-10-05",
  "agent": "claude",
  "model": "claude-fable-5.1",
  "id": "@one-a-day/music/radio-top-30-chart/v1",
  "title": "Radio Top 30 Chart",
  "who": "Music directors at college and community radio stations, who chart a Top 30 to NACC every Tuesday and post it on the station blog and socials",
  "problem": [
    "Every week a station ranks its 30 most-played new releases and reports them to NACC. WUVT: \"they want us to chart our Top 30 on the NACC radio chart every week.\" WUSC: the music director \"puts it together by looking back at our playlist log to determine the top 30 plays\".",
    "Then the same chart is published by hand. KWVA retypes it as a list (\"1. CLAIRO Album: Charm Label: Virgin\"); WUSC posts \"Top 30 chart day\". One station of the four opened, WDCE, posts it as a picture: \"Here's the WDCE Top 30 from 29 July 2026 (click the image to see a larger version)\".",
    "So the evidence for a hand-made picture is one station; the other three show the weekly chore, not a wish for a graphic. The strings are unbounded: \"Brat And It's Completely Different But Also Still Brat\" is a real row on KWVA's page."
  ],
  "sources": [
    "https://create.richmond.edu/parsons/tag/slippers/",
    "https://kwva.uoregon.edu/charts?page=4",
    "https://www.wusc.fm/article/2021/08/top-30-chart-08-24-21",
    "https://www.wusc.fm/article/2021/11/our-weekly-top-30-chart-11-02-21",
    "https://wuvt.vt.edu/article/music-article",
    "https://naccchart.com/reporting-guidelines",
    "https://naccchart.com/faq",
    "https://en.wikipedia.org/wiki/North_American_College_and_Community_Radio_Chart",
    "https://spinitron.com/"
  ],
  "solution": [
    "Paste the chart as lines, \"Artist | Title | Label | last week\", and get the week's card: the station, a TOP 30 counted from the rows, and every row as rank, bold artist, then title with its label in dimmer ink. 3 x 10 on a wide canvas, 2 x 15 on a square or a story. The default chart is invented.",
    "The one decision: the fit rule. All rows share one artist size and one title size; the shared sizes give up at most 15% for a long line, a line that needs more shrinks alone to no less than half, and past that the render refuses and names the row. Nothing is cut off and nothing gets an ellipsis."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/music/radio-top-30-chart/v1 --template-repo . -w 1080 -h 1080 -o journal/2026-10-05/radio-top-30-chart.png",
    "try": [
      "rows: 1-30 lines \"Artist | Title | Label | 4\"; the 4th field is last week's rank, NEW, RE, or left out",
      "genre \"Loud Rock\" with ten rows: the title becomes LOUD ROCK TOP 10 and the grid one column",
      "lead true: rank 1 becomes a full-width row above the grid; preset \"light\" for the studio door",
      "-w 1920 -h 1080 for a blog header (3 x 10), -w 1080 -h 1920 for a story (2 x 15)"
    ]
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 236783,
        "calls": 27,
        "tokens": 2571704,
        "costUsd": 3.37,
        "tools": "WebSearch 11, Bash 7, Edit 3"
      },
      {
        "name": "plan",
        "startMs": 236798,
        "durMs": 334008,
        "calls": 15,
        "tokens": 1848161,
        "costUsd": 3.2,
        "tools": "Bash 13, Edit 1, Write 1"
      }
    ],
    "costBasis": "reported"
  },
  "caveats": [
    "It does not read a NACC or Spinitron export: you type or paste the lines (\"1. CLAIRO Album: Charm Label: Virgin\" becomes \"Clairo | Charm | Virgin\"). A name with a \"|\" in it cannot be written.",
    "Thirty rows on a 1080 square are small type: the artist line is about 21 px and the title about 16 px. There is no pixel floor, so a 480x270 render is a thumbnail, not a readable chart.",
    "No cover art, no adds list, no paging. Last-week values are printed as given: two rows may both claim last week's 4."
  ]
};

export const RadioTop30ChartV1 = defineMosaicTemplate<RadioTop30ChartProps>({
  id: asTemplateId(ID),
  label: "2026-10-05 · Radio Top 30 Chart",
  version: 1,
  description: "A radio station's weekly chart card from pasted lines (Artist | Title | Label | last week): the station, a computed TOP 30, the week, and thirty equal two-line rows with rank and movement markers, 3 x 10 on a wide canvas and 2 x 15 on a square or story; long titles shrink by rule or are refused, never clipped.",
  capabilities: { tier: "core" },
  tags: ["music","2026-10-05","day-016","radio","college-radio","chart","top-30","nacc"],

  outputHints: {
    width: 1080,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG. 16:9 and wider: up to 10 rows a column (3 x 10 for a Top 30). Square and portrait: up to 15 (2 x 15). Type is sized for 1080 on the short side; smaller canvases are thumbnails.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default RadioTop30ChartV1;

async function render(props: RadioTop30ChartProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutRadioChart(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  // Tiles first, then text: placeInsetPieces puts a rect on the first overlay
  // layer it does not collide with, so the row cells share one layer and the
  // copy another.
  for (const t of L.tiles) {
    const tile = tag({ ...makeColorTile(t.color) } as MosaicSource, t.label);
    // `accent` paints the header rule, so that is the rect that shows it.
    pieces.push({ rect: { ...t.rect, importance: 1 }, source: t.accent ? bindProp(tile, "accent") : tile });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; a row's artist, title and label are bound to its line in `rows`.
    pieces.push({ rect: { ...c.rect, importance: 2 }, source: c.row !== null ? bindPropPath(cell, "rows", [c.row], "string") : c.bind === null ? cell : bindProp(cell, c.bind) });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises, against the labels: every text fits its box
  // (above); the station and the chart title live in the top fifth and the
  // footer in the bottom tenth; the header rule spans the card; every row
  // given has its cell (and its rank, artist and title, as the text
  // constraints above), each cell at least a quarter of the canvas wide and
  // inside the chart band, and all of them one size.
  constraints.push({ label: "station", within: { yFrac: [0, 0.2] } });
  constraints.push({ label: "chart-title", within: { yFrac: [0, 0.2] } });
  if (L.p.footer !== "") constraints.push({ label: "footer", within: { yFrac: [0.9, 1] } });
  constraints.push({ label: "header-rule", minWidthFrac: 0.9 });
  const grid = L.rows.filter((r) => !r.lead).map((r) => `row-${r.row.rank - 1}`);
  grid.forEach((label) => constraints.push({ label, within: { yFrac: [0.08, 0.97] }, minWidthFrac: 0.25 }));
  if (L.rows.some((r) => r.lead)) constraints.push({ label: "lead", within: { yFrac: [0.08, 0.5] }, minWidthFrac: 0.9 });
  const relations: RelationalConstraint[] = grid.length > 1 ? [{ label: grid, equal: "size", tolerancePx: 2 }] : [];

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
