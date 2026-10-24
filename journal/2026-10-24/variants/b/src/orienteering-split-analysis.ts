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
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/sports/orienteering-split-analysis/v1` - one racer's IOF XML 3.0
 * result row as a shareable split-analysis card: finish time as the hero, the
 * course and the place, then control-by-control legs as a tape whose length is
 * the split, and a footer that answers the one question everyone asks -
 * "where did I lose time?" - as TIME W/O MISTAKES, TOTAL LOSS and BEST LEG.
 *
 * ONE CONCEPT: the mistake is the picture. A leg's bar length is its split
 * over the slowest leg, so the eye reads the race; a leg with time loss
 * (`loss > 0`, the WinSplits per-leg number) is drawn in the accent - pink
 * bar, signed pink loss - and a clean leg is neutral with an empty loss cell.
 * No legend: pink = mistake, bar length = split.
 *
 * The rule that bites: time loss is NOT re-derived. WinSplits computes it
 * class-relative from the whole field, so it comes in as a prop per leg; the
 * card only sums the entered losses (TOTAL LOSS), subtracts them from the
 * entered finish (TIME W/O MISTAKES) and takes the min split (BEST LEG) - and
 * it never checks the finish against the split sum. A decimal time, an
 * h:mm:ss loss, a leg count outside 4-18, or a leg that will not fit the
 * canvas fails fast with a named field.
 */

export type OrienteeringLeg = { control: string; split: string; loss: string };

export type OrienteeringSplitAnalysisProps = {
  /** The racer, the header's bold line. Up to 40 ASCII; "" hides it. */
  name?: string;
  /** The club, first half of the second line. Up to 40 ASCII; "" hides it. */
  club?: string;
  /** The class, joined after the club with " · ". Up to 20 ASCII. */
  className?: string;
  /** The course, the third header line. Up to 48 ASCII; "" hides it. */
  course?: string;
  /** The finish time, the hero figure. "m:ss" or "h:mm:ss", whole seconds. */
  finish?: string;
  /** The place, drawn as the accent "#12" chip. 0 hides the chip. */
  place?: number;
  /** Time behind the winner, printed as entered. Up to 16 ASCII; "" hides it. */
  behind?: string;
  /** The legs in course order, 4-18, each { control, split, loss }. */
  splits?: OrienteeringLeg[] | string;
  /** The mistake-leg pink - bars, loss text, place chip - as #rrggbb. */
  accent?: string;
  /** Page and ink: "dark" share card or "light" print. */
  preset?: "dark" | "light";
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/sports/orienteering-split-analysis/v1";
const TITLE = "Orienteering Split Analysis";
const DEFAULT_ACCENT = "#d94f8c";
const ASCII = /^[\x20-\x7e]*$/;
const HEX = /^#[0-9a-fA-F]{6}$/;

const THEMES = {
  dark: { bg: "#14111d", ink: "#efe9f2", dim: "#9b92a4" },
  light: { bg: "#f6f2ef", ink: "#241d28", dim: "#6f6574" },
} as const;

/** A 12-control middle course: 13 legs in course order, the last the finish. */
export const DEFAULT_LEGS: OrienteeringLeg[] = [
  { control: "1", split: "4:08", loss: "0:47" },
  { control: "2", split: "2:41", loss: "0:00" },
  { control: "3", split: "3:15", loss: "0:00" },
  { control: "4", split: "2:58", loss: "0:00" },
  { control: "5", split: "5:22", loss: "1:20" },
  { control: "6", split: "3:40", loss: "0:00" },
  { control: "7", split: "1:32", loss: "0:00" },
  { control: "8", split: "4:05", loss: "0:00" },
  { control: "9", split: "3:51", loss: "0:51" },
  { control: "10", split: "2:44", loss: "0:00" },
  { control: "11", split: "3:33", loss: "0:00" },
  { control: "12", split: "4:11", loss: "0:00" },
  { control: "F", split: "1:55", loss: "0:00" },
];

const DEFAULTS = {
  name: "Emma Lindqvist",
  club: "OK Klyftamo",
  className: "W21E",
  course: "Middle, 4.2 km",
  finish: "45:02",
  place: 12,
  behind: "+1:23",
  splits: DEFAULT_LEGS,
  accent: DEFAULT_ACCENT,
  preset: "dark" as "dark" | "light",
  debugLayout: false,
};

const propsSchema = definePropsSchema<OrienteeringSplitAnalysisProps>({
  name: {
    type: "string",
    required: false,
    description: "The racer, the header's bold line. Up to 40 ASCII characters; empty hides the line. The sample is invented.",
    meta: { control: { placeholder: DEFAULTS.name }, ui: { label: "Name", order: 1, primary: true } },
  },
  club: {
    type: "string",
    required: false,
    description: 'The club, first half of the second header line. Up to 40 ASCII; empty hides it. Joined to the class with " · ".',
    meta: { control: { placeholder: DEFAULTS.club }, ui: { label: "Club", order: 2 } },
  },
  className: {
    type: "string",
    required: false,
    description: 'The class, joined after the club with " · ". Up to 20 ASCII; empty shows the club alone.',
    meta: { control: { placeholder: DEFAULTS.className }, ui: { label: "Class", order: 3 } },
  },
  course: {
    type: "string",
    required: false,
    description: "The course, the third header line, e.g. \"Middle, 4.2 km\". Up to 48 ASCII; empty hides it.",
    meta: { control: { placeholder: DEFAULTS.course }, ui: { label: "Course", order: 4 } },
  },
  finish: {
    type: "string",
    required: false,
    description: 'The finish time, the hero figure. "m:ss" (minutes may pass 59, so "71:40" is legal) or "h:mm:ss", whole seconds. A decimal fails fast.',
    meta: { control: { placeholder: DEFAULTS.finish }, ui: { label: "Finish", order: 5, primary: true } },
  },
  place: {
    type: "number",
    required: false,
    description: "The place, drawn as the accent chip #12. Whole number 0-9999; 0 hides the chip.",
    meta: { constraints: { min: 0, max: 9999 }, control: { placeholder: String(DEFAULTS.place) }, ui: { label: "Place", order: 6 } },
  },
  behind: {
    type: "string",
    required: false,
    description: 'Time behind the winner, printed as entered, e.g. "+1:23". Up to 16 ASCII; empty hides it.',
    meta: { control: { placeholder: DEFAULTS.behind }, ui: { label: "Behind", order: 7 } },
  },
  splits: {
    type: "json",
    required: false,
    description:
      'The legs in course order, 4-18. Each object is { control, split, loss } - the IOF field names. control is the code, split is "m:ss" or "h:mm:ss" (whole seconds), loss is the WinSplits per-leg time loss as "m:ss" ("0:00" = clean, anything more = a mistake leg drawn pink). Example: [{"control":"1","split":"4:08","loss":"0:47"}].',
    meta: {
      constraints: {
        jsonSchema: {
          type: "array",
          minItems: 4,
          maxItems: 18,
          items: {
            type: "object",
            required: ["control", "split", "loss"],
            properties: {
              control: { type: "string", minLength: 1, maxLength: 8 },
              split: { type: "string" },
              loss: { type: "string" },
            },
          },
        },
      },
      control: { mono: true, placeholder: '[{"control":"1","split":"4:08","loss":"0:47"}]' },
      ui: { label: "Splits", order: 8, primary: true },
    },
  },
  accent: {
    type: "string",
    required: false,
    description: "The mistake-leg pink - bars, loss text and the place chip - as #rrggbb.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 9 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "dark" (default) or "light".',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 10 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, header/body/footer hold their bands, rows equal, tape at least 32% wide) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

function fail(field: string, rule: string): never {
  throw new Error(`${ID}: ${field} ${rule}`);
}

/**
 * "m:ss" or "h:mm:ss" to whole seconds. Minutes may pass 59 in the one-colon
 * form. Seconds (and minutes in the two-colon form) are 0-59. A decimal is
 * refused, not rounded. null when the string is not that grammar.
 */
export function parseSplitTime(text: string): number | null {
  const s = text.trim();
  if (s.length === 0 || /[.]/.test(s)) return null;
  const hms = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(s);
  if (hms) return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);
  const ms = /^(\d+):([0-5]\d)$/.exec(s);
  if (ms) return Number(ms[1]) * 60 + Number(ms[2]);
  return null;
}

/** Compact, no leading zeros. Hours only when the value is at least one hour. */
export function formatSplitTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = String(sec % 60).padStart(2, "0");
  if (h >= 1) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  if (!ASCII.test(value)) fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use one line of printable ASCII.`);
  const s = value.trim();
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
  return s;
}

/** m:ss or h:mm:ss, whole seconds, at least one second, at most 99:59:59. */
function timeField(value: unknown, field: string): { sec: number; printed: string } {
  if (typeof value !== "string") fail(field, 'must be a string, "m:ss" or "h:mm:ss".');
  const sec = parseSplitTime(value);
  if (sec === null) fail(field, `${JSON.stringify(value)} is not a time: write m:ss or h:mm:ss, whole seconds, no decimal (e.g. "4:08" or "1:11:40").`);
  if (sec < 1) fail(field, `${JSON.stringify(value)} must be at least one second.`);
  if (sec > 359999) fail(field, `${JSON.stringify(value)} is longer than 99:59:59; the card cannot fit it.`);
  return { sec, printed: formatSplitTime(sec) };
}

/** The WinSplits per-leg loss: m:ss only (never hours), zero allowed (clean). */
function lossField(value: unknown, field: string): { sec: number; printed: string } {
  if (typeof value !== "string") fail(field, 'must be a string, "m:ss".');
  const t = value.trim();
  if (!/^\d+:[0-5]\d$/.test(t)) fail(field, `${JSON.stringify(value)} is not m:ss: write m:ss, whole seconds (e.g. "0:47"); a loss is a per-leg time, never hours.`);
  const sec = parseSplitTime(t)!;
  if (sec > 359999) fail(field, `${JSON.stringify(value)} is longer than 99:59:59.`);
  return { sec, printed: formatSplitTime(sec) };
}

export type Leg = {
  index: number;
  control: string;
  split: string;
  splitSec: number;
  loss: string;
  lossSec: number;
  isMistake: boolean;
};

export type NormalizedSplitCard = {
  name: string;
  club: string;
  className: string;
  course: string;
  clubLine: string;
  finish: string;
  finishSec: number;
  place: number;
  placeText: string;
  behind: string;
  legs: Leg[];
  slowestSec: number;
  bestSec: number;
  totalLossSec: number;
  totalLossText: string;
  timeWoText: string;
  bestText: string;
  accent: MosaicColor;
  preset: "dark" | "light";
  debugLayout: boolean;
};

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeSplitCard(props: OrienteeringSplitAnalysisProps): NormalizedSplitCard {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const name = text(p.name, "name", 40);
  const club = text(p.club, "club", 40);
  const className = text(p.className, "className", 20);
  const course = text(p.course, "course", 48);
  const behind = text(p.behind, "behind", 16);
  if (p.preset !== "dark" && p.preset !== "light") fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
  if (typeof p.accent !== "string" || !HEX.test(p.accent.trim())) fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");
  const finish = timeField(p.finish, "finish");
  if (typeof p.place !== "number" || !Number.isFinite(p.place)) fail("place", "must be a number.");
  if (!Number.isInteger(p.place)) fail("place", "must be a whole number.");
  if (p.place < 0 || p.place > 9999) fail("place", `${p.place} is outside 0-9999; 0 hides the chip.`);

  let splits = p.splits;
  if (typeof splits === "string") {
    try {
      splits = JSON.parse(splits);
    } catch {
      fail("splits", `is not valid JSON: ${JSON.stringify(splits.slice(0, 60))}. Pass a list of {control, split, loss}.`);
    }
  }
  if (!Array.isArray(splits)) fail("splits", 'must be a list of legs, e.g. [{"control":"1","split":"4:08","loss":"0:47"}].');
  if (splits.length < 4 || splits.length > 18) fail("splits", `has ${splits.length} legs; a course is 4 to 18 legs (the finish leg counts).`);
  const legs: Leg[] = splits.map((raw, i) => {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) fail(`splits[${i}]`, "must be an object with control, split and loss.");
    const o = raw as OrienteeringLeg;
    const control = text(o.control, `splits[${i}].control`, 8);
    if (control === "") fail(`splits[${i}].control`, "is empty; give the control code.");
    const split = timeField(o.split, `splits[${i}].split`);
    const loss = lossField(o.loss, `splits[${i}].loss`);
    return { index: i, control, split: split.printed, splitSec: split.sec, loss: loss.printed, lossSec: loss.sec, isMistake: loss.sec > 0 };
  });

  const slowestSec = Math.max(...legs.map((l) => l.splitSec));
  const bestSec = Math.min(...legs.map((l) => l.splitSec));
  const totalLossSec = legs.reduce((a, l) => a + l.lossSec, 0);
  if (totalLossSec > finish.sec) {
    fail("splits", `the per-leg losses sum to ${formatSplitTime(totalLossSec)}, more than the finish ${finish.printed}; time-without-mistakes would be negative.`);
  }
  const clubLine = [club, className].filter((s) => s !== "").join(" \u00b7 ");
  return {
    name, club, className, course, clubLine,
    finish: finish.printed, finishSec: finish.sec,
    place: p.place, placeText: p.place > 0 ? `#${p.place}` : "",
    behind,
    legs, slowestSec, bestSec, totalLossSec,
    totalLossText: totalLossSec > 0 ? `+${formatSplitTime(totalLossSec)}` : "0:00",
    timeWoText: formatSplitTime(finish.sec - totalLossSec),
    bestText: formatSplitTime(bestSec),
    accent: p.accent.trim().toLowerCase() as MosaicColor,
    preset: p.preset, debugLayout: p.debugLayout,
  };
}

function mix(a: string, b: string, t: number): MosaicColor {
  const ch = (s: string, i: number) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}
function luminance(hex: string): number {
  const c = (i: number) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
function onColor(fill: string): MosaicColor {
  const ratio = (other: string) => { const a = luminance(fill), b = luminance(other); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  return (ratio("#14111d") >= ratio("#ffffff") ? "#14111d" : "#ffffff") as MosaicColor;
}

export type SplitRect = { x: number; y: number; w: number; h: number };
type Bind =
  | { kind: "prop"; key: string }
  | { kind: "path"; path: (string | number)[]; valueKind: "string" | "number" }
  | null;
type Cell = { label: string; rect: SplitRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; over: boolean };
type Tile = { label: string; rect: SplitRect; color: MosaicColor; radius: number; layer: number; accent?: boolean };

function fitPx(line: string, cellW: number, maxPx: number, bold = false): number {
  const top = Math.max(1, Math.round(maxPx));
  const room = budget(cellW);
  const w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}

/** The whole card as rects and measured fits - pure in (props, canvas). */
export function layoutSplitCard(props: OrienteeringSplitAnalysisProps, W: number, H: number) {
  const p = normalizeSplitCard(props);
  const theme = THEMES[p.preset];
  const ink = theme.ink as MosaicColor;
  const dim = theme.dim as MosaicColor;
  const S = Math.min(H, 0.75 * W);
  const m = Math.max(8, Math.round(S * 0.04));
  const CW = W - 2 * m;
  const floor = Math.max(6, Math.round(Math.min(W, H) * 0.012));
  const small = Math.max(5, Math.round(Math.min(W, H) * 0.009));
  const gap = Math.max(3, Math.round(CW * 0.01));
  const unfit = (field: string): never => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);

  // The three pinned bands: header [0, 0.26], body [0.26, 0.80], footer [0.80, 1].
  const headerBottom = Math.floor(0.26 * H) - 1;
  const bodyTop = Math.ceil(0.26 * H) + 2;
  const bodyBottom = Math.floor(0.8 * H) - 2;
  const footerTop = Math.ceil(0.8 * H) + 2;

  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const line = (label: string, rect: SplitRect, value: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; over?: boolean; field?: string; floorAt?: number } = {}) => {
    if (px < (o.floorAt ?? floor)) unfit(o.field ?? label);
    if (rect.w < 4 || rect.h < 4) unfit(o.field ?? label);
    cells.push({ label, rect, text: value, px, width: widthOf(value, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? ink, bind: o.bind ?? null, over: o.over === true });
  };

  const portrait = H > W * 1.15;
  const heroCap = Math.round(S * (portrait ? 0.22 : 0.145));

  type Header = {
    heroPx: number; blockTop: number; blockH: number; rightW: number; leftW: number;
    finishRect: SplitRect; labelPx: number; chipPx: number; chipRect: SplitRect | null; behindPx: number;
    namePx: number; clubPx: number; coursePx: number; leftTop: number; rightTop: number; row1H: number; row2H: number;
    finishLabelRect: SplitRect; placeLabelRect: SplitRect | null; behindRect: SplitRect | null;
  };

  const headerAt = (heroPx: number): Header | null => {
    if (heroPx <= floor) return null;
    const labelPx = Math.max(small, Math.min(Math.round(heroPx * 0.18), heroPx - 2));
    const chipPx = p.place > 0 ? Math.max(small, Math.min(Math.round(heroPx * 0.26), heroPx - 2)) : 0;
    const behindPx = p.behind !== "" ? Math.max(small, Math.min(Math.round(heroPx * 0.24), heroPx - 2)) : 0;
    const chipPad = Math.max(3, Math.round(chipPx * 0.45));

    const finishW = Math.ceil((widthOf(p.finish, heroPx, true) + 2) / 0.94) + 2;
    const finishLabelW = Math.ceil((widthOf("FINISH", labelPx) + 2) / 0.94) + 2;
    const row1W = finishLabelW + gap + finishW;
    const chipW = p.place > 0 ? Math.ceil((widthOf(p.placeText, chipPx, true) + 2) / 0.94) + 2 + 2 * chipPad : 0;
    const placeLabelW = p.place > 0 ? Math.ceil((widthOf("PLACE", labelPx) + 2) / 0.94) + 2 : 0;
    const behindW = p.behind !== "" ? Math.ceil((widthOf(p.behind, behindPx) + 2) / 0.94) + 2 : 0;
    const hasRow2 = p.place > 0 || p.behind !== "";
    let row2W = 0;
    if (hasRow2) row2W = (placeLabelW > 0 ? placeLabelW + gap : 0) + (chipW > 0 ? chipW + gap : 0) + behindW;
    const rightW = Math.max(row1W, row2W);
    const leftW = CW - rightW - gap;
    if (leftW < Math.round(CW * 0.34)) return null;

    const namePx = p.name === "" ? 0 : fitPx(p.name, leftW, Math.min(heroPx - 1, Math.round(S * 0.05)), true);
    const clubPx = p.clubLine === "" ? 0 : fitPx(p.clubLine, leftW, Math.min(heroPx - 2, Math.round(S * 0.03)));
    const coursePx = p.course === "" ? 0 : fitPx(p.course, leftW, Math.min(heroPx - 2, Math.round(S * 0.028)));
    if ((p.name !== "" && namePx < floor) || (p.clubLine !== "" && clubPx < small) || (p.course !== "" && coursePx < small)) return null;
    if (chipPx > 0 && chipPx < small) return null;
    if (labelPx < small) return null;

    const finishH = Math.round(heroPx * 1.16);
    const finishLabelH = Math.round(labelPx * 1.3);
    const row1H = Math.max(finishH, finishLabelH);
    const chipH = p.place > 0 ? Math.round(chipPx * 1.7) : 0;
    const behindH = p.behind !== "" ? Math.round(behindPx * 1.3) : 0;
    const placeLabelH = p.place > 0 ? Math.round(labelPx * 1.3) : 0;
    const row2H = Math.max(chipH, behindH, placeLabelH);
    const rightH = row1H + (hasRow2 ? gap + row2H : 0);

    const nameH = p.name !== "" ? Math.round(namePx * 1.2) : 0;
    const clubH = p.clubLine !== "" ? Math.round(clubPx * 1.3) : 0;
    const courseH = p.course !== "" ? Math.round(coursePx * 1.3) : 0;
    const leftParts = [nameH, clubH, courseH].filter((h) => h > 0);
    const leftGap = Math.max(2, Math.round(gap * 0.45));
    const leftH = leftParts.reduce((a, h) => a + h, 0) + Math.max(0, leftParts.length - 1) * leftGap;

    const blockH = Math.max(rightH, leftH, finishH);
    const avail = headerBottom - m;
    if (blockH > avail) return null;
    const blockTop = m + Math.max(0, Math.round((avail - blockH) / 2));
    const rightTop = blockTop;
    const leftTop = blockTop;

    const finishRect: SplitRect = { x: W - m - finishW, y: rightTop + Math.round((row1H - finishH) / 2), w: finishW, h: finishH };
    const finishLabelRect: SplitRect = { x: W - m - row1W, y: rightTop + Math.round((row1H - finishLabelH) / 2), w: finishLabelW, h: finishLabelH };
    let placeLabelRect: SplitRect | null = null;
    let chipRect: SplitRect | null = null;
    let behindRect: SplitRect | null = null;
    if (hasRow2) {
      const row2Y = rightTop + row1H + gap;
      let rx = W - m;
      if (p.behind !== "") {
        behindRect = { x: rx - behindW, y: row2Y + Math.round((row2H - behindH) / 2), w: behindW, h: behindH };
        rx = behindRect.x - gap;
      }
      if (p.place > 0) {
        chipRect = { x: rx - chipW, y: row2Y + Math.round((row2H - chipH) / 2), w: chipW, h: chipH };
        rx = chipRect.x - gap;
        placeLabelRect = { x: rx - placeLabelW, y: row2Y + Math.round((row2H - placeLabelH) / 2), w: placeLabelW, h: placeLabelH };
      }
    }

    return { heroPx, blockTop, blockH, rightW, leftW, finishRect, labelPx, chipPx, chipRect, behindPx, namePx, clubPx, coursePx, leftTop, rightTop, row1H, row2H, finishLabelRect, placeLabelRect, behindRect };
  };

  let heroPx = Math.min(heroCap, Math.max(floor + 8, Math.round((headerBottom - m) * 0.5)));
  let header: Header | null = null;
  while (heroPx > floor + 1) {
    header = headerAt(heroPx);
    if (header) break;
    heroPx -= 1;
  }
  const hd = header ?? fail("finish", `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);

  // ---- header left block (top-aligned) ----
  let ly = hd.leftTop;
  const leftX = m;
  if (p.name !== "") {
    const h = Math.round(hd.namePx * 1.2);
    line("name", { x: leftX, y: ly, w: hd.leftW, h }, p.name, hd.namePx, { bold: true, bind: { kind: "prop", key: "name" }, field: "name" });
    ly += h + Math.max(2, Math.round(gap * 0.45));
  }
  if (p.clubLine !== "") {
    const h = Math.round(hd.clubPx * 1.3);
    let cx2 = leftX;
    if (p.club !== "") {
      const w = Math.ceil((widthOf(p.club, hd.clubPx) + 2) / 0.94) + 2;
      line("club", { x: cx2, y: ly, w, h }, p.club, hd.clubPx, { color: dim, bind: { kind: "prop", key: "club" }, field: "club", floorAt: small });
      cx2 += w;
    }
    if (p.className !== "") {
      const t = p.club !== "" ? " \u00b7 " + p.className : p.className;
      const w = Math.ceil((widthOf(t, hd.clubPx) + 2) / 0.94) + 2;
      line("class", { x: cx2, y: ly, w, h }, t, hd.clubPx, { color: dim, bind: { kind: "prop", key: "className" }, field: "className", floorAt: small });
    }
    ly += h + Math.max(2, Math.round(gap * 0.45));
  }
  if (p.course !== "") {
    const h = Math.round(hd.coursePx * 1.3);
    line("course", { x: leftX, y: ly, w: hd.leftW, h }, p.course, hd.coursePx, { color: dim, bind: { kind: "prop", key: "course" }, field: "course", floorAt: small });
  }

  // ---- header right block ----
  line("finish", hd.finishRect, p.finish, hd.heroPx, { bold: true, align: "right", bind: { kind: "prop", key: "finish" }, field: "finish" });
  line("finish-label", hd.finishLabelRect, "FINISH", hd.labelPx, { color: dim, align: "right", floorAt: small });
  if (hd.placeLabelRect) {
    line("place-label", hd.placeLabelRect, "PLACE", hd.labelPx, { color: dim, align: "right", floorAt: small });
  }
  if (hd.chipRect && p.place > 0) {
    tiles.push({ label: "place-chip", rect: hd.chipRect, color: p.accent, radius: 1, layer: 5, accent: true });
    line("place", hd.chipRect, p.placeText, hd.chipPx, { bold: true, align: "center", color: onColor(p.accent), bind: { kind: "prop", key: "place" }, over: true, floorAt: small, field: "place" });
  }
  if (hd.behindRect && p.behind !== "") {
    line("behind", hd.behindRect, p.behind, hd.behindPx, { color: dim, align: "right", bind: { kind: "prop", key: "behind" }, field: "behind", floorAt: small });
  }

  // ---- body: one row per leg, tape length = split / slowest ----
  const rowH = Math.floor((bodyBottom - bodyTop) / p.legs.length);
  if (rowH < 8) unfit("the leg rows");
  const rowsEnd = bodyTop + rowH * p.legs.length;

  const idxW = Math.max(Math.round(CW * 0.05), Math.round(S * 0.035));
  const tapeW = Math.round(CW * 0.36);
  if (tapeW / W < 0.32) unfit("the tape");
  const remaining = CW - idxW - tapeW - 3 * gap;
  if (remaining < Math.round(CW * 0.14)) unfit("the split and loss columns");
  const splitColW = Math.round(remaining * 0.5);
  const lossColW = remaining - splitColW;
  let cx = m;
  const take = (w: number) => { const r = { x: cx, w }; cx += w + gap; return r; };
  const cCtrl = take(idxW);
  const cTape = take(tapeW);
  const cSplit = take(splitColW);
  const cLoss = take(lossColW);

  const rowCap = hd.heroPx - 1;
  const rowHeightCap = Math.floor((rowH - 2) / 1.25);
  const longestControl = p.legs.reduce((s, l) => (l.control.length >= s.length ? l.control : s), "100");
  const longestSplit = p.legs.reduce((s, l) => (l.split.length >= s.length ? l.split : s), "4:08");
  const mistakeLosses = p.legs.filter((l) => l.isMistake).map((l) => `+${l.loss}`);
  let rowPx = Math.min(rowCap, rowHeightCap);
  rowPx = Math.min(
    rowPx,
    fitPx(longestControl, cCtrl.w, rowPx),
    fitPx(longestSplit, cSplit.w, rowPx),
    ...(mistakeLosses.length > 0 ? [fitPx(mistakeLosses.reduce((s, t) => (t.length >= s.length ? t : s), "+0:00"), cLoss.w, rowPx, true)] : []),
  );
  if (rowPx < floor) unfit("the leg rows");

  const barH = Math.max(4, Math.min(rowH - 4, Math.round(Math.min(rowH * 0.42, S * 0.04))));
  const railColor = mix(theme.bg, theme.ink, 0.14);
  const barColor = mix(theme.bg, theme.ink, p.preset === "dark" ? 0.5 : 0.45);
  const textH = Math.round(rowPx * 1.25);
  const textYOff = Math.round((rowH - textH) / 2);

  const bands: SplitRect[] = [];
  p.legs.forEach((leg, i) => {
    const band: SplitRect = { x: m, y: bodyTop + i * rowH, w: CW, h: rowH };
    bands.push(band);
    const wash = leg.isMistake ? mix(theme.bg, p.accent, 0.16) : mix(theme.bg, theme.ink, i % 2 === 0 ? 0.035 : 0.07);
    tiles.push({ label: `band-${i}`, rect: band, color: wash, radius: 0, layer: 0 });
    if (leg.isMistake) {
      const ruleW = Math.max(2, Math.round(S * 0.004));
      tiles.push({ label: `mistake-rule-${i}`, rect: { x: band.x, y: band.y, w: ruleW, h: band.h }, color: p.accent, radius: 0, layer: 4, accent: true });
    }
    const rail: SplitRect = { x: cTape.x, y: band.y + Math.round((rowH - barH) / 2), w: cTape.w, h: barH };
    tiles.push({ label: `rail-${i}`, rect: rail, color: railColor, radius: 0, layer: 2 });
    const barW = Math.max(1, Math.round(rail.w * leg.splitSec / p.slowestSec));
    const bar: SplitRect = { x: rail.x, y: rail.y, w: barW, h: rail.h };
    tiles.push({ label: `bar-${i}`, rect: bar, color: leg.isMistake ? p.accent : barColor, radius: 0, layer: 3, accent: leg.isMistake });
    const ty = band.y + textYOff;
    line(`ctrl-${i}`, { x: cCtrl.x, y: ty, w: cCtrl.w, h: textH }, leg.control, rowPx, { color: dim, align: "right", bind: { kind: "path", path: [i, "control"], valueKind: "string" }, floorAt: small });
    line(`split-${i}`, { x: cSplit.x, y: ty, w: cSplit.w, h: textH }, leg.split, rowPx, { color: dim, align: "right", bind: { kind: "path", path: [i, "split"], valueKind: "string" } });
    if (leg.isMistake) {
      line(`loss-${i}`, { x: cLoss.x, y: ty, w: cLoss.w, h: textH }, `+${leg.loss}`, rowPx, { bold: true, color: p.accent, align: "right", bind: { kind: "path", path: [i, "loss"], valueKind: "string" } });
    }
  });

  // ---- footer: three computed cells ----
  const footLabelPx0 = Math.min(hd.heroPx - 2, Math.round(S * 0.02));
  const footValuePx0 = Math.min(hd.heroPx - 1, Math.round(S * 0.042));
  const cellW = Math.floor(CW / 3);
  const footLabels = ["TIME W/O MISTAKES", "TOTAL LOSS", "BEST LEG"] as const;
  const footValues = [p.timeWoText, p.totalLossText, p.bestText];
  let footLabelPx = footLabels.reduce((px, t) => Math.min(px, fitPx(t, cellW, footLabelPx0)), footLabelPx0);
  let footValuePx = footValues.reduce((px, t) => Math.min(px, fitPx(t, cellW, footValuePx0, true)), footValuePx0);
  if (footLabelPx < small) unfit("the footer labels");
  if (footValuePx < floor) unfit("the footer values");
  if (footValuePx >= hd.heroPx) footValuePx = hd.heroPx - 1;
  if (footLabelPx >= hd.heroPx) footLabelPx = Math.max(small, hd.heroPx - 2);
  const footLabelH = Math.round(footLabelPx * 1.3);
  const footValueH = Math.round(footValuePx * 1.2);
  const footGap = Math.max(2, Math.round(gap * 0.45));
  const footBlock = footLabelH + footGap + footValueH;
  let footTop = Math.max(footerTop, rowsEnd + gap);
  if (footTop + footBlock > H - m) {
    footTop = Math.max(footerTop, H - m - footBlock);
  }
  if (footTop + footBlock > H - Math.max(4, Math.round(m * 0.4))) unfit("the footer");

  const footKeys = ["time-wo", "total-loss", "best-leg"] as const;
  for (let i = 0; i < 3; i++) {
    const x = m + i * cellW;
    const cell: SplitRect = { x, y: footTop, w: cellW, h: footBlock };
    tiles.push({ label: `foot-${i}`, rect: cell, color: mix(theme.bg, theme.ink, 0.04), radius: 0, layer: 0 });
    line(`foot-label-${i}`, { x, y: footTop, w: cellW, h: footLabelH }, footLabels[i], footLabelPx, { color: dim, align: "center", floorAt: small });
    line(footKeys[i], { x, y: footTop + footLabelH + footGap, w: cellW, h: footValueH }, footValues[i], footValuePx, { bold: true, align: "center" });
  }
  tiles.push({ label: "rule-foot", rect: { x: m, y: Math.max(rowsEnd, footTop - gap) + Math.max(0, Math.round((Math.min(gap, footTop - rowsEnd) - 2) / 2)), w: CW, h: 2 }, color: railColor, radius: 0, layer: 1 });

  return {
    p, theme, cells, tiles, bands, m, floor, small, heroPx: hd.heroPx, rowPx, barH,
    tape: cTape, rowH, rowsTop: bodyTop, rowsEnd, footTop, headerBottom, bodyTop, bodyBottom, footerTop,
  };
}

const WHY: WhySpec = {
  "day": 35,
  "date": "2026-10-24",
  "agent": "opencode",
  "model": "deepseek-v4-pro",
  "id": ID,
  "title": TITLE,
  "who": "Orienteers who post and analyze their control split times after every race, on Attackpoint and club/WinSplits result pages",
  "problem": [
    "WinSplits already computes the answer everyone asks after a race - \"where did I lose time?\" - as a per-leg time loss with mistake legs pink: \"Some split times have pink background colour... a mistake has probably been made.\"",
    "But that analysis lives in a results-table web page nobody can post. Orienteers upload raw splits to Attackpoint and hand-make the graphical split-time analysis World of O News draws for every championship, because the shareable card does not exist.",
    "Every club worldwide runs events weekly, so the moment recurs weekly: one racer, one finish time, and a row of control splits that say where the minutes went.",
  ],
  "sources": [
    "https://attackpoint.org/",
    "http://obasen.orientering.se/winsplits/online/en/help_table.asp?databaseId=101857&categoryId=0",
    "https://orienteering.sport/iof/it/data-standard-3-0",
    "https://news.worldofo.com/2026/07/11/woc-2026-knock-out-sprint-maps-and-results",
    "https://orienteeringusa.org/2026/04/junior-nationals-and-flying-pig-xxviii-event-recap/"
  ],
  "solution": [
    "One deterministic still of one racer's IOF XML 3.0 result row. The finish time is the hero with the course and place beside it; each leg is a tape whose length is the split over the slowest leg, and any leg with time loss is pink in bar and signed loss text.",
    "The one design decision: time loss is a prop, never re-derived. WinSplits computes it class-relative, so the card takes it per leg and only sums it (TOTAL LOSS), subtracts it from the finish (TIME W/O MISTAKES) and takes the min split (BEST LEG).",
    "Bar length = split, pink = mistake, so the \"where did I lose time?\" answer reads from the picture without a legend. Emma Lindqvist and her club are invented; the field names mirror the IOF schema (control, split, loss).",
  ],
  "usage": {
    "command": "m0saic make @one-a-day/sports/orienteering-split-analysis/v1 --template-repo . -w 1280 -h 720 -o journal/2026-10-24/split-analysis.png",
    "try": [
      "preset light, accent #2f6f62: a light page, the mistakes in the new colour",
      "place 0: the chip goes; the finish stays the largest figure",
      "a mistake on the last leg: the F row turns pink and the loss reads +0:47",
      "4 legs for a sprint, 18 for a long course: the tape re-scales, the bands hold",
    ],
  },
  "caveats": [
    "Time loss is not re-derived: feed the WinSplits per-leg number, or the card sums zeros and every bar reads neutral.",
    "Bar length is the split over the slowest leg, not an absolute scale, so it shows relative leg effort and not leg length in minutes.",
    "The finish is printed as entered and not checked against the split sum; a finish shorter than the total loss fails fast rather than print a negative time-without-mistakes.",
  ],
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 2168,
        "status": "error"
      },
      {
        "name": "scout (2)",
        "startMs": 2185,
        "durMs": 1688,
        "status": "error"
      },
      {
        "name": "scout (3)",
        "startMs": 8454353,
        "durMs": 132981,
        "calls": 20,
        "tokens": 593418,
        "costUsd": 0.07,
        "tools": "websearch 7, bash 5, read 5"
      },
      {
        "name": "plan",
        "startMs": 8587355,
        "durMs": 133083,
        "calls": 16,
        "tokens": 524097,
        "costUsd": 0.08,
        "tools": "read 8, bash 7, write 1"
      }
    ],
    "costBasis": "reported"
  }
};

export const OrienteeringSplitAnalysisV1 = defineMosaicTemplate<OrienteeringSplitAnalysisProps>({
  id: asTemplateId(ID),
  label: "2026-10-24 · Orienteering Split Analysis",
  version: 1,
  description:
    "An orienteering race split-analysis card from one IOF XML 3.0 result row: control-by-control splits as a tape whose length is the leg, mistake legs pink with their time loss signed, finish time as the hero, and time-without-mistakes, total loss and best leg computed from the entered numbers.",
  capabilities: { tier: "core" },
  tags: ["sports", "2026-10-24", "day-035", "orienteering", "splits", "time-loss", "iof-xml", "attackpoint", "race-analysis"],

  outputHints: {
    width: 1280,
    height: 720,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Static PNG. The finish is the hero at every aspect; the leg tape re-scales with the course length. Minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,
  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default OrienteeringSplitAnalysisV1;

async function render(props: OrienteeringSplitAnalysisProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutSplitCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];
  const relations: RelationalConstraint[] = [];

  for (const t of [...L.tiles].sort((a, b) => a.layer - b.layer)) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "pill" } } } : {}) } as MosaicSource, t.label);
    pieces.push({ rect: { ...t.rect, importance: t.layer }, source: t.accent ? bindProp(tile, "accent") : tile });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    const source = c.bind === null
      ? cell
      : c.bind.kind === "prop"
        ? bindProp(cell, c.bind.key)
        : bindPropPath(cell, "splits", c.bind.path, c.bind.valueKind);
    pieces.push({ rect: { ...c.rect, importance: c.over ? 6 : 5 }, source });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  const has = (label: string) => L.cells.some((c) => c.label === label);
  for (const label of ["name", "club", "class", "course", "finish", "finish-label", "place", "place-label", "behind"]) {
    if (has(label)) constraints.push({ label, within: { yFrac: [0, 0.26] } });
  }
  if (L.tiles.some((t) => t.label === "place-chip")) {
    constraints.push({ label: "place-chip", within: { yFrac: [0, 0.26] } });
    constraints.push({ label: "place-chip" });
  }

  for (let i = 0; i < L.p.legs.length; i++) {
    const band = L.bands[i];
    const y0 = Math.max(0, band.y / H - 1 / H);
    const y1 = Math.min(1, (band.y + band.h) / H + 1 / H);
    constraints.push({ label: `band-${i}`, within: { yFrac: [0.26, 0.8] } });
    constraints.push({ label: `rail-${i}`, minWidthFrac: 0.32, within: { yFrac: [y0, y1] } });
    constraints.push({ label: `bar-${i}`, within: { yFrac: [y0, y1] } });
    if (L.tiles.some((t) => t.label === `mistake-rule-${i}`)) constraints.push({ label: `mistake-rule-${i}`, within: { yFrac: [y0, y1] } });
    for (const label of [`ctrl-${i}`, `split-${i}`]) {
      constraints.push({ label, within: { yFrac: [0.26, 0.8] } });
    }
    if (has(`loss-${i}`)) constraints.push({ label: `loss-${i}`, within: { yFrac: [0.26, 0.8] } });
  }
  relations.push({ label: L.p.legs.map((_, i) => `band-${i}`), equal: "size", tolerancePx: 2 });

  for (let i = 0; i < 3; i++) {
    constraints.push({ label: `foot-${i}`, within: { yFrac: [0.8, 1] } });
    constraints.push({ label: `foot-label-${i}`, within: { yFrac: [0.8, 1] } });
  }
  for (const label of ["time-wo", "total-loss", "best-leg"]) constraints.push({ label, within: { yFrac: [0.8, 1] } });
  relations.push({ label: ["foot-0", "foot-1", "foot-2"], equal: "size", tolerancePx: 2 });

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
