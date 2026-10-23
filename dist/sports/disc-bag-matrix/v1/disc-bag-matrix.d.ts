import type { MosaicColor } from "@m0saic/types";
import type { LayoutConstraint } from "@m0saic/template-utils";
/**
 * `@one-a-day/sports/disc-bag-matrix/v1` - a disc golf bag chart as a share
 * card: the speed x stability matrix the "rate my bag" threads are already
 * about, rendered deterministically from the four flight numbers every disc
 * carries (speed, glide, turn, fade) instead of screenshotted from a bag site.
 *
 * ONE CONCEPT: the bag as its own evidence. Every disc SLOTS ITSELF - the
 * stability slot is derived (s = turn + fade, never a user field), chips stack
 * inside their cell, and the empty cells keep a faint slot tint so "what am I
 * missing" answers itself from the picture.
 *
 * The rule that bites: the bag's DENSEST cell sizes every chip uniformly. If
 * that cell cannot fit at the chip floor at this canvas, render() refuses the
 * bag with the count in the error - a chip never collides, never leaves its
 * cell, and never ellipsizes (copy shrinks to fit; dense cells tier down from
 * name + numbers to name alone).
 */
export type DiscEntry = {
    /** The mold name, 1-20 ASCII characters. */
    name: string;
    /** Speed 1-14 (the x axis band). */
    speed: number;
    /** Glide 1-7 (printed on the chip, never slotted). */
    glide: number;
    /** Turn -5..2 (half the stability slot). */
    turn: number;
    /** Fade 0..5 (the other half). */
    fade: number;
};
export type ChipDetail = "name+numbers" | "name" | "numbers";
export type Preset = "dark" | "light";
export type DiscBagMatrixProps = {
    /** The bag: one entry per disc - {name, speed, glide, turn, fade}. 3-30 entries. */
    discs?: DiscEntry[] | string;
    /** Bag owner, the header's largest line. 1-40 ASCII. */
    title?: string;
    /** Second header line, e.g. "league bag - Oct 2026"; "" removes it. 0-48 ASCII. */
    subtitle?: string;
    /** What the chips print: "name+numbers" (tiered down when dense), "name" or "numbers". */
    chipDetail?: ChipDetail;
    /** Page and ink: "dark" share card or "light" printed chart. */
    preset?: Preset;
    /** The one accent - the header mark and the warm end of the row ramp - #rrggbb. */
    accent?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** Speed bands, left to right: the classes the community already uses. */
export declare const SPEED_BANDS: readonly [{
    readonly cls: "PUTTER";
    readonly range: "1-3";
    readonly min: 1;
    readonly max: 3;
}, {
    readonly cls: "MID";
    readonly range: "4-5";
    readonly min: 4;
    readonly max: 5;
}, {
    readonly cls: "FAIRWAY";
    readonly range: "6-9";
    readonly min: 6;
    readonly max: 9;
}, {
    readonly cls: "CONTROL";
    readonly range: "10-11";
    readonly min: 10;
    readonly max: 11;
}, {
    readonly cls: "DISTANCE";
    readonly range: "12-14";
    readonly min: 12;
    readonly max: 14;
}];
/** Stability bands, TOP to BOTTOM on the canvas (s = turn + fade): BEEF first. */
export declare const STAB_BANDS: readonly [{
    readonly name: "BEEF";
    readonly hint: "s >= 4";
    readonly min: 4;
    readonly max: 99;
}, {
    readonly name: "OS";
    readonly hint: "s 2-3";
    readonly min: 2;
    readonly max: 3;
}, {
    readonly name: "STABLE";
    readonly hint: "s 0-1";
    readonly min: 0;
    readonly max: 1;
}, {
    readonly name: "US";
    readonly hint: "s <= -1";
    readonly min: -99;
    readonly max: -1;
}];
/** The chip's flight-number line, the community's own order: "9 5 -1 2". */
export declare function numbersLine(d: {
    speed: number;
    glide: number;
    turn: number;
    fade: number;
}): string;
/** The column band index (0-4) a speed lands in; -1 outside 1-14 (validation refuses first). */
export declare function speedBandIndex(speed: number): number;
/** The row band index (0=BEEF top ... 3=US bottom) a stability slot s lands in. */
export declare function stabBandIndex(s: number): number;
export type BagDisc = DiscEntry & {
    /** Position in the `discs` prop (the ORIGINAL index - bindings use it). */
    index: number;
    /** Derived stability slot: turn + fade. */
    s: number;
    /** Row band index, 0 = BEEF at the top. */
    row: number;
    /** Column band index, 0 = PUTTER on the left. */
    col: number;
};
export type BagModel = {
    discs: BagDisc[];
    title: string;
    subtitle: string;
    chipDetail: ChipDetail;
    preset: Preset;
    accent: MosaicColor;
    debugLayout: boolean;
    /** cells[row][col], each sorted by name then input order. */
    cells: BagDisc[][][];
    colCounts: number[];
    total: number;
    filled: number;
    empty: number;
};
export declare function normalizeDiscBagMatrix(props: DiscBagMatrixProps): BagModel;
export type BagRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type BagFit = {
    text: string;
    px: number;
    width: number;
};
export type BagChip = {
    disc: BagDisc;
    tile: BagRect;
    nameRect: BagRect | null;
    name: BagFit | null;
    numsRect: BagRect | null;
    nums: BagFit | null;
};
export type BagLayout = {
    W: number;
    H: number;
    S: number;
    markRect: BagRect;
    title: BagFit;
    titleRect: BagRect;
    subtitle: BagFit | null;
    subtitleRect: BagRect | null;
    count: BagFit;
    countRect: BagRect;
    rows: Array<{
        name: BagFit;
        nameRect: BagRect;
        hint: BagFit | null;
        hintRect: BagRect | null;
    }>;
    cols: Array<{
        range: BagFit;
        rangeRect: BagRect;
        cls: BagFit | null;
        clsRect: BagRect | null;
        count: BagFit | null;
        countRect: BagRect | null;
    }>;
    cells: Array<{
        row: number;
        col: number;
        rect: BagRect;
    }>;
    chips: BagChip[];
    footerCaption: BagFit;
    footerCaptionRect: BagRect;
    footerGloss: BagFit;
    footerGlossRect: BagRect;
    footerSlots: BagFit;
    footerSlotsRect: BagRect;
};
/**
 * The whole card as rects and measured fits - a pure function of the model and
 * the canvas. The bands are fixed fractions (header ~13% top, footer ~9%
 * bottom) and the matrix flexes between them at every aspect.
 */
export declare function layoutBag(m: BagModel, W: number, H: number): BagLayout;
/**
 * What the geometry promises (the brief's contract): every text fits its box
 * (measured against the real font), the header and footer hold their bands,
 * the row-label strip sits left of the grid and the column-label strip under
 * it, and every rendered chip and label is present. No pinned fractions beyond
 * the bands - the matrix flexes at every aspect.
 */
export declare function bagContract(L: BagLayout): LayoutConstraint[];
export declare const DiscBagMatrixV1: import("@m0saic/types").MosaicTemplate<DiscBagMatrixProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default DiscBagMatrixV1;
