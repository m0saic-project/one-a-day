import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/gaming/wh40k-roster-card/v1` - a Warhammer 40,000 BattleScribe
 * roster as one share card: army name, faction, detachment, a points pill,
 * and unit rows with category badges, model counts, optional enhancement and
 * warlord chips. Built for "rate my list" posts and tournament check-ins.
 *
 * ONE CONCEPT: a roster is already a rectangle-friendly structure. Turn the
 * force-selection tree into typed props and the card lays itself out in three
 * bands - header, rows, footer - at any aspect ratio.
 *
 * The rule that bites: text has to fit on every aspect (landscape, portrait,
 * square) and on the seven contract canvases down to 480x270. Every line is
 * measured and shrunk before it is placed, optional chips drop when the row
 * gets too narrow, and long rosters switch to two columns in landscape.
 */
export type Wh40kUnit = {
    /** Unit name, ASCII, 1-48 chars. */
    name: string;
    /** Model count, non-negative integer. */
    models: number;
    /** Points cost, non-negative integer. */
    points: number;
    /** BattleScribe role abbreviation: HQ, TR, EL, FA, HS, FL, LW or DT. */
    category: string;
    /** Enhancement name, ASCII, 0-28 chars; empty/absent removes the chip. */
    enhancement?: string;
    /** Type "WARLORD" to draw the warlord chip; empty/absent removes it. */
    warlord?: string;
};
export type Wh40kRosterCardProps = {
    /** Largest header line. ASCII, 1-48 chars. */
    armyName?: string;
    /** Faction line. ASCII, 1-40 chars. */
    faction?: string;
    /** Detachment line. ASCII, 1-40 chars. */
    detachment?: string;
    /** Points used in the header pill and footer. */
    pointsUsed?: number;
    /** Points limit in the header pill and footer. */
    pointsLimit?: number;
    /** The unit rows, 1-20. */
    units?: Wh40kUnit[];
    /** Header pill, category badge and chip accent, #rrggbb. */
    accent?: string;
    /** Page and ink palette. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeWh40kRosterCard(props: Wh40kRosterCardProps): {
    armyName: string;
    faction: string;
    detachment: string;
    pointsUsed: number;
    pointsLimit: number;
    units: {
        name: string;
        models: number;
        points: number;
        category: string;
        enhancement: string;
        warlord: string;
    }[];
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
export type NormalizedWh40kRosterCard = ReturnType<typeof normalizeWh40kRosterCard>;
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    prop: "armyName" | "faction" | "detachment" | "pointsUsed" | "pointsLimit" | "accent" | "preset";
} | {
    unit: [number, string];
    type: "string" | "number";
} | null;
type Cell = {
    label: string;
    rect: Rect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
    over?: boolean;
};
type Tile = {
    label: string;
    rect: Rect;
    color: MosaicColor;
    radius: number;
    layer: number;
    bind: Bind;
};
type RowInfo = {
    i: number;
    col: number;
    rect: Rect;
};
type BadgeInfo = {
    i: number;
    rect: Rect;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutWh40kRosterCard(props: Wh40kRosterCardProps, W: number, H: number): {
    p: {
        armyName: string;
        faction: string;
        detachment: string;
        pointsUsed: number;
        pointsLimit: number;
        units: {
            name: string;
            models: number;
            points: number;
            category: string;
            enhancement: string;
            warlord: string;
        }[];
        accent: MosaicColor;
        preset: "dark" | "light";
        debugLayout: boolean;
    };
    theme: {
        readonly bg: MosaicColor;
        readonly row: MosaicColor;
        readonly ink: MosaicColor;
        readonly dim: MosaicColor;
    } | {
        readonly bg: MosaicColor;
        readonly row: MosaicColor;
        readonly ink: MosaicColor;
        readonly dim: MosaicColor;
    };
    ink: MosaicColor;
    dim: MosaicColor;
    W: number;
    H: number;
    m: number;
    gap: number;
    hair: number;
    floor: number;
    small: number;
    cells: Cell[];
    tiles: Tile[];
    rows: RowInfo[];
    badges: BadgeInfo[];
    useTwoCols: boolean;
    cols: number;
    perCol: number;
    bodyTop: number;
    bodyBottom: number;
    headBottom: number;
    footTop: number;
};
export declare const Wh40kRosterCardV1: import("@m0saic/types").MosaicTemplate<Wh40kRosterCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default Wh40kRosterCardV1;
