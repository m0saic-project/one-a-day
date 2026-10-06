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
exports.socialTemplates = void 0;
const testimonial_proof_card_1 = require("./testimonial-proof-card/v1/testimonial-proof-card");
const episode_audiogram_1 = require("./episode-audiogram/v1/episode-audiogram");
/** Pack `social`, in registry order (mirrors ./registry.ts). */
exports.socialTemplates = [
    testimonial_proof_card_1.TestimonialProofCardV1,
    episode_audiogram_1.EpisodeAudiogramV1,
];
// `export *` ONLY — see the note in src/index.ts.
__exportStar(require("./testimonial-proof-card/v1/testimonial-proof-card"), exports);
__exportStar(require("./episode-audiogram/v1/episode-audiogram"), exports);
