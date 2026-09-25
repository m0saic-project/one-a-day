"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpisodeAudiogramV1 = exports.DEFAULT_WAVE = exports.MAX_BARS = exports.MIN_BARS = exports.MAX_CLIP_SEC = exports.MIN_CLIP_SEC = void 0;
exports.litTimes = litTimes;
exports.litBarsAt = litBarsAt;
exports.timecodeExpr = timecodeExpr;
exports.clockText = clockText;
exports.fiveSmoothDown = fiveSmoothDown;
exports.layoutAudiogram = layoutAudiogram;
exports.initialsOf = initialsOf;
exports.audiogramContract = audiogramContract;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/social/episode-audiogram/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
exports.MIN_CLIP_SEC = 5;
exports.MAX_CLIP_SEC = 600;
exports.MIN_BARS = 8;
/** Enable-gated tiles are ffmpeg overlays; the child keeps the count at talk-timer's proven scale. */
exports.MAX_BARS = 32;
/** Hand-tuned to read as speech: phrases, a breath, an emphatic run. */
exports.DEFAULT_WAVE = [
    0.36, 0.58, 0.82, 0.64, 0.45, 0.71, 0.9, 0.6,
    0.38, 0.18, 0.12, 0.42, 0.66, 0.88, 0.72, 0.5,
    0.62, 0.8, 0.94, 0.68, 0.44, 0.24, 0.14, 0.34,
    0.56, 0.78, 0.92, 0.7, 0.52, 0.4, 0.62, 0.3,
];
const DEFAULTS = {
    showName: "SIGNAL PATH",
    episodeTitle: "Ep 12 - The batch is the workflow",
    quote: "We stopped making clips by hand the day the feed started making them for us.",
    clipSec: 30,
    cta: "New episode - out now",
    accent: "#7c5cff",
    preset: "dark",
};
/** Hand-tuned trios: dark is tuned, not derived from light. */
const PRESETS = {
    dark: {
        bg: "#101319",
        ink: "#e8ecf1",
        dim: "#8b97a5",
        /** Unplayed bars: the dim ink PREMIXED over the bg at this weight - a static solid, never an overlay layer. */
        barDimMix: 0.32,
    },
    light: {
        bg: "#f7f8fa",
        ink: "#1c2127",
        dim: "#5b6672",
        barDimMix: 0.3,
    },
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    showName: {
        type: "string",
        required: false,
        description: "The show - the small header line, and the initials on the generated cover. Empty removes the line.",
        meta: { control: { placeholder: DEFAULTS.showName }, ui: { label: "Show", order: 1 } },
    },
    episodeTitle: {
        type: "string",
        required: false,
        description: "The episode - the bold line. The rect that shows it is bound to it, so Make's double-click edits it in place.",
        meta: { control: { placeholder: DEFAULTS.episodeTitle }, ui: { label: "Episode", order: 2, primary: true } },
    },
    quote: {
        type: "string",
        required: false,
        description: "The pull quote, wrapped and fitted beside the cover. Empty removes it and its accent bar.",
        meta: { control: { placeholder: DEFAULTS.quote }, ui: { label: "Quote", order: 3, primary: true } },
    },
    wave: {
        type: "number[]",
        required: false,
        description: "8..32 amplitudes, 0..1, left to right - the wave's bars. Extract them from the snippet with the one-liner on the usage page; the default is a hand-tuned speech shape.",
        meta: { ui: { label: "Wave (amplitudes)", order: 4 } },
    },
    clipSec: {
        type: "number",
        required: false,
        description: "Clip length in whole seconds (5..600). The sweep and the timecode derive from it; an explicit duration pin overrides it and BECOMES the clip.",
        meta: { constraints: { min: exports.MIN_CLIP_SEC, max: exports.MAX_CLIP_SEC }, ui: { label: "Clip (s)", order: 5, primary: true } },
    },
    audioSrc: {
        type: "media[]",
        required: false,
        description: "Zero or one audio snippet - an absolute path from the CLI, or a picked file in Make. It joins the real mix, so the rendered MP4 carries it. Empty renders silent (no empty track is written).",
        meta: { control: { multiple: false, picker: "file", accept: ["audio"] }, ui: { label: "Audio file", order: 6 } },
    },
    coverSrc: {
        type: "media[]",
        required: false,
        description: "Zero or one cover art image (square reads best) - an absolute path from the CLI, or a picked file in Make. Empty draws the accent initials cover.",
        meta: { control: { multiple: false, picker: "file", accept: ["image"] }, ui: { label: "Cover image", order: 7 } },
    },
    cta: {
        type: "string",
        required: false,
        description: "The footer-right call to action. Empty removes it.",
        meta: { control: { placeholder: DEFAULTS.cta }, ui: { label: "CTA", order: 8 } },
    },
    accent: {
        type: "string",
        required: false,
        description: "The accent - played bars, the quote bar, the generated cover - as #rrggbb.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 9 } },
    },
    preset: {
        type: "string",
        required: false,
        description: 'Hand-tuned background / ink / muted trio: "dark" (default) or "light".',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 10 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits, the wave and the footer hold their bands) and draw it over the frame.",
        meta: { ui: { label: "Debug layout", order: 11 } },
    },
});
/* ── the arithmetic: pure, exported, and what the test asserts ── */
/** The second bar k (0-based, of n) flips from dim to accent: k * clipSec / n. Bar 0 is lit at t=0, so frame 0 - the browse still - already shows the accent. */
function litTimes(n, clipSec) {
    const out = [];
    for (let k = 0; k < n; k++)
        out.push(round3((k * clipSec) / n));
    return out;
}
/** How many bars are lit at clip time t - what the test checks against floor(t * n / clip) + 1. */
function litBarsAt(times, t) {
    return times.filter((at) => t >= at).length;
}
/**
 * The timecode: ONE drawtext expression, evaluated per frame, printing the
 * elapsed MM:SS capped at the total - the end frame reads the total, never
 * over. Inside `%{...}` drawtext wants `\:` and `\,`; the engine's textfile
 * path keeps them. Minutes are not folded into hours (the cap is 10:00).
 */
function timecodeExpr(clipSec) {
    const S = String(Math.round(clipSec));
    const E = `min(trunc(t)\\,${S})`;
    return `%{eif\\:trunc((${E})/60)\\:d\\:2}:%{eif\\:mod(${E}\\,60)\\:d\\:2}`;
}
/** "00:30", "10:00" - both fields padded, exactly as the drawtext elapsed prints them. */
function clockText(seconds) {
    const s = Math.max(0, Math.round(seconds));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
/**
 * The largest 5-smooth number (2^a 3^b 5^c) at or below `n` - the wave child
 * renders on its own canvas, and a side that carries a large prime has no
 * divisor lattice, so placement degrades to exact and `latticeSmooth` fails.
 */
function fiveSmoothDown(n) {
    for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
        let m = v;
        for (const p of [2, 3, 5])
            while (m % p === 0)
                m /= p;
        if (m === 1)
            return v;
    }
    return 1;
}
/** One line, shrunk until it fits; ellipsized only at the floor. */
function fitOne(text, maxW, maxPx, minPx, bold = false) {
    let px = Math.max(minPx, Math.round(maxPx));
    while (px > minPx && (0, text_1.widthOf)(text, px, bold) > maxW)
        px = Math.max(minPx, Math.round(px * 0.92));
    const out = (0, text_1.widthOf)(text, px, bold) > maxW ? (0, text_1.ellipsize)(text, px, maxW, bold) : text;
    return { text: out, px, width: (0, text_1.widthOf)(out, px, bold) };
}
/**
 * The whole geometry as a pure function of the props and the canvas: header
 * (show, title), the media row (cover left, quote right) centred in the
 * band it gets, the wave band, the footer (timecode, total, CTA). The test
 * asserts the rects, the lit times and the fits without parsing m0.
 */
function layoutAudiogram(opts, W, H) {
    const S = Math.min(H, 0.8 * W);
    const margin = Math.max(6, Math.round(0.055 * S));
    const minPx = Math.max(7, Math.round(0.016 * S));
    const contentW = Math.max(32, W - 2 * margin);
    const contentB = (0, text_1.budget)(contentW);
    // ── header ──
    const show = opts.showName.length > 0 ? fitOne(opts.showName.toUpperCase(), contentB, Math.round(0.03 * S), minPx) : null;
    const showH = show ? Math.round(1.5 * show.px) : 0;
    const title = fitOne(opts.episodeTitle, contentB, Math.round(0.055 * S), minPx, true);
    const titleH = Math.round(1.4 * title.px);
    const showRect = { x: margin, y: margin, w: contentW, h: Math.max(1, showH) };
    const titleRect = { x: margin, y: margin + showH, w: contentW, h: titleH };
    const headerBottom = margin + showH + titleH;
    // ── footer: elapsed drawtext, static total, CTA right ──
    const capPx = Math.max(minPx, Math.round(0.03 * S));
    const footerH = Math.round(1.6 * capPx);
    const footerY = H - margin - footerH;
    // The widest string the expression prints, widened 15% for the system
    // drawtext font (wider than the bundled Roboto the measurer knows).
    const timecodeWidth = (0, text_1.widthOf)("88:88", capPx, true) * 1.15;
    // Boxes carry the 6% budget slack the fit rule promises, so quantization's
    // pixel or two never tips the contract check.
    const timecodeRect = { x: margin, y: footerY, w: Math.ceil(timecodeWidth / 0.94) + 4, h: footerH };
    const total = fitOne(`/ ${clockText(opts.clipSec)}`, (0, text_1.budget)(Math.round(contentW * 0.3)), capPx, minPx);
    const totalRect = { x: timecodeRect.x + timecodeRect.w + Math.round(0.4 * capPx), y: footerY, w: Math.ceil(total.width / 0.94) + 4, h: footerH };
    const ctaX = totalRect.x + totalRect.w + margin;
    const ctaW = margin + contentW - ctaX;
    const cta = opts.cta.length > 0 && ctaW >= 40 ? fitOne(opts.cta, (0, text_1.budget)(ctaW), capPx, minPx, true) : null;
    const ctaRect = { x: ctaX, y: footerY, w: Math.max(1, ctaW), h: footerH };
    // ── wave band ──
    const waveH0 = Math.max(10, Math.round(0.14 * S));
    const waveGap = Math.round(0.8 * margin);
    const waveTop0 = footerY - waveGap - waveH0;
    const waveW = fiveSmoothDown(contentW);
    const waveH = fiveSmoothDown(waveH0);
    const wave = {
        x: margin + Math.floor((contentW - waveW) / 2),
        y: waveTop0 + Math.floor((waveH0 - waveH) / 2),
        w: waveW,
        h: waveH,
    };
    // ── media row: cover left, quote right, centred in what remains ──
    const rowTop = headerBottom + Math.round(0.7 * margin);
    const rowBottom = waveTop0 - Math.round(0.8 * margin);
    const rowH = Math.max(24, rowBottom - rowTop);
    const coverSide = Math.max(16, Math.min(rowH, Math.round(0.34 * contentW)));
    const cover = { x: margin, y: rowTop + Math.floor((rowH - coverSide) / 2), w: coverSide, h: coverSide };
    const initialsText = initialsOf(opts.showName);
    const initials = initialsText ? fitOne(initialsText, (0, text_1.budget)(coverSide), Math.round(0.38 * coverSide), minPx, true) : null;
    const qbarW = Math.max(3, Math.round(0.012 * S));
    const qx = margin + coverSide + Math.round(0.9 * margin);
    const quoteX = qx + qbarW + Math.round(0.6 * margin);
    const quoteW = Math.max(24, margin + contentW - quoteX);
    let quoteLines = [];
    let quoteRects = [];
    let quoteBar = null;
    if (opts.quote.length > 0) {
        const maxLines = 4;
        let qpx = Math.max(minPx, Math.round(0.042 * S));
        let lines = (0, text_1.wrapFit)(opts.quote, qpx, (0, text_1.budget)(quoteW));
        while (qpx > minPx && (lines.length > maxLines || lines.length * 1.35 * qpx > rowH * 0.96)) {
            qpx = Math.max(minPx, Math.round(qpx * 0.92));
            lines = (0, text_1.wrapFit)(opts.quote, qpx, (0, text_1.budget)(quoteW));
        }
        const lineH = Math.ceil(1.35 * qpx);
        const keep = Math.max(1, Math.min(lines.length, Math.min(maxLines, Math.floor((rowH * 0.96) / lineH))));
        if (keep < lines.length) {
            lines = lines.slice(0, keep);
            lines[keep - 1] = (0, text_1.ellipsize)(lines[keep - 1], qpx, (0, text_1.budget)(quoteW));
        }
        const qh = lines.length * lineH;
        const qy = rowTop + Math.max(0, Math.floor((rowH - qh) / 2));
        quoteLines = lines.map((t) => ({ text: t, px: qpx, width: (0, text_1.widthOf)(t, qpx) }));
        quoteRects = lines.map((_, i) => ({ x: quoteX, y: qy + i * lineH, w: quoteW, h: lineH }));
        quoteBar = { x: qx, y: qy, w: qbarW, h: Math.max(lineH, qh) };
    }
    // ── the bars, child-local: the classic audiogram mirror. The main bar
    //    stands on a midline at 2/3 height; a calm static reflection hangs
    //    under it. Only the main bars are gated, so the mirror costs no
    //    overlay layers. ──
    const n = opts.wave.length;
    const litAt = litTimes(n, opts.clipSec);
    const gap = Math.max(2, Math.round(0.006 * S));
    const fullW = (waveW - (n - 1) * gap) / n;
    const mid = Math.round(waveH * 0.66);
    const gapR = Math.max(1, Math.round(0.02 * waveH));
    const minBarH = Math.max(2, Math.round(0.08 * waveH));
    const barX = (k) => {
        const x0 = Math.round(k * (fullW + gap));
        const x1 = Math.round(k * (fullW + gap) + fullW);
        return { x: x0, w: Math.max(2, Math.min(x1, waveW) - x0) };
    };
    const bars = opts.wave.map((amp, k) => {
        const h = Math.max(minBarH, Math.round(amp * (mid - gapR)));
        return { ...barX(k), y: mid - h, h };
    });
    const reflRoom = Math.max(2, waveH - mid - 2 * gapR);
    const refls = opts.wave.map((amp, k) => {
        const h = Math.max(1, Math.min(reflRoom, Math.round(amp * reflRoom)));
        return { ...barX(k), y: mid + gapR, h };
    });
    return {
        W, H, S, margin,
        clipSec: opts.clipSec, n,
        show, showRect, title, titleRect,
        cover, initials,
        quoteBar, quoteLines, quoteRects,
        wave, bars, refls, litAt,
        timecodePx: capPx, timecodeWidth, timecodeRect,
        total, totalRect, cta, ctaRect,
    };
}
/** The first letters of the first two words that start with an ASCII letter or digit. */
function initialsOf(showName) {
    const words = showName.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
    return words.slice(0, 2).map((w) => { var _a, _b; return ((_b = (_a = w.match(/[A-Za-z0-9]/)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "").toUpperCase(); }).join("");
}
/**
 * What the geometry promises. Every fitted text is measured; the timecode is
 * measured against the widest string its expression prints (already widened
 * for the system font); the wave and the footer hold their bands. The parent
 * "wave" source carries no constraint: the checker flattens through the
 * child and replaces it with the bars themselves.
 */
function audiogramContract(L) {
    return [
        ...(L.show ? [(0, layout_1.textFitsMeasured)("show", L.show.text, L.show.px, L.show.width)] : []),
        (0, layout_1.textFitsMeasured)("title", L.title.text, L.title.px, L.title.width),
        ...L.quoteLines.map((l, i) => (0, layout_1.textFitsMeasured)(`quote-${i}`, l.text, l.px, l.width)),
        ...(L.initials ? [(0, layout_1.textFitsMeasured)("initials", L.initials.text, L.initials.px, L.initials.width)] : []),
        (0, layout_1.textFitsMeasured)("timecode", "88:88", L.timecodePx, L.timecodeWidth),
        (0, layout_1.textFitsMeasured)("total", L.total.text, L.total.px, L.total.width),
        ...(L.cta ? [(0, layout_1.textFitsMeasured)("cta", L.cta.text, L.cta.px, L.cta.width)] : []),
        { label: "title", within: { yFrac: [0, 0.4] } },
        { label: "cover", aspect: 1 },
        { label: "bar-dim", within: { yFrac: [0.3, 0.98] } },
        { label: "bar-lit", within: { yFrac: [0.3, 0.98] } },
        { label: "timecode", within: { yFrac: [0.7, 1] } },
        { label: "total", within: { yFrac: [0.7, 1] } },
    ];
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-09-25/.
 */
const WHY = {
    day: 6,
    date: "2026-09-25",
    agent: "claude",
    model: "claude-fable-5",
    id: ID,
    title: "Episode Audiogram",
    who: "Podcast producers and show owners who post 1-2 clips per episode to socials; they gather on HN and r/podcasting and pay for Headliner or Wavve today.",
    problem: [
        "Every episode needs clips. On the Milk Video Show HN (164 points): \"sharing the entire clip to social media doesn't get the same engagement\"; a conference organiser in the same thread pays for Headliner premium to make promo clips.",
        "The asks in that thread are batch: chapter marks and RSS as input for \"bulk production\", and \"upload multiple audio clips at the same time. That would differentiate you from the competition.\" The GUI tools render one clip at a time.",
        "Berkeley's promotion guide lists audiograms as strategy #2; the Podcast Growth newsletter finds the stock templates \"quite boring\". The recurring inputs - title, quote, artwork, audio - are structured data the producer already has.",
    ],
    sources: [
        "https://news.ycombinator.com/item?id=29463007",
        "https://multimedia.journalism.berkeley.edu/tutorials/16-ways-to-promote-your-podcast/",
        "https://podcastgrowth.substack.com/p/creating-beautiful-audiograms-for",
    ],
    solution: [
        "Audio is an input like any other prop: a mediaType \"audio\" tile has no pixels but joins the engine's real mix, so the rendered MP4 IS the postable clip. With no file it renders silent, and the tri-state audio law writes no empty track.",
        "The wave reuses day-004's slice mechanism upside down: static dim bars in a mask-free child document, one accent copy per bar enable-gated at k*clip/N, and one drawtext timecode. Nothing per-pixel moves, so the clip stays cheap.",
        "Weak spots, honestly: no word-level captions (the quote is static), and the wave array is extracted by the producer - the usage page carries the one-liner. The default array is hand-tuned so the zero-input render still reads as an audiogram.",
    ],
    usage: {
        command: "m0saic make @one-a-day/social/episode-audiogram/v1 --template-repo . -w 1080 -h 1080 -o clip.mp4",
        try: [
            "audioSrc - the absolute path of the snippet; it plays under the sweep and ships inside the MP4",
            "wave - 32 peaks from audiowaveform -b 8, normalised 0..1; the default is a tuned speech shape",
            "-w 1080 -h 1920 - the reel crop; the row re-flows around the cover",
            "--durationMs 45000 - the pin IS the clip; the sweep and the timecode re-derive",
        ],
    },
    caveats: [
        "An audio file longer than the clip is cut at the clip's end; trim the snippet first (ffmpeg -ss -t) - the template does not pick the moment for you.",
        "No word-level caption timing: the quote is static. Headliner does karaoke captions; this does batch.",
        "The timecode digits are drawtext in the machine's font; pixels are deterministic per machine only.",
    ],
    // No runner trace.json for this run: the scheduled task fired early as a
    // missed-start catch-up, stalled while the laptop slept, and was cancelled;
    // the founder ran the day by hand in a Claude Code session. Phases are the
    // session's own wall clock (journal/2026-09-25/logs/session-timeline.json)
    // and the tool-call counts are the agent's own tally. Tokens and dollars
    // are omitted rather than guessed.
    timeline: {
        source: "self-reported",
        phases: [
            { name: "takeover (cancel the stalled run)", startMs: 0, durMs: 120000, calls: 6, tools: "Bash 5, Read 1" },
            { name: "scout", startMs: 120000, durMs: 960000, calls: 12, tools: "WebSearch 4, Bash 6, Read 2" },
            { name: "plan", startMs: 1080000, durMs: 480000, calls: 8, tools: "Read 5, Write 2, Grep 1" },
            { name: "build (2 variants)", startMs: 1560000, durMs: 720000, calls: 40, tools: "Bash 22, Edit 12, Read 6" },
            { name: "critique", startMs: 2280000, durMs: 120000, calls: 4, tools: "Read 3, Write 1" },
            { name: "ship (estimate)", startMs: 2400000, durMs: 600000, calls: 12, tools: "Bash 8, Write 2, Edit 2" },
        ],
    },
};
exports.EpisodeAudiogramV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-09-25 · Episode Audiogram",
    version: 1,
    description: "An episode promo clip: cover, pull-quote, a waveform that lights up as the snippet plays, a counting timecode - and the audio file muxed in, so the render is the post.",
    capabilities: { tier: "core" },
    tags: ["social", "2026-09-25", "day-006", "podcast", "audiogram", "waveform", "audio", "clip", "video"],
    outputHints: {
        width: 1080,
        height: 1080,
        fps: 30,
        durationMs: DEFAULTS.clipSec * 1000,
        format: { kind: "video", container: "mp4" },
        note: "A square social clip by default; 1080x1920 is the reel crop. The clip is clipSec long; an explicit --durationMs overrides it and becomes the clip.",
    },
    // The clip is the snippet: a host seeds its Duration field from the props.
    resolveOutputHints: (props) => {
        const clipSec = numberOr(props === null || props === void 0 ? void 0 : props.clipSec, DEFAULTS.clipSec, exports.MIN_CLIP_SEC, exports.MAX_CLIP_SEC);
        return { durationMs: Math.round(clipSec * 1000) };
    },
    propsSchema,
    defaultProps: {
        showName: DEFAULTS.showName,
        episodeTitle: DEFAULTS.episodeTitle,
        quote: DEFAULTS.quote,
        wave: [...exports.DEFAULT_WAVE],
        clipSec: DEFAULTS.clipSec,
        audioSrc: [],
        coverSrc: [],
        cta: DEFAULTS.cta,
        accent: DEFAULTS.accent,
        preset: DEFAULTS.preset,
        debugLayout: false,
    },
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.EpisodeAudiogramV1;
/** A finite number in range, or the fallback - for the hints resolver, which must never throw. */
function numberOr(v, fallback, min, max) {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}
/** An optional string prop: undefined = the default, "" = removed. ASCII only - the bundled font draws the rest as tofu. */
function pickText(value, fallback, name) {
    if (value === undefined)
        return fallback;
    if (typeof value !== "string")
        throw new Error(`${ID}: ${name} must be a string.`);
    return value.replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
}
function pickNumber(value, fallback, name, min, max) {
    if (value === undefined)
        return fallback;
    const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n))
        throw new Error(`${ID}: ${name} must be a number. Got ${JSON.stringify(value)}.`);
    if (!Number.isInteger(n))
        throw new Error(`${ID}: ${name} must be a whole number of seconds. Got ${JSON.stringify(value)}.`);
    if (n < min || n > max)
        throw new Error(`${ID}: ${name} must be between ${min} and ${max}. Got ${JSON.stringify(value)}.`);
    return n;
}
function pickColor(value, fallback, name) {
    const s = typeof value === "string" ? value.trim() : "";
    if (s.length === 0)
        return fallback;
    if (!HEX.test(s))
        throw new Error(`${ID}: ${name} ${JSON.stringify(value)} must be #rrggbb.`);
    return s;
}
function pickWave(value) {
    if (value === undefined)
        return [...exports.DEFAULT_WAVE];
    if (!Array.isArray(value))
        throw new Error(`${ID}: wave must be an array of numbers.`);
    if (value.length < exports.MIN_BARS || value.length > exports.MAX_BARS) {
        throw new Error(`${ID}: wave must carry ${exports.MIN_BARS}..${exports.MAX_BARS} amplitudes. Got ${value.length}.`);
    }
    for (const v of value) {
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1) {
            throw new Error(`${ID}: every wave amplitude must be a number in 0..1. Got ${JSON.stringify(v)}.`);
        }
    }
    return value.map((v) => round3(v));
}
/** A zero-or-one media prop: an array of path strings; the first non-empty wins, more than one is an error. */
function pickMedia(value, name) {
    var _a;
    if (value === undefined)
        return "";
    if (!Array.isArray(value))
        throw new Error(`${ID}: ${name} must be an array of zero or one path.`);
    const ids = value.map((v) => String(v).trim()).filter(Boolean);
    if (ids.length > 1)
        throw new Error(`${ID}: ${name} accepts zero or one file (got ${ids.length}).`);
    return (_a = ids[0]) !== null && _a !== void 0 ? _a : "";
}
const ASSET_ID_RE = /^[A-Za-z0-9_][A-Za-z0-9_.\-]{0,127}$/;
/**
 * Register a media ref in the assets map and return its id. A ref that is
 * already id-shaped (a bare filename, or an id a host's picker handed over)
 * IS the id, day-005 parity; a filesystem path with separators gets the
 * stable fixed id, with the path carried in the manifest entry.
 */
function registerMedia(assets, ref, fixedId, mediaType) {
    const id = (0, types_1.asAssetId)(ASSET_ID_RE.test(ref) ? ref : fixedId);
    assets[id] = { kind: "file", path: ref, mediaType };
    return id;
}
/** Ink that reads on `c`: the dark bg for a light colour, white for a dark one. */
function onColor(c) {
    const n = parseInt(String(c).slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return (lum > 0.6 ? "#101319" : "#ffffff");
}
/** Linear byte mix: `t` of `a` over `1-t` of `b` - the static stand-in for opacity, so a dim bar never costs an overlay layer. */
function mix(a, b, t) {
    const pa = parseInt(String(a).slice(1), 16);
    const pb = parseInt(String(b).slice(1), 16);
    const ch = (sa, sb) => Math.round(sa * t + sb * (1 - t));
    const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
    const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
    const bl = ch(pa & 255, pb & 255);
    return ("#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1));
}
function round3(n) { return Math.round(n * 1000) / 1000; }
/** The per-frame timecode: drawtext, video mode, one expression, always on. */
function timecodeSource(expr, px, color) {
    return {
        type: "text",
        renderMode: { kind: "video" },
        visual: { backgroundColor: "black@0" },
        layers: [
            {
                content: { kind: "expr", expr, eval: "frame" },
                style: { fontSize: px, fontColor: color },
                placement: { hAlign: "left", vAlign: "middle" },
            },
        ],
        editor: { owner: "template", label: "timecode" },
    };
}
async function render(props, ctx) {
    // The schema is documentation; render() is the gate.
    let clipSec = pickNumber(props.clipSec, DEFAULTS.clipSec, "clipSec", exports.MIN_CLIP_SEC, exports.MAX_CLIP_SEC);
    const showName = pickText(props.showName, DEFAULTS.showName, "showName");
    const episodeTitle = pickText(props.episodeTitle, DEFAULTS.episodeTitle, "episodeTitle");
    const quote = pickText(props.quote, DEFAULTS.quote, "quote");
    const cta = pickText(props.cta, DEFAULTS.cta, "cta");
    const wave = pickWave(props.wave);
    const accent = pickColor(props.accent, DEFAULTS.accent, "accent");
    const audioSrc = pickMedia(props.audioSrc, "audioSrc");
    const coverSrc = pickMedia(props.coverSrc, "coverSrc");
    if (props.preset !== undefined && props.preset !== "dark" && props.preset !== "light")
        throw new Error(`${ID}: preset must be "dark" or "light".`);
    const theme = props.preset === "light" ? PRESETS.light : PRESETS.dark;
    const assets = {};
    const audioId = audioSrc ? registerMedia(assets, audioSrc, "audio-src", "audio") : undefined;
    const coverId = coverSrc ? registerMedia(assets, coverSrc, "cover-art", "image") : undefined;
    if (audioId) {
        const known = ctx.media[audioId];
        if (known && known.kind !== "audio")
            throw new Error(`${ID}: audioSrc must be an audio file (got ${known.kind}).`);
    }
    if (coverId) {
        const known = ctx.media[coverId];
        if (known && known.kind !== "image")
            throw new Error(`${ID}: coverSrc must be an image (got ${known.kind}).`);
    }
    // The clip is the snippet. An explicit user pin wins and BECOMES the clip;
    // the host-seeded target is never read as one.
    const pinned = (0, template_utils_1.resolvePinnedDurationMs)(ctx);
    if (pinned !== undefined)
        clipSec = Math.max(1, Math.round(pinned / 1000));
    const durationMs = pinned !== undefined ? Math.round(pinned) : clipSec * 1000;
    const W = Math.max(1, Math.round(ctx.target.width));
    const H = Math.max(1, Math.round(ctx.target.height));
    const L = layoutAudiogram({ showName, episodeTitle, quote, cta, wave, clipSec }, W, H);
    const pieces = [];
    const piece = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    // ── 0. the audio: no pixels, joins the mix. Placed first, importance 0,
    //      under everything - the tile region never draws. ──
    if (audioId) {
        piece({ x: 0, y: 0, w: W, h: H }, 0, (0, template_utils_1.bindProp)((0, template_utils_1.tag)({
            type: "media",
            mediaType: "audio",
            assetId: audioId,
            editor: { owner: "template" },
        }, "audio"), "audioSrc", 0));
    }
    // ── 1. header ──
    if (L.show)
        piece(L.showRect, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.show.text, fontSize: L.show.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "show" }), "show"), "showName"));
    piece(L.titleRect, 3, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.title.text, fontSize: L.title.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "episodeTitle"));
    // ── 2. the cover: art when given, the accent initials tile when not ──
    if (coverId) {
        piece(L.cover, 2, (0, template_utils_1.tag)({ ...(0, template_utils_1.makeColorTile)(theme.dim), visual: { opacity: 0.18 } }, "cover"));
        piece(L.cover, 3, (0, template_utils_1.bindProp)((0, template_utils_1.tag)({
            type: "media",
            mediaType: "image",
            assetId: coverId,
            placement: { fit: "contain" },
            editor: { owner: "template" },
        }, "cover-media"), "coverSrc", 0));
    }
    else {
        piece(L.cover, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accent), "cover"), "coverSrc", 0));
        if (L.initials) {
            piece(L.cover, 3, (0, template_utils_1.tag)((0, text_1.textCell)({ text: L.initials.text, fontSize: L.initials.px, color: onColor(accent), hAlign: "center", bold: true, vAlign: "middle", label: "initials" }), "initials"));
        }
    }
    // ── 3. the quote and its accent bar ──
    if (L.quoteBar)
        piece(L.quoteBar, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accent), "quote-bar"), "accent"));
    L.quoteLines.forEach((line, i) => {
        const src = (0, template_utils_1.tag)((0, text_1.textCell)({ text: line.text, fontSize: line.px, color: theme.ink, hAlign: "left", vAlign: "middle", label: `quote-${i}` }), `quote-${i}`);
        piece(L.quoteRects[i], 3, i === 0 ? (0, template_utils_1.bindProp)(src, "quote") : src);
    });
    // ── 4. the wave, as a CHILD document (day-004's mechanism): static dim
    //      bars lower onto the grid sheet, one gated accent copy per bar, no
    //      masks anywhere, both canvas sides 5-smooth. ──
    const barPieces = [];
    const barDim = mix(theme.dim, theme.bg, theme.barDimMix);
    const barRefl = mix(theme.dim, theme.bg, 0.16);
    L.bars.forEach((r) => {
        barPieces.push({ rect: { ...r, importance: 1 }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(barDim), "bar-dim") });
    });
    L.refls.forEach((r) => {
        barPieces.push({ rect: { ...r, importance: 1 }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(barRefl), "bar-refl") });
    });
    L.bars.forEach((r, k) => {
        const at = L.litAt[k];
        // Bar 0 is lit for the whole clip - a static tile, not an overlay layer.
        const lit = at > 0
            ? (0, template_utils_1.makeColorTile)(accent, { overlay: { enable: `gte(t,${at})`, window: { startSec: at } } })
            : (0, template_utils_1.makeColorTile)(accent);
        barPieces.push({ rect: { ...r, importance: 2 }, source: (0, template_utils_1.tag)(lit, "bar-lit") });
    });
    const barPlaced = (0, template_utils_1.placeInsetPieces)({ rootW: L.wave.w, rootH: L.wave.h, pieces: barPieces });
    const waveDoc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(barPlaced.m0, ID),
        assets: {},
        size: { width: L.wave.w, height: L.wave.h },
        fps: ctx.target.fps,
        durationMs,
        // The child's own canvas: the page colour, or the band reads as a black strip.
        backgroundColor: theme.bg,
        sources: barPlaced.sources,
        editor: { label: `wave - ${L.n} bars over ${clockText(clipSec)}` },
    };
    piece(L.wave, 2, (0, template_utils_1.tag)({ type: "mosaic", ref: "wave", placement: { fit: "contain" } }, "wave"));
    // ── 5. footer: the counting timecode, the static total, the CTA ──
    piece(L.timecodeRect, 3, (0, template_utils_1.tag)(timecodeSource(timecodeExpr(clipSec), L.timecodePx, theme.ink), "timecode"));
    piece(L.totalRect, 3, (0, template_utils_1.tag)((0, text_1.textCell)({ text: L.total.text, fontSize: L.total.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "total" }), "total"));
    if (L.cta)
        piece(L.ctaRect, 3, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.cta.text, fontSize: L.cta.px, color: accent, hAlign: "right", bold: true, vAlign: "middle", label: "cta" }), "cta"), "cta"));
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets,
        size: { width: W, height: H },
        fps: ctx.target.fps,
        // The clip is the snippet - authored, so it out-ranks the hint.
        durationMs,
        backgroundColor: theme.bg,
        sources: placed.sources,
        children: { wave: waveDoc },
        editor: { label: `Episode Audiogram · ${clockText(clipSec)} · ${L.n} bars` },
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints: audiogramContract(L), debug: props.debugLayout === true });
}
