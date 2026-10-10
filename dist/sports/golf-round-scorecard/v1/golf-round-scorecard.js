"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GolfRoundScorecardV1 = void 0;
exports.golfMarkOf = golfMarkOf;
exports.golfSigned = golfSigned;
exports.normalizeGolfCard = normalizeGolfCard;
exports.golfMarkPath = golfMarkPath;
exports.layoutGolfCard = layoutGolfCard;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/sports/golf-round-scorecard/v1";
const DEFAULT_ACCENT = "#ff8a1f";
const THEMES = {
    dark: { bg: "#0e1613", ink: "#eaf0ea", dim: "#8d9c92" },
    light: { bg: "#f4f1e8", ink: "#1c231d", dim: "#5d6a5f" },
};
// An invented golfer's invented "finally broke 90" round: 89, par 72, one
// birdie (hole 7), one double (hole 8), a triple to finish - OUT 42, IN 47.
const DEFAULTS = {
    course: "Juniper Links",
    tees: "White - 69.6/128",
    golfer: "dana_h",
    date: "Oct 10, 2026",
    pars: [4, 4, 5, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 4, 4, 3, 5],
    scores: [5, 4, 6, 3, 5, 6, 3, 6, 4, 7, 4, 5, 3, 5, 4, 6, 5, 8],
    accent: DEFAULT_ACCENT,
    preset: "dark",
    debugLayout: false,
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    pars: {
        type: "json",
        required: false,
        description: "The hole pars off the card: 9 integers (one strip) or 18 (two), each 3 to 6 - a par 6 is allowed, Lake Chabot has one. Sets the par row, the OUT/IN par totals and the marks: a score one under par gets a ring, one over a square.",
        meta: {
            constraints: { jsonSchema: { type: "array", minItems: 9, maxItems: 18, items: { type: "integer", minimum: 3, maximum: 6 } } },
            ui: { label: "Pars", order: 1, primary: true },
        },
    },
    scores: {
        type: "json",
        required: false,
        description: "The strokes per hole, the same count as pars, each an integer 1 to 99. An ace (1) draws a filled ring whatever the par; a picked-up hole has to be written as the number you would take, and the card works out every mark, the nines and the totals.",
        meta: {
            constraints: { jsonSchema: { type: "array", minItems: 9, maxItems: 18, items: { type: "integer", minimum: 1, maximum: 99 } } },
            ui: { label: "Scores", order: 2, primary: true },
        },
    },
    course: {
        type: "string",
        required: false,
        description: "The course name, the header's first line. Up to 40 characters; the sample course is invented.",
        meta: { control: { placeholder: DEFAULTS.course }, ui: { label: "Course", order: 3 } },
    },
    tees: {
        type: "string",
        required: false,
        description: 'The tees line under the course, e.g. "White - 69.6/128". Up to 28 characters; empty removes the line.',
        meta: { control: { placeholder: DEFAULTS.tees }, ui: { label: "Tees", order: 4 } },
    },
    golfer: {
        type: "string",
        required: false,
        description: "The golfer, bottom-left of the header. Up to 32 characters; empty removes it. The sample handle is invented.",
        meta: { control: { placeholder: DEFAULTS.golfer }, ui: { label: "Golfer", order: 5 } },
    },
    date: {
        type: "string",
        required: false,
        description: "A free line bottom-right of the header: the date, a season, a thread. Up to 32 characters; empty removes it.",
        meta: { control: { placeholder: DEFAULTS.date }, ui: { label: "Date", order: 6 } },
    },
    accent: {
        type: "string",
        required: false,
        description: "The round total, an under-par total and the ace mark, as #rrggbb.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 7 } },
    },
    preset: {
        type: "string",
        required: false,
        description: 'Page and ink: "dark" (default) or "light" - the paper card.',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 8 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits its box, the hole columns are equal, the strips are one height, every mark is there) and draw it over the card.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
/* ── the arithmetic: pure, exported, and what the test asserts ── */
function fail(field, rule) { throw new Error(`${ID}: ${field} ${rule}`); }
/** Printable ASCII plus the accented Latin letters the bundled font draws; anything else is refused by name. */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;
function text(value, field, max) {
    if (typeof value !== "string")
        fail(field, "must be a string.");
    if (!DRAWN.test(value))
        fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use one line of printable ASCII and accented Latin letters (U+00C0-U+017F).`);
    const s = value.trim();
    if (s.length > max)
        fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
    return s;
}
/** The paper scorecard's mark for one hole: a ring under par, a square over, doubles for two or more, a filled ring for an ace. */
function golfMarkOf(par, score) {
    if (score === 1)
        return "ace";
    const d = score - par;
    if (d <= -2)
        return "ring2";
    if (d === -1)
        return "ring";
    if (d === 0)
        return "none";
    if (d === 1)
        return "square";
    return "square2";
}
/** +6 / E / -3, the way a scorecard prints a to-par. ASCII hyphen-minus. */
function golfSigned(n) {
    return n > 0 ? `+${n}` : n < 0 ? `-${-n}` : "E";
}
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
function normalizeGolfCard(props) {
    const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props !== null && props !== void 0 ? props : {}).filter(([, v]) => v !== undefined)) };
    const course = text(p.course, "course", 40);
    const tees = text(p.tees, "tees", 28);
    const golfer = text(p.golfer, "golfer", 32);
    const date = text(p.date, "date", 32);
    if (p.preset !== "dark" && p.preset !== "light")
        fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
    if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim()))
        fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
    if (typeof p.debugLayout !== "boolean")
        fail("debugLayout", "must be a boolean.");
    const readList = (name, min, max) => {
        const v = p[name];
        if (!Array.isArray(v))
            fail(name, `must be a list of 9 or 18 integers (the card's own ${name}).`);
        if (v.length !== 9 && v.length !== 18)
            fail(name, `has ${v.length} ${v.length === 1 ? "entry" : "entries"}; a round is 9 holes (one strip) or 18 (two).`);
        return v.map((x, i) => {
            if (typeof x !== "number" || !Number.isInteger(x))
                fail(`${name}[${i}]`, `${JSON.stringify(x)} is not an integer.`);
            if (x < min || x > max)
                fail(`${name}[${i}]`, `${x} is outside ${min} to ${max}.`);
            return x;
        });
    };
    const pars = readList("pars", 3, 6);
    const scores = readList("scores", 1, 99);
    if (pars.length !== scores.length)
        fail("scores", `has ${scores.length} entries against ${pars.length} pars; every hole needs both.`);
    const holes = pars.map((par, i) => ({ hole: i + 1, par, score: scores[i], mark: golfMarkOf(par, scores[i]) }));
    const nine = (from, name) => {
        const h = holes.slice(from, from + 9);
        const par = h.reduce((a, x) => a + x.par, 0);
        const score = h.reduce((a, x) => a + x.score, 0);
        return { name, par, score, toPar: score - par, holes: h };
    };
    const nines = [nine(0, "OUT")];
    if (holes.length === 18)
        nines.push(nine(9, "IN"));
    const total = nines.reduce((a, n) => a + n.score, 0);
    const parTotal = nines.reduce((a, n) => a + n.par, 0);
    const toPar = total - parTotal;
    const nineLine = nines.map((n) => `${n.name} ${n.score} (${golfSigned(n.toPar)})`).join(" - ") + ` - par ${parTotal}`;
    const vsText = `${golfSigned(toPar)} vs par`;
    return {
        course, tees, golfer, date, holes, nines, total, parTotal, toPar, nineLine, vsText,
        footnote: "These are the paper scorecard's own marks; a filled ring is a hole in one.",
        accent: p.accent.trim().toLowerCase(), preset: p.preset, debugLayout: p.debugLayout,
    };
}
/* ── colour ── */
// Not exported: the pack index is `export *`, and every card carries one of these.
function mix(a, b, t) {
    const ch = (s, i) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
    const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
    return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function luminance(hex) {
    const c = (i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
/** The readable ink over the filled ace mark: dark or white, whichever contrasts more with the caller's accent. */
function onColor(fill) {
    const ratio = (other) => { const a = luminance(fill), b = luminance(other); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
    return (ratio("#10151c") >= ratio("#ffffff") ? "#10151c" : "#ffffff");
}
/* ── the marks: SVG outline paths, authored in the mark's own square ── */
const num = (v) => String(Math.round(v * 100) / 100);
/** Circle subpath; `cw` picks the winding so a pair makes an annulus under nonzero and evenodd alike. */
function circle(cx, cy, r, cw) {
    return `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 ${cw ? 1 : 0} ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 ${cw ? 1 : 0} ${num(-2 * r)} 0z`;
}
/** Axis-aligned rect subpath; `cw` picks the winding so a pair makes an outline. */
function box(x, y, w, h, cw) {
    return cw ? `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}z` : `M${num(x)} ${num(y)}v${num(h)}h${num(w)}v${num(-h)}z`;
}
/**
 * The path for one mark, authored in a `side` x `side` square at (0,0) - the
 * mark rect's own pixel space, so the mask scales 1:1 and stays crisp. A
 * single ring is an annulus, a double a second annulus outside... inside it:
 * the outer ring hugs the mark rect, the inner ring sits within, both drawn
 * by alternating winding. An ace is one filled disc.
 */
function golfMarkPath(kind, side) {
    const c = side / 2;
    if (kind === "ace")
        return circle(c, c, c - 1, true);
    const stroke = Math.max(1, side * 0.055);
    if (kind === "ring" || kind === "ring2") {
        const r1 = c - 1, r2 = r1 - stroke;
        if (kind === "ring")
            return circle(c, c, r1, true) + circle(c, c, r2, false);
        const r3 = r2 - stroke - Math.max(2, stroke), r4 = r3 - stroke;
        return circle(c, c, r1, true) + circle(c, c, r2, false) + circle(c, c, r3, true) + circle(c, c, r4, false);
    }
    const i1 = 1, o = side - 2, i2 = 1 + stroke, w2 = o - 2 * stroke;
    if (kind === "square")
        return box(i1, i1, o, o, true) + box(i2, i2, w2, w2, false);
    const i3 = i2 + stroke + Math.max(2, stroke), w3 = o - 2 * (i3 - 1), i4 = i3 + stroke, w4 = o - 2 * (i4 - 1);
    return box(i1, i1, o, o, true) + box(i2, i2, w2, w2, false) + box(i3, i3, w3, w3, true) + box(i4, i4, w4, w4, false);
}
/** The mark's bounding side for a score string at `px`: snug around the digits, doubled marks 30% larger outside. */
function golfMarkSide(numText, px, doubled) {
    const pad = Math.max(2, Math.round(px * 0.22));
    const snug = Math.max((0, text_1.widthOf)(numText, px, true) + 2 * pad, px * 1.9);
    return doubled ? snug * 1.3 : snug;
}
/** The largest whole size up to `maxPx` at which one line fits the cell's budget (`cell * 0.94 - 2px`). */
function fitPx(line, cellW, maxPx, bold) {
    const top = Math.max(1, Math.round(maxPx));
    const room = (0, text_1.budget)(cellW), w = (0, text_1.widthOf)(line, top, bold);
    let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
    while (px > 1 && (0, text_1.widthOf)(line, px, bold) > room)
        px--;
    return px;
}
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
function layoutGolfCard(props, W, H) {
    const p = normalizeGolfCard(props);
    const theme = THEMES[p.preset];
    const ink = theme.ink, dim = theme.dim;
    const S = Math.min(W, H);
    const m = Math.round(S * 0.05), CW = W - 2 * m;
    const gap = Math.round(S * 0.014);
    const floor = Math.max(6, Math.round(S * 0.016)), small = Math.max(5, Math.round(S * 0.013));
    const cells = [];
    const marks = [];
    const tiles = [];
    const unfit = (field) => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
    /** One fitted line in `rect`; refuses below the floor instead of clipping. */
    const line = (label, rect, value, px, o = {}) => {
        var _a, _b, _c, _d, _e, _f;
        if (px < ((_a = o.floorPx) !== null && _a !== void 0 ? _a : floor))
            unfit((_b = o.field) !== null && _b !== void 0 ? _b : label);
        cells.push({ label, rect, text: value, px, width: (0, text_1.widthOf)(value, px, o.bold === true), bold: o.bold === true, align: (_c = o.align) !== null && _c !== void 0 ? _c : "left", color: (_d = o.color) !== null && _d !== void 0 ? _d : ink, bind: (_e = o.bind) !== null && _e !== void 0 ? _e : null, hole: (_f = o.hole) !== null && _f !== void 0 ? _f : null, over: o.over === true, ...(o.field ? { field: o.field } : {}) });
    };
    /* ── header: the course, the tees under it, the golfer and the date on a third line ── */
    let y = m;
    const coursePx = fitPx(p.course, CW, S * 0.072, true);
    const courseH = Math.round(coursePx * 1.3);
    line("course", { x: m, y, w: CW, h: courseH }, p.course, coursePx, { bold: true, bind: "course", floorPx: small });
    y += courseH;
    if (p.tees !== "") {
        const teesPx = fitPx(p.tees, CW, S * 0.03, false);
        const teesH = Math.round(teesPx * 1.35);
        line("tees", { x: m, y: y + Math.round(gap * 0.5), w: CW, h: teesH }, p.tees, teesPx, { color: dim, bind: "tees", floorPx: small });
        y += Math.round(gap * 0.5) + teesH;
    }
    if (p.golfer !== "" || p.date !== "") {
        const cap = S * 0.034;
        // The two cells share one line: the golfer's from the left, the date's from the
        // right, each as wide as its own text plus the quantization slack.
        const cellW = (t, px) => Math.round((0, text_1.widthOf)(t, px, false)) + Math.max(4, Math.round(px * 0.5));
        const both = p.golfer !== "" && p.date !== "";
        let px = Math.round(cap);
        while (px > 1 && (both ? cellW(p.golfer, px) + cellW(p.date, px) : cellW(p.golfer !== "" ? p.golfer : p.date, px)) > CW)
            px--;
        const lineH = Math.round(px * 1.35);
        const y3 = y + Math.round(gap * 0.5);
        if (p.golfer !== "")
            line("golfer", { x: m, y: y3, w: both ? cellW(p.golfer, px) : cellW(p.golfer, px), h: lineH }, p.golfer, Math.max(px, 1), { bind: "golfer", floorPx: small });
        if (p.date !== "")
            line("date", { x: W - m - cellW(p.date, px), y: y3, w: cellW(p.date, px), h: lineH }, p.date, Math.max(px, 1), { color: dim, align: "right", bind: "date", floorPx: small });
        y = y3 + lineH;
    }
    const headerBottom = y;
    /* ── legend and footnote, pinned to the bottom ── */
    const LEGEND = [
        { kind: "ring", label: "1 under" },
        { kind: "ring2", label: "2+ under" },
        { kind: "square", label: "1 over" },
        { kind: "square2", label: "2+ over" },
    ];
    const footCap = Math.round(S * 0.024);
    const footW = (px, mark) => LEGEND.reduce((a, it) => a + mark + Math.round(mark * 0.35) + (0, text_1.widthOf)(it.label, px, false) + Math.round(px * 1.6), 0);
    let legendPx = footCap, legendMark = Math.round(footCap * 2.1);
    while (legendPx > 1 && footW(legendPx, Math.round(legendPx * 2.1)) > CW)
        legendPx--;
    legendMark = Math.round(legendPx * 2.1);
    if (legendPx < small)
        unfit("the legend");
    const legendH = Math.max(legendMark, Math.round(legendPx * 1.35));
    let footPx = footCap;
    let footLines = [p.footnote];
    const wrapAt = (px) => {
        const words = p.footnote.split(" ");
        const out = [];
        let cur = "";
        for (const w of words) {
            const next = cur === "" ? w : `${cur} ${w}`;
            if ((0, text_1.widthOf)(next, px, false) > (0, text_1.budget)(CW) && cur !== "") {
                out.push(cur);
                cur = w;
            }
            else
                cur = next;
        }
        if (cur !== "")
            out.push(cur);
        return out;
    };
    while (footPx > 1 && (wrapAt(footPx).length > 2 || Math.round(footPx * 1.35) * 2 > Math.round(S * 0.09)))
        footPx--;
    footLines = wrapAt(footPx);
    if (footPx < small)
        unfit("the footnote");
    const footTextH = footLines.length * Math.round(footPx * 1.35);
    const footH = legendH + Math.round(gap * 0.6) + footTextH;
    const footTop = H - m - footH;
    // legend row: mark, its label, mark, its label - left to right along the bottom band.
    let lx = m;
    const legendLabelY = footTop + Math.round((legendH - Math.round(legendPx * 1.35)) / 2);
    for (const [i, it] of LEGEND.entries()) {
        const markRect = { x: lx, y: footTop + Math.round((legendH - legendMark) / 2), w: legendMark, h: legendMark };
        marks.push({ label: `legend-mark-${i}`, rect: markRect, kind: it.kind, color: ink, inkOver: null });
        const labelW = Math.round((0, text_1.widthOf)(it.label, legendPx, false));
        const labelCellW = labelW + Math.max(4, Math.round(legendPx * 0.5));
        line(`legend-${i}`, { x: markRect.x + legendMark + Math.round(legendMark * 0.35), y: legendLabelY, w: labelCellW, h: Math.round(legendPx * 1.35) }, it.label, legendPx, { color: dim, floorPx: small });
        lx = markRect.x + legendMark + Math.round(legendMark * 0.35) + labelCellW + Math.round(legendPx * 1.6);
    }
    cells.push({ label: "footnote", rect: { x: m, y: footTop + legendH + Math.round(gap * 0.6), w: CW, h: footTextH }, text: footLines.join("\n"), px: footPx, width: Math.max(...footLines.map((l) => (0, text_1.widthOf)(l, footPx))), bold: false, align: "left", color: dim, bind: null, hole: null, over: false });
    /* ── totals band: the nines on the left, the round total and its to-par on the right ── */
    const bigPx = fitPx(String(p.total), CW * 0.3, S * 0.125, true);
    const vsPx = fitPx(p.vsText, CW * 0.42, S * 0.042, p.toPar < 0);
    // Snug cells carry the quantization slack the contract teaches (cell * 0.94 - 2px):
    // the measured width plus 8-12% of the font size, so a pixel or two of split
    // remainder never tips the textFits check.
    const vsW = Math.round((0, text_1.widthOf)(p.vsText, vsPx, p.toPar < 0)) + Math.max(4, Math.round(vsPx * 0.12));
    const bigW = Math.round((0, text_1.widthOf)(String(p.total), bigPx, true)) + Math.max(4, Math.round(bigPx * 0.08));
    const rightW = bigW + Math.round(gap * 0.8) + vsW;
    const ninesW = CW - rightW - Math.round(gap * 0.4);
    const leftPx = fitPx(p.nineLine, ninesW, S * 0.034, false);
    const bigH = Math.round(bigPx * 1.3), vsH = Math.round(vsPx * 1.4), leftH = Math.round(leftPx * 1.35);
    const totalsH = Math.max(bigH, vsH, leftH);
    const totalsY = footTop - Math.round(S * 0.02) - totalsH;
    if (totalsY < headerBottom + gap)
        unfit(`the strips (${p.holes.length} holes)`);
    const vsColor = p.toPar < 0 ? p.accent : p.toPar === 0 ? ink : dim;
    line("total", { x: W - m - vsW - Math.round(gap * 0.8) - bigW, y: totalsY + totalsH - bigH, w: bigW, h: bigH }, String(p.total), bigPx, { bold: true, color: p.accent, bind: "accent", field: "the round total" });
    line("vspar", { x: W - m - vsW, y: totalsY + totalsH - vsH, w: vsW, h: vsH }, p.vsText, vsPx, { bold: p.toPar < 0, color: vsColor, align: "right", field: "the to-par line" });
    line("nines", { x: m, y: totalsY + Math.round((totalsH - leftH) / 2), w: ninesW, h: leftH }, p.nineLine, leftPx, { color: dim, floorPx: small, field: "the nines line" });
    /* ── the strips: hole / par / score rows, the score row the tallest ── */
    const nStrips = p.nines.length;
    const stripGap = Math.round(S * 0.022);
    const regionTop = headerBottom + Math.round(S * 0.03);
    const regionBottom = totalsY - Math.round(S * 0.025);
    const ROWS = [0.8, 0.8, 1.4];
    const rowU = Math.min(Math.round(S * 0.068), Math.floor((regionBottom - regionTop - (nStrips - 1) * stripGap) / (nStrips * 3)));
    if (rowU * 3 < floor * 4)
        unfit(`the strips (${p.holes.length} holes)`);
    const blockH = nStrips * Math.round(ROWS.reduce((a, r) => a + r * rowU, 0)) + (nStrips - 1) * stripGap;
    const stripsTop = regionTop + Math.max(0, Math.floor((regionBottom - regionTop - blockH) / 2));
    const strips = [];
    let gutterPx = 0, holePx = 0, parPx = 0, scorePx = 0;
    p.nines.forEach((nine, k) => {
        const stripRect = { x: m, y: stripsTop + k * (Math.round(ROWS.reduce((a, r) => a + r * rowU, 0)) + stripGap), w: CW, h: Math.round(ROWS.reduce((a, r) => a + r * rowU, 0)) };
        const rowH = ROWS.map((r) => Math.round(r * rowU));
        const rowY = [stripRect.y, stripRect.y + rowH[0], stripRect.y + rowH[0] + rowH[1]];
        tiles.push({ label: `strip-${k}`, rect: stripRect, color: mix(theme.bg, theme.ink, 0.08), radius: 0.05 });
        const padX = Math.round(CW * 0.018);
        const innerX = stripRect.x + padX, innerW = stripRect.w - 2 * padX;
        if (gutterPx === 0) {
            // One gutter, hole, par and score size for every strip: the card is one table.
            gutterPx = Math.max(small, Math.min(Math.round(rowH[0] * 0.4), Math.round(S * 0.03)));
            holePx = Math.max(small, Math.min(Math.round(rowH[0] * 0.46), Math.round(innerW * 0.02)));
            parPx = holePx;
            const gutterW = () => Math.round(Math.max(...["HOLE", "PAR", "SCORE"].map((t) => (0, text_1.widthOf)(t, gutterPx, false))) + Math.round(S * 0.012));
            const colW = Math.floor((innerW - gutterW() - Math.round(innerW * 0.012)) / 10);
            let px = Math.min(Math.round(rowH[2] * 0.62), Math.round(colW * 0.42), Math.round(S * 0.036));
            const target = () => Math.min(Math.floor((innerW - gutterW() - Math.round(innerW * 0.012)) / 10), rowH[2]) * 0.96;
            const fits = (pxTry) => p.holes.every((h) => golfMarkSide(String(h.score), pxTry, h.mark === "ring2" || h.mark === "square2") <= target());
            while (px > floor && !fits(px))
                px--;
            scorePx = px;
            if (scorePx < floor)
                unfit("the scores");
        }
        const gutterW = Math.round(Math.max(...["HOLE", "PAR", "SCORE"].map((t) => (0, text_1.widthOf)(t, gutterPx, false))) + Math.round(S * 0.012));
        const colGap = Math.round(innerW * 0.012);
        const colW = Math.floor((innerW - gutterW - colGap) / 10);
        const outW = innerW - gutterW - colGap - 9 * colW;
        const colX = Array.from({ length: 9 }, (_, i) => innerX + gutterW + colGap + i * colW);
        const outX = innerX + gutterW + colGap + 9 * colW;
        strips.push({ nine, rect: stripRect, rowY, rowH, gutterW, colX, colW, outW, outX });
        // gutter labels
        line(`gutter-${k}-hole`, { x: innerX, y: rowY[0], w: gutterW, h: rowH[0] }, "HOLE", gutterPx, { color: dim, floorPx: small });
        line(`gutter-${k}-par`, { x: innerX, y: rowY[1], w: gutterW, h: rowH[1] }, "PAR", gutterPx, { color: dim, floorPx: small });
        line(`gutter-${k}-score`, { x: innerX, y: rowY[2], w: gutterW, h: rowH[2] }, "SCORE", gutterPx, { color: dim, floorPx: small });
        // the OUT / IN column
        line(`nine-${k}`, { x: outX, y: rowY[0], w: outW, h: rowH[0] }, nine.name, holePx, { color: dim, bold: true, align: "center", floorPx: small });
        line(`nine-par-${k}`, { x: outX, y: rowY[1], w: outW, h: rowH[1] }, String(nine.par), parPx, { color: dim, align: "center", floorPx: small });
        line(`nine-score-${k}`, { x: outX, y: rowY[2], w: outW, h: rowH[2] }, String(nine.score), scorePx, { bold: true, align: "center", field: "the scores" });
        // the holes
        nine.holes.forEach((h, i) => {
            const at = nine.holes[0].hole - 1 + i;
            line(`hole-${at}`, { x: colX[i], y: rowY[0], w: colW, h: rowH[0] }, String(h.hole), holePx, { color: dim, align: "center", floorPx: small });
            line(`par-${at}`, { x: colX[i], y: rowY[1], w: colW, h: rowH[1] }, String(h.par), parPx, { color: dim, align: "center", bind: null, hole: at, floorPx: small });
            line(`score-${at}`, { x: colX[i], y: rowY[2], w: colW, h: rowH[2] }, String(h.score), scorePx, { bold: true, align: "center", hole: at, field: "the scores" });
            if (h.mark !== "none") {
                const side = Math.round(golfMarkSide(String(h.score), scorePx, h.mark === "ring2" || h.mark === "square2"));
                const r = { x: colX[i] + Math.round((colW - side) / 2), y: rowY[2] + Math.round((rowH[2] - side) / 2), w: side, h: side };
                marks.push({ label: `mark-${at}`, rect: r, kind: h.mark, color: h.mark === "ace" ? p.accent : ink, inkOver: h.mark === "ace" ? onColor(p.accent) : null });
                if (h.mark === "ace") {
                    // the ace's digit is drawn over the filled disc, in the readable ink for this accent
                    const c = cells[cells.length - 1];
                    c.color = onColor(p.accent);
                    c.over = true;
                }
            }
        });
    });
    return { p, theme, m, CW, gap, floor, small, cells, marks, tiles, strips, gutterPx, holePx, parPx, scorePx, rowU, headerBottom, totalsY, totalsH, footTop, footH, footLines: footLines.length, legendPx, legendMark, blockH, stripsTop };
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY = {
    "day": 21,
    "date": "2026-10-10",
    "agent": "opencode",
    "model": "glm-5.3",
    "id": "@one-a-day/sports/golf-round-scorecard/v1",
    "title": "Golf Round Scorecard",
    "who": "Golfers who keep a paper scorecard and post their rounds - r/golf and the golf forums, where the crumpled-scorecard photo is the standard post",
    "problem": [
        "The round is already numbers on a pocket card, and the share is a photo of the crumpled thing. TheGrint's Scorecard Picture Service exists for that exact workflow - \"simply take a picture of your Scorecard at the end of your round\" - and \"a team of real humans\" transcribes it back into data.",
        "The apps sell the moment but keep it inside: TheGrint ran a giveaway to get golfers to \"share it through your favorite social media platform\"; Golf GameBook promises to \"share your highlights on social media... with a single tap\". Without the subscription the round is still a crumpled card in a camera roll.",
    ],
    "sources": [
        "https://thegrint.com/range/post/scorecard-picture-service-use",
        "https://thegrint.com/range/post/scorephoto-giveaway",
        "https://www.golfgamebook.com/golf-scorecard",
    ],
    "solution": [
        "Give the card's own numbers - pars and scores, 9 or 18 holes - and one deterministic render returns the scorecard as a clean image: two nine-hole strips with hole, par and score rows, OUT and IN columns, the totals band, and the legend.",
        "The one decision: the marks are the scorecard's, not an app's. A ring is one under par, a square one over, doubles for two or more, a filled ring for an ace - drawn in the page ink like pencil, shape alone carrying the meaning. A season of rounds is one loop of the CLI.",
    ],
    "usage": {
        "command": "m0saic make @one-a-day/sports/golf-round-scorecard/v1 --template-repo . -w 1920 -h 1080 -o golf.png",
        "try": [
            "pars and scores: 9 integers render one strip, 18 render two; every mark, nine and total is computed",
            "an ace (score 1) draws a filled ring; an eagle two rings; a double bogey two squares",
            "preset \"light\" is the paper card; accent recolours the round total, an under-par line and the ace",
            "course, tees, golfer and date are free lines; tees, golfer and date can be empty to remove them",
        ],
    },
    "caveats": [
        "No putts, FIR/GIR or handicap columns, and no net score: the card draws the score rows a paper scorecard carries, gross only.",
        "Scores are integers 1 to 99; a picked-up hole has to be written as the number you would take (X and NR are refused).",
        "The default round - Juniper Links, dana_h, 89 - is invented, as the schema says; every number on it is consistent.",
    ],
    "timeline": {
        "source": "self-reported",
        "phases": [
            { "name": "scout", "startMs": 0, "durMs": 1440000, "tools": "WebSearch 6, Bash 7, Write 2" },
            { "name": "plan", "startMs": 1440000, "durMs": 1500000, "tools": "Read 8, Write 2" },
            { "name": "build", "startMs": 2940000, "durMs": 10200000, "tools": "Bash 12, Edit 12, Read 4, Write 4" },
            { "name": "critique", "startMs": 13140000, "durMs": 900000, "tools": "Bash 2, Write 1" },
            { "name": "ship", "startMs": 14040000, "durMs": 1200000, "tools": "Bash 3, Edit 2, Write 2" }
        ],
    },
};
exports.GolfRoundScorecardV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-10-10 · Golf Round Scorecard",
    version: 1,
    description: "A golf round scorecard card: give 9 or 18 pars and scores and it draws the hole, par and score strips with OUT/IN/TOTAL - and the paper card's own marks, a ring one under par and a square one over, doubles for two or more, a filled ring for an ace.",
    capabilities: { tier: "core" },
    tags: ["sports", "2026-10-10", "day-021", "golf", "scorecard", "round", "birdie", "ace"],
    outputHints: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Still PNG. The strips stack the same way on landscape, square and portrait; only the header and totals reflow. A 9-hole round renders one strip. Minimum tested canvas 480x270.",
    },
    propsSchema,
    defaultProps: DEFAULTS,
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.GolfRoundScorecardV1;
async function render(props, ctx) {
    const { width: W, height: H } = ctx.target;
    const L = layoutGolfCard(props, W, H);
    const pieces = [];
    const constraints = [];
    // Emitted in paint order: strip frames, then the marks, then the text -
    // placeInsetPieces puts a rect on the first overlay layer it does not
    // collide with, so each kind shares a layer and text sits over its mark.
    for (const t of L.tiles) {
        pieces.push({ rect: { ...t.rect, importance: 1 }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(t.color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } }), t.label) });
        constraints.push({ label: t.label, minWidthFrac: 0.9 });
    }
    for (const mk of L.marks) {
        const source = (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(mk.color, { mask: { kind: "inline-mask", localPath: golfMarkPath(mk.kind, Math.round(Math.min(mk.rect.w, mk.rect.h))), bounds: { x: 0, y: 0, width: Math.round(mk.rect.w), height: Math.round(mk.rect.h) } } }), mk.label);
        pieces.push({ rect: { ...mk.rect, importance: 2 }, source });
        constraints.push({ label: mk.label, aspect: 1, aspectTolerance: 0.25 });
    }
    for (const c of L.cells) {
        const cell = (0, template_utils_1.tag)((0, text_1.textCell)({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, vAlign: "middle", label: c.label }), c.label);
        // A text rect is BOUND to the prop it shows; a par or score is bound to its own entry (Make's double-click edits that hole); derived text stays unbound.
        pieces.push({ rect: { ...c.rect, importance: c.over ? 4 : 3 }, source: c.hole !== null ? (0, template_utils_1.bindPropPath)(cell, c.label.startsWith("par-") ? "pars" : "scores", [c.hole], "number") : c.bind === null ? cell : (0, template_utils_1.bindProp)(cell, c.bind) });
        constraints.push((0, layout_1.textFitsMeasured)(c.label, c.text, c.px, c.width));
    }
    // What the geometry promises, against the labels: the header is the top
    // quarter, the strips the middle (front nine above the back), the totals
    // band and the legend/footnote the bottom; the marks are present, square,
    // and (an ace) filled; the hole columns of a strip are one size; the two
    // strips are one height. Every text fits its box (measured, above).
    constraints.push({ label: "course", within: { yFrac: [0, 0.3] } });
    constraints.push({ label: "gutter-0-score", within: { yFrac: [0.1, 0.8] } });
    constraints.push({ label: "total", within: { yFrac: [0.5, 0.95] } });
    constraints.push({ label: "footnote", within: { yFrac: [0.8, 1] } });
    const relations = [];
    for (const s of L.strips) {
        relations.push({ label: s.nine.holes.map((h) => `par-${h.hole - 1}`), equal: "size", tolerancePx: 2 });
        relations.push({ label: s.nine.holes.map((h) => `score-${h.hole - 1}`), equal: "size", tolerancePx: 2 });
    }
    if (L.strips.length === 2) {
        constraints.push({ label: "gutter-1-score", within: { yFrac: [0.25, 0.9] } });
        relations.push({ label: ["strip-0", "strip-1"], equal: "size", tolerancePx: 2 });
    }
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets: {},
        backgroundColor: L.theme.bg,
        sources: placed.sources,
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints, relations, debug: props.debugLayout === true });
}
