import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicSource } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag } from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/community/qsl-card/v1` - a ham radio QSL card for ONE contact,
 * rendered from the fields of one ADIF log record, so a script can loop over
 * a whole log and write one card per QSO.
 *
 * ONE CONCEPT: the props ARE the log record. Each prop is an ADIF field in
 * camelCase taking the ADIF format (QSO_DATE "20261003", TIME_ON "1432",
 * FREQ "14.074" in MHz), and the card prints it the way a QSL does
 * ("03 OCT 2026", "14:32"). BAND is not a prop: it is DERIVED from FREQ with
 * the ADIF 3.1.6 band enumeration, so the two can never disagree on a card.
 *
 * The rule that bites: a callsign is never ellipsized. A card with half a
 * call on it confirms nothing. The station call is sized from its own text
 * (a short K1A is limited by the band's height, a long VP2V/G4ABC by its
 * width), the QSO table reflows by aspect (6x1, 3x2, 2x3) before any type
 * shrinks, the table values shrink before the call drops below twice their
 * size, and copy that cannot fit above the readability floor (10/270 of
 * the short side) is refused with an error that names the prop.
 */

export type QslCardProps = {
  /** STATION_CALLSIGN: the sender, the biggest thing on the card. */
  stationCallsign?: string;
  /** CALL: the station worked - "TO RADIO <call>". */
  call?: string;
  /** QSO_DATE as YYYYMMDD (UTC). */
  qsoDate?: string;
  /** TIME_ON as HHMM or HHMMSS (UTC). */
  timeOn?: string;
  /** FREQ in MHz, printed as given; BAND is derived from it. */
  freq?: string;
  /** MODE (or SUBMODE), printed as the log says it. */
  mode?: string;
  /** RST_SENT: "59", "599" or a signed dB report ("-12"). */
  rstSent?: string;
  /** MY_GRIDSQUARE: 4, 6 or 8 character Maidenhead; "" hides the line. */
  myGridsquare?: string;
  /** MY_CITY / MY_STATE as one line; "" hides it. */
  qth?: string;
  /** MY_POTA_REF: a Parks on the Air reference; "" hides it. */
  myPotaRef?: string;
  /** QSLMSG: the footer line; "" hides it. */
  qslMsg?: string;
  /** The one accent: top bar, label rules, TO RADIO tag. */
  accentColor?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/community/qsl-card/v1";
/** The face: document.backgroundColor, never a full-canvas rect (doctor: canvasFill). */
const PAPER = "#f4f1ea";
const INK = "#1b2a4a";
const DIM = "#66758c";
const DEFAULT_ACCENT = "#b3261e";

// Labelled examples, not anybody's log: N0CALL is the placeholder call ham
// software ships with, W1AW the ARRL station its documentation uses, and the
// grid EN34 sits in the 0 call district, so it agrees with N0CALL.
const DEFAULTS = {
  stationCallsign: "N0CALL",
  call: "W1AW",
  qsoDate: "20261003",
  timeOn: "1432",
  freq: "14.074",
  mode: "FT8",
  rstSent: "-12",
  myGridsquare: "EN34",
  qth: "Minneapolis, MN",
  myPotaRef: "US-1234",
  qslMsg: "TNX QSO 73",
  accentColor: DEFAULT_ACCENT,
  debugLayout: false,
};

const propsSchema = definePropsSchema<QslCardProps>({
  stationCallsign: {
    type: "string",
    required: false,
    description: "STATION_CALLSIGN: your call, the biggest thing on the card. 3-13 characters of A-Z, 0-9 and /, with at least one digit (portable suffixes like /P are fine); upper-cased. Never ellipsized: a call that cannot fit the canvas is refused.",
    meta: { control: { placeholder: DEFAULTS.stationCallsign }, ui: { label: "Station callsign", order: 1, primary: true } },
  },
  call: {
    type: "string",
    required: false,
    description: "CALL: the station you worked, printed as TO RADIO <call>. Same rule as the station callsign.",
    meta: { control: { placeholder: DEFAULTS.call }, ui: { label: "Worked call (CALL)", order: 2, primary: true } },
  },
  qsoDate: {
    type: "string",
    required: false,
    description: 'QSO_DATE as the log writes it, YYYYMMDD in UTC (1930 or later). Printed with the month spelled out, "03 OCT 2026", so it reads the same in the US and in Europe.',
    meta: { control: { placeholder: DEFAULTS.qsoDate }, ui: { label: "QSO date (YYYYMMDD)", order: 3 } },
  },
  timeOn: {
    type: "string",
    required: false,
    description: 'TIME_ON in UTC, HHMM or HHMMSS. Printed as 14:32 (or 14:32:05) under the UTC label.',
    meta: { control: { placeholder: DEFAULTS.timeOn }, ui: { label: "Time on (HHMM UTC)", order: 4 } },
  },
  freq: {
    type: "string",
    required: false,
    description: 'FREQ in MHz, e.g. "14.074" or "1296.200", printed as given (no rounding, up to 6 decimals). The BAND cell is derived from it with the ADIF 3.1.6 band table (14.074 -> 20m, 432.100 -> 70cm); a frequency outside every amateur band (27.185) is refused.',
    meta: { control: { placeholder: DEFAULTS.freq }, ui: { label: "Frequency (MHz)", order: 5 } },
  },
  mode: {
    type: "string",
    required: false,
    description: "MODE or SUBMODE as the log says it (SSB, CW, FT8, FT4, RTTY...). 1-8 characters of A-Z, 0-9 and -, upper-cased; not checked against the ADIF mode list.",
    meta: { control: { placeholder: DEFAULTS.mode }, ui: { label: "Mode", order: 6 } },
  },
  rstSent: {
    type: "string",
    required: false,
    description: 'RST_SENT: the report you gave, RS or RST digits ("59", "599") or a signed dB report ("-12", "+05").',
    meta: { control: { placeholder: DEFAULTS.rstSent }, ui: { label: "Report sent (RST)", order: 7 } },
  },
  myGridsquare: {
    type: "string",
    required: false,
    description: 'MY_GRIDSQUARE: 4, 6 or 8 character Maidenhead locator, printed in canonical case ("EN34lw"). Empty removes the GRID line.',
    meta: { control: { placeholder: "none" }, ui: { label: "My grid square", order: 8 } },
  },
  qth: {
    type: "string",
    required: false,
    description: "Your QTH (MY_CITY / MY_STATE as one line), up to 32 characters of printable ASCII. Empty removes the line.",
    meta: { control: { placeholder: "none" }, ui: { label: "QTH", order: 9 } },
  },
  myPotaRef: {
    type: "string",
    required: false,
    description: 'MY_POTA_REF: a Parks on the Air reference ("US-1234", "K-12345", "GB-0001@GB-ENG"). Empty removes the POTA line - most cards are not from a park.',
    meta: { control: { placeholder: "none" }, ui: { label: "My POTA ref", order: 10 } },
  },
  qslMsg: {
    type: "string",
    required: false,
    description: "QSLMSG: the footer line, up to 40 characters of printable ASCII. Empty removes it.",
    meta: { control: { placeholder: "none" }, ui: { label: "QSL message", order: 11 } },
  },
  accentColor: {
    type: "string",
    required: false,
    description: "The one accent, as #rrggbb: the bar along the top, the rules under the table labels and the TO RADIO tag.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 12 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the call sits in the top half, the QSO table is complete, the accent bar spans the card) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the ADIF record: pure, exported, and what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

/** An ADIF Number in MHz -> integer Hz; null when it is not one (more than 6 decimals is not one here). */
export function qslMHzToHz(text: string): number | null {
  const m = /^(\d{0,7})(?:\.(\d{1,6}))?$/.exec(text);
  if (!m || (m[1] === "" && m[2] === undefined)) return null;
  return Number(m[1] || "0") * 1_000_000 + Number((m[2] ?? "").padEnd(6, "0"));
}

/** The ADIF 3.1.6 Band enumeration (section III.B.4), lower and upper edge in MHz, both inclusive. */
const ADIF_BANDS: ReadonlyArray<readonly [string, string, string]> = [
  ["2190m", ".1357", ".1378"], ["630m", ".472", ".479"], ["560m", ".501", ".504"],
  ["160m", "1.8", "2.0"], ["80m", "3.5", "4.0"], ["60m", "5.06", "5.45"], ["40m", "7.0", "7.3"],
  ["30m", "10.1", "10.15"], ["20m", "14.0", "14.35"], ["17m", "18.068", "18.168"], ["15m", "21.0", "21.45"],
  ["12m", "24.890", "24.99"], ["10m", "28.0", "29.7"], ["8m", "40", "45"], ["6m", "50", "54"],
  ["5m", "54.000001", "69.9"], ["4m", "70", "71"], ["2m", "144", "148"], ["1.25m", "222", "225"],
  ["70cm", "420", "450"], ["33cm", "902", "928"], ["23cm", "1240", "1300"], ["13cm", "2300", "2450"],
  ["9cm", "3300", "3500"], ["6cm", "5650", "5925"], ["3cm", "10000", "10500"], ["1.25cm", "24000", "24250"],
  ["6mm", "47000", "47200"], ["4mm", "75500", "81000"], ["2.5mm", "119980", "123000"], ["2mm", "134000", "149000"],
  ["1mm", "241000", "250000"], ["submm", "300000", "7500000"],
];
const BAND_HZ = ADIF_BANDS.map(([band, lo, hi]) => ({ band, lo: qslMHzToHz(lo) as number, hi: qslMHzToHz(hi) as number }));

/** FREQ (MHz text) -> the ADIF band name, or null when the frequency is in no amateur band. Integer Hz, no floats. */
export function qslBandOf(freq: string): string | null {
  const hz = qslMHzToHz(freq);
  if (hz === null) return null;
  return BAND_HZ.find((b) => hz >= b.lo && hz <= b.hi)?.band ?? null;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** QSO_DATE "20261003" -> "03 OCT 2026"; null for anything that is not a calendar date from 1930 on (ADIF's floor). */
export function qslFormatDate(text: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(text);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (y < 1930 || mo < 1 || mo > 12 || d < 1 || d > days[mo - 1]) return null;
  return `${m[3]} ${MONTHS[mo - 1]} ${m[1]}`;
}

/** TIME_ON "1432" -> "14:32", "143205" -> "14:32:05"; null outside 00:00:00-23:59:59. */
export function qslFormatTime(text: string): string | null {
  const m = /^(\d{2})(\d{2})(\d{2})?$/.exec(text);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59 || (m[3] !== undefined && Number(m[3]) > 59)) return null;
  return m[3] === undefined ? `${m[1]}:${m[2]}` : `${m[1]}:${m[2]}:${m[3]}`;
}

/** A Maidenhead locator (4, 6 or 8 characters) in canonical case - "EN34lw55" - or null. */
export function qslGrid(text: string): string | null {
  const m = /^([A-R]{2})(\d{2})(?:([A-X]{2})(\d{2})?)?$/i.exec(text);
  if (!m) return null;
  return `${m[1].toUpperCase()}${m[2]}${(m[3] ?? "").toLowerCase()}${m[4] ?? ""}`;
}

function str(value: unknown, field: string): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  return value.trim();
}

function callsign(value: unknown, field: string): string {
  const s = str(value, field).toUpperCase();
  if (s === "") fail(field, "must not be empty: a QSL card confirms a contact between two calls.");
  if (!/^[A-Z0-9/]{3,13}$/.test(s) || !/\d/.test(s) || !/[A-Z]/.test(s) || /^\/|\/$|\/\//.test(s)) {
    fail(field, `${JSON.stringify(s)} is not a callsign: 3-13 characters of A-Z, 0-9 and /, with a letter and a digit, no spaces.`);
  }
  return s;
}

function printable(value: unknown, field: string, max: number): string {
  const s = str(value, field);
  if (!/^[\x20-\x7e]*$/.test(s)) fail(field, `${JSON.stringify(s)} has a character outside printable ASCII, which the card's font is not known to draw.`);
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
  return s;
}

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeQslCard(props: QslCardProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) } as typeof DEFAULTS;
  const stationCallsign = callsign(p.stationCallsign, "stationCallsign");
  const call = callsign(p.call, "call");

  const qsoDate = str(p.qsoDate, "qsoDate");
  const date = qslFormatDate(qsoDate);
  if (date === null) fail("qsoDate", `${JSON.stringify(qsoDate)} is not an ADIF date: YYYYMMDD, a real calendar day from 1930 on.`);
  const timeOn = str(p.timeOn, "timeOn");
  const time = qslFormatTime(timeOn);
  if (time === null) fail("timeOn", `${JSON.stringify(timeOn)} is not an ADIF time: HHMM or HHMMSS, 0000 to 235959 UTC.`);

  const freq = str(p.freq, "freq");
  if (qslMHzToHz(freq) === null) fail("freq", `${JSON.stringify(freq)} is not a frequency in MHz: digits with up to 6 decimals, e.g. "14.074".`);
  const band = qslBandOf(freq);
  if (band === null) fail("freq", `${freq} MHz is in no amateur band of the ADIF 3.1.6 band table, so the card cannot name its BAND.`);

  const mode = str(p.mode, "mode").toUpperCase();
  if (!/^[A-Z0-9-]{1,8}$/.test(mode)) fail("mode", `${JSON.stringify(mode)} must be 1-8 characters of A-Z, 0-9 and -.`);
  const rst = str(p.rstSent, "rstSent");
  if (!/^[1-5][1-9][1-9]?$/.test(rst) && !/^[+-]\d{1,2}$/.test(rst)) fail("rstSent", `${JSON.stringify(rst)} is not a report: RS or RST digits ("59", "599") or signed dB ("-12", "+05").`);

  const gridRaw = str(p.myGridsquare, "myGridsquare");
  const grid = gridRaw === "" ? "" : qslGrid(gridRaw);
  if (grid === null) fail("myGridsquare", `${JSON.stringify(gridRaw)} is not a Maidenhead locator: 4, 6 or 8 characters like "EN34", "EN34lw" (fields A-R, subsquares a-x).`);
  const qth = printable(p.qth, "qth", 32);
  const pota = str(p.myPotaRef, "myPotaRef").toUpperCase();
  if (pota !== "" && !/^[A-Z0-9]{1,4}-\d{4,5}(@[A-Z0-9-]{2,6})?$/.test(pota)) fail("myPotaRef", `${JSON.stringify(pota)} is not a POTA reference: "US-1234", "K-12345" or "GB-0001@GB-ENG".`);
  const qslMsg = printable(p.qslMsg, "qslMsg", 40);
  const accent = str(p.accentColor, "accentColor");
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) fail("accentColor", `${JSON.stringify(accent)} must be #rrggbb.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");

  return {
    stationCallsign, call, date, time, freq, band, mode, rst, grid, qth, pota, qslMsg,
    accent: accent.toLowerCase() as MosaicColor, debugLayout: p.debugLayout,
  };
}

/* ── colour ── */

function qslMix(a: string, b: string, t: number): MosaicColor {
  const ch = (s: string, i: number) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}
function qslLuminance(hex: string): number {
  const c = (i: number) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
/** The readable ink on the accent tag: the paper or the navy, whichever contrasts more with the caller's accent. */
function qslOnColor(fill: string): MosaicColor {
  const ratio = (other: string) => { const a = qslLuminance(fill), b = qslLuminance(other); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  return (ratio(INK) >= ratio(PAPER) ? INK : PAPER) as MosaicColor;
}

/* ── geometry ── */

export type QslRect = { x: number; y: number; w: number; h: number };
type Bind = Exclude<keyof QslCardProps, "debugLayout"> | null;
type Cell = { label: string; rect: QslRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; over: boolean };
type Tile = { label: string; rect: QslRect; color: MosaicColor; radius: number; bind?: "accentColor" };

/** The cell width a line needs at `px` under the fit rule (`cell * 0.94 - 2px`). */
function need(text: string, px: number, bold: boolean): number {
  return Math.ceil((widthOf(text, px, bold) + 2) / 0.94) + 1;
}
/** The largest whole size up to `maxPx` at which `widthAt(px)` is at most `room`. */
function largest(maxPx: number, room: number, widthAt: (px: number) => number): number {
  let px = Math.max(1, Math.round(maxPx));
  while (px > 1 && widthAt(px) > room) px--;
  return px;
}
/** One line in a cell: the largest size up to `maxPx` that fits the cell's budget. */
function fitPx(line: string, cellW: number, maxPx: number, bold: boolean): number {
  const top = Math.max(1, Math.round(maxPx)), room = budget(cellW), w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}

/** The six cells of the QSO table, in reading order. */
export const QSL_COLUMNS = ["date", "utc", "mhz", "band", "mode", "rst"] as const;
const COLUMN_LABEL: Record<(typeof QSL_COLUMNS)[number], string> = { date: "DATE", utc: "UTC", mhz: "MHz", band: "BAND", mode: "MODE", rst: "RST" };
const CONFIRM = "CONFIRMING OUR QSO";
const MARK = "ADIF QSO CARD";

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutQslCard(props: QslCardProps, W: number, H: number) {
  const p = normalizeQslCard(props);
  const S = Math.min(W, H), aspect = W / H;
  // The table reflows by aspect first; type shrinks only after that.
  const shape: "wide" | "square" | "tall" = aspect >= 1.25 ? "wide" : aspect >= 0.8 ? "square" : "tall";
  const grid = shape === "wide" ? { rows: 1, cols: 6 } : shape === "square" ? { rows: 2, cols: 3 } : { rows: 3, cols: 2 };
  const floor = Math.max(1, Math.round((S * 10) / 270));
  const unfit = (field: string): never => fail(field, `cannot be fitted on ${W}x${H} above the ${floor}px readability floor: shorten it or render a larger canvas.`);

  const barH = Math.max(2, Math.round(S * 0.022));
  const m = Math.round(S * 0.065), CW = W - 2 * m;
  const top = barH + Math.round(S * 0.045), bottom = H - Math.round(S * 0.05), CH = bottom - top;
  const gap = Math.round(S * 0.03);
  const rule = Math.max(1, Math.round(S / 400));
  const ruleColor = qslMix(PAPER, INK, 0.28);
  const fr = { wide: [0.4, 0.15, 0.31], square: [0.33, 0.19, 0.36], tall: [0.28, 0.17, 0.47] }[shape];
  const hh = Math.round(CH * fr[0]), sh = Math.round(CH * fr[1]), th = Math.round(CH * fr[2]), fh = CH - hh - sh - th;
  const headY = top, stripY = headY + hh, tableY = stripY + sh, footY = tableY + th;

  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const line = (label: string, rect: QslRect, text: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; over?: boolean; field?: string } = {}) => {
    if (px < floor) unfit(o.field ?? label);
    cells.push({ label, rect, text, px, width: widthOf(text, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? (INK as MosaicColor), bind: o.bind ?? null, over: o.over === true });
  };

  tiles.push({ label: "accent-bar", rect: { x: 0, y: 0, w: W, h: barH }, color: p.accent, radius: 0, bind: "accentColor" });

  // ── header: the station call, sized from its own text, and the station block ──
  type StationLine = { label: string; value: string; tag?: string; bind: Bind };
  const station: StationLine[] = [];
  if (p.grid !== "") station.push({ label: "station-grid", tag: "GRID", value: p.grid, bind: "myGridsquare" });
  if (p.qth !== "") station.push({ label: "station-qth", value: p.qth, bind: "qth" });
  if (p.pota !== "") station.push({ label: "station-pota", tag: "POTA", value: p.pota, bind: "myPotaRef" });
  const tagGap = (px: number) => Math.round(px * 0.3);
  const lineNeed = (l: StationLine, px: number) => need(l.value, px, false) + (l.tag ? need(l.tag, px, false) + tagGap(px) : 0);
  /** One station line drawn right- or left-aligned from `edge`: the tag in the dim ink, the value in the ink. */
  const stationLine = (l: StationLine, y: number, h: number, px: number, edge: number, align: "left" | "right") => {
    const vw = need(l.value, px, false), tw = l.tag ? need(l.tag, px, false) : 0;
    const valueX = align === "right" ? edge - vw : edge + (l.tag ? tw + tagGap(px) : 0);
    if (l.tag) line(`${l.label}-tag`, { x: align === "right" ? valueX - tagGap(px) - tw : edge, y, w: tw, h }, l.tag, px, { align, color: DIM as MosaicColor, field: l.bind as string });
    line(l.label, { x: valueX, y, w: vw, h }, l.value, px, { align, bind: l.bind, field: l.bind as string });
  };

  let callPx: number;
  if (shape === "wide") {
    // The call takes the left, the station block the right as right-aligned
    // lines; the block takes what its longest line needs (28-50% of the width).
    const lineTop = Math.max(floor, Math.min(Math.round(hh * 0.13), Math.round(S * 0.05))), lineH = Math.max(Math.round(hh * 0.21), Math.ceil(lineTop / 0.62));
    const stationW = station.length === 0 ? 0
      : Math.max(Math.round(CW * 0.28), Math.min(Math.round(CW * 0.5), Math.max(...station.map((l) => lineNeed(l, lineTop)))));
    const linePx = Math.min(lineTop, ...station.map((l) => largest(lineTop, stationW, (px) => lineNeed(l, px))));
    const callW = station.length === 0 ? CW : CW - stationW - gap;
    callPx = fitPx(p.stationCallsign, callW, hh * 0.72, true);
    line("callsign", { x: m, y: headY, w: callW, h: hh }, p.stationCallsign, callPx, { bold: true, bind: "stationCallsign", field: "stationCallsign" });
    const y0 = headY + Math.round((hh - station.length * lineH) / 2);
    station.forEach((l, i) => stationLine(l, y0 + i * lineH, lineH, linePx, m + CW, "right"));
  } else {
    // The call spans the width; the QTH and then GRID + POTA sit under it on one or two lines.
    const rows: StationLine[][] = [];
    if (p.qth !== "") rows.push(station.filter((l) => l.label === "station-qth"));
    const tagged = station.filter((l) => l.tag);
    if (tagged.length > 0) rows.push(tagged);
    const lineTop = Math.max(floor, Math.min(Math.round(hh * 0.1), Math.round(S * 0.05))), lineH = Math.ceil(lineTop / 0.62);
    const rowNeed = (row: StationLine[], px: number) => row.reduce((sum, l) => sum + lineNeed(l, px), 0) + (row.length - 1) * gap * 2;
    const linePx = Math.min(lineTop, ...rows.map((row) => largest(lineTop, CW, (px) => rowNeed(row, px))));
    const callMaxH = hh - rows.length * lineH;
    callPx = fitPx(p.stationCallsign, CW, callMaxH * 0.72, true);
    const callH = Math.min(callMaxH, Math.ceil(callPx / 0.72));
    const y0 = headY + Math.round((hh - callH - rows.length * lineH) / 2);
    line("callsign", { x: m, y: y0, w: CW, h: callH }, p.stationCallsign, callPx, { bold: true, bind: "stationCallsign", field: "stationCallsign" });
    rows.forEach((row, r) => {
      let x = m;
      for (const l of row) { stationLine(l, y0 + callH + r * lineH, lineH, linePx, x, "left"); x += lineNeed(l, linePx) + gap * 2; }
    });
  }

  // ── to-radio strip: the TO RADIO tag, the worked call (second largest), the confirmation ──
  tiles.push({ label: "rule-head", rect: { x: m, y: stripY, w: CW, h: rule }, color: ruleColor, radius: 0 });
  const tagPxOf = (px: number) => Math.max(floor, Math.round(px * 0.4));
  const chipPad = (tagPx: number) => Math.round(tagPx * 0.55);
  const chipW = (tagPx: number) => need("TO RADIO", tagPx, true) + 2 * chipPad(tagPx);
  const workedCap = Math.round(callPx * 0.62);
  const oneLineTop = Math.min(Math.round((sh - rule) * 0.5), workedCap);
  const oneLineW = (px: number) => chipW(tagPxOf(px)) + gap + need(p.call, px, true) + gap + need(CONFIRM, tagPxOf(px), false);
  const oneLinePx = largest(oneLineTop, CW, oneLineW);
  const twoLines = shape !== "wide" && oneLinePx < oneLineTop * 0.85;
  let workedPx: number;
  {
    const y = stripY + rule;
    const h2Min = twoLines ? Math.max(Math.round((sh - rule) * 0.4), Math.ceil(floor / 0.6)) : 0;
    const h1 = sh - rule - h2Min;
    workedPx = twoLines ? largest(Math.min(Math.round(h1 * 0.62), workedCap), CW, (px) => chipW(tagPxOf(px)) + gap + need(p.call, px, true)) : oneLinePx;
    const tagPx = tagPxOf(workedPx);
    const cw = chipW(tagPx), chipH = Math.round(tagPx * 1.9);
    const chip: QslRect = { x: m, y: y + Math.round((h1 - chipH) / 2), w: cw, h: chipH };
    tiles.push({ label: "to-radio-chip", rect: chip, color: p.accent, radius: 0.18 });
    line("to-radio", chip, "TO RADIO", tagPx, { bold: true, align: "center", color: qslOnColor(p.accent), over: true, field: "the TO RADIO tag" });
    const wx = m + cw + gap;
    line("worked-call", { x: wx, y, w: need(p.call, workedPx, true), h: h1 }, p.call, workedPx, { bold: true, bind: "call", field: "call" });
    if (twoLines) {
      const h2 = h2Min, cpx = Math.min(tagPx, fitPx(CONFIRM, CW, h2 * 0.6, false));
      line("confirm", { x: m, y: y + h1, w: need(CONFIRM, cpx, false), h: h2 }, CONFIRM, cpx, { color: DIM as MosaicColor, field: "the confirmation line" });
    } else {
      const cw2 = need(CONFIRM, tagPx, false);
      line("confirm", { x: m + CW - cw2, y, w: cw2, h: h1 }, CONFIRM, tagPx, { align: "right", color: DIM as MosaicColor, field: "the confirmation line" });
    }
  }

  // ── the QSO table: a label over a value per cell, columns weighted by what they hold ──
  const values: Record<(typeof QSL_COLUMNS)[number], { text: string; bind: Bind }> = {
    date: { text: p.date, bind: "qsoDate" }, utc: { text: p.time, bind: "timeOn" }, mhz: { text: p.freq, bind: "freq" },
    // BAND is derived from FREQ, so nothing binds it.
    band: { text: p.band, bind: null }, mode: { text: p.mode, bind: "mode" }, rst: { text: p.rst, bind: "rstSent" },
  };
  // The table starts a little below the strip, so its first label never reads as part of the line above.
  const tablePad = Math.round(S * 0.02), rowH = Math.floor((th - tablePad) / grid.rows);
  const labelH = Math.round(rowH * 0.3), accentRule = Math.max(1, Math.round(S / 300));
  const valueH = rowH - labelH - accentRule - Math.round(rowH * 0.06);
  const colGap = Math.round(S * 0.035);
  const cellsAt = (c: number) => QSL_COLUMNS.filter((_, i) => i % grid.cols === c);
  // Hierarchy: the station call is at least twice a table value, the worked call at least one.
  const valueTop = Math.min(Math.round(valueH * 0.7), Math.floor(callPx / 2), workedPx, Math.round(S * 0.11));
  const labelPxOf = (px: number) => Math.max(floor, Math.min(Math.round(labelH * 0.6), Math.round(px * 0.5)));
  const colNeed = (px: number) => Array.from({ length: grid.cols }, (_, c) =>
    Math.max(...cellsAt(c).map((k) => Math.max(need(values[k].text, px, true), need(COLUMN_LABEL[k], labelPxOf(px), false)))));
  const valuePx = largest(valueTop, CW, (px) => colNeed(px).reduce((a, b) => a + b, 0) + (grid.cols - 1) * colGap);
  if (valuePx < floor) unfit("the QSO table");
  const labelPx = labelPxOf(valuePx);
  const needs = colNeed(valuePx), sumNeed = needs.reduce((a, b) => a + b, 0);
  const spare = CW - sumNeed - (grid.cols - 1) * colGap;
  const colX: number[] = [], colW: number[] = [];
  let x = m;
  needs.forEach((n, c) => {
    // The spare width is shared equally, so the gutters read as one rhythm; the content weights the rest.
    const w = c === grid.cols - 1 ? m + CW - x : n + Math.floor(spare / grid.cols);
    colX.push(x); colW.push(w); x += w + colGap;
  });
  for (let r = 0; r < grid.rows; r++) {
    const ry = tableY + tablePad + r * rowH;
    tiles.push({ label: `label-rule-${r}`, rect: { x: m, y: ry + labelH, w: CW, h: accentRule }, color: p.accent, radius: 0 });
  }
  QSL_COLUMNS.forEach((k, i) => {
    const r = Math.floor(i / grid.cols), c = i % grid.cols, ry = tableY + tablePad + r * rowH;
    line(`col-label-${k}`, { x: colX[c], y: ry, w: colW[c], h: labelH }, COLUMN_LABEL[k], labelPx, { color: DIM as MosaicColor, field: "the QSO table labels" });
    line(`col-value-${k}`, { x: colX[c], y: ry + labelH + accentRule, w: colW[c], h: valueH }, values[k].text, valuePx, { bold: true, bind: values[k].bind, field: "the QSO table" });
  });

  // ── footer: QSLMSG on the left, the card's small mark on the right (dropped when it costs fit) ──
  tiles.push({ label: "rule-foot", rect: { x: m, y: footY, w: CW, h: rule }, color: ruleColor, radius: 0 });
  const fy = footY + rule, fH = fh - rule;
  const footTop = Math.max(floor, Math.min(Math.round(fH * 0.42), Math.round(S * 0.045)));
  const markPx = Math.max(floor, Math.round(footTop * 0.75));
  const markW = need(MARK, markPx, false);
  let showMark = true, msgPx = footTop;
  if (p.qslMsg !== "") {
    msgPx = fitPx(p.qslMsg, CW - markW - gap, footTop, false);
    if (msgPx < footTop * 0.85) { showMark = false; msgPx = fitPx(p.qslMsg, CW, footTop, false); }
    line("qslmsg", { x: m, y: fy, w: need(p.qslMsg, msgPx, false), h: fH }, p.qslMsg, msgPx, { bind: "qslMsg", field: "qslMsg" });
  }
  if (showMark) line("mark", { x: m + CW - markW, y: fy, w: markW, h: fH }, MARK, markPx, { align: "right", color: DIM as MosaicColor, field: "the card mark" });

  return { p, shape, grid, floor, cells, tiles, callPx, workedPx, valuePx, labelPx, twoLines, showMark, bands: { headY, stripY, tableY, footY, bottom } };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 14,
  "date": "2026-10-03",
  "agent": "claude",
  "model": "claude-opus-5-5",
  "id": "@one-a-day/community/qsl-card/v1",
  "title": "Ham Radio QSL Card",
  "who": "Ham radio operators who owe every station they worked a QSL card, gathered around their loggers (World Radio League, Wavelog, Log4OM) and POTA activators.",
  "problem": [
    "The World Radio League forum thread \"QSL Card Generator\" opens (57 likes) asking to \"select a template ... the appropriate information (other callsign/band/frequency/mode/time/report/etc.) would be auto populated ... a PNG or JPEG could be saved off\". A new licensee replies: \"struggling with putting together a card\".",
    "It is a batch job: \"Auto QSL Card\" asks for a card \"to all contacts made that day ... if I'm on a camping trip for 8 days\", and page 2 posts a Pillow script drawing text at hand-picked (x, y) points. Wavelog, DigiQSL and S53ZO's label tool take ADIF in, but none renders an image per QSO from a command line."
  ],
  "sources": [
    "https://community.worldradioleague.com/t/qsl-card-generator/13739",
    "https://community.worldradioleague.com/t/qsl-card-generator/13739?page=2",
    "https://community.worldradioleague.com/t/auto-qsl-card/",
    "https://www.adif.org/316/ADIF_316.htm",
    "https://github.com/s53zo/ADIF-to-QSL-label",
    "https://cq.sk/en/adif-to-qsl-label/",
    "https://docs.wavelog.org/user-guide/qsl/qsl-postcard-designer/",
    "https://digiqsl.com/features",
    "https://amateurradio.com/qsling-made-easy"
  ],
  "solution": [
    "One card per QSO from one ADIF record. The props are the ADIF fields in camelCase, in ADIF formats (qsoDate \"20261003\", timeOn \"1432\", freq \"14.074\"), printed the QSL way: 03 OCT 2026, 14:32. BAND is not a prop: it is derived from FREQ with the ADIF 3.1.6 band table, so the two never disagree.",
    "The decision that matters: a callsign is never ellipsized. The call is sized from its own text, the QSO table reflows 6x1, 3x2 or 2x3 by aspect before any type shrinks, and copy that cannot fit above the floor is refused with an error naming the prop. No photo background in v1: paper, one accent and type."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/community/qsl-card/v1 --template-repo . -w 1920 -h 1080 --props '{\"call\":\"DL1ABC\",\"freq\":\"7.074\",\"timeOn\":\"0915\"}' -o qsl-DL1ABC.png",
    "try": [
      "--props @qso.json, one file per ADIF record: a loop over the log writes one card per QSO",
      "-w 1650 -h 1050: the 5.5 x 3.5 in card at 300 dpi; -w 1080 -h 1080 or -h 1920 reflow the table to 3x2 or 2x3",
      "freq \"432.100\" prints BAND 70cm; freq \"27.185\" (CB) is refused: it is in no amateur band",
      "myPotaRef \"\", myGridsquare \"\": the lines and their prefixes go; accentColor \"#1f5fa8\" for a blue card"
    ]
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 187402,
        "calls": 29,
        "tokens": 2732923,
        "costUsd": 1.3,
        "tools": "Bash 16, WebSearch 11, ToolSearch 1"
      },
      {
        "name": "plan",
        "startMs": 187417,
        "durMs": 235946,
        "calls": 7,
        "tokens": 650247,
        "costUsd": 0.73,
        "tools": "Bash 6, Write 1"
      }
    ],
    "costBasis": "reported"
  },
  "caveats": [
    "No photo background in v1: the card is paper, one accent colour and type. Shack and park photos, the usual QSL face, are a later version.",
    "One QSO per card. It reads no .adi file: your script maps each ADIF record to the props and calls m0saic make once per QSO.",
    "RST_RCVD, QSL_VIA and the rig are not printed. BAND is always derived from FREQ, so a log whose BAND disagrees with its FREQ shows the FREQ band."
  ]
};

export const QslCardV1 = defineMosaicTemplate<QslCardProps>({
  id: asTemplateId(ID),
  label: "2026-10-03 · Ham Radio QSL Card",
  version: 1,
  description: "A ham radio QSL card for one contact, from one ADIF log record: props named after the ADIF fields, the date and time printed the QSL way, BAND derived from FREQ. Paper and type only, no photo background in v1.",
  capabilities: { tier: "core" },
  tags: ["community","2026-10-03","day-014", "ham-radio", "qsl", "adif", "card"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG, one card per QSO. The physical card is 5.5 x 3.5 in (1650x1050 at 300 dpi); portrait and square reflow the QSO table to 2x3 and 3x2. Minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default QslCardV1;

async function render(props: QslCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutQslCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  for (const t of L.tiles) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) } as MosaicSource, t.label);
    // The accent bar is the rect that shows `accentColor`.
    pieces.push({ rect: { ...t.rect, importance: 1 }, source: t.bind ? bindProp(tile, t.bind) : tile });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; derived copy (BAND, the labels, the chrome) is not.
    pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source: c.bind === null ? cell : bindProp(cell, c.bind) });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises: every text fits (above); the call in the top
  // half; all six QSO values present and in the table band; the footer at the
  // bottom; the accent bar across the card.
  constraints.push({ label: "callsign", within: { yFrac: [0, 0.5] } });
  for (const k of ["date", "utc", "mhz", "band", "mode", "rst"]) constraints.push({ label: `col-value-${k}`, within: { yFrac: [0.3, 0.92] } });
  if (L.cells.some((c) => c.label === "qslmsg")) constraints.push({ label: "qslmsg", within: { yFrac: [0.6, 1] } });
  constraints.push({ label: "accent-bar", minWidthFrac: 0.98 });
  constraints.push({ label: "worked-call" });

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    backgroundColor: PAPER as MosaicColor,
    sources: placed.sources,
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, debug: props.debugLayout === true });
}
