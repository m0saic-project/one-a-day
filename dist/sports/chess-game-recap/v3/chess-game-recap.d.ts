import type { MosaicOverlayExpr } from "@m0saic/types";
import type { LayoutConstraint } from "@m0saic/template-utils";
import type { ChessGame, ChessPiece } from "../v2/chess";
import type { ChessRecapBeats, ChessRecapCopy, ChessRecapLayout, ChessRect } from "../v2/chess-game-recap";
import type { ChessBoardTheme } from "../v2/pieces";
import type { ChessMoment, ChessSeries } from "../v2/story";
/**
 * `@one-a-day/sports/chess-game-recap/v3` - the v2 clip (a chess game told in
 * its key moments, from the PGN) with EXPLICIT geometry and a platform knob.
 *
 * WHAT CHANGED FROM v2 (the founder's ask, the same day): v2 drew each board
 * as one whole-board SVG image and stacked those images in time. v3 builds
 * the board out of the canvas itself: 64 square cells, every piece its own
 * rect on its square, the lit squares their own tiles, the moving piece its
 * own rect that slides, and the graph one bar rect per ply. Clicking around
 * in Make, every square and every piece is a cell. A `platform` knob picks
 * the canvas (desktop 1920x1080, square 1080x1080, mobile 1080x1920); the
 * names and the event line can be overridden and edited on the canvas.
 *
 * THE RULE THAT BITES: a piece is NOT drawn per frame - each square carries
 * one layer per piece that ever stands on it, enabled over the union of the
 * stretches it stands there (one layer per distinct value, never one per
 * change). A piece that does not move between two moments is the same layer
 * staying on, so nothing flickers. The board side is a multiple of the split
 * lattice on both axes (basis 360), so the square cells ARE the squares - no
 * quantized cell, no inset recovery - and a slide's pixel offset lands on the
 * exact cell of the square it targets.
 *
 * Reused, unchanged and frozen, from v2: the PGN reader and replayer
 * (`../v2/chess.ts`), the moments and the graph series (`../v2/story.ts`),
 * the piece drawings (`../v2/pieces.ts`), the copy, the beats and the three
 * arrangements (`../v2/chess-game-recap.ts`).
 */
export declare const CHESS_V3_PLATFORMS: {
    /** 16:9 - YouTube, a stream overlay, a club website. */
    readonly desktop: {
        readonly width: 1920;
        readonly height: 1080;
    };
    /** 1:1 - a feed post, Discord, a forum. */
    readonly square: {
        readonly width: 1080;
        readonly height: 1080;
    };
    /** 9:16 - Stories, Reels, Shorts, TikTok. */
    readonly mobile: {
        readonly width: 1080;
        readonly height: 1920;
    };
};
export type ChessV3Platform = keyof typeof CHESS_V3_PLATFORMS;
export type ChessGameRecapV3Props = {
    /** The game: a PGN as exported (headers + moves; comments, NAGs, variations and [%eval] are read). */
    pgn?: string;
    /** Where it is going: the canvas follows (desktop | square | mobile). */
    platform?: ChessV3Platform;
    /** Which moves to feature: "10 13 16" (White's), "12b" or "12..." (Black's); empty = automatic. */
    moments?: string;
    /** White's name as shown; empty = the PGN's. */
    white?: string;
    /** Black's name as shown; empty = the PGN's. */
    black?: string;
    /** The line above the players; empty = the PGN's event, date and time control. */
    event?: string;
    /** Which side is at the bottom of the board. */
    orientation?: "white" | "black";
    /** Board colours. */
    board?: ChessBoardTheme;
    /** Seconds per moment (1.5..6). */
    momentSec?: number;
    /** Dev-only: check the layout contract and draw it over the frame. */
    debugLayout?: boolean;
};
/** The PGN's copy with the shown-name overrides applied (ASCII, like everything rendered). */
export declare function chessV3Copy(game: ChessGame, props: ChessGameRecapV3Props): ChessRecapCopy;
/** The split lattice's pitch per axis at this canvas (basis 360). */
export declare function chessV3Pitch(W: number, H: number): {
    qx: number;
    qy: number;
};
/**
 * The board inside v2's board rect, re-cut so a square's side is a multiple
 * of the split lattice's pitch on BOTH axes and its corner sits on the
 * lattice: every square cell is then exactly its square. A hostile canvas
 * (a prime side, no usable lattice) falls back to plain eighths - the
 * inset recovery still paints them exactly.
 */
export declare function chessV3Board(r: ChessRect, W: number, H: number): {
    x: number;
    y: number;
    sq: number;
};
type Span = {
    a: number;
    b: number;
};
type BoardState = Span & {
    board: ReadonlyArray<ChessPiece | null>;
    lit: number[];
    hide: number[];
};
/** The positions the clip shows, in order: cold open, then before/after each moment. */
export declare function chessV3States(moments: ChessMoment[], B: ChessRecapBeats): BoardState[];
/** For one square: each value it takes (a piece key, or "lit") with the merged stretches it holds. */
export declare function chessV3SquareLayers(states: BoardState[], sq: number): Map<string, Span[]>;
/** An enable over a union of stretches; undefined = the whole clip (a static layer). */
export declare function chessV3Gate(spans: Span[], total: number): MosaicOverlayExpr | undefined;
export type ChessV3Layout = ChessRecapLayout & {
    boardAt: {
        x: number;
        y: number;
        sq: number;
    };
};
export declare function chessV3Layout(copy: ChessRecapCopy, moments: ChessMoment[], kind: ChessSeries["kind"], W: number, H: number): ChessV3Layout;
/** The graph's columns: one per ply, binned to at most 60 for a long game. */
export declare function chessV3Columns(series: ChessSeries): Array<{
    ply: number;
    value: number;
}>;
/** What the geometry promises: every text fits, the squares are square, the graph sits low. */
export declare function chessV3Contract(L: ChessV3Layout): LayoutConstraint[];
export declare const ChessGameRecapV3: import("@m0saic/types").MosaicTemplate<ChessGameRecapV3Props, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export {};
