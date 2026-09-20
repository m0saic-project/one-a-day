"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHY_MADE_LABEL = exports.WHY_PAGE_LABELS = exports.WHY_PLACEHOLDER = exports.WHY_BUDGET = void 0;
exports.assertWhySpec = assertWhySpec;
exports.whySpecFor = whySpecFor;
exports.listWhySpecs = listWhySpecs;
exports.whyTutorial = whyTutorial;
const template_utils_1 = require("@m0saic/template-utils");
const agent_timeline_1 = require("../harness/agent-timeline/v1/agent-timeline");
const layout_1 = require("./layout");
const text_1 = require("./text");
/** The length budget, enforced: a tutorial is orientation, not documentation. */
exports.WHY_BUDGET = {
    maxParagraphs: 3,
    maxParagraphChars: 320,
    maxWhoChars: 160,
    minSources: 1,
    maxSources: 12,
    maxTry: 4,
    maxTryChars: 110,
    maxCommandChars: 200,
    maxCaveats: 3,
    maxCaveatChars: 200,
    minPhases: 1,
    maxPhases: 12,
};
/** The scaffold's placeholder marker; the gate refuses a spec that still carries it. */
exports.WHY_PLACEHOLDER = "[fill me]";
const ASCII = /^[\x20-\x7e]*$/;
function assertWhySpec(spec) {
    var _a, _b;
    const problems = [];
    const str = (name, v, max) => {
        if (typeof v !== "string" || v.trim().length === 0) {
            problems.push(`${name} is empty`);
            return;
        }
        if (!ASCII.test(v))
            problems.push(`${name} has non-ASCII characters (the bundled font draws them as tofu)`);
        if (v.length > max)
            problems.push(`${name} is ${v.length} chars (max ${max})`);
        if (v.includes(exports.WHY_PLACEHOLDER))
            problems.push(`${name} still carries the scaffold placeholder ${exports.WHY_PLACEHOLDER}`);
    };
    const list = (name, v, min, max, maxChars) => {
        if (!Array.isArray(v)) {
            problems.push(`${name} must be an array`);
            return;
        }
        if (v.length < min)
            problems.push(`${name} needs at least ${min} entr${min === 1 ? "y" : "ies"}`);
        if (v.length > max)
            problems.push(`${name} has ${v.length} entries (max ${max})`);
        v.forEach((s, i) => str(`${name}[${i}]`, s, maxChars));
    };
    if (!Number.isInteger(spec.day) || spec.day < 1)
        problems.push("day must be a positive integer");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(spec.date)))
        problems.push("date must be YYYY-MM-DD");
    str("agent", spec.agent, 40);
    str("model", spec.model, 80);
    str("id", spec.id, 120);
    str("title", spec.title, 80);
    str("who", spec.who, exports.WHY_BUDGET.maxWhoChars);
    list("problem", spec.problem, 1, exports.WHY_BUDGET.maxParagraphs, exports.WHY_BUDGET.maxParagraphChars);
    list("solution", spec.solution, 1, exports.WHY_BUDGET.maxParagraphs, exports.WHY_BUDGET.maxParagraphChars);
    list("sources", spec.sources, exports.WHY_BUDGET.minSources, exports.WHY_BUDGET.maxSources, 400);
    if (Array.isArray(spec.sources)) {
        spec.sources.forEach((u, i) => {
            try {
                const url = new URL(String(u));
                if (url.protocol !== "https:" && url.protocol !== "http:")
                    problems.push(`sources[${i}] is not http(s)`);
            }
            catch {
                problems.push(`sources[${i}] is not a URL: ${JSON.stringify(u)}`);
            }
        });
    }
    if (!spec.usage || typeof spec.usage !== "object")
        problems.push("usage is missing");
    else {
        str("usage.command", spec.usage.command, exports.WHY_BUDGET.maxCommandChars);
        list("usage.try", spec.usage.try, 0, exports.WHY_BUDGET.maxTry, exports.WHY_BUDGET.maxTryChars);
    }
    if (spec.caveats !== undefined)
        list("caveats", spec.caveats, 0, exports.WHY_BUDGET.maxCaveats, exports.WHY_BUDGET.maxCaveatChars);
    const tl = spec.timeline;
    if (!tl || typeof tl !== "object")
        problems.push("timeline is missing (how the day was made: { source, phases })");
    else {
        if (tl.source !== "runner" && tl.source !== "self-reported")
            problems.push('timeline.source must be "runner" or "self-reported"');
        if (tl.costBasis !== undefined && tl.costBasis !== "reported" && tl.costBasis !== "estimated")
            problems.push('timeline.costBasis must be "reported" or "estimated"');
        if (tl.pricedAt !== undefined && !/^\d{4}-\d{2}(-\d{2})?$/.test(String(tl.pricedAt)))
            problems.push("timeline.pricedAt must be YYYY-MM or YYYY-MM-DD");
        if (!Array.isArray(tl.phases))
            problems.push("timeline.phases must be an array");
        else {
            if (tl.phases.length < exports.WHY_BUDGET.minPhases)
                problems.push(`timeline.phases needs at least ${exports.WHY_BUDGET.minPhases}`);
            if (tl.phases.length > exports.WHY_BUDGET.maxPhases)
                problems.push(`timeline.phases has ${tl.phases.length} entries (max ${exports.WHY_BUDGET.maxPhases})`);
            tl.phases.forEach((ph, i) => {
                if (!ph || typeof ph !== "object") {
                    problems.push(`timeline.phases[${i}] is not an object`);
                    return;
                }
                str(`timeline.phases[${i}].name`, ph.name, 40);
                if (!Number.isFinite(ph.startMs) || ph.startMs < 0)
                    problems.push(`timeline.phases[${i}].startMs must be a non-negative number`);
                if (!Number.isFinite(ph.durMs) || ph.durMs < 0)
                    problems.push(`timeline.phases[${i}].durMs must be a non-negative number`);
                if (ph.tools !== undefined)
                    str(`timeline.phases[${i}].tools`, ph.tools, 80);
                if (ph.costUsd !== undefined && !(Number.isFinite(ph.costUsd) && ph.costUsd >= 0))
                    problems.push(`timeline.phases[${i}].costUsd must be a non-negative number`);
                if (ph.status !== undefined && !["ok", "error", "no-ship"].includes(String(ph.status)))
                    problems.push(`timeline.phases[${i}].status must be ok, error or no-ship`);
            });
        }
    }
    if (problems.length > 0) {
        throw new Error(`whyTutorial(${JSON.stringify((_a = spec === null || spec === void 0 ? void 0 : spec.id) !== null && _a !== void 0 ? _a : "?")}) rejected its spec: ${problems.join("; ")}. ` +
            `The why-tutorial is orientation, not documentation - the detail belongs in journal/${(_b = spec === null || spec === void 0 ? void 0 : spec.date) !== null && _b !== void 0 ? _b : "<date>"}/.`);
    }
}
/**
 * Every spec handed to `whyTutorial`, by template id. `defineMosaicTemplate`
 * wraps `renderTutorial` in a fresh function, so the stamp on the function
 * does not survive registration - the gate reads this instead, after loading
 * dist/index.js (which imports every template module, and so fills it).
 */
const REGISTRY = new Map();
function whySpecFor(id) { return REGISTRY.get(id); }
function listWhySpecs() { return [...REGISTRY.values()]; }
/** The step labels the pages carry, in order - the gate checks a tutorial has this shape. */
exports.WHY_PAGE_LABELS = ["why: cover", "why: the problem", "why: the solution", "why: use it"];
/** The label of the page after the template: the harness timeline. */
exports.WHY_MADE_LABEL = "why: how it was made";
/* ── page chrome ── */
const PAGE_BG = "#0d1117";
const HEADER_BG = "#161b22";
const INK = "#ecf0f1";
const INK_DIM = "#8b96a5";
const ACCENT = template_utils_1.BRAND_ORANGE;
/** Same reason as the og-card: 630 carries a 7; at basis 90 the pitch is 7 and stays 5-smooth. */
const INSET_BASIS = 90;
const DURATION_MS = { cover: 7000, problem: 14000, solution: 12000, usage: 10000, still: 6000, made: 10000 };
/** A sources list entry: host + path, ASCII, trimmed. */
function shortUrl(u, maxChars = 84) {
    const url = new URL(u);
    let s = url.hostname.replace(/^www\./, "") + (url.pathname === "/" ? "" : url.pathname) + (url.search ? url.search : "");
    s = s.replace(/[^\x20-\x7e]/g, "?");
    return s.length > maxChars ? s.slice(0, maxChars - 3) + "..." : s;
}
/**
 * One chrome page: header band (M glyph, run identity), a page title, the
 * body blocks laid out top-down at ONE shared body size that fits the box
 * (shrinking step by step, never below the floor), and a footer with the
 * journal path and the page number. Everything is exact rects through
 * `placeInsetPieces`; gaps are the null space between them.
 */
function page(spec, ctx, opts) {
    var _a, _b;
    const W = Math.max(1, Math.round(ctx.target.width));
    const H = Math.max(1, Math.round(ctx.target.height));
    const S = Math.min(H, 0.75 * W);
    const margin = Math.round(0.06 * S);
    const minPx = Math.max(6, Math.round(0.014 * S));
    const pieces = [];
    const put = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    // Every text cell is measured as it is placed, so the page's layout contract
    // can check the TRUE width against the realized box (textFitsMeasured).
    const boldPath = (_a = (0, template_utils_1.resolveFontFile)({ weight: "bold" })) === null || _a === void 0 ? void 0 : _a.path;
    const constraints = [];
    const putText = (rect, importance, opts) => {
        put(rect, importance, (0, text_1.textCell)(opts));
        const width = (0, template_utils_1.measureText)(opts.text, { fontSize: opts.fontSize, ...(opts.bold && boldPath ? { fontPath: boldPath } : {}) }).width;
        constraints.push((0, layout_1.textFitsMeasured)(opts.label, opts.text, opts.fontSize, width));
    };
    // ── header band: M glyph, "one-a-day - day NNN - date" left, "agent / model" right ──
    const headerH = Math.round(0.11 * S);
    put({ x: 0, y: 0, w: W, h: headerH }, 0, { ...(0, template_utils_1.makeColorTile)(HEADER_BG), editor: { owner: "template", label: "header" } });
    const glyphSide = Math.round(0.5 * headerH);
    const glyphX = margin;
    put({ x: glyphX, y: Math.round((headerH - glyphSide) / 2), w: glyphSide, h: glyphSide }, 2, { ...(0, template_utils_1.brandGlyphTile)(template_utils_1.HEADER_M_GLYPH, ACCENT), editor: { owner: "template", label: "mark" } });
    constraints.push({ label: "header", minWidthFrac: 0.98, within: { yFrac: [0, 0.25] } }, { label: "mark", aspect: 1, aspectTolerance: 0.2, within: { yFrac: [0, 0.25] } });
    const headerPx = Math.round(0.3 * headerH);
    const leftText = `one-a-day - day ${String(spec.day).padStart(3, "0")} - ${spec.date}`;
    const rightText = `${spec.agent} / ${spec.model}`;
    const headerTextX = glyphX + glyphSide + Math.round(0.6 * margin);
    const halfW = Math.max(16, Math.floor((W - headerTextX - margin) * 0.5));
    const leftPx = (0, text_1.fitLine)(leftText, (0, text_1.budget)(halfW), headerPx, minPx, true);
    const rightPx = (0, text_1.fitLine)(rightText, (0, text_1.budget)(halfW), headerPx, minPx);
    putText({ x: headerTextX, y: 0, w: halfW, h: headerH }, 1, { text: leftText, fontSize: leftPx, color: INK, hAlign: "left", bold: true, label: "run" });
    putText({ x: W - margin - halfW, y: 0, w: halfW, h: headerH }, 1, { text: rightText, fontSize: rightPx, color: INK_DIM, hAlign: "right", label: "agent" });
    // ── footer: journal path left, page number right ──
    const footerPx = Math.round(0.026 * S);
    const footerH = Math.round(1.6 * footerPx);
    const footerY = H - margin - footerH;
    const journalText = `journal/${spec.date}/`;
    const pageText = `${opts.index} / ${opts.count}`;
    putText({ x: margin, y: footerY, w: halfW, h: footerH }, 1, { text: journalText, fontSize: footerPx, color: INK_DIM, hAlign: "left", label: "journal" });
    putText({ x: W - margin - halfW, y: footerY, w: halfW, h: footerH }, 1, { text: pageText, fontSize: footerPx, color: INK_DIM, hAlign: "right", label: "page" });
    constraints.push({ label: "journal", within: { yFrac: [0.8, 1] } }, { label: "page", within: { yFrac: [0.8, 1] } });
    // ── page title (+ a big right-aligned companion: the cover's date) ──
    const titleY = headerH + margin;
    const titleRight = (_b = opts.titleRight) !== null && _b !== void 0 ? _b : "";
    const titleW = titleRight.length > 0 ? Math.floor((W - 2 * margin) * 0.55) : W - 2 * margin;
    const titleCap = Math.round(0.075 * S);
    const titlePx = (0, text_1.fitLine)(opts.title, (0, text_1.budget)(titleW), titleCap, minPx, true);
    const rightW = W - 2 * margin - titleW;
    const titleRightPx = titleRight.length > 0 ? Math.min(titlePx, (0, text_1.fitLine)(titleRight, (0, text_1.budget)(rightW), titleCap, minPx, true)) : 0;
    const titleH = Math.round(1.3 * titlePx);
    putText({ x: margin, y: titleY, w: titleW, h: titleH }, 1, { text: opts.title, fontSize: titlePx, color: INK, hAlign: "left", bold: true, label: "title" });
    if (titleRight.length > 0) {
        putText({ x: margin + titleW, y: titleY, w: rightW, h: titleH }, 1, { text: titleRight, fontSize: titleRightPx, color: ACCENT, hAlign: "right", bold: true, label: "title-right" });
    }
    // ── body: one shared size that fits every block into the box ──
    const body = { x: margin, y: titleY + titleH + Math.round(0.6 * margin), w: W - 2 * margin, h: 0 };
    body.h = Math.max(16, footerY - Math.round(0.6 * margin) - body.y);
    const wrapW = (0, text_1.budget)(body.w);
    const layoutAt = (px) => {
        const rows = [];
        let total = 0;
        opts.blocks.forEach((block, i) => {
            let lines;
            let size = px;
            if (block.kind === "label") {
                size = Math.max(minPx, Math.round(px * 0.72));
                lines = (0, text_1.wrapFit)(block.text, size, wrapW);
            }
            else if (block.kind === "big") {
                size = Math.round(px * 1.9);
                lines = (0, text_1.wrapFit)(block.text, size, wrapW);
            }
            else if (block.kind === "para")
                lines = (0, text_1.wrapFit)(block.text, px, wrapW);
            else {
                // Chunk against the width left after the "- " so a chunked token still
                // fits on the dash's line.
                const dashW = Math.ceil((0, template_utils_1.measureText)("- ", { fontSize: px }).width);
                lines = block.items.flatMap((item) => (0, text_1.wrapFit)(`- ${item}`, px, wrapW, Math.max(8, wrapW - dashW)));
            }
            const lineH = Math.max(1, Math.round((0, template_utils_1.measureText)("Ay", { fontSize: size }).height));
            // The block's REAL height: lines stack at the rasterizer's 1.25 leading,
            // so n x (one line) under-measures every multi-line block and clips
            // its last line. Measure the joined block, plus descender room.
            const h = Math.ceil((0, template_utils_1.measureText)(lines.join("\n"), { fontSize: size }).height) + Math.max(1, Math.round(0.12 * size));
            const next = opts.blocks[i + 1];
            const gapAfter = i === opts.blocks.length - 1 ? 0 : block.kind === "label" ? Math.round(0.15 * lineH) : (next === null || next === void 0 ? void 0 : next.kind) === "label" ? Math.round(0.9 * lineH) : Math.round(0.5 * lineH);
            rows.push({ block, lines, px: size, h, gapAfter });
            total += h + gapAfter;
        });
        return { rows, total };
    };
    let px = Math.round(0.034 * S);
    let laid = layoutAt(px);
    while (laid.total > body.h && px > minPx) {
        px = Math.max(minPx, Math.round(px * 0.92));
        laid = layoutAt(px);
    }
    let y = body.y;
    laid.rows.forEach((row, i) => {
        const color = row.block.kind === "label" ? ACCENT : row.block.kind === "list" ? INK_DIM : INK;
        const text = row.lines.join("\n");
        const h = Math.min(row.h, Math.max(1, body.y + body.h - y));
        if (h > 0 && y < body.y + body.h) {
            putText({ x: body.x, y, w: body.w, h }, 1, { text, fontSize: row.px, color, hAlign: "left", bold: row.block.kind === "label" || row.block.kind === "big", vAlign: "top", label: `${row.block.kind}-${i}` });
        }
        y += row.h + row.gapAfter;
    });
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces, basis: INSET_BASIS });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: placed.m0,
        assets: {},
        size: { width: W, height: H },
        fps: ctx.target.fps,
        // The page owns its duration - never ctx.target.durationMs.
        durationMs: opts.durationMs,
        backgroundColor: PAGE_BG,
        sources: placed.sources,
        editor: { label: opts.label },
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: `${spec.id} (why: page ${opts.index})`, constraints });
}
/* ── the pages ── */
function coverPage(spec, ctx, count) {
    return page(spec, ctx, {
        title: `Day ${String(spec.day).padStart(3, "0")}`,
        titleRight: spec.date,
        blocks: [
            { kind: "big", text: spec.title },
            { kind: "para", text: spec.id },
            { kind: "label", text: "THIS RUN" },
            { kind: "list", items: [`agent: ${spec.agent}`, `model: ${spec.model} (self-declared by the agent)`] },
            { kind: "label", text: "WHAT FOLLOWS" },
            { kind: "para", text: "The problem that was observed and where, the solution this template attempts, how to run it, the template itself at its defaults, and how the day was made." },
        ],
        index: 1,
        count,
        durationMs: DURATION_MS.cover,
        label: `why: cover - day ${spec.day}`,
    });
}
function problemPage(spec, ctx, count) {
    const shown = spec.sources.slice(0, 6).map((u) => shortUrl(u));
    const more = spec.sources.length - shown.length;
    return page(spec, ctx, {
        title: "The problem",
        blocks: [
            { kind: "label", text: "WHO" },
            { kind: "para", text: spec.who },
            { kind: "label", text: "WHAT WAS OBSERVED" },
            ...spec.problem.map((text) => ({ kind: "para", text })),
            { kind: "label", text: `SOURCES THE AGENT OPENED${more > 0 ? ` (${more} more in journal/${spec.date}/10-scout.md)` : ""}` },
            { kind: "list", items: shown },
        ],
        index: 2,
        count,
        durationMs: DURATION_MS.problem,
        label: "why: the problem",
    });
}
function solutionPage(spec, ctx, count) {
    var _a;
    const caveats = (_a = spec.caveats) !== null && _a !== void 0 ? _a : [];
    return page(spec, ctx, {
        title: "The solution",
        blocks: [
            { kind: "label", text: "WHAT THIS TEMPLATE ATTEMPTS" },
            ...spec.solution.map((text) => ({ kind: "para", text })),
            ...(caveats.length > 0 ? [{ kind: "label", text: "KNOWN WEAK SPOTS" }, { kind: "list", items: caveats }] : []),
        ],
        index: 3,
        count,
        durationMs: DURATION_MS.solution,
        label: "why: the solution",
    });
}
function usagePage(spec, ctx, count) {
    return page(spec, ctx, {
        title: "Use it",
        blocks: [
            { kind: "label", text: "RENDER IT" },
            { kind: "para", text: spec.usage.command },
            ...(spec.usage.try.length > 0 ? [{ kind: "label", text: "WORTH TRYING" }, { kind: "list", items: spec.usage.try }] : []),
            { kind: "label", text: "THE FULL RECORD" },
            { kind: "para", text: `journal/${spec.date}/ in the repo: the scout notes with sources, the brief, the build log, the critique with scores, the ship note, every variant.` },
        ],
        index: 4,
        count,
        durationMs: DURATION_MS.usage,
        label: "why: use it",
    });
}
/** The last page: how the day was made - the harness agent-timeline card. */
async function madePage(spec, ctx) {
    var _a;
    const doc = await agent_timeline_1.AgentTimelineV1.render({
        ...agent_timeline_1.AgentTimelineV1.defaultProps,
        title: "How this template was made",
        subtitle: "",
        header: `one-a-day - day ${String(spec.day).padStart(3, "0")} - ${spec.date}`,
        headerRight: `${spec.agent} / ${spec.model}`,
        phases: spec.timeline.phases,
        source: spec.timeline.source,
        costNote: spec.timeline.costBasis === "reported" ? "cost as reported by the agent CLI" : spec.timeline.costBasis === "estimated" ? `cost estimated at list prices${spec.timeline.pricedAt ? ` of ${spec.timeline.pricedAt}` : ""} (pipeline/config.json pricing)` : "",
        debugLayout: false,
    }, ctx);
    if (doc.kind !== "mosaic_document")
        throw new Error("the agent-timeline harness must render a document");
    return { ...doc, durationMs: DURATION_MS.made, editor: { ...((_a = doc.editor) !== null && _a !== void 0 ? _a : {}), label: exports.WHY_MADE_LABEL } };
}
/** The template itself at its own defaults. */
async function templateSteps(spec, ctx, render, props, count) {
    let renderable;
    try {
        renderable = await render(props, ctx);
    }
    catch (err) {
        const message = err instanceof Error ? err.message.split("\n")[0] : String(err);
        return [{ file: page(spec, ctx, { title: "The template", blocks: [{ kind: "para", text: `This template needs inputs to render: ${message}`.replace(/[^\x20-\x7e]/g, "?").slice(0, exports.WHY_BUDGET.maxParagraphChars) }, { kind: "para", text: "See the usage page and the ship note for what to feed it." }], index: count - 1, count, durationMs: DURATION_MS.still, label: "why: the template (needs inputs)" }), durationMs: DURATION_MS.still }];
    }
    if (renderable.kind === "mosaic_pipeline") {
        return renderable.steps.map((step) => ({ ...step, durationMs: step.durationMs > 0 ? step.durationMs : DURATION_MS.still }));
    }
    if (renderable.kind !== "mosaic_document") {
        // A mosaicx invocation cannot be a pipeline step; say so instead of failing.
        return [{ file: page(spec, ctx, { title: "The template", blocks: [{ kind: "para", text: `This template renders a ${String(renderable.kind)}, which a tutorial step cannot embed. Render it with the command on the previous page.` }], index: count - 1, count, durationMs: DURATION_MS.still, label: "why: the template (not embeddable)" }), durationMs: DURATION_MS.still }];
    }
    const durationMs = Number.isFinite(renderable.durationMs) && renderable.durationMs > 0 && renderable.durationMs !== ctx.target.durationMs
        ? Math.round(renderable.durationMs)
        : DURATION_MS.still;
    return [{ file: renderable, durationMs }];
}
/**
 * Build a template's why-tutorial. Assign directly:
 * `renderTutorial: whyTutorial(WHY, render)` where `render` is the template's
 * own render function (the last step shows the template at its defaults).
 */
function whyTutorial(spec, render) {
    // At MODULE level on purpose: a bad spec fails when the template is
    // imported (the build, the tests), not when someone presses "?".
    assertWhySpec(spec);
    const frozen = Object.freeze({ ...spec, problem: [...spec.problem], solution: [...spec.solution], sources: [...spec.sources], usage: { command: spec.usage.command, try: [...spec.usage.try] }, ...(spec.caveats ? { caveats: [...spec.caveats] } : {}), timeline: { ...spec.timeline, phases: spec.timeline.phases.map((p) => ({ ...p })) } });
    const fn = async (props, ctx) => {
        const count = 6;
        const W = Math.max(1, Math.round(ctx.target.width));
        const H = Math.max(1, Math.round(ctx.target.height));
        const pages = [
            { file: coverPage(frozen, ctx, count), durationMs: DURATION_MS.cover },
            { file: problemPage(frozen, ctx, count), durationMs: DURATION_MS.problem },
            { file: solutionPage(frozen, ctx, count), durationMs: DURATION_MS.solution },
            { file: usagePage(frozen, ctx, count), durationMs: DURATION_MS.usage },
            ...(await templateSteps(frozen, ctx, render, props, count)),
            { file: await madePage(frozen, ctx), durationMs: DURATION_MS.made },
        ];
        return {
            kind: "mosaic_pipeline",
            version: 1,
            steps: pages,
            defaultTransition: { type: "cut" },
            size: { width: W, height: H },
            fps: ctx.target.fps,
            editor: { label: `why: ${frozen.id}` },
        };
    };
    if (REGISTRY.has(frozen.id) && REGISTRY.get(frozen.id) !== frozen) {
        throw new Error(`whyTutorial(${JSON.stringify(frozen.id)}): a spec for this id was already registered - one template, one why.`);
    }
    REGISTRY.set(frozen.id, frozen);
    return Object.assign(fn, { why: frozen });
}
