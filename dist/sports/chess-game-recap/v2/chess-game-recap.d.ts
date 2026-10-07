import type { LayoutConstraint } from "@m0saic/template-utils";
import type { ChessGame } from "./chess";
import type { ChessBoardTheme } from "./pieces";
import type { ChessMoment, ChessSeries } from "./story";
/**
 * `@one-a-day/sports/chess-game-recap/v2` - a chess game told in its key
 * moments, from the PGN every Lichess and Chess.com game exports.
 *
 * WHAT IT MAKES: a ~15 s clip. It opens on the finished card (final
 * position, result, the whole graph), then replays the four or five moves
 * that decided the game: the position before each one, the piece SLIDING
 * to its square, the board after it with both squares lit, the move named
 * in SAN with a plain-words line under it, and a marker walking along the
 * material (or evaluation) graph. It ends where it began, so it loops.
 *
 * FOR WHOM: a player sharing a game - a club round, a Lichess "game of the
 * month" pick, a streamer's game of the day - who would otherwise post a
 * screenshot of one position.
 *
 * THE RULE THAT BITES: a board has to be RIGHT. The template replays every
 * move of the PGN with a legality check (`chess.ts`) and stops on the first
 * move it cannot play, naming it - it never draws a position the game did
 * not have. The moving piece is a full-board, transparent image whose
 * `overlay.xExpr/yExpr` offset slides it from its square to the next; every
 * board image shares one rect in a child document, so a slide lands exactly
 * on the square the next image draws.
 *
 * Founder-directed v2 of day 018's v1 (claude-haiku), which shipped six
 * typed fields and no board: same idea, a stronger agent (Claude Opus 5.5
 * in an interactive session), the founder's three calls - animated key
 * moments, the Opera Game by default, v1 deprecated in favour of this.
 */
export type ChessGameRecapV2Props = {
    /** The game: a PGN as exported (headers + moves; comments, NAGs, variations and [%eval] are read). */
    pgn?: string;
    /** Which moves to feature: "10 13 16" (White's), "12b" or "12..." (Black's); empty = automatic. */
    moments?: string;
    /** Which side is at the bottom of the board. */
    orientation?: "white" | "black";
    /** Board colours. */
    board?: ChessBoardTheme;
    /** Seconds per moment (1.5..6). */
    momentSec?: number;
    /** Dev-only: check the layout contract and draw it over the frame. */
    debugLayout?: boolean;
};
/** Paul Morphy vs Duke Karl / Count Isouard, Paris 1858 - the Opera Game. Public domain, 17 moves. */
export declare const CHESS_RECAP_DEFAULT_PGN = "[Event \"Paris\"]\n[Site \"Paris FRA\"]\n[Date \"1858.??.??\"]\n[White \"Paul Morphy\"]\n[Black \"Duke Karl / Count Isouard\"]\n[Result \"1-0\"]\n[ECO \"C41\"]\n[Opening \"Philidor Defense\"]\n\n1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7\n8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7\n14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0";
export declare const CHESS_RECAP_MIN_MOMENT_SEC = 1.5;
export declare const CHESS_RECAP_MAX_MOMENT_SEC = 6;
export type ChessRecapCopy = {
    /** "Paris, 1858" - event, date, time control. */
    event: string;
    /** Shorter forms of `event`, longest first, for a line that cannot fit it whole. */
    eventShorter: string[];
    white: string;
    black: string;
    whiteElo: string;
    blackElo: string;
    /** "1-0" | "0-1" | "1/2-1/2" | "*" */
    result: string;
    /** "checkmate on move 17" */
    ending: string;
    /** "C41 Philidor Defense" */
    opening: string;
};
export declare function chessRecapCopy(game: ChessGame): ChessRecapCopy;
export type ChessRecapSlot = {
    /** The moment begins: the position before the move fades in over the last board. */
    start: number;
    /** The piece starts to slide. */
    slide: number;
    /** The piece has landed: the board after the move takes over. */
    settle: number;
    /** The next moment begins (the clip's end for the last one). */
    end: number;
};
export type ChessRecapBeats = {
    intro: number;
    fade: number;
    slideSec: number;
    slots: ChessRecapSlot[];
    total: number;
};
/**
 * Cold open on the finished card, then `count` moments of `momentSec`, the
 * last one held a beat longer - it is the card the clip opened on, so the
 * loop is seamless. A pinned duration re-spaces the moments to fit it.
 */
export declare function chessRecapBeats(count: number, momentSec: number, pinnedMs?: number): ChessRecapBeats;
export type ChessRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type ChessLine = {
    text: string;
    px: number;
    width: number;
    rect: ChessRect;
    bold: boolean;
};
export type ChessBlock = {
    lines: string[];
    px: number;
    width: number;
    rect: ChessRect;
};
export type ChessRecapLayout = {
    arrangement: "landscape" | "square" | "portrait";
    board: ChessRect;
    graph: ChessRect;
    graphLabel: ChessLine;
    event: ChessLine | null;
    whiteChip: ChessRect;
    blackChip: ChessRect;
    white: ChessBlock;
    black: ChessBlock;
    whiteElo: ChessLine | null;
    blackElo: ChessLine | null;
    result: ChessLine;
    ending: ChessBlock;
    opening: ChessBlock | null;
    rule: ChessRect | null;
    titles: ChessLine[];
    words: ChessBlock[];
};
/** The largest 5-smooth number at or below `n` - child canvases need a divisor lattice. */
export declare function chessSmoothDown(n: number): number;
/**
 * The whole geometry as a pure function of the copy, the moments and the
 * canvas: landscape (board left, column right), square (players across the
 * top, board and caption, graph across the bottom) or portrait (stacked).
 */
export declare function chessRecapLayout(copy: ChessRecapCopy, moments: ChessMoment[], kind: ChessSeries["kind"], W: number, H: number): ChessRecapLayout;
/**
 * The material (or eval) area chart, White up and Black down, with every
 * moment as a faint dot and the current one - when given - as a gold line.
 */
export declare function chessGraphSvg(series: ChessSeries, w: number, h: number, plies: number[], current: number | null): string;
/** What the geometry promises: every text fits, the board is square and leads, the graph sits low. */
export declare function chessRecapContract(L: ChessRecapLayout): LayoutConstraint[];
export declare const ChessGameRecapV2: import("@m0saic/types").MosaicTemplate<ChessGameRecapV2Props, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
