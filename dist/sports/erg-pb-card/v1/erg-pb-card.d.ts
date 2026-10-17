import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/sports/erg-pb-card/v1` - one indoor rower's piece as a share
 * card: the /500m split as the hero figure on a fixed 1:00-3:00 pace track,
 * the piece's time or metres second, stroke rate, watts and drag as cells,
 * and the season-ranking percentile as a chip - from PM5/Logbook numbers
 * every rower already has.
 *
 * ONE CONCEPT: the split is the hero. /500m pace is the unit the community
 * compares in - a "5k 18:42,2" is read as 1:52.4 - so the card's hierarchy
 * is the forum's own: split biggest, the piece's result second, the PM5's
 * supporting numbers as cells, the percentile as a chip the rower supplies.
 *
 * The rule that bites: the template computes no claim it cannot verify. No
 * PB badge, no invented percentile (the ranking moves with season, age and
 * weight class), no cross-check between watts and split - the PM5 is
 * authoritative, every figure is entered, and the pace track is a FIXED
 * scale that claims nothing about ranking (the chip does that). A split
 * outside 1:00-3:00 clamps the MARKER to the track's end; the printed split
 * is always the truth.
 */
export type ErgPbCardProps = {
    /** The rower's name, the header's bold line. Up to 40 characters; accented Latin letters are drawn. */
    rower?: string;
    /** Second header line ("the 2026 season's median 2k"); "" removes it. Up to 48 characters. */
    note?: string;
    /** The split as the PM5 prints it, "m:ss.t" from 1:00.0 to 9:59.9 (e.g. "1:58.8"). The hero figure AND the marker position. */
    split?: string;
    /** The piece's result - a time ("7:55.0", "3:36:47") or metres ("7,096 m"); "" removes the figure and its caption. Up to 14 characters. */
    result?: string;
    /** The caption under the result ("2,000 m", "marathon"); "" removes it. Up to 16 characters. */
    piece?: string;
    /** Stroke rate; 10-60, or 0 to hide the cell. */
    spm?: number;
    /** Watts; 20-600, or 0 to hide the cell. */
    watts?: number;
    /** Drag factor; 50-250, or 0 to hide the cell. */
    drag?: number;
    /** The season-ranking percentile the rower supplies, 1-99; 0 hides the chip and its cohort line. */
    percentile?: number;
    /** The dim line under the chip ("2026 rower ranking"); "" hides it. Up to 40 characters. */
    percentileCohort?: string;
    /** The marker, the chip and the rules, as #rrggbb. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export declare const TITLE = "Erg PB Card";
/** The pace track's fixed scale, in tenths of a second per 500m: 1:00 to 3:00. */
export declare const PACE_MIN_TENTHS = 600;
export declare const PACE_MAX_TENTHS = 1800;
/** The five ticks, labeled, at equal quarters of the track. */
export declare const PACE_TICKS: readonly ["1:00", "1:30", "2:00", "2:30", "3:00"];
/** "1:58.8" -> 1188 tenths of a second; null when it is not a split the PM5 prints. */
export declare function parseErgSplit(text: string): number | null;
/**
 * The marker's place on the 1:00-3:00 track, 0..1. A split at or under 1:00
 * pins the marker at the start, at or over 3:00 at the end - the MARKER
 * clamps, the printed split never changes.
 */
export declare function ergMarkerFrac(tenths: number): number;
/** 1 -> "1ST", 2 -> "2ND", 3 -> "3RD", 4 -> "4TH", 11 -> "11TH", 50 -> "50TH". */
export declare function ergOrdinal(n: number): string;
export type ErgStat = {
    key: "spm" | "watts" | "drag";
    label: string;
    value: number;
};
export type NormalizedErgCard = {
    rower: string;
    note: string;
    piece: string;
    splitText: string;
    /** Tenths of a second; the parse is exact integer math. */
    splitTenths: number;
    /** The marker's place on the track, 0..1, clamped for out-of-track splits. */
    markerFrac: number;
    /** True when the split sits outside 1:00-3:00 and the marker clamped. */
    clamped: boolean;
    result: string;
    percentile: number;
    chipText: string;
    percentileCohort: string;
    stats: ErgStat[];
    footnote: string;
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeErgCard(props: ErgPbCardProps): NormalizedErgCard;
export type ErgRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = "rower" | "note" | "piece" | "split" | "result" | "spm" | "watts" | "drag" | "percentile" | "percentileCohort" | null;
type Cell = {
    label: string;
    rect: ErgRect;
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
    rect: ErgRect;
    color: MosaicColor;
    radius: number;
    layer: number;
    accent?: boolean;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutErgCard(props: ErgPbCardProps, W: number, H: number): {
    p: NormalizedErgCard;
    theme: {
        readonly bg: "#0c1a24";
        readonly ink: "#eaf3f7";
        readonly dim: "#7f95a1";
    } | {
        readonly bg: "#f4f8fa";
        readonly ink: "#0f2230";
        readonly dim: "#4f6270";
    };
    wide: boolean;
    cells: Cell[];
    tiles: Tile[];
    m: number;
    floor: number;
    small: number;
    bandTop: {
        hero: number;
        result: number;
        track: number;
        stats: number;
    };
    footBandTop: number;
    footLines: number;
    heroK: number;
    splitPx: number;
    resultPx: number;
    namePx: number;
    markerRect: ErgRect;
    track: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
};
export declare const ErgPbCardV1: import("@m0saic/types").MosaicTemplate<ErgPbCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default ErgPbCardV1;
