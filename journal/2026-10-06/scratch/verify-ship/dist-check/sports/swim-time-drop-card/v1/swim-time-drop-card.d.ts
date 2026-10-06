import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/sports/swim-time-drop-card/v1` - one swimmer's meet as a card:
 * per event the entry time, the time swum, the drop in seconds, a bar and
 * the standard reached, from the rows a meet results file already holds.
 *
 * ONE CONCEPT: a bar says what it measures. The drop is always PRINTED in
 * seconds (the recaps' own unit), but a card mixes a 50 and a 200, and in
 * seconds the long event always wins. So the bar is one of two stated
 * things - the share of the entry time dropped (`bar: "percent"`) or the
 * seconds dropped (`bar: "seconds"`) - the longest bar fills the track, a
 * percent bar prints its own number at its end (a bar in percent beside a
 * drop in seconds is two units, and a footnote alone does not carry that),
 * and the footnote names which of the two the bars are.
 *
 * The rule that bites: a slower swim is printed, not drawn. It gets a plus
 * sign in the ordinary ink and an empty track - no red, no bar growing the
 * other way. NT and DQ rows make no claim at all and are not counted. All
 * arithmetic is integer hundredths of a second; nothing is a float until a
 * bar's pixel width.
 */
export type SwimCourse = "SCY" | "SCM" | "LCM";
export type SwimBar = "percent" | "seconds";
/** One swim, as a results row gives it. `standard` is the caller's: the template computes none. */
export type SwimRow = {
    /** The event as the club says it: "50 Free", "200 IM". */
    event: string;
    /** Entry (seed) time: "31.84", "1:10.52", "19:58.44"; "NT" or "" for no time. */
    entry?: string;
    /** The time swum, same formats; "DQ" for a disqualified swim. */
    final: string;
    /** The motivational standard the swim reached, up to 4 characters ("B", "BB", "AAAA"). */
    standard?: string;
};
export type SwimTimeDropCardProps = {
    /** The header name. */
    swimmer?: string;
    /** Second line; "" removes it. */
    club?: string;
    /** The meet's name; "" removes it. */
    meet?: string;
    /** Free line for the date, age group or session; "" removes it. */
    details?: string;
    /** The course chip: times in different courses do not compare. */
    course?: SwimCourse;
    /** The swims, in meet order: 1 to 8 rows. */
    swims?: SwimRow[];
    /** What a bar's length means - and the footnote with it. */
    bar?: SwimBar;
    /** Bars and chips, as #rrggbb (the club's colour). */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export declare const MAX_SWIMS = 8;
/** "31.84", "1:10.52", "19:58.44" -> integer hundredths of a second; null when it is not a time. */
export declare function parseSwimTime(text: string): number | null;
/** Hundredths back to the way a results sheet prints them: SS.hh under a minute, M:SS.hh above. */
export declare function formatSwimTime(cs: number): string;
/** drop = entry - final, with its sign: "-0.87" faster, "+0.42" slower, "0.00" equal. ASCII hyphen-minus. */
export declare function formatSwimDrop(dropCs: number): string;
/**
 * The share of the entry time dropped, to a tenth of a percent, rounded half
 * up in integers. A real drop too small to round to 0.1% says so: "0.0%"
 * beside a bar would read as no drop at all.
 */
export declare function formatSwimShare(dropCs: number, entryCs: number): string;
export type SwimLine = {
    event: string;
    /** Hundredths; null = no entry time (NT). */
    entryCs: number | null;
    /** Hundredths; null = DQ. */
    finalCs: number | null;
    entryText: string;
    finalText: string;
    /** entry - final in hundredths; null when either time is missing. */
    dropCs: number | null;
    /** "-0.87", "+0.42", "0.00", "first swim" for an NT entry, "" for a DQ. */
    dropText: string;
    standard: string;
    /** The bar as a share of its track, 0..1; 0 = no bar (slower, equal, NT, DQ). */
    share: number;
    /** The share of the entry time dropped ("2.7%") for a faster swim; "" otherwise. */
    shareText: string;
};
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeSwimCard(props: SwimTimeDropCardProps): {
    swimmer: string;
    club: string;
    meet: string;
    details: string;
    course: SwimCourse;
    bar: SwimBar;
    preset: "dark" | "light";
    accent: MosaicColor;
    debugLayout: boolean;
    lines: SwimLine[];
    faster: number;
    compared: number;
    totalCs: number;
    countText: string;
    totalText: string;
    scaleText: string;
    footnote: string;
};
export type SwimRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    prop: "swimmer" | "club" | "meet" | "details";
} | {
    row: number;
    field: "event" | "entry" | "final" | "standard";
} | null;
type Cell = {
    label: string;
    rect: SwimRect;
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
    rect: SwimRect;
    color: MosaicColor;
    radius: number;
    layer: number;
    accent?: boolean;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutSwimCard(props: SwimTimeDropCardProps, W: number, H: number): {
    p: {
        swimmer: string;
        club: string;
        meet: string;
        details: string;
        course: SwimCourse;
        bar: SwimBar;
        preset: "dark" | "light";
        accent: MosaicColor;
        debugLayout: boolean;
        lines: SwimLine[];
        faster: number;
        compared: number;
        totalCs: number;
        countText: string;
        totalText: string;
        scaleText: string;
        footnote: string;
    };
    theme: {
        readonly bg: "#0e1b25";
        readonly ink: "#eaf2f5";
        readonly dim: "#8ea3ae";
    } | {
        readonly bg: "#f5f9fa";
        readonly ink: "#10222c";
        readonly dim: "#55676f";
    };
    wide: boolean;
    cells: Cell[];
    tiles: Tile[];
    rows: {
        top: number;
        track: SwimRect;
        bar: SwimRect | null;
        chip: SwimRect | null;
        line: SwimLine;
        labelled: boolean;
    }[];
    m: number;
    floor: number;
    small: number;
    rowH: number;
    rowPx: number;
    eventPx: number;
    cap: number;
    headerBottom: number;
    bandTop: number;
    bandBottom: number;
    footLines: number;
    stacked: boolean;
};
export declare const SwimTimeDropCardV1: import("@m0saic/types").MosaicTemplate<SwimTimeDropCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default SwimTimeDropCardV1;
