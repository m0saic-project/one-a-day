"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sportsTemplates = void 0;
const powerlifting_meet_recap_1 = require("./powerlifting-meet-recap/v1/powerlifting-meet-recap");
const swim_time_drop_card_1 = require("./swim-time-drop-card/v1/swim-time-drop-card");
const lap_telemetry_card_1 = require("./lap-telemetry-card/v1/lap-telemetry-card");
const cubing_average_card_1 = require("./cubing-average-card/v1/cubing-average-card");
const chess_game_recap_1 = require("./chess-game-recap/v1/chess-game-recap");
const chess_game_recap_2 = require("./chess-game-recap/v2/chess-game-recap");
const chess_game_recap_3 = require("./chess-game-recap/v3/chess-game-recap");
/**
 * Deprecation without editing a frozen file: a shipped vN never changes, so
 * the flag goes on the copy this pack hands to hosts (`templates`), which is
 * what Mosaic Desktop, the CLI and the manifest read.
 */
const retired = (t, replacement, since, reason) => ({ ...t, deprecated: { replacement, since, reason } });
/** Pack `sports`, in registry order (mirrors ./registry.ts). */
exports.sportsTemplates = [
    powerlifting_meet_recap_1.PowerliftingMeetRecapV1,
    swim_time_drop_card_1.SwimTimeDropCardV1,
    lap_telemetry_card_1.LapTelemetryCardV1,
    cubing_average_card_1.CubingAverageCardV1,
    retired(chess_game_recap_1.ChessGameRecapV1, "@one-a-day/sports/chess-game-recap/v3", "2026-10-07", "v1 (claude-haiku) shows six typed fields and no board; v2 and v3 read the PGN, replay the game and play its key moments."),
    retired(chess_game_recap_2.ChessGameRecapV2, "@one-a-day/sports/chess-game-recap/v3", "2026-10-07", "v2 draws each board as one whole-board image; v3 builds it cell by cell (64 squares, every piece its own rect) and adds a platform knob."),
    chess_game_recap_3.ChessGameRecapV3,
];
// `export *` ONLY — see the note in src/index.ts.
__exportStar(require("./powerlifting-meet-recap/v1/powerlifting-meet-recap"), exports);
__exportStar(require("./swim-time-drop-card/v1/swim-time-drop-card"), exports);
__exportStar(require("./lap-telemetry-card/v1/lap-telemetry-card"), exports);
__exportStar(require("./cubing-average-card/v1/cubing-average-card"), exports);
__exportStar(require("./chess-game-recap/v1/chess-game-recap"), exports);
__exportStar(require("./chess-game-recap/v2/chess-game-recap"), exports);
__exportStar(require("./chess-game-recap/v3/chess-game-recap"), exports);
