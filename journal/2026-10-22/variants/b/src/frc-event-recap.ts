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
import { budget, fitLine, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/sports/frc-event-recap/v1` - an FRC event recap card from the
 * fields The Blue Alliance publishes for a team at an event: the team number
 * as the card's identity, the event and week, the qual rank with the team
 * count, the W-L-T record, the alliance selection and playoff finish as
 * chips, up to three award lines, and the district points in the footer. One
 * deterministic card per event, for the recap posts team media students
 * already write after every tournament.
 *
 * ONE CONCEPT: **the card derives what it can and constrains the rest to The
 * Blue Alliance's own vocabulary.** Rank, team count, record and district
 * points are numbers, validated in `render()`; the alliance and playoff
 * chips come from closed enums (captain / 1st pick / 2nd pick, alliance 1-8;
 * winner / finalist / semifinalist / quarterfinalist) so their text always
 * fits; awards are the one free text on the card, capped at three lines and
 * shrunk to fit above the floor, never ellipsized.
 *
 * The rule that bites: **qualRank above a non-zero teamCount is refused.** A
 * card that says "RANK 12 of 10 teams" is lying, and a recap graphic nobody
 * trusts is worse than none.
 */

export type FrcAllianceRole = "captain" | "pick1" | "pick2" | "none";
export type FrcPlayoffResult = "winner" | "finalist" | "semifinalist" | "quarterfinalist" | "none";

export type FrcEventRecapProps = {
  /** The team number - the hero line "TEAM 9128" (1-99999). */
  teamNumber?: number;
  /** The team nickname, printed in caps under the number. Up to 30 ASCII characters; "" removes the line. */
  teamName?: string;
  /** The event name as The Blue Alliance has it ("Harbor City District"). Up to 40 ASCII characters. */
  eventName?: string;
  /** Printed after the event name, " - " joined: "Week 4", "DCMP", "Offseason". Up to 20 ASCII characters; "" removes it. */
  weekLabel?: string;
  /** The qualification rank (1-200). Above teamCount (when set) is refused. */
  qualRank?: number;
  /** The teams at the event, for the "of 48 teams" line under the rank (0-200; 0 hides the line). */
  teamCount?: number;
  /** The qualification record as W-L-T digits, e.g. "17-0-0". */
  record?: string;
  /** The alliance-selection chip: "captain" / "pick1" / "pick2" ("CAPTAIN - ALLIANCE N", "1ST PICK - ALLIANCE N", "2ND PICK - ALLIANCE N"); "none" hides it. */
  allianceRole?: FrcAllianceRole;
  /** The N on the alliance chip (1-8; ignored when the role is "none"). */
  allianceNumber?: number;
  /** The playoff chip: "winner" ("EVENT WINNER") / "finalist" / "semifinalist" / "quarterfinalist"; "none" hides it. */
  playoffResult?: FrcPlayoffResult;
  /** 0-3 award lines (TBA award names run long): each up to 60 ASCII characters, shrunk to fit. */
  awards?: string[] | string;
  /** District points, the footer-left "78 DISTRICT POINTS" (0-999; 0 hides it - regionals and offseason events earn none). */
  districtPoints?: number;
  /** The one accent - the header rule, the chip outlines, the award ticks - as #rrggbb. */
  accent?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/sports/frc-event-recap/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
/** Printable ASCII: what the bundled font is guaranteed to draw. */
const ASCII = /^[\x20-\x7e]*$/;

const PAGE = "#0d131c" as MosaicColor;
const INK = "#eef3f9" as MosaicColor;
const DIM = "#8d9bb0" as MosaicColor;

const HEADER_LABEL = "FRC EVENT RECAP";
const RECORD_SUB = "W - L - T";
const CREDIT = "DATA: THE BLUE ALLIANCE";
const AWARDS_LABEL = "AWARDS";

const DEFAULTS = {
  teamNumber: 9128,
  teamName: "",
  eventName: "Harbor City District",
  weekLabel: "Week 4",
  qualRank: 1,
  teamCount: 48,
  record: "17-0-0",
  allianceRole: "captain" as FrcAllianceRole,
  allianceNumber: 1,
  playoffResult: "winner" as FrcPlayoffResult,
  awards: ["Innovation in Control Award"],
  districtPoints: 78,
  accent: "#2f7bff",
  debugLayout: false,
};

const PROPS = Object.keys(DEFAULTS);

const propsSchema = definePropsSchema<FrcEventRecapProps>({
  teamNumber: {
    type: "number",
    required: false,
    description: "The team number - the hero line \"TEAM 9128\" (1-99999). Every FRC team is known by its number.",
    meta: { constraints: { min: 1, max: 99999 }, control: { placeholder: String(DEFAULTS.teamNumber) }, ui: { label: "Team number", order: 1, primary: true } },
  },
  teamName: {
    type: "string",
    required: false,
    description: "The team nickname, printed in caps under the number. Up to 30 ASCII characters; empty removes the line (the default renders the number only, like the TBA page).",
    meta: { control: { placeholder: "Iron Panthers" }, ui: { label: "Team name", order: 2 } },
  },
  eventName: {
    type: "string",
    required: false,
    description: "The event name as The Blue Alliance has it. Up to 40 ASCII characters; the sample event is invented.",
    meta: { control: { placeholder: DEFAULTS.eventName }, ui: { label: "Event", order: 3, primary: true } },
  },
  weekLabel: {
    type: "string",
    required: false,
    description: 'Printed after the event name, " - " joined: "Week 4", "DCMP", "Offseason". Up to 20 ASCII characters; empty removes it.',
    meta: { control: { placeholder: DEFAULTS.weekLabel }, ui: { label: "Week", order: 4 } },
  },
  qualRank: {
    type: "number",
    required: false,
    description: "The qualification rank (1-200) - the left hero figure. A rank above teamCount (when that is set) is refused: the card would be lying.",
    meta: { constraints: { min: 1, max: 200 }, control: { placeholder: String(DEFAULTS.qualRank) }, ui: { label: "Qual rank", order: 5, primary: true } },
  },
  teamCount: {
    type: "number",
    required: false,
    description: 'The teams at the event, for the "of 48 teams" line under the rank (0-200); 0 hides the line.',
    meta: { constraints: { min: 0, max: 200 }, control: { placeholder: String(DEFAULTS.teamCount) }, ui: { label: "Team count", order: 6 } },
  },
  record: {
    type: "string",
    required: false,
    description: 'The qualification record as W-L-T digits, e.g. "17-0-0" - the right hero figure.',
    meta: { control: { placeholder: DEFAULTS.record }, ui: { label: "Record (W-L-T)", order: 7, primary: true } },
  },
  allianceRole: {
    type: "string",
    required: false,
    description: 'The alliance-selection chip: "captain", "pick1" or "pick2" (printed "CAPTAIN - ALLIANCE N" / "1ST PICK - ALLIANCE N" / "2ND PICK - ALLIANCE N"); "none" hides the chip.',
    meta: { constraints: { oneOf: ["captain", "pick1", "pick2", "none"] }, ui: { label: "Alliance selection", order: 8 } },
  },
  allianceNumber: {
    type: "number",
    required: false,
    description: 'The alliance number on the chip (1-8); ignored when the role is "none".',
    meta: { constraints: { min: 1, max: 8 }, control: { placeholder: String(DEFAULTS.allianceNumber) }, ui: { label: "Alliance number", order: 9 } },
  },
  playoffResult: {
    type: "string",
    required: false,
    description: 'The playoff chip: "winner" (EVENT WINNER), "finalist", "semifinalist" or "quarterfinalist"; "none" hides it.',
    meta: { constraints: { oneOf: ["winner", "finalist", "semifinalist", "quarterfinalist", "none"] }, ui: { label: "Playoff finish", order: 10 } },
  },
  awards: {
    type: "json",
    required: false,
    description: 'Up to three award lines as The Blue Alliance names them (its names run long): each up to 60 ASCII characters, shrunk to fit, never ellipsized. Example: ["Innovation in Control Award", "Excellence in Engineering Award"].',
    meta: {
      constraints: { jsonSchema: { type: "array", maxItems: 3, items: { type: "string", maxLength: 60 } } },
      control: { mono: true, placeholder: '["Innovation in Control Award"]' },
      ui: { label: "Awards", order: 11 },
    },
  },
  districtPoints: {
    type: "number",
    required: false,
    description: 'District points - the footer-left "78 DISTRICT POINTS" (0-999); 0 hides it (regionals and offseason events earn none).',
    meta: { constraints: { min: 0, max: 999 }, control: { placeholder: String(DEFAULTS.districtPoints) }, ui: { label: "District points", order: 12 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The one accent - the header rule, the chip outlines, the award ticks - as #rrggbb. The default is a The-Blue-Alliance-ish blue.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 13 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits, the team number holds the top band, the footer holds the bottom) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── derived copy: TBA's own vocabulary, never hand-typed at render ── */

/** The alliance chip's text, or "" when the team was not selected. */
export function allianceChipText(role: FrcAllianceRole, allianceNumber: number): string {
  if (role === "none") return "";
  const head = role === "captain" ? "CAPTAIN" : role === "pick1" ? "1ST PICK" : "2ND PICK";
  return `${head} - ALLIANCE ${allianceNumber}`;
}

/** The playoff chip's text, or "" when the team did not make the playoffs. */
export function playoffChipText(result: FrcPlayoffResult): string {
  if (result === "winner") return "EVENT WINNER";
  if (result === "finalist") return "FINALIST";
  if (result === "semifinalist") return "SEMIFINALIST";
  if (result === "quarterfinalist") return "QUARTERFINALIST";
  return "";
}

/** The record as printed - validated W-L-T digits, then as-is. Throws naming the prop. */
export function recordText(wlt: string): string {
  const s = wlt.trim();
  if (!/^\d{1,3}-\d{1,3}-\d{1,3}$/.test(s)) {
    throw new Error(`${ID}: record ${JSON.stringify(wlt)} must be W-L-T digits like "17-0-0" (wins-losses-ties).`);
  }
  return s;
}

/** The line under the rank: "" when the team count is not given. */
export function rankSub(teamCount: number): string {
  if (teamCount <= 0) return "";
  return `of ${teamCount} team${teamCount === 1 ? "" : "s"}`;
}

/* ── the gate: render() refuses impossible input by name ── */

function fail(field: string, rule: string): never {
  throw new Error(`${ID}: ${field} ${rule}`);
}

/** Edit distance, for "did you mean" on a misspelled prop. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function pickText(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") fail(field, `must be a string, got ${JSON.stringify(value)}.`);
  const s = value.trim();
  const bad = [...s].find((ch) => !ASCII.test(ch));
  if (bad !== undefined) fail(field, `${JSON.stringify(s)} has the character ${JSON.stringify(bad)} (U+${bad.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}), which the card's font does not draw: use printable ASCII.`);
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card allows at most ${max}.`);
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

function pickAwards(value: unknown): string[] {
  let v = value;
  if (typeof v === "string") {
    const raw = v;
    try { v = JSON.parse(raw); } catch { fail("awards", `is not valid JSON: ${JSON.stringify(raw.slice(0, 60))}. Pass a list like ["Innovation in Control Award"].`); }
  }
  if (!Array.isArray(v)) fail("awards", 'must be a list of award names, e.g. ["Innovation in Control Award"].');
  if (v.length > 3) fail("awards", `has ${v.length} lines; the card holds at most 3.`);
  return v.map((a, i) => {
    if (typeof a !== "string") fail("awards", `line ${i + 1} must be a string, got ${JSON.stringify(a)}.`);
    return pickText(a, `awards line ${i + 1}`, 60);
  }).filter((a) => a.length > 0);
}

export type FrcRecapModel = {
  teamNumber: number;
  /** "TEAM 9128" - the top-of-card identity. */
  teamLine: string;
  /** The nickname in caps, or "" (line removed). */
  teamName: string;
  eventName: string;
  weekLabel: string;
  /** "Harbor City District - Week 4" or whichever parts are set; "" removes the line. */
  eventLine: string;
  qualRank: number;
  teamCount: number;
  /** "RANK 1" - the left hero figure. */
  rankBig: string;
  /** "of 48 teams" or "". */
  rankSubText: string;
  record: string;
  allianceChip: string;
  playoffChip: string;
  awards: string[];
  districtPoints: number;
  /** "78 DISTRICT POINTS" or "". */
  pointsText: string;
  accent: MosaicColor;
};

export function normalizeFrcEventRecap(props: FrcEventRecapProps): FrcRecapModel {
  for (const k of Object.keys(props ?? {})) {
    if (PROPS.includes(k)) continue;
    const near = PROPS.find((n) => distance(n.toLowerCase(), k.toLowerCase()) <= 2);
    fail("props", `has an unknown prop '${k}'${near ? `; did you mean '${near}'?` : "."} The props are ${PROPS.join(", ")}.`);
  }
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };

  const teamNumber = pickWhole(p.teamNumber, "teamNumber", 1, 99999);
  const teamNameRaw = pickText(p.teamName, "teamName", 30);
  const eventName = pickText(p.eventName, "eventName", 40);
  const weekLabel = pickText(p.weekLabel, "weekLabel", 20);
  const qualRank = pickWhole(p.qualRank, "qualRank", 1, 200);
  const teamCount = pickWhole(p.teamCount, "teamCount", 0, 200);
  if (teamCount > 0 && qualRank > teamCount) {
    fail("qualRank", `is ${qualRank} but teamCount is ${teamCount} - a rank cannot be above the number of teams at the event.`);
  }
  const record = recordText(String(p.record ?? ""));
  const allianceRole = pickOne<FrcAllianceRole>(p.allianceRole, ["captain", "pick1", "pick2", "none"], "allianceRole");
  const playoffResult = pickOne<FrcPlayoffResult>(p.playoffResult, ["winner", "finalist", "semifinalist", "quarterfinalist", "none"], "playoffResult");
  let allianceNumber = DEFAULTS.allianceNumber;
  if (allianceRole !== "none") allianceNumber = pickWhole(p.allianceNumber, "allianceNumber", 1, 8);
  const awards = pickAwards(p.awards);
  const districtPoints = pickWhole(p.districtPoints, "districtPoints", 0, 999);
  if (typeof p.accent !== "string" || !HEX.test(p.accent.trim())) fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");

  const teamName = teamNameRaw.toUpperCase();
  const eventLine = [eventName, weekLabel].filter((s) => s.length > 0).join(" - ");
  return {
    teamNumber,
    teamLine: `TEAM ${teamNumber}`,
    teamName,
    eventName,
    weekLabel,
    eventLine,
    qualRank,
    teamCount,
    rankBig: `RANK ${qualRank}`,
    rankSubText: rankSub(teamCount),
    record,
    allianceChip: allianceChipText(allianceRole, allianceNumber),
    playoffChip: playoffChipText(playoffResult),
    awards,
    districtPoints,
    pointsText: districtPoints > 0 ? `${districtPoints} DISTRICT POINTS` : "",
    accent: p.accent.trim().toLowerCase() as MosaicColor,
  };
}

/* ── geometry: a pure function of the model and the canvas ── */

export type FrcRect = { x: number; y: number; w: number; h: number };
export type FrcFit = { text: string; px: number; width: number };
export type FrcChip = { key: "alliance" | "playoff"; label: "alliance-chip" | "playoff-chip"; box: FrcRect; inner: FrcRect; text: FrcFit; textRect: FrcRect };
export type FrcAwardLine = { index: number; text: FrcFit; textRect: FrcRect; tickRect: FrcRect };

export type FrcLayout = {
  W: number;
  H: number;
  S: number;
  landscape: boolean;
  label: FrcFit;
  labelRect: FrcRect;
  ruleRect: FrcRect;
  team: FrcFit;
  teamRect: FrcRect;
  name: FrcFit | null;
  nameRect: FrcRect | null;
  event: FrcFit | null;
  eventRect: FrcRect | null;
  /** The " - Week 4" suffix, its own source so the week prop gets its own binding. */
  week: FrcFit | null;
  weekRect: FrcRect | null;
  rankBig: FrcFit;
  rankBigRect: FrcRect;
  rankSub: FrcFit | null;
  rankSubRect: FrcRect | null;
  recordBig: FrcFit;
  recordBigRect: FrcRect;
  recordSub: FrcFit;
  recordSubRect: FrcRect;
  chips: FrcChip[];
  awardsLabel: FrcFit | null;
  awardsLabelRect: FrcRect | null;
  awards: FrcAwardLine[];
  points: FrcFit | null;
  pointsRect: FrcRect | null;
  credit: FrcFit;
  creditRect: FrcRect;
};

/** One line, shrunk until it fits its budget; at the floor it must fit - the card never ellipsizes. */
function fitOne(text: string, maxW: number, maxPx: number, minPx: number, bold = false): FrcFit {
  const px = fitLine(text, maxW, maxPx, minPx, bold);
  return { text, px, width: widthOf(text, px, bold) };
}

/**
 * The whole card as rects and measured fits. Square and portrait stack five
 * bands (header, hero, chips, awards, footer); landscape puts header and hero
 * in a left column, chips and awards in a right one, the footer full-width.
 * The test asserts bands and fits without parsing m0.
 */
export function layoutFrc(m: FrcRecapModel, W: number, H: number): FrcLayout {
  const S = Math.min(W, H);
  const landscape = W >= 1.25 * H;
  const margin = Math.max(6, Math.round(0.05 * S));
  const gap = Math.max(4, Math.round(0.025 * S));
  const minPx = Math.max(5, Math.round(0.013 * S));
  const contentW = Math.max(40, W - 2 * margin);

  // The columns: everything is full-width, or landscape's left/right split.
  const leftW = landscape ? Math.round(0.48 * contentW) : contentW;
  const rightX = margin + leftW + 2 * gap;
  const rightW = landscape ? Math.max(24, W - margin - rightX) : contentW;

  // ── the header: label + accent rule, TEAM N, the name, the event ──
  const label = fitOne(HEADER_LABEL, budget(Math.round(0.55 * leftW)), Math.round(0.026 * S), minPx, true);
  const labelH = Math.max(1, Math.round(1.6 * label.px));
  const labelRect: FrcRect = { x: margin, y: margin, w: Math.max(8, Math.ceil(label.width / 0.94) + 4), h: labelH };
  const ruleH = Math.max(2, Math.round(0.006 * S));
  const ruleX = labelRect.x + labelRect.w + Math.round(0.7 * gap);
  const ruleRect: FrcRect = { x: ruleX, y: margin + Math.round((labelH - ruleH) / 2), w: Math.max(8, margin + leftW - ruleX), h: ruleH };

  let hy = margin + labelH + Math.round(0.5 * gap);
  const team = fitOne(m.teamLine, budget(leftW), Math.round(0.095 * S), minPx, true);
  const teamH = Math.max(1, Math.round(1.3 * team.px));
  const teamRect: FrcRect = { x: margin, y: hy, w: leftW, h: teamH };
  hy += teamH + Math.round(0.25 * gap);

  let name: FrcFit | null = null;
  let nameRect: FrcRect | null = null;
  if (m.teamName !== "") {
    name = fitOne(m.teamName, budget(leftW), Math.round(0.034 * S), minPx, true);
    const nameH = Math.max(1, Math.round(1.5 * name.px));
    nameRect = { x: margin, y: hy, w: leftW, h: nameH };
    hy += nameH + Math.round(0.25 * gap);
  }
  let event: FrcFit | null = null;
  let eventRect: FrcRect | null = null;
  let week: FrcFit | null = null;
  let weekRect: FrcRect | null = null;
  if (m.eventLine !== "") {
    // One size for the whole line, then the event and the week as two adjacent
    // sources (each binds the prop it shows).
    const eventPx = fitLine(m.eventLine, budget(leftW), Math.round(0.038 * S), minPx);
    const eventH = Math.max(1, Math.round(1.5 * eventPx));
    if (m.eventName !== "") {
      event = { text: m.eventName, px: eventPx, width: widthOf(m.eventName, eventPx) };
      eventRect = { x: margin, y: hy, w: Math.max(8, Math.ceil(event.width * 1.04) + 4), h: eventH };
    }
    if (m.weekLabel !== "") {
      const weekText = m.eventName !== "" ? ` - ${m.weekLabel}` : m.weekLabel;
      week = { text: weekText, px: eventPx, width: widthOf(weekText, eventPx) };
      weekRect = { x: margin + (eventRect ? eventRect.w : 0), y: hy, w: Math.max(8, Math.ceil(week.width / 0.94) + 4), h: eventH };
    }
    hy += eventH;
  }
  const headerBottom = hy;

  // ── the hero pair: RANK N (of N teams) and the record - one shared size ──
  const heroCap = Math.round(0.08 * S);
  const subCap = Math.round(0.026 * S);
  const bigPx = Math.min(
    fitLine(m.rankBig, budget(landscape ? leftW : Math.round((contentW - gap) / 2)), heroCap, minPx, true),
    fitLine(m.record, budget(landscape ? leftW : Math.round((contentW - gap) / 2)), heroCap, minPx, true),
  );
  const rankBig: FrcFit = { text: m.rankBig, px: bigPx, width: widthOf(m.rankBig, bigPx, true) };
  const recordBig: FrcFit = { text: m.record, px: bigPx, width: widthOf(m.record, bigPx, true) };
  const subPx = Math.min(
    m.rankSubText !== "" ? fitLine(m.rankSubText, budget(contentW), subCap, minPx) : subCap,
    fitLine(RECORD_SUB, budget(contentW), subCap, minPx),
  );
  const rankSub: FrcFit | null = m.rankSubText !== "" ? { text: m.rankSubText, px: subPx, width: widthOf(m.rankSubText, subPx) } : null;
  const recordSub: FrcFit = { text: RECORD_SUB, px: subPx, width: widthOf(RECORD_SUB, subPx) };
  const bigH = Math.max(1, Math.round(1.25 * bigPx));
  const subH = Math.max(1, Math.round(1.5 * subPx));
  const heroCellH = bigH + Math.round(0.3 * gap) + subH;

  // ── the chips: one shared size, accent outline, page fill ──
  const chipTexts: Array<{ key: "alliance" | "playoff"; label: "alliance-chip" | "playoff-chip"; text: string }> = [];
  if (m.allianceChip !== "") chipTexts.push({ key: "alliance", label: "alliance-chip", text: m.allianceChip });
  if (m.playoffChip !== "") chipTexts.push({ key: "playoff", label: "playoff-chip", text: m.playoffChip });
  const ring = Math.max(2, Math.round(0.004 * S));
  const chipColW = landscape ? rightW : contentW;
  let chipPx = Math.round(0.03 * S);
  for (const c of chipTexts) chipPx = Math.min(chipPx, fitLine(c.text, budget(chipColW - 2 * ring - 2 * Math.round(0.7 * chipPx)), chipPx, minPx, true));
  const chipPadX = chipTexts.length > 0 ? Math.max(3, Math.round(0.7 * chipPx)) : 0;
  const chipPadY = chipTexts.length > 0 ? Math.max(2, Math.round(0.5 * chipPx)) : 0;
  const chipH = chipTexts.length > 0 ? Math.max(1, Math.round(1.3 * chipPx) + 2 * chipPadY + 2 * ring) : 0;
  const chipGapY = Math.round(0.6 * gap);
  const chipsBlockH = chipTexts.length === 0 ? 0 : landscape ? chipTexts.length * chipH + (chipTexts.length - 1) * chipGapY : chipH;

  // ── the awards: a label and 0-3 lines, one shared size, an accent tick each ──
  let awardsLabel: FrcFit | null = null;
  let awardsLabelH = 0;
  let awardPx = Math.round(0.03 * S);
  if (m.awards.length > 0) {
    const awardColW = landscape ? rightW : contentW;
    awardsLabel = fitOne(AWARDS_LABEL, budget(awardColW), Math.round(0.024 * S), minPx, true);
    awardsLabelH = Math.max(1, Math.round(1.6 * awardsLabel.px));
    const tickSide0 = Math.max(3, Math.round(0.5 * awardPx));
    const tickGap0 = Math.max(3, Math.round(0.5 * awardPx));
    for (const a of m.awards) awardPx = Math.min(awardPx, fitLine(a, budget(awardColW - tickSide0 - tickGap0), awardPx, minPx));
  }
  const tickSide = m.awards.length > 0 ? Math.max(3, Math.round(0.5 * awardPx)) : 0;
  const tickGap = m.awards.length > 0 ? Math.max(3, Math.round(0.5 * awardPx)) : 0;
  const awardLineH = m.awards.length > 0 ? Math.max(1, Math.round(1.5 * awardPx)) : 0;
  const awardLineGap = Math.round(0.2 * gap);
  const awardsBlockH = m.awards.length === 0 ? 0 : awardsLabelH + Math.round(0.3 * gap) + m.awards.length * awardLineH + (m.awards.length - 1) * awardLineGap;

  // ── the footer: points left, the TBA credit right ──
  const footerCap = Math.round(0.024 * S);
  const halfW = Math.round((contentW - gap) / 2);
  const points = m.pointsText !== "" ? fitOne(m.pointsText, budget(halfW), footerCap, minPx, true) : null;
  const credit = fitOne(CREDIT, budget(halfW), footerCap, minPx);
  const footerH = Math.max(1, Math.round(1.7 * Math.max(points?.px ?? 0, credit.px)));
  const footerY = H - margin - footerH;
  const pointsRect: FrcRect | null = points ? { x: margin, y: footerY, w: halfW, h: footerH } : null;
  const creditRect: FrcRect = { x: margin + contentW - halfW, y: footerY, w: halfW, h: footerH };

  // ── place the bands ──
  let rankBigRect!: FrcRect;
  let rankSubRect: FrcRect | null = null;
  let recordBigRect!: FrcRect;
  let recordSubRect!: FrcRect;
  const chips: FrcChip[] = [];
  let awardsLabelRect: FrcRect | null = null;
  const awardLines: FrcAwardLine[] = [];

  if (landscape) {
    // Left column: hero stacked under the header, pushed down a touch.
    const heroStackH = 2 * heroCellH + gap;
    const leftSlack = Math.max(0, footerY - gap - headerBottom - heroStackH);
    let y = headerBottom + gap + Math.round(Math.min(leftSlack * 0.35, 0.08 * H));
    rankBigRect = { x: margin, y, w: leftW, h: bigH };
    rankSubRect = rankSub ? { x: margin, y: y + bigH + Math.round(0.3 * gap), w: leftW, h: subH } : null;
    y += heroCellH + gap;
    recordBigRect = { x: margin, y, w: leftW, h: bigH };
    recordSubRect = { x: margin, y: y + bigH + Math.round(0.3 * gap), w: leftW, h: subH };

    // Right column: chips at the top, the awards pinned into the lower half.
    let cy = margin;
    chipTexts.forEach((c) => {
      const fit: FrcFit = { text: c.text, px: chipPx, width: widthOf(c.text, chipPx, true) };
      const box: FrcRect = { x: rightX, y: cy, w: rightW, h: chipH };
      const inner: FrcRect = { x: box.x + ring, y: box.y + ring, w: box.w - 2 * ring, h: box.h - 2 * ring };
      chips.push({ key: c.key, label: c.label, box, inner, text: fit, textRect: inner });
      cy += chipH + chipGapY;
    });
    if (m.awards.length > 0 && awardsLabel) {
      const chipsBottom = chips.length > 0 ? cy - chipGapY : margin;
      const top = Math.max(chipsBottom + (chips.length > 0 ? gap : 0), Math.round(0.5 * H));
      const bottom = footerY - gap;
      const ay = top + Math.max(0, Math.round((bottom - top - awardsBlockH) / 2));
      awardsLabelRect = { x: rightX, y: ay, w: rightW, h: awardsLabelH };
      let ly = ay + awardsLabelH + Math.round(0.3 * gap);
      m.awards.forEach((a, i) => {
        const textW = Math.max(8, rightW - tickSide - tickGap);
        awardLines.push({
          index: i,
          text: { text: a, px: awardPx, width: widthOf(a, awardPx) },
          textRect: { x: rightX + tickSide + tickGap, y: ly, w: textW, h: awardLineH },
          tickRect: { x: rightX, y: ly + Math.round((awardLineH - tickSide) / 2), w: tickSide, h: tickSide },
        });
        ly += awardLineH + awardLineGap;
      });
    }
  } else {
    // Square and portrait: five stacked bands, the slack shared out as gaps.
    const cellW = Math.round((contentW - gap) / 2);
    const bands: Array<{ kind: "hero" | "chips" | "awards"; h: number }> = [{ kind: "hero", h: heroCellH }];
    if (chipsBlockH > 0) bands.push({ kind: "chips", h: chipsBlockH });
    if (awardsBlockH > 0) bands.push({ kind: "awards", h: awardsBlockH });
    const natural = bands.reduce((a, b) => a + b.h, 0);
    const middleBottom = footerY - gap;
    const slack = Math.max(0, middleBottom - headerBottom - natural);
    const share = Math.round(slack / (bands.length + 1));
    let y = headerBottom + share;
    for (const band of bands) {
      if (band.kind === "hero") {
        const subY = y + bigH + Math.round(0.3 * gap);
        rankBigRect = { x: margin, y, w: cellW, h: bigH };
        rankSubRect = rankSub ? { x: margin, y: subY, w: cellW, h: subH } : null;
        recordBigRect = { x: margin + cellW + gap, y, w: Math.max(8, contentW - cellW - gap), h: bigH };
        recordSubRect = { x: margin + cellW + gap, y: subY, w: Math.max(8, contentW - cellW - gap), h: subH };
      } else if (band.kind === "chips") {
        chipTexts.forEach((c, i) => {
          const w = chipTexts.length === 2 ? cellW : Math.round((contentW - gap) / 2);
          const x = margin + i * (w + gap);
          const fit: FrcFit = { text: c.text, px: chipPx, width: widthOf(c.text, chipPx, true) };
          const box: FrcRect = { x, y, w, h: chipH };
          const inner: FrcRect = { x: box.x + ring, y: box.y + ring, w: box.w - 2 * ring, h: box.h - 2 * ring };
          chips.push({ key: c.key, label: c.label, box, inner, text: fit, textRect: inner });
        });
      } else if (awardsLabel) {
        awardsLabelRect = { x: margin, y, w: contentW, h: awardsLabelH };
        let ly = y + awardsLabelH + Math.round(0.3 * gap);
        m.awards.forEach((a, i) => {
          const textW = Math.max(8, contentW - tickSide - tickGap);
          awardLines.push({
            index: i,
            text: { text: a, px: awardPx, width: widthOf(a, awardPx) },
            textRect: { x: margin + tickSide + tickGap, y: ly, w: textW, h: awardLineH },
            tickRect: { x: margin, y: ly + Math.round((awardLineH - tickSide) / 2), w: tickSide, h: tickSide },
          });
          ly += awardLineH + awardLineGap;
        });
      }
      y += band.h + share;
    }
  }

  return {
    W, H, S, landscape,
    label, labelRect, ruleRect,
    team, teamRect, name, nameRect, event, eventRect, week, weekRect,
    rankBig, rankBigRect, rankSub, rankSubRect,
    recordBig, recordBigRect, recordSub, recordSubRect,
    chips,
    awardsLabel, awardsLabelRect, awards: awardLines,
    points, pointsRect, credit, creditRect,
  };
}

/**
 * What the geometry promises (the brief's contract): every text measured and
 * fitted; the team number in the top band; the footer texts in the bottom
 * one; the hero pair, the chips (when their props say so) and the awards
 * block (when non-empty, in the middle band) present. No exact fractions -
 * the reflow between square bands and landscape columns is the template's
 * own business.
 */
export function frcContract(L: FrcLayout): LayoutConstraint[] {
  const constraints: LayoutConstraint[] = [
    textFitsMeasured("card-label", L.label.text, L.label.px, L.label.width),
    textFitsMeasured("team-number", L.team.text, L.team.px, L.team.width),
    { label: "team-number", within: { yFrac: [0, 0.3] } },
    ...(L.name ? [textFitsMeasured("team-name", L.name.text, L.name.px, L.name.width)] : []),
    ...(L.event ? [textFitsMeasured("event-line", L.event.text, L.event.px, L.event.width)] : []),
    ...(L.week ? [textFitsMeasured("week-line", L.week.text, L.week.px, L.week.width)] : []),
    textFitsMeasured("rank-number", L.rankBig.text, L.rankBig.px, L.rankBig.width),
    { label: "rank-number" },
    ...(L.rankSub ? [textFitsMeasured("rank-sub", L.rankSub.text, L.rankSub.px, L.rankSub.width)] : []),
    textFitsMeasured("record-text", L.recordBig.text, L.recordBig.px, L.recordBig.width),
    { label: "record-text" },
    textFitsMeasured("record-sub", L.recordSub.text, L.recordSub.px, L.recordSub.width),
    ...L.chips.flatMap((c) => [textFitsMeasured(c.label, c.text.text, c.text.px, c.text.width), { label: c.label } as LayoutConstraint]),
    ...(L.awardsLabel ? [textFitsMeasured("awards-label", L.awardsLabel.text, L.awardsLabel.px, L.awardsLabel.width), { label: "awards-label", within: { yFrac: [0.45, 0.9] } } as LayoutConstraint] : []),
    ...L.awards.map((a) => textFitsMeasured(`award-${a.index}`, a.text.text, a.text.px, a.text.width)),
    ...(L.points ? [textFitsMeasured("footer-points", L.points.text, L.points.px, L.points.width), { label: "footer-points", within: { yFrac: [0.85, 1] } } as LayoutConstraint] : []),
    textFitsMeasured("footer-credit", L.credit.text, L.credit.px, L.credit.width),
    { label: "footer-credit", within: { yFrac: [0.85, 1] } },
  ];
  return constraints;
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-10-22/.
 */
const WHY: WhySpec = {
  day: 33,
  date: "2026-10-22",
  agent: "opencode",
  model: "kimi-k3",
  id: ID,
  title: "FRC Event Recap",
  who: "FIRST Robotics Competition media students and mentors, on Chief Delphi and team social accounts, with The Blue Alliance as the shared record",
  problem: [
    "After every event someone on the team writes the recap post. A 2026 build thread: \"the media team uploaded some pictures, and I have had a nap! That means it is time to write an event recap\" - with rank, EPA and alliance quoted from The Blue Alliance and Statbotics.",
    "The numbers all live on one shared page: \"Team 9128 was Rank 1 with a record of 17-0-0 ... competed in the playoffs as the Captain of Alliance 1 and won the event\" - qual rank, W-L-T record, alliance selection, awards, district points.",
    "The appetite for a rendered card is proven: team 9077's FRC Rewind web app turns a season into \"a high-quality shareable recap card\", and the first reply is \"Now I have something other than Spotify Wrapped!\"",
  ],
  sources: [
    "https://www.chiefdelphi.com/t/release-frc-rewind-a-visual-season-recap-for-every-frc-team/522858",
    "https://www.thebluealliance.com/team/9128/2026",
    "https://www.chiefdelphi.com/t/frc-team-1710-2026-build-thread-open-alliance/507939?page=4",
  ],
  solution: [
    "One deterministic card per event: the props mirror The Blue Alliance's team-event fields one for one - team number, event, week, qual rank, W-L-T record, alliance selection, playoff finish, awards, district points. Batch a whole season from a JSON file.",
    "The design decision that matters: derive what can be derived and constrain the rest to TBA's own vocabulary - the chips come from closed enums, so their text always fits; awards, the one free text, are capped at three lines and shrink to fit, never ellipsized.",
    "Honest weak spots: no robot photos and no logos - it is a numbers card that rides beside the team's pictures; and a regional or offseason event just zeroes the district points out of the footer.",
  ],
  usage: {
    command: "m0saic make @one-a-day/sports/frc-event-recap/v1 --template-repo . -w 1920 -h 1080 -o recap.png",
    try: [
      "teamNumber 2471, eventName \"Portland District\", weekLabel \"Week 2\" - your own event",
      "allianceRole \"pick1\" + allianceNumber 4 prints \"1ST PICK - ALLIANCE 4\"",
      "playoffResult \"finalist\"; awards [\"Industrial Design Award\", \"Gracious Professionalism Award\"]",
      "districtPoints 0 for a regional or offseason event; teamCount 0 drops the \"of N teams\" line",
    ],
  },
  caveats: [
    "Award names are free text and TBA's run long: up to 3 lines, 60 ASCII characters each, shrunk to fit - never ellipsized.",
    "qualRank above teamCount (when teamCount is set) is refused: a card that says RANK 12 of 10 teams is lying.",
    "Numbers and chips only - no FIRST or TBA marks, no photos; pair it with the team's robot picture.",
  ],
  timeline: {
    source: "runner",
    phases: [
      { name: "scout", startMs: 0, durMs: 623202, calls: 28, tokens: 1262534, costUsd: 0.96, tools: "bash 11, websearch 10, read 4" },
      { name: "plan", startMs: 623230, durMs: 276206, calls: 14, tokens: 511564, costUsd: 0.77, tools: "read 10, edit 2, bash 1" },
    ],
    costBasis: "reported",
  },
};

export const FrcEventRecapV1 = defineMosaicTemplate<FrcEventRecapProps>({
  id: asTemplateId(ID),
  label: "2026-10-22 · FRC Event Recap",
  version: 1,
  description:
    "An FRC event recap card from The Blue Alliance team-event fields: team number, event and week, qual rank of N teams, the W-L-T record, alliance-selection and playoff chips, up to three award lines, and district points in the footer.",
  capabilities: { tier: "core" },
  tags: ["sports", "2026-10-22", "day-033", "frc", "robotics", "recap", "blue-alliance", "event", "card"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "A wide still first (the Chief Delphi / X header image): header+hero left, chips+awards right, the footer full-width. 1080x1080 and 1080x1920 stack the five bands.",
  },

  propsSchema,
  defaultProps: {
    teamNumber: DEFAULTS.teamNumber,
    teamName: DEFAULTS.teamName,
    eventName: DEFAULTS.eventName,
    weekLabel: DEFAULTS.weekLabel,
    qualRank: DEFAULTS.qualRank,
    teamCount: DEFAULTS.teamCount,
    record: DEFAULTS.record,
    allianceRole: DEFAULTS.allianceRole,
    allianceNumber: DEFAULTS.allianceNumber,
    playoffResult: DEFAULTS.playoffResult,
    awards: [...DEFAULTS.awards],
    districtPoints: DEFAULTS.districtPoints,
    accent: DEFAULTS.accent,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default FrcEventRecapV1;

async function render(props: FrcEventRecapProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  const m = normalizeFrcEventRecap(props);
  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const L = layoutFrc(m, W, H);

  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const piece = (rect: FrcRect, importance: number, source: MosaicSource) => pieces.push({ rect: { ...rect, importance }, source });

  // No backdrop rect: the page is document.backgroundColor below.

  // ── header: the label, the accent rule (bound to the color prop it shows),
  //    TEAM N, the name, the event ──
  piece(L.labelRect, 2, tag(textCell({ text: L.label.text, fontSize: L.label.px, color: DIM, hAlign: "left", bold: true, vAlign: "middle", label: "card-label" }), "card-label"));
  piece(L.ruleRect, 1, bindProp(tag(makeColorTile(m.accent) as MosaicSource, "header-rule"), "accent"));
  piece(L.teamRect, 3, bindProp(tag(textCell({ text: L.team.text, fontSize: L.team.px, color: INK, hAlign: "left", bold: true, vAlign: "middle", label: "team-number" }), "team-number"), "teamNumber"));
  if (L.name && L.nameRect) piece(L.nameRect, 3, bindProp(tag(textCell({ text: L.name.text, fontSize: L.name.px, color: DIM, hAlign: "left", bold: true, vAlign: "middle", label: "team-name" }), "team-name"), "teamName"));
  if (L.event && L.eventRect) piece(L.eventRect, 3, bindProp(tag(textCell({ text: L.event.text, fontSize: L.event.px, color: INK, hAlign: "left", vAlign: "middle", label: "event-line" }), "event-line"), "eventName"));
  if (L.week && L.weekRect) piece(L.weekRect, 3, bindProp(tag(textCell({ text: L.week.text, fontSize: L.week.px, color: INK, hAlign: "left", vAlign: "middle", label: "week-line" }), "week-line"), "weekLabel"));

  // ── the hero pair ──
  piece(L.rankBigRect, 3, bindProp(tag(textCell({ text: L.rankBig.text, fontSize: L.rankBig.px, color: INK, hAlign: "left", bold: true, vAlign: "middle", label: "rank-number" }), "rank-number"), "qualRank"));
  if (L.rankSub && L.rankSubRect) piece(L.rankSubRect, 3, bindProp(tag(textCell({ text: L.rankSub.text, fontSize: L.rankSub.px, color: DIM, hAlign: "left", vAlign: "middle", label: "rank-sub" }), "rank-sub"), "teamCount"));
  piece(L.recordBigRect, 3, bindProp(tag(textCell({ text: L.recordBig.text, fontSize: L.recordBig.px, color: INK, hAlign: "left", bold: true, vAlign: "middle", label: "record-text" }), "record-text"), "record"));
  piece(L.recordSubRect, 3, tag(textCell({ text: L.recordSub.text, fontSize: L.recordSub.px, color: DIM, hAlign: "left", vAlign: "middle", label: "record-sub" }), "record-sub"));

  // ── the chips: accent outline, page fill, the enum's own words ──
  L.chips.forEach((c) => {
    piece(c.box, 1, tag(makeColorTile(m.accent) as MosaicSource, `${c.label}-box`));
    piece(c.inner, 2, tag(makeColorTile(PAGE) as MosaicSource, `${c.label}-fill`));
    // The chip text is the enum's own words; closed pickers never carry a rect
    // binding (the gate: bindingsSound) - Make edits them from the panel.
    piece(c.textRect, 3, tag(textCell({ text: c.text.text, fontSize: c.text.px, color: INK, hAlign: "center", bold: true, vAlign: "middle", label: c.label }), c.label));
  });

  // ── the awards: label, then a tick and a line each ──
  if (L.awardsLabel && L.awardsLabelRect) piece(L.awardsLabelRect, 3, tag(textCell({ text: L.awardsLabel.text, fontSize: L.awardsLabel.px, color: DIM, hAlign: "left", bold: true, vAlign: "middle", label: "awards-label" }), "awards-label"));
  L.awards.forEach((a) => {
    piece(a.tickRect, 2, tag(makeColorTile(m.accent) as MosaicSource, `award-tick-${a.index}`));
    piece(a.textRect, 3, bindPropPath(tag(textCell({ text: a.text.text, fontSize: a.text.px, color: INK, hAlign: "left", vAlign: "middle", label: `award-${a.index}` }), `award-${a.index}`), "awards", [a.index], "string"));
  });

  // ── the footer ──
  if (L.points && L.pointsRect) piece(L.pointsRect, 3, bindProp(tag(textCell({ text: L.points.text, fontSize: L.points.px, color: INK, hAlign: "left", bold: true, vAlign: "middle", label: "footer-points" }), "footer-points"), "districtPoints"));
  piece(L.creditRect, 3, tag(textCell({ text: L.credit.text, fontSize: L.credit.px, color: DIM, hAlign: "right", vAlign: "middle", label: "footer-credit" }), "footer-credit"));

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    size: { width: W, height: H },
    fps: ctx.target.fps,
    durationMs: 2000,
    backgroundColor: PAGE,
    sources: placed.sources,
    editor: { label: `FRC Event Recap - Team ${m.teamNumber} - ${m.eventLine || "event"}` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: frcContract(L), debug: props.debugLayout === true });
}
