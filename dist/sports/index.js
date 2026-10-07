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
/** Pack `sports`, in registry order (mirrors ./registry.ts). */
exports.sportsTemplates = [
    powerlifting_meet_recap_1.PowerliftingMeetRecapV1,
    swim_time_drop_card_1.SwimTimeDropCardV1,
    lap_telemetry_card_1.LapTelemetryCardV1,
    cubing_average_card_1.CubingAverageCardV1,
    chess_game_recap_1.ChessGameRecapV1,
];
// `export *` ONLY — see the note in src/index.ts.
__exportStar(require("./powerlifting-meet-recap/v1/powerlifting-meet-recap"), exports);
__exportStar(require("./swim-time-drop-card/v1/swim-time-drop-card"), exports);
__exportStar(require("./lap-telemetry-card/v1/lap-telemetry-card"), exports);
__exportStar(require("./cubing-average-card/v1/cubing-average-card"), exports);
__exportStar(require("./chess-game-recap/v1/chess-game-recap"), exports);
