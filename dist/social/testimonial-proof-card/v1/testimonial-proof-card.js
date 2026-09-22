"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialProofCardV1 = void 0;
exports.layoutTestimonialProofCard = layoutTestimonialProofCard;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/social/testimonial-proof-card/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
const ASCII = /^[\x20-\x7e]*$/;
const MIN_PX = 8;
const DEFAULT_QUOTE = "They listened to what we needed and left the garden looking better than we imagined.";
const DEFAULT_NAME = "Maya R.";
const DEFAULT_DETAIL = "Homeowner, Brookdale";
const DEFAULT_SERVICE = "Garden refresh";
const DEFAULT_BUSINESS = "Northline Gardens";
const DEFAULT_SOURCE = "Customer review - verify source";
const DEFAULT_ACCENT = "#1f7a5a";
const PRESETS = {
    light: { page: "#e8eee9", card: "#fffdf7", ink: "#18332b", muted: "#587066", line: "#d7dfd8" },
    dark: { page: "#10231f", card: "#19362e", ink: "#f5f1e7", muted: "#b6c7bc", line: "#426157" },
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    quote: { type: "string", required: true, description: "Selected customer excerpt. It wraps into two to five measured lines; shorten it if it cannot fit.", meta: { ui: { label: "Selected quote", order: 1, primary: true } } },
    customerName: { type: "string", required: false, description: "Customer attribution beside the initials mark.", meta: { control: { placeholder: DEFAULT_NAME }, ui: { label: "Customer name", order: 2 } } },
    customerDetail: { type: "string", required: false, description: "Optional role, location, or customer context. Empty removes this row.", meta: { control: { placeholder: "none" }, ui: { label: "Customer detail", order: 3 } } },
    service: { type: "string", required: false, description: "Optional service chip. Empty removes this row.", meta: { control: { placeholder: "none" }, ui: { label: "Service", order: 4 } } },
    rating: { type: "number", required: false, description: "Rating from 1 to 5. The stars and numeric label always agree.", meta: { constraints: { min: 1, max: 5 }, ui: { label: "Rating", order: 5 } } },
    businessName: { type: "string", required: false, description: "Business identity in the card header.", meta: { control: { placeholder: DEFAULT_BUSINESS }, ui: { label: "Business name", order: 6 } } },
    sourceLabel: { type: "string", required: false, description: "On-card disclosure. Replace it with the real source after verifying the review.", meta: { control: { placeholder: DEFAULT_SOURCE }, ui: { label: "Source disclosure", order: 7 } } },
    accent: { type: "string", required: false, description: "Accent for the rule, badge, and service chip, as #rrggbb.", meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 8 } } },
    preset: { type: "string", required: false, description: "Hand-tuned paper and ink palette: light (default) or dark.", meta: { constraints: { oneOf: ["light", "dark"] }, ui: { label: "Preset", order: 9 } } },
    debugLayout: { type: "boolean", required: false, description: "Dev-only: draw and check the measured text and region contract.", meta: { ui: { label: "Debug layout", order: 99 } } },
});
function pickText(value, fallback, name, required = false) {
    if (value !== undefined && typeof value !== "string")
        throw new Error(`${ID}: ${name} must be a string.`);
    const text = (value === undefined ? fallback : value).trim().replace(/\s+/g, " ");
    if (!ASCII.test(text))
        throw new Error(`${ID}: ${name} must use ASCII characters so the bundled font can render it.`);
    if (required && text.length === 0)
        throw new Error(`${ID}: ${name} must not be empty.`);
    return text;
}
function pickColor(value, fallback, name) {
    const color = value === undefined || value.trim().length === 0 ? fallback : value.trim();
    if (!HEX.test(color))
        throw new Error(`${ID}: ${name} ${JSON.stringify(value)} must be #rrggbb.`);
    return color;
}
function initials(name) {
    const words = name.replace(/[^A-Za-z ]/g, " ").split(" ").filter(Boolean);
    return (words.map((word) => word[0]).join("").slice(0, 2) || "R").toUpperCase();
}
function fitCopy(text, boxW, boxH, opts) {
    var _a;
    const fontPath = opts.bold ? (_a = (0, template_utils_1.resolveFontFile)({ weight: "bold" })) === null || _a === void 0 ? void 0 : _a.path : undefined;
    const measure = (copy, px) => (0, template_utils_1.measureText)(copy, { fontSize: px, ...(fontPath ? { fontPath } : {}) });
    const wrap = (px) => {
        const lines = [];
        let line = "";
        for (const word of text.split(" ").filter(Boolean)) {
            const candidate = line.length === 0 ? word : `${line} ${word}`;
            if (measure(candidate, px).width <= boxW)
                line = candidate;
            else if (line.length > 0) {
                lines.push(line);
                line = word;
            }
            else
                return undefined;
        }
        if (line.length > 0)
            lines.push(line);
        return lines;
    };
    const attempt = (px) => {
        const lines = wrap(px);
        if (!lines || lines.length === 0 || lines.length > opts.maxLines)
            return undefined;
        const measured = measure(lines.join("\n"), px);
        return measured.width <= boxW && measured.height <= boxH ? { text: lines.join("\n"), fontSize: px, width: measured.width, height: measured.height, lines: lines.length } : undefined;
    };
    let lo = MIN_PX, hi = Math.max(MIN_PX, Math.round(opts.maxPx)), best = attempt(lo);
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2), found = attempt(mid);
        if (found) {
            best = found;
            lo = mid + 1;
        }
        else
            hi = mid - 1;
    }
    return best;
}
function requireFit(label, text, rect, maxPx, maxLines, bold = false) {
    const fit = fitCopy(text, Math.max(1, Math.floor(rect.w * 0.94 - 2)), Math.max(1, rect.h - 2), { maxPx, maxLines, bold });
    if (!fit)
        throw new Error(`${ID}: ${label} must fit its measured cell; shorten the selected excerpt or label.`);
    return { label, rect, fit };
}
function textCell(placed, color, hAlign, bold = false) {
    return { type: "text", rasterizer: "svg", renderMode: { kind: "image" }, layers: [{ content: { kind: "literal", text: placed.fit.text }, style: { fontSize: placed.fit.fontSize, fontColor: color, ...(bold ? { fontWeight: "bold" } : {}) }, placement: { hAlign, vAlign: "middle" } }], editor: { owner: "template", label: placed.label } };
}
function layoutTestimonialProofCard(text, W, H) {
    const S = Math.min(H, W * 0.75), margin = Math.max(8, Math.round(S * 0.07));
    const card = { w: Math.max(1, Math.min(W - 2 * margin, Math.round(S * 1.24))), h: Math.max(1, Math.min(H - 2 * margin, Math.round(S * 1.1))), x: 0, y: 0 };
    card.x = Math.round((W - card.w) / 2);
    card.y = Math.round((H - card.h) / 2);
    const pad = Math.max(7, Math.round(S * 0.07)), content = { x: card.x + pad, y: card.y + pad, w: card.w - 2 * pad, h: card.h - 2 * pad };
    if (content.w < 40 || content.h < 40)
        throw new Error(`${ID}: canvas is too small for the card.`);
    const headerH = Math.max(16, Math.round(content.h * 0.13)), ruleH = Math.max(2, Math.round(S * 0.009)), gap = Math.max(3, Math.round(S * 0.018));
    const quoteH = Math.max(30, Math.round(content.h * 0.45)), attrH = Math.max(30, Math.round(content.h * 0.25));
    const footerH = Math.max(14, content.h - headerH - ruleH - quoteH - attrH - 3 * gap);
    const header = { x: content.x, y: content.y, w: content.w, h: headerH };
    const accentRule = { x: content.x, y: header.y + header.h, w: content.w, h: ruleH };
    const quoteBox = { x: content.x, y: accentRule.y + accentRule.h + gap, w: content.w, h: quoteH };
    const attribution = { x: content.x, y: quoteBox.y + quoteBox.h + gap, w: content.w, h: attrH };
    const footer = { x: content.x, y: attribution.y + attribution.h + gap, w: content.w, h: footerH };
    const badgeW = Math.max(56, Math.round(content.w * 0.29));
    const business = requireFit("business name", text.businessName, { x: header.x, y: header.y, w: header.w - badgeW - gap, h: header.h }, S * 0.04, 1, true);
    const badge = requireFit("sample badge", "SAMPLE REVIEW", { x: header.x + header.w - badgeW, y: header.y, w: badgeW, h: header.h }, S * 0.026, 1, true);
    const quote = requireFit("quote", `"${text.quote}"`, quoteBox, S * 0.075, 5, true);
    const mark = Math.max(16, Math.min(attribution.h, Math.round(content.w * 0.18))), initialsBox = { x: attribution.x, y: attribution.y, w: mark, h: mark };
    const ratingW = Math.max(52, Math.round(content.w * 0.23)), personX = initialsBox.x + initialsBox.w + gap, personW = Math.max(30, attribution.w - initialsBox.w - ratingW - 2 * gap);
    const hasDetail = text.customerDetail.length > 0, hasService = text.service.length > 0;
    const nameH = Math.max(11, Math.round(attribution.h * (hasDetail || hasService ? 0.32 : 0.48))), otherH = Math.max(10, Math.round(attribution.h * (hasDetail && hasService ? 0.25 : 0.36)));
    const customerName = requireFit("customer name", text.customerName, { x: personX, y: attribution.y, w: personW, h: nameH }, S * 0.038, 1, true);
    let cursorY = customerName.rect.y + customerName.rect.h + Math.max(1, Math.round(gap / 2));
    const customerDetail = hasDetail ? requireFit("customer detail", text.customerDetail, { x: personX, y: cursorY, w: personW, h: otherH }, S * 0.029, 1) : undefined;
    if (customerDetail)
        cursorY += customerDetail.rect.h + Math.max(1, Math.round(gap / 2));
    const service = hasService ? requireFit("service", text.service, { x: personX, y: cursorY, w: personW, h: otherH }, S * 0.029, 1, true) : undefined;
    const rating = requireFit("rating", `${"*".repeat(text.rating)} ${text.rating} / 5`, { x: attribution.x + attribution.w - ratingW, y: attribution.y, w: ratingW, h: Math.max(10, Math.round(attribution.h * 0.48)) }, S * 0.03, 1, true);
    const initial = requireFit("initials", initials(text.customerName), initialsBox, S * 0.042, 1, true);
    const disclosure = requireFit("source disclosure", text.sourceLabel, footer, S * 0.03, 1, true);
    const texts = [business, badge, quote, initial, customerName, rating, disclosure];
    if (customerDetail)
        texts.push(customerDetail);
    if (service)
        texts.push(service);
    return { card, content, quote, texts, initials: initialsBox, attribution, footer, accentRule };
}
function layoutContract(L) {
    return [
        ...L.texts.map((text) => (0, layout_1.textFitsMeasured)(text.label, text.fit.text, text.fit.fontSize, text.fit.width)),
        { label: "card", within: { xFrac: [0.02, 0.98], yFrac: [0.02, 0.98] } },
        { label: "accent rule", minWidthFrac: 0.5 },
        { label: "initials mark", aspect: 1, within: { yFrac: [0.35, 0.9] } },
        { label: "quote", within: { yFrac: [0.05, 0.75] }, minWidthFrac: 0.45 },
        { label: "attribution", within: { yFrac: [0.45, 0.92] } },
        { label: "footer band", minWidthFrac: 0.5, within: { yFrac: [0.58, 0.98] } },
        { label: "source disclosure", within: { yFrac: [0.58, 0.98] } },
    ];
}
const WHY = {
    day: 3, date: "2026-09-22", agent: "codex", model: "gpt-5-codex", id: ID, title: "Testimonial Proof Card",
    who: "Local service-business owners and social-media coordinators in r/smallbusiness.",
    problem: [
        "One review can become a website item, social post, and case study, while owners also ask for regular stories, pictures, and testimonials. Another discussion recommends batching real client material instead of making something new every day.",
        "The constraint is trust: a long review needs a selected excerpt and attribution, not invented proof, a platform badge, or a customer photo."
    ],
    sources: ["https://www.reddit.com/r/smallbusiness/comments/1nitluu/small_business_owners_whats_your_process_for/", "https://www.reddit.com/r/smallbusiness/comments/1ph2vfy/social_media_coordinator/", "https://www.reddit.com/r/smallbusiness/comments/1wgqpiz/starting_producing_social_media_content_for_the/"],
    solution: [
        "This card gives one supplied review a large, measured quote block, then keeps the name, rating, service, and a source-verification disclosure in the same card. The default says SAMPLE REVIEW so it cannot pose as a published endorsement.",
        "The design decision is a firm five-line excerpt budget. Empty detail and service rows yield before the quote, business identity, name, rating, and disclosure."
    ],
    usage: { command: "m0saic make @one-a-day/social/testimonial-proof-card/v1 --template-repo . -w 1080 -h 1080 -o review.png", try: ["quote: use a selected customer excerpt", "sourceLabel: replace after verifying the source", "preset: dark", "service: empty removes its chip"] },
    caveats: ["It does not verify that a review is genuine or that the rating is accurate.", "It accepts ASCII copy only because the bundled font has limited glyph coverage.", "A long review must be edited upstream into a five-line selected excerpt."],
    timeline: { source: "runner", phases: [{ name: "scout", startMs: 0, durMs: 162870, calls: 21, tokens: 1381692, costUsd: 1.06, tools: "shell 13, edit 4, web_search 4" }, { name: "plan", startMs: 162879, durMs: 85960, calls: 6, tokens: 446169, costUsd: 0.37, tools: "shell 5, edit 1" }, { name: "build", startMs: 248861, durMs: 1148237, calls: 44, tokens: 10286415, costUsd: 7.46, tools: "shell 34, edit 10" }, { name: "build (2)", startMs: 1397130, durMs: 638599, calls: 30, tokens: 5057113, costUsd: 3.64, tools: "shell 27, edit 3" }, { name: "build (3)", startMs: 2035758, durMs: 290519, calls: 18, tokens: 2979125, costUsd: 2.15, tools: "shell 15, edit 3" }, { name: "critique", startMs: 2326288, durMs: 112987, calls: 8, tokens: 1142618, costUsd: 0.86, tools: "shell 6, edit 2" }], costBasis: "estimated", pricedAt: "2026-09-20" }
};
exports.TestimonialProofCardV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID), label: "2026-09-22 \u00b7 Testimonial Proof Card", version: 1,
    description: "A selected customer quote with attribution, rating, and a source-verification disclosure.",
    capabilities: { tier: "core" },
    tags: ["testimonial", "social-proof", "small-business", "social-media", "review", "still", "2026-09-22", "day-003"],
    outputHints: { width: 1080, height: 1080, fps: 30, durationMs: 2000, format: { kind: "image", container: "png" }, note: "Square-first testimonial still; landscape and portrait stay composed." },
    propsSchema,
    defaultProps: { quote: DEFAULT_QUOTE, customerName: DEFAULT_NAME, customerDetail: DEFAULT_DETAIL, service: DEFAULT_SERVICE, rating: 5, businessName: DEFAULT_BUSINESS, sourceLabel: DEFAULT_SOURCE, accent: DEFAULT_ACCENT, preset: "light", debugLayout: false },
    render, renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.TestimonialProofCardV1;
async function render(props, ctx) {
    var _a, _b;
    const quote = pickText(props.quote, DEFAULT_QUOTE, "quote", true);
    const customerName = pickText(props.customerName, DEFAULT_NAME, "customerName", true);
    const customerDetail = pickText(props.customerDetail, DEFAULT_DETAIL, "customerDetail");
    const service = pickText(props.service, DEFAULT_SERVICE, "service");
    const businessName = pickText(props.businessName, DEFAULT_BUSINESS, "businessName", true);
    const sourceLabel = pickText(props.sourceLabel, DEFAULT_SOURCE, "sourceLabel", true);
    const rating = (_a = props.rating) !== null && _a !== void 0 ? _a : 5;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
        throw new Error(`${ID}: rating must be an integer from 1 through 5.`);
    const preset = (_b = props.preset) !== null && _b !== void 0 ? _b : "light";
    if (preset !== "light" && preset !== "dark")
        throw new Error(`${ID}: preset must be light or dark.`);
    const accent = pickColor(props.accent, DEFAULT_ACCENT, "accent"), palette = PRESETS[preset];
    const L = layoutTestimonialProofCard({ quote, customerName, customerDetail, service, businessName, sourceLabel, rating }, ctx.target.width, ctx.target.height);
    const byLabel = new Map(L.texts.map((entry) => [entry.label, entry]));
    const text = (label, color, align, bold = false) => textCell(byLabel.get(label), color, align, bold);
    const pieces = [];
    const put = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    put({ x: 0, y: 0, w: ctx.target.width, h: ctx.target.height }, 0, (0, template_utils_1.makeColorTile)(palette.page));
    put(L.card, 1, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(palette.card), "card"));
    put(L.accentRule, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accent), "accent rule"), "accent"));
    put(L.attribution, 1, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(palette.card), "attribution"));
    const badge = byLabel.get("sample badge").rect;
    put(badge, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accent), "sample badge fill"), "accent"));
    put(L.initials, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accent), "initials mark"), "customerName"));
    put(L.footer, 1, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(palette.line), "footer band"));
    if (byLabel.has("service"))
        put(byLabel.get("service").rect, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accent), "service chip"), "service"));
    put(byLabel.get("business name").rect, 3, (0, template_utils_1.bindProp)(text("business name", palette.ink, "left", true), "businessName"));
    put(badge, 3, (0, template_utils_1.tag)(text("sample badge", palette.card, "center", true), "sample badge"));
    put(L.quote.rect, 4, (0, template_utils_1.bindProp)(text("quote", palette.ink, "left", true), "quote"));
    put(L.initials, 3, (0, template_utils_1.bindProp)(text("initials", palette.card, "center", true), "customerName"));
    put(byLabel.get("customer name").rect, 3, (0, template_utils_1.bindProp)(text("customer name", palette.ink, "left", true), "customerName"));
    if (byLabel.has("customer detail"))
        put(byLabel.get("customer detail").rect, 3, (0, template_utils_1.bindProp)(text("customer detail", palette.muted, "left"), "customerDetail"));
    if (byLabel.has("service"))
        put(byLabel.get("service").rect, 3, (0, template_utils_1.bindProp)(text("service", palette.card, "center", true), "service"));
    put(byLabel.get("rating").rect, 3, (0, template_utils_1.bindProp)(text("rating", accent, "right", true), "rating"));
    put(L.footer, 3, (0, template_utils_1.bindProp)(text("source disclosure", palette.muted, "center", true), "sourceLabel"));
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: ctx.target.width, rootH: ctx.target.height, pieces, basis: 120 });
    const doc = { kind: "mosaic_document", version: 1, m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID), assets: {}, backgroundColor: palette.page, sources: placed.sources };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints: layoutContract(L), debug: props.debugLayout === true });
}
