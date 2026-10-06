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
exports.communityTemplates = void 0;
const qsl_card_1 = require("./qsl-card/v1/qsl-card");
const weekly_run_report_1 = require("./weekly-run-report/v1/weekly-run-report");
/** Pack `community`, in registry order (mirrors ./registry.ts). */
exports.communityTemplates = [
    qsl_card_1.QslCardV1,
    weekly_run_report_1.WeeklyRunReportV1,
];
// `export *` ONLY — see the note in src/index.ts.
__exportStar(require("./qsl-card/v1/qsl-card"), exports);
__exportStar(require("./weekly-run-report/v1/weekly-run-report"), exports);
