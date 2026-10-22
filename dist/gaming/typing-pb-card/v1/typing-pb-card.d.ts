import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/gaming/typing-pb-card/v1` - the personal-best share card a
 * Monkeytype user posts on a new PB, built from the result object's own
 * fields (wpm, raw, acc, consistency, mode, pb, chartData.wpm). One render
 * per result, from numbers typed in, never fetched.
 *
 * ONE CONCEPT: the PB is computed, never typed. The hero is the wpm; the
 * card derives whether it beats `pb` and by how much, and shows the NEW PB
 * badge and the "+N vs PB" line only when it does. Nobody hand-writes the
 * thing the whole post is about, so the card cannot disagree with itself.
 *
 * The rule that bites: raw wpm includes mistakes, net wpm does not, so
 * `raw` below `wpm` is impossible and the card refuses it by name - a
 * silently impossible number on a public card is worse than no card.
 */
export type TypingPbCardProps = {
    /** The typist's handle, drawn in capitals in the header. Monkeytype names are 1-16 characters. */
    handle?: string;
    /** Net wpm, the hero number (the result's `wpm`). */
    wpm?: number;
    /** Raw wpm including mistakes (the result's `rawWpm`), the RAW tile. Must be >= wpm. */
    raw?: number;
    /** Accuracy percent, the ACC tile (0-100, printed to one decimal). */
    acc?: number;
    /** Consistency (0-100, the result's `consistency`), the CONS tile. */
    consistency?: number;
    /** The mode line under the handle, e.g. "english - time 60". */
    mode?: string;
    /** The best wpm for this mode before this test. Drives the computed NEW PB badge and delta. */
    pb?: number;
    /** Per-second wpm, the result's chartData.wpm: 2-120 numbers (0-400), one bar each. */
    chart?: number[];
    /** The one accent, as #rrggbb: hero number, NEW PB badge, header rule, peak bar. */
    accent?: string;
    /** The bottom line; "" removes it and the space returns to the card. */
    footer?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** 102 -> "102", 102.37 -> "102.4": never more than one decimal, never a trailing zero. */
export declare function formatWpm(n: number): string;
/** The derived PB line: +3 vs PB / ties PB / 1 under PB - computed from wpm and pb, never typed. */
export declare function pbDelta(wpm: number, pb: number): {
    isNew: boolean;
    line: string;
};
/** The peak second of a chart: the first occurrence of the highest value, seconds 1-based. */
export declare function peakOf(chart: number[]): {
    value: number;
    second: number;
};
/** The chart list: 2-120 finite numbers, each 0-400, at least one above 0. Throws naming the entry. */
export declare function parseChart(value: unknown): number[];
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeTypingPbCard(props: TypingPbCardProps): {
    handle: string;
    wpmText: string;
    rawText: string;
    accText: string;
    consText: string;
    mode: string;
    delta: {
        isNew: boolean;
        line: string;
    };
    chart: number[];
    peak: {
        value: number;
        second: number;
    };
    peakText: string;
    accent: MosaicColor;
    heroInk: MosaicColor;
    footer: string;
    debugLayout: boolean;
};
export type TpcRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = "handle" | "wpm" | "raw" | "acc" | "consistency" | "mode" | "footer" | "accent" | null;
type Cell = {
    label: string;
    rect: TpcRect;
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
    rect: TpcRect;
    color: MosaicColor;
    radius: number;
    bind?: "accent";
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutTypingPbCard(props: TypingPbCardProps, W: number, H: number): {
    p: {
        handle: string;
        wpmText: string;
        rawText: string;
        accText: string;
        consText: string;
        mode: string;
        delta: {
            isNew: boolean;
            line: string;
        };
        chart: number[];
        peak: {
            value: number;
            second: number;
        };
        peakText: string;
        accent: MosaicColor;
        heroInk: MosaicColor;
        footer: string;
        debugLayout: boolean;
    };
    shape: "square" | "wide" | "tall";
    floor: number;
    cells: Cell[];
    tiles: Tile[];
    headRect: TpcRect;
    heroRect: TpcRect;
    chartRect: TpcRect;
    tilesRect: TpcRect;
    wpmPx: number;
    handlePx: number;
    badgeShown: boolean;
    barCount: number;
};
export declare const TypingPbCardV1: import("@m0saic/types").MosaicTemplate<TypingPbCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default TypingPbCardV1;
