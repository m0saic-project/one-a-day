import type { ChessGame, ChessMove } from "./chess";
export type ChessMoment = {
    move: ChessMove;
    /** "16. Qb8+" / "13... Rxd7" (with the PGN's own !/? when it has one). */
    title: string;
    /** The plain-words line: the PGN comment's first sentence, else what the move did. */
    words: string;
    /** Why it was picked: "sacrifice" | "capture" | "check" | "annotated" | "eval" | "final" | "chosen" | "filler". */
    why: string;
};
/** The most moments the clip features BEFORE the final move (each is a few overlays). */
export declare const CHESS_MAX_MOMENTS = 4;
/** The most a `moments` list may name (the final move is added on top). */
export declare const CHESS_MAX_CHOSEN = 5;
/** The longest plain-words line before it is cut at a word boundary. */
export declare const CHESS_WORDS_MAX = 64;
export declare function chessMoveTitle(m: ChessMove): string;
/**
 * A sacrifice by the rule the brief states: the piece that moved is taken on
 * the very next ply and the mover is down at least 2 over the pair. Returns
 * the material given (positive) or 0.
 */
export declare function chessSacrifice(game: ChessGame, m: ChessMove): number;
/** The first sentence of a comment, cut at a word boundary to `max` characters. */
export declare function chessFirstSentence(text: string, max?: number): string;
/** What the move did, in words a non-player can follow. */
export declare function chessDescribe(game: ChessGame, m: ChessMove): string;
/** Winning chances in -1..1 from a centipawn score (the curve Lichess plots). */
export declare function chessWinningChances(pawns: number): number;
export type ChessSeries = {
    kind: "material" | "eval";
    /** One value per ply boundary: index 0 is the start, index k is after ply k. */
    values: number[];
    /** The scale's half-height: values are drawn in [-max, max]. */
    max: number;
};
/** The graph: the evaluation when at least 60% of the plies carry one, else material. */
export declare function chessSeries(game: ChessGame): ChessSeries;
/** Parse a `moments` list: "10 13 16" (White's moves), "12b" / "12..." (Black's). */
export declare function chessParseMoments(game: ChessGame, spec: string): ChessMove[];
/**
 * The moments the clip features, in game order, the final move last.
 * `spec` empty = automatic (the brief's rule); else the named moves.
 */
export declare function chessMoments(game: ChessGame, spec?: string): ChessMoment[];
