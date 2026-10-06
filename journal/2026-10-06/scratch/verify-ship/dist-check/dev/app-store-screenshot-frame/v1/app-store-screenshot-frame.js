"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStoreScreenshotFrameV1 = void 0;
exports.layoutAppStoreFrame = layoutAppStoreFrame;
exports.appStoreFrameContract = appStoreFrameContract;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/dev/app-store-screenshot-frame/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_HEADLINE = "Plan your day in one tap";
const DEFAULT_SUBHEAD = "Tasks, focus and calendar - together.";
const DEFAULT_APP_NAME = "DAYLIGHT";
const DEFAULT_ACCENT = "#6558f5";
const DEFAULT_BACKGROUND = "#f3f0e8";
const DEVICE_ASPECT = 9 / 19.5;
const MIN_TEXT_PX = 8;
const INSET_BASIS = 90;
const propsSchema = (0, template_utils_1.definePropsSchema)({
    sourceIds: {
        type: "media[]",
        required: false,
        description: "Zero or one image capture. Empty renders the built-in planner demo; the capture is contained, never cropped or stretched.",
        meta: { control: { multiple: false, picker: "file", accept: ["image"] }, ui: { label: "Capture", order: 1, primary: true } },
    },
    headline: {
        type: "string",
        required: true,
        description: "Localized product promise, one to three measured lines (72 characters maximum).",
        meta: { ui: { label: "Headline", order: 2, primary: true } },
    },
    subhead: {
        type: "string",
        required: false,
        description: "Optional supporting copy, one or two measured lines. Empty removes the row.",
        meta: { control: { placeholder: "none" }, ui: { label: "Subhead", order: 3 } },
    },
    appName: {
        type: "string",
        required: true,
        description: "App lockup, one line (24 characters maximum); its first ASCII letter or digit becomes the mark.",
        meta: { ui: { label: "App name", order: 4 } },
    },
    slideNumber: {
        type: "number",
        required: false,
        description: "Current slide, 1 to 99.",
        meta: { constraints: { min: 1, max: 99 }, ui: { label: "Slide", order: 5 } },
    },
    slideCount: {
        type: "number",
        required: false,
        description: "Total slides, 1 to 99 and not less than the current slide.",
        meta: { constraints: { min: 1, max: 99 }, ui: { label: "Slide count", order: 6 } },
    },
    accentColor: {
        type: "string",
        required: false,
        description: "Accent for the top bar, app mark and demo screen, as #rrggbb.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 7 } },
    },
    backgroundColor: {
        type: "string",
        required: false,
        description: "Opaque canvas surface as #rrggbb.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_BACKGROUND }, ui: { label: "Background", order: 8 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check text fit, chrome bands, mark shape and device placement, then draw the contract.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
function cleanText(value, fallback, name, max, allowEmpty) {
    if (value === undefined)
        return fallback;
    if (typeof value !== "string")
        throw new Error(`${ID}: ${name} must be a string.`);
    const text = value.trim().replace(/\s+/g, " ");
    if (!allowEmpty && text.length === 0)
        throw new Error(`${ID}: ${name} must not be empty.`);
    if (text.length > max)
        throw new Error(`${ID}: ${name} must be at most ${max} characters (got ${text.length}).`);
    return text;
}
function color(value, fallback, name) {
    const v = value === undefined ? fallback : value;
    if (typeof v !== "string" || !HEX.test(v))
        throw new Error(`${ID}: ${name} ${JSON.stringify(v)} must be #rrggbb.`);
    return v;
}
function integer(value, fallback, name) {
    const v = value === undefined ? fallback : value;
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 99) {
        throw new Error(`${ID}: ${name} must be an integer from 1 to 99.`);
    }
    return v;
}
function relativeLuminance(hex) {
    const c = (offset) => {
        const v = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
function onColor(hex) {
    return (relativeLuminance(hex) > 0.4 ? "#11131a" : "#ffffff");
}
function mix(a, b, amount) {
    const channel = (offset) => Math.round(parseInt(a.slice(offset, offset + 2), 16) * (1 - amount) + parseInt(b.slice(offset, offset + 2), 16) * amount);
    return (`#${[1, 3, 5].map((offset) => channel(offset).toString(16).padStart(2, "0")).join("")}`);
}
function budget(cellW) {
    return Math.max(8, Math.floor(cellW * 0.94 - 2));
}
/** Measured word-wrap with a character fallback for locale strings containing a token wider than the box. */
function fitCopy(text, boxW, boxH, opts) {
    var _a;
    const fontPath = opts.bold ? (_a = (0, template_utils_1.resolveFontFile)({ weight: "bold" })) === null || _a === void 0 ? void 0 : _a.path : undefined;
    const measure = (s, fontSize) => (0, template_utils_1.measureText)(s, { fontSize, ...(fontPath ? { fontPath } : {}) });
    const wordsAt = (fontSize) => text.split(" ").filter(Boolean).flatMap((word) => {
        if (measure(word, fontSize).width <= boxW)
            return [word];
        const chunks = [];
        let chunk = "";
        for (const ch of word) {
            if (chunk.length > 0 && measure(chunk + ch, fontSize).width > boxW) {
                chunks.push(chunk);
                chunk = ch;
            }
            else
                chunk += ch;
        }
        if (chunk.length > 0)
            chunks.push(chunk);
        return chunks;
    });
    const wrap = (fontSize) => {
        const lines = [];
        let line = "";
        for (const word of wordsAt(fontSize)) {
            const next = line ? `${line} ${word}` : word;
            if (!line || measure(next, fontSize).width <= boxW)
                line = next;
            else {
                lines.push(line);
                line = word;
            }
        }
        if (line)
            lines.push(line);
        return lines;
    };
    const attempt = (fontSize) => {
        const lines = wrap(fontSize);
        if (lines.length === 0 || lines.length > opts.maxLines)
            return null;
        const block = lines.join("\n");
        const m = measure(block, fontSize);
        return m.width <= boxW && m.height <= boxH ? { text: block, fontSize, width: m.width, height: m.height, lines: lines.length } : null;
    };
    let lo = MIN_TEXT_PX;
    let hi = Math.max(lo, Math.round(opts.maxPx));
    let best = attempt(lo);
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const candidate = attempt(mid);
        if (candidate) {
            best = candidate;
            lo = mid + 1;
        }
        else
            hi = mid - 1;
    }
    if (!best) {
        const lines = wrap(MIN_TEXT_PX);
        const block = lines.join("\n");
        const m = measure(block, MIN_TEXT_PX);
        return { text: block, fontSize: MIN_TEXT_PX, width: m.width, height: m.height, lines: lines.length };
    }
    return best;
}
function textSource(placed, colorValue, label, opts = {}) {
    var _a;
    return (0, template_utils_1.tag)({
        type: "text",
        rasterizer: "svg",
        renderMode: { kind: "image" },
        layers: [{
                content: { kind: "literal", text: placed.fit.text },
                style: { fontSize: placed.fit.fontSize, fontColor: colorValue, ...(opts.bold ? { fontWeight: "bold" } : {}) },
                placement: { hAlign: (_a = opts.align) !== null && _a !== void 0 ? _a : "left", vAlign: "middle" },
            }],
        editor: { owner: "template" },
    }, label);
}
function fitPlaced(text, rect, maxPx, maxLines, bold = false) {
    return { rect, fit: fitCopy(text, budget(rect.w), Math.max(8, Math.floor(rect.h * 0.94 - 2)), { maxPx, maxLines, bold }) };
}
/** Pure aspect-aware geometry. Exported so tests can assert containment without reverse-engineering m0. */
function layoutAppStoreFrame(text, W, H) {
    const S = Math.min(W, H);
    const orientation = W / H > 1.15 ? "landscape" : H / W > 1.15 ? "portrait" : "square";
    const margin = Math.max(6, Math.round(S * 0.045));
    const gap = Math.max(5, Math.round(S * 0.028));
    const accentH = Math.max(3, Math.round(S * 0.008));
    const accentBar = { x: 0, y: 0, w: W, h: accentH };
    const content = { x: margin, y: accentH + margin, w: W - 2 * margin, h: H - accentH - 2 * margin };
    let copyRegion;
    let stage;
    if (orientation === "landscape") {
        const copyW = Math.round(content.w * 0.42);
        copyRegion = { x: content.x, y: content.y, w: copyW, h: content.h };
        stage = { x: copyRegion.x + copyRegion.w + gap, y: content.y, w: content.w - copyW - gap, h: content.h };
    }
    else {
        const copyFrac = orientation === "portrait" ? 0.29 : 0.36;
        const copyH = Math.round(content.h * copyFrac);
        copyRegion = { x: content.x, y: content.y, w: content.w, h: copyH };
        stage = { x: content.x, y: copyRegion.y + copyRegion.h + gap, w: content.w, h: content.h - copyH - gap };
    }
    const headerH = Math.max(18, Math.min(Math.round(copyRegion.h * (orientation === "landscape" ? 0.16 : 0.2)), Math.round(S * 0.1)));
    const markSize = Math.max(16, Math.min(headerH, Math.round(S * 0.09)));
    const appMark = { x: copyRegion.x, y: copyRegion.y, w: markSize, h: markSize };
    const lockGap = Math.max(4, Math.round(markSize * 0.25));
    const slideW = Math.max(34, Math.min(Math.round(copyRegion.w * 0.2), Math.round(S * 0.22)));
    const appRect = { x: appMark.x + appMark.w + lockGap, y: copyRegion.y, w: Math.max(20, copyRegion.w - appMark.w - lockGap - slideW - lockGap), h: markSize };
    const slideRect = { x: copyRegion.x + copyRegion.w - slideW, y: copyRegion.y, w: slideW, h: markSize };
    const copyGap = Math.max(4, Math.round(S * 0.018));
    const bodyY = copyRegion.y + headerH + copyGap;
    const bodyH = Math.max(20, copyRegion.y + copyRegion.h - bodyY);
    const subH = text.subhead ? Math.max(18, Math.round(bodyH * 0.3)) : 0;
    const headlineRect = { x: copyRegion.x, y: bodyY, w: copyRegion.w, h: Math.max(20, bodyH - subH - (text.subhead ? copyGap : 0)) };
    const subRect = text.subhead ? { x: copyRegion.x, y: headlineRect.y + headlineRect.h + copyGap, w: copyRegion.w, h: subH } : null;
    const shellPad = Math.max(4, Math.round(S * 0.018));
    const maxShellH = Math.max(20, stage.h - 2 * shellPad);
    const maxShellW = Math.max(10, stage.w - 2 * shellPad);
    const shellH = Math.max(20, Math.min(maxShellH, Math.floor(maxShellW / DEVICE_ASPECT)));
    const shellW = Math.max(10, Math.round(shellH * DEVICE_ASPECT));
    const deviceShell = {
        x: stage.x + Math.floor((stage.w - shellW) / 2),
        y: stage.y + Math.floor((stage.h - shellH) / 2),
        w: shellW,
        h: shellH,
    };
    const bezelX = Math.max(3, Math.round(shellW * 0.055));
    const bezelY = Math.max(3, Math.round(shellH * 0.026));
    const capture = { x: deviceShell.x + bezelX, y: deviceShell.y + bezelY, w: deviceShell.w - 2 * bezelX, h: deviceShell.h - 2 * bezelY };
    return {
        W, H, orientation, accentBar, copyRegion, stage, appMark,
        markLetter: fitPlaced(text.markLetter, appMark, markSize * 0.56, 1, true),
        appName: fitPlaced(text.appName, appRect, Math.min(markSize * 0.42, S * 0.034), 1, true),
        headline: fitPlaced(text.headline, headlineRect, Math.min(S * (orientation === "landscape" ? 0.09 : 0.078), headlineRect.h * 0.42), 3, true),
        subhead: subRect ? fitPlaced(text.subhead, subRect, Math.min(S * 0.037, subRect.h * 0.48), 2) : null,
        slideIndex: fitPlaced(text.slideIndex, slideRect, Math.min(markSize * 0.38, S * 0.031), 1, true),
        deviceShell,
        capture,
    };
}
function appStoreFrameContract(L) {
    const textConstraints = [
        (0, layout_1.textFitsMeasured)("mark-letter", L.markLetter.fit.text, L.markLetter.fit.fontSize, L.markLetter.fit.width),
        (0, layout_1.textFitsMeasured)("app-name", L.appName.fit.text, L.appName.fit.fontSize, L.appName.fit.width),
        (0, layout_1.textFitsMeasured)("headline", L.headline.fit.text, L.headline.fit.fontSize, L.headline.fit.width),
        (0, layout_1.textFitsMeasured)("slide-index", L.slideIndex.fit.text, L.slideIndex.fit.fontSize, L.slideIndex.fit.width),
        ...(L.subhead ? [(0, layout_1.textFitsMeasured)("subhead", L.subhead.fit.text, L.subhead.fit.fontSize, L.subhead.fit.width)] : []),
    ];
    return [
        ...textConstraints,
        { label: "accent-bar", minWidthFrac: 0.98, within: { yFrac: [0, 0.08] } },
        { label: "app-mark", aspect: 1, within: L.orientation === "landscape" ? { xFrac: [0, 0.48] } : { yFrac: [0, 0.4] } },
        { label: "device-shell", aspect: DEVICE_ASPECT, aspectTolerance: 0.012, within: L.orientation === "landscape" ? { xFrac: [0.38, 1], yFrac: [0.02, 0.98] } : { yFrac: [0.22, 1] } },
        { label: "capture" },
        { label: "headline", minWidthFrac: L.orientation === "landscape" ? 0.3 : 0.7, within: L.orientation === "landscape" ? { xFrac: [0, 0.48] } : { yFrac: [0, 0.42] } },
    ];
}
const WHY = {
    day: 5,
    date: "2026-09-24",
    agent: "codex",
    model: "gpt-5.6-sol",
    id: ID,
    title: "App Store Screenshot Frame",
    who: "Indie iOS and Android developers and small teams in r/iOSProgramming and the Fastlane automation community.",
    problem: [
        "A release turns one raw capture into branded screenshots for every screen, device and locale. One developer called making screenshots \"torture\" after spending three hours on a single release.",
        "At scale, five locales and three device sizes already make 15 sets; A/B and custom product-page variants pushed another developer beyond 60 files. Fastlane's worked example reaches 600 captures and reruns after each design update.",
    ],
    sources: [
        "https://www.reddit.com/r/iOSProgramming/comments/1tbsleb/how_do_you_manage_app_store_screenshots_at_scale/",
        "https://www.reddit.com/r/iOSProgramming/comments/1e9incq/making_app_screenshots_is_torture_any_tool/",
        "https://docs.fastlane.tools/actions/snapshot/",
        "https://www.reddit.com/r/iOSProgramming/comments/1f973og/whats_the_most_time_consuming_annoying_part_about/",
    ],
    solution: [
        "This template makes one deterministic PNG from a capture, localized headline, app name, sequence number and two colors. Portrait stacks copy over the device; landscape moves copy into a left rail.",
        "The decisive rule is contain, never crop: the complete capture sits inside a generic 9:19.5 shell, and an aspect mismatch exposes a quiet matte instead of stretching the UI. Empty input renders a finished planner demo for immediate inspection.",
    ],
    usage: {
        command: "m0saic make @one-a-day/dev/app-store-screenshot-frame/v1 --template-repo . -w 1080 -h 1920 --props @store-shot.json -o store-shot.png",
        try: [
            "sourceIds, headline and appName: replace only the release-specific inputs",
            "an empty subhead: the headline gets the copy region alone",
            "accentColor: #00d9ff with backgroundColor: #101218",
            "-w 1920 -h 1080: the same props become a deliberate landscape rail",
        ],
    },
    caveats: [
        "It does not capture a simulator, translate copy, upload files or guarantee current store-policy compliance.",
        "The shell is deliberately generic; it does not claim a phone model or platform.",
        "One render makes one framed image, not every store-mandated size.",
    ],
    timeline: {
        source: "runner",
        phases: [
            { name: "scout", startMs: 0, durMs: 228705, calls: 34, tokens: 1805858, costUsd: 1.37, tools: "shell 27, web_search 5, edit 2" },
            { name: "plan", startMs: 228730, durMs: 347778, calls: 37, tokens: 3733902, costUsd: 2.74, tools: "shell 34, edit 3" },
            { name: "build (2)", startMs: 1712863, durMs: 3730, costUsd: 0, status: "error" },
            { name: "build (3)", startMs: 1716609, durMs: 3007, costUsd: 0, status: "error" },
            { name: "build", startMs: 2149511, durMs: 306169, calls: 60, tokens: 2323292, costUsd: 1.7, tools: "shell 50, edit 10" },
            { name: "critique", startMs: 2455699, durMs: 116351, calls: 13, tokens: 525260, costUsd: 0.42, tools: "shell 11, edit 2" },
            { name: "ship", startMs: 2572091, durMs: 541742, calls: 56, tokens: 3399447, costUsd: 2.47, tools: "shell 54, edit 2" },
        ],
        costBasis: "estimated",
        pricedAt: "2026-09-20",
    },
};
exports.AppStoreScreenshotFrameV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-09-24 · App Store Screenshot Frame",
    version: 1,
    description: "Turn one mobile capture and localized copy into a deterministic, generic device-framed store PNG without cropping the UI.",
    capabilities: { tier: "core" },
    tags: ["dev", "2026-09-24", "day-005", "app-store", "screenshots", "localization", "mobile", "release", "still"],
    outputHints: {
        width: 1080,
        height: 1920,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Opaque PNG; portrait 1080x1920 is primary, with deliberate square and landscape layouts.",
    },
    propsSchema,
    defaultProps: {
        sourceIds: [],
        headline: DEFAULT_HEADLINE,
        subhead: DEFAULT_SUBHEAD,
        appName: DEFAULT_APP_NAME,
        slideNumber: 1,
        slideCount: 5,
        accentColor: DEFAULT_ACCENT,
        backgroundColor: DEFAULT_BACKGROUND,
        debugLayout: false,
    },
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.AppStoreScreenshotFrameV1;
async function render(props, ctx) {
    var _a, _b, _c;
    const headline = cleanText(props.headline, DEFAULT_HEADLINE, "headline", 72, false);
    const subhead = cleanText(props.subhead, DEFAULT_SUBHEAD, "subhead", 96, true);
    const appName = cleanText(props.appName, DEFAULT_APP_NAME, "appName", 24, false);
    const markLetter = ((_b = (_a = appName.match(/[A-Za-z0-9]/)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "").toUpperCase();
    if (!markLetter)
        throw new Error(`${ID}: appName must contain an ASCII letter or digit for the app mark.`);
    const slideNumber = integer(props.slideNumber, 1, "slideNumber");
    const slideCount = integer(props.slideCount, 5, "slideCount");
    if (slideNumber > slideCount)
        throw new Error(`${ID}: slideNumber ${slideNumber} must not exceed slideCount ${slideCount}.`);
    const accent = color(props.accentColor, DEFAULT_ACCENT, "accentColor");
    const background = color(props.backgroundColor, DEFAULT_BACKGROUND, "backgroundColor");
    if (props.sourceIds !== undefined && !Array.isArray(props.sourceIds))
        throw new Error(`${ID}: sourceIds must be an array.`);
    const sourceIds = ((_c = props.sourceIds) !== null && _c !== void 0 ? _c : []).map((id) => String(id).trim()).filter(Boolean);
    if (sourceIds.length > 1)
        throw new Error(`${ID}: sourceIds accepts zero or one image (got ${sourceIds.length}).`);
    const sourceId = sourceIds[0];
    const assetId = sourceId ? (0, types_1.asAssetId)(sourceId) : undefined;
    if (sourceId) {
        const known = ctx.media[(0, types_1.asAssetId)(sourceId)];
        if (known && known.kind !== "image")
            throw new Error(`${ID}: sourceIds[0] must be an image (got ${known.kind}).`);
    }
    const W = Math.max(1, Math.round(ctx.target.width));
    const H = Math.max(1, Math.round(ctx.target.height));
    const slideIndex = `${String(slideNumber).padStart(2, "0")}/${String(slideCount).padStart(2, "0")}`;
    const L = layoutAppStoreFrame({ headline, subhead, appName, slideIndex, markLetter }, W, H);
    const ink = onColor(background);
    const muted = mix(ink, background, 0.42);
    const shell = (relativeLuminance(background) > 0.35 ? "#171922" : "#e9e9ef");
    const matte = mix(accent, background, 0.82);
    const screenSurface = mix(background, "#ffffff", relativeLuminance(background) > 0.35 ? 0.38 : 0.08);
    const pieces = [];
    const piece = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    const rounded = (fill, rect, radius) => (0, template_utils_1.makeColorTile)(fill, { mask: { kind: "inline-mask", ...(0, dsl_stdlib_1.roundedRectMask)(rect.w, rect.h, radius) } });
    piece(L.accentBar, 1, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accent), "accent-bar"), "accentColor"));
    piece(L.appMark, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)(rounded(accent, L.appMark, Math.max(3, Math.round(L.appMark.w * 0.22))), "app-mark"), "accentColor"));
    piece(L.markLetter.rect, 3, textSource(L.markLetter, onColor(accent), "mark-letter", { bold: true, align: "center" }));
    piece(L.appName.rect, 3, (0, template_utils_1.bindProp)(textSource(L.appName, ink, "app-name", { bold: true }), "appName"));
    piece(L.headline.rect, 3, (0, template_utils_1.bindProp)(textSource(L.headline, ink, "headline", { bold: true }), "headline"));
    if (L.subhead)
        piece(L.subhead.rect, 3, (0, template_utils_1.bindProp)(textSource(L.subhead, muted, "subhead"), "subhead"));
    piece(L.slideIndex.rect, 3, (0, template_utils_1.bindProps)(textSource(L.slideIndex, accent, "slide-index", { bold: true, align: "right" }), [{ propKey: "slideNumber" }, { propKey: "slideCount" }]));
    piece(L.deviceShell, 1, (0, template_utils_1.tag)(rounded(shell, L.deviceShell, Math.max(5, Math.round(L.deviceShell.w * 0.11))), "device-shell"));
    const captureBase = (0, template_utils_1.bindProp)((0, template_utils_1.tag)(rounded(matte, L.capture, Math.max(3, Math.round(L.capture.w * 0.075))), "capture"), "sourceIds", 0);
    piece(L.capture, 2, captureBase);
    const assets = {};
    if (sourceId && assetId) {
        assets[assetId] = { kind: "file", path: sourceId, mediaType: "image" };
        const media = (0, template_utils_1.tag)({
            type: "media",
            mediaType: "image",
            assetId,
            placement: { fit: "contain" },
            mask: { kind: "inline-mask", ...(0, dsl_stdlib_1.roundedRectMask)(L.capture.w, L.capture.h, Math.max(3, Math.round(L.capture.w * 0.075))) },
            editor: { owner: "template" },
        }, "capture-media");
        piece(L.capture, 3, (0, template_utils_1.bindProp)(media, "sourceIds", 0));
    }
    else {
        // A shape-only planner demo: no fake platform chrome and no text that could
        // clip. Every element is real geometry inside the screen viewport.
        const cp = Math.max(4, Math.round(L.capture.w * 0.075));
        const inner = { x: L.capture.x + cp, y: L.capture.y + cp, w: L.capture.w - 2 * cp, h: L.capture.h - 2 * cp };
        const topH = Math.max(8, Math.round(inner.h * 0.095));
        const heroH = Math.max(12, Math.round(inner.h * 0.19));
        const uiGap = Math.max(3, Math.round(inner.w * 0.04));
        piece(inner, 3, rounded(screenSurface, inner, Math.max(2, Math.round(inner.w * 0.04))));
        const eyebrow = { x: inner.x, y: inner.y, w: Math.round(inner.w * 0.18), h: Math.max(3, Math.round(topH * 0.18)) };
        piece(eyebrow, 4, rounded(accent, eyebrow, 2));
        const hero = { x: inner.x, y: inner.y + topH, w: inner.w, h: heroH };
        piece(hero, 4, rounded(mix(accent, screenSurface, 0.18), hero, Math.max(3, Math.round(inner.w * 0.05))));
        const heroLine = { x: hero.x + uiGap, y: hero.y + uiGap, w: Math.round(hero.w * 0.34), h: Math.max(3, Math.round(hero.h * 0.13)) };
        piece(heroLine, 5, rounded(onColor(accent), heroLine, 2));
        const listY = hero.y + hero.h + uiGap;
        const rowH = Math.max(8, Math.floor((inner.y + inner.h - listY - 2 * uiGap) / 3));
        for (let i = 0; i < 3; i++) {
            const row = { x: inner.x, y: listY + i * (rowH + uiGap), w: inner.w, h: rowH };
            piece(row, 4, rounded(mix(ink, screenSurface, 0.91), row, Math.max(2, Math.round(rowH * 0.18))));
            const check = { x: row.x + uiGap, y: row.y + Math.round(row.h * 0.3), w: Math.max(4, Math.round(row.h * 0.4)), h: Math.max(4, Math.round(row.h * 0.4)) };
            piece(check, 5, rounded(i === 0 ? accent : mix(ink, screenSurface, 0.72), check, Math.max(2, Math.round(check.w * 0.28))));
            const line = { x: check.x + check.w + uiGap, y: row.y + Math.round(row.h * 0.39), w: Math.round(row.w * (0.48 + i * 0.1)), h: Math.max(3, Math.round(row.h * 0.12)) };
            piece(line, 5, rounded(mix(ink, screenSurface, 0.5), line, 2));
        }
    }
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces, basis: INSET_BASIS });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets,
        backgroundColor: background,
        sources: placed.sources,
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints: appStoreFrameContract(L), debug: props.debugLayout === true });
}
