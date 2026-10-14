import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/gaming/tenxten-challenge-card/v1` - the yearly 10x10 board game
 * challenge as one progress card: the list as a pip grid (one row per game,
 * `goal` pips per row, the first `plays` of them filled), the plays total,
 * the games-done count and the year pace as three tiles above it, and the
 * computed-from footnote under it.
 *
 * ONE CONCEPT: the challenge's own arithmetic is never typed. The "10 x 10"
 * headline (games x goal), the "81 / 100" plays tile, the "6 / 10" done tile
 * and the pace tile (pace = games x goal x dayOfYear / 365) all fall out of
 * `games`, `goal` and `dayOfYear` - day-022's "the card cannot disagree with
 * itself", with the pip lattice as the hero. `dayOfYear` is a prop, not a
 * clock, so the card is deterministic. The row anatomy (label | track |
 * count) is day-023's climbing send pyramid's, but the track is a discrete
 * tally lattice - exactly `goal` cells, fill = plays, a row completes.
 *
 * The rule that bites: the pip lattice is ONE integer lattice,
 * X_k = round(x0 + k * pitch), that every layer reads - the filled-pip mask,
 * the empty-pip mask, the row lines, the test. Compute a layer from its own
 * rounding and the pips drift a pixel per column. And the accent is pip ink
 * only: 3:1 against the page is not the 4.5:1 copy needs, so it never
 * colours text - the ahead-of-pace accent is a bar under the pace tile.
 */
export type TenxtenGame = {
    name: string;
    plays: number;
};
export type TenxtenChallengeCardProps = {
    /** The challenger's handle, the header's right side. "" removes it. */
    challenger?: string;
    /** The challenge year - the wordmark's tail. */
    year?: number;
    /** The challenge list: each game and its plays logged this year. The template does not read BGG. */
    games?: TenxtenGame[];
    /** Plays that complete a game - the pips per row. 5 makes an honest 10x5. */
    goal?: number;
    /** The day of the year the card is for - drives the pace tile. A prop, not a clock. */
    dayOfYear?: number;
    /** Filled-pip ink and the ahead-of-pace bar, as #rrggbb. Never text ink. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export type TenxtenCard = ReturnType<typeof normalizeTenxten>;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeTenxten(props: TenxtenChallengeCardProps): {
    challenger: string;
    year: number;
    games: {
        name: string;
        plays: number;
    }[];
    goal: number;
    dayOfYear: number;
    n: number;
    target: number;
    playsTotal: number;
    done: number;
    pace: number;
    delta: number;
    ahead: boolean;
    paceText: string;
    headline: string;
    playsText: string;
    doneText: string;
    footnote: string;
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
export type TenxtenRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    prop: "challenger" | "year";
} | {
    row: number;
    field: "name" | "plays";
} | null;
type Cell = {
    label: string;
    rect: TenxtenRect;
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
    rect: TenxtenRect;
    color: MosaicColor;
    radius: number;
    bind: "accent" | null;
};
/** One pip of the lattice, as the test reads it: row, column, pixel square, filled. */
export type TenxtenPip = {
    row: number;
    k: number;
    x: number;
    y: number;
    side: number;
    filled: boolean;
};
/**
 * Every rect of the card for one canvas, top to bottom: the wordmark band,
 * three stat tiles, the pip grid (one row per game: name | track | count),
 * the footnote. Pure: same props and canvas, same rects.
 */
export declare function layoutTenxtenCard(props: TenxtenChallengeCardProps, W: number, H: number): {
    p: {
        challenger: string;
        year: number;
        games: {
            name: string;
            plays: number;
        }[];
        goal: number;
        dayOfYear: number;
        n: number;
        target: number;
        playsTotal: number;
        done: number;
        pace: number;
        delta: number;
        ahead: boolean;
        paceText: string;
        headline: string;
        playsText: string;
        doneText: string;
        footnote: string;
        accent: MosaicColor;
        preset: "dark" | "light";
        debugLayout: boolean;
    };
    theme: {
        readonly bg: "#1c2833";
        readonly ink: "#eaeef2";
        readonly dim: "#9aa7b4";
        readonly track: "#2b3947";
    } | {
        readonly bg: "#f6f1e7";
        readonly ink: "#1c1914";
        readonly dim: "#6e6758";
        readonly track: "#ddd4be";
    };
    m: number;
    CW: number;
    gap: number;
    secGap: number;
    floor: number;
    small: number;
    cells: Cell[];
    tiles: Tile[];
    pips: TenxtenPip[];
    pipSide: number;
    pitch: number;
    rowPitch: number;
    trackX: number;
    trackW: number;
    maskRect: TenxtenRect;
    filledPath: string;
    emptyPath: string;
    tilesY: number;
    tileW: number;
    tileH: number;
    nameW: number;
    countW: number;
    rowTop: number;
};
export declare const TenxtenChallengeCardV1: import("@m0saic/types").MosaicTemplate<TenxtenChallengeCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default TenxtenChallengeCardV1;
