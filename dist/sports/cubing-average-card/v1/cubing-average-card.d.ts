import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/sports/cubing-average-card/v1` - one speedcubing average as a
 * card: the solves as bars, the dropped best and worst in parentheses with a
 * hollow bar, the average as the headline, and the delta against the old PB.
 *
 * ONE CONCEPT: the headline is COMPUTED, and the dropped solves stay on the
 * card. The user gives the solves; the count decides the kind (3 is a Mo3, 5
 * an Ao5, 12 an Ao12), so a "Mo3" label over five solves cannot happen. The
 * best and the worst are dropped (Ao5, Ao12), printed in parentheses and
 * drawn hollow; the average is the mean of what is left. Each bar says what
 * the footnote says: its distance from the average (`bar: "spread"`, the
 * default: left = faster, who carried the average and who dragged it) or its
 * length from zero (`bar: "length"`, the slowest fills the track, where a
 * 24-32 second session draws five near-identical bars).
 *
 * The rule that bites: all arithmetic is integer hundredths of a second. The
 * average is rounded to the nearest hundredth with halves going UP, as
 * floor((2 * sum + n) / (2 * n)); a float sum prints 28.34 for a 28.345
 * average. (This is the rounding the template chose; it does not cite a
 * regulation.) A DNF is always the worst solve; the average is DNF when a
 * DNF is still among the counting solves (two DNFs in an Ao5 or Ao12, one in
 * a Mo3). A slower average is printed with a plus sign in the ordinary ink:
 * no warning colour, no chip.
 */
export type CubingBar = "length" | "spread";
export type CubingAverageCardProps = {
    /** The event next to the kind chip: "3x3", "OH", "3BLD". "" removes it. */
    event?: string;
    /** The solves in the order they were made: 3 (Mo3), 5 (Ao5) or 12 (Ao12) strings. */
    solves?: string[];
    /** The previous PB for the same kind of average, as a time; "" or "DNF" means none. */
    previousPb?: string;
    /** The handle or name under the event. "" removes it. */
    cuber?: string;
    /** A free line next to the name. "" removes it. */
    date?: string;
    /** What a bar means: its length from zero, or its distance from the average. */
    bar?: CubingBar;
    /** A thin tick at the average in every track (`bar: "length"` only). */
    avgLine?: boolean;
    /** Counting bars, chips and the headline, as #rrggbb. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** "27.84", "1:02.45" -> integer hundredths; null when it is not a time (or is zero). */
export declare function parseCubingTime(text: string): number | null;
/** Hundredths back to the way a scoresheet prints them: SS.hh under a minute, M:SS.hh above. */
export declare function formatCubingTime(cs: number): string;
export type ParsedSolve = {
    cs: number | null;
    plus: boolean;
};
/** One solve as csTimer prints it: "27.84", "29.50+", "DNF", "DNF(15.20)" (read as DNF). null when it is none of these. */
export declare function parseSolve(text: string): ParsedSolve | null;
/** delta = average - previous PB, with its sign: "-0.55" faster, "+0.31" slower, "0.00" equal. ASCII hyphen-minus. */
export declare function formatCubingDelta(deltaCs: number): string;
export type CubingKind = "Mo3" | "Ao5" | "Ao12";
export type CubingSolve = {
    index: number;
    cs: number | null;
    plus: boolean;
    drop: "best" | "worst" | null;
    /** The time cell: "27.84", "29.50+", "DNF", and in parentheses when dropped. */
    text: string;
    /** What follows the last digit in `text` ("+", ")", "+)"): the cell hangs it past the column's digit edge. */
    suffix: string;
};
export type CubingResult = {
    n: number;
    kind: CubingKind;
    solves: CubingSolve[];
    avgCs: number | null;
    counting: number;
};
/**
 * The drop rule and the average, from solve strings. Ao5 and Ao12 drop the
 * best (first of equal fastest) and the worst (last of equal slowest; a DNF
 * is always the worst, the last DNF if there are several), so the two are
 * always different solves. A Mo3 drops nothing. The average is the sum of
 * the counting solves over their count, to the nearest hundredth, halves up,
 * in integers; DNF when a DNF still counts.
 */
export declare function cubingAverage(raw: readonly string[]): CubingResult;
export type CubingBarKind = "length" | "spread";
export type CubingCard = ReturnType<typeof normalizeCubingCard>;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeCubingCard(props: CubingAverageCardProps): {
    event: string;
    cuber: string;
    date: string;
    kind: CubingKind;
    chip: string;
    headline: string;
    avg: number | null;
    pbCs: number | null;
    pbText: string;
    newPb: boolean;
    deltaText: string;
    lines: {
        share: number;
        side: 0 | 1 | -1;
        index: number;
        cs: number | null;
        plus: boolean;
        drop: "best" | "worst" | null;
        /** The time cell: "27.84", "29.50+", "DNF", and in parentheses when dropped. */
        text: string;
        /** What follows the last digit in `text` ("+", ")", "+)"): the cell hangs it past the column's digit edge. */
        suffix: string;
    }[];
    tick: number | null;
    maxCs: number;
    barKind: CubingBarKind;
    footnote: string;
    bar: CubingBar;
    avgLine: boolean;
    preset: "dark" | "light";
    accent: MosaicColor;
    debugLayout: boolean;
    counting: number;
};
export type CubingRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = "event" | "cuber" | "date" | "previousPb" | null;
type Cell = {
    label: string;
    rect: CubingRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
    solve: number | null;
    over: boolean;
};
type Tile = {
    label: string;
    rect: CubingRect;
    color: MosaicColor;
    radius: number;
    layer: number;
    accent?: boolean;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutCubingCard(props: CubingAverageCardProps, W: number, H: number): {
    p: {
        event: string;
        cuber: string;
        date: string;
        kind: CubingKind;
        chip: string;
        headline: string;
        avg: number | null;
        pbCs: number | null;
        pbText: string;
        newPb: boolean;
        deltaText: string;
        lines: {
            share: number;
            side: 0 | 1 | -1;
            index: number;
            cs: number | null;
            plus: boolean;
            drop: "best" | "worst" | null;
            /** The time cell: "27.84", "29.50+", "DNF", and in parentheses when dropped. */
            text: string;
            /** What follows the last digit in `text` ("+", ")", "+)"): the cell hangs it past the column's digit edge. */
            suffix: string;
        }[];
        tick: number | null;
        maxCs: number;
        barKind: CubingBarKind;
        footnote: string;
        bar: CubingBar;
        avgLine: boolean;
        preset: "dark" | "light";
        accent: MosaicColor;
        debugLayout: boolean;
        counting: number;
    };
    theme: {
        readonly bg: "#10151c";
        readonly ink: "#eef1f5";
        readonly dim: "#8f9aa8";
    } | {
        readonly bg: "#f6f4ef";
        readonly ink: "#161b22";
        readonly dim: "#5d6672";
    };
    wide: boolean;
    cells: Cell[];
    tiles: Tile[];
    rows: {
        top: number;
        track: CubingRect;
        bar: CubingRect | null;
        hole: CubingRect | null;
        centre: CubingRect | null;
        tick: CubingRect | null;
        line: {
            share: number;
            side: 0 | 1 | -1;
            index: number;
            cs: number | null;
            plus: boolean;
            drop: "best" | "worst" | null;
            /** The time cell: "27.84", "29.50+", "DNF", and in parentheses when dropped. */
            text: string;
            /** What follows the last digit in `text` ("+", ")", "+)"): the cell hangs it past the column's digit edge. */
            suffix: string;
        };
    }[];
    m: number;
    floor: number;
    small: number;
    rowH: number;
    rowPx: number;
    cap: number;
    headerBottom: number;
    bandTop: number;
    bandBottom: number;
    footLines: number;
    R: number;
    hang: number;
    trackColor: MosaicColor;
};
export declare const CubingAverageCardV1: import("@m0saic/types").MosaicTemplate<CubingAverageCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default CubingAverageCardV1;
