"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HyroxSplitCardV1 = exports.DEFAULT_SPLITS = exports.STATIONS = exports.SLOWEST_RULE = exports.TAPE = void 0;
exports.parseRaceTime = parseRaceTime;
exports.formatRaceTime = formatRaceTime;
exports.normalizeHyroxCard = normalizeHyroxCard;
exports.tapeWidths = tapeWidths;
exports.layoutHyroxCard = layoutHyroxCard;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/sports/hyrox-split-card/v1";
const TITLE = "HYROX Split Card";
const DEFAULT_ACCENT = "#c45c26";
/**
 * Variant knob, not a prop. "shared" is the brief (pair length is the split).
 * "row" fills every track and splits it by the two times. SLOWEST_RULE keeps
 * the accent on the slowest station only and draws a thin rule on that row.
 */
exports.TAPE = "shared";
exports.SLOWEST_RULE = false;
const THEMES = {
    dark: { bg: "#14110f", ink: "#f4efe8", dim: "#9a8f84" },
    light: { bg: "#f6f3ee", ink: "#1c1612", dim: "#6f655c" },
};
/** Baked station names, race order. Full names live in WHY, not on the row. */
exports.STATIONS = ["Ski", "Push", "Pull", "Burpee", "Row", "Carry", "Lunge", "Balls"];
exports.DEFAULT_SPLITS = [
    { run: "4:20", station: "4:05", place: 42 },
    { run: "4:24", station: "2:30", place: 110 },
    { run: "4:28", station: "3:40", place: 88 },
    { run: "4:32", station: "5:12", place: 240 },
    { run: "4:36", station: "4:02", place: 12 },
    { run: "4:34", station: "1:52", place: 190 },
    { run: "4:40", station: "3:35", place: 64 },
    { run: "4:46", station: "4:18", place: 55 },
];
const DEFAULTS = {
    athlete: "Jordan Hale",
    race: "Harbor Open",
    division: "Open, 35-39",
    finish: "1:11:40",
    rank: 64,
    splits: exports.DEFAULT_SPLITS,
    roxzone: "6:06",
    runTotal: "36:20",
    bestLap: "4:20",
    accent: DEFAULT_ACCENT,
    preset: "dark",
    debugLayout: false,
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    finish: {
        type: "string",
        required: false,
        description: 'The finish time, the hero figure. "m:ss" (minutes may pass 59, so "71:40" is legal) or "h:mm:ss". Whole seconds only - a decimal fails fast. Hours print only at one hour or more.',
        meta: { control: { placeholder: DEFAULTS.finish }, ui: { label: "Finish", order: 1, primary: true } },
    },
    rank: {
        type: "number",
        required: false,
        description: "Division rank, drawn as #64. Integer 0-99999; 0 hides the chip.",
        meta: { constraints: { min: 0, max: 99999 }, control: { placeholder: String(DEFAULTS.rank) }, ui: { label: "Rank", order: 2, primary: true } },
    },
    splits: {
        type: "json",
        required: false,
        description: 'Eight run-and-station pairs in race order, not a user label. Each object is { run, station, place? }. Times are "m:ss" or "h:mm:ss", whole seconds. place is the station division place, integer 1-9999; 0 or omitted hides that cell. The order is Ski, Push, Pull, Burpee, Row, Carry, Lunge, Balls.',
        meta: {
            constraints: {
                jsonSchema: {
                    type: "array",
                    minItems: 8,
                    maxItems: 8,
                    items: {
                        type: "object",
                        required: ["run", "station"],
                        properties: {
                            run: { type: "string" },
                            station: { type: "string" },
                            place: { type: "integer", minimum: 0, maximum: 9999 },
                        },
                    },
                },
            },
            ui: { label: "Splits", order: 3, primary: true },
        },
    },
    athlete: {
        type: "string",
        required: false,
        description: "The athlete, the header's bold line. Up to 32 characters; accented Latin letters are drawn. Empty hides it. The sample is invented.",
        meta: { control: { placeholder: DEFAULTS.athlete }, ui: { label: "Athlete", order: 4 } },
    },
    race: {
        type: "string",
        required: false,
        description: "The race, the second header line. Up to 40 characters. Empty hides it. The sample race is invented.",
        meta: { control: { placeholder: DEFAULTS.race }, ui: { label: "Race", order: 5 } },
    },
    division: {
        type: "string",
        required: false,
        description: "The division, the third header line. Age group lives here. Up to 32 characters. Empty hides it.",
        meta: { control: { placeholder: DEFAULTS.division }, ui: { label: "Division", order: 6 } },
    },
    roxzone: {
        type: "string",
        required: false,
        description: 'Roxzone time, the footer cell, printed as entered. "m:ss" or "h:mm:ss", whole seconds. Not checked against the splits or the finish.',
        meta: { control: { placeholder: DEFAULTS.roxzone }, ui: { label: "Roxzone", order: 7 } },
    },
    runTotal: {
        type: "string",
        required: false,
        description: "Run total, the footer cell, printed as entered. Not recomputed from the eight runs.",
        meta: { control: { placeholder: DEFAULTS.runTotal }, ui: { label: "Run total", order: 8 } },
    },
    bestLap: {
        type: "string",
        required: false,
        description: "Best lap, the footer cell, printed as entered. Not checked against the runs.",
        meta: { control: { placeholder: DEFAULTS.bestLap }, ui: { label: "Best lap", order: 9 } },
    },
    accent: {
        type: "string",
        required: false,
        description: "Station bars and the rank chip, as #rrggbb. The sample is clay, not brand yellow.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 10 } },
    },
    preset: {
        type: "string",
        required: false,
        description: 'Page and ink: "dark" (default) or "light".',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 11 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits its box, the finish is in the header, the eight rows and the footer are in their bands) and draw it over the card.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
function fail(field, rule) {
    throw new Error(`${ID}: ${field} ${rule}`);
}
/**
 * "m:ss" or "h:mm:ss" to whole seconds. Minutes may pass 59 in the one-colon
 * form. Seconds (and minutes in the two-colon form) are 0-59. A decimal is
 * refused, not rounded. null when the string is not that grammar.
 */
function parseRaceTime(text) {
    const s = text.trim();
    if (s.length === 0 || /[.]/.test(s))
        return null;
    const hms = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(s);
    if (hms)
        return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);
    const ms = /^(\d+):([0-5]\d)$/.exec(s);
    if (ms)
        return Number(ms[1]) * 60 + Number(ms[2]);
    return null;
}
/** Compact, no leading zeros. Hours only when the value is at least one hour. */
function formatRaceTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const ss = String(sec % 60).padStart(2, "0");
    if (h >= 1)
        return `${h}:${String(m).padStart(2, "0")}:${ss}`;
    return `${m}:${ss}`;
}
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
function timeField(value, field) {
    if (typeof value !== "string")
        fail(field, 'must be a string, "m:ss" or "h:mm:ss".');
    const sec = parseRaceTime(value);
    if (sec === null)
        fail(field, `${JSON.stringify(value)} is not a time: write m:ss or h:mm:ss, whole seconds, no decimal (e.g. "4:20" or "1:11:40").`);
    if (sec < 1)
        fail(field, `${JSON.stringify(value)} must be at least one second so the bar is a bar.`);
    if (sec > 359999)
        fail(field, `${JSON.stringify(value)} is longer than 99:59:59; the card cannot fit it.`);
    return { raw: value.trim(), sec, printed: formatRaceTime(sec) };
}
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
function normalizeHyroxCard(props) {
    const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props !== null && props !== void 0 ? props : {}).filter(([, v]) => v !== undefined)) };
    const athlete = text(p.athlete, "athlete", 32);
    const race = text(p.race, "race", 40);
    const division = text(p.division, "division", 32);
    if (p.preset !== "dark" && p.preset !== "light")
        fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
    if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim()))
        fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
    if (typeof p.debugLayout !== "boolean")
        fail("debugLayout", "must be a boolean.");
    const finish = timeField(p.finish, "finish");
    const roxzone = timeField(p.roxzone, "roxzone");
    const runTotal = timeField(p.runTotal, "runTotal");
    const bestLap = timeField(p.bestLap, "bestLap");
    if (typeof p.rank !== "number" || !Number.isFinite(p.rank))
        fail("rank", "must be a number (division rank).");
    if (!Number.isInteger(p.rank))
        fail("rank", "must be a whole number.");
    if (p.rank < 0 || p.rank > 99999)
        fail("rank", `${p.rank} is outside 0-99999; 0 hides the chip.`);
    if (!Array.isArray(p.splits))
        fail("splits", "must be a list of 8 pairs.");
    if (p.splits.length !== 8)
        fail("splits", `has ${p.splits.length} ${p.splits.length === 1 ? "pair" : "pairs"}; a race is 8 run-and-station pairs.`);
    const rows = p.splits.map((raw, i) => {
        if (raw === null || typeof raw !== "object" || Array.isArray(raw))
            fail(`splits[${i}]`, "must be an object with run and station.");
        const o = raw;
        if (typeof o.run !== "string")
            fail(`splits[${i}].run`, 'must be a string, "m:ss" or "h:mm:ss".');
        if (typeof o.station !== "string")
            fail(`splits[${i}].station`, 'must be a string, "m:ss" or "h:mm:ss".');
        const run = timeField(o.run, `splits[${i}].run`);
        const station = timeField(o.station, `splits[${i}].station`);
        let place = 0;
        if (o.place !== undefined) {
            if (typeof o.place !== "number" || !Number.isInteger(o.place))
                fail(`splits[${i}].place`, `${JSON.stringify(o.place)} is not an integer.`);
            if (o.place < 0 || o.place > 9999)
                fail(`splits[${i}].place`, `${o.place} is outside 0-9999; 0 hides it.`);
            place = o.place;
        }
        return { index: i, station: exports.STATIONS[i], run: run.printed, stationTime: station.printed, runSec: run.sec, stationSec: station.sec, place };
    });
    const maxPair = Math.max(...rows.map((r) => r.runSec + r.stationSec));
    let slowest = 0;
    rows.forEach((r, i) => { if (r.stationSec > rows[slowest].stationSec)
        slowest = i; });
    return {
        athlete, race, division,
        finish: finish.printed, finishSec: finish.sec,
        rank: p.rank, rankText: p.rank > 0 ? `#${p.rank}` : "",
        rows, maxPair, slowest,
        roxzone: roxzone.printed, runTotal: runTotal.printed, bestLap: bestLap.printed,
        accent: p.accent.trim().toLowerCase(),
        preset: p.preset, debugLayout: p.debugLayout,
    };
}
function mix(a, b, t) {
    const ch = (s, i) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
    const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
    return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function luminance(hex) {
    const c = (i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
function onColor(fill) {
    const ratio = (other) => { const a = luminance(fill), b = luminance(other); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
    return (ratio("#14110f") >= ratio("#ffffff") ? "#14110f" : "#ffffff");
}
function fitPx(line, cellW, maxPx, bold = false) {
    const top = Math.max(1, Math.round(maxPx));
    const room = (0, text_1.budget)(cellW);
    const w = (0, text_1.widthOf)(line, top, bold);
    let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
    while (px > 1 && (0, text_1.widthOf)(line, px, bold) > room)
        px--;
    return px;
}
/** Pair length on the track, in pixels. Shared scale, or a full track split by the two times. */
function tapeWidths(trackW, runSec, stationSec, maxPair, mode = exports.TAPE) {
    const pair = runSec + stationSec;
    const filled = mode === "row" ? trackW : Math.max(2, Math.round(trackW * pair / maxPair));
    let runW = Math.max(1, Math.round(filled * runSec / pair));
    let stationW = filled - runW;
    if (stationW < 1) {
        stationW = 1;
        runW = filled - 1;
    }
    if (runW < 1) {
        runW = 1;
        stationW = filled - 1;
    }
    return { runW, stationW, filled };
}
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
function layoutHyroxCard(props, W, H) {
    const p = normalizeHyroxCard(props);
    const theme = THEMES[p.preset];
    const ink = theme.ink;
    const dim = theme.dim;
    const S = Math.min(H, 0.75 * W);
    const m = Math.max(8, Math.round(S * 0.04));
    const CW = W - 2 * m;
    const floor = Math.max(6, Math.round(Math.min(W, H) * 0.016));
    const small = Math.max(5, Math.round(Math.min(W, H) * 0.012));
    const gap = Math.max(3, Math.round(CW * 0.01));
    const unfit = (field) => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
    const yHi = (frac) => Math.floor(H * frac) - 2;
    const yLo = (frac) => Math.ceil(H * frac) + 2;
    const cells = [];
    const tiles = [];
    const line = (label, rect, value, px, o = {}) => {
        var _a, _b, _c, _d, _e, _f;
        if (px < ((_a = o.floorAt) !== null && _a !== void 0 ? _a : floor))
            unfit((_b = o.field) !== null && _b !== void 0 ? _b : label);
        if (rect.w < 4 || rect.h < 4)
            unfit((_c = o.field) !== null && _c !== void 0 ? _c : label);
        cells.push({ label, rect, text: value, px, width: (0, text_1.widthOf)(value, px, o.bold === true), bold: o.bold === true, align: (_d = o.align) !== null && _d !== void 0 ? _d : "left", color: (_e = o.color) !== null && _e !== void 0 ? _e : ink, bind: (_f = o.bind) !== null && _f !== void 0 ? _f : null, over: o.over === true });
    };
    const headerLimit = yHi(0.30);
    const footMin = yLo(0.78);
    const rowLo = yLo(0.22);
    const rowHi = yHi(0.86);
    const portrait = H > W * 1.15;
    const heroCap = Math.round(S * (portrait ? 0.22 : 0.145));
    const headerAt = (heroPx) => {
        if (heroPx <= floor)
            return null;
        const chipPx = p.rank > 0 ? Math.max(small, Math.min(Math.round(heroPx * 0.26), heroPx - 2)) : 0;
        const labelPx = Math.max(small, Math.min(Math.round(heroPx * 0.18), heroPx - 2));
        const chipPad = Math.max(3, Math.round(chipPx * 0.45));
        const finishNeed = Math.ceil(((0, text_1.widthOf)(p.finish, heroPx, true) + 2) / 0.94) + 2;
        const finishLabelNeed = Math.ceil(((0, text_1.widthOf)("FINISH", labelPx) + 2) / 0.94) + 2;
        const chipNeed = p.rank > 0 ? Math.ceil(((0, text_1.widthOf)(p.rankText, chipPx, true) + 2) / 0.94) + 2 + 2 * chipPad : 0;
        const rankLabelNeed = p.rank > 0 ? Math.ceil(((0, text_1.widthOf)("RANK", labelPx) + 2) / 0.94) + 2 : 0;
        const chipRowNeed = p.rank > 0 ? finishLabelNeed + gap + chipNeed : finishLabelNeed;
        const rightW = Math.max(finishNeed, chipRowNeed, rankLabelNeed);
        const leftW = CW - rightW - gap;
        if (leftW < Math.round(CW * 0.34))
            return null;
        const namePx = p.athlete === "" ? 0 : fitPx(p.athlete, leftW, Math.min(heroPx - 1, Math.round(S * 0.05)), true);
        const racePx = p.race === "" ? 0 : fitPx(p.race, leftW, Math.min(heroPx - 2, Math.round(S * 0.03)));
        const divPx = p.division === "" ? 0 : fitPx(p.division, leftW, Math.min(heroPx - 2, Math.round(S * 0.028)));
        if ((p.athlete !== "" && namePx < floor) || (p.race !== "" && racePx < small) || (p.division !== "" && divPx < small))
            return null;
        if (chipPx > 0 && chipPx < small)
            return null;
        if (labelPx < small)
            return null;
        const finishH = Math.round(heroPx * 1.16);
        const chipH = p.rank > 0 ? Math.round(chipPx * 1.7) : 0;
        const metaH = Math.round(Math.max(labelPx, chipPx || labelPx) * 1.35);
        const rankH = p.rank > 0 ? Math.round(labelPx * 1.3) : 0;
        const rightH = finishH + gap + metaH + (rankH > 0 ? Math.max(2, Math.round(gap * 0.4)) + rankH : 0);
        const nameH = namePx > 0 ? Math.round(namePx * 1.2) : 0;
        const raceH = racePx > 0 ? Math.round(racePx * 1.3) : 0;
        const divH = divPx > 0 ? Math.round(divPx * 1.3) : 0;
        const leftParts = [nameH, raceH, divH].filter((h) => h > 0);
        const leftH = leftParts.reduce((a, h) => a + h, 0) + Math.max(0, leftParts.length - 1) * Math.max(2, Math.round(gap * 0.45));
        const blockH = Math.max(rightH, leftH, finishH);
        const avail = headerLimit - m;
        if (blockH > avail)
            return null;
        const blockTop = m + Math.max(0, Math.round((avail - blockH) / 2));
        const rightTop = blockTop + Math.round((blockH - rightH) / 2);
        const leftTop = blockTop + Math.round((blockH - leftH) / 2);
        const finishRect = { x: W - m - rightW, y: rightTop, w: rightW, h: finishH };
        const chipRect = p.rank > 0
            ? { x: W - m - chipNeed, y: rightTop + finishH + gap + Math.round((metaH - chipH) / 2), w: chipNeed, h: chipH }
            : null;
        return { heroPx, blockTop, blockH, rightW, leftW, finishRect, labelPx, chipPx, chipRect, namePx, racePx, divPx, leftTop, rightTop };
    };
    let heroPx = Math.min(heroCap, Math.max(floor + 8, Math.round((headerLimit - m) * 0.48)));
    let header = null;
    while (heroPx > floor + 1) {
        header = headerAt(heroPx);
        if (header)
            break;
        heroPx -= 1;
    }
    const hd = header !== null && header !== void 0 ? header : fail("finish", `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
    const footLabelPx0 = Math.min(hd.heroPx - 2, Math.round(S * 0.02));
    const footTimePx0 = Math.min(hd.heroPx - 1, Math.round(S * 0.042));
    const cellW = Math.floor(CW / 3);
    const footLabels = ["ROXZONE", "RUN TOTAL", "BEST LAP"];
    const footValues = [p.roxzone, p.runTotal, p.bestLap];
    let footLabelPx = footLabels.reduce((px, t) => Math.min(px, fitPx(t, cellW, footLabelPx0)), footLabelPx0);
    let footTimePx = footValues.reduce((px, t) => Math.min(px, fitPx(t, cellW, footTimePx0, true)), footTimePx0);
    if (footLabelPx < small)
        unfit("the footer labels");
    if (footTimePx < floor)
        unfit("the footer times");
    if (footTimePx >= hd.heroPx)
        footTimePx = hd.heroPx - 1;
    if (footLabelPx >= hd.heroPx)
        footLabelPx = Math.max(small, hd.heroPx - 2);
    const footLabelH = Math.round(footLabelPx * 1.3);
    const footTimeH = Math.round(footTimePx * 1.2);
    const footGap = Math.max(2, Math.round(gap * 0.45));
    const footBlock = footLabelH + footGap + footTimeH;
    const rowsBottomLimit = Math.min(rowHi, yHi(1) - footBlock - gap);
    const rowsTop = Math.max(rowLo, Math.min(hd.blockTop + hd.blockH, headerLimit) + gap);
    if (rowsBottomLimit - rowsTop < 8 * 8)
        unfit("the eight rows");
    const rowH = Math.floor((rowsBottomLimit - rowsTop) / 8);
    if (rowH < 8)
        unfit("the eight rows");
    const rowsEnd = rowsTop + rowH * 8;
    let footTop = Math.max(rowsEnd + gap, footMin);
    if (footTop + footBlock > H - m) {
        footTop = Math.max(footMin, H - m - footBlock);
    }
    if (footTop + footBlock > H - Math.max(4, Math.round(m * 0.4)))
        unfit("the footer");
    line("finish", hd.finishRect, p.finish, hd.heroPx, { bold: true, align: "right", bind: { kind: "prop", key: "finish" }, field: "finish" });
    const metaY = hd.rightTop + hd.finishRect.h + gap;
    const metaH = Math.round(Math.max(hd.labelPx, hd.chipPx || hd.labelPx) * 1.35);
    const finishLabelW = Math.ceil(((0, text_1.widthOf)("FINISH", hd.labelPx) + 2) / 0.94) + 2;
    const finishLabelX = hd.chipRect ? hd.chipRect.x - gap - finishLabelW : W - m - finishLabelW;
    line("finish-label", { x: finishLabelX, y: metaY, w: finishLabelW, h: metaH }, "FINISH", hd.labelPx, { color: dim, align: "right", floorAt: small });
    if (hd.chipRect && p.rank > 0) {
        tiles.push({ label: "rank-chip", rect: hd.chipRect, color: p.accent, radius: 1, layer: 5, accent: true });
        line("rank", hd.chipRect, p.rankText, hd.chipPx, { bold: true, align: "center", color: onColor(p.accent), bind: { kind: "prop", key: "rank" }, over: true, floorAt: small, field: "rank" });
        const rankLabelH = Math.round(hd.labelPx * 1.3);
        line("rank-label", { x: hd.chipRect.x, y: hd.chipRect.y + hd.chipRect.h + Math.max(2, Math.round(gap * 0.35)), w: hd.chipRect.w, h: rankLabelH }, "RANK", hd.labelPx, { color: dim, align: "center", floorAt: small });
    }
    let ly = hd.leftTop;
    const leftX = m;
    if (p.athlete !== "") {
        const h = Math.round(hd.namePx * 1.2);
        line("athlete", { x: leftX, y: ly, w: hd.leftW, h }, p.athlete, hd.namePx, { bold: true, bind: { kind: "prop", key: "athlete" }, field: "athlete" });
        ly += h + Math.max(2, Math.round(gap * 0.45));
    }
    if (p.race !== "") {
        const h = Math.round(hd.racePx * 1.3);
        line("race", { x: leftX, y: ly, w: hd.leftW, h }, p.race, hd.racePx, { color: dim, bind: { kind: "prop", key: "race" }, field: "race", floorAt: small });
        ly += h + Math.max(2, Math.round(gap * 0.45));
    }
    if (p.division !== "") {
        const h = Math.round(hd.divPx * 1.3);
        line("division", { x: leftX, y: ly, w: hd.leftW, h }, p.division, hd.divPx, { color: dim, bind: { kind: "prop", key: "division" }, field: "division", floorAt: small });
    }
    const ruleH = Math.max(1, Math.round(S * 0.003));
    const ruleColor = mix(theme.bg, theme.ink, 0.28);
    tiles.push({ label: "rule-top", rect: { x: m, y: rowsTop - gap + Math.max(0, Math.round((gap - ruleH) / 2)), w: CW, h: ruleH }, color: ruleColor, radius: 0, layer: 1 });
    const idxW = Math.max(Math.round(CW * 0.05), Math.round(S * 0.04));
    const tapeW = Math.round(CW * 0.4);
    const runColW = Math.round(CW * 0.11);
    const staColW = Math.round(CW * 0.11);
    const nameColW = Math.round(CW * 0.15);
    let cx = m;
    const take = (w) => { const r = { x: cx, w }; cx += w + gap; return r; };
    const cIdx = take(idxW);
    const cTape = take(tapeW);
    const cRun = take(runColW);
    const cSta = take(staColW);
    const cName = take(nameColW);
    const cPlace = { x: cx, w: m + CW - cx };
    if (cPlace.w < Math.round(CW * 0.07))
        unfit("the place column");
    if (cTape.w / W < 0.34)
        unfit("the tape");
    const rowCap = hd.heroPx - 1;
    const longestTime = p.rows.reduce((s, r) => (r.run.length >= s.length ? r.run : r.stationTime.length >= s.length ? r.stationTime : s), "4:20");
    let rowPx = Math.min(rowCap, Math.round(Math.min(rowH * 0.46, S * 0.036)));
    rowPx = Math.min(rowPx, fitPx("8", cIdx.w, rowPx), fitPx(longestTime, cRun.w, rowPx, true), fitPx(longestTime, cSta.w, rowPx, true), ...exports.STATIONS.map((name) => fitPx(name, cName.w, rowPx)), fitPx("9999", cPlace.w, rowPx));
    if (rowPx >= hd.heroPx)
        rowPx = hd.heroPx - 1;
    if (rowPx < floor)
        unfit("the row type");
    const indexPx = Math.min(rowPx, fitPx("8", cIdx.w, rowPx));
    const namePx = exports.STATIONS.reduce((px, name) => Math.min(px, fitPx(name, cName.w, rowPx)), rowPx);
    const placePx = Math.min(rowPx, fitPx("9999", cPlace.w, Math.max(floor, rowPx - 1)));
    if (indexPx < small || namePx < floor || placePx < small)
        unfit("the row type");
    const barH = Math.max(4, Math.min(rowH - 4, Math.round(Math.min(rowH * 0.42, S * 0.04))));
    const railColor = mix(theme.bg, theme.ink, 0.14);
    const runColor = mix(theme.bg, theme.ink, p.preset === "dark" ? 0.62 : 0.55);
    const mutedStation = mix(theme.bg, theme.ink, p.preset === "dark" ? 0.4 : 0.34);
    const textH = Math.round(rowPx * 1.25);
    const textYOff = Math.round((rowH - textH) / 2);
    const bands = [];
    p.rows.forEach((r, i) => {
        const band = { x: m, y: rowsTop + i * rowH, w: CW, h: rowH };
        bands.push(band);
        const wash = mix(theme.bg, theme.ink, i % 2 === 0 ? 0.035 : 0.07);
        tiles.push({ label: `row-${i}`, rect: band, color: wash, radius: 0, layer: 0 });
        const rail = { x: cTape.x, y: band.y + Math.round((rowH - barH) / 2), w: cTape.w, h: barH };
        tiles.push({ label: `rail-${i}`, rect: rail, color: railColor, radius: 0, layer: 2 });
        const tw = tapeWidths(rail.w, r.runSec, r.stationSec, p.maxPair, exports.TAPE);
        const runBar = { x: rail.x, y: rail.y, w: tw.runW, h: rail.h };
        const stationBar = { x: rail.x + tw.runW, y: rail.y, w: tw.stationW, h: rail.h };
        tiles.push({ label: `run-${i}`, rect: runBar, color: runColor, radius: 0, layer: 3 });
        const accentStation = !exports.SLOWEST_RULE || i === p.slowest;
        tiles.push({ label: `station-${i}`, rect: stationBar, color: accentStation ? p.accent : mutedStation, radius: 0, layer: 4, accent: accentStation });
        if (exports.SLOWEST_RULE && i === p.slowest) {
            const ruleW = Math.max(2, Math.round(S * 0.004));
            tiles.push({ label: "slow-rule", rect: { x: band.x, y: band.y, w: ruleW, h: band.h }, color: p.accent, radius: 0, layer: 4, accent: true });
        }
        const ty = band.y + textYOff;
        line(`index-${i}`, { x: cIdx.x, y: ty, w: cIdx.w, h: textH }, String(i + 1), indexPx, { color: dim, align: "right", floorAt: small });
        line(`run-time-${i}`, { x: cRun.x, y: ty, w: cRun.w, h: textH }, r.run, rowPx, { bold: true, align: "right", bind: { kind: "path", path: [i, "run"], valueKind: "string" } });
        line(`station-time-${i}`, { x: cSta.x, y: ty, w: cSta.w, h: textH }, r.stationTime, rowPx, { bold: true, align: "right", bind: { kind: "path", path: [i, "station"], valueKind: "string" } });
        line(`name-${i}`, { x: cName.x, y: ty, w: cName.w, h: textH }, r.station, namePx, { align: "left" });
        if (r.place > 0) {
            line(`place-${i}`, { x: cPlace.x, y: ty, w: cPlace.w, h: textH }, String(r.place), placePx, { color: dim, align: "right", bind: { kind: "path", path: [i, "place"], valueKind: "number" }, floorAt: small });
        }
    });
    const footKeys = ["roxzone", "run-total", "best-lap"];
    const footBinds = ["roxzone", "runTotal", "bestLap"];
    for (let i = 0; i < 3; i++) {
        const x = m + i * cellW;
        const cell = { x, y: footTop, w: cellW, h: footBlock };
        tiles.push({ label: `foot-${i}`, rect: cell, color: mix(theme.bg, theme.ink, 0.04), radius: 0, layer: 0 });
        line(`foot-label-${i}`, { x, y: footTop, w: cellW, h: footLabelH }, footLabels[i], footLabelPx, { color: dim, align: "center", floorAt: small });
        line(footKeys[i], { x, y: footTop + footLabelH + footGap, w: cellW, h: footTimeH }, footValues[i], footTimePx, { bold: true, align: "center", bind: { kind: "prop", key: footBinds[i] } });
    }
    tiles.push({ label: "rule-foot", rect: { x: m, y: Math.max(rowsEnd, footTop - gap) + Math.max(0, Math.round((Math.min(gap, footTop - rowsEnd) - ruleH) / 2)), w: CW, h: ruleH }, color: ruleColor, radius: 0, layer: 1 });
    for (const c of cells) {
        if (c.px >= hd.heroPx && c.label !== "finish")
            unfit("finish");
    }
    return {
        p, theme, cells, tiles, bands, m, floor, small, heroPx: hd.heroPx, rowPx, barH,
        tape: cTape, rowH, rowsTop, rowsEnd, footTop, headerLimit,
    };
}
const WHY = {
    "day": 30,
    "date": "2026-10-19",
    "agent": "opencode",
    "model": "grok-4.7",
    "id": ID,
    "title": TITLE,
    "who": "HYROX athletes posting a race-day graphic from the official results page (results.hyrox.com) and the HYROX app",
    "problem": [
        "A screenshot of a results table is hard to read on a phone, looks like everyone else's, and buries the number you actually care about - your finish time. Generic template packs help, but you're stuck typing every split in manually.",
        "Crossed the line? Turn your Hyrox result into a branded card to share. Pick your division, enter your finish time, and post it. That card stops at the finish. Rox Lyfe says the useful view is the athlete page: station times, station rank, and the finish.",
    ],
    "sources": [
        "https://pacepost.app/guides/how-to-post-hyrox-results-on-instagram/",
        "https://sweatlas-hybrid.com/hyrox-result",
        "https://roxlyfe.com/leaderboard-explained/",
        "https://results.hyrox.com/season-5/?content=detail&fpid=list&pid=list&idp=JGDMS4JI63FAA&lang=EN_CAP&event=H_JGDMS4JI466",
    ],
    "solution": [
        "One still of that workout summary. The finish time is the hero, division rank sits beside it, and eight rows stay in race order on one shared scale: the slowest pair fills the track, and every other pair is shorter in proportion.",
        "The one decision: bar length is the split, not a delta and not a pace. The name stays in its own column - Ski, Push, Pull, Burpee, Row, Carry, Lunge, Balls - so a short bar does not own its label. Roxzone, run total and best lap print as entered.",
        "Full stations, not on the row: 1000m ski, 50m sled push, 50m sled pull, 80m burpee broad jump, 1000m row, 200m farmers carry, 100m sandbag lunges, wall balls. Jordan Hale is invented. The columns follow the Luxton Barcelona page.",
    ],
    "usage": {
        "command": "m0saic make @one-a-day/sports/hyrox-split-card/v1 --template-repo . -w 1080 -h 1080 -o journal/2026-10-19/hyrox-split-card.png",
        "try": [
            "rank 0: the chip goes; the finish stays the largest figure",
            "preset light, accent #2f6f62: a light page, station bars in the new colour",
            "a long burpee and a short carry: the burpee bar is the long accent",
            "race \"\": the race line goes; the finish and the tape stay",
        ],
    },
    "caveats": [
        "The official summary does not sum. On the Luxton page the eight runs add to 36:57 and Run Total prints 00:36:53. This card prints the footer as entered and does not fix it.",
        "Tenths are refused. The workout-summary split column is whole seconds, so a 62:36.58 finish fails fast rather than rounding.",
        "Doubles, relay and the race-replay in/out list are a different shape and are not drawn. Row names are abbreviations so the 480x270 floor holds.",
    ],
    "timeline": {
        "source": "runner",
        "phases": [
            {
                "name": "scout",
                "startMs": 0,
                "durMs": 303532,
                "calls": 42,
                "tokens": 1017711,
                "costUsd": 0.85,
                "tools": "websearch 20, bash 11, read 7",
            },
            {
                "name": "plan",
                "startMs": 303555,
                "durMs": 326027,
                "calls": 28,
                "tokens": 689752,
                "costUsd": 0.63,
                "tools": "read 14, grep 4, webfetch 4",
            },
            {
                "name": "build",
                "startMs": 629599,
                "durMs": 1384644,
                "calls": 114,
                "tokens": 7792283,
                "costUsd": 4.66,
                "tools": "read 47, grep 32, bash 17",
            },
            {
                "name": "critique",
                "startMs": 2014252,
                "durMs": 353603,
                "calls": 39,
                "tokens": 1110606,
                "costUsd": 0.81,
                "tools": "read 26, grep 8, bash 2",
            },
        ],
        "costBasis": "reported",
    },
};
const DESCRIPTION = "A race-day split card from the workout summary: finish time and division rank as the header, eight run-and-station pairs as a tape whose length is the split, and roxzone, run total and best lap as entered.";
exports.HyroxSplitCardV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: `2026-10-19 · ${TITLE}`,
    version: 1,
    description: DESCRIPTION,
    capabilities: { tier: "core" },
    tags: ["sports", "2026-10-19", "day-030", "hyrox", "race", "splits", "stations", "recap", "card"],
    outputHints: {
        width: 1080,
        height: 1080,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Still PNG. The finish is the hero at every aspect; the eight rows stay one stack. Minimum tested canvas 480x270.",
    },
    propsSchema,
    defaultProps: DEFAULTS,
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.HyroxSplitCardV1;
async function render(props, ctx) {
    const { width: W, height: H } = ctx.target;
    const L = layoutHyroxCard(props, W, H);
    const pieces = [];
    const constraints = [];
    const relations = [];
    for (const t of [...L.tiles].sort((a, b) => a.layer - b.layer)) {
        const tile = (0, template_utils_1.tag)({ ...(0, template_utils_1.makeColorTile)(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "pill" } } } : {}) }, t.label);
        pieces.push({ rect: { ...t.rect, importance: t.layer }, source: t.accent ? (0, template_utils_1.bindProp)(tile, "accent") : tile });
    }
    for (const c of L.cells) {
        const cell = (0, template_utils_1.tag)((0, text_1.textCell)({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
        const source = c.bind === null
            ? cell
            : c.bind.kind === "prop"
                ? (0, template_utils_1.bindProp)(cell, c.bind.key)
                : (0, template_utils_1.bindPropPath)(cell, "splits", c.bind.path, c.bind.valueKind);
        pieces.push({ rect: { ...c.rect, importance: c.over ? 6 : 5 }, source });
        constraints.push((0, layout_1.textFitsMeasured)(c.label, c.text, c.px, c.width));
    }
    const has = (label) => L.cells.some((c) => c.label === label);
    for (const label of ["athlete", "race", "division", "finish", "finish-label", "rank", "rank-label"]) {
        if (has(label))
            constraints.push({ label, within: { yFrac: [0, 0.3] } });
    }
    if (L.tiles.some((t) => t.label === "rank-chip"))
        constraints.push({ label: "rank-chip", within: { yFrac: [0, 0.3] } });
    for (let i = 0; i < 8; i++) {
        const band = L.bands[i];
        const y0 = Math.max(0, band.y / H - 1 / H);
        const y1 = Math.min(1, (band.y + band.h) / H + 1 / H);
        constraints.push({ label: `row-${i}`, within: { yFrac: [0.22, 0.86] } });
        constraints.push({ label: `rail-${i}`, minWidthFrac: 0.32, within: { yFrac: [y0, y1] } });
        constraints.push({ label: `run-${i}`, within: { yFrac: [y0, y1] } });
        constraints.push({ label: `station-${i}`, within: { yFrac: [y0, y1] } });
        for (const label of [`index-${i}`, `run-time-${i}`, `station-time-${i}`, `name-${i}`]) {
            constraints.push({ label, within: { yFrac: [0.22, 0.86] } });
        }
        if (has(`place-${i}`))
            constraints.push({ label: `place-${i}`, within: { yFrac: [0.22, 0.86] } });
    }
    relations.push({ label: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `row-${i}`), equal: "size", tolerancePx: 2 });
    for (let i = 0; i < 3; i++) {
        constraints.push({ label: `foot-${i}`, within: { yFrac: [0.78, 1] } });
        constraints.push({ label: `foot-label-${i}`, within: { yFrac: [0.78, 1] } });
    }
    for (const label of ["roxzone", "run-total", "best-lap"])
        constraints.push({ label, within: { yFrac: [0.78, 1] } });
    relations.push({ label: ["foot-0", "foot-1", "foot-2"], equal: "size", tolerancePx: 2 });
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
