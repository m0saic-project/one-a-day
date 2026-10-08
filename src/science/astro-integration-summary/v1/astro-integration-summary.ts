import type {
  MosaicColor,
  MosaicDocument,
  MosaicEngineContext,
  MosaicSource,
  MosaicTextSource,
} from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import {
  bindProp,
  defineMosaicTemplate,
  definePropsSchema,
  makeColorTile,
  placeInsetPieces,
  resolvePinnedDurationMs,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf, wrapFit } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/science/astro-integration-summary/v1` - the integration summary
 * an astrophotographer types under every finished image ("Ha 128 x 180 s,
 * OIII 123 x 120 s, SII 105 x 180 s = 15.8 h"), drawn from the rows N.I.N.A.
 * already wrote: one bar per filter, built night by night, and a clip that
 * replays the nights.
 *
 * ONE CONCEPT: **the bars are the data, on ONE scale.** Bar length is that
 * filter's hours divided by the LARGEST filter's hours, fixed from the first
 * frame, so a bar only grows into its place and never rescales; each bar is
 * stacked from one segment per night (alternating two tints), so the nights
 * read as steps. Seconds are summed as whole integers and rounded once, for
 * display.
 *
 * The motion is data, not keyframes: night k lands at
 * `replayStart + replayLen * k / nights`. Everything that changes is a gated
 * overlay (`overlay.enable`): the segments and the ruler cells are colour
 * tiles in two mask-free child documents on 5-smooth canvases, the running
 * hours are drawtext layers (one source per filter, one for the total). The
 * clip opens and closes on the finished card, so it loops.
 *
 * The rule that bites: **the CSV is read for three columns only** -
 * FilterName, ExposureStartUTC, Duration - by header name; the ~30 others
 * are ignored. A new night starts when two consecutive frames are more than
 * six hours apart, so it does not depend on a time zone.
 */

export type AstroSessionInput = {
  /** The night, "YYYY-MM-DD". Rows of one night add up. */
  night?: string;
  /** The filter name as the wheel calls it ("Ha", "OIII", "L"). */
  filter?: string;
  /** Light frames kept, whole 1..9999. */
  frames?: number;
  /** Seconds per frame, whole 1..3600. */
  exposureSec?: number;
};

export type AstroIntegrationSummaryProps = {
  /** The target, header left (1-60 chars). */
  target?: string;
  /** The equipment line under it; "" drops it. */
  equipment?: string;
  /** Rows { night, filter, frames, exposureSec } (or that array as a JSON string). */
  sessions?: AstroSessionInput[] | string;
  /** A pasted NINA ImageMetaData.csv; when non-empty it replaces `sessions`. */
  csv?: string;
  /** Per-filter #rrggbb overrides, e.g. {"Ha":"#ff5533"}. */
  filterColors?: Record<string, string> | string;
  /** Clip length in whole seconds (4..60). */
  clipSec?: number;
  /** The bottom line; "" removes it. */
  footer?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/science/astro-integration-summary/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;

const MAX_NIGHTS = 30;
const MAX_FILTERS = 8;
const MAX_ROWS = 2000;
const MAX_CSV_ROWS = 60000;
const MIN_CLIP_SEC = 4;
const MAX_CLIP_SEC = 60;
/** A new night starts when two consecutive frames are further apart than this. */
const NIGHT_GAP_SEC = 6 * 3600;
/** drawtext draws in the machine's font, wider than the bundled Roboto the measurer knows. */
const DRAWTEXT_WIDEN = 1.15;
const MIN_PX = 7;
const LH = 1.2;

const DEFAULTS = {
  target: "IC 1396 Elephant's Trunk",
  equipment: "RedCat 51 - ASI2600MM Pro - HEQ5",
  clipSec: 12,
  footer: "Sample data: target and numbers are invented",
} as const;

/** Four invented nights: Ha 128 x 180 s = 6.4 h, OIII 123 x 120 s = 4.1 h, SII 105 x 180 s = 5.3 h, 15.8 h in all. */
export const ASTRO_DEFAULT_SESSIONS: ReadonlyArray<Readonly<AstroSessionInput>> = [
  { night: "2026-09-12", filter: "Ha", frames: 40, exposureSec: 180 },
  { night: "2026-09-12", filter: "OIII", frames: 30, exposureSec: 120 },
  { night: "2026-09-13", filter: "Ha", frames: 48, exposureSec: 180 },
  { night: "2026-09-13", filter: "SII", frames: 35, exposureSec: 180 },
  { night: "2026-09-19", filter: "OIII", frames: 45, exposureSec: 120 },
  { night: "2026-09-19", filter: "SII", frames: 40, exposureSec: 180 },
  { night: "2026-09-20", filter: "Ha", frames: 40, exposureSec: 180 },
  { night: "2026-09-20", filter: "OIII", frames: 48, exposureSec: 120 },
  { night: "2026-09-20", filter: "SII", frames: 30, exposureSec: 180 },
];

/* ── the page ── */

type Theme = {
  bg: MosaicColor;
  ink: MosaicColor;
  dim: MosaicColor;
  track: MosaicColor;
  cellOff: MosaicColor;
  cellOn: [MosaicColor, MosaicColor];
  now: MosaicColor;
  onNow: MosaicColor;
  /** Fraction of white mixed into the second tint of a filter colour. */
  tint: number;
};

const THEME: Theme = {
  bg: "#0d1522" as MosaicColor,
  ink: "#eaeef2" as MosaicColor,
  dim: "#8c9db0" as MosaicColor,
  track: "#18253a" as MosaicColor,
  cellOff: "#18253a" as MosaicColor,
  cellOn: ["#2f4a68" as MosaicColor, "#3b5a7d" as MosaicColor],
  now: "#3d7be0" as MosaicColor,
  onNow: "#ffffff" as MosaicColor,
  tint: 0.3,
};

/** Fixed filter colours (case-insensitive name match). Ha and SII are both reds: the name is always printed beside the bar. */
const FILTER_COLORS: Record<string, string> = {
  ha: "#ff5a36",
  sii: "#b0283f",
  oiii: "#19b5a5",
  l: "#c9d1d9",
  lum: "#c9d1d9",
  r: "#e5484d",
  g: "#3fb950",
  b: "#4c8dff",
};
/** Any other name takes the next colour from this cycle, in order of appearance. */
const FALLBACK_COLORS = ["#e3b341", "#a371f7", "#f778ba", "#79c0ff", "#7ee787", "#ffa657"];

/* ── the model ── */

type Entry = { night: number; filter: string; frames: number; sec: number; exp: number };
type Seg = { night: number; sec: number; cumSec: number };
type FilterRow = {
  name: string;
  color: MosaicColor;
  frames: number;
  sec: number;
  /** The one exposure length when every frame had it; null when they differ. */
  exposure: number | null;
  segs: Seg[];
};
type NightCol = { date: string; sec: number; cumSec: number; label: string; short: string };
type Model = { nights: NightCol[]; filters: FilterRow[]; totalSec: number; maxSec: number };

/** Hours with one decimal, rounded half up on whole seconds: 56 700 s -> "15.8". */
export function astroHoursText(sec: number): string {
  const tenths = Math.floor((sec * 10 + 1800) / 3600);
  return `${Math.floor(tenths / 10)}.${tenths % 10}`;
}

function captionFull(f: FilterRow): string {
  return f.exposure !== null ? `${f.frames} x ${f.exposure} s` : `${f.frames} frames`;
}

function captionShort(f: FilterRow): string {
  return `${f.frames} fr`;
}

function isCalendarDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

function cleanName(value: unknown, where: string): string {
  if (typeof value !== "string") throw new Error(`${ID}: ${where} filter must be a string.`);
  const s = value.replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
  if (s.length === 0) throw new Error(`${ID}: ${where} filter is empty.`);
  if (s.length > 24) throw new Error(`${ID}: ${where} filter "${s}" is longer than 24 characters.`);
  return s;
}

function colorFor(name: string, overrides: Map<string, MosaicColor>, fallbackIndex: { n: number }): MosaicColor {
  const key = name.toLowerCase();
  const over = overrides.get(key);
  if (over) return over;
  const fixed = FILTER_COLORS[key];
  if (fixed) return fixed as MosaicColor;
  const c = FALLBACK_COLORS[fallbackIndex.n % FALLBACK_COLORS.length];
  fallbackIndex.n += 1;
  return c as MosaicColor;
}

/** Entries -> the model. Entries arrive in the order the filters should first appear. */
function buildModel(nightDates: string[], entries: Entry[], overrides: Map<string, MosaicColor>): Model {
  if (entries.length === 0 || nightDates.length === 0) throw new Error(`${ID}: there is no data - give at least one frame.`);
  if (nightDates.length > MAX_NIGHTS) throw new Error(`${ID}: ${nightDates.length} nights; at most ${MAX_NIGHTS}.`);
  const order: string[] = [];
  const agg = new Map<string, { name: string; frames: number; sec: number; exps: Set<number>; nights: number[] }>();
  for (const e of entries) {
    const key = e.filter.toLowerCase();
    let a = agg.get(key);
    if (!a) {
      a = { name: e.filter, frames: 0, sec: 0, exps: new Set(), nights: new Array(nightDates.length).fill(0) };
      agg.set(key, a);
      order.push(key);
    }
    a.frames += e.frames;
    a.sec += e.sec;
    a.exps.add(e.exp);
    a.nights[e.night] += e.sec;
  }
  if (order.length > MAX_FILTERS) throw new Error(`${ID}: ${order.length} filters; at most ${MAX_FILTERS}.`);
  const fallback = { n: 0 };
  const filters: FilterRow[] = order.map((key) => {
    const a = agg.get(key)!;
    let cum = 0;
    const segs: Seg[] = [];
    a.nights.forEach((sec, night) => {
      if (sec > 0) {
        cum += sec;
        segs.push({ night, sec, cumSec: cum });
      }
    });
    return {
      name: a.name,
      color: colorFor(a.name, overrides, fallback),
      frames: a.frames,
      sec: a.sec,
      exposure: a.exps.size === 1 ? [...a.exps][0] : null,
      segs,
    };
  });
  const nightSec = nightDates.map((_, i) => filters.reduce((s, f) => s + (f.segs.find((g) => g.night === i)?.sec ?? 0), 0));
  let cum = 0;
  const nights: NightCol[] = nightDates.map((date, i) => {
    cum += nightSec[i];
    return { date, sec: nightSec[i], cumSec: cum, label: `N${i + 1} ${date.slice(5)}`, short: `N${i + 1}` };
  });
  const totalSec = cum;
  const maxSec = Math.max(...filters.map((f) => f.sec));
  return { nights, filters, totalSec, maxSec };
}

/** The `sessions` prop -> the model. A bad row is refused by number. */
export function astroModelFromSessions(value: unknown, overrides: Map<string, MosaicColor>): Model {
  let v: unknown = value;
  if (v === undefined) v = ASTRO_DEFAULT_SESSIONS;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      throw new Error(`${ID}: sessions is not valid JSON - pass an array of { night, filter, frames, exposureSec }.`);
    }
  }
  if (!Array.isArray(v)) throw new Error(`${ID}: sessions must be an array of { night, filter, frames, exposureSec }.`);
  if (v.length === 0) throw new Error(`${ID}: sessions is empty - give at least one row.`);
  if (v.length > MAX_ROWS) throw new Error(`${ID}: sessions has ${v.length} rows; at most ${MAX_ROWS}.`);
  const rows = v.map((row, i) => {
    const where = `sessions[${i}]`;
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`${ID}: ${where} must be an object { night, filter, frames, exposureSec }.`);
    const o = row as AstroSessionInput;
    if (typeof o.night !== "string" || !isCalendarDate(o.night)) throw new Error(`${ID}: ${where}.night must be a calendar date "YYYY-MM-DD". Got ${JSON.stringify(o.night)}.`);
    const frames = o.frames;
    if (typeof frames !== "number" || !Number.isInteger(frames) || frames < 1 || frames > 9999) throw new Error(`${ID}: ${where}.frames must be a whole number 1..9999. Got ${JSON.stringify(frames)}.`);
    const exp = o.exposureSec;
    if (typeof exp !== "number" || !Number.isInteger(exp) || exp < 1 || exp > 3600) throw new Error(`${ID}: ${where}.exposureSec must be a whole number 1..3600. Got ${JSON.stringify(exp)}.`);
    return { night: o.night, filter: cleanName(o.filter, where), frames, exp };
  });
  const dates = [...new Set(rows.map((r) => r.night))].sort();
  const entries: Entry[] = rows.map((r) => ({ night: dates.indexOf(r.night), filter: r.filter, frames: r.frames, sec: r.frames * r.exp, exp: r.exp }));
  return buildModel(dates, entries, overrides);
}

/** RFC-4180-ish rows: commas, double quotes, CRLF or LF. */
export function astroParseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      rows.push(row);
      row = [];
    } else cur += ch;
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const TS = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z?$/;

/** A NINA ImageMetaData.csv -> the model: three columns read, a night = a run of frames with no 6 h gap. */
export function astroModelFromCsv(csv: string, overrides: Map<string, MosaicColor>): Model {
  const table = astroParseCsv(csv);
  if (table.length === 0) throw new Error(`${ID}: csv is empty.`);
  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => {
    const i = header.indexOf(name.toLowerCase());
    if (i < 0) throw new Error(`${ID}: csv has no "${name}" column (the header row is ${JSON.stringify(table[0].map((h) => h.trim()).slice(0, 12))}${table[0].length > 12 ? " ..." : ""}).`);
    return i;
  };
  const iFilter = col("FilterName");
  const iStart = col("ExposureStartUTC");
  const iDur = col("Duration");
  if (table.length - 1 > MAX_CSV_ROWS) throw new Error(`${ID}: csv has ${table.length - 1} rows; at most ${MAX_CSV_ROWS}.`);
  const frames: Array<{ t: number; filter: string; dur: number; date: string }> = [];
  table.slice(1).forEach((cells, k) => {
    const rowNo = k + 2;
    if (cells.every((c) => c.trim() === "")) return;
    const where = `csv row ${rowNo}`;
    const rawTs = (cells[iStart] ?? "").trim();
    const m = TS.exec(rawTs);
    if (!m) throw new Error(`${ID}: ${where}: ExposureStartUTC ${JSON.stringify(rawTs)} is not "YYYY-MM-DD HH:MM:SS" (a "T" or a fraction is fine).`);
    const date = `${m[1]}-${m[2]}-${m[3]}`;
    if (!isCalendarDate(date)) throw new Error(`${ID}: ${where}: ExposureStartUTC ${JSON.stringify(rawTs)} is not a calendar date.`);
    const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])) / 1000;
    const dur = Number((cells[iDur] ?? "").trim());
    const sec = Math.round(dur);
    if (!Number.isFinite(dur) || sec < 1 || sec > 3600) throw new Error(`${ID}: ${where}: Duration ${JSON.stringify((cells[iDur] ?? "").trim())} must be seconds between 1 and 3600.`);
    const raw = (cells[iFilter] ?? "").trim();
    frames.push({ t, filter: raw === "" ? "None" : cleanName(raw, where), dur: sec, date });
  });
  if (frames.length === 0) throw new Error(`${ID}: csv has a header and no frame rows.`);
  frames.sort((a, b) => a.t - b.t);
  const dates: string[] = [];
  const entries: Entry[] = [];
  let prev = Number.NEGATIVE_INFINITY;
  for (const f of frames) {
    if (f.t - prev > NIGHT_GAP_SEC) dates.push(f.date);
    prev = f.t;
    entries.push({ night: dates.length - 1, filter: f.filter, frames: 1, sec: f.dur, exp: f.dur });
  }
  return buildModel(dates, entries, overrides);
}

/* ── beats ── */

type Beats = { clip: number; hook: number; start: number; end: number; lands: number[] };

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** The first 6% is the finished card, 6-14% the reset, 14-82% the replay (night k at its share), the rest the finished card again. */
export function astroBeatsOf(clipSec: number, nights: number): Beats {
  const hook = round3(clipSec * 0.06);
  const start = round3(clipSec * 0.14);
  const end = round3(clipSec * 0.82);
  const lands = Array.from({ length: nights }, (_, k) => round3(start + ((end - start) * k) / nights));
  return { clip: clipSec, hook, start, end, lands };
}

/** Shown in the cold open and from `at` on: ONE gate for two windows, so no `window` twin. */
function openAndFrom(hook: number, at: number): string {
  return `lt(t,${hook})+gte(t,${at})`;
}

/* ── geometry ── */

type Rect = { x: number; y: number; w: number; h: number };
type Fit = { text: string; px: number; width: number };
type Block = { lines: string[]; px: number; width: number };

function fiveSmoothDown(n: number): number {
  for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
    let m = v;
    for (const p of [2, 3, 5]) while (m % p === 0) m /= p;
    if (m === 1) return v;
  }
  return 1;
}

/** A rect of `w0 x h0` shrunk to 5-smooth sides and centred where it was. */
function smoothRect(x: number, y: number, w0: number, h0: number): Rect {
  const w = fiveSmoothDown(w0);
  const h = fiveSmoothDown(h0);
  return { x: x + Math.floor((w0 - w) / 2), y: y + Math.floor((h0 - h) / 2), w, h };
}

/** One line shrunk until it fits `maxW`; null when it does not fit even at `minPx`. */
function fitOne(text: string, maxW: number, maxPx: number, minPx: number, bold = false): Fit | null {
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && widthOf(text, px, bold) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
  const width = widthOf(text, px, bold);
  return width > maxW ? null : { text, px, width };
}

/** A drawtext string's width: measured in the bundled bold (the wider face), widened for the system font. */
function drawWidth(text: string, px: number): number {
  return widthOf(text, px, true) * DRAWTEXT_WIDEN;
}

/** The largest size at which a drawtext string fits `maxW` x `maxH`. */
function fitDraw(sample: string, maxW: number, maxH: number, maxPx: number): Fit {
  let px = Math.max(MIN_PX, Math.round(Math.min(maxPx, maxH / LH)));
  while (px > MIN_PX && drawWidth(sample, px) > maxW) px = Math.max(MIN_PX, Math.round(px * 0.92));
  return { text: sample, px, width: drawWidth(sample, px) };
}

/**
 * A title: one line down to 70% of `maxPx`, then up to two lines, shrinking to
 * the box. Never an ellipsis.
 */
function titleBlock(text: string, w: number, h: number, maxPx: number, bold: boolean): Block {
  const maxW = budget(w);
  const widest = (lines: string[], px: number) => Math.max(...lines.map((l) => widthOf(l, px, bold)));
  let px = Math.max(MIN_PX, Math.round(Math.min(maxPx, h / LH)));
  const floorOne = Math.max(MIN_PX, Math.round(px * 0.7));
  for (; px >= floorOne; px = Math.round(px * 0.94)) {
    if (widthOf(text, px, bold) <= maxW) return { lines: [text], px, width: widthOf(text, px, bold) };
    if (px === MIN_PX) break;
  }
  px = Math.max(MIN_PX, Math.min(floorOne, Math.floor(h / (2 * LH))));
  for (;;) {
    const lines = wrapFit(text, px, maxW);
    if ((lines.length <= 2 && widest(lines, px) <= maxW && lines.length * px * LH <= h) || px <= MIN_PX) {
      return { lines, px, width: widest(lines, px) };
    }
    px = Math.max(MIN_PX, Math.floor(px * 0.94));
  }
}

type ChartLayout = {
  W: number;
  H: number;
  stacked: boolean;
  title: { rect: Rect; block: Block };
  equipment: { rect: Rect; fit: Fit } | null;
  total: { rect: Rect; fit: Fit };
  totalLabel: { rect: Rect; fit: Fit };
  /** The tracks' child canvas in the parent (5-smooth both sides) and its row geometry. */
  chart: Rect;
  rowH: number;
  trackY: number;
  trackH: number;
  trackW: number;
  trackX: number;
  names: Array<{ rect: Rect; fit: Fit }>;
  captions: Array<{ rect: Rect; fit: Fit }> | null;
  values: Array<Rect>;
  valuePx: number;
  valueSample: string;
  valueWidth: number;
  ruler: Rect;
  cells: Rect[];
  labels: Array<{ rect: Rect; fit: Fit } | null>;
  footer: { rect: Rect; fit: Fit } | null;
};

export function astroLayout(model: Model, props: { target: string; equipment: string; footer: string }, W: number, H: number): ChartLayout {
  const stacked = W < H * 1.3;
  const U = stacked ? Math.min(H, 0.9 * W) : H;
  const mx = Math.round(0.03 * W);
  const cw = W - 2 * mx;
  const n = model.filters.length;

  // ── header ──
  let titleRect: Rect;
  let equipRect: Rect;
  let totalRect: Rect;
  let totalLabelRect: Rect;
  const totalText = `${astroHoursText(model.totalSec)} h`;
  const totalSample = totalText.replace(/\d/g, "8");
  if (!stacked) {
    const titleW = Math.round(0.62 * W);
    titleRect = { x: mx, y: Math.round(0.035 * H), w: titleW, h: Math.round(0.095 * H) };
    equipRect = { x: mx, y: Math.round(0.14 * H), w: titleW, h: Math.round(0.05 * H) };
    const tw = Math.round(0.28 * W);
    totalRect = { x: W - mx - tw, y: Math.round(0.025 * H), w: tw, h: Math.round(0.115 * H) };
    totalLabelRect = { x: W - mx - tw, y: Math.round(0.145 * H), w: tw, h: Math.round(0.04 * H) };
  } else {
    // stacked canvases size the header by U (the narrow side), not by H: a tall canvas would drift it apart
    titleRect = { x: mx, y: Math.round(0.025 * U), w: cw, h: Math.round(0.085 * U) };
    equipRect = { x: mx, y: titleRect.y + titleRect.h, w: cw, h: Math.round(0.04 * U) };
    const tw = Math.round(0.5 * cw);
    const ty = equipRect.y + equipRect.h + Math.round(0.01 * U);
    totalRect = { x: W - mx - tw, y: ty, w: tw, h: Math.round(0.09 * U) };
    totalLabelRect = { x: mx, y: ty, w: cw - tw, h: Math.round(0.09 * U) };
  }
  const title = { rect: titleRect, block: titleBlock(props.target.toUpperCase(), titleRect.w, titleRect.h, 0.07 * U, true) };
  const equipFit = props.equipment === "" ? null : fitOne(props.equipment, budget(equipRect.w), 0.034 * U, MIN_PX);
  const equipment = equipFit ? { rect: equipRect, fit: equipFit } : null;
  const totalFit = fitDraw(totalSample, budget(totalRect.w), totalRect.h, 0.11 * U);
  const labelFit = fitOne("TOTAL INTEGRATION", budget(totalLabelRect.w), 0.032 * U, MIN_PX, true) ?? { text: "TOTAL", px: MIN_PX, width: widthOf("TOTAL", MIN_PX, true) };

  // ── the tracks' child canvas ──
  const chartTop = stacked ? totalRect.y + totalRect.h + Math.round(0.03 * U) : Math.round(0.215 * H);
  const chartBottom = Math.round(0.775 * H);
  const rowCap = Math.round((stacked ? 0.28 : 0.17) * U);
  const rowH0 = Math.max(4, Math.min(Math.floor((chartBottom - chartTop) / n), rowCap));
  const gapX = Math.round(0.015 * cw);

  // value column
  const valueSample = model.filters.reduce((s, f) => {
    const t = `${astroHoursText(f.sec)} h`.replace(/\d/g, "8");
    return t.length > s.length ? t : s;
  }, "8.8 h");
  const valueW = Math.round((stacked ? 0.26 : 0.14) * cw);

  // name column: as wide as the longest name wants, within a band
  const longest = model.filters.reduce((s, f) => (f.name.length > s.length ? f.name : s), "");
  const slotName = stacked ? 0.46 * rowH0 : 0.5 * rowH0;
  const namePxMax = Math.max(MIN_PX, Math.round(Math.min((stacked ? 0.048 : 0.042) * U, slotName / LH)));
  const [nameLo, nameHi] = stacked ? [0.2, 0.44] : [0.12, 0.3];
  const wantW = widthOf(longest, namePxMax, true) / 0.94 + 4;
  const nameW = Math.round(Math.max(nameLo * cw, Math.min(nameHi * cw, wantW)));
  const namePx = fitOne(longest, budget(nameW), namePxMax, MIN_PX, true)?.px ?? MIN_PX;

  let chartRaw: Rect;
  if (!stacked) {
    const x = mx + nameW + gapX;
    const w = W - mx - valueW - gapX - x;
    chartRaw = { x, y: 0, w, h: n * rowH0 };
  } else {
    chartRaw = { x: mx, y: 0, w: cw, h: n * rowH0 };
  }
  const blockY = chartTop + Math.floor((chartBottom - chartTop - chartRaw.h) / 2);
  const chart = smoothRect(chartRaw.x, blockY, chartRaw.w, chartRaw.h);
  const rowH = Math.max(1, Math.floor(chart.h / n));
  const trackH = stacked ? Math.max(2, Math.round(rowH * 0.34)) : Math.max(2, Math.min(Math.round(rowH * 0.56), Math.round(0.09 * U)));
  const trackY = stacked ? Math.round(rowH * 0.5) : Math.round((rowH - trackH) / 2);
  const rowTop = (i: number) => chart.y + i * rowH;

  // captions: full -> short -> none, one level for all rows
  const capSlotH = stacked ? Math.round(0.46 * rowH) : Math.round(0.34 * rowH);
  const capW = stacked ? Math.max(8, cw - nameW - valueW - 2 * gapX) : nameW;
  const capMaxPx = Math.round(Math.min((stacked ? 0.034 : 0.024) * U, capSlotH / LH));
  let captions: ChartLayout["captions"] = null;
  for (const pick of [captionFull, captionShort]) {
    const widest = model.filters.reduce((s, f) => (pick(f).length > s.length ? pick(f) : s), "");
    const fit = fitOne(widest, budget(capW), capMaxPx, MIN_PX + 1);
    if (!fit) continue;
    captions = model.filters.map((f, i) => {
      const text = pick(f);
      const y = stacked ? rowTop(i) : rowTop(i) + Math.round(0.58 * rowH);
      const x = stacked ? mx + nameW + gapX : mx;
      return { rect: { x, y, w: capW, h: capSlotH }, fit: { text, px: fit.px, width: widthOf(text, fit.px) } };
    });
    break;
  }

  const names = model.filters.map((f, i) => {
    const h = stacked ? Math.round(0.46 * rowH) : captions ? Math.round(0.5 * rowH) : rowH;
    const y = stacked ? rowTop(i) : captions ? rowTop(i) + Math.round(0.06 * rowH) : rowTop(i);
    return { rect: { x: mx, y, w: nameW, h }, fit: { text: f.name, px: namePx, width: widthOf(f.name, namePx, true) } };
  });

  const valueSlotH = stacked ? Math.round(0.46 * rowH) : rowH;
  const valueFit = fitDraw(valueSample, budget(valueW), valueSlotH, (stacked ? 0.058 : 0.05) * U);
  const values = model.filters.map((_, i) => ({ x: W - mx - valueW, y: rowTop(i), w: valueW, h: valueSlotH }));

  // ── the ruler ──
  const rulerRaw: Rect = { x: mx, y: Math.round(0.8 * H), w: cw, h: Math.round((stacked ? 0.055 : 0.07) * H) };
  const ruler = smoothRect(rulerRaw.x, rulerRaw.y, rulerRaw.w, rulerRaw.h);
  const gap = Math.max(1, Math.round(ruler.w * 0.002));
  const total = Math.max(1, model.totalSec);
  const bounds = model.nights.map((_, i) => Math.round((ruler.w * (i === 0 ? 0 : model.nights[i - 1].cumSec)) / total));
  bounds.push(ruler.w);
  const cells: Rect[] = model.nights.map((_, i) => {
    const x0 = bounds[i] + (i > 0 ? Math.ceil(gap / 2) : 0);
    const x1 = bounds[i + 1] - (i < model.nights.length - 1 ? Math.floor(gap / 2) : 0);
    return { x: x0, y: 0, w: Math.max(1, x1 - x0), h: ruler.h };
  });
  const labelMaxPx = Math.round(Math.min(0.034 * U, ruler.h / (LH + 0.15)));
  const labels = model.nights.map((nt, i) => {
    const c = cells[i];
    const root = { x: ruler.x + c.x, y: ruler.y, w: c.w, h: ruler.h };
    if (model.nights.length > 12 && i !== 0 && i !== model.nights.length - 1) return null;
    for (const text of [nt.label, nt.short]) {
      if (model.nights.length > 12 && text === nt.label) continue;
      const fit = fitOne(text, budget(c.w), labelMaxPx, MIN_PX, true);
      if (fit && fit.px >= Math.min(labelMaxPx, MIN_PX + 1)) return { rect: root, fit };
    }
    return null;
  });

  // ── the footer ──
  const footRect: Rect = { x: mx, y: Math.round(0.895 * H), w: cw, h: Math.round(0.05 * H) };
  const footFit = props.footer === "" ? null : fitOne(props.footer, budget(footRect.w), Math.min(0.028 * U, footRect.h / LH), MIN_PX);

  return {
    W,
    H,
    stacked,
    title,
    equipment,
    total: { rect: totalRect, fit: totalFit },
    totalLabel: { rect: totalLabelRect, fit: labelFit },
    chart,
    rowH,
    trackY,
    trackH,
    trackW: chart.w,
    trackX: 0,
    names,
    captions,
    values,
    valuePx: valueFit.px,
    valueSample,
    valueWidth: valueFit.width,
    ruler,
    cells,
    labels,
    footer: footFit ? { rect: footRect, fit: footFit } : null,
  };
}

/** The shared scale: where a cumulative `sec` ends on a track, rounded per boundary (never summed widths). */
export function astroTrackEdge(sec: number, maxSec: number, trackW: number): number {
  return Math.round((trackW * sec) / maxSec);
}

/* ── colours ── */

function mixWith(a: MosaicColor, b: string, t: number): MosaicColor {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t);
  const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bl = ch(pa & 255, pb & 255);
  return ("#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)) as MosaicColor;
}

/* ── the contract ── */

function layoutContract(L: ChartLayout): LayoutConstraint[] {
  const out: LayoutConstraint[] = [
    textFitsMeasured("title", L.title.block.lines.join("\n"), L.title.block.px, L.title.block.width),
    textFitsMeasured("total", L.total.fit.text, L.total.fit.px, L.total.fit.width),
    textFitsMeasured("total-label", L.totalLabel.fit.text, L.totalLabel.fit.px, L.totalLabel.fit.width),
    ...L.names.map((n, i) => textFitsMeasured(`filter-name-${i}`, n.fit.text, n.fit.px, n.fit.width)),
    textFitsMeasured("filter-value", L.valueSample, L.valuePx, L.valueWidth),
    { label: "title", within: { yFrac: [0, 0.3] } },
    { label: "total", within: { yFrac: [0, 0.3] } },
    { label: "bar-track" },
    { label: "night-ruler", within: { yFrac: [0.6, 1] }, minWidthFrac: 0.85 },
  ];
  if (L.equipment) out.push(textFitsMeasured("equipment", L.equipment.fit.text, L.equipment.fit.px, L.equipment.fit.width));
  if (L.captions) L.captions.forEach((c, i) => out.push(textFitsMeasured(`filter-caption-${i}`, c.fit.text, c.fit.px, c.fit.width)));
  L.labels.forEach((l, k) => { if (l) out.push(textFitsMeasured(`night-label-${k}`, l.fit.text, l.fit.px, l.fit.width)); });
  if (L.footer) {
    out.push(textFitsMeasured("footer", L.footer.fit.text, L.footer.fit.px, L.footer.fit.width));
    out.push({ label: "footer", within: { yFrac: [0.6, 1] } });
  }
  return out;
}

/** Tracks are exactly one height by construction; the realized FRAMES are divisor-pitch cells (the tile is inset-recovered inside), so the check gets a few pixels of room. */
const trackRelations: RelationalConstraint[] = [{ label: "bar-track", equal: "height", tolerance: 0.08, tolerancePx: 4 }];

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-10-08/.
 */
const WHY: WhySpec = {
  "day": 19,
  "date": "2026-10-08",
  "agent": "claude",
  "model": "claude-sonnet-5-5",
  "id": "@one-a-day/science/astro-integration-summary/v1",
  "title": "Astro Integration Summary",
  "who": "Deep-sky astrophotographers who run unattended N.I.N.A. imaging nights and post each image with its acquisition numbers (AstroBin was not read).",
  "problem": [
    "Every finished image is posted with typed numbers. An observatory page lists \"RGBHaSIIOIII = 360:340:335:725:720:715 (53.25hours)\"; another gives \"SII 15 x 10 min., Ha 10 x 10 min., OIII 20 x 10 min.\" in a prose block.",
    "The numbers already exist: the NINA Session Metadata plugin writes one ImageMetaData.csv row per frame, since NINA's own FITS headers are \"not really convenient to access for a set of images\". Other tools read NINA output; one imager built a log analyzer for the overnight NINA log, which is \"hard-to-read\".",
    "No thread asking for this exact picture was found, and AstroBin could not be read: the demand is inferred from the hand-typed blocks."
  ],
  "sources": [
    "https://github.com/tcpalmer/nina.plugin.sessionmetadata",
    "https://www.ideviceapps.de/NINAImageAnalysisHandbook/",
    "https://scopetrader.com/nina-log-analyzer/",
    "https://skycenter.arizona.edu/astrophotography/m57-ring-nebula",
    "https://sdspacegrant.sdsmt.edu/PacmanNebula-RichardWalker.htm"
  ],
  "solution": [
    "The CSV is the prop. Paste ImageMetaData.csv into csv (only FilterName, ExposureStartUTC and Duration are read) or pass rows of { night, filter, frames, exposureSec }. One bar per filter on ONE scale fixed from the first frame, each bar stacked from a segment per night.",
    "The clip opens on the finished card, lets the nights land in order with a running total, and ends where it began. Seconds are summed whole and rounded once for display; a dual-band filter is counted as named, never split.",
    "Weak spots: no image, the filter colours are a taste call, and a night is any run of frames with no 6 h gap."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/science/astro-integration-summary/v1 --template-repo . -w 1920 -h 1080 -o summary.mp4",
    "try": [
      "--props @props.json with {\"csv\": \"<your ImageMetaData.csv>\"} - your own nights",
      "sessions - rows of { night, filter, frames, exposureSec } typed by hand",
      "filterColors {\"Ha\":\"#ff5533\"} for your palette; footer \"\" drops the invented-data line",
      "-w 1080 -h 1920 for a story; --durationMs 8000 for a shorter clip"
    ]
  },
  "caveats": [
    "Demand is inferred from hand-typed blocks, not quoted from a thread asking for this picture.",
    "Dual-band filters are counted as named (one row each); nothing is split into channels.",
    "The hours are drawtext in the machine's font; pixels are deterministic per machine only."
  ],
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 262206,
        "calls": 37,
        "tokens": 3491066,
        "costUsd": 1,
        "tools": "Bash 16, WebSearch 16, WebFetch 2"
      },
      {
        "name": "plan",
        "startMs": 262221,
        "durMs": 96821,
        "calls": 9,
        "tokens": 715366,
        "costUsd": 0.36,
        "tools": "Bash 7, Edit 1, Write 1"
      },
      {
        "name": "build",
        "startMs": 359087,
        "durMs": 2048708,
        "calls": 65,
        "tokens": 18065570,
        "costUsd": 3.64,
        "tools": "Bash 48, Read 14, Write 2"
      },
      {
        "name": "critique",
        "startMs": 2407816,
        "durMs": 112241,
        "calls": 21,
        "tokens": 1994385,
        "costUsd": 0.54,
        "tools": "Read 13, Bash 8"
      }
    ],
    "costBasis": "reported"
  }
};

/* ── props ── */

const propsSchema = definePropsSchema<AstroIntegrationSummaryProps>({
  target: {
    type: "string",
    required: false,
    description: "The target, header left, in capitals (1-60 characters). Long names shrink to 70% and then take two lines.",
    meta: { control: { placeholder: DEFAULTS.target }, ui: { label: "Target", order: 1, primary: true } },
  },
  equipment: {
    type: "string",
    required: false,
    description: "The equipment line under the target, typed by hand (AcquisitionDetails.csv differs per rig). Empty drops the line.",
    meta: { control: { placeholder: DEFAULTS.equipment }, ui: { label: "Equipment", order: 2 } },
  },
  sessions: {
    type: "json",
    required: false,
    description:
      'Rows { night: "YYYY-MM-DD", filter: "Ha", frames: 40, exposureSec: 180 }: up to 30 nights and 8 filters; rows of one night and filter add up. Filter names are taken as given (a dual-band filter is its own row, never split). Replaced by csv when csv is not empty.',
    meta: {
      constraints: {
        jsonSchema: {
          type: "array",
          minItems: 1,
          maxItems: MAX_ROWS,
          items: { type: "object", properties: { night: { type: "string" }, filter: { type: "string" }, frames: { type: "number" }, exposureSec: { type: "number" } } },
        },
      },
      ui: { label: "Sessions", order: 3, primary: true },
    },
  },
  csv: {
    type: "string",
    required: false,
    description:
      "Paste a NINA Session Metadata ImageMetaData.csv (the whole file). Only FilterName, ExposureStartUTC and Duration are read, by header name; a new night starts after a 6 h gap between frames, dated by the UTC date of its first frame. When set it replaces sessions.",
    meta: { control: { multiline: true, mono: true, placeholder: "ExposureNumber,FilterName,ExposureStartUTC,Duration,..." }, ui: { label: "ImageMetaData.csv", order: 4 } },
  },
  filterColors: {
    type: "json",
    required: false,
    description: 'Per-filter colour overrides, e.g. {"Ha":"#ff5533"} (name match is case-insensitive). Other filters keep the fixed palette.',
    meta: { constraints: { jsonSchema: { type: "object", additionalProperties: { type: "string" } } }, ui: { label: "Filter colours", order: 5 } },
  },
  clipSec: {
    type: "number",
    required: false,
    description: "Clip length in whole seconds (4..60): 6% opens on the finished card, then the nights land in order, and the clip ends on the same card. An explicit duration pin overrides it and becomes the clip.",
    meta: { constraints: { min: MIN_CLIP_SEC, max: MAX_CLIP_SEC }, ui: { label: "Clip seconds", order: 6 } },
  },
  footer: {
    type: "string",
    required: false,
    description: "The bottom line. The default admits the numbers are invented; set your own, or empty to remove it.",
    meta: { control: { placeholder: DEFAULTS.footer }, ui: { label: "Footer", order: 7 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the ruler and footer sit in the bottom band) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

function numberOr(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

/**
 * Props with no rect to bind, and why (m0saic doctor's `bindingsDeclared`;
 * the template type this repo builds against predates the field, so it is
 * spread in).
 */
const UNBOUND = {
  bindings: {
    unbound: {
      sessions: "source: every bar, segment, ruler cell and total is derived from the rows; no single rect shows them",
      csv: "source: parsed into sessions; nothing on the card shows the raw text",
      filterColors: "palette: recolours bars and legend swatches, which are drawn from the filter names",
      clipSec: "timing",
    },
  },
};

export const AstroIntegrationSummaryV1 = defineMosaicTemplate<AstroIntegrationSummaryProps>({
  ...UNBOUND,
  id: asTemplateId(ID),
  label: "2026-10-08 · Astro Integration Summary",
  version: 1,
  description: "Per-filter integration hours from NINA session data: night-stacked bars, ruler and running total that replay night by night.",
  capabilities: { tier: "core" },
  tags: ["science", "2026-10-08", "day-019", "astrophotography", "nina", "integration", "filters", "acquisition", "video"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: DEFAULTS.clipSec * 1000,
    format: { kind: "video", container: "mp4" },
    note: "A 12 s clip: the finished card, the nights landing in order, the finished card again. 1080x1920 and 1080x1080 restack the rows; an explicit --durationMs overrides clipSec.",
  },
  resolveOutputHints: (props) => ({ durationMs: numberOr(props?.clipSec, DEFAULTS.clipSec, MIN_CLIP_SEC, MAX_CLIP_SEC) * 1000 }),

  propsSchema,
  defaultProps: {
    target: DEFAULTS.target,
    equipment: DEFAULTS.equipment,
    sessions: ASTRO_DEFAULT_SESSIONS.map((s) => ({ ...s })),
    csv: "",
    filterColors: {},
    clipSec: DEFAULTS.clipSec,
    footer: DEFAULTS.footer,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default AstroIntegrationSummaryV1;

/* ── sources ── */

type TextLayer = MosaicTextSource["layers"][number];
type Gate = { enable: string; window?: { startSec?: number; endSec?: number } };

function pickText(value: unknown, fallback: string, name: string, max: number, required = false): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") throw new Error(`${ID}: ${name} must be a string.`);
  const s = value.replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
  if (required && s.length === 0) throw new Error(`${ID}: ${name} must not be empty.`);
  if (s.length > max) throw new Error(`${ID}: ${name} is ${s.length} characters; at most ${max}.`);
  return s;
}

function pickOverrides(value: unknown): Map<string, MosaicColor> {
  let v: unknown = value;
  if (v === undefined || v === "") return new Map();
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      throw new Error(`${ID}: filterColors is not valid JSON - pass an object like {"Ha":"#ff5533"}.`);
    }
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error(`${ID}: filterColors must be an object like {"Ha":"#ff5533"}.`);
  const out = new Map<string, MosaicColor>();
  for (const [k, c] of Object.entries(v as Record<string, unknown>)) {
    if (typeof c !== "string" || !HEX.test(c.trim())) throw new Error(`${ID}: filterColors.${k} ${JSON.stringify(c)} must be #rrggbb.`);
    out.set(k.trim().toLowerCase(), c.trim().toLowerCase() as MosaicColor);
  }
  return out;
}

/** A video-mode (drawtext) text source over one cell: one layer per state, each gated. */
function drawtextSource(layers: TextLayer[], label: string): MosaicSource {
  return {
    type: "text",
    renderMode: { kind: "video" },
    visual: { backgroundColor: "black@0" as MosaicColor },
    layers,
    editor: { owner: "template", label },
  } as MosaicSource;
}

function drawLayer(text: string, px: number, color: MosaicColor, hAlign: "left" | "right", gate: Gate): TextLayer {
  return {
    content: { kind: "literal", text },
    style: { fontSize: px, fontColor: color },
    placement: { hAlign, vAlign: "middle" },
    overlay: gate,
  } as TextLayer;
}

/** A static svg cell with a gate. */
function gated(cell: MosaicSource, gate: Gate): MosaicSource {
  return { ...cell, overlay: gate } as MosaicSource;
}

const windowGate = (from: number, to: number): Gate => ({ enable: `gte(t,${from})*lt(t,${to})`, window: { startSec: from, endSec: to } });
const fromGate = (from: number): Gate => ({ enable: `gte(t,${from})`, window: { startSec: from } });
const beforeGate = (to: number): Gate => ({ enable: `lt(t,${to})`, window: { endSec: to } });

/**
 * A number that counts up: the finished value in the cold open, `0.0 h` in
 * the reset, then `values[j]` from `ats[j]` until the next landing (the last
 * one stays - the hold is the finished card).
 */
function countLayers(finalText: string, zeroText: string, values: string[], ats: number[], b: Beats, px: number, color: MosaicColor, hAlign: "left" | "right"): TextLayer[] {
  const layers: TextLayer[] = [drawLayer(finalText, px, color, hAlign, beforeGate(b.hook))];
  layers.push(drawLayer(zeroText, px, color, hAlign, windowGate(b.hook, ats[0])));
  values.forEach((text, j) => {
    layers.push(drawLayer(text, px, color, hAlign, j < values.length - 1 ? windowGate(ats[j], ats[j + 1]) : fromGate(ats[j])));
  });
  return layers;
}

async function render(props: AstroIntegrationSummaryProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  const theme = THEME;
  const target = pickText(props.target, DEFAULTS.target, "target", 60, true);
  const equipment = pickText(props.equipment, DEFAULTS.equipment, "equipment", 80);
  const footer = pickText(props.footer, DEFAULTS.footer, "footer", 120);
  const clipSec = (() => {
    const v = props.clipSec;
    if (v === undefined) return DEFAULTS.clipSec;
    const n = typeof v === "string" && (v as string).trim() !== "" ? Number(v) : v;
    if (typeof n !== "number" || !Number.isInteger(n) || n < MIN_CLIP_SEC || n > MAX_CLIP_SEC) {
      throw new Error(`${ID}: clipSec must be a whole number between ${MIN_CLIP_SEC} and ${MAX_CLIP_SEC}. Got ${JSON.stringify(v)}.`);
    }
    return n;
  })();
  const overrides = pickOverrides(props.filterColors);
  if (props.csv !== undefined && typeof props.csv !== "string") throw new Error(`${ID}: csv must be the text of an ImageMetaData.csv.`);
  const csv = (props.csv ?? "").trim();
  const model = csv.length > 0 ? astroModelFromCsv(csv, overrides) : astroModelFromSessions(props.sessions, overrides);

  // The clip is authored. An explicit user pin wins and BECOMES the clip;
  // the host-seeded target is never read as one.
  const pinned = resolvePinnedDurationMs(ctx);
  const clip = pinned !== undefined ? Math.max(1, pinned / 1000) : clipSec;
  const durationMs = pinned !== undefined ? Math.round(pinned) : clipSec * 1000;
  const b = astroBeatsOf(clip, model.nights.length);

  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const L = astroLayout(model, { target, equipment, footer }, W, H);

  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const piece = (rect: Rect, importance: number, source: MosaicSource) => pieces.push({ rect: { ...rect, importance }, source });
  const nightEnd = (k: number) => (k < model.nights.length - 1 ? b.lands[k + 1] : b.end);

  // ── 1. the tracks: a CHILD document. One dim track a row on the shared
  //      scale, one segment tile a (filter, night), gated to its landing. ──
  const chartPieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  model.filters.forEach((f, i) => {
    const y = i * L.rowH + L.trackY;
    chartPieces.push({ rect: { x: L.trackX, y, w: L.trackW, h: L.trackH, importance: 1 }, source: tag(makeColorTile(theme.track) as MosaicSource, "bar-track") });
    const tints = [f.color, mixWith(f.color, "#ffffff", theme.tint)];
    let prev = 0;
    f.segs.forEach((s, j) => {
      const edge = astroTrackEdge(s.cumSec, model.maxSec, L.trackW);
      if (edge > prev) {
        const gate = { overlay: { enable: openAndFrom(b.hook, b.lands[s.night]) } };
        chartPieces.push({ rect: { x: L.trackX + prev, y, w: edge - prev, h: L.trackH, importance: 2 }, source: tag(makeColorTile(tints[j % 2], gate) as MosaicSource, "bar-segment") });
      }
      prev = edge;
    });
  });
  const chartPlaced = placeInsetPieces({ rootW: L.chart.w, rootH: L.chart.h, pieces: chartPieces });
  const children: NonNullable<MosaicDocument["children"]> = {};
  children.chart = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(chartPlaced.m0, ID),
    assets: {},
    size: { width: L.chart.w, height: L.chart.h },
    fps: ctx.target.fps,
    durationMs,
    backgroundColor: theme.bg,
    sources: chartPlaced.sources,
    editor: { label: `tracks - ${model.filters.length} filters` },
  };
  piece(L.chart, 1, tag({ type: "mosaic", ref: "chart", placement: { fit: "contain" } } as MosaicSource, "chart-child"));

  // ── 2. the night ruler: a CHILD document. A dim cell a night, filled at its
  //      landing, bright while it is the night being replayed. ──
  const rulerPieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  // The strip itself (page colour): it is what the contract's "night-ruler" is - a child's own label does not survive flattening.
  rulerPieces.push({ rect: { x: 0, y: 0, w: L.ruler.w, h: L.ruler.h, importance: 1 }, source: tag(makeColorTile(theme.bg) as MosaicSource, "night-ruler") });
  L.cells.forEach((c, k) => {
    const at = b.lands[k];
    rulerPieces.push({ rect: { ...c, importance: 2 }, source: tag(makeColorTile(theme.cellOff) as MosaicSource, "night-cell") });
    rulerPieces.push({ rect: { ...c, importance: 3 }, source: tag(makeColorTile(theme.cellOn[k % 2], { overlay: { enable: openAndFrom(b.hook, at) } }) as MosaicSource, "night-cell") });
    rulerPieces.push({ rect: { ...c, importance: 4 }, source: tag(makeColorTile(theme.now, { overlay: windowGate(at, nightEnd(k)) }) as MosaicSource, "night-now") });
  });
  const rulerPlaced = placeInsetPieces({ rootW: L.ruler.w, rootH: L.ruler.h, pieces: rulerPieces });
  children.ruler = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(rulerPlaced.m0, ID),
    assets: {},
    size: { width: L.ruler.w, height: L.ruler.h },
    fps: ctx.target.fps,
    durationMs,
    backgroundColor: theme.bg,
    sources: rulerPlaced.sources,
    editor: { label: `ruler - ${model.nights.length} nights` },
  };
  piece(L.ruler, 1, tag({ type: "mosaic", ref: "ruler", placement: { fit: "contain" } } as MosaicSource, "ruler-child"));
  L.labels.forEach((l, k) => {
    if (!l) return;
    const at = b.lands[k];
    const text = (color: MosaicColor) => tag(textCell({ text: l.fit.text, fontSize: l.fit.px, color, hAlign: "center", bold: true, vAlign: "middle", label: `night-label-${k}` }), `night-label-${k}`);
    piece(l.rect, 4, gated(text(theme.dim), windowGate(b.hook, at)));
    piece(l.rect, 4, gated(text(theme.ink), { enable: openAndFrom(b.hook, at) }));
  });

  // ── 3. the header ──
  piece(L.title.rect, 3, bindProp(tag(textCell({ text: L.title.block.lines.join("\n"), fontSize: L.title.block.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "target"));
  if (L.equipment) piece(L.equipment.rect, 3, bindProp(tag(textCell({ text: L.equipment.fit.text, fontSize: L.equipment.fit.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "equipment" }), "equipment"), "equipment"));
  piece(L.totalLabel.rect, 3, tag(textCell({ text: L.totalLabel.fit.text, fontSize: L.totalLabel.fit.px, color: theme.dim, hAlign: L.stacked ? "left" : "right", bold: true, vAlign: L.stacked ? "middle" : "top", label: "total-label" }), "total-label"));

  // the running total: the finished value, 0.0 h, then each night's cumulative hours
  const totalLayers = countLayers(
    `${astroHoursText(model.totalSec)} h`,
    "0.0 h",
    model.nights.map((nt) => `${astroHoursText(nt.cumSec)} h`),
    b.lands,
    b,
    L.total.fit.px,
    theme.ink,
    "right",
  );
  piece(L.total.rect, 4, tag(drawtextSource(totalLayers, "total"), "total"));

  // ── 4. the rows: name, caption, and the filter's hours counting up ──
  model.filters.forEach((f, i) => {
    piece(L.names[i].rect, 3, tag(textCell({ text: f.name, fontSize: L.names[i].fit.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: `filter-name-${i}` }), `filter-name-${i}`));
    if (L.captions) {
      const c = L.captions[i];
      piece(c.rect, 3, tag(textCell({ text: c.fit.text, fontSize: c.fit.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: `filter-caption-${i}` }), `filter-caption-${i}`));
    }
    const ats = f.segs.map((s) => b.lands[s.night]);
    const layers = countLayers(`${astroHoursText(f.sec)} h`, "0.0 h", f.segs.map((s) => `${astroHoursText(s.cumSec)} h`), ats, b, L.valuePx, theme.ink, "right");
    piece(L.values[i], 4, tag(drawtextSource(layers, "filter-value"), "filter-value"));
  });

  // ── 5. the footer ──
  if (L.footer) piece(L.footer.rect, 3, bindProp(tag(textCell({ text: L.footer.fit.text, fontSize: L.footer.fit.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "footer" }), "footer"), "footer"));

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    size: { width: W, height: H },
    fps: ctx.target.fps,
    // The clip is authored, so it out-ranks the hint.
    durationMs,
    backgroundColor: theme.bg,
    sources: placed.sources,
    children,
    editor: { label: `Astro Integration Summary - ${target} - ${astroHoursText(model.totalSec)} h - ${model.filters.length} filters, ${model.nights.length} nights` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: layoutContract(L), relations: model.filters.length >= 2 ? trackRelations : [], debug: props.debugLayout === true });
}
