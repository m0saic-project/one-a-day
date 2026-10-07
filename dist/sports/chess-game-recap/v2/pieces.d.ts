/**
 * The board and the pieces this template SHIPS, as SVG text. No file on
 * disk and no downloaded art: the markup goes into the document as a
 * `data:image/svg+xml,` asset and m0saic rasterizes it at the cell's own
 * size, so the board is sharp from 480x270 to 4K.
 *
 * Every piece is drawn on a 100 x 100 square (the board's own square), in
 * one flat style: a light set with a dark outline and a dark set with a
 * light detail line, so both read on either square colour.
 */
import type { ChessPiece } from "./chess";
export declare const CHESS_BOARD_THEMES: readonly ["walnut", "green", "slate"];
export type ChessBoardTheme = (typeof CHESS_BOARD_THEMES)[number];
export declare const CHESS_PALETTES: Readonly<Record<ChessBoardTheme, {
    light: string;
    dark: string;
    lit: string;
}>>;
/** One piece's markup at (x, y) in board units (100 per square). */
export declare function chessPieceMarkup(p: ChessPiece, x: number, y: number): string;
/** A lone piece on a transparent 100 x 100 square - the one that slides. */
export declare function chessPieceSvg(p: ChessPiece): string;
/** Where square `sq` is drawn, in board units, for the side at the bottom. */
export declare function chessSquareXY(sq: number, flip: boolean): {
    x: number;
    y: number;
};
/**
 * A whole board: squares, the lit squares (the move being shown), and every
 * piece except the squares in `hide` (the piece that is about to slide).
 */
export declare function chessBoardSvg(board: ReadonlyArray<ChessPiece | null>, opts: {
    flip: boolean;
    theme: ChessBoardTheme;
    lit?: number[];
    hide?: number[];
}): string;
export declare function chessSvgUri(svg: string): string;
