import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/gaming/commander-deck-spotlight/v1` - one Commander/EDH deck as
 * the share card the ecosystem converged on: kicker and bracket/record pills,
 * the deck name over the commander line with WUBRG mana chips, an eight-bucket
 * mana curve with the derived AVG MV and spell count, 3-6 highlight rows, and
 * the plan one-liner across the footer. Landscape runs curve and highlights
 * side by side; portrait stacks them inside the same bands.
 *
 * ONE CONCEPT: the curve never lies. AVG MV and the spell count are COMPUTED
 * from the curve buckets (179/63 = 2.84 at defaults) and never typed, the
 * bars are height-proportional to the counts with the tallest filling the
 * plot, and the count above each bar is the prop - the card cannot disagree
 * with itself however the deck changes.
 *
 * The rule that bites: every drawn string is printable ASCII and every field
 * is validated BY NAME at render - a curve that is not exactly 8 buckets, a
 * bucket sum of 0, a bracket outside 1-5, a color letter outside WUBRG or a
 * duplicate, a seventh highlight row - refused with the prop and the rule,
 * never clipped into the picture. Mana values and bracket are not in the raw
 * decklist export; the player reads them off the builder UI and passes them.
 */
export type HighlightRow = {
    /** Card name, ASCII, 1-48 chars. */
    name: string;
    /** Dim note beside/under the name ("token doubler"), ASCII, 0-28 chars. */
    note?: string;
    /** Copies in the deck, 1-99. */
    qty: number;
};
export type CommanderDeckSpotlightProps = {
    /** The deck's name, the largest header line. ASCII, 1-48 chars. */
    deckName?: string;
    /** The commander line under the deck name. ASCII, 1-40 chars. */
    commander?: string;
    /** Mana chips: letters from WUBRG, no duplicates, 0-5; drawn in canonical WUBRG order. "" removes the chips. */
    manaIdentity?: string;
    /** The bracket pill, integer 1-5. */
    bracket?: number;
    /** The record pill ("4-0", "2-1-1"). ASCII, 0-8 chars; "" removes the pill. */
    record?: string;
    /** The histogram: counts at MV 0,1,2,3,4,5,6,7+ - exactly 8 integers 0-99. Drives AVG MV and the spell count. */
    curve?: number[];
    /** The highlight rows, 3-6 of { name, note, qty }. */
    highlights?: HighlightRow[];
    /** The plan one-liner across the footer. ASCII, 0-90 chars; "" removes it. */
    plan?: string;
    /** Bar and pill accent ink, #rrggbb. */
    accent?: string;
    /** Page and ink. */
    preset?: "dark" | "light";
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeSpotlight(props: CommanderDeckSpotlightProps): {
    deckName: string;
    commander: string;
    record: string;
    plan: string;
    colorLetters: ("R" | "W" | "B" | "U" | "G")[];
    bracket: number;
    curve: number[];
    spells: number;
    maxCount: number;
    avgMv: number;
    avgText: string;
    spellsText: string;
    figuresText: string;
    highlights: {
        name: string;
        note: string;
        qty: number;
    }[];
    accent: MosaicColor;
    preset: "dark" | "light";
    debugLayout: boolean;
};
export type SpotlightRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    prop: "deckName" | "commander" | "record" | "plan" | "manaIdentity" | "bracket";
} | {
    curve: number;
} | {
    row: number;
    field: "name" | "note" | "qty";
} | null;
type Cell = {
    label: string;
    rect: SpotlightRect;
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
    rect: SpotlightRect;
    color: MosaicColor;
    radius: number;
    layer: number;
    bind: "accent" | "manaIdentity" | {
        curve: number;
    } | null;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutSpotlightCard(props: CommanderDeckSpotlightProps, W: number, H: number): {
    p: {
        deckName: string;
        commander: string;
        record: string;
        plan: string;
        colorLetters: ("R" | "W" | "B" | "U" | "G")[];
        bracket: number;
        curve: number[];
        spells: number;
        maxCount: number;
        avgMv: number;
        avgText: string;
        spellsText: string;
        figuresText: string;
        highlights: {
            name: string;
            note: string;
            qty: number;
        }[];
        accent: MosaicColor;
        preset: "dark" | "light";
        debugLayout: boolean;
    };
    theme: {
        readonly bg: "#161d27";
        readonly row: "#1e2733";
        readonly ink: "#e8edf3";
        readonly dim: "#8b98a8";
    } | {
        readonly bg: "#f2f0ea";
        readonly row: "#e7e4db";
        readonly ink: "#1b222b";
        readonly dim: "#5c6672";
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
    bars: {
        i: number;
        rect: SpotlightRect | null;
        count: number;
    }[];
    rows: {
        i: number;
        rect: SpotlightRect;
    }[];
    chipSide: number;
    sideBySide: boolean;
    curveCell: SpotlightRect;
    hlCell: SpotlightRect;
    bodyTop: number;
    bodyBottom: number;
    plotTop: number;
    plotBottom: number;
    plotH: number;
};
export declare const CommanderDeckSpotlightV1: import("@m0saic/types").MosaicTemplate<CommanderDeckSpotlightProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default CommanderDeckSpotlightV1;
