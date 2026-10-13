import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/gaming/vatsim-monthly-log/v1` - a virtual-airline pilot's month
 * as one card: the pilot and the month up top, four computed stat tiles, the
 * month's PIREPs as an operations log table (date, flight, sector, type,
 * block, vertical speed, score), and a career-milestone bar under it.
 *
 * ONE CONCEPT: nothing is typed twice. Every number the wrap-up post carries
 * - flight count, month hours, the longest flight, the average touchdown -
 * is COMPUTED from the log rows, and the milestone bar from the rows plus
 * last month's career figure. The card cannot disagree with itself: the
 * "13 flights, 32.7 h" line nobody can be bothered to re-add by hand is the
 * one thing this template refuses to be given.
 *
 * The rule that bites: the grammar is the gate. A row is exactly seven
 * fields - "01 Sep | UA332 | KIAH-MMGL | A319 | 07:42 | -182 | 100" - and a
 * bad or missing field, a block past 15:59, or an eleventh row is refused BY
 * NAME at render, never clipped. All table cells (heads and rows) share one
 * size per canvas; sizes are fractions of the canvas with no pixel floor, so
 * a 480x270 render is a thumbnail of the 1920x1080 one, not a different card.
 */
export type VatsimLogRow = {
    day: number;
    mon: string;
    flight: string;
    dep: string;
    arr: string;
    type: string;
    hours: number;
    minutes: number;
    /** fpm at touchdown, or null when the row carries "--". */
    vs: number | null;
    /** PIREP score 0-100, or null when the row carries "--". */
    score: number | null;
};
export type VatsimMonthlyLogProps = {
    /** The pilot line: name and rating, free text. */
    pilot?: string;
    /** The virtual airline and pilot ID, under the pilot. "" removes it. */
    airline?: string;
    /** The month this log covers, free text ("September 2026"). */
    month?: string;
    /** The month's PIREPs, 1-10 lines "DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score". */
    rows?: string[];
    /** Career hours BEFORE this month - the milestone bar adds the month's computed hours to it. */
    careerHours?: number;
    /** The bottom line, a credit. "" removes it. */
    footer?: string;
    /** The month word, the head rule, the milestone fill and its caption. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** One PIREP line, "DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score". */
export declare function parseVatsimLogRow(raw: unknown, index: number): VatsimLogRow;
export type VatsimLog = ReturnType<typeof normalizeVatsimLog>;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeVatsimLog(props: VatsimMonthlyLogProps): {
    pilot: string;
    airline: string;
    month: string;
    footer: string;
    rows: VatsimLogRow[];
    monthUpper: string;
    flightsText: string;
    hoursText: string;
    longestText: string;
    longestSector: string;
    avgVsText: string;
    careerText: string;
    milestoneText: string;
    toGoText: string;
    fillFrac: number;
    /** Row cells, formatted exactly as the table draws them - the test compares against these. */
    cells: {
        date: string;
        flight: string;
        sector: string;
        type: string;
        block: string;
        vs: string;
        score: string;
    }[];
    careerHours: number;
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
export type VatsimRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    prop: string;
    row?: number;
} | "accent" | null;
type Cell = {
    label: string;
    rect: VatsimRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
};
type Tile = {
    label: string;
    rect: VatsimRect;
    color: MosaicColor;
    radius: number;
    bind: "accent" | null;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutVatsimLogCard(props: VatsimMonthlyLogProps, W: number, H: number): {
    p: {
        pilot: string;
        airline: string;
        month: string;
        footer: string;
        rows: VatsimLogRow[];
        monthUpper: string;
        flightsText: string;
        hoursText: string;
        longestText: string;
        longestSector: string;
        avgVsText: string;
        careerText: string;
        milestoneText: string;
        toGoText: string;
        fillFrac: number;
        /** Row cells, formatted exactly as the table draws them - the test compares against these. */
        cells: {
            date: string;
            flight: string;
            sector: string;
            type: string;
            block: string;
            vs: string;
            score: string;
        }[];
        careerHours: number;
        accent: MosaicColor;
        preset: "dark" | "light";
        debugLayout: boolean;
    };
    theme: {
        readonly bg: "#12181d";
        readonly row: "#1b242c";
        readonly ink: "#e9eef2";
        readonly dim: "#8fa0ad";
    } | {
        readonly bg: "#f3f1ea";
        readonly row: "#fffdf8";
        readonly ink: "#17202a";
        readonly dim: "#5f6b76";
    };
    ink: MosaicColor;
    dim: MosaicColor;
    m: number;
    CW: number;
    gap: number;
    floor: number;
    small: number;
    cells: Cell[];
    tiles: Tile[];
    ruleY: number;
    ruleH: number;
    tilesY: number;
    tileW: number;
    tileH: number;
    tableTop: number;
    headBandH: number;
    cellH: number;
    pitch: number;
    bandBottom: number;
    capTop: number;
    barY: number;
    msCapH: number;
    barH: number;
    fillW: number;
    colW: number[];
};
export declare const VatsimMonthlyLogV1: import("@m0saic/types").MosaicTemplate<VatsimMonthlyLogProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default VatsimMonthlyLogV1;
