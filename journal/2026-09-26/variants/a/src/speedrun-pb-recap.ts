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
  bindPropPath,
  defineMosaicTemplate,
  definePropsSchema,
  makeColorTile,
  placeInsetPieces,
  resolvePinnedDurationMs,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, ellipsize, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/gaming/speedrun-pb-recap/v1` - a speedrun PB recap clip: the
 * run's splits table fills in against the old PB, the deltas in LiveSplit's
 * own colours, the timer fast-forwards the run, and the clip opens and closes
 * on the finished result, so it loops.
 *
 * ONE CONCEPT: **the splits file is the prop.** Everything on the canvas is a
 * number LiveSplit already saved - segment names, cumulative split times for
 * the run and for the comparison, best segments. Paste the `.lss` into `lss`
 * and the template reads it (the PB, the previous PB rebuilt from the attempt
 * history, the golds), or pass `segments` rows shaped like it.
 *
 * The motion is data, not keyframes: split i lands at
 * `hook + replay * split_i / final`. Everything that changes over time is
 * drawtext - one video-mode text source for the times, one for the deltas,
 * one layer per row per state, each gated by its own `overlay.enable` (the
 * official lyric-video mechanism) - so a 16-row table costs two overlays, not
 * forty-eight. The stripes, the moving highlight and the graph bars are plain
 * colour tiles in two mask-free child documents on 5-smooth canvases (day 4's
 * mechanism). A tile shown in the cold open AND after its split carries ONE
 * gate, `lt(t,hook)+gte(t,land)`, and no `window` twin: it is not one window.
 *
 * The rule that bites: **splits are cumulative.** LiveSplit stores the time
 * since the start of the run at every split, not the segment's own length. A
 * list of segment durations is refused with a message that says so.
 */

export type RecapPreset = "dark" | "light";
export type RecapTiming = "real" | "game";
export type RecapGraph = "delta" | "segments" | "none";

/** One row, shaped like a LiveSplit `<Segment>`: times as "1:23.45", "1:02:03.45", "83.45", seconds, or "00:01:23.4560000". */
export type SegmentInput = {
  /** The segment's name (subsplit marks "-" and "{Section}" are dropped). */
  name?: string;
  /** This run's split: time since the start of the run. Empty = a skipped split. */
  split?: string | number | null;
  /** The comparison's split (the old PB), also cumulative. Optional. */
  pb?: string | number | null;
  /** The best segment time ("gold"): the segment's own length. Optional. */
  best?: string | number | null;
};

export type SpeedrunPbRecapProps = {
  /** The game (GameName). Empty removes the line. */
  game?: string;
  /** The category (CategoryName). Empty removes it. */
  category?: string;
  /** The runner's handle, header right. Empty removes it. */
  runner?: string;
  /** Total attempts (AttemptCount), in the stat line; 0 hides it. */
  attempts?: number;
  /** 2..16 rows of { name, split, pb, best } (or that array as a JSON string). */
  segments?: SegmentInput[] | string;
  /** A pasted LiveSplit .lss. Non-empty wins over game, category, attempts and segments. */
  lss?: string;
  /** Which clock the .lss is read with: "real" (RealTime) or "game" (GameTime). */
  timing?: RecapTiming;
  /** The graph: "delta" (the cumulative delta at each split), "segments" (time saved per segment) or "none". */
  graph?: RecapGraph;
  /** Clip length in whole seconds (8..60). */
  clipSec?: number;
  /** The stamp, the moving highlight and the clock (#rrggbb). */
  accent?: string;
  /** Hand-tuned dark or light page. */
  preset?: RecapPreset;
  /** Dev-only: check the layout contract and draw it over the frame. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/gaming/speedrun-pb-recap/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;

export const RECAP_MIN_ROWS = 2;
/** Three drawtext layers a row at most - 16 rows stay well inside the ~60 a text source carries. */
export const RECAP_MAX_ROWS = 16;
export const RECAP_MIN_CLIP_SEC = 8;
export const RECAP_MAX_CLIP_SEC = 60;
/** drawtext draws in the machine's font, wider than the bundled Roboto the measurer knows. */
const DRAWTEXT_WIDEN = 1.15;

/** A run of a game that does not exist: ten segments, four golds, a mistake at the Clocktower, PB by 12.34 s. */
export const DEFAULT_SEGMENTS: ReadonlyArray<Readonly<SegmentInput>> = [
  { name: "Gatehouse", split: "1:01.73", pb: "1:02.40", best: "1:01.73" },
  { name: "Sunken Library", split: "3:31.61", pb: "3:31.35", best: "2:27.90" },
  { name: "Lantern Skip", split: "5:05.02", pb: "5:06.45", best: "1:33.41" },
  { name: "Clocktower", split: "8:12.97", pb: "8:09.75", best: "3:00.12" },
  { name: "Moth Queen", split: "10:22.59", pb: "10:21.60", best: "2:08.40" },
  { name: "Aqueduct", split: "12:59.43", pb: "13:01.20", best: "2:35.07" },
  { name: "Glass Garden", split: "15:50.46", pb: "15:51.40", best: "2:47.95" },
  { name: "Bell Chasm", split: "17:44.66", pb: "17:50.15", best: "1:54.20" },
  { name: "The Warden", split: "20:04.53", pb: "20:12.51", best: "2:18.66" },
  { name: "Final Ascent", split: "21:11.27", pb: "21:23.61", best: "1:06.74" },
];

const DEFAULTS = {
  game: "Mothlight Keep",
  category: "Any% Glitchless",
  runner: "@quillruns",
  attempts: 1284,
  timing: "real" as RecapTiming,
  graph: "delta" as RecapGraph,
  clipSec: 20,
  accent: "#4fa3ff",
  preset: "dark" as RecapPreset,
};

export type Tone = "gold" | "aheadGain" | "aheadLose" | "behindGain" | "behindLose";

type Theme = {
  bg: MosaicColor;
  stripe: MosaicColor;
  ink: MosaicColor;
  dim: MosaicColor;
  line: MosaicColor;
  /** The moving highlight: the accent PREMIXED over the page at this weight - a solid, never an opacity layer. */
  hlMix: number;
  /** LiveSplit's delta colours (its defaults on dark; darkened to read on light). */
  tones: Record<Tone, MosaicColor>;
};

const THEMES: Record<RecapPreset, Theme> = {
  dark: {
    bg: "#0d1117" as MosaicColor,
    stripe: "#151b23" as MosaicColor,
    ink: "#e9eef3" as MosaicColor,
    dim: "#7b8794" as MosaicColor,
    line: "#2e3845" as MosaicColor,
    hlMix: 0.3,
    tones: {
      gold: "#d8af1f" as MosaicColor,
      aheadGain: "#00cc36" as MosaicColor,
      aheadLose: "#52cc73" as MosaicColor,
      behindGain: "#cc5c52" as MosaicColor,
      behindLose: "#cc1200" as MosaicColor,
    },
  },
  light: {
    bg: "#f6f7f9" as MosaicColor,
    stripe: "#eaedf1" as MosaicColor,
    ink: "#141920" as MosaicColor,
    dim: "#5d6874" as MosaicColor,
    line: "#c9d1da" as MosaicColor,
    hlMix: 0.22,
    tones: {
      gold: "#9c7400" as MosaicColor,
      aheadGain: "#00852a" as MosaicColor,
      aheadLose: "#3b8a52" as MosaicColor,
      behindGain: "#b3473e" as MosaicColor,
      behindLose: "#b01000" as MosaicColor,
    },
  },
};

const propsSchema = definePropsSchema<SpeedrunPbRecapProps>({
  game: {
    type: "string",
    required: false,
    description: "The game (the .lss GameName) - the bold header line. Empty removes it. A pasted lss supplies its own.",
    meta: { control: { placeholder: DEFAULTS.game }, ui: { label: "Game", order: 1, primary: true } },
  },
  category: {
    type: "string",
    required: false,
    description: "The category (the .lss CategoryName), under the game. Empty removes it. A pasted lss supplies its own.",
    meta: { control: { placeholder: DEFAULTS.category }, ui: { label: "Category", order: 2 } },
  },
  runner: {
    type: "string",
    required: false,
    description: "The runner's handle, header right. Empty removes it. The .lss does not carry one.",
    meta: { control: { placeholder: DEFAULTS.runner }, ui: { label: "Runner", order: 3 } },
  },
  attempts: {
    type: "number",
    required: false,
    description: "Total attempts (the .lss AttemptCount), shown in the stat line; 0 hides it. A pasted lss supplies its own.",
    meta: { constraints: { min: 0, max: 9999999 }, ui: { label: "Attempts", order: 4 } },
  },
  segments: {
    type: "json",
    required: false,
    description:
      "2..16 rows of { name, split, pb, best }: split = this run's time since the start at the end of the segment, pb = the comparison's (old PB) split, best = the best segment time (gold). Times as \"1:23.45\", \"1:02:03.45\", \"83.45\" or LiveSplit's \"00:01:23.4560000\". An empty split is a skipped split.",
    meta: {
      constraints: {
        jsonSchema: {
          type: "array",
          minItems: RECAP_MIN_ROWS,
          maxItems: RECAP_MAX_ROWS,
          items: { type: "object", properties: { name: { type: "string" }, split: { type: "string" }, pb: { type: "string" }, best: { type: "string" } } },
        },
      },
      ui: { label: "Splits", order: 5, primary: true },
    },
  },
  lss: {
    type: "string",
    required: false,
    description:
      "Paste a LiveSplit .lss (the whole file). When set it wins over game, category, attempts and segments: the run is the file's Personal Best, the comparison is the previous PB rebuilt from its attempt history, the golds are its BestSegmentTime.",
    meta: { control: { multiline: true, mono: true, placeholder: "<Run version=\"1.7.0\"> ... </Run>" }, ui: { label: "LiveSplit file (.lss)", order: 6 } },
  },
  timing: {
    type: "string",
    required: false,
    description: 'Which clock a pasted .lss is read with: "real" (RealTime, default) or "game" (GameTime, for load-removed games).',
    meta: { constraints: { oneOf: ["real", "game"] }, ui: { label: "Timing", order: 7 } },
  },
  graph: {
    type: "string",
    required: false,
    description: 'The graph beside or under the table: "delta" (the delta against the PB at each split, the LiveSplit Graph), "segments" (time saved or lost per segment) or "none".',
    meta: { constraints: { oneOf: ["delta", "segments", "none"] }, ui: { label: "Graph", order: 8 } },
  },
  clipSec: {
    type: "number",
    required: false,
    description: "Clip length in whole seconds (8..60): an eighth is the cold open on the result, a quarter the closing hold, the rest the replay. An explicit duration pin overrides it and becomes the clip.",
    meta: { constraints: { min: RECAP_MIN_CLIP_SEC, max: RECAP_MAX_CLIP_SEC }, ui: { label: "Clip (s)", order: 9 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The accent - the stamp, the moving highlight, the clock - as #rrggbb. The delta colours are LiveSplit's and do not change.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 10 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Hand-tuned page: "dark" (default, LiveSplit\'s look) or "light".',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 11 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits, the header and the clock hold their bands) and draw it over the frame.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── times: integer milliseconds in, LiveSplit's formats out ── */

/** A LiveSplit-style time to integer milliseconds; null for "no time" (empty, "-", null). */
export function parseTime(value: unknown, what: string): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${ID}: ${what} must be a time of zero or more (got ${value}).`);
    return Math.round(value * 1000);
  }
  if (typeof value !== "string") throw new Error(`${ID}: ${what} must be a time string like "1:23.45" (got ${JSON.stringify(value)}).`);
  let s = value.trim();
  if (s === "" || s === "-") return null;
  let days = 0;
  const d = /^(\d+)\.(\d+:\d{1,2}:\d{1,2}(?:\.\d+)?)$/.exec(s);
  if (d) {
    days = Number(d[1]);
    s = d[2];
  }
  const parts = s.split(":");
  const sec = parts.pop() as string;
  if (parts.length > 2 || !/^\d+(\.\d+)?$/.test(sec) || !parts.every((p) => /^\d+$/.test(p))) {
    throw new Error(`${ID}: ${what} ${JSON.stringify(value)} is not a time - write "1:23.45", "1:02:03.45", "83.45" or LiveSplit's "00:01:23.4560000".`);
  }
  const h = parts.length === 2 ? Number(parts[0]) : 0;
  const m = parts.length === 2 ? Number(parts[1]) : parts.length === 1 ? Number(parts[0]) : 0;
  return ((days * 24 + h) * 3600 + m * 60) * 1000 + Math.round(Number(sec) * 1000);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** LiveSplit's split look, hundredths truncated: "42.17", "1:01.73", "1:02:03.45". */
export function fmtTime(ms: number): string {
  const cs = Math.floor(Math.max(0, ms) / 10);
  const h = Math.floor(cs / 360000);
  const m = Math.floor(cs / 6000) % 60;
  const s = Math.floor(cs / 100) % 60;
  const c = pad2(cs % 100);
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}.${c}`;
  if (m > 0) return `${m}:${pad2(s)}.${c}`;
  return `${s}.${c}`;
}

/** A delta: "-" is ahead, "+" is behind (LiveSplit's sign). */
export function fmtDelta(ms: number): string {
  return (ms < 0 ? "-" : "+") + fmtTime(Math.abs(ms));
}

/** A time saved or lost, for prose: "12.34s" under a minute, "1:02.34" above. */
export function fmtSpan(ms: number): string {
  return ms < 60000 ? `${fmtTime(ms)}s` : fmtTime(ms);
}

/** 1284 -> "1,284" without locale tables, so every machine prints the same. */
export function thousands(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** LiveSplit's subsplit marks off ("-Gatehouse", "{Act 1}Moth Queen"), ASCII only, never empty. */
export function cleanName(raw: unknown, index: number): string {
  const s = typeof raw === "string" ? raw : raw === undefined || raw === null ? "" : String(raw);
  const t = s.replace(/^\s*-/, "").replace(/^\s*\{[^}]*\}/, "").replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
  return t.length > 0 ? t : `Split ${index + 1}`;
}

/* ── the run: rows, deltas, LiveSplit's colour rule ── */

export type Seg = { name: string; split: number | null; pb: number | null; best: number | null };

export type Row = Seg & {
  /** This run's segment length (null when the split before it was skipped). */
  segMs: number | null;
  /** The comparison's segment length. */
  pbSegMs: number | null;
  /** split - pb: negative is ahead. */
  delta: number | null;
  /** The segment matched or beat its best segment time. */
  gold: boolean;
  /** The delta's colour, LiveSplit's rule; null when there is no delta. */
  tone: Tone | null;
};

/**
 * LiveSplit's rule: gold (the segment matched or beat its best) overrides;
 * otherwise ahead or behind by the cumulative delta, and gaining or losing by
 * whether the delta shrank or grew since the last split that had one.
 */
export function analyzeRun(segs: Seg[]): Row[] {
  let lastSplit = 0;
  let lastSplitKnown = true;
  let lastPb = 0;
  let lastPbKnown = true;
  let lastDelta = 0;
  return segs.map((s) => {
    const segMs = s.split !== null && lastSplitKnown ? s.split - lastSplit : null;
    const pbSegMs = s.pb !== null && lastPbKnown ? s.pb - lastPb : null;
    const delta = s.split !== null && s.pb !== null ? s.split - s.pb : null;
    const gold = segMs !== null && s.best !== null && segMs <= s.best;
    let tone: Tone | null = null;
    if (delta !== null) {
      const gaining = delta < lastDelta;
      tone = gold ? "gold" : delta < 0 ? (gaining ? "aheadGain" : "aheadLose") : gaining ? "behindGain" : "behindLose";
      lastDelta = delta;
    }
    if (s.split !== null) { lastSplit = s.split; lastSplitKnown = true; } else lastSplitKnown = false;
    if (s.pb !== null) { lastPb = s.pb; lastPbKnown = true; } else lastPbKnown = false;
    return { ...s, segMs, pbSegMs, delta, gold, tone };
  });
}

/** Splits are cumulative: every known time at or after the one before it. */
function checkCumulative(segs: Seg[], key: "split" | "pb"): void {
  let last = -1;
  segs.forEach((s, i) => {
    const v = s[key];
    if (v === null) return;
    if (v < last) {
      throw new Error(
        `${ID}: segments[${i}].${key} (${fmtTime(v)}) is earlier than the split before it (${fmtTime(last)}). Splits are cumulative - the time since the start of the run at the end of each segment, not the segment's own length.`,
      );
    }
    last = v;
  });
}

export type RecapModel = {
  game: string;
  category: string;
  runner: string;
  attempts: number;
  rows: Row[];
  finalMs: number;
  pbFinalMs: number | null;
  isPb: boolean;
  stamp: string;
  verdict: string;
  stat: string;
  sobMs: number | null;
};

export function buildModel(meta: { game: string; category: string; runner: string; attempts: number }, segs: Seg[]): RecapModel {
  if (segs.length < RECAP_MIN_ROWS || segs.length > RECAP_MAX_ROWS) throw new Error(`${ID}: a recap needs ${RECAP_MIN_ROWS}..${RECAP_MAX_ROWS} segments (got ${segs.length}).`);
  const last = segs[segs.length - 1];
  if (last.split === null || last.split <= 0) throw new Error(`${ID}: the last segment needs a split time - it is the run's final time.`);
  checkCumulative(segs, "split");
  checkCumulative(segs, "pb");
  const rows = analyzeRun(segs);
  const finalMs = last.split;
  const pbFinalMs = last.pb;
  const isPb = pbFinalMs === null || finalMs < pbFinalMs;
  const verdict =
    pbFinalMs === null ? "First finished run"
      : finalMs < pbFinalMs ? `PB by ${fmtSpan(pbFinalMs - finalMs)}`
        : finalMs === pbFinalMs ? "Tied the PB"
          : `${fmtSpan(finalMs - pbFinalMs)} off the PB`;
  const sobMs = segs.every((s) => s.best !== null) ? segs.reduce((a, s) => a + (s.best as number), 0) : null;
  const stat = [
    meta.attempts > 0 ? `${thousands(meta.attempts)} attempts` : null,
    sobMs !== null ? `sum of best ${fmtTime(sobMs)}` : null,
  ].filter(Boolean).join(" - ");
  return { ...meta, rows, finalMs, pbFinalMs, isPb, stamp: isPb ? "NEW PB" : "RUN RECAP", verdict, stat, sobMs };
}

/* ── the .lss: a LiveSplit splits file, read with no dependency ── */

export type LssRun = { game: string; category: string; attempts: number; segments: Seg[]; pbAttempt: number | null; previousPbAttempt: number | null };

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

function tagText(block: string, name: string): string {
  const m = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(block);
  return m ? decodeXml(m[1]).trim() : "";
}

/** The `<RealTime>` / `<GameTime>` inside an element body, or null. */
function clockIn(body: string | undefined, clock: string, what: string): number | null {
  if (!body) return null;
  const m = new RegExp(`<${clock}>([^<]*)</${clock}>`).exec(body);
  return m ? parseTime(m[1], what) : null;
}

/**
 * Read a LiveSplit `.lss`: the header, the Personal Best, the golds, and the
 * previous PB - the best finished attempt before the PB attempt, its splits
 * rebuilt by summing that attempt's `SegmentHistory` times (a skipped split
 * has no entry; the next segment's entry carries both, so the sum holds).
 */
export function parseLss(xml: string, timing: RecapTiming = "real"): LssRun {
  if (!/<Run\b/.test(xml) || !/<Segments>/.test(xml)) throw new Error(`${ID}: lss does not look like a LiveSplit splits file (no <Run> with <Segments>).`);
  const clock = timing === "game" ? "GameTime" : "RealTime";
  const game = tagText(xml, "GameName");
  const category = tagText(xml, "CategoryName");
  const attempts = Number(tagText(xml, "AttemptCount")) || 0;

  const finished = new Map<number, number>();
  const attemptHistory = /<AttemptHistory>([\s\S]*?)<\/AttemptHistory>/.exec(xml)?.[1] ?? "";
  for (const m of attemptHistory.matchAll(/<Attempt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Attempt>)/g)) {
    const id = Number(/\bid="(-?\d+)"/.exec(m[1])?.[1]);
    const t = clockIn(m[2], clock, `lss attempt ${id}`);
    if (Number.isFinite(id) && t !== null) finished.set(id, t);
  }

  const segBlock = /<Segments>([\s\S]*?)<\/Segments>/.exec(xml)?.[1] ?? "";
  const raw = [...segBlock.matchAll(/<Segment>([\s\S]*?)<\/Segment>/g)].map((m, i) => {
    const body = m[1];
    const pbBody = /<SplitTime name="Personal Best"\s*(?:\/>|>([\s\S]*?)<\/SplitTime>)/.exec(body)?.[1];
    const bestBody = /<BestSegmentTime\s*(?:\/>|>([\s\S]*?)<\/BestSegmentTime>)/.exec(body)?.[1];
    const history = new Map<number, number | null>();
    const historyBody = /<SegmentHistory>([\s\S]*?)<\/SegmentHistory>/.exec(body)?.[1] ?? "";
    for (const h of historyBody.matchAll(/<Time id="(-?\d+)"\s*(?:\/>|>([\s\S]*?)<\/Time>)/g)) {
      history.set(Number(h[1]), clockIn(h[2], clock, `lss segment ${i + 1} history`));
    }
    return {
      name: cleanName(tagText(body, "Name"), i),
      pb: clockIn(pbBody, clock, `lss segment ${i + 1} Personal Best`),
      best: clockIn(bestBody, clock, `lss segment ${i + 1} best segment`),
      history,
    };
  });
  if (raw.length === 0) throw new Error(`${ID}: lss has no segments.`);
  const pbFinal = raw[raw.length - 1].pb;
  if (pbFinal === null) throw new Error(`${ID}: lss has no Personal Best for its last split (${clock}) - finish a run first${timing === "real" ? ', or try timing: "game"' : ""}.`);

  // The PB attempt: the first finished attempt with the PB's final time.
  const ids = [...finished.keys()].sort((a, b) => a - b);
  const pbAttempt = ids.find((id) => finished.get(id) === pbFinal) ?? null;
  // The previous PB: the best finished attempt before it (or, when the PB
  // attempt is not in the history, the best finished attempt slower than it).
  let previousPbAttempt: number | null = null;
  for (const id of ids) {
    const t = finished.get(id) as number;
    const eligible = pbAttempt !== null ? id < pbAttempt : t > pbFinal;
    if (eligible && (previousPbAttempt === null || t < (finished.get(previousPbAttempt) as number))) previousPbAttempt = id;
  }

  let acc = 0;
  const segments: Seg[] = raw.map((r, i) => {
    let pb: number | null = null;
    if (previousPbAttempt !== null) {
      const t = r.history.get(previousPbAttempt);
      if (t !== undefined && t !== null) {
        acc += t;
        pb = acc;
      }
      // The attempt's own final time is the truth for the last split, even if its history was trimmed.
      if (i === raw.length - 1) pb = finished.get(previousPbAttempt) ?? pb;
    }
    return { name: r.name, split: r.pb, pb, best: r.best };
  });
  return { game, category, attempts, segments, pbAttempt, previousPbAttempt };
}

/* ── time: the beats, the landings, the clock ── */

export type Beats = { clip: number; hook: number; replay: number; end: number };

/** An eighth of the clip (at most 3 s) opens on the result, a quarter holds it at the end, the rest replays the run. */
export function beatsOf(clipSec: number): Beats {
  const hook = round3(Math.min(3, clipSec * 0.125));
  const hold = round3(clipSec * 0.25);
  const replay = round3(clipSec - hook - hold);
  return { clip: clipSec, hook, replay, end: round3(hook + replay) };
}

/** When split `splitMs` lands in the clip: its share of the run, fast-forwarded into the replay. */
export function landAt(splitMs: number, finalMs: number, b: Beats): number {
  return round3(b.hook + (b.replay * splitMs) / finalMs);
}

/** Shown in the cold open and again from `at` on: ONE gate for two windows, so no `window` twin. */
export function openAndFrom(hook: number, at: number): string {
  return `lt(t,${hook})+gte(t,${at})`;
}

/**
 * The clock: ONE drawtext expression, evaluated per frame - the final time in
 * the cold open, the run's own time fast-forwarded through the replay, held on
 * the final time after. Inside `%{...}` drawtext wants `\:` and `\,`. The
 * +0.0005 keeps trunc() from printing .26 for a 1271.27 stored as 1271.2699.
 */
export function clockExpr(finalMs: number, b: Beats): string {
  const F = (finalMs / 1000).toFixed(3);
  const H = b.hook.toFixed(3);
  const K = (finalMs / 1000 / Math.max(0.001, b.replay)).toFixed(6);
  const X = `(if(lt(t\\,${H})\\,${F}\\,min((t-${H})*${K}\\,${F}))+0.0005)`;
  const cs = `%{eif\\:mod(trunc(${X}*100)\\,100)\\:d\\:2}`;
  const ss = `%{eif\\:mod(trunc(${X})\\,60)\\:d\\:2}`;
  if (finalMs >= 3600000) {
    return `%{eif\\:trunc(${X}/3600)\\:d}:%{eif\\:mod(trunc(${X}/60)\\,60)\\:d\\:2}:${ss}.${cs}`;
  }
  return `%{eif\\:trunc(${X}/60)\\:d}:${ss}.${cs}`;
}

/** The graph's value per row, up = good: the delta's negative ("delta") or the time saved on the segment ("segments"). */
export function graphValues(rows: Row[], kind: RecapGraph): Array<number | null> {
  if (kind === "none") return rows.map(() => null);
  if (kind === "segments") return rows.map((r) => (r.segMs !== null && r.pbSegMs !== null ? r.pbSegMs - r.segMs : null));
  return rows.map((r) => (r.delta !== null ? -r.delta : null));
}

/**
 * The largest 5-smooth number (2^a 3^b 5^c) at or below `n` - each child
 * renders on its own canvas, and a side with a large prime factor has no
 * divisor lattice, so placement degrades to exact and `latticeSmooth` fails.
 */
function fiveSmoothDown(n: number): number {
  for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
    let m = v;
    for (const p of [2, 3, 5]) while (m % p === 0) m /= p;
    if (m === 1) return v;
  }
  return 1;
}

/* ── geometry ── */

export type RecapRect = { x: number; y: number; w: number; h: number };
export type RecapFit = { text: string; px: number; width: number };

export type RecapLayout = {
  W: number;
  H: number;
  S: number;
  landscape: boolean;
  game: RecapFit | null;
  gameRect: RecapRect;
  stamp: RecapFit;
  stampBox: RecapRect;
  stampTextRect: RecapRect;
  category: RecapFit | null;
  categoryRect: RecapRect;
  runner: RecapFit | null;
  runnerRect: RecapRect;
  /** The rows child's canvas in the parent - both sides 5-smooth. */
  table: RecapRect;
  /** Row tops and heights, table-local. */
  rowY: number[];
  rowH: number[];
  numPx: number;
  /** Right edges of the time and delta columns, table-local. */
  timeRight: number;
  deltaRight: number;
  timeWidth: number;
  deltaWidth: number;
  timeSample: string;
  deltaSample: string;
  names: RecapFit[];
  nameRects: RecapRect[];
  /** The graph child's canvas in the parent - both sides 5-smooth - or null. */
  graph: RecapRect | null;
  caption: RecapFit | null;
  captionRect: RecapRect;
  clockSample: string;
  clockPx: number;
  clockWidth: number;
  clockRect: RecapRect;
  verdict: RecapFit;
  verdictRect: RecapRect;
  stat: RecapFit | null;
  statRect: RecapRect;
};

/** One line, shrunk until it fits; ellipsized only at the floor. */
function fitOne(text: string, maxW: number, maxPx: number, minPx: number, bold = false): RecapFit {
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && widthOf(text, px, bold) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
  const out = widthOf(text, px, bold) > maxW ? ellipsize(text, px, maxW, bold) : text;
  return { text: out, px, width: widthOf(out, px, bold) };
}

/** A drawtext string's width: measured in the bundled bold (the wider face), widened for the system font. */
function drawWidth(text: string, px: number): number {
  return widthOf(text, px, true) * DRAWTEXT_WIDEN;
}

/** Every digit an 8 - the widest string a clock of this shape prints. */
function digitsToEights(s: string): string {
  return s.replace(/\d/g, "8");
}

/** A rect of `w0 x h0` shrunk to 5-smooth sides and centred where it was. */
function smoothRect(x: number, y: number, w0: number, h0: number): RecapRect {
  const w = fiveSmoothDown(w0);
  const h = fiveSmoothDown(h0);
  return { x: x + Math.floor((w0 - w) / 2), y: y + Math.floor((h0 - h) / 2), w, h };
}

/**
 * The whole geometry as a pure function of the run and the canvas: the header
 * (game and stamp, category and runner), the body (the table, and the graph
 * under it or - landscape - beside it), the footer (the clock, the verdict,
 * the stat line). The test asserts rects and fits without parsing m0.
 */
export function layoutRecap(model: RecapModel, graphKind: RecapGraph, W: number, H: number): RecapLayout {
  const S = Math.min(W, H);
  const landscape = W >= 1.25 * H;
  const margin = Math.max(6, Math.round(0.045 * S));
  const gap = Math.max(4, Math.round(0.024 * S));
  const minPx = Math.max(5, Math.round(0.014 * S));
  const contentW = Math.max(40, W - 2 * margin);

  // ── header row 1: the game, the stamp box right ──
  const stamp = fitOne(model.stamp, budget(Math.round(0.34 * contentW)), Math.max(minPx, Math.round(0.034 * S)), minPx, true);
  const stampPadX = Math.max(3, Math.round(0.55 * stamp.px));
  const stampTextW = Math.ceil(stamp.width / 0.94) + 4;
  const stampBoxW = stampTextW + 2 * stampPadX;
  const stampBoxH = Math.max(8, Math.round(1.8 * stamp.px));
  const gameW = Math.max(16, contentW - stampBoxW - gap);
  const game = model.game ? fitOne(model.game, budget(gameW), Math.max(minPx, Math.round(0.064 * S)), minPx, true) : null;
  const row1H = Math.max(game ? Math.round(1.3 * game.px) : 0, stampBoxH);
  const gameRect: RecapRect = { x: margin, y: margin, w: gameW, h: row1H };
  const stampBox: RecapRect = { x: margin + contentW - stampBoxW, y: margin + Math.floor((row1H - stampBoxH) / 2), w: stampBoxW, h: stampBoxH };
  const stampTextRect: RecapRect = { x: stampBox.x + stampPadX, y: stampBox.y, w: stampTextW, h: stampBoxH };

  // ── header row 2: the category left, the runner right ──
  const subPx = Math.max(minPx, Math.round(0.034 * S));
  const runner = model.runner ? fitOne(model.runner, budget(Math.round(0.42 * contentW)), subPx, minPx) : null;
  const runnerW = runner ? Math.ceil(runner.width / 0.94) + 4 : 0;
  const categoryW = Math.max(16, contentW - (runner ? runnerW + gap : 0));
  const category = model.category ? fitOne(model.category, budget(categoryW), subPx, minPx) : null;
  const row2H = category || runner ? Math.round(1.6 * Math.max(category?.px ?? 0, runner?.px ?? 0)) : 0;
  const categoryRect: RecapRect = { x: margin, y: margin + row1H, w: categoryW, h: Math.max(1, row2H) };
  const runnerRect: RecapRect = { x: margin + contentW - Math.max(1, runnerW), y: margin + row1H, w: Math.max(1, runnerW), h: Math.max(1, row2H) };
  const headerBottom = margin + row1H + row2H;

  // ── footer: the clock, the verdict, the stat line ──
  // The clock always prints minutes ("0:42.17"), where a split under a minute reads "42.17".
  const clockSample = digitsToEights(fmtTime(model.finalMs).replace(/^(\d+)\./, "0:$1."));
  const clockMaxW = landscape ? Math.round(0.55 * contentW) : contentW;
  // The table is the content; the clock sizes to the height it can spare.
  let clockPx = Math.max(minPx, Math.round(Math.min((landscape ? 0.12 : 0.13) * S, 0.085 * H)));
  while (clockPx > minPx && drawWidth(clockSample, clockPx) > budget(clockMaxW)) clockPx = Math.max(minPx, Math.round(clockPx * 0.92));
  const clockWidth = drawWidth(clockSample, clockPx);
  const clockH = Math.round(1.25 * clockPx);
  const clockW = Math.ceil(clockWidth / 0.94) + 4;
  const verdictPx = Math.max(minPx, Math.round(0.042 * S));
  const statPx = Math.max(minPx, Math.round(0.03 * S));
  let verdict: RecapFit;
  let stat: RecapFit | null;
  let clockRect: RecapRect;
  let verdictRect: RecapRect;
  let statRect: RecapRect;
  let footerH: number;
  if (landscape) {
    const sideW = Math.max(24, contentW - clockW - gap);
    verdict = fitOne(model.verdict, budget(sideW), verdictPx, minPx, true);
    stat = model.stat ? fitOne(model.stat, budget(sideW), statPx, minPx) : null;
    const vH = Math.round(1.45 * verdict.px);
    const sH = stat ? Math.round(1.5 * stat.px) : 0;
    footerH = Math.max(clockH, vH + sH);
    const fy = H - margin - footerH;
    clockRect = { x: margin, y: fy + Math.floor((footerH - clockH) / 2), w: clockW, h: clockH };
    const sx = margin + contentW - sideW;
    const sy = fy + Math.floor((footerH - vH - sH) / 2);
    verdictRect = { x: sx, y: sy, w: sideW, h: vH };
    statRect = { x: sx, y: sy + vH, w: sideW, h: Math.max(1, sH) };
  } else {
    verdict = fitOne(model.verdict, budget(contentW), verdictPx, minPx, true);
    stat = model.stat ? fitOne(model.stat, budget(contentW), statPx, minPx) : null;
    const vH = Math.round(1.45 * verdict.px);
    const sH = stat ? Math.round(1.5 * stat.px) : 0;
    footerH = clockH + vH + sH;
    const fy = H - margin - footerH;
    clockRect = { x: margin, y: fy, w: clockW, h: clockH };
    verdictRect = { x: margin, y: fy + clockH, w: contentW, h: vH };
    statRect = { x: margin, y: fy + clockH + vH, w: contentW, h: Math.max(1, sH) };
  }
  const footerTop = H - margin - footerH;

  // ── body: the table, and the graph under it (or beside it) ──
  const bodyTop = headerBottom + gap;
  const bodyH = Math.max(8, footerTop - gap - bodyTop);
  const n = model.rows.length;
  const values = graphValues(model.rows, graphKind);
  let hasGraph = values.some((v) => v !== null && v !== 0);
  const capPx = Math.max(minPx, Math.round(0.026 * S));
  const captionText = graphKind === "segments" ? "TIME SAVED PER SEGMENT" : "DELTA VS PB";
  const rowHMax = Math.max(4, Math.round(0.085 * S));

  let tableArea: RecapRect;
  let graphArea: RecapRect | null = null;
  let captionRect: RecapRect = { x: margin, y: bodyTop, w: 1, h: 1 };
  if (landscape) {
    const graphW = hasGraph ? Math.round(0.36 * contentW) : 0;
    const tableW = contentW - (hasGraph ? graphW + gap : 0);
    const rowH0 = Math.max(2, Math.min(rowHMax, Math.floor(bodyH / n)));
    const blockH = rowH0 * n;
    const top = bodyTop + Math.floor((bodyH - blockH) / 2);
    tableArea = { x: margin + (hasGraph ? graphW + gap : 0), y: top, w: tableW, h: blockH };
    if (hasGraph) {
      const capH = Math.round(1.7 * capPx);
      captionRect = { x: margin, y: top, w: graphW, h: capH };
      graphArea = { x: margin, y: top + capH, w: graphW, h: Math.max(1, blockH - capH) };
    }
  } else {
    // Rows first: a legible minimum before the graph gets any room, and the
    // graph only takes what is left (dropped when that is too little).
    const capH = Math.round(1.7 * capPx);
    const graphMin = Math.max(16, Math.round(0.05 * H));
    const graphTarget = Math.round(0.24 * bodyH);
    const rowMin = Math.max(2, Math.round(0.042 * S));
    let rowH0 = Math.max(Math.min(rowMin, Math.floor(bodyH / n)), Math.min(rowHMax, Math.floor((bodyH - (hasGraph ? graphTarget + capH + gap : 0)) / n)));
    let graphH = hasGraph ? Math.min(bodyH - rowH0 * n - capH - gap, Math.round(0.34 * bodyH)) : 0;
    if (hasGraph && graphH < graphMin) {
      hasGraph = false;
      graphH = 0;
      rowH0 = Math.max(2, Math.min(rowHMax, Math.floor(bodyH / n)));
    }
    const blockH = rowH0 * n + (hasGraph ? gap + capH + graphH : 0);
    const top = bodyTop + Math.floor((bodyH - blockH) / 2);
    tableArea = { x: margin, y: top, w: contentW, h: rowH0 * n };
    if (hasGraph) {
      captionRect = { x: margin, y: top + rowH0 * n + gap, w: contentW, h: capH };
      graphArea = { x: margin, y: captionRect.y + capH, w: contentW, h: graphH };
    }
  }
  const table = smoothRect(tableArea.x, tableArea.y, tableArea.w, tableArea.h);
  const graph = graphArea && graphArea.h >= 8 ? smoothRect(graphArea.x, graphArea.y, graphArea.w, graphArea.h) : null;
  const caption = graph ? fitOne(captionText, budget(captionRect.w), capPx, minPx) : null;

  const rowY: number[] = [];
  const rowH: number[] = [];
  for (let i = 0; i < n; i++) {
    const y0 = Math.round((i * table.h) / n);
    const y1 = Math.round(((i + 1) * table.h) / n);
    rowY.push(y0);
    rowH.push(Math.max(1, y1 - y0));
  }

  // ── inside a row: name | delta | time, the numbers sized to leave the name room ──
  const padX = Math.max(3, Math.round(0.022 * table.w));
  const colGap = Math.max(3, Math.round(0.03 * table.w));
  const timeTexts = model.rows.flatMap((r) => [r.split !== null ? fmtTime(r.split) : "-", ...(r.pb !== null ? [fmtTime(r.pb)] : [])]);
  const deltaTexts = model.rows.filter((r) => r.delta !== null).map((r) => fmtDelta(r.delta as number));
  const widestOf = (texts: string[], px: number) => texts.reduce((best, t) => (drawWidth(t, px) > best.w ? { t, w: drawWidth(t, px) } : best), { t: "", w: 0 });
  const cols = (px: number) => {
    const tw = widestOf(timeTexts, px);
    const dw = widestOf(deltaTexts, px);
    const timeCol = Math.ceil(tw.w / 0.94) + 2;
    const deltaCol = dw.w > 0 ? Math.ceil(dw.w / 0.94) + 2 : 0;
    const nameW = table.w - 2 * padX - timeCol - colGap - (deltaCol > 0 ? deltaCol + colGap : 0);
    return { tw, dw, timeCol, deltaCol, nameW };
  };
  const minRowH = Math.min(...rowH);
  let numPx = Math.max(3, Math.round(0.5 * minRowH));
  let c = cols(numPx);
  while (numPx > 3 && c.nameW < 0.34 * table.w) {
    numPx = Math.max(3, Math.round(numPx * 0.92));
    c = cols(numPx);
  }
  const timeRight = table.w - padX;
  const deltaRight = timeRight - c.timeCol - colGap;
  const nameW = Math.max(8, c.nameW);
  const names: RecapFit[] = [];
  const nameRects: RecapRect[] = [];
  model.rows.forEach((r, i) => {
    names.push(fitOne(r.name, budget(nameW), numPx, Math.max(3, Math.round(numPx * 0.8))));
    nameRects.push({ x: table.x + padX, y: table.y + rowY[i], w: nameW, h: rowH[i] });
  });

  return {
    W, H, S, landscape,
    game, gameRect, stamp, stampBox, stampTextRect,
    category, categoryRect, runner, runnerRect,
    table, rowY, rowH, numPx,
    timeRight, deltaRight,
    timeWidth: c.tw.w, deltaWidth: c.dw.w, timeSample: c.tw.t, deltaSample: c.dw.t,
    names, nameRects,
    graph, caption, captionRect,
    clockSample, clockPx, clockWidth, clockRect,
    verdict, verdictRect, stat, statRect,
  };
}

/**
 * What the geometry promises. Every fitted text is measured (the drawtext
 * columns and the clock at their widest string, already widened for the
 * system font); the header lives in the top band, the clock in the bottom
 * half; the stripes (the rows child, flattened by the checker) are present.
 */
export function recapContract(L: RecapLayout): LayoutConstraint[] {
  return [
    ...(L.game ? [textFitsMeasured("game", L.game.text, L.game.px, L.game.width)] : []),
    textFitsMeasured("stamp-text", L.stamp.text, L.stamp.px, L.stamp.width),
    ...(L.category ? [textFitsMeasured("category", L.category.text, L.category.px, L.category.width)] : []),
    ...(L.runner ? [textFitsMeasured("runner", L.runner.text, L.runner.px, L.runner.width)] : []),
    ...L.names.map((f, i) => textFitsMeasured(`name-${i}`, f.text, f.px, f.width)),
    textFitsMeasured("times", L.timeSample, L.numPx, L.timeWidth),
    ...(L.deltaSample ? [textFitsMeasured("deltas", L.deltaSample, L.numPx, L.deltaWidth)] : []),
    textFitsMeasured("clock", L.clockSample, L.clockPx, L.clockWidth),
    textFitsMeasured("verdict", L.verdict.text, L.verdict.px, L.verdict.width),
    ...(L.stat ? [textFitsMeasured("stat", L.stat.text, L.stat.px, L.stat.width)] : []),
    ...(L.caption ? [textFitsMeasured("caption", L.caption.text, L.caption.px, L.caption.width)] : []),
    { label: "stamp-text", within: { yFrac: [0, 0.3] } },
    { label: "clock", within: { yFrac: [0.5, 1] } },
    { label: "row-stripe" },
  ];
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-09-26/.
 */
const WHY: WhySpec = {
  day: 7,
  date: "2026-09-26",
  agent: "claude",
  model: "claude-opus-5-5",
  id: ID,
  title: "Speedrun PB Recap",
  who: "Speedrunners who time runs in LiveSplit and share every PB on X, Bluesky, Discord and speedrun.com, since splits.io closed in 2025.",
  problem: [
    "Every PB gets shared, and what the timer offers is a picture of its own window: LiveSplit's README says any run can be shared to Speedrun.com, X and Bluesky, and \"You can also share a screenshot of your splits to Imgur\".",
    "The site that turned splits into something to look at is gone. LiveSplit issue #2543: splits.io shut down on March 31, 2025, and \"the splits for Speedrun.com runs were stored on Splits.io\". Its author: \"It always lost money as a side project.\"",
    "Runners write their own tools on the .lss because \"LiveSplit files store a ton of very useful data\" and \"LiveSplit itself does not provide any built-in analytics features\" (LiveSplit-Analytics-Database; lss-tools does the same).",
  ],
  sources: [
    "https://github.com/LiveSplit/LiveSplit",
    "https://github.com/LiveSplit/LiveSplit/issues/2543",
    "https://twos.dev/splitsio.html",
    "https://github.com/JuanCruzCB/LiveSplit-Analytics-Database",
    "https://github.com/slaurent22/lss-tools",
  ],
  solution: [
    "The splits file is the prop. Paste a LiveSplit .lss into lss: the run is its Personal Best, the comparison the previous PB rebuilt from the attempt history, the golds its best segments. Or pass rows of { name, split, pb, best }. Deltas follow LiveSplit's own colour rule.",
    "The clip opens on the finished recap, replays the run with a fast-forwarded timer as each split lands at its share of the run, and ends where it began, so it loops. The graph is the delta against the PB at each split. All moving text is gated drawtext: 16 rows cost two overlays.",
    "Weak spots, honestly: no gameplay yet - the v2 is the same props over the recorded run at 1:1 - and the previous PB is only as good as the file's history.",
  ],
  usage: {
    command: "m0saic make @one-a-day/gaming/speedrun-pb-recap/v1 --template-repo . -w 1080 -h 1920 -o recap.mp4",
    try: [
      "--props @props.json with {\"lss\": \"<your .lss text>\"} - your PB against your previous PB, golds included",
      "segments - rows of { name, split, pb, best }; splits are cumulative, \"1:23.45\"",
      "graph \"segments\" - time saved per segment; timing \"game\" for load-removed games",
      "-w 1920 -h 1080 for YouTube; --durationMs 12000 for a shorter teaser",
    ],
  },
  caveats: [
    "Splits are cumulative (time since the start); a list of segment lengths is refused with a message that says so.",
    "The previous PB is rebuilt from SegmentHistory; a file whose history was cleaned keeps only that attempt's final time.",
    "The digits are drawtext in the machine's font; pixels are deterministic per machine only.",
  ],
  // No runner trace.json: the founder ran the day by hand in one Claude Code
  // session (Opus 5.5). Phases are the session's own clock; tool calls,
  // tokens and dollars are measured from the session transcript by
  // journal/2026-09-26/token-cost-audit.mjs (list prices of 2026-09-26).
  timeline: {
    source: "self-reported",
    costBasis: "estimated",
    pricedAt: "2026-09-26",
    phases: [
      { name: "orient + maintain", startMs: 0, durMs: 692000 },
      { name: "scout", startMs: 692000, durMs: 395000 },
      { name: "plan", startMs: 1087000, durMs: 417000 },
      { name: "build", startMs: 1504000, durMs: 0 },
    ],
  },
};

export const SpeedrunPbRecapV1 = defineMosaicTemplate<SpeedrunPbRecapProps>({
  id: asTemplateId(ID),
  label: "2026-09-26 · Speedrun PB Recap",
  version: 1,
  description:
    "A speedrun PB recap clip from the splits file: the table fills in against the old PB in LiveSplit's delta colours, the timer fast-forwards the run, and the clip opens and closes on the result.",
  capabilities: { tier: "core" },
  tags: ["gaming", "2026-09-26", "day-007", "speedrun", "livesplit", "splits", "recap", "video"],

  outputHints: {
    width: 1080,
    height: 1920,
    fps: 30,
    durationMs: DEFAULTS.clipSec * 1000,
    format: { kind: "video", container: "mp4" },
    note: "A vertical teaser by default; 1920x1080 puts the graph beside the table. The clip is clipSec long; an explicit --durationMs overrides it and becomes the clip.",
  },
  resolveOutputHints: (props) => {
    const clipSec = numberOr(props?.clipSec, DEFAULTS.clipSec, RECAP_MIN_CLIP_SEC, RECAP_MAX_CLIP_SEC);
    return { durationMs: Math.round(clipSec * 1000) };
  },

  propsSchema,
  defaultProps: {
    game: DEFAULTS.game,
    category: DEFAULTS.category,
    runner: DEFAULTS.runner,
    attempts: DEFAULTS.attempts,
    segments: DEFAULT_SEGMENTS.map((s) => ({ ...s })),
    lss: "",
    timing: DEFAULTS.timing,
    graph: DEFAULTS.graph,
    clipSec: DEFAULTS.clipSec,
    accent: DEFAULTS.accent,
    preset: DEFAULTS.preset,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default SpeedrunPbRecapV1;

/* ── props: render() is the gate ── */

function numberOr(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

function pickText(value: unknown, fallback: string, name: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") throw new Error(`${ID}: ${name} must be a string.`);
  return value.replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
}

function pickNumber(value: unknown, fallback: number, name: string, min: number, max: number): number {
  if (value === undefined) return fallback;
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error(`${ID}: ${name} must be a number. Got ${JSON.stringify(value)}.`);
  if (!Number.isInteger(n)) throw new Error(`${ID}: ${name} must be a whole number. Got ${JSON.stringify(value)}.`);
  if (n < min || n > max) throw new Error(`${ID}: ${name} must be between ${min} and ${max}. Got ${JSON.stringify(value)}.`);
  return n;
}

function pickColor(value: unknown, fallback: MosaicColor, name: string): MosaicColor {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length === 0) return fallback;
  if (!HEX.test(s)) throw new Error(`${ID}: ${name} ${JSON.stringify(value)} must be #rrggbb.`);
  return s as MosaicColor;
}

function pickOne<T extends string>(value: unknown, fallback: T, options: readonly T[], name: string): T {
  if (value === undefined || value === "") return fallback;
  if (typeof value !== "string" || !(options as readonly string[]).includes(value)) {
    throw new Error(`${ID}: ${name} must be one of ${options.map((o) => `"${o}"`).join(", ")}. Got ${JSON.stringify(value)}.`);
  }
  return value as T;
}

function pickSegments(value: unknown): Seg[] {
  let v: unknown = value;
  if (v === undefined) v = DEFAULT_SEGMENTS;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      throw new Error(`${ID}: segments is not valid JSON - pass an array of { name, split, pb, best }.`);
    }
  }
  if (!Array.isArray(v)) throw new Error(`${ID}: segments must be an array of { name, split, pb, best }.`);
  if (v.length < RECAP_MIN_ROWS || v.length > RECAP_MAX_ROWS) throw new Error(`${ID}: a recap needs ${RECAP_MIN_ROWS}..${RECAP_MAX_ROWS} segments (got ${v.length}).`);
  return v.map((row, i) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`${ID}: segments[${i}] must be an object { name, split, pb, best }.`);
    const o = row as SegmentInput;
    return {
      name: cleanName(o.name, i),
      split: parseTime(o.split, `segments[${i}].split`),
      pb: parseTime(o.pb, `segments[${i}].pb`),
      best: parseTime(o.best, `segments[${i}].best`),
    };
  });
}

/* ── colour helpers ── */

/** Ink that reads on `c`: the dark page for a light colour, white for a dark one. */
function onColor(c: MosaicColor): MosaicColor {
  const n = parseInt(String(c).slice(1), 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return (lum > 0.6 ? "#0d1117" : "#ffffff") as MosaicColor;
}

/** Linear byte mix: `t` of `a` over `1-t` of `b` - the static stand-in for opacity. */
function mix(a: MosaicColor, b: MosaicColor, t: number): MosaicColor {
  const pa = parseInt(String(a).slice(1), 16);
  const pb = parseInt(String(b).slice(1), 16);
  const ch = (sa: number, sb: number) => Math.round(sa * t + sb * (1 - t));
  const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bl = ch(pa & 255, pb & 255);
  return ("#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)) as MosaicColor;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/* ── sources ── */

type TextLayer = MosaicTextSource["layers"][number];
type Gate = { enable: string; window?: { startSec?: number; endSec?: number } };

/** One number in a drawtext column: right-aligned on `xRight`, centred on `cy` (both table-local; comma-free exprs). */
function numLayer(text: string, px: number, color: MosaicColor, xRight: number, cy: number, gate: Gate | null): TextLayer {
  return {
    content: { kind: "literal", text },
    style: { fontSize: px, fontColor: color },
    placement: { hAlign: "left", vAlign: "top", xExpr: `${Math.round(xRight)}-text_w`, yExpr: `${Math.round(cy)}-text_h/2` },
    ...(gate ? { overlay: gate } : {}),
  } as TextLayer;
}

/** A video-mode (drawtext) text source over the whole table: one layer per row per state. */
function drawtextSource(layers: TextLayer[], label: string): MosaicSource {
  return {
    type: "text",
    renderMode: { kind: "video" },
    visual: { backgroundColor: "black@0" as MosaicColor },
    layers,
    editor: { owner: "template", label },
  } as MosaicSource;
}

/** The per-frame clock: drawtext, video mode, one expression, always on. */
function clockSource(expr: string, px: number, color: MosaicColor): MosaicSource {
  return {
    type: "text",
    renderMode: { kind: "video" },
    visual: { backgroundColor: "black@0" as MosaicColor },
    layers: [
      {
        content: { kind: "expr", expr, eval: "frame" },
        style: { fontSize: px, fontColor: color },
        placement: { hAlign: "left", vAlign: "middle" },
      },
    ],
    editor: { owner: "template", label: "clock" },
  } as MosaicSource;
}

/** A static svg cell that shows only in the cold open and after the last split. */
function gated(cell: MosaicSource, gate: Gate): MosaicSource {
  return { ...cell, overlay: gate } as MosaicSource;
}

async function render(props: SpeedrunPbRecapProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  const preset = pickOne(props.preset, DEFAULTS.preset, ["dark", "light"] as const, "preset");
  const theme = THEMES[preset];
  const accent = pickColor(props.accent, DEFAULTS.accent as MosaicColor, "accent");
  const timing = pickOne(props.timing, DEFAULTS.timing, ["real", "game"] as const, "timing");
  const graphKind = pickOne(props.graph, DEFAULTS.graph, ["delta", "segments", "none"] as const, "graph");
  const clipSec = pickNumber(props.clipSec, DEFAULTS.clipSec, "clipSec", RECAP_MIN_CLIP_SEC, RECAP_MAX_CLIP_SEC);
  const runner = pickText(props.runner, DEFAULTS.runner, "runner");
  if (props.lss !== undefined && typeof props.lss !== "string") throw new Error(`${ID}: lss must be the text of a .lss file.`);
  const lss = (props.lss ?? "").trim();

  let model: RecapModel;
  if (lss.length > 0) {
    const run = parseLss(lss, timing);
    model = buildModel(
      { game: pickText(run.game, "", "lss GameName"), category: pickText(run.category, "", "lss CategoryName"), runner, attempts: run.attempts },
      run.segments,
    );
  } else {
    model = buildModel(
      {
        game: pickText(props.game, DEFAULTS.game, "game"),
        category: pickText(props.category, DEFAULTS.category, "category"),
        runner,
        attempts: pickNumber(props.attempts, DEFAULTS.attempts, "attempts", 0, 9999999),
      },
      pickSegments(props.segments),
    );
  }

  // The clip is authored. An explicit user pin wins and BECOMES the clip;
  // the host-seeded target is never read as one.
  const pinned = resolvePinnedDurationMs(ctx);
  const clip = pinned !== undefined ? Math.max(1, pinned / 1000) : clipSec;
  const durationMs = pinned !== undefined ? Math.round(pinned) : clipSec * 1000;
  const b = beatsOf(clip);

  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const L = layoutRecap(model, graphKind, W, H);
  const rows = model.rows;
  const lands = rows.map((r) => (r.split !== null ? landAt(r.split, model.finalMs, b) : null));
  const finale: Gate = { enable: openAndFrom(b.hook, b.end) };

  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const piece = (rect: RecapRect, importance: number, source: MosaicSource) => pieces.push({ rect: { ...rect, importance }, source });

  // ── 1. the rows, as a CHILD document: static stripes, and one highlight per
  //      row gated to the stretch of the replay while that segment runs. No
  //      masks, both sides 5-smooth. ──
  const rowPieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  L.rowY.forEach((y, i) => {
    if (i % 2 === 1) rowPieces.push({ rect: { x: 0, y, w: L.table.w, h: L.rowH[i], importance: 1 }, source: tag(makeColorTile(theme.stripe) as MosaicSource, "row-stripe") });
  });
  const hl = mix(accent, theme.bg, theme.hlMix);
  let from = b.hook;
  rows.forEach((_, i) => {
    const at = lands[i];
    if (at === null) return;
    if (at > from) {
      const tile = makeColorTile(hl, { overlay: { enable: `gte(t,${from})*lt(t,${at})`, window: { startSec: from, endSec: at } } });
      rowPieces.push({ rect: { x: 0, y: L.rowY[i], w: L.table.w, h: L.rowH[i], importance: 2 }, source: tag(tile as MosaicSource, "row-now") });
    }
    from = at;
  });
  const rowsPlaced = placeInsetPieces({ rootW: L.table.w, rootH: L.table.h, pieces: rowPieces });
  const rowsDoc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(rowsPlaced.m0, ID),
    assets: {},
    size: { width: L.table.w, height: L.table.h },
    fps: ctx.target.fps,
    durationMs,
    // The child's own canvas: the page colour, or the table reads as a black slab.
    backgroundColor: theme.bg,
    sources: rowsPlaced.sources,
    editor: { label: `rows - ${rows.length} splits` },
  };
  piece(L.table, 1, tag({ type: "mosaic", ref: "rows", placement: { fit: "contain" } } as MosaicSource, "rows"));

  // ── 2. the graph, as a CHILD document: a zero line and one bar per split,
  //      up for time gained, down for time lost, a gold cap on a gold
  //      segment. Each bar shows in the cold open and from its split on. ──
  const children: NonNullable<MosaicDocument["children"]> = { rows: rowsDoc };
  if (L.graph && L.caption) {
    const values = graphValues(rows, graphKind);
    const g = L.graph;
    const maxUp = Math.max(0, ...values.map((v) => (v !== null && v > 0 ? v : 0)));
    const maxDown = Math.max(0, ...values.map((v) => (v !== null && v < 0 ? -v : 0)));
    const pad = Math.max(2, Math.round(0.06 * g.h));
    const span = Math.max(4, g.h - 2 * pad);
    const total = Math.max(1, maxUp + maxDown);
    const zeroY = pad + Math.round((span * maxUp) / total);
    const lineH = Math.max(1, Math.round(0.012 * g.h));
    const colW = g.w / rows.length;
    const barW = Math.max(2, Math.round(colW * 0.62));
    // The gold marker floats just past the bar's end, so a gold split with a
    // small delta still gets one; the graph's padding leaves room past the tallest bar.
    const capH = Math.max(2, pad - 2);
    const graphPieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
    graphPieces.push({ rect: { x: 0, y: Math.max(0, zeroY - Math.floor(lineH / 2)), w: g.w, h: lineH, importance: 1 }, source: tag(makeColorTile(theme.line) as MosaicSource, "graph-zero") });
    values.forEach((v, i) => {
      const at = lands[i];
      if (v === null || v === 0 || at === null) return;
      const hgt = Math.max(2, Math.round((Math.abs(v) * span) / total));
      const x = Math.round(i * colW + (colW - barW) / 2);
      const y = v > 0 ? zeroY - hgt : zeroY;
      const gate = { overlay: { enable: openAndFrom(b.hook, at) } };
      graphPieces.push({ rect: { x, y, w: barW, h: hgt, importance: 2 }, source: tag(makeColorTile(v > 0 ? theme.tones.aheadGain : theme.tones.behindLose, gate) as MosaicSource, "graph-bar") });
      const capY = v > 0 ? y - 1 - capH : y + hgt + 1;
      if (rows[i].gold && capY >= 0 && capY + capH <= g.h) {
        graphPieces.push({ rect: { x, y: capY, w: barW, h: capH, importance: 3 }, source: tag(makeColorTile(theme.tones.gold, gate) as MosaicSource, "graph-gold") });
      }
    });
    const graphPlaced = placeInsetPieces({ rootW: g.w, rootH: g.h, pieces: graphPieces });
    children.graph = {
      kind: "mosaic_document",
      version: 1,
      m0: toM0String(graphPlaced.m0, ID),
      assets: {},
      size: { width: g.w, height: g.h },
      fps: ctx.target.fps,
      durationMs,
      backgroundColor: theme.bg,
      sources: graphPlaced.sources,
      editor: { label: `graph - ${graphKind}` },
    };
    piece(g, 2, tag({ type: "mosaic", ref: "graph", placement: { fit: "contain" } } as MosaicSource, "graph"));
    piece(L.captionRect, 3, tag(textCell({ text: L.caption.text, fontSize: L.caption.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "caption" }), "caption"));
  }

  // ── 3. the header: game, stamp (the cold open and the finish), category, runner ──
  if (L.game) piece(L.gameRect, 3, bindProp(tag(textCell({ text: L.game.text, fontSize: L.game.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "game" }), "game"), "game"));
  const stampColor = model.isPb ? accent : mix(theme.dim, theme.bg, 0.55);
  piece(L.stampBox, 3, bindProp(tag(makeColorTile(stampColor, { overlay: finale }) as MosaicSource, "stamp"), "accent"));
  piece(L.stampTextRect, 4, gated(tag(textCell({ text: L.stamp.text, fontSize: L.stamp.px, color: onColor(stampColor), hAlign: "center", bold: true, vAlign: "middle", label: "stamp-text" }), "stamp-text"), finale));
  if (L.category) piece(L.categoryRect, 3, bindProp(tag(textCell({ text: L.category.text, fontSize: L.category.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "category" }), "category"), "category"));
  if (L.runner) piece(L.runnerRect, 3, bindProp(tag(textCell({ text: L.runner.text, fontSize: L.runner.px, color: accent, hAlign: "right", vAlign: "middle", label: "runner" }), "runner"), "runner"));

  // ── 4. the names: static svg, one cell a row, each bound to its own row's
  //      name leaf (Make edits a segment name in place). A pasted .lss owns
  //      the names, so then there is no leaf to bind. ──
  L.names.forEach((f, i) => {
    const src = tag(textCell({ text: f.text, fontSize: f.px, color: rows[i].split === null ? theme.dim : theme.ink, hAlign: "left", vAlign: "middle", label: `name-${i}` }), `name-${i}`);
    piece(L.nameRects[i], 3, lss.length === 0 ? bindPropPath(src, "segments", [i, "name"], "string") : src);
  });

  // ── 5. the numbers: two drawtext sources over the table. A split shows in
  //      the cold open and from its landing on; until it lands, the old PB
  //      split waits in its place, dim (LiveSplit's pending look). ──
  const timeLayers: TextLayer[] = [];
  const deltaLayers: TextLayer[] = [];
  rows.forEach((r, i) => {
    const cy = L.rowY[i] + L.rowH[i] / 2;
    const at = lands[i];
    if (r.split === null || at === null) {
      timeLayers.push(numLayer("-", L.numPx, theme.dim, L.timeRight, cy, null));
      return;
    }
    timeLayers.push(numLayer(fmtTime(r.split), L.numPx, theme.ink, L.timeRight, cy, { enable: openAndFrom(b.hook, at) }));
    if (r.pb !== null && at > b.hook) {
      timeLayers.push(numLayer(fmtTime(r.pb), L.numPx, theme.dim, L.timeRight, cy, { enable: `gte(t,${b.hook})*lt(t,${at})`, window: { startSec: b.hook, endSec: at } }));
    }
    if (r.delta !== null && r.tone !== null) {
      deltaLayers.push(numLayer(fmtDelta(r.delta), L.numPx, theme.tones[r.tone], L.deltaRight, cy, { enable: openAndFrom(b.hook, at) }));
    }
  });
  piece(L.table, 4, tag(drawtextSource(timeLayers, "times"), "times"));
  if (deltaLayers.length > 0) piece(L.table, 5, tag(drawtextSource(deltaLayers, "deltas"), "deltas"));

  // ── 6. the footer: the clock (always on), the verdict (the cold open and
  //      the finish), the stat line (static) ──
  piece(L.clockRect, 4, tag(clockSource(clockExpr(model.finalMs, b), L.clockPx, accent), "clock"));
  const verdictColor = model.pbFinalMs === null ? accent : model.isPb ? theme.tones.aheadGain : theme.tones.behindLose;
  const side = L.landscape ? "right" : "left";
  piece(L.verdictRect, 4, gated(tag(textCell({ text: L.verdict.text, fontSize: L.verdict.px, color: verdictColor, hAlign: side, bold: true, vAlign: "middle", label: "verdict" }), "verdict"), finale));
  if (L.stat) piece(L.statRect, 3, bindProp(tag(textCell({ text: L.stat.text, fontSize: L.stat.px, color: theme.dim, hAlign: side, vAlign: "middle", label: "stat" }), "stat"), "attempts"));

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
    editor: { label: `Speedrun PB Recap - ${model.game || "run"} - ${fmtTime(model.finalMs)} - ${rows.length} splits` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: recapContract(L), debug: props.debugLayout === true });
}
