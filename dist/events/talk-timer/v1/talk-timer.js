"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TalkTimerV1 = exports.SLICE_STEPS = exports.MAX_SLICES = exports.MAX_HOLD = exports.MAX_SECONDS = exports.MIN_SECONDS = void 0;
exports.sliceSecondsFor = sliceSecondsFor;
exports.phaseAtRemaining = phaseAtRemaining;
exports.sliceWindows = sliceWindows;
exports.litSlicesAt = litSlicesAt;
exports.smoothDown = smoothDown;
exports.digitsExpr = digitsExpr;
exports.phaseWindows = phaseWindows;
exports.fmtClock = fmtClock;
exports.layoutTalkTimer = layoutTalkTimer;
exports.talkTimerContract = talkTimerContract;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/events/talk-timer/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
exports.MIN_SECONDS = 5;
exports.MAX_SECONDS = 21600;
exports.MAX_HOLD = 60;
/** The bar never has more slices than this: past it a slice is a sliver, not a rectangle. */
exports.MAX_SLICES = 30;
/** Slice lengths a human reads at a glance, smallest first. */
exports.SLICE_STEPS = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600, 900, 1800, 3600];
const DEFAULTS = {
    seconds: 300,
    title: "Lightning talk",
    subtitle: "5 minute slot - hard stop",
    warnSec: 60,
    finalSec: 30,
    endText: "TIME",
    holdSec: 5,
    accent: "#3fb950",
    preset: "dark",
};
/** Hand-tuned trios: dark is tuned, not derived from light. */
const PRESETS = {
    dark: {
        bg: "#0d1117",
        ink: "#e6edf3",
        dim: "#8b949e",
        /** Spent slices are the dim ink at a low opacity, so whatever the frame is behind them - navy, amber, red - shows through and the bar belongs to the room. */
        spent: "#8b949e",
        spentOpacity: 0.28,
        amber: "#d29922",
        red: "#f85149",
        /** The frame behind everything during the amber / red phases when phaseTint is on. */
        tintWarn: "#2a2008",
        tintFinal: "#3a1216",
    },
    light: {
        bg: "#ffffff",
        ink: "#1f2328",
        dim: "#59636e",
        spent: "#59636e",
        spentOpacity: 0.22,
        amber: "#9a6700",
        red: "#cf222e",
        tintWarn: "#fff1cc",
        tintFinal: "#ffd9d9",
    },
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    seconds: {
        type: "number",
        required: false,
        description: "The countdown length in seconds. It is also the clip length (plus the hold). 300 is the lightning talk; 1080 an 18 minute slot.",
        meta: { constraints: { min: exports.MIN_SECONDS, max: exports.MAX_SECONDS }, ui: { label: "Seconds", order: 1, primary: true } },
    },
    title: {
        type: "string",
        required: false,
        description: "What the slot is. The rect that shows it is bound to it, so Make's double-click edits it in place. Empty removes the line.",
        meta: { control: { placeholder: DEFAULTS.title }, ui: { label: "Title", order: 2, primary: true } },
    },
    subtitle: {
        type: "string",
        required: false,
        description: "The rule of the format, under the title. Empty removes the line.",
        meta: { control: { placeholder: DEFAULTS.subtitle }, ui: { label: "Subtitle", order: 3 } },
    },
    warnSec: {
        type: "number",
        required: false,
        description: "Seconds remaining at which the digits, the bar's tip and the caption turn amber (EventTimer: \"yellow at the 1-minute mark\"). 0 disables the amber phase.",
        meta: { constraints: { min: 0, max: exports.MAX_SECONDS }, ui: { label: "Amber at (s left)", order: 4 } },
    },
    finalSec: {
        type: "number",
        required: false,
        description: "Seconds remaining at which they turn red (\"red at 30 seconds\"). 0 disables the red phase. Must not exceed the amber threshold.",
        meta: { constraints: { min: 0, max: exports.MAX_SECONDS }, ui: { label: "Red at (s left)", order: 5 } },
    },
    endText: {
        type: "string",
        required: false,
        description: "The word shown when the countdown reaches zero. TIME for a talk; LIVE for a starting-soon screen. Empty shows nothing.",
        meta: { control: { placeholder: DEFAULTS.endText }, ui: { label: "End word", order: 6 } },
    },
    holdSec: {
        type: "number",
        required: false,
        description: "How long the clip holds at 00:00 after the countdown, in seconds (0..60).",
        meta: { constraints: { min: 0, max: exports.MAX_HOLD }, ui: { label: "Hold at zero (s)", order: 7 } },
    },
    accent: {
        type: "string",
        required: false,
        description: "The calm colour - the digits and the bar before any warning - as #rrggbb. Amber and red are fixed by the preset so the warnings mean the same thing on every screen.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 8 } },
    },
    phaseTint: {
        type: "boolean",
        required: false,
        description: "Tint the whole frame with the phase - the room turns amber, then red - so a speaker reads the warning from the corner of an eye. Off keeps the frame dark and colours only the digits, the bar and the caption (quieter on a stream).",
        meta: { ui: { label: "Tint the frame by phase", order: 9 } },
    },
    preset: {
        type: "string",
        required: false,
        description: 'Hand-tuned background / ink / muted trio: "dark" (default - a confidence monitor) or "light".',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 10 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits its box, the digits and the bar sit in their bands) and draw it over the frame.",
        meta: { ui: { label: "Debug layout", order: 11 } },
    },
});
/* ── the arithmetic: pure, exported, and what the test asserts ── */
/** The slice length for a countdown: the smallest step that keeps the bar at or under MAX_SLICES slices. */
function sliceSecondsFor(seconds) {
    for (const step of exports.SLICE_STEPS)
        if (Math.ceil(seconds / step) <= exports.MAX_SLICES)
            return step;
    return exports.SLICE_STEPS[exports.SLICE_STEPS.length - 1];
}
/** The phase of a slice or of the digits at `remaining` seconds left. */
function phaseAtRemaining(remaining, warnSec, finalSec, strict = false) {
    const inside = (limit) => (strict ? remaining < limit : remaining <= limit);
    if (finalSec > 0 && inside(finalSec))
        return "final";
    if (warnSec > 0 && inside(warnSec))
        return "warn";
    return "calm";
}
/**
 * The bar's slices. Slice `i` (from the left) stands for the remaining-time
 * band `(i * slice, (i + 1) * slice]` and is lit while more than `i * slice`
 * seconds remain, i.e. while `t < seconds - i * slice`. Its colour is the
 * phase the digits are in while it is the lit tip, which is the phase at its
 * LOWER bound read strictly: the slice for 60..70 s left is calm, the slice
 * for 50..60 s left is amber, exactly as the digits flip at 60.
 */
function sliceWindows(seconds, warnSec, finalSec) {
    const slice = sliceSecondsFor(seconds);
    const n = Math.max(1, Math.ceil(seconds / slice));
    const out = [];
    for (let i = 0; i < n; i++) {
        const remainLo = i * slice;
        const remainHi = Math.min(seconds, (i + 1) * slice);
        out.push({
            index: i,
            remainLo,
            remainHi,
            outAtSec: round3(seconds - remainLo),
            frac: (remainHi - remainLo) / slice,
            phase: phaseAtRemaining(remainLo, warnSec, finalSec, true),
        });
    }
    return out;
}
/** How many slices are lit at clip time `t` - what the test checks against ceil(remaining / slice). */
function litSlicesAt(windows, t) {
    return windows.filter((w) => t < w.outAtSec).length;
}
function round3(n) { return Math.round(n * 1000) / 1000; }
/**
 * The largest 5-smooth number (2^a 3^b 5^c) at or below `n`. The bar is a
 * child document on its own canvas, and a canvas whose side carries a large
 * prime (1790 = 2 x 5 x 179) has no divisor lattice under the basis, so the
 * placement degrades to exact and the split count goes rough (179). A
 * 5-smooth side always quantizes; the few pixels given up are margins.
 */
function smoothDown(n) {
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
/**
 * The digits: ONE drawtext expression, evaluated per frame by ffmpeg, that
 * prints MM:SS of the seconds remaining. `R = max(0, ceil(S - t - 0.001))`
 * so the clip opens on 05:00, flips to 04:59 at exactly one second, and
 * holds 00:00 through the end hold. Inside `%{...}` drawtext wants `\:` and
 * `\,`; the engine's textfile path keeps them. Minutes are not folded into
 * hours: a 90 minute slot reads 90:00.
 */
function digitsExpr(seconds) {
    const S = String(round3(seconds));
    const R = `max(0\\,ceil(${S}-t-0.001))`;
    return `%{eif\\:trunc((${R})/60)\\:d\\:2}:%{eif\\:mod(${R}\\,60)\\:d\\:2}`;
}
/** The three phase windows of the digits and the caption, in clip seconds. `null` = the phase does not exist. */
function phaseWindows(seconds, warnSec, finalSec) {
    const warnAt = warnSec > 0 ? round3(seconds - warnSec) : null;
    const finalAt = finalSec > 0 ? round3(seconds - finalSec) : null;
    const calmEnd = warnAt !== null && warnAt !== void 0 ? warnAt : finalAt;
    return {
        calm: { startSec: 0, endSec: calmEnd },
        warn: warnAt === null ? null : { startSec: warnAt, endSec: finalAt },
        final: finalAt === null ? null : { startSec: finalAt, endSec: null },
    };
}
/** "1:00", "0:30", "18:00" - a threshold as a human writes it. */
function fmtClock(seconds) {
    const s = Math.max(0, Math.round(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
/** The enable gate for a window: raw commas - the engine escapes them natively. */
function gateExpr(w) {
    const parts = [];
    if (w.startSec > 0)
        parts.push(`gte(t,${w.startSec})`);
    if (w.endSec !== null)
        parts.push(`lt(t,${w.endSec})`);
    return parts.length === 0 ? "1" : parts.join("*");
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
 * Clauses joined by " - ", fitted by DROPPING whole clauses from the end
 * rather than cutting the sentence, so the thresholds survive a narrow
 * canvas and only the explanation goes.
 */
function fitClauses(clauses, maxW, maxPx, minPx) {
    var _a;
    for (let n = clauses.length; n >= 1; n--) {
        const text = clauses.slice(0, n).join(" - ");
        let px = Math.max(minPx, Math.round(maxPx));
        while (px > minPx && (0, text_1.widthOf)(text, px) > maxW)
            px = Math.max(minPx, Math.round(px * 0.92));
        if ((0, text_1.widthOf)(text, px) <= maxW)
            return { text, px, width: (0, text_1.widthOf)(text, px) };
    }
    return fitOne((_a = clauses[0]) !== null && _a !== void 0 ? _a : "", maxW, maxPx, minPx);
}
/**
 * The whole geometry as a pure function of the props and the canvas, so the
 * test can assert the rects, the windows and the fits without parsing m0.
 */
function layoutTalkTimer(opts, W, H) {
    const S = Math.min(H, 0.75 * W);
    const margin = Math.max(6, Math.round(0.06 * S));
    const minPx = Math.max(7, Math.round(0.016 * S));
    const contentW = Math.max(32, W - 2 * margin);
    const contentBudget = (0, text_1.budget)(contentW);
    // ── header: the slot's name and its rule ──
    const title = opts.title.length > 0 ? fitOne(opts.title, contentBudget, Math.round(0.07 * S), minPx, true) : null;
    const subtitle = opts.subtitle.length > 0 ? fitOne(opts.subtitle, contentBudget, Math.round(0.034 * S), minPx) : null;
    const titleH = title ? Math.round(1.25 * title.px) : 0;
    const subH = subtitle ? Math.round(1.5 * subtitle.px) : 0;
    const titleRect = { x: margin, y: margin, w: contentW, h: Math.max(1, titleH) };
    const subtitleRect = { x: margin, y: margin + titleH, w: contentW, h: Math.max(1, subH) };
    const headerBottom = margin + titleH + subH;
    // ── footer: the rule line left, the phase caption right ──
    const capPx = Math.max(minPx, Math.round(0.036 * S));
    const footerH = Math.round(1.6 * capPx);
    const footerY = H - margin - footerH;
    const captionW = Math.round(contentW * 0.38);
    const ruleW = contentW - captionW - Math.round(0.02 * contentW);
    const ruleRect = { x: margin, y: footerY, w: ruleW, h: footerH };
    const captionRect = { x: margin + contentW - captionW, y: footerY, w: captionW, h: footerH };
    // ── the middle band holds ONE centred group - the digits with the bar
    //    directly under them - so a tall canvas gets margins above and below,
    //    not a bar stranded at the bottom of an empty column ──
    const windows = sliceWindows(opts.seconds, opts.warnSec, opts.finalSec);
    const slice = sliceSecondsFor(opts.seconds);
    const bandTop = headerBottom + Math.round(0.5 * margin);
    const bandBottom = footerY - Math.round(0.6 * margin);
    const bandH = Math.max(24, bandBottom - bandTop);
    // The bar's own canvas: 5-smooth on both sides (see smoothDown), centred.
    const barH = smoothDown(Math.max(6, Math.min(Math.round(0.085 * S), Math.round(bandH * 0.2))));
    const barW = smoothDown(contentW);
    const barX = margin + Math.floor((contentW - barW) / 2);
    const gapUnder = Math.max(4, Math.round(0.45 * margin));
    // The digits are fitted to the WIDEST string the expression can print,
    // with room for the system font drawtext will use (a monospace or an
    // Arial-class face, wider than the bundled Roboto the measurer knows).
    const widest = "88:88";
    const widthCap = 0.92 * contentBudget;
    const digitsRoom = Math.max(12, bandH - gapUnder - barH);
    let digitsPx = Math.max(minPx, Math.min(Math.round(0.5 * S), Math.round(digitsRoom / 1.3)));
    while (digitsPx > minPx && (0, text_1.widthOf)(widest, digitsPx, true) > widthCap)
        digitsPx = Math.max(minPx, Math.round(digitsPx * 0.94));
    const digitsWidth = (0, text_1.widthOf)(widest, digitsPx, true);
    const digitsH = Math.min(digitsRoom, Math.round(1.3 * digitsPx));
    const groupH = digitsH + gapUnder + barH;
    const groupTop = bandTop + Math.max(0, Math.floor((bandH - groupH) / 2));
    const digitsRect = { x: margin, y: groupTop, w: contentW, h: digitsH };
    // ── the bar: one cell per slice, gaps between, the last one partial ──
    const barY = groupTop + digitsH + gapUnder;
    const bar = { x: barX, y: barY, w: barW, h: barH };
    const gap = Math.max(2, Math.round(0.006 * S));
    const n = windows.length;
    const fullW = (barW - (n - 1) * gap) / n;
    const slices = windows.map((w) => {
        const x0 = Math.round(barX + w.index * (fullW + gap));
        const x1 = Math.round(barX + w.index * (fullW + gap) + fullW * w.frac);
        return { x: x0, y: barY, w: Math.max(2, Math.min(x1, barX + barW) - x0), h: barH };
    });
    // ── the words ──
    const phases = phaseWindows(opts.seconds, opts.warnSec, opts.finalSec);
    const ruleClauses = [
        ...(opts.warnSec > 0 ? [`amber at ${fmtClock(opts.warnSec)}`] : []),
        ...(opts.finalSec > 0 ? [`red at ${fmtClock(opts.finalSec)}`] : []),
        ...(opts.endText.length > 0 ? [`then ${opts.endText}`] : []),
    ];
    const rule = fitClauses(ruleClauses.length > 0 ? ruleClauses : [`${fmtClock(opts.seconds)} on the clock`], (0, text_1.budget)(ruleW), Math.round(0.028 * S), minPx);
    const capBudget = (0, text_1.budget)(captionW);
    const captions = {
        calm: null,
        warn: phases.warn ? fitOne("WRAP UP", capBudget, capPx, minPx, true) : null,
        final: phases.final ? fitOne(`LAST ${Math.round(opts.finalSec)} SECONDS`, capBudget, capPx, minPx, true) : null,
    };
    const endCaption = opts.endText.length > 0 ? fitOne(opts.endText, capBudget, capPx, minPx, true) : null;
    return {
        W, H, S, margin,
        seconds: opts.seconds, holdSec: opts.holdSec, slice, windows, phases,
        title, titleRect, subtitle, subtitleRect,
        digitsPx, digitsWidth, digitsRect,
        bar, slices,
        rule, ruleRect, captions, endCaption, captionRect,
    };
}
/**
 * What the geometry promises. Text is calibrated from the measured block;
 * the digits from the widest string the expression prints, widened by 15%
 * for the system font; the bands the design depends on get a `within`.
 */
function talkTimerContract(L) {
    const digitsLabels = ["calm", "warn", "final"].filter((p) => L.phases[p] !== null).map((p) => `digits-${p}`);
    return [
        ...(L.title ? [(0, layout_1.textFitsMeasured)("title", L.title.text, L.title.px, L.title.width)] : []),
        ...(L.subtitle ? [(0, layout_1.textFitsMeasured)("subtitle", L.subtitle.text, L.subtitle.px, L.subtitle.width)] : []),
        (0, layout_1.textFitsMeasured)("rule", L.rule.text, L.rule.px, L.rule.width),
        ...["warn", "final"].filter((p) => L.captions[p]).map((p) => (0, layout_1.textFitsMeasured)(`caption-${p}`, L.captions[p].text, L.captions[p].px, L.captions[p].width)),
        ...(L.endCaption ? [(0, layout_1.textFitsMeasured)("caption-end", L.endCaption.text, L.endCaption.px, L.endCaption.width)] : []),
        ...digitsLabels.map((label) => (0, layout_1.textFitsMeasured)(label, "88:88", L.digitsPx, L.digitsWidth * 1.15)),
        // The digits are the product: they live in the middle band and are never a sliver.
        ...digitsLabels.map((label) => ({ label, within: { yFrac: [0.08, 0.85] }, minWidthFrac: 0.35 })),
        // The bar is the other half of the product: present, under the digits,
        // never collapsed. Its slices live in a child document and the check
        // flattens through it - which is also why the parent's "bar" source has
        // no constraint: flattening replaces it with the slices themselves.
        { label: "seg-lit", within: { yFrac: [0.25, 0.97] } },
        { label: "seg-spent", within: { yFrac: [0.25, 0.97] } },
        ...(L.title ? [{ label: "title", within: { yFrac: [0, 0.35] } }] : []),
        { label: "rule", within: { yFrac: [0.7, 1] } },
    ];
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-09-23/.
 */
const WHY = {
    day: 4,
    date: "2026-09-23",
    agent: "claude",
    model: "claude-fable-5-1",
    id: ID,
    title: "Talk Timer",
    who: "Stage crews and organisers running timed talk slots, and streamers with starting-soon scenes; found on timer-tool pages, the OBS forums and in ffmpeg gists.",
    problem: [
        "Every timed slot needs a countdown the speaker can see. EventTimer: \"a large, unambiguous countdown in the speaker's line of sight, on a confidence monitor, a tablet at the podium ... turns yellow at the 1-minute mark and red at 30 seconds\". Stagetimer's customers: Slush, YC Startup School, Munich Security Conference.",
        "When the countdown has to be a FILE, people hand-roll it. A gist that fed a YouTube playlist, a wiki page and a LinkedIn batch loop each re-derive the same ffmpeg drawtext expression, %{eif\\:S-t\\:d}; a Python GUI wraps it. The OBS forums: \"most people fake a pre-stream countdown with a fixed-length video\".",
        "The setting: WeAreDevelopers World Congress North America, 23-25 September 2026, San Jose - \"10,000+ Builders, 500+ Speakers, 3 Days\" - is five hundred timed slots on a dozen stages, and this run happened on its first day.",
    ],
    sources: [
        "https://stagetimer.io/use-cases/conference-and-speaker-timer/",
        "https://www.eventtimer.io/tools/presentation-timer",
        "https://gist.github.com/derand/31b8312fd64156120cb8f45825a1f0f7",
        "https://www.linkedin.com/pulse/batch-video-generator-countdown-ffmpeg-jose-velazquez-ma-pfkxe",
        "https://obsproject.com/forum/resources/stream-countdown-starting-soon-with-auto-scene-switch.2603/",
        "https://www.wearedevelopers.com/world-congress-north-america",
        "https://presenttimer.com/presentation-timer/",
        "https://slidemodel.com/tools/countdown-timer/5-minute-timer/",
        "https://wiki.tonytascioglu.com/scripts/ffmpeg/add_countdown_to_video",
        "https://github.com/pyoko-dev/countdown-generator",
        "https://obsproject.com/forum/threads/looking-for-a-countdown-timer.148696/",
        "https://createtimer.com/blog/how-to-create-twitch-starting-soon-screen-with-timer/",
    ],
    solution: [
        "One video document, no pipeline: the bar is a row of time-slice rectangles, each switched off on its own schedule by a scalar enable gate, and the digits are one drawtext expression - the one the gists wrote by hand, generated from props. Nothing per-pixel moves, so a five minute clip is cheap.",
        "The phases are thresholds, not animations: warnSec and finalSec are seconds remaining, exactly as the tools state them. The digits, the bar's zones, the caption and - with phaseTint, on by default - the whole frame read the same two numbers; at zero the end word appears and the clip holds.",
        "The claim is narrow on purpose. A file cannot pause or add a minute - the live apps can. This is for when the countdown must be a file: an OBS scene, a playback deck, a phone on the podium, a slide embed - and for batches, one clip per slot from the schedule.",
    ],
    usage: {
        command: "m0saic make @one-a-day/events/talk-timer/v1 --template-repo . -w 1920 -h 1080 -o timer.mp4",
        try: [
            "seconds 180, title Starting soon, endText LIVE, warnSec 0, finalSec 10 - a stream pre-roll",
            "seconds 1080, warnSec 300, finalSec 60 - an 18 minute slot with a five minute warning",
            "--durationMs 60000 - the clip length is the countdown: a one minute timer",
            "phaseTint false - a quiet frame for a stream overlay; only digits, bar and caption change",
        ],
    },
    caveats: [
        "A clip cannot pause, add time or be driven from backstage; a live timer app can. Regenerate the file when the slot changes.",
        "The digits are drawtext in the machine's default sans font, sized with margin; a very narrow canvas trades digit size for the bar.",
        "Minutes are not folded into hours: a 90 minute slot reads 90:00.",
    ],
    // No runner trace.json for this run: the day was run by hand in a Claude
    // Code session (the scheduled task missed its 09:00 because the laptop
    // was off), so the phases are the session's own wall clock
    // (journal/2026-09-23/logs/session-timeline.json) and the tool-call
    // counts are the agent's own tally. The ship phase's length is an
    // estimate - it is still running when this is written. Tokens and
    // dollars are omitted rather than guessed: the input/output split needed
    // to price them is not measurable from inside the session.
    timeline: {
        source: "self-reported",
        phases: [
            { name: "scout", startMs: 0, durMs: 991000, calls: 35, tools: "Bash 19, WebSearch 10, Read 5" },
            { name: "plan", startMs: 991000, durMs: 167000, calls: 3, tools: "Write 2, Bash 1" },
            { name: "build (3 variants)", startMs: 1158000, durMs: 4515000, calls: 81, tools: "Bash 34, Edit 22, Read 20" },
            { name: "critique", startMs: 5673000, durMs: 95000, calls: 8, tools: "Read 6, Write 1" },
            { name: "ship (estimate)", startMs: 5768000, durMs: 900000, calls: 14, tools: "Bash 8, Edit 3, Write 2" },
        ],
    },
};
exports.TalkTimerV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-09-23 · Talk Timer",
    version: 1,
    description: "A countdown clip for a timed talk slot: big digits, a bar of time-slice rectangles that go out on schedule, amber and red phases at the seconds you choose.",
    capabilities: { tier: "core" },
    tags: ["events", "2026-09-23", "day-004", "countdown", "timer", "talk", "conference", "stream", "video"],
    outputHints: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationMs: (DEFAULTS.seconds + DEFAULTS.holdSec) * 1000,
        format: { kind: "video", container: "mp4" },
        note: "A clip whose length is the countdown plus the hold. 16:9 for a confidence monitor, a stage screen or an OBS scene; portrait for a phone on the podium. An explicit --durationMs makes the countdown that long.",
    },
    // The countdown is the clip: a host seeds its Duration field from the props.
    // Pure and cheap; at the defaults it equals the static hint above.
    resolveOutputHints: (props) => {
        const seconds = numberOr(props === null || props === void 0 ? void 0 : props.seconds, DEFAULTS.seconds, exports.MIN_SECONDS, exports.MAX_SECONDS);
        const hold = numberOr(props === null || props === void 0 ? void 0 : props.holdSec, DEFAULTS.holdSec, 0, exports.MAX_HOLD);
        return { durationMs: Math.round((seconds + hold) * 1000) };
    },
    propsSchema,
    defaultProps: {
        seconds: DEFAULTS.seconds,
        title: DEFAULTS.title,
        subtitle: DEFAULTS.subtitle,
        warnSec: DEFAULTS.warnSec,
        finalSec: DEFAULTS.finalSec,
        endText: DEFAULTS.endText,
        holdSec: DEFAULTS.holdSec,
        accent: DEFAULTS.accent,
        phaseTint: true,
        preset: DEFAULTS.preset,
        debugLayout: false,
    },
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.TalkTimerV1;
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
function pickNumber(value, fallback, name, min, max, integer = true) {
    if (value === undefined)
        return fallback;
    const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n))
        throw new Error(`${ID}: ${name} must be a number. Got ${JSON.stringify(value)}.`);
    if (integer && !Number.isInteger(n))
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
/** The per-frame digits: drawtext, video mode, one expression, gated to its phase window. */
function digitsSource(expr, px, color, window, label) {
    return {
        type: "text",
        renderMode: { kind: "video" },
        visual: { backgroundColor: "black@0" },
        layers: [
            {
                content: { kind: "expr", expr, eval: "frame" },
                style: { fontSize: px, fontColor: color },
                placement: { hAlign: "center", vAlign: "middle" },
            },
        ],
        overlay: {
            enable: gateExpr(window),
            window: { ...(window.startSec > 0 ? { startSec: window.startSec } : {}), ...(window.endSec !== null ? { endSec: window.endSec } : {}) },
        },
        editor: { owner: "template", label },
    };
}
/** A static (svg) text cell that exists only inside a window. */
function gatedText(cell, window) {
    return {
        ...cell,
        overlay: {
            enable: gateExpr(window),
            window: { ...(window.startSec > 0 ? { startSec: window.startSec } : {}), ...(window.endSec !== null ? { endSec: window.endSec } : {}) },
        },
    };
}
async function render(props, ctx) {
    // The schema is documentation; render() is the gate.
    let seconds = pickNumber(props.seconds, DEFAULTS.seconds, "seconds", exports.MIN_SECONDS, exports.MAX_SECONDS);
    let holdSec = pickNumber(props.holdSec, DEFAULTS.holdSec, "holdSec", 0, exports.MAX_HOLD);
    const warnSec = pickNumber(props.warnSec, DEFAULTS.warnSec, "warnSec", 0, exports.MAX_SECONDS);
    const finalSec = pickNumber(props.finalSec, DEFAULTS.finalSec, "finalSec", 0, exports.MAX_SECONDS);
    if (warnSec >= seconds)
        throw new Error(`${ID}: warnSec (${warnSec}) must be below seconds (${seconds}) - a warning that starts before the clock does is no warning.`);
    if (finalSec >= seconds)
        throw new Error(`${ID}: finalSec (${finalSec}) must be below seconds (${seconds}).`);
    if (warnSec > 0 && finalSec > warnSec)
        throw new Error(`${ID}: finalSec (${finalSec}) must not exceed warnSec (${warnSec}) - red comes after amber.`);
    if (props.preset !== undefined && props.preset !== "dark" && props.preset !== "light")
        throw new Error(`${ID}: preset must be "dark" or "light".`);
    const theme = props.preset === "light" ? PRESETS.light : PRESETS.dark;
    const accent = pickColor(props.accent, DEFAULTS.accent, "accent");
    const title = pickText(props.title, DEFAULTS.title, "title");
    const subtitle = pickText(props.subtitle, DEFAULTS.subtitle, "subtitle");
    const endText = pickText(props.endText, DEFAULTS.endText, "endText");
    // The countdown is the clip. An explicit user pin wins and BECOMES the
    // countdown (minus the hold); the host-seeded target is never read as one.
    const pinned = (0, template_utils_1.resolvePinnedDurationMs)(ctx);
    if (pinned !== undefined) {
        const total = pinned / 1000;
        holdSec = Math.min(holdSec, Math.floor(total / 2));
        seconds = Math.max(1, Math.floor(total - holdSec));
        holdSec = round3(total - seconds);
    }
    const effWarn = warnSec >= seconds ? 0 : warnSec;
    const effFinal = finalSec >= seconds ? 0 : finalSec;
    const W = Math.max(1, Math.round(ctx.target.width));
    const H = Math.max(1, Math.round(ctx.target.height));
    const L = layoutTalkTimer({ seconds, holdSec, title, subtitle, warnSec: effWarn, finalSec: effFinal, endText }, W, H);
    const phaseColor = (p) => (p === "final" ? theme.red : p === "warn" ? theme.amber : accent);
    const pieces = [];
    const piece = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    const durationMs = Math.round((seconds + holdSec) * 1000);
    // ── 0. variant b's idea: the whole frame tints with the phase. Two
    //    full-canvas tiles painted first, each gated to its window (the engine
    //    trims each to its lifetime, so they cost nothing outside it). ──
    if (props.phaseTint !== false) {
        for (const p of ["warn", "final"]) {
            const w = L.phases[p];
            if (!w)
                continue;
            const tile = (0, template_utils_1.makeColorTile)(p === "warn" ? theme.tintWarn : theme.tintFinal, {
                overlay: { enable: gateExpr(w), window: { startSec: w.startSec, ...(w.endSec !== null ? { endSec: w.endSec } : {}) } },
            });
            piece({ x: 0, y: 0, w: W, h: H }, 0, (0, template_utils_1.tag)(tile, `tint-${p}`));
        }
    }
    // ── 1. the bar, as a CHILD document. Every enable-gated tile is its own
    //    overlay in ffmpeg's chain, and past ~25 the chain silently degrades
    //    the inline masks that every svg glyph on the frame rides. So the
    //    gated tiles live in a child rendered on its own small canvas (the bar
    //    rect): the spent tiles are static and lower onto the grid sheet, only
    //    the lit tiles are overlays, and none of them carries a mask (plain
    //    rectangles - the rectangle IS the data). The parent sees one source. ──
    const barPieces = [];
    for (const w of L.windows) {
        const r = L.slices[w.index];
        const local = { x: r.x - L.bar.x, y: r.y - L.bar.y, w: r.w, h: r.h };
        // Variant c's idea: a spent slice is translucent, so the frame's tint
        // reads through it and the bar stays one object with the room.
        barPieces.push({ rect: { ...local, importance: 1 }, source: (0, template_utils_1.tag)({ ...(0, template_utils_1.makeColorTile)(theme.spent), visual: { opacity: theme.spentOpacity } }, "seg-spent") });
    }
    for (const w of L.windows) {
        const r = L.slices[w.index];
        const local = { x: r.x - L.bar.x, y: r.y - L.bar.y, w: r.w, h: r.h };
        const lit = (0, template_utils_1.makeColorTile)(phaseColor(w.phase), { overlay: { enable: `lt(t,${w.outAtSec})`, window: { endSec: w.outAtSec } } });
        barPieces.push({ rect: { ...local, importance: 2 }, source: (0, template_utils_1.tag)(lit, "seg-lit") });
    }
    const barPlaced = (0, template_utils_1.placeInsetPieces)({ rootW: L.bar.w, rootH: L.bar.h, pieces: barPieces });
    const barDoc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(barPlaced.m0, ID),
        assets: {},
        size: { width: L.bar.w, height: L.bar.h },
        fps: ctx.target.fps,
        durationMs,
        sources: barPlaced.sources,
        editor: { label: `bar - ${L.windows.length} slices of ${L.slice}s` },
    };
    piece(L.bar, 2, (0, template_utils_1.tag)({ type: "mosaic", ref: "bar", placement: { fit: "contain" } }, "bar"));
    // 2. the header
    if (L.title)
        piece(L.titleRect, 3, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.title.text, fontSize: L.title.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "title"));
    if (L.subtitle)
        piece(L.subtitleRect, 3, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.subtitle.text, fontSize: L.subtitle.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "subtitle" }), "subtitle"), "subtitle"));
    // 3. the digits - one copy per phase, gated to disjoint windows. The calm
    //    copy is painted in the accent, so it is the rect that shows the prop.
    const expr = digitsExpr(seconds);
    for (const p of ["calm", "warn", "final"]) {
        const w = L.phases[p];
        if (!w)
            continue;
        const src = (0, template_utils_1.tag)(digitsSource(expr, L.digitsPx, phaseColor(p), w, `digits-${p}`), `digits-${p}`);
        piece(L.digitsRect, 4, p === "calm" ? (0, template_utils_1.bindProp)(src, "accent") : src);
    }
    // 4. the footer: the rule (static) and the captions (gated)
    piece(L.ruleRect, 3, (0, template_utils_1.tag)((0, text_1.textCell)({ text: L.rule.text, fontSize: L.rule.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "rule" }), "rule"));
    for (const p of ["warn", "final"]) {
        const fit = L.captions[p];
        const w = L.phases[p];
        if (!fit || !w)
            continue;
        // The caption of the last phase yields to the end word at zero.
        const win = p === "final" && L.endCaption ? { startSec: w.startSec, endSec: seconds } : w;
        piece(L.captionRect, 3, gatedText((0, template_utils_1.tag)((0, text_1.textCell)({ text: fit.text, fontSize: fit.px, color: phaseColor(p), hAlign: "right", bold: true, vAlign: "middle", label: `caption-${p}` }), `caption-${p}`), win));
    }
    if (L.endCaption) {
        const endColor = L.phases.final ? theme.red : L.phases.warn ? theme.amber : accent;
        piece(L.captionRect, 3, (0, template_utils_1.bindProp)(gatedText((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.endCaption.text, fontSize: L.endCaption.px, color: endColor, hAlign: "right", bold: true, vAlign: "middle", label: "caption-end" }), "caption-end"), { startSec: seconds, endSec: null }), "endText"));
    }
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets: {},
        size: { width: W, height: H },
        fps: ctx.target.fps,
        // The countdown is the clip - authored, so it out-ranks the hint.
        durationMs,
        backgroundColor: theme.bg,
        sources: placed.sources,
        children: { bar: barDoc },
        editor: { label: `Talk Timer · ${fmtClock(seconds)} · ${L.windows.length} slices of ${L.slice}s` },
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints: talkTimerContract(L), debug: props.debugLayout === true });
}
