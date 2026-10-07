/**
 * `@one-a-day/sports/chess-game-recap/v1` — shareable game recap card for chess.
 *
 * ONE CONCEPT: render opening name, result (colored icon + label), time control,
 * and rating change as a professional recap card that shares better than a screenshot.
 *
 * The rule that bites: chess-specific UI conventions (result colors: green/red/gray)
 * and tight text fitting across seven canvases from 640×360 to 3840×2160.
 */
export type ChessGameRecapProps = {
    /** The chess opening name displayed in the header. */
    opening?: string;
    /** The game result: win, loss, or draw. */
    result?: "win" | "loss" | "draw";
    /** The rating delta displayed (e.g., +32, -18, 0). */
    ratingChange?: number;
    /** The time control format (e.g., "10+5", "5+3", "1+0"). */
    timeControl?: string;
    /** The game date in ISO format (YYYY-MM-DD). */
    date?: string;
    /** The opponent or player name displayed in the footer. */
    opponentName?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export declare const ChessGameRecapV1: import("@m0saic/types").MosaicTemplate<ChessGameRecapProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default ChessGameRecapV1;
