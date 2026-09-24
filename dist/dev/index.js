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
exports.devTemplates = void 0;
const og_card_1 = require("./og-card/v1/og-card");
const bench_delta_1 = require("./bench-delta/v1/bench-delta");
const app_store_screenshot_frame_1 = require("./app-store-screenshot-frame/v1/app-store-screenshot-frame");
/** Pack `dev`, in registry order (mirrors ./registry.ts). */
exports.devTemplates = [
    og_card_1.OgCardV1,
    bench_delta_1.BenchDeltaV1,
    app_store_screenshot_frame_1.AppStoreScreenshotFrameV1,
];
// `export *` ONLY — see the note in src/index.ts.
__exportStar(require("./og-card/v1/og-card"), exports);
__exportStar(require("./bench-delta/v1/bench-delta"), exports);
__exportStar(require("./app-store-screenshot-frame/v1/app-store-screenshot-frame"), exports);
