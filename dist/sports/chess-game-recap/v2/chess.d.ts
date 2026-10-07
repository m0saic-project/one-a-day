/**
 * The PGN reader and move replayer behind `chess-game-recap/v2`.
 *
 * No dependency: the PGN is parsed here and every SAN move is REPLAYED on a
 * plain 64-square board with a legality check (pins, castling through check,
 * en passant, promotion). The positions the clip draws are the game's real
 * positions, and a move that does not parse or is not legal stops the render
 * with an error that names it - a wrong board would be worse than none.
 *
 * Squares are 0..63, a1 = 0, h1 = 7, a8 = 56 (rank * 8 + file).
 */
export type ChessColor = "w" | "b";
export type ChessPieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type ChessPiece = {
    color: ChessColor;
    type: ChessPieceType;
};
export type ChessPosition = {
    board: ReadonlyArray<ChessPiece | null>;
    turn: ChessColor;
    castling: {
        wk: boolean;
        wq: boolean;
        bk: boolean;
        bq: boolean;
    };
    ep: number | null;
    fullmove: number;
};
export type ChessMove = {
    /** 1-based half-move index in the game. */
    ply: number;
    moveNumber: number;
    color: ChessColor;
    /** SAN with the check suffix the replay computed (annotations stripped). */
    san: string;
    /** "!!", "!", "!?", "?!", "?", "??" or "". */
    annotation: string;
    nags: number[];
    /** The comment after the move, `[%...]` commands removed, ASCII-folded. */
    comment: string;
    /** `[%eval]` in pawns from White's side, or null. */
    evalPawns: number | null;
    /** `[%eval #n]`: mate in n (positive = White mates), or null. */
    evalMate: number | null;
    from: number;
    to: number;
    piece: ChessPiece;
    captured: ChessPiece | null;
    /** Where the captured piece stood (differs from `to` for en passant). */
    capturedAt: number | null;
    promotion: ChessPieceType | null;
    castle: "k" | "q" | null;
    rookFrom: number | null;
    rookTo: number | null;
    check: boolean;
    checkmate: boolean;
    stalemate: boolean;
    before: ChessPosition;
    after: ChessPosition;
};
export type ChessGame = {
    headers: Record<string, string>;
    start: ChessPosition;
    moves: ChessMove[];
    /** "1-0" | "0-1" | "1/2-1/2" | "*" - the movetext's, else the Result header's. */
    result: string;
};
export declare const CHESS_VALUES: Readonly<Record<ChessPieceType, number>>;
export declare const CHESS_NAMES: Readonly<Record<ChessPieceType, string>>;
export declare const CHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export declare function chessSquareName(sq: number): string;
/** Accents folded, anything else outside printable ASCII dropped: rendered copy is ASCII only. */
export declare function chessAscii(s: string): string;
export declare function chessFromFen(fen: string): ChessPosition;
export declare function chessToFen(pos: ChessPosition): string;
type RawMove = {
    san: string;
    annotation: string;
    nags: number[];
    comment: string;
    evalPawns: number | null;
    evalMate: number | null;
};
/** Headers and the main line of the FIRST game in `text` (variations are skipped). */
export declare function parsePgnText(text: string): {
    headers: Record<string, string>;
    moves: RawMove[];
    result: string | null;
};
/** Parse and replay one game. Every move is checked; the first bad one throws, named. */
export declare function readChessGame(text: string): ChessGame;
/** White's material minus Black's (P 1, N 3, B 3, R 5, Q 9). */
export declare function chessMaterial(pos: ChessPosition): number;
export {};
