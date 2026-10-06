"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEXT_EM = exports.CONTRACT_CANVASES = void 0;
exports.textFitsAll = textFitsAll;
exports.textFitsMeasured = textFitsMeasured;
exports.withLayoutIntent = withLayoutIntent;
exports.mergeTextFits = mergeTextFits;
exports.layoutIntentOf = layoutIntentOf;
exports.textLabelsOf = textLabelsOf;
exports.sweepLayout = sweepLayout;
exports.checkLayoutIntent = checkLayoutIntent;
const template_utils_1 = require("@m0saic/template-utils");
/** The canvases the convention sweeps: the 7-canvas set from the authoring contract. */
exports.CONTRACT_CANVASES = [
    [1920, 1080],
    [1280, 720],
    [1080, 1920],
    [1080, 1080],
    [3840, 2160],
    [640, 360],
    [480, 270],
];
/**
 * Calibrated `charWidthEm` rulers for the BUNDLED font (Roboto, the svg
 * rasterizer's): measured width / (em-units x fontSize) over the repo's copy
 * on 2026-09-20 - prose 0.42-0.47, ALL-CAPS 0.57-0.59, URLs ~0.52 - plus a
 * ~12% margin. The contract's default 0.72 is for an unknown font and flags
 * a full-width Roboto line that fits; `textFitsMeasured` is exact when the
 * template measured the block itself.
 */
exports.TEXT_EM = { prose: 0.52, caps: 0.66, url: 0.6 };
/** `textFits` for every label in `labels` - the one constraint every text needs. */
function textFitsAll(labels, opts) {
    return labels.map((label) => ({ label, textFits: { ...(opts !== null && opts !== void 0 ? opts : {}) } }));
}
/**
 * `textFits` calibrated to a MEASURED block. The contract's ruler estimates
 * `em-units x fontSize x charWidthEm` with a coarse 0.72 default (Roboto
 * prose is nearer 0.46), so a text that was fitted against the real font at
 * the full box width would be flagged for clipping it cannot do. Hand the
 * contract the measured ratio (+2%) instead: the check then compares the
 * TRUE width with the REALIZED box - which is the crush it exists to catch.
 */
function textFitsMeasured(label, text, fontSize, measuredWidthPx) {
    const longest = text.split("\n").reduce((m, l) => Math.max(m, (0, template_utils_1.textEmUnits)(l)), 0);
    const em = longest > 0 && fontSize > 0 ? (measuredWidthPx / (longest * fontSize)) * 1.02 : 0.72;
    return { label, textFits: { charWidthEm: Math.max(0.05, Math.min(2, em)), padPx: 0 } };
}
/**
 * `withLayoutContract` (the debug tripwire) + the intent stamp (always).
 * Return this from `render()` in place of the bare document.
 */
function withLayoutIntent(doc, ctx, opts) {
    var _a;
    const intent = {
        constraints: mergeTextFits(opts.constraints),
        ...(opts.relations && opts.relations.length > 0 ? { relations: opts.relations } : {}),
        ...(opts.flatten !== undefined ? { flatten: opts.flatten } : {}),
    };
    const checked = (0, template_utils_1.withLayoutContract)(doc, ctx, {
        templateId: opts.templateId,
        constraints: intent.constraints,
        relations: opts.relations,
        flatten: opts.flatten,
        debug: opts.debug === true,
    });
    return { ...checked, editor: { ...((_a = checked.editor) !== null && _a !== void 0 ? _a : {}), layoutIntent: intent } };
}
/**
 * A label is one-to-MANY: a `textFits` constraint applies to EVERY node that
 * carries its label. Several measured constraints on one label (five
 * `phase-meta` cells with different copy) would each be checked against all
 * five - the widest calibration wins, so a narrower sibling could be flagged
 * for a clip it cannot do. Merge them: one `textFits` per label, the WIDEST
 * em (the check stays a true upper bound), other constraints untouched.
 * Prefer unique labels for cells with different copy; this is the safety net.
 */
function mergeTextFits(constraints) {
    var _a, _b, _c, _d, _e, _f;
    const widest = new Map();
    const out = [];
    for (const c of constraints) {
        if (!c.textFits) {
            out.push(c);
            continue;
        }
        const prev = widest.get(c.label);
        if (!prev) {
            const copy = { ...c, textFits: { ...c.textFits } };
            widest.set(c.label, copy);
            out.push(copy);
            continue;
        }
        const em = Math.max((_b = (_a = prev.textFits) === null || _a === void 0 ? void 0 : _a.charWidthEm) !== null && _b !== void 0 ? _b : 0.72, (_c = c.textFits.charWidthEm) !== null && _c !== void 0 ? _c : 0.72);
        const pad = Math.max((_e = (_d = prev.textFits) === null || _d === void 0 ? void 0 : _d.padPx) !== null && _e !== void 0 ? _e : 2, (_f = c.textFits.padPx) !== null && _f !== void 0 ? _f : 2);
        prev.textFits = { charWidthEm: em, padPx: pad };
    }
    return out;
}
/** The stamped intent of a rendered document, or null when the template declared none. */
function layoutIntentOf(doc) {
    var _a;
    const v = (_a = doc.editor) === null || _a === void 0 ? void 0 : _a.layoutIntent;
    if (!v || typeof v !== "object" || !Array.isArray(v.constraints))
        return null;
    return v;
}
/** Labels of every `type: "text"` source (tagged or not - untagged ones come back as null). */
function textLabelsOf(doc) {
    var _a;
    return ((_a = doc.sources) !== null && _a !== void 0 ? _a : [])
        .filter((s) => s && s.type === "text")
        .map((s) => { var _a, _b; return (_b = (_a = s.editor) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : null; });
}
/**
 * Render at every contract canvas and assert the stamped intent holds -
 * the sweep every template's test runs. `variants` are prop overrides worth
 * stressing (long copy, emptied rows, every closed-set value).
 */
async function sweepLayout(render, templateId, props, makeCtx, canvases = exports.CONTRACT_CANVASES) {
    for (const [w, h] of canvases) {
        const ctx = makeCtx(w, h);
        const doc = await render(props, ctx);
        const intent = layoutIntentOf(doc);
        if (!intent)
            throw new Error(`${templateId}: render at ${w}x${h} carries no layout intent (return withLayoutIntent(...) from render)`);
        (0, template_utils_1.assertLayout)(doc, ctx, templateId, { constraints: intent.constraints, relations: intent.relations, flatten: intent.flatten });
    }
}
/** The pure evaluation of a document against its own stamped intent. */
function checkLayoutIntent(doc, canvasW, canvasH) {
    const intent = layoutIntentOf(doc);
    if (!intent)
        return null;
    return (0, template_utils_1.checkLayout)(doc, { canvasW, canvasH, constraints: intent.constraints, relations: intent.relations, flatten: intent.flatten });
}
