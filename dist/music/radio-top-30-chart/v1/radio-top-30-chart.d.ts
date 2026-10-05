import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/music/radio-top-30-chart/v1` - a radio station's weekly chart
 * as one card: the station, a computed `TOP 30`, the week, and every row as
 * rank / artist / title / label, from the lines a music director already
 * types (`Artist | Title | Label | last week`).
 *
 * ONE CONCEPT: the fit rule is the template. A row is two lines (the artist,
 * bold; then the title with the label after it in dimmer ink), every row cell
 * is the same size, and thirty rows share one artist size and one title size
 * so the columns read as columns. Long copy goes down a ladder, in this
 * order:
 *   1. the shared sizes come down together, by at most 15%, for every line
 *      that can be fitted inside that allowance;
 *   2. a line that needs more shrinks ALONE, to no less than half its cap,
 *      and costs the other rows nothing;
 *   3. past that the render refuses, naming the row and the canvas. No
 *      ellipsis, no clipping, no dropped label.
 * The grid follows the aspect: up to 10 rows a column on a wide canvas
 * (3 x 10), up to 15 on a square or portrait one (2 x 15); ranks read down a
 * column, then the next.
 *
 * The rule that bites: nothing here is typed twice. The rank is the position
 * in the list, the count in the title is the number of rows, and the marker
 * under a rank is last week's rank minus this week's (`+3`, `-2`, `=`, `NEW`,
 * `RE`), as text: the bundled font has no arrows, and up is the accent, down
 * is dim ink, never red or green. Sizes are fractions of the canvas with no
 * pixel floor, so a 480x270 render is a thumbnail of the 1920x1080 one, not a
 * different card.
 */
export type RadioTop30ChartProps = {
    /** The header mark: call sign and frequency, free text. */
    station?: string;
    /** The line under the station. "" removes it. */
    weekOf?: string;
    /** Prefix of the chart title: "Loud Rock" gives LOUD ROCK TOP 10. "" gives TOP 30. */
    genre?: string;
    /** The chart, in rank order: 1-30 lines of "Artist | Title | Label" or "Artist | Title | Label | LW". */
    rows?: string[];
    /** The bottom line: a URL, a credit. "" removes the line. */
    footer?: string;
    /** Rank numerals, the chart title, up / NEW / RE markers, as #rrggbb. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Rank 1 as a full-width lead row above the grid. */
    lead?: boolean;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export type RadioChartMove = "up" | "down" | "same" | "new" | "re";
export type RadioChartRow = {
    rank: number;
    artist: string;
    title: string;
    label: string;
    /** "+3", "-2", "=", "NEW", "RE"; "" when the line has no last-week field. */
    marker: string;
    move: RadioChartMove | null;
};
/** One chart line, "Artist | Title | Label" or "Artist | Title | Label | LW", at list position `index` (rank index + 1). */
export declare function parseRadioChartRow(raw: unknown, index: number): RadioChartRow;
export type RadioChart = ReturnType<typeof normalizeRadioChart>;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeRadioChart(props: RadioTop30ChartProps): {
    station: string;
    weekOf: string;
    genre: string;
    footer: string;
    rows: RadioChartRow[];
    /** Computed from the rows, never typed, so the title cannot contradict the list. */
    chartTitle: string;
    hasMarkers: boolean;
    accent: MosaicColor;
    preset: "dark" | "light";
    lead: boolean;
    debugLayout: boolean;
};
/** The shared sizes may come down by this much for the lines that can be caught; a line that needs more shrinks alone. */
export declare const RADIO_CHART_SHARED_FLOOR = 0.85;
/** A line alone goes no lower than this fraction of its cap; past it the render refuses. */
export declare const RADIO_CHART_ALONE_FLOOR = 0.5;
export type RadioChartRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = "station" | "weekOf" | "footer" | "genre" | null;
type Cell = {
    label: string;
    rect: RadioChartRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
    row: number | null;
};
type Tile = {
    label: string;
    rect: RadioChartRect;
    color: MosaicColor;
    accent?: boolean;
};
export type RadioChartRowLayout = {
    row: RadioChartRow;
    /** Its cell: `row-<i>` in the grid, `lead` for the lead row. */
    tile: RadioChartRect;
    lead: boolean;
    /** Grid column and position in it; -1 for the lead row. */
    column: number;
    slot: number;
    artistPx: number;
    titlePx: number;
    /** True when that line could not be caught by the shared size and shrank alone. */
    artistAlone: boolean;
    titleAlone: boolean;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutRadioChart(props: RadioTop30ChartProps, W: number, H: number): {
    p: {
        station: string;
        weekOf: string;
        genre: string;
        footer: string;
        rows: RadioChartRow[];
        /** Computed from the rows, never typed, so the title cannot contradict the list. */
        chartTitle: string;
        hasMarkers: boolean;
        accent: MosaicColor;
        preset: "dark" | "light";
        lead: boolean;
        debugLayout: boolean;
    };
    theme: {
        readonly bg: "#131117";
        readonly row: "#1e1b25";
        readonly ink: "#f4f2f6";
        readonly dim: "#a09bab";
    } | {
        readonly bg: "#f1eee7";
        readonly row: "#fffdf9";
        readonly ink: "#18151c";
        readonly dim: "#6b6674";
    };
    wide: boolean;
    cells: Cell[];
    tiles: Tile[];
    rows: RadioChartRowLayout[];
    m: number;
    columns: number;
    perColumn: number;
    pitch: number;
    colW: number;
    gutter: number;
    bandTop: number;
    bandBottom: number;
    gridTop: number;
    shared: number;
    artistShared: number;
    titleShared: number;
    artistCap: number;
    titleCap: number;
    rankW: number;
};
export declare const RadioTop30ChartV1: import("@m0saic/types").MosaicTemplate<RadioTop30ChartProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default RadioTop30ChartV1;
