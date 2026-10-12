/**
 * `@one-a-day/sports/climbing-send-pyramid/v1` - a climbing grade pyramid
 * from the rows a tick list already has: one centered bar per grade, width
 * the clean-send count, a cap for the flash or onsight share.
 *
 * ONE CONCEPT: center the bars. A left-aligned chart is the histogram the
 * Mountain Project thread already rejected. Width is sends / the widest
 * grade, so a normal list reads as a pyramid and a top-heavy list stays
 * top-heavy. The template does not sort grades and does not read a CSV.
 *
 * The rule that bites: flashes is a subset of sends, not a second total.
 * A cap wider than its bar, or a grade string sorted as text (5.10 before
 * 5.9), would lie. Grades stay in the order given, hardest first.
 */
export type ClimbDiscipline = "sport" | "boulder" | "trad";
export type GradeRow = {
    /** The grade as the log prints it: "5.12a", "V8", "7a+". */
    grade: string;
    /** Clean sends at this grade, including flash and onsight. */
    sends: number;
    /** How many of those sends were a flash or an onsight. */
    flashes?: number;
};
export type ClimbingSendPyramidProps = {
    climber?: string;
    /** Crag, season or gym. Empty removes the line. */
    place?: string;
    discipline?: ClimbDiscipline;
    /** 3 to 8 rows, hardest first. The template does not sort them. */
    grades?: GradeRow[];
    /** Send-bar ink, #rrggbb. */
    accent?: string;
    /** Flash/onsight cap ink, #rrggbb. */
    cap?: string;
    preset?: "dark" | "light";
    debugLayout?: boolean;
};
export declare const MIN_GRADES = 3;
export declare const MAX_GRADES = 8;
export declare const ClimbingSendPyramidV1: import("@m0saic/types").MosaicTemplate<ClimbingSendPyramidProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default ClimbingSendPyramidV1;
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    prop: string;
} | {
    row: number;
    field: "grade" | "sends" | "flashes";
};
export type PyramidCell = {
    label: string;
    text: string;
    px: number;
    color: string;
    align: "left" | "right" | "center";
    bold: boolean;
    rect: Rect;
    bind: Bind | null;
    width: number;
};
export type PyramidTile = {
    label: string;
    color: string;
    rect: Rect;
    radius: number;
    bind: "accent" | "cap" | null;
};
export type PyramidLayout = {
    theme: {
        bg: string;
        ink: string;
        dim: string;
        track: string;
    };
    accent: string;
    cap: string;
    total: number;
    maxSends: number;
    cells: PyramidCell[];
    tiles: PyramidTile[];
    bars: Array<{
        index: number;
        rect: Rect;
        cap: Rect | null;
        sends: number;
        flashes: number;
    }>;
};
/** The rows the card will draw, or a thrown error. Exported so the test locks the rules. */
export declare function normalizePyramid(props: ClimbingSendPyramidProps): {
    climber: string;
    place: string;
    discipline: ClimbDiscipline;
    grades: Array<{
        grade: string;
        sends: number;
        flashes: number;
    }>;
    accent: string;
    cap: string;
    preset: "dark" | "light";
};
/** Pure geometry. Bars are centered in one shared track; width is sends / max, with a 4px floor. */
export declare function layoutPyramid(props: ClimbingSendPyramidProps, W: number, H: number): PyramidLayout;
