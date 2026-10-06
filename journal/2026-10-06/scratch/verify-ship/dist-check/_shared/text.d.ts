import type { MosaicColor, MosaicSource } from "@m0saic/types";
/**
 * The text kit the shared pages and harness cards draw with: svg-rasterized
 * cells (the bundled deterministic font, no drawtext), measured fits, and a
 * word-wrap that survives a token wider than its box. Templates written by
 * the daily agent usually carry their own fitter (the og-card measures bold
 * against the bold file); this kit is for the repo's own chrome.
 */
/** The fit budget inside a cell: `cell * 0.94 - 2px` (the layout contract's rule). */
export declare function budget(cellW: number): number;
/** One svg-rasterized text cell, aligned inside its rect. */
export declare function textCell(opts: {
    text: string;
    fontSize: number;
    color: MosaicColor;
    hAlign: "left" | "right" | "center";
    bold?: boolean;
    vAlign?: "top" | "middle" | "bottom";
    label: string;
}): MosaicSource;
/** Measured width of one block, in the weight that will be drawn. */
export declare function widthOf(text: string, fontSize: number, bold?: boolean): number;
/** Shrink one line until it fits `maxW` (never wraps); returns the size. */
export declare function fitLine(text: string, maxW: number, maxPx: number, minPx: number, bold?: boolean): number;
/**
 * Word-wrap that also survives a token wider than the box (a URL, a long
 * flag): `wrapMeasured` never breaks a word, so such a token would run off
 * the edge. Over-long tokens are chunked by character to `chunkW` first.
 */
export declare function wrapFit(text: string, fontSize: number, maxW: number, chunkW?: number): string[];
/** Cut `text` to fit `maxW` at `fontSize` with a trailing "..." - the last resort after shrinking. */
export declare function ellipsize(text: string, fontSize: number, maxW: number, bold?: boolean): string;
