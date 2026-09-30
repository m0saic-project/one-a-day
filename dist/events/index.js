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
exports.eventsTemplates = void 0;
const talk_timer_1 = require("./talk-timer/v1/talk-timer");
const bird_walk_sightings_1 = require("./bird-walk-sightings/v1/bird-walk-sightings");
const homebrew_serving_card_1 = require("./homebrew-serving-card/v1/homebrew-serving-card");
/** Pack `events`, in registry order (mirrors ./registry.ts). */
exports.eventsTemplates = [
    talk_timer_1.TalkTimerV1,
    bird_walk_sightings_1.BirdWalkSightingsV1,
    homebrew_serving_card_1.HomebrewServingCardV1,
];
// `export *` ONLY — see the note in src/index.ts.
__exportStar(require("./talk-timer/v1/talk-timer"), exports);
__exportStar(require("./bird-walk-sightings/v1/bird-walk-sightings"), exports);
__exportStar(require("./homebrew-serving-card/v1/homebrew-serving-card"), exports);
