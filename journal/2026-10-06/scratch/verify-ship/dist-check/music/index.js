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
exports.musicTemplates = void 0;
const radio_top_30_chart_1 = require("./radio-top-30-chart/v1/radio-top-30-chart");
/** Pack `music`, in registry order (mirrors ./registry.ts). */
exports.musicTemplates = [
    radio_top_30_chart_1.RadioTop30ChartV1,
];
// `export *` ONLY — see the note in src/index.ts.
__exportStar(require("./radio-top-30-chart/v1/radio-top-30-chart"), exports);
