import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/personal/reading-goal-recap/v1` - the monthly reading wrap-up
 * as one card: the month's books, pages and average rating as three stat
 * tiles, then the year's reading-challenge goal as a progress bar with the
 * pace tick drawn across it and the ahead/behind line nobody has to compute
 * by hand, and the month's shelf of titles with their ratings.
 *
 * ONE CONCEPT: the derived number is the point. Every wrap-up post carries
 * the same hand-computed line - "16 books behind schedule (88/125)" - so the
 * card never asks for it: give the goal, the books so far and the day of the
 * year, and the bar fill, the pace tick (goal x dayOfYear / 365) and the
 * delta line are computed, not typed. The card cannot disagree with itself.
 *
 * The rule that bites: dayOfYear is a PROP, not a clock. The pace tick's x
 * is pace/goalTotal of the bar's full width at every canvas, so a template
 * that reads a wall clock would render two different cards from the same
 * inputs (and fail determinism). Ratings are halves only (4.5, never 4.7),
 * a long title is refused by name instead of clipping, and every line is
 * fitted to its cell's budget (cell * 0.94 - 2px) below the floor.
 */
export type ReadingShelfEntry = {
    title: string;
    rating: number;
};
export type ReadingGoalRecapProps = {
    /** The month line, e.g. "October 2026" - the header's first line. */
    month?: string;
    /** The reader's handle or name, under the month. "" removes it. */
    reader?: string;
    /** Books finished this month. */
    books?: number;
    /** Pages read this month. */
    pages?: number;
    /** The month's average rating, 0 to 5. */
    avgRating?: number;
    /** The year's reading-challenge goal, in books. */
    goalTotal?: number;
    /** Books finished so far this year - may pass the goal; the bar clamps and the delta tells. */
    booksSoFar?: number;
    /** The day of the year the card is for, 1 to 366 - drives the pace tick (pace = goalTotal x dayOfYear / 365). A prop, not a clock. */
    dayOfYear?: number;
    /** The month's shelf: up to 12 { title, rating } entries, ratings in half steps; the first 6 render. */
    titles?: ReadingShelfEntry[];
    /** The bar fill and the delta when ahead, as #rrggbb. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** Thousands separators, deterministic (no locale): 4703 -> "4,703". */
export declare function fmtInt(n: number): string;
/** A rating the way wrap-ups print it: 5, 4.5, 4 - never 4.50. */
export declare function fmtRating(r: number): string;
/** The wrap-up's pace line, from goal, count and day: the number people compute by hand. */
export declare function readingPace(goalTotal: number, booksSoFar: number, dayOfYear: number): {
    pace: number;
    delta: number;
    deltaText: string;
};
export type ReadingCard = ReturnType<typeof normalizeReadingCard>;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeReadingCard(props: ReadingGoalRecapProps): {
    month: string;
    reader: string;
    books: number;
    pages: number;
    avgRating: number;
    goalTotal: number;
    booksSoFar: number;
    dayOfYear: number;
    titles: {
        title: string;
        rating: number;
    }[];
    progress: number;
    fillFrac: number;
    pace: number;
    paceFrac: number;
    deltaText: string;
    pctText: string;
    overGoal: boolean;
    booksText: string;
    pagesText: string;
    avgText: string;
    goalText: string;
    dayText: string;
    footnote: string;
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
export type ReadingRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    prop: string;
    key?: number;
} | "accent" | null;
type Cell = {
    label: string;
    rect: ReadingRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
    field?: string;
};
type Tile = {
    label: string;
    rect: ReadingRect;
    color: MosaicColor;
    radius: number;
    bind: "accent" | null;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutReadingCard(props: ReadingGoalRecapProps, W: number, H: number): {
    p: {
        month: string;
        reader: string;
        books: number;
        pages: number;
        avgRating: number;
        goalTotal: number;
        booksSoFar: number;
        dayOfYear: number;
        titles: {
            title: string;
            rating: number;
        }[];
        progress: number;
        fillFrac: number;
        pace: number;
        paceFrac: number;
        deltaText: string;
        pctText: string;
        overGoal: boolean;
        booksText: string;
        pagesText: string;
        avgText: string;
        goalText: string;
        dayText: string;
        footnote: string;
        accent: MosaicColor;
        preset: "dark" | "light";
        debugLayout: boolean;
    };
    theme: {
        readonly bg: "#171512";
        readonly ink: "#efe9dc";
        readonly dim: "#a89f8c";
    } | {
        readonly bg: "#f6f1e6";
        readonly ink: "#221d14";
        readonly dim: "#6b6252";
    };
    m: number;
    CW: number;
    gap: number;
    floor: number;
    small: number;
    cells: Cell[];
    tiles: Tile[];
    barRect: ReadingRect;
    fillW: number;
    tickX: number;
    headerBottom: number;
    footerTop: number;
    tilesY: number;
    tileW: number;
    tileH: number;
    slack: number;
};
export declare const ReadingGoalRecapV1: import("@m0saic/types").MosaicTemplate<ReadingGoalRecapProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default ReadingGoalRecapV1;
