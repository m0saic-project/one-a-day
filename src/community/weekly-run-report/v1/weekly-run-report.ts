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
 * `@one-a-day/community/weekly-run-report/v1` - the weekly results card a
 * free Saturday 5k's volunteers post after every run: event, run number and
 * date, the six counts from the results page, and the milestone clubs
 * reached that week. One render per event per week, from numbers typed in.
 *
 * ONE CONCEPT: two numbers carry the week. Finishers and volunteers get the
 * two big tiles, the same size, side by side (stacked in a left column on a
 * wide canvas): the run cannot happen without either, and the run report
 * thanks both. New PBs, first timers, visitors and first-time volunteers sit
 * under them as four equal smaller tiles, and their numbers are capped at
 * 1/1.6 of the headline numbers, so the hierarchy holds on every canvas.
 * The props mirror the lines parkrun-runstats prints ("Milestones: 4xR25,
 * 4xR50, 1xR100"), so a run director fills the card from that list.
 *
 * The rule that bites: the card prints what was typed and nothing else. It
 * fetches nothing, derives no percentage, no record and no ranking. A count
 * key it does not know, a missing key, more new PBs than finishers or a club
 * that does not exist is refused with an error that names the field, because
 * a silently ignored typo puts a wrong number on a public page. And the
 * milestone band never moves: an empty week keeps the band and says "No
 * milestone clubs this week", so the series keeps one shape every Saturday.
 */

export type RunCounts = {
  finishers: number;
  newPbs: number;
  firstTimers: number;
  visitors: number;
  volunteers: number;
  firstTimeVolunteers: number;
};

export type WeeklyRunReportProps = {
  /** The event, drawn in capitals in the header. */
  eventName?: string;
  /** The event's run number, printed as #312. */
  runNumber?: number;
  /** YYYY-MM-DD; printed as SAT 03 OCT 2026. "" drops it. */
  date?: string;
  /** The six counts from the results page. */
  counts?: RunCounts;
  /** "4xR25, 3xR50, 1xR100, 2xV25" - the runstats milestones line, V for volunteer clubs. */
  milestones?: string;
  /** The bottom line; "" removes it. */
  footer?: string;
  /** Run-club badges, the header rule and the headline numbers, as #rrggbb. */
  accent?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/community/weekly-run-report/v1";
/** The page: document.backgroundColor, never a full-canvas rect (doctor: canvasFill). */
const PAPER = "#f6f4ee";
const INK = "#1b1f1c";
/** Labels and captions: 7:1 on the white tiles, so they survive a phone feed. */
const DIM = "#4f5651";
/**
 * The tiles and the band the numbers sit on: a NEUTRAL off-white. Each tile is a
 * child document, rendered through a 4:2:0 intermediate: pure white clips and
 * left a grey 16x16 block in each tile's corner, and a warm off-white lost its
 * tint in the last partial macroblock. Neutral #fbfbfb comes out flat.
 */
const TILE = "#fbfbfb";
/** Volunteer-club badges: a neutral fill, so the two kinds differ by fill AND caption word. */
const VOLUNTEER_FILL = "#dde1da";
const DEFAULT_ACCENT = "#1f7a4d";

// An invented event and an invented week (the footer says so): nothing here
// is anybody's results page.
const DEFAULT_COUNTS: RunCounts = { finishers: 214, newPbs: 38, firstTimers: 27, visitors: 19, volunteers: 31, firstTimeVolunteers: 4 };
const DEFAULTS = {
  eventName: "Willowmere Park 5k",
  runNumber: 312,
  date: "2026-10-03",
  counts: DEFAULT_COUNTS,
  milestones: "4xR25, 3xR50, 1xR100, 2xV25",
  footer: "Sample week: event and numbers are invented",
  accent: DEFAULT_ACCENT,
  debugLayout: false,
};

/** The six counts in the order the results page and runstats list them. */
export const COUNT_KEYS = ["finishers", "volunteers", "newPbs", "firstTimers", "visitors", "firstTimeVolunteers"] as const;
export type CountKey = (typeof COUNT_KEYS)[number];
const HERO_KEYS: readonly CountKey[] = ["finishers", "volunteers"];
const STAT_KEYS: readonly CountKey[] = ["newPbs", "firstTimers", "visitors", "firstTimeVolunteers"];
/** Fixed copy, broken in advance: the two-line form is used when the one-line form would cost size. */
const TILE_LABEL: Record<CountKey, { one: string; two: readonly string[] }> = {
  finishers: { one: "finishers", two: ["finishers"] },
  volunteers: { one: "volunteers", two: ["volunteers"] },
  newPbs: { one: "new PBs", two: ["new PBs"] },
  firstTimers: { one: "first timers", two: ["first timers"] },
  visitors: { one: "visitors", two: ["visitors"] },
  firstTimeVolunteers: { one: "first-time volunteers", two: ["first-time", "volunteers"] },
};
export const MILESTONE_CLUBS = [25, 50, 100, 250, 500, 1000] as const;
const MAX_BADGES = 10;
/** The parent's placement basis: finer than the default 120, so the snapped tiles have more 5-smooth sizes to choose from. */
const PARENT_BASIS = 360;
const MAX_COUNT = 9999;
const BAND_TITLE = "MILESTONE CLUBS";
const EMPTY_WEEK = "No milestone clubs this week";

const propsSchema = definePropsSchema<WeeklyRunReportProps>({
  eventName: {
    type: "string",
    required: false,
    description: "The event's name, drawn in capitals in the header. 1-40 characters of printable ASCII or accented Latin letters. A long name shrinks to 70% and then takes two lines; it is never cut.",
    meta: { control: { placeholder: DEFAULTS.eventName }, ui: { label: "Event name", order: 1, primary: true } },
  },
  runNumber: {
    type: "number",
    required: false,
    description: "The event's run number (the results page's #), a whole number 1-9999, printed as #312.",
    meta: { constraints: { min: 1, max: MAX_COUNT }, control: { placeholder: String(DEFAULTS.runNumber) }, ui: { label: "Run number", order: 2 } },
  },
  date: {
    type: "string",
    required: false,
    description: 'The run date as YYYY-MM-DD, a real calendar day, printed as "SAT 03 OCT 2026". The weekday is worked out from the date, so a junior or special run on another day prints its own weekday. Empty removes the date.',
    meta: { control: { placeholder: DEFAULTS.date }, ui: { label: "Date (YYYY-MM-DD)", order: 3 } },
  },
  counts: {
    type: "json",
    required: false,
    description: 'The six counts from the results page, typed in, never fetched (an object or its JSON string): {"finishers":214,"newPbs":38,"firstTimers":27,"visitors":19,"volunteers":31,"firstTimeVolunteers":4}. All six keys, whole numbers 0-9999, finishers at least 1; newPbs, firstTimers and visitors at most finishers; firstTimeVolunteers at most volunteers. An unknown or missing key is refused by name. 1204 prints as 1,204.',
    meta: {
      constraints: {
        jsonSchema: {
          type: "object",
          additionalProperties: false,
          required: [...COUNT_KEYS],
          properties: Object.fromEntries(COUNT_KEYS.map((k) => [k, { type: "integer", minimum: 0, maximum: MAX_COUNT }])),
        },
      },
      ui: { label: "Counts", order: 4, primary: true },
    },
  },
  milestones: {
    type: "string",
    required: false,
    description: 'The milestone clubs reached this week, as parkrun-runstats prints them plus V for volunteer clubs: "4xR25, 3xR50, 1xR100, 2xV25" (count x R or V, club 25, 50, 100, 250, 500 or 1000; count 1-999). Up to 10 entries, each club and kind once; the run counts add up to at most the finishers, the volunteer counts to at most the volunteers. Run clubs are shown first, then volunteer clubs, each ascending. Empty shows "No milestone clubs this week" and keeps the band.',
    meta: { control: { placeholder: "empty week" }, ui: { label: "Milestones", order: 5 } },
  },
  footer: {
    type: "string",
    required: false,
    description: "The bottom line: a thank-you, the event's page, the next run. One line of printable ASCII or accented Latin letters; a long one shrinks, and only a line that cannot fit above the readability floor is refused. Empty removes it and the space goes back to the card.",
    meta: { control: { placeholder: "none" }, ui: { label: "Footer", order: 6 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The one accent, as #rrggbb: run-club badges, the header rule and the two headline numbers. An accent with less than 4.5:1 contrast on the white tiles keeps the fills and leaves the numbers in ink. Empty falls back to the default green.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 7 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the header on top, two equal headline tiles, four equal stat tiles, the milestone band across the bottom) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the week: pure, exported, and what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

/** Printable ASCII plus Latin-1 and Latin Extended-A letters: what the bundled font draws. */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;
function drawn(value: unknown, field: string, max: number, allowEmpty: boolean): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  const s = value.trim();
  if (!allowEmpty && s === "") fail(field, "must not be empty.");
  const bad = [...s].find((ch) => !DRAWN.test(ch));
  if (bad !== undefined) fail(field, `${JSON.stringify(s)} has the character ${JSON.stringify(bad)} (U+${bad.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}), which the card's font is not known to draw: use printable ASCII and accented Latin letters.`);
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
  return s;
}

/** 1204 -> "1,204": ASCII digits and a thousands comma, never "1.2k". */
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
/** "2026-10-03" -> "SAT 03 OCT 2026"; null when it is not a real calendar day. The weekday comes from the date, never a clock. */
export function formatRunDate(text: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (y < 1900 || mo < 1 || mo > 12 || d < 1 || d > days[mo - 1]) return null;
  // Sakamoto's day-of-week: 0 = Sunday.
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const yy = mo < 3 ? y - 1 : y;
  const dow = (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[mo - 1] + d) % 7;
  return `${WEEKDAYS[dow]} ${m[3]} ${MONTHS[mo - 1]} ${m[1]}`;
}

export type Milestone = { kind: "R" | "V"; club: number; count: number; caption: string };
/** "4xR25, 1xV50" -> badges in card order (run clubs, then volunteer clubs, each ascending). Throws naming the bad entry. */
export function parseMilestones(text: string): Milestone[] {
  const entries = text.split(",").map((e) => e.trim()).filter((e) => e !== "");
  if (entries.length > MAX_BADGES) fail("milestones", `has ${entries.length} entries; at most ${MAX_BADGES} fit one card.`);
  const seen = new Set<string>();
  const out = entries.map((entry) => {
    const m = /^(\d{1,3})\s*[xX]\s*([RrVv])\s*(\d{1,5})$/.exec(entry);
    if (!m) fail("milestones", `entry ${JSON.stringify(entry)} is not <count>x<R|V><club>, e.g. "4xR25" (4 runners reached the 25 club) or "2xV25" (2 volunteers).`);
    const count = Number(m[1]), kind = m[2].toUpperCase() as "R" | "V", club = Number(m[3]);
    if (!(MILESTONE_CLUBS as readonly number[]).includes(club)) fail("milestones", `'${kind}${m[3]}' is not a club (${MILESTONE_CLUBS.join(", ")}).`);
    if (count < 1) fail("milestones", `entry ${JSON.stringify(entry)} has a count of 0; leave the club out instead.`);
    const key = `${kind}${club}`;
    if (seen.has(key)) fail("milestones", `${key} appears twice; give each club one entry with its total count.`);
    seen.add(key);
    const noun = kind === "R" ? "runner" : "volunteer";
    return { kind, club, count, caption: `${count} ${noun}${count === 1 ? "" : "s"}` };
  });
  return out.sort((a, b) => (a.kind === b.kind ? a.club - b.club : a.kind === "R" ? -1 : 1));
}

/** The counts object: exactly the six keys, whole numbers, and the sanity checks a results page always passes. */
export function parseCounts(value: unknown): RunCounts {
  // A json prop may arrive as the raw string its editor holds.
  if (typeof value === "string") {
    const raw = value;
    try { value = JSON.parse(raw); } catch { fail("counts", `is not valid JSON: ${JSON.stringify(raw.slice(0, 60))}.`); }
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail("counts", `must be an object with the keys ${COUNT_KEYS.join(", ")}.`);
  const obj = value as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    if (!(COUNT_KEYS as readonly string[]).includes(k)) fail("counts", `has an unknown key '${k}'; use ${COUNT_KEYS.join(", ")}.`);
  }
  const out = {} as RunCounts;
  for (const k of COUNT_KEYS) {
    if (!(k in obj)) fail("counts", `is missing '${k}'; give all six counts (${COUNT_KEYS.join(", ")}). The card never invents a number.`);
    const v = obj[k];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > MAX_COUNT) fail(`counts.${k}`, `must be a whole number from 0 to ${MAX_COUNT}, got ${JSON.stringify(v)}.`);
    out[k] = v;
  }
  if (out.finishers < 1) fail("counts.finishers", "must be at least 1: a run with no finishers has no results to report.");
  for (const k of ["newPbs", "firstTimers", "visitors"] as const) {
    if (out[k] > out.finishers) fail(`counts.${k}`, `is ${out[k]}, more than the ${out.finishers} finishers.`);
  }
  if (out.firstTimeVolunteers > out.volunteers) fail("counts.firstTimeVolunteers", `is ${out.firstTimeVolunteers}, more than the ${out.volunteers} volunteers.`);
  return out;
}

function luminance(hex: string): number {
  const c = (i: number) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
export function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** The readable ink on a filled badge: white or the ink, whichever contrasts more. */
function onColor(fill: string): MosaicColor {
  return (contrast(fill, "#ffffff") >= contrast(fill, INK) ? "#ffffff" : INK) as MosaicColor;
}

/** Edit distance, for "did you mean" on a misspelled prop. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeWeeklyRunReport(props: WeeklyRunReportProps) {
  // A prop the card does not know is refused by name: "count" for "counts" would
  // otherwise leave the sample week's invented numbers on a real event's card.
  const known = Object.keys(DEFAULTS);
  for (const k of Object.keys(props ?? {})) {
    if (known.includes(k)) continue;
    const near = known.find((n) => distance(n.toLowerCase(), k.toLowerCase()) <= 2);
    fail("props", `has an unknown prop '${k}'${near ? `; did you mean '${near}'?` : "."} The props are ${known.join(", ")}.`);
  }
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) } as typeof DEFAULTS;
  const eventName = drawn(p.eventName, "eventName", 40, false);
  const title = eventName.toUpperCase();
  if (!DRAWN.test(title)) fail("eventName", `${JSON.stringify(eventName)} has a letter whose capital the card's font is not known to draw.`);
  const runNumber = p.runNumber as unknown;
  if (typeof runNumber !== "number" || !Number.isInteger(runNumber) || runNumber < 1 || runNumber > MAX_COUNT) fail("runNumber", `must be a whole number from 1 to ${MAX_COUNT}, got ${JSON.stringify(runNumber)}.`);
  if (typeof p.date !== "string") fail("date", "must be a string.");
  const dateText = p.date.trim();
  const date = dateText === "" ? "" : formatRunDate(dateText);
  if (date === null) fail("date", `${JSON.stringify(dateText)} is not a date: YYYY-MM-DD, a real calendar day (e.g. "2026-10-03").`);
  const counts = parseCounts(p.counts);
  if (typeof p.milestones !== "string") fail("milestones", "must be a string.");
  const milestones = parseMilestones(p.milestones);
  // Everyone who reached a run club finished this week, everyone who reached a volunteer club volunteered.
  const runners = milestones.filter((b) => b.kind === "R").reduce((a, b) => a + b.count, 0);
  const helpers = milestones.filter((b) => b.kind === "V").reduce((a, b) => a + b.count, 0);
  if (runners > counts.finishers) fail("milestones", `count ${runners} runners reaching a club, more than the ${counts.finishers} finishers.`);
  if (helpers > counts.volunteers) fail("milestones", `count ${helpers} volunteers reaching a club, more than the ${counts.volunteers} volunteers.`);
  // No length cap: the footer shrinks alone to the floor and is refused there (the fit ladder).
  const footer = drawn(p.footer, "footer", Number.POSITIVE_INFINITY, true);
  if (typeof p.accent !== "string") fail("accent", "must be a string.");
  const accentText = p.accent.trim() === "" ? DEFAULT_ACCENT : p.accent.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(accentText)) fail("accent", `${JSON.stringify(accentText)} must be #rrggbb.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");
  const accent = accentText.toLowerCase() as MosaicColor;
  // The headline numbers take the accent only while it reads on the tile.
  const heroInk = (contrast(accent, TILE) >= 4.5 ? accent : INK) as MosaicColor;
  return { title, eventName, runNumber, runText: `#${runNumber}`, date, counts, milestones, footer, accent, heroInk, debugLayout: p.debugLayout };
}

/* ── geometry ── */

export type ReportRect = { x: number; y: number; w: number; h: number };
type Bind = { prop: "eventName" | "runNumber" | "date" | "footer" } | { prop: "counts"; key: CountKey } | null;
/** `group`: the child document a tile and its text are drawn in (see render). */
type Cell = { label: string; rect: ReportRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; over: boolean; group?: string };
type Tile = { label: string; rect: ReportRect; color: MosaicColor; radius: number; bind?: "accent" | "milestones"; group?: string };
/** A child document: one tile or badge with its text, on its own small canvas. */
export type ReportGroup = { key: string; label: "hero-tile" | "stat-tile" | "badge"; rect: ReportRect };

/** The largest 5-smooth number (2^a 3^b 5^c) at or below `n`. */
function smoothDown(n: number): number {
  for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
    let k = v;
    for (const f of [2, 3, 5]) while (k % f === 0) k /= f;
    if (k === 1) return v;
  }
  return 1;
}
/** The parent's placement lattice (px per step on each axis); 1 = exact. */
export type Pitch = { x: number; y: number };
/**
 * Equal rects for a group of equal slots, each ON the parent lattice with a
 * 5-smooth number of steps (so 5-smooth sides wherever the pitch is, as on
 * every contract canvas; an odd canvas with a pitch of 7 or 13 gets rough
 * child sides, which still render), centred on its slot and never larger than it. `slack` is how
 * far a rect may lean into the gap around its slot to reach a lattice line, so
 * an unlucky slot start does not cost a whole smooth step.
 * Why: each tile is a child document. A child on a rough canvas fails
 * `latticeSmooth`, and a child ref off the lattice gets a recovery inset that
 * the layout checker's flatten does not apply, so it would judge the tiles
 * unequal although the engine draws them equal.
 */
function snapGroup(slots: ReportRect[], pitch: Pitch, slack: number): ReportRect[] {
  const span = (pos: number, len: number, step: number) => {
    const lo = Math.ceil((pos - slack) / step) * step, hi = Math.floor((pos + len + slack) / step) * step;
    return { lo, hi, steps: Math.floor(Math.min(len, hi - lo) / step) };
  };
  const kx = smoothDown(Math.min(...slots.map((r) => span(r.x, r.w, pitch.x).steps)));
  const ky = smoothDown(Math.min(...slots.map((r) => span(r.y, r.h, pitch.y).steps)));
  const place = (pos: number, len: number, size: number, step: number) => {
    const { lo, hi } = span(pos, len, step);
    const centred = Math.round((pos + len / 2 - size / 2) / step) * step;
    return Math.max(lo, Math.min(hi - size, centred));
  };
  return slots.map((r) => {
    const w = kx * pitch.x, h = ky * pitch.y;
    return { x: place(r.x, r.w, w, pitch.x), y: place(r.y, r.h, h, pitch.y), w, h };
  });
}

/** The cell width a line needs at `px` under the fit rule (`cell * 0.94 - 2px`). */
function need(text: string, px: number, bold: boolean): number {
  return Math.ceil((widthOf(text, px, bold) + 2) / 0.94) + 1;
}
/** One line in a cell: the largest whole size up to `maxPx` that fits the cell's budget. */
function fitPx(line: string, cellW: number, maxPx: number, bold: boolean): number {
  const top = Math.max(1, Math.floor(maxPx)), room = budget(cellW), w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}
/** The line box a size needs (the font's ascent + descent with a little air). */
const lineH = (px: number) => Math.ceil(px * 1.22);

/** Split a name at the space nearest its middle; null when it has no space. */
function splitTwo(text: string): [string, string] | null {
  const spaces = [...text].map((ch, i) => (ch === " " ? i : -1)).filter((i) => i > 0);
  if (spaces.length === 0) return null;
  const mid = text.length / 2;
  const at = spaces.reduce((best, i) => (Math.abs(i - mid) < Math.abs(best - mid) ? i : best), spaces[0]);
  return [text.slice(0, at).trim(), text.slice(at + 1).trim()];
}

/**
 * Every rect of the card for one canvas. Pure: same props, canvas and pitch,
 * same rects. `pitch` is the parent's placement lattice (render finds it, see
 * `settleLayout`); tiles and badges snap to it.
 */
export function layoutWeeklyRunReport(props: WeeklyRunReportProps, W: number, H: number, pitch: Pitch = { x: 1, y: 1 }) {
  const p = normalizeWeeklyRunReport(props);
  const S = Math.min(H, 0.75 * W);
  const shape: "wide" | "square" | "tall" = W * 10 >= H * 13 ? "wide" : W * 10 >= H * 8 ? "square" : "tall";
  const floor = Math.max(6, Math.round(S * 0.022));
  /** Badge copy may go smaller than the page floor: it is short and sits on its own tile. */
  const small = Math.max(6, Math.round(S * 0.014));
  const unfit = (field: string, min = floor): never => fail(field, `cannot be fitted on ${W}x${H} above the ${min}px readability floor: shorten it or render a larger canvas.`);

  const m = Math.round(S * 0.05), gap = Math.max(2, Math.round(S * 0.025));
  const CW = W - 2 * m, top = m, CH = H - 2 * m;
  // Square tiles: a rounded corner inside a child shows the child canvas, whose cream encodes a shade off the page.
  const tileRadius = 0, badgeRadius = 0.18;

  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const groups: ReportGroup[] = [];
  const line = (label: string, rect: ReportRect, text: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; over?: boolean; field?: string; min?: number; group?: string } = {}) => {
    if (px < (o.min ?? floor)) unfit(o.field ?? label, o.min ?? floor);
    cells.push({ label, rect, text, px, width: widthOf(text, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? (INK as MosaicColor), bind: o.bind ?? null, over: o.over === true, group: o.group });
  };

  // ── bands: the footer is sized by its line, the rest share the height by weight ──
  const footerDesign = Math.max(floor, Math.round(S * 0.028));
  const footerPx = p.footer === "" ? 0 : Math.min(footerDesign, fitPx(p.footer, CW, footerDesign, false));
  if (p.footer !== "" && footerPx < floor) unfit("footer");
  const footerH = p.footer === "" ? 0 : lineH(footerDesign);
  const weights = shape === "wide" ? [0.16, 0.58, 0.26] : shape === "square" ? [0.16, 0.29, 0.25, 0.3] : [0.11, 0.28, 0.39, 0.22];
  const bandCount = weights.length + (p.footer === "" ? 0 : 1);
  let gapY = gap;
  const avail = CH - footerH - (bandCount - 1) * gapY;
  const sumW = weights.reduce((a, b) => a + b, 0);
  const hs = weights.map((w) => Math.floor((avail * w) / sumW));
  hs[hs.length - 1] += avail - hs.reduce((a, b) => a + b, 0);

  // Tiles never become slabs: a tile at most 1.3x as tall as it is wide; the slack goes to the gaps.
  const halfW = Math.floor((CW - gap) / 2);
  if (shape === "tall") {
    let slack = 0;
    const heroCap = Math.floor(halfW * 1.3);
    if (hs[1] > heroCap) { slack += hs[1] - heroCap; hs[1] = heroCap; }
    const statCap = 2 * Math.floor(halfW * 1.3) + gap;
    if (hs[2] > statCap) { slack += hs[2] - statCap; hs[2] = statCap; }
    gapY += Math.floor(slack / (bandCount - 1));
  }

  // ── header: the event name in capitals, the run number and date, the accent rule ──
  const headerY = top, headerH = hs[0];
  const ruleH = Math.max(2, Math.round(S * 0.006));
  const runDesign = Math.max(floor, Math.min(Math.round(headerH * 0.2), Math.round(S * 0.038)));
  const sepGap = (px: number) => Math.round(px * 0.55);
  const sepW = (px: number) => Math.max(1, Math.round(px * 0.09));
  // The separator sits on the drawn widths, so it is centred between "#312" and the date.
  const runTextW = (px: number) => Math.ceil(widthOf(p.runText, px, true));
  const runLineW = (px: number) => (p.date === "" ? need(p.runText, px, true) : runTextW(px) + 2 * sepGap(px) + sepW(px) + need(p.date, px, false));
  const runPx = Math.min(runDesign, (() => { let px = runDesign; while (px > 1 && runLineW(px) > CW) px--; return px; })());
  if (runPx < floor) unfit("date");
  const runH = lineH(runPx);
  const nameRoom = headerH - ruleH - runH - Math.round(headerH * 0.08);
  const nameDesign = Math.min(Math.floor(nameRoom / 1.22), Math.round(S * 0.075));
  // Wide: the run line shares the name's line when both fit at full size.
  const nameDesignWide = Math.min(Math.floor((headerH - ruleH - Math.round(headerH * 0.12)) / 1.22 * 0.62), Math.round(S * 0.075));
  let nameLines: string[] = [p.title];
  let namePx = fitPx(p.title, CW, nameDesign, true);
  let runBeside = false;
  if (shape === "wide") {
    const besidePx = fitPx(p.title, CW - runLineW(runPx) - 2 * gap, nameDesignWide, true);
    if (besidePx >= Math.round(nameDesignWide * 0.85)) { runBeside = true; namePx = besidePx; }
  }
  if (!runBeside && namePx < Math.round(nameDesign * 0.7)) {
    // Reflow before shrinking further: two lines, split at the space nearest the middle.
    const two = splitTwo(p.title);
    if (two) {
      const twoPx = Math.min(Math.floor(nameRoom / (2 * 1.22)), fitPx(two[0], CW, nameDesign, true), fitPx(two[1], CW, nameDesign, true));
      if (twoPx > namePx) { nameLines = two; namePx = twoPx; }
    }
  }
  if (namePx < floor) unfit("eventName");
  {
    const nh = lineH(namePx);
    if (runBeside) {
      const y = headerY + Math.round((headerH - ruleH - nh) / 2);
      line("event-name", { x: m, y, w: need(p.title, namePx, true), h: nh }, p.title, namePx, { bold: true, bind: { prop: "eventName" }, field: "eventName" });
      runLine(m + CW - runLineW(runPx), headerY + Math.round((headerH - ruleH - runH) / 2), "right");
    } else {
      const blockH = nameLines.length * nh + runH;
      const y0 = headerY + Math.max(0, Math.round((headerH - ruleH - blockH) / 2 - headerH * 0.02));
      nameLines.forEach((t, i) => line(nameLines.length === 1 ? "event-name" : `event-name-${i + 1}`, { x: m, y: y0 + i * nh, w: need(t, namePx, true), h: nh }, t, namePx, { bold: true, bind: { prop: "eventName" }, field: "eventName" }));
      runLine(m, y0 + nameLines.length * nh, "left");
    }
    tiles.push({ label: "header-rule", rect: { x: m, y: headerY + headerH - ruleH, w: CW, h: ruleH }, color: p.accent, radius: 0, bind: "accent" });
  }
  /** "#312 | SAT 03 OCT 2026" from `x`; "right" ends the date flush with the rule (the wide header). */
  function runLine(x: number, y: number, align: "left" | "right") {
    const rw = need(p.runText, runPx, true);
    if (p.date === "") {
      line("run-number", { x, y, w: rw, h: runH }, p.runText, runPx, { bold: true, align, color: DIM as MosaicColor, bind: { prop: "runNumber" }, field: "runNumber" });
      return;
    }
    const dw = need(p.date, runPx, false), sh = Math.round(runPx * 0.9), sy = y + Math.round((runH - sh) / 2);
    if (align === "left") {
      line("run-number", { x, y, w: rw, h: runH }, p.runText, runPx, { bold: true, color: DIM as MosaicColor, bind: { prop: "runNumber" }, field: "runNumber" });
      const sx = x + runTextW(runPx) + sepGap(runPx);
      tiles.push({ label: "run-sep", rect: { x: sx, y: sy, w: sepW(runPx), h: sh }, color: DIM as MosaicColor, radius: 0 });
      line("run-date", { x: sx + sepW(runPx) + sepGap(runPx), y, w: dw, h: runH }, p.date, runPx, { color: DIM as MosaicColor, bind: { prop: "date" }, field: "date" });
      return;
    }
    // Right: laid out from the rule's end, each cell right-aligned so its fit slack falls on the left.
    const end = m + CW;
    line("run-date", { x: end - dw, y, w: dw, h: runH }, p.date, runPx, { align: "right", color: DIM as MosaicColor, bind: { prop: "date" }, field: "date" });
    const sx = end - Math.ceil(widthOf(p.date, runPx, false)) - sepGap(runPx) - sepW(runPx);
    tiles.push({ label: "run-sep", rect: { x: sx, y: sy, w: sepW(runPx), h: sh }, color: DIM as MosaicColor, radius: 0 });
    line("run-number", { x: sx - sepGap(runPx) - rw, y, w: rw, h: runH }, p.runText, runPx, { bold: true, align: "right", color: DIM as MosaicColor, bind: { prop: "runNumber" }, field: "runNumber" });
  }

  // ── the six tiles: rects first, then one shared label size, then the numbers ──
  const heroRects: ReportRect[] = [];
  const statRects: ReportRect[] = [];
  let y = headerY + headerH + gapY;
  let bandY: number, bandH: number;
  if (shape === "wide") {
    const midH = hs[1], rowH = Math.floor((midH - gap) / 2);
    const leftW = Math.round(CW * 0.36), rightX = m + leftW + gap, rightW = CW - leftW - gap, colW = Math.floor((rightW - gap) / 2);
    heroRects.push({ x: m, y, w: leftW, h: rowH }, { x: m, y: y + rowH + gap, w: leftW, h: rowH });
    for (let i = 0; i < 4; i++) statRects.push({ x: rightX + (i % 2) * (colW + gap), y: y + Math.floor(i / 2) * (rowH + gap), w: colW, h: rowH });
    y += midH + gapY;
    bandY = y; bandH = hs[2];
  } else {
    heroRects.push({ x: m, y, w: halfW, h: hs[1] }, { x: m + halfW + gap, y, w: halfW, h: hs[1] });
    y += hs[1] + gapY;
    if (shape === "square") {
      const sw = Math.floor((CW - 3 * gap) / 4);
      for (let i = 0; i < 4; i++) statRects.push({ x: m + i * (sw + gap), y, w: sw, h: hs[2] });
    } else {
      const rowH = Math.floor((hs[2] - gap) / 2);
      for (let i = 0; i < 4; i++) statRects.push({ x: m + (i % 2) * (halfW + gap), y: y + Math.floor(i / 2) * (rowH + gap), w: halfW, h: rowH });
    }
    y += hs[2] + gapY;
    bandY = y; bandH = hs[3];
  }
  heroRects.splice(0, 2, ...snapGroup(heroRects, pitch, Math.floor(gap / 2)));
  statRects.splice(0, 4, ...snapGroup(statRects, pitch, Math.floor(gap / 2)));
  const padOf = (r: ReportRect) => Math.max(2, Math.round(Math.min(r.w, r.h) * 0.08));
  const inner = (r: ReportRect) => { const pd = padOf(r); return { x: r.x + pd, y: r.y + pd, w: r.w - 2 * pd, h: r.h - 2 * pd }; };
  const heroIn = inner(heroRects[0]), statIn = inner(statRects[0]);
  const labelCap = Math.round(S * 0.034);
  // The stat labels take one line when it costs no size, else the long one breaks in two.
  const statLabelOne = Math.min(labelCap, Math.floor((statIn.h * 0.26) / 1.22), ...STAT_KEYS.map((k) => fitPx(TILE_LABEL[k].one, statIn.w, labelCap, false)));
  const statLabelTwo = Math.min(labelCap, Math.floor((statIn.h * 0.3) / (2 * 1.22)), ...STAT_KEYS.flatMap((k) => TILE_LABEL[k].two.map((t) => fitPx(t, statIn.w, labelCap, false))));
  const twoLineLabels = statLabelTwo > statLabelOne;
  const heroLabelPx = Math.min(labelCap, Math.floor((heroIn.h * 0.24) / 1.22), ...HERO_KEYS.map((k) => fitPx(TILE_LABEL[k].one, heroIn.w, labelCap, false)));
  // All six tile labels share one size: the smallest any tile allows.
  const labelPx = Math.min(heroLabelPx, twoLineLabels ? statLabelTwo : statLabelOne);
  if (labelPx < floor) unfit("the tile labels");
  const statLines = twoLineLabels ? 2 : 1;
  const labelGap = Math.round(labelPx * 0.25);
  const value = (k: CountKey) => formatCount(p.counts[k]);
  const heroValueRoom = heroIn.h - labelGap - lineH(labelPx);
  const heroPx = Math.min(Math.round(S * 0.26), Math.floor(heroValueRoom / 1.22), ...HERO_KEYS.map((k) => fitPx(value(k), heroIn.w, S, true)));
  const statValueRoom = statIn.h - labelGap - statLines * lineH(labelPx);
  // Hierarchy by construction: a stat number is never more than 1/1.6 of a headline number.
  const statPx = Math.min(Math.round(S * 0.16), Math.floor(statValueRoom / 1.22), Math.floor(heroPx / 1.6), ...STAT_KEYS.map((k) => fitPx(value(k), statIn.w, S, true)));
  if (statPx < floor) unfit("counts");

  const tileText = (k: CountKey, r: ReportRect, px: number, lines: readonly string[], reserve: number, color: MosaicColor, label: "hero-tile" | "stat-tile") => {
    const group = `tile-${k}`;
    groups.push({ key: group, label, rect: r });
    tiles.push({ label, rect: r, color: TILE as MosaicColor, radius: tileRadius, group });
    const ri = inner(r);
    const blockH = lineH(px) + labelGap + reserve * lineH(labelPx);
    const y0 = ri.y + Math.round((ri.h - blockH) / 2);
    line(`value-${k}`, { x: ri.x, y: y0, w: ri.w, h: lineH(px) }, value(k), px, { bold: true, align: "center", color, bind: { prop: "counts", key: k }, over: true, field: `counts.${k}`, group });
    lines.forEach((t, i) => line(lines.length === 1 ? `label-${k}` : `label-${k}-${i + 1}`, { x: ri.x, y: y0 + lineH(px) + labelGap + i * lineH(labelPx), w: ri.w, h: lineH(labelPx) }, t, labelPx, { align: "center", color: DIM as MosaicColor, over: true, field: "the tile labels", group }));
  };
  HERO_KEYS.forEach((k, i) => tileText(k, heroRects[i], heroPx, [TILE_LABEL[k].one], 1, p.heroInk, "hero-tile"));
  STAT_KEYS.forEach((k, i) => tileText(k, statRects[i], statPx, twoLineLabels ? TILE_LABEL[k].two : [TILE_LABEL[k].one], statLines, INK as MosaicColor, "stat-tile"));

  // ── the milestone band: always there; badges, or the one line for an empty week ──
  const band: ReportRect = { x: m, y: bandY, w: CW, h: bandH };
  tiles.push({ label: "milestone-band", rect: band, color: TILE as MosaicColor, radius: Math.min(tileRadius, 0.06), bind: "milestones" });
  const bp = Math.max(2, Math.round(Math.min(band.h, band.w) * 0.08));
  const titlePx = Math.max(floor, Math.min(labelPx, fitPx(BAND_TITLE, CW, labelPx, true)));
  let area: ReportRect;
  if (shape === "wide") {
    const tw = need(BAND_TITLE, titlePx, true);
    line("band-title", { x: band.x + bp, y: band.y + Math.round((band.h - lineH(titlePx)) / 2), w: tw, h: lineH(titlePx) }, BAND_TITLE, titlePx, { bold: true, color: DIM as MosaicColor, over: true, field: "the band title" });
    area = { x: band.x + bp + tw + gap, y: band.y + bp, w: band.w - 2 * bp - tw - gap, h: band.h - 2 * bp };
  } else {
    line("band-title", { x: band.x + bp, y: band.y + bp, w: need(BAND_TITLE, titlePx, true), h: lineH(titlePx) }, BAND_TITLE, titlePx, { bold: true, color: DIM as MosaicColor, over: true, field: "the band title" });
    const ay = band.y + bp + lineH(titlePx) + Math.round(bp * 0.5);
    area = { x: band.x + bp, y: ay, w: band.w - 2 * bp, h: band.y + band.h - bp - ay };
  }
  const badges: Array<{ rect: ReportRect; kind: "R" | "V" }> = [];
  let badgePx = 0, captionPx = 0;
  if (p.milestones.length === 0) {
    const px = Math.min(Math.round(labelPx * 1.1), fitPx(EMPTY_WEEK, area.w, Math.round(labelPx * 1.1), false));
    const eh = lineH(px);
    line("milestone-empty", { x: area.x, y: area.y + Math.round((area.h - eh) / 2), w: area.w, h: eh }, EMPTY_WEEK, px, { align: "center", color: DIM as MosaicColor, over: true, field: "the empty-week line" });
  } else {
    const n = p.milestones.length;
    const rowGap = Math.max(2, Math.round(gap * 0.6));
    /**
     * One arrangement: `rowsN` rows of `slots` equal slots, the badges snapped like the
     * tiles (equal, on the lattice, 5-smooth) and the type sized for the snapped badge.
     */
    const arrange = (rowsN: number[], slots: number) => {
      const slotW = Math.floor(area.w / slots);
      const rowH = Math.floor((area.h - (rowsN.length - 1) * rowGap) / rowsN.length);
      const bw = Math.max(1, Math.min(slotW - Math.max(2, Math.round(gap * 0.6)), Math.round(rowH * 1.7)));
      const bh = Math.max(1, Math.min(rowH, bw));
      const totalH = rowsN.length * bh + (rowsN.length - 1) * rowGap;
      const slotsOf: ReportRect[] = [];
      rowsN.forEach((count, r) => {
        const rowY = area.y + Math.round((area.h - totalH) / 2) + r * (bh + rowGap);
        const x0 = area.x + Math.round((area.w - count * slotW) / 2);
        for (let i = 0; i < count; i++) slotsOf.push({ x: x0 + i * slotW + Math.round((slotW - bw) / 2), y: rowY, w: bw, h: bh });
      });
      const snapped = snapGroup(slotsOf, pitch, Math.floor(rowGap / 2));
      const sw = snapped[0].w, sh = snapped[0].h, ip = Math.max(1, Math.round(sh * 0.07));
      // A club number never outranks a stat number: headline > stat >= badge.
      // The caption is sized first (up to 0.3 of the badge), the club number takes what is left of the
      // padded height, so a snap that trims a badge by a step does not push a caption under the floor.
      const captionPx = Math.min(labelPx, Math.floor((sh * 0.3) / 1.22), ...p.milestones.map((b) => fitPx(b.caption, sw - 2 * ip, S, false)));
      const badgePx = Math.min(statPx, Math.floor((sh * 0.52) / 1.22), Math.floor((sh - 2 * ip - lineH(captionPx)) / 1.22), ...p.milestones.map((b) => fitPx(String(b.club), sw - 2 * ip, S, true)));
      return { rowsN, snapped, ip, badgePx, captionPx, fits: badgePx >= small && captionPx >= small };
    };
    // Five slots a row whatever the count, so a badge is the same size in a 1-club and a 5-club week.
    // At most five a row: six to ten clubs make two rows (ceil/floor). Only a band whose two rows
    // would fall below the floor (a thumbnail, a short band) takes one long row of n instead.
    const rows2 = n <= 5 ? arrange([n], 5) : arrange([Math.ceil(n / 2), Math.floor(n / 2)], 5);
    const A = n > 5 && !rows2.fits ? arrange([n], n) : rows2;
    const { rowsN, snapped, ip } = A;
    badgePx = A.badgePx; captionPx = A.captionPx;
    if (!A.fits) unfit("milestones", small);
    const blockH = lineH(badgePx) + lineH(captionPx);
    let k = 0;
    rowsN.forEach((count) => {
      for (let i = 0; i < count; i++, k++) {
        const b = p.milestones[k];
        const rect = snapped[k];
        const fill = (b.kind === "R" ? p.accent : VOLUNTEER_FILL) as MosaicColor;
        const group = `badge-${k + 1}`;
        badges.push({ rect, kind: b.kind });
        groups.push({ key: group, label: "badge", rect });
        tiles.push({ label: "badge", rect, color: fill, radius: badgeRadius, group });
        const ink = onColor(fill);
        const by = rect.y + Math.round((rect.h - blockH) / 2);
        line(`badge-club-${k + 1}`, { x: rect.x + ip, y: by, w: rect.w - 2 * ip, h: lineH(badgePx) }, String(b.club), badgePx, { bold: true, align: "center", color: ink, over: true, field: "milestones", min: small, group });
        line(`badge-caption-${k + 1}`, { x: rect.x + ip, y: by + lineH(badgePx), w: rect.w - 2 * ip, h: lineH(captionPx) }, b.caption, captionPx, { align: "center", color: ink, over: true, field: "milestones", min: small, group });
      }
    });
  }

  // ── footer: one line at the bottom, shrunk alone to the floor ──
  if (p.footer !== "") {
    const fy = top + CH - footerH;
    line("footer", { x: m, y: fy + Math.round((footerH - lineH(footerPx)) / 2), w: need(p.footer, footerPx, false), h: lineH(footerPx) }, p.footer, footerPx, { color: DIM as MosaicColor, bind: { prop: "footer" }, field: "footer" });
  }

  return { p, shape, floor, small, cells, tiles, groups, heroRects, statRects, band, badges, namePx, nameLines, runBeside, heroPx, statPx, labelPx, twoLineLabels, badgePx, captionPx };
}

/**
 * The layout on its own lattice: lay out once, find the pitch the parent's
 * placement will use (set by the thin rule and separator, not by the tiles),
 * lay out again snapped to it, and repeat until the pitch holds (one pass in
 * practice). The child refs then land on the lattice with no recovery inset.
 */
export function settleLayout(props: WeeklyRunReportProps, W: number, H: number) {
  const dummy = makeColorTile(INK as MosaicColor) as MosaicSource;
  const pitchOf = (L: ReturnType<typeof layoutWeeklyRunReport>): Pitch => placeInsetPieces({
    rootW: W, rootH: H, basis: PARENT_BASIS,
    pieces: [...L.tiles.filter((t) => t.group === undefined).map((t) => t.rect), ...L.cells.filter((c) => c.group === undefined).map((c) => c.rect), ...L.groups.map((g) => g.rect)]
      .map((r) => ({ rect: { ...r, importance: 1 }, source: dummy })),
  }).pitch;
  let pitch: Pitch = { x: 1, y: 1 };
  let L = layoutWeeklyRunReport(props, W, H, pitch);
  for (let pass = 0; pass < 4; pass++) {
    const next = pitchOf(L);
    if (next.x === pitch.x && next.y === pitch.y) break;
    pitch = next;
    L = layoutWeeklyRunReport(props, W, H, pitch);
  }
  return { L, pitch };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 17,
  "date": "2026-10-06",
  "agent": "claude",
  "model": "claude-opus-5-5",
  "id": "@one-a-day/community/weekly-run-report/v1",
  "title": "Weekly 5k Run Report",
  "who": "parkrun event teams: run directors and the volunteers who write the weekly run report for the event's Facebook page and results news",
  "problem": [
    "Every Saturday each free, timed 5k gets the same numbers: finishers, new PBs, first timers, visitors, volunteers, milestone clubs. ear1grey saw \"a really cool infographic at my local parkrun, that was generated using a PowerPoint slide\" and adds: \"The process of getting the data into Powerpoint is quite cumbersome\".",
    "Volunteers built tools to get the numbers out. Eventuate was written \"while volunteering as a Run Director at Brimbank parkrun, to celebrate our community on the Facebook page\"; parkrun-runstats \"prints the stats of the latest run in list format\". Both stop at text; the one infographic lives inside the results page."
  ],
  "sources": [
    "https://github.com/ear1grey/parkrun-event-summary",
    "https://github.com/johnsyweb/eventuate",
    "https://greasyfork.org/scripts/534157-eventuate",
    "https://github.com/rwkura/parkrun-milestones"
  ],
  "solution": [
    "One card per event per week, from numbers typed in, never fetched. The props mirror the runstats list: six counts and a milestones line in its own syntax (4xR25, plus V for volunteer clubs). It prints what was typed: 1,204 with a comma, the weekday from the date, no derived stats.",
    "The decision that matters: two numbers carry the week. Finishers and volunteers get the two big tiles; the other four are smaller tiles, their numbers capped at 1/1.6 of the headline size. The milestone band never moves: an empty week says so and keeps the shape. No parkrun name, logo or colours."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/community/weekly-run-report/v1 --template-repo . -w 1080 -h 1080 --props @week.json -o week-312.png",
    "try": [
      "week.json: {\"eventName\":\"Your Park 5k\",\"runNumber\":313,\"date\":\"2026-10-10\",\"counts\":{...},\"footer\":\"\"}",
      "-w 1080 -h 1920 for a story, -w 1920 -h 1080 for the results page; the tiles reflow, the numbers stay",
      "milestones \"\": the band stays and says No milestone clubs this week; 6-10 clubs make smaller badges",
      "footer \"\" removes the sample line; accent \"#7a3b8f\" for your own colour (numbers stay ink if it reads poorly)"
    ]
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 466482,
        "calls": 17,
        "tokens": 3309053,
        "costUsd": 5.64,
        "tools": "Bash 12, Monitor 1, Read 1"
      },
      {
        "name": "plan",
        "startMs": 466502,
        "durMs": 675483,
        "calls": 10,
        "tokens": 1000484,
        "costUsd": 11.62,
        "tools": "Bash 8, ScheduleWakeup 1, Workflow 1"
      },
      {
        "name": "plan (2)",
        "startMs": 1142018,
        "durMs": 231866,
        "calls": 13,
        "tokens": 1550217,
        "costUsd": 1.05,
        "tools": "Bash 12, Write 1"
      },
      {
        "name": "build",
        "startMs": 1373900,
        "durMs": 5705970,
        "calls": 190,
        "tokens": 118929674,
        "costUsd": 28.58,
        "tools": "Bash 121, Read 47, Write 13",
        "status": "error"
      },
      {
        "name": "build (2)",
        "startMs": 17049833,
        "durMs": 1243536,
        "calls": 79,
        "tokens": 17429496,
        "costUsd": 4.57,
        "tools": "Bash 56, Read 18, ToolSearch 2"
      },
      {
        "name": "critique",
        "startMs": 18293399,
        "durMs": 987429,
        "calls": 57,
        "tokens": 10376564,
        "costUsd": 16.61,
        "tools": "Read 41, Bash 14, ScheduleWakeup 1",
        "status": "error"
      },
      {
        "name": "critique (2)",
        "startMs": 19280840,
        "durMs": 297565,
        "calls": 51,
        "tokens": 5522930,
        "costUsd": 1.94,
        "tools": "Bash 25, Read 24, Agent 1"
      },
      {
        "name": "ship",
        "startMs": 19578430,
        "durMs": 1869089,
        "calls": 53,
        "tokens": 9676865,
        "costUsd": 11.72,
        "tools": "Bash 44, Read 4, Edit 2",
        "status": "error"
      }
    ],
    "costBasis": "reported"
  },
  "caveats": [
    "No importer: the run director retypes six numbers and the milestones line each week, and counts is JSON. The V prefix for volunteer clubs is this card's extension of the runstats line.",
    "Six to ten clubs take two rows of smaller badges (one long row on a thumbnail). On a thumbnail such as 480x270, seven or more clubs may be refused: their captions fall below the floor.",
    "No parkrun marks by design, so at defaults it looks like any 5k's weekly summary. The PowerPoint originals it replaces were described to us, not seen."
  ]
};

export const WeeklyRunReportV1 = defineMosaicTemplate<WeeklyRunReportProps>({
  id: asTemplateId(ID),
  label: "2026-10-06 · Weekly 5k Run Report",
  version: 1,
  description: "The weekly results card a volunteer-run Saturday 5k posts after every run: event, run number and date, finishers and volunteers as the two headline numbers, new PBs, first timers, visitors and first-time volunteers under them, and the milestone clubs reached. Numbers are typed in, never fetched.",
  capabilities: { tier: "core" },
  tags: ["community","2026-10-06","day-017", "running", "5k", "volunteers", "weekly", "stats", "results"],

  outputHints: {
    width: 1080,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG, one card per event per week. 1080x1080 for the feed; 1080x1920 (story) and 1920x1080 (results page) reflow the tiles. On a thumbnail such as 480x270, seven or more milestone clubs may be refused.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default WeeklyRunReportV1;

async function render(props: WeeklyRunReportProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const { L } = settleLayout(props, W, H);
  type Pieces = Parameters<typeof placeInsetPieces>[0]["pieces"];
  const pieces: Pieces = [];
  const constraints: LayoutConstraint[] = [];
  // Text over a fill never lowers onto the engine's grid sheet: every such pair
  // is one more link in the overlay chain, and past ~25 the glyph masks degrade
  // silently. So each tile and each badge is a CHILD document (its fill and its
  // text, 3-4 deep), and the parent's pieces barely overlap.
  const groupOf = new Map(L.groups.map((g) => [g.key, { g, cell: g.rect, pieces: [] as Pieces }]));
  const push = (group: string | undefined, rect: ReportRect, importance: number, source: MosaicSource) => {
    if (group === undefined) { pieces.push({ rect: { ...rect, importance }, source }); return; }
    const owner = groupOf.get(group)!;
    owner.pieces.push({ rect: { ...rect, x: rect.x - owner.cell.x, y: rect.y - owner.cell.y, importance }, source });
  };

  for (const t of L.tiles) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) } as MosaicSource, t.label);
    // The header rule shows `accent`; the band is the rect that shows `milestones`.
    push(t.group, t.rect, 1, t.bind ? bindProp(tile, t.bind) : tile);
  }
  for (const c of L.cells) {
    let cell: MosaicSource = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; each count to its own key of `counts`. Fixed copy is not.
    if (c.bind?.prop === "counts") cell = bindPropPath(cell, "counts", [c.bind.key], "number");
    else if (c.bind) cell = bindProp(cell, c.bind.prop);
    push(c.group, c.rect, c.over ? 3 : 2, cell);
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }
  const children: NonNullable<MosaicDocument["children"]> = {};
  for (const { g, cell, pieces: own } of groupOf.values()) {
    const placedChild = placeInsetPieces({ rootW: cell.w, rootH: cell.h, pieces: own });
    children[g.key] = {
      kind: "mosaic_document",
      version: 1,
      m0: toM0String(placedChild.m0, ID),
      assets: {},
      size: { width: cell.w, height: cell.h },
      fps: ctx.target.fps,
      durationMs: 2000,
      // A still's child has no alpha: its own canvas shows behind a rounded corner. Badges sit on
      // the band's white, so theirs is white; tiles fill their whole canvas, so theirs never shows.
      backgroundColor: (g.label === "badge" ? TILE : PAPER) as MosaicColor,
      sources: placedChild.sources,
      editor: { label: g.key },
    };
    pieces.push({ rect: { ...cell, importance: 2 }, source: tag({ type: "mosaic", ref: g.key, placement: { fit: "contain" } } as MosaicSource, g.key) });
  }

  // What the geometry promises: every text fits (above); the header on top;
  // two equal headline tiles and four equal stat tiles; the milestone band
  // across the lower card every week, its badges equal and inside it; the
  // footer at the bottom when there is one.
  const nameLabel = L.nameLines.length === 1 ? "event-name" : "event-name-1";
  constraints.push({ label: nameLabel, within: { yFrac: [0, 0.25] } });
  constraints.push({ label: "header-rule", minWidthFrac: 0.85 });
  constraints.push({ label: "hero-tile", within: { yFrac: [0.1, 0.8] } });
  constraints.push({ label: "stat-tile", minWidthFrac: 0.15 });
  for (const k of COUNT_KEYS) constraints.push({ label: `value-${k}` });
  constraints.push({ label: "milestone-band", within: { yFrac: [0.55, 1] }, minWidthFrac: 0.85 });
  if (L.badges.length > 0) constraints.push({ label: "badge", within: { yFrac: [L.band.y / H, (L.band.y + L.band.h) / H] } });
  else constraints.push({ label: "milestone-empty" });
  if (L.cells.some((c) => c.label === "footer")) constraints.push({ label: "footer", within: { yFrac: [0.9, 1] } });

  const relations: RelationalConstraint[] = [
    { label: "hero-tile", equal: "size", tolerancePx: 2 },
    { label: "stat-tile", equal: "size", tolerancePx: 2 },
  ];
  if (L.badges.length >= 2) relations.push({ label: "badge", equal: "size", tolerancePx: 2 });

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces, basis: PARENT_BASIS });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    backgroundColor: PAPER as MosaicColor,
    sources: placed.sources,
    children,
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, relations, debug: props.debugLayout === true });
}
