"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwimTimeDropCardV1 = exports.MAX_SWIMS = void 0;
exports.parseSwimTime = parseSwimTime;
exports.formatSwimTime = formatSwimTime;
exports.formatSwimDrop = formatSwimDrop;
exports.formatSwimShare = formatSwimShare;
exports.normalizeSwimCard = normalizeSwimCard;
exports.layoutSwimCard = layoutSwimCard;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/sports/swim-time-drop-card/v1";
exports.MAX_SWIMS = 8;
/** The default draws the share of the entry time; "seconds" is one prop away. */
const DEFAULT_BAR = "percent";
const DEFAULT_ACCENT = "#2ec4b6";
/** The page is document.backgroundColor, never a full-canvas rect (doctor: canvasFill). */
const THEMES = {
    dark: { bg: "#0e1b25", ink: "#eaf2f5", dim: "#8ea3ae" },
    light: { bg: "#f5f9fa", ink: "#10222c", dim: "#55676f" },
};
// An invented swimmer at an invented meet. The chips are illustrative: no age
// group or sex is named, and they were not checked against a season's table.
const DEFAULT_SWIMS = [
    { event: "50 Free", entry: "31.84", final: "30.97", standard: "BB" },
    { event: "100 Free", entry: "1:10.52", final: "1:08.31", standard: "BB" },
    { event: "200 Free", entry: "2:36.40", final: "2:29.85", standard: "B" },
    { event: "100 Back", entry: "1:19.77", final: "1:20.19" },
    { event: "50 Fly", entry: "36.10", final: "34.92", standard: "B" },
    { event: "200 IM", entry: "2:58.03", final: "2:54.02" },
];
const DEFAULTS = {
    swimmer: "Tessa Marlow",
    club: "Larkmoor Swim Club",
    meet: "October Kickoff Invitational",
    details: "Oct 3-4, 2026",
    course: "SCY",
    swims: DEFAULT_SWIMS,
    bar: DEFAULT_BAR,
    accent: DEFAULT_ACCENT,
    preset: "dark",
    debugLayout: false,
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    swims: {
        type: "list",
        required: false,
        description: 'The swimmer\'s swims in meet order, 1 to 8 rows (split a longer meet across two cards). Each row is what a results row gives: the event, the entry (seed) time and the time swum, as "31.84", "1:10.52" or "19:58.44". An entry of "NT" (or empty) is a first swim; a final of "DQ" is a disqualification - both are printed, neither is counted.',
        meta: { constraints: { minItems: 1, maxItems: exports.MAX_SWIMS }, ui: { label: "Swims", order: 1, primary: true } },
        fields: {
            event: { type: "string", required: true, description: 'The event as the club says it: "50 Free", "200 IM", "100 Breaststroke". Up to 24 characters.', meta: { ui: { label: "Event" } } },
            entry: { type: "string", required: false, description: 'The entry (seed) time, "31.84" or "1:10.52". "NT" or empty when the swimmer had no time.', meta: { control: { placeholder: "NT" }, ui: { label: "Entry time" } } },
            final: { type: "string", required: true, description: 'The time swum, in the same formats, or "DQ".', meta: { ui: { label: "Final time" } } },
            standard: { type: "string", required: false, description: 'The motivational standard this swim reached, up to 4 characters ("B", "BB", "AAAA"). You supply it: the tables change by season, age and sex, and the template computes none.', meta: { control: { placeholder: "none" }, ui: { label: "Standard" } } },
        },
    },
    swimmer: {
        type: "string",
        required: false,
        description: "The swimmer's name, the largest text on the card. Up to 40 characters; accented Latin letters are drawn. The sample is an invented swimmer.",
        meta: { control: { placeholder: DEFAULTS.swimmer }, ui: { label: "Swimmer", order: 2, primary: true } },
    },
    club: {
        type: "string",
        required: false,
        description: "The club, under the name. Empty removes the line.",
        meta: { control: { placeholder: "none" }, ui: { label: "Club", order: 3 } },
    },
    meet: {
        type: "string",
        required: false,
        description: "The meet's name. Empty removes it.",
        meta: { control: { placeholder: "none" }, ui: { label: "Meet", order: 4 } },
    },
    details: {
        type: "string",
        required: false,
        description: "A free line for the date, the age group or the session. Empty removes it.",
        meta: { control: { placeholder: "none" }, ui: { label: "Details", order: 5 } },
    },
    course: {
        type: "string",
        required: false,
        description: 'The course the times were swum in, shown as a chip: "SCY" (short course yards), "SCM" (short course metres) or "LCM" (long course metres). Times in different courses do not compare.',
        meta: { constraints: { oneOf: ["SCY", "SCM", "LCM"] }, ui: { label: "Course", order: 6 } },
    },
    bar: {
        type: "string",
        required: false,
        description: 'What a bar\'s length means: "percent" (the share of the entry time dropped - fair between a 50 and a 200; each bar prints its percent at its end) or "seconds" (the seconds dropped, the number already printed on the row - the long events dominate). The longest bar fills its track either way, and the footnote says which it is.',
        meta: { constraints: { oneOf: ["percent", "seconds"] }, ui: { label: "Bar shows", order: 7 } },
    },
    accent: {
        type: "string",
        required: false,
        description: "The club's colour, as #rrggbb: the bars, the course chip and the standard chips.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 8 } },
    },
    preset: {
        type: "string",
        required: false,
        description: 'Page and ink: "dark" (default) or "light".',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 9 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits its box, every row has a track, the tracks are one size) and draw it over the card.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
/* ── the arithmetic: pure, exported, and what the test asserts ── */
function fail(field, rule) { throw new Error(`${ID}: ${field} ${rule}`); }
/** "31.84", "1:10.52", "19:58.44" -> integer hundredths of a second; null when it is not a time. */
function parseSwimTime(text) {
    const m = /^(?:(\d{1,2}):([0-5]\d)|(\d{1,2}))\.(\d{2})$/.exec(text);
    if (!m)
        return null;
    const cs = m[1] !== undefined ? (Number(m[1]) * 60 + Number(m[2])) * 100 + Number(m[4]) : Number(m[3]) * 100 + Number(m[4]);
    return cs > 0 ? cs : null;
}
/** Hundredths back to the way a results sheet prints them: SS.hh under a minute, M:SS.hh above. */
function formatSwimTime(cs) {
    const two = (n) => String(n).padStart(2, "0");
    const min = Math.floor(cs / 6000), sec = Math.floor((cs % 6000) / 100), hun = cs % 100;
    return min > 0 ? `${min}:${two(sec)}.${two(hun)}` : `${sec}.${two(hun)}`;
}
/** drop = entry - final, with its sign: "-0.87" faster, "+0.42" slower, "0.00" equal. ASCII hyphen-minus. */
function formatSwimDrop(dropCs) {
    return dropCs > 0 ? `-${formatSwimTime(dropCs)}` : dropCs < 0 ? `+${formatSwimTime(-dropCs)}` : "0.00";
}
/**
 * The share of the entry time dropped, to a tenth of a percent, rounded half
 * up in integers. A real drop too small to round to 0.1% says so: "0.0%"
 * beside a bar would read as no drop at all.
 */
function formatSwimShare(dropCs, entryCs) {
    const tenths = Math.floor((2000 * dropCs + entryCs) / (2 * entryCs));
    return tenths === 0 && dropCs > 0 ? "<0.1%" : `${Math.floor(tenths / 10)}.${tenths % 10}%`;
}
/**
 * Printable ASCII plus the accented Latin letters (Latin-1 and Latin
 * Extended-A, U+00C0-U+017F without the two maths signs). The bundled font
 * has a glyph for every one of them in both weights - the test walks the
 * range - so a Zoe with a diaeresis is drawn, and anything else is refused
 * by name instead of rendering as tofu.
 */
const DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/;
function text(value, field, min, max) {
    if (typeof value !== "string")
        fail(field, "must be a string.");
    if (!DRAWN.test(value))
        fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use one line of printable ASCII and accented Latin letters (U+00C0-U+017F).`);
    const s = value.trim();
    if (s.length < min)
        fail(field, "must not be blank.");
    if (s.length > max)
        fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
    return s;
}
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
function normalizeSwimCard(props) {
    const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props !== null && props !== void 0 ? props : {}).filter(([, v]) => v !== undefined)) };
    const swimmer = text(p.swimmer, "swimmer", 1, 40);
    const club = text(p.club, "club", 0, 48);
    const meet = text(p.meet, "meet", 0, 48);
    const details = text(p.details, "details", 0, 48);
    if (p.course !== "SCY" && p.course !== "SCM" && p.course !== "LCM")
        fail("course", `${JSON.stringify(p.course)} must be "SCY", "SCM" or "LCM".`);
    if (p.bar !== "percent" && p.bar !== "seconds")
        fail("bar", `${JSON.stringify(p.bar)} must be "percent" or "seconds".`);
    if (p.preset !== "dark" && p.preset !== "light")
        fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
    if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim()))
        fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
    if (typeof p.debugLayout !== "boolean")
        fail("debugLayout", "must be a boolean.");
    if (!Array.isArray(p.swims) || p.swims.length === 0)
        fail("swims", "must hold at least one { event, entry, final }.");
    if (p.swims.length > exports.MAX_SWIMS)
        fail("swims", `has ${p.swims.length} rows; one card holds at most ${exports.MAX_SWIMS} - split the meet across two cards.`);
    const bar = p.bar;
    const lines = p.swims.map((row, i) => {
        const at = `swims[${i}]`;
        if (!row || typeof row !== "object" || Array.isArray(row))
            fail(at, "must be an object { event, entry, final, standard? }.");
        const event = text(row.event, `${at}.event`, 1, 24);
        const entryRaw = row.entry === undefined ? "" : text(row.entry, `${at}.entry`, 0, 12);
        if (row.final === undefined)
            fail(`${at}.final`, 'is missing: give the time swum, or "DQ".');
        const finalRaw = text(row.final, `${at}.final`, 1, 12);
        const standard = row.standard === undefined ? "" : text(row.standard, `${at}.standard`, 0, 12);
        if (standard.length > 4)
            fail(`${at}.standard`, `${JSON.stringify(standard)} is longer than 4 characters ("B", "BB", "AAAA").`);
        if (/\s/.test(standard))
            fail(`${at}.standard`, `${JSON.stringify(standard)} must not contain a space.`);
        const noTime = entryRaw === "" || entryRaw.toUpperCase() === "NT";
        const dq = finalRaw.toUpperCase() === "DQ";
        const entryCs = noTime ? null : parseSwimTime(entryRaw);
        const finalCs = dq ? null : parseSwimTime(finalRaw);
        if (!noTime && entryCs === null)
            fail(`${at}.entry`, `${JSON.stringify(entryRaw)} is not a time: write "31.84" or "1:10.52", or "NT" for no entry time.`);
        if (!dq && finalCs === null)
            fail(`${at}.final`, `${JSON.stringify(finalRaw)} is not a time: write "30.97" or "1:08.31", or "DQ".`);
        if (dq && standard !== "")
            fail(`${at}.standard`, `${JSON.stringify(standard)} is set on a DQ: a disqualified swim has no time and reaches no standard.`);
        const dropCs = entryCs !== null && finalCs !== null ? entryCs - finalCs : null;
        return {
            event, entryCs, finalCs,
            entryText: entryCs === null ? "NT" : formatSwimTime(entryCs),
            finalText: finalCs === null ? "DQ" : formatSwimTime(finalCs),
            dropCs,
            dropText: dropCs !== null ? formatSwimDrop(dropCs) : finalCs !== null ? "first swim" : "",
            standard, share: 0,
            shareText: dropCs !== null && dropCs > 0 ? formatSwimShare(dropCs, entryCs) : "",
        };
    });
    // The scale: the largest drop on THIS card fills the track. Bars compare one
    // swimmer's swims with each other, never swimmers with each other. Fractions
    // are compared by cross-multiplication, so the choice of the longest is exact.
    const num = (l) => l.dropCs;
    const den = (l) => (bar === "percent" ? l.entryCs : 1);
    const faster = lines.filter((l) => l.dropCs !== null && l.dropCs > 0);
    const longest = faster.reduce((best, l) => (best === null || num(l) * den(best) > num(best) * den(l) ? l : best), null);
    if (longest)
        for (const l of faster)
            l.share = (num(l) * den(longest)) / (den(l) * num(longest));
    const compared = lines.filter((l) => l.dropCs !== null).length;
    const totalCs = faster.reduce((sum, l) => sum + num(l), 0);
    const countText = compared === 0 ? "No times to compare" : `${faster.length} of ${compared} ${compared === 1 ? "swim" : "swims"} faster`;
    // Slower swims are not netted against the total: each is printed on its own row.
    const totalText = faster.length === 0 ? "" : totalCs < 6000 ? `${formatSwimTime(totalCs)} s dropped` : `${formatSwimTime(totalCs)} dropped`;
    const scaleText = longest === null ? ""
        : bar === "percent" ? formatSwimShare(num(longest), longest.entryCs)
            : num(longest) < 6000 ? `${formatSwimTime(num(longest))} s` : formatSwimTime(num(longest));
    const footnote = compared === 0 ? "vs entry time. A first swim or a DQ has no drop to show."
        : longest === null ? "vs entry time. No swim was faster, so no bar is drawn."
            : bar === "percent" ? "vs entry time. Bars and their percentages: share of the entry time dropped."
                : `vs entry time. Bars: seconds dropped; the longest is ${scaleText}.`;
    return {
        swimmer, club, meet, details, course: p.course, bar, preset: p.preset,
        accent: p.accent.trim().toLowerCase(), debugLayout: p.debugLayout,
        lines, faster: faster.length, compared, totalCs, countText, totalText, scaleText, footnote,
    };
}
/* ── colour ── */
// Not exported: the pack index is `export *`, and dev/bench-delta already exports a `mix`.
function mix(a, b, t) {
    const ch = (s, i) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
    const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
    return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function luminance(hex) {
    const c = (i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
/** The readable ink over a filled chip: dark or white, whichever contrasts more with the caller's accent. */
function onColor(fill) {
    const ratio = (other) => { const a = luminance(fill), b = luminance(other); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
    return (ratio("#0b1220") >= ratio("#ffffff") ? "#0b1220" : "#ffffff");
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
function layoutSwimCard(props, W, H) {
    const p = normalizeSwimCard(props);
    const theme = THEMES[p.preset];
    const ink = theme.ink, dim = theme.dim;
    const S = Math.min(W, H);
    // Wide canvases put the bar in a column; square and portrait need the width
    // for the text cells, so the bar becomes a strip under the row's text line.
    const wide = W * 3 >= H * 4;
    const k = wide ? 1 : Math.max(1, Math.min(1.25, H / W));
    const m = Math.round(S * 0.055), CW = W - 2 * m;
    const gap = Math.round(S * 0.022);
    const rule = Math.max(1, Math.round(S * 0.0025));
    // Below these sizes copy is refused, not shrunk further: the row text and the
    // header at 1.8% of the short side, the chrome (heads, chips, footnote) at 1.3%.
    const floor = Math.max(6, Math.round(S * 0.018)), small = Math.max(5, Math.round(S * 0.013));
    const cells = [];
    const tiles = [];
    const unfit = (field) => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
    /** One fitted line in `rect`; refuses below the floor instead of clipping. */
    const line = (label, rect, value, px, o = {}) => {
        var _a, _b, _c, _d, _e;
        if (px < ((_a = o.floor) !== null && _a !== void 0 ? _a : floor))
            unfit((_b = o.field) !== null && _b !== void 0 ? _b : label);
        cells.push({ label, rect, text: value, px, width: (0, text_1.widthOf)(value, px, o.bold === true), bold: o.bold === true, align: (_c = o.align) !== null && _c !== void 0 ? _c : "left", color: (_d = o.color) !== null && _d !== void 0 ? _d : ink, bind: (_e = o.bind) !== null && _e !== void 0 ? _e : null, over: o.over === true });
    };
    // ── header: the name is the largest text; the course chip sits top right ──
    const right = p.meet !== "" || p.details !== "";
    let headerBottom;
    if (wide) {
        const hH = Math.round((H - 2 * m) * 0.21);
        const chipH = Math.round(hH * 0.3), chipW = Math.round(chipH * 2.3);
        const leftW = right ? Math.round(CW * 0.56) : CW - chipW - gap;
        const rightX = m + leftW + gap, rightW = CW - leftW - gap;
        const nameH = Math.round(hH * 0.62), subY = m + Math.round(hH * 0.68), subH = m + hH - subY;
        const midY = m + Math.round(hH * 0.36), midH = subY - midY;
        line("swimmer", { x: m, y: m, w: leftW, h: nameH }, p.swimmer, fitPx(p.swimmer, leftW, nameH * 0.74, true), { bold: true, bind: { prop: "swimmer" } });
        const subPx = Math.min(...[[p.club, leftW], [p.meet, rightW], [p.details, rightW]].map(([t, w]) => (t === "" ? Infinity : fitPx(t, w, subH * 0.6, false))), Math.round(subH * 0.6));
        if (p.club !== "")
            line("club", { x: m, y: subY, w: leftW, h: subH }, p.club, subPx, { color: dim, bind: { prop: "club" } });
        if (p.meet !== "")
            line("meet", { x: rightX, y: midY, w: rightW, h: midH }, p.meet, subPx, { color: dim, align: "right", bind: { prop: "meet" } });
        if (p.details !== "")
            line("details", { x: rightX, y: subY, w: rightW, h: subH }, p.details, subPx, { color: dim, align: "right", bind: { prop: "details" } });
        tiles.push({ label: "course-chip", rect: { x: W - m - chipW, y: m, w: chipW, h: chipH }, color: p.accent, radius: 0.5, layer: 1, accent: true });
        headerBottom = m + hH;
    }
    else {
        const nameH = Math.round(S * 0.085 * k), lineH = Math.round(S * 0.044 * k);
        const chipH = Math.round(nameH * 0.56), chipW = Math.round(chipH * 2.3);
        const nameW = CW - chipW - gap;
        line("swimmer", { x: m, y: m, w: nameW, h: nameH }, p.swimmer, fitPx(p.swimmer, nameW, nameH * 0.74, true), { bold: true, bind: { prop: "swimmer" } });
        tiles.push({ label: "course-chip", rect: { x: W - m - chipW, y: m + Math.round((nameH - chipH) / 2), w: chipW, h: chipH }, color: p.accent, radius: 0.5, layer: 1, accent: true });
        // The club on its own line. The meet and the details share the next one,
        // split by what each needs, while both fit there at the full size; a long
        // pair takes a line each rather than shrinking to share one.
        const subTop = Math.round(lineH * 0.62);
        const meetNeed = (0, text_1.widthOf)(p.meet, subTop), detailsNeed = (0, text_1.widthOf)(p.details, subTop);
        const both = p.meet !== "" && p.details !== "";
        const shared = both && Math.ceil((meetNeed + 2) / 0.94) + Math.ceil((detailsNeed + 2) / 0.94) + 2 * gap <= CW;
        const detailsW = !both || !shared ? CW : Math.ceil((detailsNeed + 2) / 0.94) + 1, meetW = !both || !shared ? CW : CW - detailsW - 2 * gap;
        const subPx = Math.min(...[[p.club, CW], [p.meet, meetW], [p.details, detailsW]].map(([t, w]) => (t === "" ? Infinity : fitPx(t, w, subTop, false))), subTop);
        let y = m + nameH;
        if (p.club !== "") {
            line("club", { x: m, y, w: CW, h: lineH }, p.club, subPx, { color: dim, bind: { prop: "club" } });
            y += lineH;
        }
        if (p.meet !== "") {
            line("meet", { x: m, y, w: meetW, h: lineH }, p.meet, subPx, { color: dim, bind: { prop: "meet" } });
            if (!shared)
                y += lineH;
        }
        if (p.details !== "") {
            line("details", { x: W - m - detailsW, y, w: detailsW, h: lineH }, p.details, subPx, { color: dim, align: shared ? "right" : "left", bind: { prop: "details" } });
            y += lineH;
        }
        headerBottom = y;
    }
    const courseChip = tiles[0].rect;
    line("course", courseChip, p.course, fitPx(p.course, courseChip.w, courseChip.h * 0.5, true), { bold: true, align: "center", color: onColor(p.accent), over: true, floor: small });
    // ── summary band, built from the bottom up: count and total, then the footnote that carries the honesty ──
    const footTop = Math.round(S * 0.025 * k);
    const oneLine = fitPx(p.footnote, CW, footTop, false);
    let footPx = oneLine, footLines = [p.footnote];
    if (oneLine < footTop * 0.9) {
        // Two lines at the target size beat one shrunken line; shrink only when two do not hold it.
        footPx = footTop;
        footLines = (0, template_utils_1.wrapMeasured)(p.footnote, footPx, (0, text_1.budget)(CW));
        while (footLines.length > 2 && footPx > 1) {
            footPx--;
            footLines = (0, template_utils_1.wrapMeasured)(p.footnote, footPx, (0, text_1.budget)(CW));
        }
    }
    if (footPx < small)
        unfit("footnote");
    const footLineH = Math.round(footPx * 1.4), footH = footLines.length * footLineH + 2;
    const footRect = { x: m, y: H - m - footH, w: CW, h: footH };
    cells.push({ label: "footnote", rect: footRect, text: footLines.join("\n"), px: footPx, width: Math.max(...footLines.map((l) => (0, text_1.widthOf)(l, footPx))), bold: false, align: "left", color: dim, bind: null, over: false });
    const sumTop = Math.round(S * 0.05 * k);
    const countW = Math.round(CW * 0.58), totalW = CW - countW - gap;
    const sidePx = Math.min(fitPx(p.countText, p.totalText === "" ? CW : countW, sumTop, true), p.totalText === "" ? Infinity : fitPx(p.totalText, totalW, sumTop, true));
    // Side by side while that keeps the size; stacked when the pair would have to shrink (portrait).
    const stacked = p.totalText !== "" && sidePx < sumTop * 0.85;
    const sumPx = stacked ? Math.min(fitPx(p.countText, CW, sumTop, true), fitPx(p.totalText, CW, sumTop, true)) : sidePx;
    const sumRowH = Math.round(sumPx * 1.45);
    const sumY = footRect.y - Math.round(S * 0.008) - (stacked ? 2 : 1) * sumRowH;
    if (stacked) {
        line("summary-count", { x: m, y: sumY, w: CW, h: sumRowH }, p.countText, sumPx, { bold: true, field: "the summary" });
        line("summary-total", { x: m, y: sumY + sumRowH, w: CW, h: sumRowH }, p.totalText, sumPx, { bold: true, field: "the summary" });
    }
    else {
        line("summary-count", { x: m, y: sumY, w: p.totalText === "" ? CW : countW, h: sumRowH }, p.countText, sumPx, { bold: true, field: "the summary" });
        if (p.totalText !== "")
            line("summary-total", { x: W - m - totalW, y: sumY, w: totalW, h: sumRowH }, p.totalText, sumPx, { bold: true, align: "right", field: "the summary" });
    }
    const line2 = mix(theme.bg, theme.ink, 0.22);
    const ruleBottomY = sumY - Math.round(gap * 0.6) - rule;
    tiles.push({ label: "rule-top", rect: { x: m, y: headerBottom + Math.round(gap * 0.5), w: CW, h: rule }, color: line2, radius: 0, layer: 1 });
    tiles.push({ label: "rule-bottom", rect: { x: m, y: ruleBottomY, w: CW, h: rule }, color: line2, radius: 0, layer: 1 });
    // ── the rows: a column-head line, then one row per swim in meet order ──
    const n = p.lines.length;
    const bandTop = headerBottom + gap + rule, bandBottom = ruleBottomY - Math.round(gap * 0.5);
    const headH = Math.round(S * 0.04 * k);
    const rowsTop = bandTop + headH;
    // The cap keeps one or two swims from turning into slabs; the group sits at the top of its band.
    const cap = Math.round(S * (wide ? 0.105 : 0.135 * k));
    const rowH = Math.min(cap, Math.floor((bandBottom - rowsTop) / n));
    // Column widths are fractions of the content width, the same in every row,
    // so a row without a chip keeps the space and the decimal points stack.
    const g = Math.round(CW * (wide ? 0.012 : 0.01));
    const frac = wide ? { event: 0.22, entry: 0.12, final: 0.12, track: 0.28, drop: 0.13 } : { event: 0.27, entry: 0.19, final: 0.19, track: 0, drop: 0.19 };
    const col = (x, f) => ({ x, w: Math.round(CW * f) });
    const cEvent = col(m, frac.event);
    const cEntry = col(cEvent.x + cEvent.w + g, frac.entry);
    const cFinal = col(cEntry.x + cEntry.w + g, frac.final);
    const cTrack = wide ? col(cFinal.x + cFinal.w + g, frac.track) : { x: m, w: CW };
    const cDrop = col(wide ? cTrack.x + cTrack.w + g : cFinal.x + cFinal.w + g, frac.drop);
    const cChip = { x: cDrop.x + cDrop.w + g, w: W - m - (cDrop.x + cDrop.w + g) };
    // One size for every time on the card and one for every event name: a long
    // event name shrinks the event column, never the numbers beside it.
    // The times are fitted to 88% of their column, so two neighbouring
    // times always keep a gutter; the row text never outgrows the summary.
    const rowTop = Math.min(Math.round(rowH * (wide ? 0.46 : 0.4)), Math.round(S * 0.04 * k));
    const tight = (w) => Math.round(w * 0.88);
    let rowPx = rowTop, eventPx = rowTop;
    for (const l of p.lines) {
        eventPx = Math.min(eventPx, fitPx(l.event, cEvent.w, eventPx, true));
        rowPx = Math.min(rowPx, fitPx(l.entryText, tight(cEntry.w), rowPx, false), fitPx(l.finalText, tight(cFinal.w), rowPx, false));
        if (l.dropText !== "")
            rowPx = Math.min(rowPx, fitPx(l.dropText, tight(cDrop.w), rowPx, l.dropCs !== null));
    }
    // The event name is never larger than the times beside it.
    eventPx = Math.min(eventPx, rowPx);
    if (rowPx < floor)
        unfit(`swims (${n} rows)`);
    const chipPx = p.lines.reduce((px, l) => (l.standard === "" ? px : Math.min(px, fitPx(l.standard, cChip.w, px, true))), Math.max(1, Math.round(rowPx * 0.78)));
    const headPx = ["EVENT", "ENTRY", "FINAL", "DROP"].reduce((px, t, i) => Math.min(px, fitPx(t, [cEvent, cEntry, cFinal, cDrop][i].w, px, false)), Math.max(1, Math.min(Math.round(headH * 0.5), rowPx)));
    const headRect = (c) => ({ x: c.x, y: bandTop, w: c.w, h: headH });
    line("head-event", headRect(cEvent), "EVENT", headPx, { color: dim, floor: small });
    line("head-entry", headRect(cEntry), "ENTRY", headPx, { color: dim, align: "right", floor: small });
    line("head-final", headRect(cFinal), "FINAL", headPx, { color: dim, align: "right", floor: small });
    line("head-drop", headRect(cDrop), "DROP", headPx, { color: dim, align: "right", floor: small });
    const trackColor = mix(theme.bg, theme.ink, 0.13);
    // A bar in percent beside a drop in seconds asks the reader to hold two
    // units, so each percent bar carries its own number at its end.
    // The track is tall enough to hold a bar's own number, in both bar modes:
    // `bar` changes the lengths, the labels and the footnote, not the row's
    // proportions. Only a percent bar is labelled - in seconds the number is
    // already on the row, as the drop.
    const labelled = p.bar === "percent";
    // Never taller than the row's own text: on a card of one or two swims the bar stays a bar, not a slab.
    const trackH = Math.max(3, Math.min(Math.round(rowH * (wide ? 0.4 : 0.32)), Math.round(rowPx * 0.9)));
    const sharePx = Math.max(1, Math.min(Math.round(trackH * 0.78), rowPx));
    const shareW = labelled ? Math.max(0, ...p.lines.map((l) => (l.share > 0 ? Math.ceil(((0, text_1.widthOf)(l.shareText, sharePx, true) + 2) / 0.94) + 1 : 0))) : 0;
    const sharePad = Math.round(trackH * 0.3);
    const minBar = Math.max(2, Math.round(cTrack.w * 0.01));
    const chipH = Math.min(Math.round(rowPx * 1.45), Math.round(rowH * 0.46));
    const rows = p.lines.map((l, i) => {
        const top = rowsTop + i * rowH;
        // Square and portrait: the text line ends where the track begins, to the pixel.
        const trackOff = Math.round(rowH * 0.6), textOff = Math.round(rowH * 0.06);
        const textRect = wide ? { y: top + Math.round(rowH * 0.12), h: rowH - 2 * Math.round(rowH * 0.12) } : { y: top + textOff, h: Math.min(Math.round(rowH * 0.56), trackOff - textOff) };
        const cell = (c) => ({ x: c.x, w: c.w, ...textRect });
        const track = { x: cTrack.x, w: cTrack.w, y: wide ? top + Math.round((rowH - trackH) / 2) : top + trackOff, h: trackH };
        tiles.push({ label: `track-${i}`, rect: track, color: trackColor, radius: 0.5, layer: 1 });
        // A bar is drawn for a faster swim only, from the track's left edge. The
        // floor keeps a real but tiny drop visible; it never invents one.
        const bar = l.share > 0 ? { ...track, w: Math.min(track.w, Math.max(minBar, Math.round(track.w * l.share))) } : null;
        if (bar)
            tiles.push({ label: `bar-${i}`, rect: bar, color: p.accent, radius: 0.5, layer: 2 });
        if (bar && labelled) {
            // At the bar's end: on the empty track just past it, or inside a bar too long to leave room.
            const after = bar.w + sharePad + shareW <= track.w;
            const rect = { x: after ? bar.x + bar.w + sharePad : bar.x + bar.w - sharePad - shareW, y: track.y, w: shareW, h: track.h };
            line(`share-${i}`, rect, l.shareText, sharePx, { bold: true, align: after ? "left" : "right", color: after ? ink : onColor(p.accent), over: true, floor: small, field: "the bar labels" });
        }
        line(`event-${i}`, cell(cEvent), l.event, eventPx, { bold: true, bind: { row: i, field: "event" }, field: `swims[${i}].event` });
        line(`entry-${i}`, cell(cEntry), l.entryText, rowPx, { color: dim, align: "right", bind: { row: i, field: "entry" } });
        line(`final-${i}`, cell(cFinal), l.finalText, rowPx, { align: "right", bind: { row: i, field: "final" } });
        // The drop is derived (entry - final), so it is not bound. A slower swim's
        // plus sign is in the same ink as a faster swim's minus: printed, not shouted.
        if (l.dropText !== "")
            line(`drop-${i}`, cell(cDrop), l.dropText, rowPx, l.dropCs !== null ? { bold: true, align: "right" } : { color: dim, align: "right" });
        let chip = null;
        if (l.standard !== "") {
            chip = { x: cChip.x, w: cChip.w, y: textRect.y + Math.round((textRect.h - chipH) / 2), h: chipH };
            tiles.push({ label: `chip-${i}`, rect: chip, color: p.accent, radius: 0.5, layer: 1 });
            line(`standard-${i}`, chip, l.standard, chipPx, { bold: true, align: "center", color: onColor(p.accent), bind: { row: i, field: "standard" }, over: true, floor: small, field: `swims[${i}].standard` });
        }
        return { top, track, bar, chip, line: l, labelled: bar !== null && labelled };
    });
    return { p, theme, wide, cells, tiles, rows, m, floor, small, rowH, rowPx, eventPx, cap, headerBottom, bandTop, bandBottom, footLines: footLines.length, stacked };
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY = {
    "day": 12,
    "date": "2026-10-01",
    "agent": "claude",
    "model": "claude-fable-5.1",
    "id": "@one-a-day/sports/swim-time-drop-card/v1",
    "title": "Swim Time Drop Card",
    "who": "Age-group swim club coaches and parent volunteers who type a recap of time drops and new cuts onto the club GoMotion/TeamUnify site after every meet.",
    "problem": [
        "After every meet the recap is typed by hand. Wave Aquatics lists dozens of lines like \"[swimmer] A time 200 Fly, AA time 200 IM\", then \"Top time drops of the meet: [swimmer] dropped 40 seconds in the 200 Free!\". CATCC does the same: \"New Nat BB Cuts\", then \"dropping thirty-three seconds in his 1000 Free\".",
        "Maverick Swim Club defines it in writing: \"When a swimmer improves upon that baseline time, it is called a time drop\", with an award per five drops. The numbers already sit in the file the meet host exports: Hy-Tek Meet Manager writes \"both the old CL2 file format and the new HY3 format\", and flipturn parses them."
    ],
    "sources": [
        "https://www.gomotionapp.com/team/wave/page/news/507024/fall-divisional-meet-recap",
        "https://www.gomotionapp.com/team/catcc/page/news/570837/hvda-scy-bbbc-meet-recap",
        "https://www.mavswim.org/page/celebrations/time-drops",
        "https://hytek.active.com/user_guides_html/swmm6/exportresultstotm.htm",
        "https://github.com/enagon-athletics/flipturn",
        "https://github.com/anedav68/MediaHub"
    ],
    "solution": [
        "One card per swimmer per meet from the rows a results file holds: event, entry time, final time, plus a standard you supply. Times become integer hundredths; each row prints the drop in seconds with its sign, and the summary counts the faster swims and adds up their drops.",
        "The one decision: a bar says what it measures. Seconds favour long events, so a bar is the share of the entry time dropped, with that percent printed at its end; the longest fills the track. bar \"seconds\" is one prop away. A slower swim gets a plus sign in the same ink and an empty track - no red."
    ],
    "usage": {
        "command": "m0saic make @one-a-day/sports/swim-time-drop-card/v1 --template-repo . -w 1080 -h 1080 -o journal/2026-10-01/swim-time-drop-card.png",
        "try": [
            "swims: [{ event, entry, final, standard }] - 1 to 8 rows, times as \"31.84\" or \"1:10.52\"",
            "bar \"seconds\": bars in seconds dropped, the recaps' own unit; the labels go, the footnote changes",
            "entry \"NT\" (a first swim) or final \"DQ\": the row is printed, claims nothing and is not counted",
            "accent \"#e4572e\", preset \"light\", -w 1920 -h 1080: the club colour, a light page, bars in a column"
        ]
    },
    "timeline": {
        "source": "runner",
        "phases": [
            {
                "name": "scout",
                "startMs": 0,
                "durMs": 250040,
                "calls": 26,
                "tokens": 2071821,
                "costUsd": 2.98,
                "tools": "Bash 9, WebSearch 9, Read 5"
            },
            {
                "name": "plan",
                "startMs": 250059,
                "durMs": 240329,
                "calls": 16,
                "tokens": 1600003,
                "costUsd": 2.93,
                "tools": "Bash 11, Read 4, Write 1"
            },
            {
                "name": "build",
                "startMs": 490467,
                "durMs": 3368919,
                "calls": 98,
                "tokens": 31230990,
                "costUsd": 14.59,
                "tools": "Bash 53, Read 38, Edit 4",
                "status": "error"
            },
            {
                "name": "critique",
                "startMs": 3859430,
                "durMs": 166584,
                "calls": 36,
                "tokens": 4073668,
                "costUsd": 3.48,
                "tools": "Read 27, Bash 8, Write 1"
            }
        ],
        "costBasis": "reported"
    },
    "caveats": [
        "It does not read .hy3 or .cl2 files: parse the results yourself (flipturn does) and pass the rows. Standards are not computed either; the default chips are illustrative.",
        "The entry time is the seed, not always the swimmer's fastest earlier swim, so the card says \"vs entry time\" and claims nothing more.",
        "Eight rows at most (split a long meet across two cards) and no relays: a relay result has no entry time per swimmer."
    ]
};
exports.SwimTimeDropCardV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-10-01 · Swim Time Drop Card",
    version: 1,
    description: "A swim meet time-drop card for one swimmer: entry time against the time swum per event, the drop in seconds, a bar that prints the percent of the entry time it stands for, and the standard reached.",
    capabilities: { tier: "core" },
    tags: ["sports", "2026-10-01", "day-012", "swimming", "time-drop", "meet-recap", "club"],
    outputHints: {
        width: 1080,
        height: 1080,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Still PNG. Square and portrait draw each bar under its row; canvases 4:3 and wider put the bars in a column. Minimum tested canvas 480x270.",
    },
    propsSchema,
    defaultProps: DEFAULTS,
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.SwimTimeDropCardV1;
async function render(props, ctx) {
    const { width: W, height: H } = ctx.target;
    const L = layoutSwimCard(props, W, H);
    const pieces = [];
    const constraints = [];
    // Emitted kind by kind, not row by row: placeInsetPieces puts a rect on the
    // first overlay layer it does not collide with, so tiles of one kind share
    // a layer and the chain stays a few layers deep at eight rows.
    for (const t of [...L.tiles].sort((a, b) => a.layer - b.layer)) {
        const tile = (0, template_utils_1.tag)({ ...(0, template_utils_1.makeColorTile)(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) }, t.label);
        // `accent` paints the course chip, so that is the rect that shows it.
        pieces.push({ rect: { ...t.rect, importance: t.layer }, source: t.accent ? (0, template_utils_1.bindProp)(tile, "accent") : tile });
    }
    for (const c of L.cells) {
        const cell = (0, template_utils_1.tag)((0, text_1.textCell)({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
        // A text rect is BOUND to the prop it shows; derived text (drops, the summary, the footnote) is not.
        const source = c.bind === null ? cell : "prop" in c.bind ? (0, template_utils_1.bindProp)(cell, c.bind.prop) : (0, template_utils_1.bindPropPath)(cell, "swims", [c.bind.row, c.bind.field], "string");
        pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source });
        constraints.push((0, layout_1.textFitsMeasured)(c.label, c.text, c.px, c.width));
    }
    // What the geometry promises, against the labels: every text fits its box
    // (above); the name lives in the top of the card and the summary and the
    // footnote in the bottom; every row has a track at least a fifth of the
    // canvas wide, and the tracks are one size; a faster swim has its bar.
    const has = (label) => L.cells.some((c) => c.label === label);
    constraints.push({ label: "swimmer", within: { yFrac: [0, 0.35] } });
    constraints.push({ label: "course-chip", within: { yFrac: [0, 0.35] } });
    for (const label of ["summary-count", "summary-total", "footnote"])
        if (has(label))
            constraints.push({ label, within: { yFrac: [0.65, 1] } });
    constraints.push({ label: "rule-top", minWidthFrac: 0.8 }, { label: "rule-bottom", minWidthFrac: 0.8, within: { yFrac: [0.6, 1] } });
    L.rows.forEach((r, i) => {
        constraints.push({ label: `track-${i}`, minWidthFrac: 0.2 });
        if (r.bar)
            constraints.push({ label: `bar-${i}` });
        if (r.chip)
            constraints.push({ label: `chip-${i}` });
    });
    // A relation compares at least two nodes; a one-swim card has one track and nothing to compare it with.
    const relations = L.rows.length < 2 ? [] : [{ label: L.rows.map((_, i) => `track-${i}`), equal: "size", tolerancePx: 2 }];
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
