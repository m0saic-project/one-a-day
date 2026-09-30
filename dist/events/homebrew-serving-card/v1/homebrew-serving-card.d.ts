import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/events/homebrew-serving-card/v1` - a serving card for one
 * homebrew (name, style, strength, brewer) from the fields a recipe export
 * already carries: mostly white, dark type, thin rules.
 *
 * ONE CONCEPT: a number says what kind of number it is. `abv` is a STRING so
 * "" (not supplied) and "0" (a real zero) both survive the defaults merge,
 * and the line under the percentage reads Estimated ABV, Batch ABV or Not
 * supplied - never a default standing in for a missing value.
 *
 * The rule that bites: the type floor is 10/270 of the short side (40 px at
 * 1080), and 48 of the widest glyph must still fit above it. Fixed boxes
 * cannot promise that on a square, so the boxes are sized FROM the fitted
 * text: each group fits its supporting line first, gives the primary the
 * rest and is centred in its region, and the footer grows into the bottom
 * fifth before a long brewer credit is refused.
 */
export type AbvBasis = "estimated" | "batch";
export type HomebrewServingCardProps = {
    /** The beer's name - BeerXML RECIPE.NAME. */
    beerName?: string;
    /** The style under the name - BeerXML RECIPE.STYLE.NAME. */
    beerStyle?: string;
    /** Alcohol by volume as decimal text ("5.2"); "" when no value is available. */
    abv?: string;
    /** What kind of number `abv` is: the recipe estimate, or the batch's own value. */
    abvBasis?: AbvBasis;
    /** Footer credit - BeerXML RECIPE.BREWER; "" hides the credit and its prefix. */
    brewer?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** The schema is documentation; this is the gate. Explicit values are validated, only `undefined` takes a default. */
export declare function normalizeServingCard(props: HomebrewServingCardProps): {
    beerName: string;
    beerStyle: string;
    brewer: string;
    abv: string;
    abvBasis: AbvBasis;
    debugLayout: boolean;
    value: string;
    qualifier: string;
    credit: string | null;
};
/** The readability floor: 10 px on a 270 px short side, scaled with the canvas. */
export declare const servingCardFloorPx: (W: number, H: number) => number;
export type ServingCardRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Prop = keyof HomebrewServingCardProps;
/** `bind` is the prop a double-click edits in place; a rect that shows the enum has none (the schema picker edits it). */
type Cell = {
    label: string;
    rect: ServingCardRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "center";
    color: MosaicColor;
    bind: Prop | null;
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutServingCard(props: HomebrewServingCardProps, W: number, H: number): {
    p: {
        beerName: string;
        beerStyle: string;
        brewer: string;
        abv: string;
        abvBasis: AbvBasis;
        debugLayout: boolean;
        value: string;
        qualifier: string;
        credit: string | null;
    };
    cells: Cell[];
    rules: {
        label: string;
        rect: ServingCardRect;
    }[];
    wide: boolean;
    floor: number;
    mx: number;
    my: number;
    footTop: number;
    split: number;
    bodyBottom: number;
    identity: ServingCardRect;
    strength: ServingCardRect;
};
export declare const HomebrewServingCardV1: import("@m0saic/types").MosaicTemplate<HomebrewServingCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default HomebrewServingCardV1;
