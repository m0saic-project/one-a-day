import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/sports/orienteering-split-analysis/v1` - one racer's IOF XML 3.0
 * result row as a shareable split-analysis card: finish time as the hero, the
 * course and the place, then control-by-control legs as a tape whose length is
 * the split, and a footer that answers the one question everyone asks -
 * "where did I lose time?" - as TIME W/O MISTAKES, TOTAL LOSS and BEST LEG.
 *
 * ONE CONCEPT: the mistake is the picture. A leg's bar length is its split
 * over the slowest leg, so the eye reads the race; a leg with time loss
 * (`loss > 0`, the WinSplits per-leg number) is drawn in the accent - pink
 * bar, signed pink loss - and a clean leg is neutral with an empty loss cell.
 * No legend: pink = mistake, bar length = split.
 *
 * The rule that bites: time loss is NOT re-derived. WinSplits computes it
 * class-relative from the whole field, so it comes in as a prop per leg; the
 * card only sums the entered losses (TOTAL LOSS), subtracts them from the
 * entered finish (TIME W/O MISTAKES) and takes the min split (BEST LEG) - and
 * it never checks the finish against the split sum. A decimal time, an
 * h:mm:ss loss, a leg count outside 4-18, or a leg that will not fit the
 * canvas fails fast with a named field.
 */
export type OrienteeringLeg = {
    control: string;
    split: string;
    loss: string;
};
export type OrienteeringSplitAnalysisProps = {
    /** The racer, the header's bold line. Up to 40 ASCII; "" hides it. */
    name?: string;
    /** The club, first half of the second line. Up to 40 ASCII; "" hides it. */
    club?: string;
    /** The class, joined after the club with " · ". Up to 20 ASCII. */
    className?: string;
    /** The course, the third header line. Up to 48 ASCII; "" hides it. */
    course?: string;
    /** The finish time, the hero figure. "m:ss" or "h:mm:ss", whole seconds. */
    finish?: string;
    /** The place, drawn as the accent "#12" chip. 0 hides the chip. */
    place?: number;
    /** Time behind the winner, printed as entered. Up to 16 ASCII; "" hides it. */
    behind?: string;
    /** The legs in course order, 4-18, each { control, split, loss }. */
    splits?: OrienteeringLeg[] | string;
    /** The mistake-leg pink - bars, loss text, place chip - as #rrggbb. */
    accent?: string;
    /** Page and ink: "dark" share card or "light" print. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** A 12-control middle course: 13 legs in course order, the last the finish. */
export declare const DEFAULT_LEGS: OrienteeringLeg[];
/**
 * "m:ss" or "h:mm:ss" to whole seconds. Minutes may pass 59 in the one-colon
 * form. Seconds (and minutes in the two-colon form) are 0-59. A decimal is
 * refused, not rounded. null when the string is not that grammar.
 */
export declare function parseSplitTime(text: string): number | null;
/** Compact, no leading zeros. Hours only when the value is at least one hour. */
export declare function formatSplitTime(sec: number): string;
export type Leg = {
    index: number;
    control: string;
    split: string;
    splitSec: number;
    loss: string;
    lossSec: number;
    isMistake: boolean;
};
export type NormalizedSplitCard = {
    name: string;
    club: string;
    className: string;
    course: string;
    clubLine: string;
    finish: string;
    finishSec: number;
    place: number;
    placeText: string;
    behind: string;
    legs: Leg[];
    slowestSec: number;
    bestSec: number;
    totalLossSec: number;
    totalLossText: string;
    timeWoText: string;
    bestText: string;
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeSplitCard(props: OrienteeringSplitAnalysisProps): NormalizedSplitCard;
export type SplitRect = {
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
    rect: SplitRect;
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
    rect: SplitRect;
    color: MosaicColor;
    radius: number;
    layer: number;
    accent?: boolean;
};
/** The whole card as rects and measured fits - pure in (props, canvas). */
export declare function layoutSplitCard(props: OrienteeringSplitAnalysisProps, W: number, H: number): {
    p: NormalizedSplitCard;
    theme: {
        readonly bg: "#14111d";
        readonly ink: "#efe9f2";
        readonly dim: "#9b92a4";
    } | {
        readonly bg: "#f6f2ef";
        readonly ink: "#241d28";
        readonly dim: "#6f6574";
    };
    cells: Cell[];
    tiles: Tile[];
    bands: SplitRect[];
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
    headerBottom: number;
    bodyTop: number;
    bodyBottom: number;
    footerTop: number;
};
export declare const OrienteeringSplitAnalysisV1: import("@m0saic/types").MosaicTemplate<OrienteeringSplitAnalysisProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default OrienteeringSplitAnalysisV1;
