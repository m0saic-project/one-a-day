"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budget = budget;
exports.textCell = textCell;
exports.widthOf = widthOf;
exports.fitLine = fitLine;
exports.wrapFit = wrapFit;
exports.ellipsize = ellipsize;
const template_utils_1 = require("@m0saic/template-utils");
/**
 * The text kit the shared pages and harness cards draw with: svg-rasterized
 * cells (the bundled deterministic font, no drawtext), measured fits, and a
 * word-wrap that survives a token wider than its box. Templates written by
 * the daily agent usually carry their own fitter (the og-card measures bold
 * against the bold file); this kit is for the repo's own chrome.
 */
/** The fit budget inside a cell: `cell * 0.94 - 2px` (the layout contract's rule). */
function budget(cellW) {
    return Math.max(8, Math.floor(cellW * 0.94 - 2));
}
/** One svg-rasterized text cell, aligned inside its rect. */
function textCell(opts) {
    var _a;
    return {
        type: "text",
        rasterizer: "svg",
        renderMode: { kind: "image" },
        layers: [
            {
                content: { kind: "literal", text: opts.text },
                style: { fontSize: opts.fontSize, fontColor: opts.color, ...(opts.bold ? { fontWeight: "bold" } : {}) },
                placement: { hAlign: opts.hAlign, vAlign: (_a = opts.vAlign) !== null && _a !== void 0 ? _a : "middle" },
            },
        ],
        editor: { owner: "template", label: opts.label },
    };
}
/** Measured width of one block, in the weight that will be drawn. */
function widthOf(text, fontSize, bold = false) {
    var _a;
    const fontPath = bold ? (_a = (0, template_utils_1.resolveFontFile)({ weight: "bold" })) === null || _a === void 0 ? void 0 : _a.path : undefined;
    return (0, template_utils_1.measureText)(text, { fontSize, ...(fontPath ? { fontPath } : {}) }).width;
}
/** Shrink one line until it fits `maxW` (never wraps); returns the size. */
function fitLine(text, maxW, maxPx, minPx, bold = false) {
    let px = Math.round(maxPx);
    while (px > minPx && widthOf(text, px, bold) > maxW)
        px = Math.max(minPx, Math.round(px * 0.92));
    return px;
}
/**
 * Word-wrap that also survives a token wider than the box (a URL, a long
 * flag): `wrapMeasured` never breaks a word, so such a token would run off
 * the edge. Over-long tokens are chunked by character to `chunkW` first.
 */
function wrapFit(text, fontSize, maxW, chunkW = maxW) {
    const width = (t) => (0, template_utils_1.measureText)(t, { fontSize }).width;
    const words = text.split(" ").filter((w) => w.length > 0).flatMap((w) => {
        if (width(w) <= chunkW)
            return [w];
        const chunks = [];
        let cur = "";
        for (const ch of w) {
            if (cur.length > 0 && width(cur + ch) > chunkW) {
                chunks.push(cur);
                cur = ch;
            }
            else
                cur += ch;
        }
        if (cur.length > 0)
            chunks.push(cur);
        return chunks;
    });
    return (0, template_utils_1.wrapMeasured)(words.join(" "), fontSize, maxW);
}
/** Cut `text` to fit `maxW` at `fontSize` with a trailing "..." - the last resort after shrinking. */
function ellipsize(text, fontSize, maxW, bold = false) {
    if (widthOf(text, fontSize, bold) <= maxW)
        return text;
    let t = text;
    while (t.length > 1 && widthOf(t + "...", fontSize, bold) > maxW)
        t = t.slice(0, -1);
    return t.trimEnd() + "...";
}
