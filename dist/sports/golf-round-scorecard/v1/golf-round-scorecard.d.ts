import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/sports/golf-round-scorecard/v1` - one golf round as the card
 * golfers already know: two nine-hole strips of hole / par / score rows with
 * OUT and IN columns, a totals band, and the paper scorecard's own marks
 * drawn around each score - a ring one under par, a square one over, doubles
 * for two or more either way, a filled ring for an ace.
 *
 * ONE CONCEPT: the notation is the community's own. Nobody teaches a golfer
 * circles and squares; the card draws what their pencil would, so the
 * numbers stay the star and the marks carry the story. Shape alone carries
 * the meaning - no traffic-light colours - and the card reads exactly like
 * the paper it replaces.
 *
 * The rule that bites: the mark must enclose its number at every canvas. A
 * two-digit score needs its ring around BOTH digits, and a double mark needs
 * a second one outside it, so the score size is fitted to the ring's budget
 * (the smaller of column and row, times 0.96, times 0.94 less 2px inside
 * that) - never to the cell alone - and the fit refuses below the floor
 * instead of clipping a digit. The hole columns are equal by construction
 * and promised equal by relation; the two strips are one height; and every
 * total on the card (OUT, IN, TOTAL, the to-par line, the marks themselves)
 * is computed from pars and scores, so the card cannot disagree with itself.
 */
export type GolfMark = "none" | "ring" | "ring2" | "square" | "square2" | "ace";
export type GolfRoundScorecardProps = {
    /** The course name, the header's first line. "" removes nothing - it is required copy; use a space to blank it. */
    course?: string;
    /** The tees and rating/slope line under the course. "" removes the line. */
    tees?: string;
    /** The golfer, bottom-left of the header. "" removes it. */
    golfer?: string;
    /** A free line bottom-right of the header: the date, a season, a thread. "" removes it. */
    date?: string;
    /** The hole pars off the card: 9 or 18 integers, 3 to 6 each. */
    pars?: number[];
    /** The strokes per hole: 9 or 18 integers, 1 to 99, the same count as pars. */
    scores?: number[];
    /** The round total, an under-par total and the ace mark, as #rrggbb. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** The paper scorecard's mark for one hole: a ring under par, a square over, doubles for two or more, a filled ring for an ace. */
export declare function golfMarkOf(par: number, score: number): GolfMark;
export type GolfHole = {
    hole: number;
    par: number;
    score: number;
    mark: GolfMark;
};
export type GolfNine = {
    name: "OUT" | "IN";
    par: number;
    score: number;
    toPar: number;
    holes: GolfHole[];
};
/** +6 / E / -3, the way a scorecard prints a to-par. ASCII hyphen-minus. */
export declare function golfSigned(n: number): string;
export type GolfCard = ReturnType<typeof normalizeGolfCard>;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeGolfCard(props: GolfRoundScorecardProps): {
    course: string;
    tees: string;
    golfer: string;
    date: string;
    holes: GolfHole[];
    nines: GolfNine[];
    total: number;
    parTotal: number;
    toPar: number;
    nineLine: string;
    vsText: string;
    footnote: string;
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
/**
 * The path for one mark, authored in a `side` x `side` square at (0,0) - the
 * mark rect's own pixel space, so the mask scales 1:1 and stays crisp. A
 * single ring is an annulus, a double a second annulus outside... inside it:
 * the outer ring hugs the mark rect, the inner ring sits within, both drawn
 * by alternating winding. An ace is one filled disc.
 */
export declare function golfMarkPath(kind: GolfMark, side: number): string;
export type GolfRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = "course" | "tees" | "golfer" | "date" | "accent" | null;
type Cell = {
    label: string;
    rect: GolfRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
    hole: number | null;
    over: boolean;
    field?: string;
};
type MarkTile = {
    label: string;
    rect: GolfRect;
    kind: GolfMark;
    color: MosaicColor;
    inkOver: MosaicColor | null;
};
type Tile = {
    label: string;
    rect: GolfRect;
    color: MosaicColor;
    radius: number;
};
export type GolfStrip = {
    nine: GolfNine;
    rect: GolfRect;
    rowY: number[];
    rowH: number[];
    gutterW: number;
    colX: number[];
    colW: number;
    outW: number;
    outX: number;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutGolfCard(props: GolfRoundScorecardProps, W: number, H: number): {
    p: {
        course: string;
        tees: string;
        golfer: string;
        date: string;
        holes: GolfHole[];
        nines: GolfNine[];
        total: number;
        parTotal: number;
        toPar: number;
        nineLine: string;
        vsText: string;
        footnote: string;
        accent: MosaicColor;
        preset: "dark" | "light";
        debugLayout: boolean;
    };
    theme: {
        readonly bg: "#0e1613";
        readonly ink: "#eaf0ea";
        readonly dim: "#8d9c92";
    } | {
        readonly bg: "#f4f1e8";
        readonly ink: "#1c231d";
        readonly dim: "#5d6a5f";
    };
    m: number;
    CW: number;
    gap: number;
    floor: number;
    small: number;
    cells: Cell[];
    marks: MarkTile[];
    tiles: Tile[];
    strips: GolfStrip[];
    gutterPx: number;
    holePx: number;
    parPx: number;
    scorePx: number;
    rowU: number;
    headerBottom: number;
    totalsY: number;
    totalsH: number;
    footTop: number;
    footH: number;
    footLines: number;
    legendPx: number;
    legendMark: number;
    blockH: number;
    stripsTop: number;
};
export declare const GolfRoundScorecardV1: import("@m0saic/types").MosaicTemplate<GolfRoundScorecardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default GolfRoundScorecardV1;
