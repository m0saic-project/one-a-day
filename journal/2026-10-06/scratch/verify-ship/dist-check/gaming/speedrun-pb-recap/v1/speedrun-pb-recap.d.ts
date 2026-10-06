import type { LayoutConstraint } from "@m0saic/template-utils";
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
export declare const RECAP_MIN_ROWS = 2;
/** Three drawtext layers a row at most - 16 rows stay well inside the ~60 a text source carries. */
export declare const RECAP_MAX_ROWS = 16;
export declare const RECAP_MIN_CLIP_SEC = 8;
export declare const RECAP_MAX_CLIP_SEC = 60;
/** A run of a game that does not exist: ten segments, four golds, a mistake at the Clocktower, PB by 12.34 s. */
export declare const DEFAULT_SEGMENTS: ReadonlyArray<Readonly<SegmentInput>>;
export type Tone = "gold" | "aheadGain" | "aheadLose" | "behindGain" | "behindLose";
/** A LiveSplit-style time to integer milliseconds; null for "no time" (empty, "-", null). */
export declare function parseTime(value: unknown, what: string): number | null;
/** LiveSplit's split look, hundredths truncated: "42.17", "1:01.73", "1:02:03.45". */
export declare function fmtTime(ms: number): string;
/** A delta: "-" is ahead, "+" is behind (LiveSplit's sign). */
export declare function fmtDelta(ms: number): string;
/** A time saved or lost, for prose: "12.34s" under a minute, "1:02.34" above. */
export declare function fmtSpan(ms: number): string;
/** 1284 -> "1,284" without locale tables, so every machine prints the same. */
export declare function thousands(n: number): string;
/** LiveSplit's subsplit marks off ("-Gatehouse", "{Act 1}Moth Queen"), ASCII only, never empty. */
export declare function cleanName(raw: unknown, index: number): string;
export type Seg = {
    name: string;
    split: number | null;
    pb: number | null;
    best: number | null;
};
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
export declare function analyzeRun(segs: Seg[]): Row[];
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
export declare function buildModel(meta: {
    game: string;
    category: string;
    runner: string;
    attempts: number;
}, segs: Seg[]): RecapModel;
export type LssRun = {
    game: string;
    category: string;
    attempts: number;
    segments: Seg[];
    pbAttempt: number | null;
    previousPbAttempt: number | null;
};
/**
 * Read a LiveSplit `.lss`: the header, the Personal Best, the golds, and the
 * previous PB - the best finished attempt before the PB attempt, its splits
 * rebuilt by summing that attempt's `SegmentHistory` times (a skipped split
 * has no entry; the next segment's entry carries both, so the sum holds).
 */
export declare function parseLss(xml: string, timing?: RecapTiming): LssRun;
export type Beats = {
    clip: number;
    hook: number;
    replay: number;
    end: number;
};
/** An eighth of the clip (at most 3 s) opens on the result, a quarter holds it at the end, the rest replays the run. */
export declare function beatsOf(clipSec: number): Beats;
/** When split `splitMs` lands in the clip: its share of the run, fast-forwarded into the replay. */
export declare function landAt(splitMs: number, finalMs: number, b: Beats): number;
/** Shown in the cold open and again from `at` on: ONE gate for two windows, so no `window` twin. */
export declare function openAndFrom(hook: number, at: number): string;
/**
 * The clock: ONE drawtext expression, evaluated per frame - the final time in
 * the cold open, the run's own time fast-forwarded through the replay, held on
 * the final time after. Inside `%{...}` drawtext wants `\:` and `\,`. The
 * +0.0005 keeps trunc() from printing .26 for a 1271.27 stored as 1271.2699.
 */
export declare function clockExpr(finalMs: number, b: Beats): string;
/** The graph's value per row, up = good: the delta's negative ("delta") or the time saved on the segment ("segments"). */
export declare function graphValues(rows: Row[], kind: RecapGraph): Array<number | null>;
export type RecapRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type RecapFit = {
    text: string;
    px: number;
    width: number;
};
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
/**
 * The whole geometry as a pure function of the run and the canvas: the header
 * (game and stamp, category and runner), the body (the table, and the graph
 * under it or - landscape - beside it), the footer (the clock, the verdict,
 * the stat line). The test asserts rects and fits without parsing m0.
 */
export declare function layoutRecap(model: RecapModel, graphKind: RecapGraph, W: number, H: number): RecapLayout;
/**
 * What the geometry promises. Every fitted text is measured (the drawtext
 * columns and the clock at their widest string, already widened for the
 * system font); the header lives in the top band, the clock in the bottom
 * half; the stripes (the rows child, flattened by the checker) are present.
 */
export declare function recapContract(L: RecapLayout): LayoutConstraint[];
export declare const SpeedrunPbRecapV1: import("@m0saic/types").MosaicTemplate<SpeedrunPbRecapProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default SpeedrunPbRecapV1;
