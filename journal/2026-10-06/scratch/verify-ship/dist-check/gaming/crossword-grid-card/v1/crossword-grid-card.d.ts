import type { MosaicColor, MosaicSource } from "@m0saic/types";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
/**
 * `@one-a-day/gaming/crossword-grid-card/v1` - the solved crossword grid a
 * blogger puts atop a write-up, drawn from the puzzle file's own fields
 * instead of a screenshot of the solving app: blocks, derived clue numbers,
 * letters, circled squares, the theme entries tinted and listed, and the
 * caption line. With `solved: false` it is a constructor's new-puzzle teaser.
 *
 * ONE CONCEPT: a lattice this big is drawn in LAYERS, not cells. The board is
 * a paper tile, a theme tile and an ink tile masked to "board minus paper
 * cells" (border, rules and blocks in one path), a ring tile, and one
 * multi-layer text source for all the letters and one for all the numbers
 * (each glyph placed by a pixel xExpr/yExpr). Any size is under 40 frames and
 * about 8 overlays deep. Per-cell grids would be 1,500+ frames at 25x25, past
 * the engine's 400-frame budget; a text source per row stacks past the ~25
 * overlays where the engine silently degrades inline masks.
 *
 * The rule that bites: equal cells come from ONE integer lattice,
 * `X_k = round(x0 + k * pitch)`, that every layer reads - the mask holes, the
 * tint cells, the glyph offsets. Compute any of them from its own rounding
 * and the rules drift off the letters by a pixel per cell.
 */
export type CrosswordGridCardProps = {
    /** The solution: rows split by "/" or newlines, "#" or "." for a block, A-Z; an unbroken square string reads as n x n. */
    grid?: string;
    /** Clue ids to tint and list ("17A 3D"), spaces or commas. "" = none. */
    themeEntries?: string;
    /** 0-based row-major cell indices to ring (the .puz order). "" = none. */
    circles?: string;
    /** Puzzle title, 1-40 printable ASCII. */
    title?: string;
    /** Constructor(s), 1-48 printable ASCII; shown as "by <author>". */
    author?: string;
    /** Outlet or series for the caption line, 1-24 printable ASCII. */
    publication?: string;
    /** Puzzle date, YYYY-MM-DD. */
    date?: string;
    /** false = the teaser: no letters, no theme tint, no answer list. */
    solved?: boolean;
    /** Theme-cell fill and list swatches (#rrggbb). Never used as text ink. */
    themeColor?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export declare const CROSSWORD_DEFAULTS: {
    readonly grid: "PAN#BOW/AGE#ARE/DOGSLED/##AIL##/CATNAPS/OWE#SAT/YES#TRY";
    readonly themeEntries: "9A 12A";
    readonly circles: "14 15 16 28 29 30";
    readonly title: "Cats and Dogs";
    readonly author: "one-a-day agent";
    readonly publication: "Demo Mini";
    readonly date: "2026-09-29";
    readonly solved: true;
    readonly themeColor: "#FFE08A";
    readonly debugLayout: false;
};
export type CrosswordPuzzle = {
    rows: number;
    cols: number;
    /** Row-major; null is a block. */
    cells: Array<string | null>;
};
/** Parse the grid prop. Every refusal names the field, and for a cell its row and column (1-based). */
export declare function parseCrosswordGrid(raw: unknown): CrosswordPuzzle;
export type CrosswordEntry = {
    id: string;
    number: number;
    dir: "A" | "D";
    cells: number[];
    answer: string;
};
/**
 * The standard American numbering: a white cell takes the next number when it
 * starts an across entry (left is edge or block, right is white) or a down
 * entry (above is edge or block, below is white). Left to right, top to bottom.
 * Unchecked cells (British style) simply start nothing.
 */
export declare function numberCrosswordGrid(pz: CrosswordPuzzle): {
    numbers: Map<number, number>;
    entries: Map<string, CrosswordEntry>;
};
/** Every prop validated; a bad value fails with its field named, never falls back to the sample. */
export declare function normalizeCrossword(props: CrosswordGridCardProps): {
    pz: CrosswordPuzzle;
    numbers: Map<number, number>;
    entries: Map<string, CrosswordEntry>;
    themes: CrosswordEntry[];
    themeSpans: {
        start: number;
        end: number;
    }[];
    circles: number[];
    title: string;
    author: string;
    publication: string;
    meta: string;
    metaRest: string;
    metaDate: string;
    metaTail: string;
    themeColor: MosaicColor;
    grid: string;
    themeEntries: string;
    date: string;
    solved: boolean;
    debugLayout: boolean;
};
export type CrosswordNormalized = ReturnType<typeof normalizeCrossword>;
export type CrosswordRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
/** A text cell; `bind` names the prop it shows, `token` the span of the raw prop string it shows (a theme id). */
export type CrosswordTextBox = {
    label: string;
    rect: CrosswordRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    color: MosaicColor;
    hAlign: "left" | "right";
    vAlign: "top" | "middle" | "bottom";
    bind?: "title" | "author" | "publication" | "date" | "themeEntries";
    token?: {
        start: number;
        end: number;
    };
};
export type CrosswordBoard = {
    pitch: number;
    rule: number;
    border: number;
    /** Integer lattice lines: X[k] is the centre line left of column k (length cols+1). */
    X: number[];
    Y: number[];
    /** The whole board as drawn: ink border included. */
    ink: CrosswordRect;
    /** The paper part of cell i (inside the rules). */
    hole: (i: number) => CrosswordRect;
    letterPx: number;
    /** 0 when the clue numbers are dropped (below the 6px floor). */
    numberPx: number;
};
export type CrosswordThemeLine = {
    swatch: CrosswordRect;
    id: CrosswordTextBox;
    answer: CrosswordTextBox;
};
export type CrosswordLayout = {
    mode: "landscape" | "portrait" | "square";
    margin: number;
    gutter: number;
    board: CrosswordBoard;
    /** Where the caption copy lives (for the no-overlap assertion). */
    panel: CrosswordRect;
    texts: CrosswordTextBox[];
    themeLines: CrosswordThemeLine[];
};
/**
 * The card's geometry from ctx.target alone. Margin ~3.6% of the short side;
 * the board-to-panel gutter is twice that. Landscape: board left, full height,
 * copy in a column. Portrait: header over a full-width board, list and caption
 * under it. Between: board on top, caption strip under it.
 */
export declare function layoutCrosswordCard(p: CrosswordNormalized, W: number, H: number): CrosswordLayout;
export type CrosswordDrawn = {
    pieces: Array<{
        rect: CrosswordRect & {
            importance: number;
        };
        source: MosaicSource;
    }>;
    layout: CrosswordLayout;
    constraints: LayoutConstraint[];
    relations: RelationalConstraint[];
};
export declare function drawCrosswordCard(p: CrosswordNormalized, W: number, H: number): CrosswordDrawn;
export declare const CrosswordGridCardV1: import("@m0saic/types").MosaicTemplate<CrosswordGridCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default CrosswordGridCardV1;
