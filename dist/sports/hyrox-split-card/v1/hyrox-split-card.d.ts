import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/sports/hyrox-split-card/v1` - one race as the workout summary
 * athletes already have: finish time as the hero, division rank beside it,
 * eight run-plus-station pairs as a tape, then roxzone, run total and best
 * lap as entered.
 *
 * ONE CONCEPT: the finish is the number a screenshot buries, and the body
 * is a named-station race tape, not another time list. Eight rows, fixed
 * order, one shared scale: the slowest pair fills the track, every other
 * pair is shorter in proportion, and within a pair the run and the station
 * split that length by their times.
 *
 * The rule that bites: the card computes no claim it cannot verify. Bars
 * come only from the sixteen split times. Roxzone, run total and best lap
 * are printed as entered. A short bar does not own its label - the station
 * name stays in its own column. No wordmark, no logo, no yellow lockup.
 */
export type HyroxSplit = {
    run: string;
    station: string;
    place?: number;
};
export type HyroxSplitCardProps = {
    /** Header name. Up to 32 characters; accented Latin letters are drawn. "" hides it. */
    athlete?: string;
    /** Second header line. Up to 40 characters. "" hides it. */
    race?: string;
    /** Third header line; the age group lives here. Up to 32 characters. "" hides it. */
    division?: string;
    /** The hero figure, compact time: "1:11:40" or "71:40". A decimal fails fast. */
    finish?: string;
    /** Division rank. Integer 0-99999; 0 hides the chip. */
    rank?: number;
    /** Eight pairs in race order. place is the station's division place; 0 or omitted hides it. */
    splits?: HyroxSplit[];
    /** Footer cell, as entered. Not checked against the splits. */
    roxzone?: string;
    /** Footer cell, as entered. Not recomputed from the runs. */
    runTotal?: string;
    /** Footer cell, as entered. Not checked against the runs. */
    bestLap?: string;
    /** Station bars and the rank chip, as #rrggbb. Clay, not brand yellow. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/**
 * Variant knob, not a prop. "shared" is the brief (pair length is the split).
 * "row" fills every track and splits it by the two times. SLOWEST_RULE keeps
 * the accent on the slowest station only and draws a thin rule on that row.
 */
export declare const TAPE: "shared" | "row";
export declare const SLOWEST_RULE = false;
/** Baked station names, race order. Full names live in WHY, not on the row. */
export declare const STATIONS: readonly ["Ski", "Push", "Pull", "Burpee", "Row", "Carry", "Lunge", "Balls"];
export declare const DEFAULT_SPLITS: HyroxSplit[];
/**
 * "m:ss" or "h:mm:ss" to whole seconds. Minutes may pass 59 in the one-colon
 * form. Seconds (and minutes in the two-colon form) are 0-59. A decimal is
 * refused, not rounded. null when the string is not that grammar.
 */
export declare function parseRaceTime(text: string): number | null;
/** Compact, no leading zeros. Hours only when the value is at least one hour. */
export declare function formatRaceTime(sec: number): string;
export type HyroxRow = {
    index: number;
    station: string;
    run: string;
    stationTime: string;
    runSec: number;
    stationSec: number;
    place: number;
};
export type NormalizedHyroxCard = {
    athlete: string;
    race: string;
    division: string;
    finish: string;
    finishSec: number;
    rank: number;
    rankText: string;
    rows: HyroxRow[];
    maxPair: number;
    slowest: number;
    roxzone: string;
    runTotal: string;
    bestLap: string;
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeHyroxCard(props: HyroxSplitCardProps): NormalizedHyroxCard;
export type HyroxRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    kind: "prop";
    key: string;
} | {
    kind: "path";
    path: (string | number)[];
    valueKind: "string" | "number";
} | null;
type Cell = {
    label: string;
    rect: HyroxRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
    over: boolean;
};
type Tile = {
    label: string;
    rect: HyroxRect;
    color: MosaicColor;
    radius: number;
    layer: number;
    accent?: boolean;
};
/** Pair length on the track, in pixels. Shared scale, or a full track split by the two times. */
export declare function tapeWidths(trackW: number, runSec: number, stationSec: number, maxPair: number, mode?: "shared" | "row"): {
    runW: number;
    stationW: number;
    filled: number;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutHyroxCard(props: HyroxSplitCardProps, W: number, H: number): {
    p: NormalizedHyroxCard;
    theme: {
        readonly bg: "#14110f";
        readonly ink: "#f4efe8";
        readonly dim: "#9a8f84";
    } | {
        readonly bg: "#f6f3ee";
        readonly ink: "#1c1612";
        readonly dim: "#6f655c";
    };
    cells: Cell[];
    tiles: Tile[];
    bands: HyroxRect[];
    m: number;
    floor: number;
    small: number;
    heroPx: number;
    rowPx: number;
    barH: number;
    tape: {
        x: number;
        w: number;
    };
    rowH: number;
    rowsTop: number;
    rowsEnd: number;
    footTop: number;
    headerLimit: number;
};
export declare const HyroxSplitCardV1: import("@m0saic/types").MosaicTemplate<HyroxSplitCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default HyroxSplitCardV1;
