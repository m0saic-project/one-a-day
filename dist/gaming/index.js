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
exports.gamingTemplates = void 0;
const speedrun_pb_recap_1 = require("./speedrun-pb-recap/v1/speedrun-pb-recap");
const crossword_grid_card_1 = require("./crossword-grid-card/v1/crossword-grid-card");
const vatsim_monthly_log_1 = require("./vatsim-monthly-log/v1/vatsim-monthly-log");
const tenxten_challenge_card_1 = require("./tenxten-challenge-card/v1/tenxten-challenge-card");
const osu_scorepost_card_1 = require("./osu-scorepost-card/v1/osu-scorepost-card");
const commander_deck_spotlight_1 = require("./commander-deck-spotlight/v1/commander-deck-spotlight");
const wh40k_roster_card_1 = require("./wh40k-roster-card/v1/wh40k-roster-card");
const typing_pb_card_1 = require("./typing-pb-card/v1/typing-pb-card");
/** Pack `gaming`, in registry order (mirrors ./registry.ts). */
exports.gamingTemplates = [
    speedrun_pb_recap_1.SpeedrunPbRecapV1,
    crossword_grid_card_1.CrosswordGridCardV1,
    vatsim_monthly_log_1.VatsimMonthlyLogV1,
    tenxten_challenge_card_1.TenxtenChallengeCardV1,
    osu_scorepost_card_1.OsuScorepostCardV1,
    commander_deck_spotlight_1.CommanderDeckSpotlightV1,
    wh40k_roster_card_1.Wh40kRosterCardV1,
    typing_pb_card_1.TypingPbCardV1,
];
// `export *` ONLY — see the note in src/index.ts.
__exportStar(require("./speedrun-pb-recap/v1/speedrun-pb-recap"), exports);
__exportStar(require("./crossword-grid-card/v1/crossword-grid-card"), exports);
__exportStar(require("./vatsim-monthly-log/v1/vatsim-monthly-log"), exports);
__exportStar(require("./tenxten-challenge-card/v1/tenxten-challenge-card"), exports);
__exportStar(require("./osu-scorepost-card/v1/osu-scorepost-card"), exports);
__exportStar(require("./commander-deck-spotlight/v1/commander-deck-spotlight"), exports);
__exportStar(require("./wh40k-roster-card/v1/wh40k-roster-card"), exports);
__exportStar(require("./typing-pb-card/v1/typing-pb-card"), exports);
