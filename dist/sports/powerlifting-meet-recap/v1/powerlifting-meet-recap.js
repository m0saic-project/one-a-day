"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerliftingMeetRecapV1 = exports.MEET_DEFAULT_ATTEMPTS = exports.MEET_LB_PER_KG = exports.MEET_MAX_CLIP_SEC = exports.MEET_MIN_CLIP_SEC = exports.MEET_LIFTS = void 0;
exports.fmtMeetKg = fmtMeetKg;
exports.meetLb = meetLb;
exports.fmtMeetWeight = fmtMeetWeight;
exports.meetOrdinal = meetOrdinal;
exports.meetAscii = meetAscii;
exports.buildMeet = buildMeet;
exports.parseMeetCsv = parseMeetCsv;
exports.pickMeetRow = pickMeetRow;
exports.meetFromCsvRow = meetFromCsvRow;
exports.meetBeats = meetBeats;
exports.meetLandAt = meetLandAt;
exports.meetOpenAndFrom = meetOpenAndFrom;
exports.meetSteps = meetSteps;
exports.meetDecimals = meetDecimals;
exports.meetTotalExpr = meetTotalExpr;
exports.layoutMeet = layoutMeet;
exports.meetContract = meetContract;
exports.meetContrast = meetContrast;
exports.meetReadable = meetReadable;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/sports/powerlifting-meet-recap/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
exports.MEET_LIFTS = ["squat", "bench", "deadlift"];
exports.MEET_MIN_CLIP_SEC = 6;
exports.MEET_MAX_CLIP_SEC = 30;
/** The international pound, as the federations convert. */
exports.MEET_LB_PER_KG = 2.20462262;
/** drawtext draws in the machine's font, wider than the bundled Roboto the measurer knows. */
const DRAWTEXT_WIDEN = 1.15;
const LIFT_LABEL = { squat: "SQUAT", bench: "BENCH", deadlift: "DEADLIFT" };
const CSV_LIFT = { squat: "Squat", bench: "Bench", deadlift: "Deadlift" };
/** A day for a lifter who does not exist: 8 for 9, a missed third bench, 392.5 kg. */
exports.MEET_DEFAULT_ATTEMPTS = {
    squat: [140, 147.5, 150],
    bench: [77.5, 82.5, -85],
    deadlift: [145, 155, 160],
};
const DEFAULTS = {
    lifter: "Mara Voss",
    meetName: "Harbor City Open",
    details: "USAPL - 2026-09-12 - F 69 kg - Raw",
    place: "1",
    dots: 398.12,
    row: "1",
    units: "kg",
    clipSec: 12,
    accent: "#ffd23f",
    preset: "dark",
};
const THEMES = {
    dark: {
        bg: "#0e1116",
        pending: "#1b222c",
        ink: "#f2f5f8",
        dim: "#8893a0",
        good: "#17894a",
        fail: "#d8392f",
        lifts: { squat: "#4fa3ff", bench: "#b78cff", deadlift: "#ff8a4c" },
    },
    light: {
        bg: "#f5f6f8",
        pending: "#e2e6eb",
        ink: "#12161c",
        dim: "#5d6874",
        good: "#3fbf78",
        fail: "#d8392f",
        lifts: { squat: "#1f6fd0", bench: "#8a3fd1", deadlift: "#c2570f" },
    },
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    lifter: {
        type: "string",
        required: false,
        description: "The lifter (the CSV's Name) - the bold header line. Empty removes it. A pasted csv supplies its own.",
        meta: { control: { placeholder: DEFAULTS.lifter }, ui: { label: "Lifter", order: 1, primary: true } },
    },
    meetName: {
        type: "string",
        required: false,
        description: "The meet (the CSV's MeetName), under the lifter. Empty removes it. A pasted csv supplies its own.",
        meta: { control: { placeholder: DEFAULTS.meetName }, ui: { label: "Meet", order: 2 } },
    },
    details: {
        type: "string",
        required: false,
        description: "The detail line: federation, date, class, equipment. Empty removes it. From a pasted csv it is composed as Federation - Date - Sex WeightClassKg - Equipment.",
        meta: { control: { placeholder: DEFAULTS.details }, ui: { label: "Details", order: 3 } },
    },
    attempts: {
        type: "json",
        required: false,
        description: "{ squat, bench, deadlift }: up to three weights each, in kilograms, in attempt order. The CSV's convention: a negative number is a failed attempt (-85 = 85 kg, no lift); null or 0 is an attempt not taken. A lift left out drops its row (a bench-only meet is { bench: [...] }).",
        meta: {
            constraints: {
                jsonSchema: {
                    type: "object",
                    properties: {
                        squat: { type: "array", maxItems: 3, items: { type: ["number", "null"] } },
                        bench: { type: "array", maxItems: 3, items: { type: ["number", "null"] } },
                        deadlift: { type: "array", maxItems: 3, items: { type: ["number", "null"] } },
                    },
                },
            },
            ui: { label: "Attempts (kg)", order: 4, primary: true },
        },
    },
    place: {
        type: "string",
        required: false,
        description: "The CSV's Place: a number (1 prints \"1st place\"), or G (guest), DQ, DD, NS. Empty removes it.",
        meta: { control: { placeholder: DEFAULTS.place }, ui: { label: "Place", order: 5 } },
    },
    dots: {
        type: "number",
        required: false,
        description: "Dots points (the CSV's Dots), printed beside the place; 0 hides them.",
        meta: { constraints: { min: 0, max: 2000 }, ui: { label: "Dots", order: 6 } },
    },
    csv: {
        type: "string",
        required: false,
        description: "Paste an OpenPowerlifting CSV: the header row and one or more result rows (a lifter's \"Download as CSV\", or a meet's export). When set it wins over lifter, meetName, details, attempts, place and dots.",
        meta: { control: { multiline: true, mono: true, placeholder: "Name,Sex,Event,Equipment,...,Squat1Kg,Squat2Kg,..." }, ui: { label: "OpenPowerlifting CSV", order: 7 } },
    },
    row: {
        type: "string",
        required: false,
        description: "Which row of the pasted csv: a 1-based number, a Date (2026-09-12) or a lifter's Name. Default 1, the first row.",
        meta: { control: { placeholder: DEFAULTS.row }, ui: { label: "CSV row", order: 8 } },
    },
    units: {
        type: "string",
        required: false,
        description: 'The weights as the CSV has them ("kg"), in whole pounds ("lb"), or both in every cell ("both").',
        meta: { constraints: { oneOf: ["kg", "lb", "both"] }, ui: { label: "Units", order: 9 } },
    },
    clipSec: {
        type: "number",
        required: false,
        description: "Clip length in whole seconds (6..30): an eighth is the cold open on the result, a quarter the closing hold, the rest the replay. An explicit duration pin overrides it and becomes the clip.",
        meta: { constraints: { min: exports.MEET_MIN_CLIP_SEC, max: exports.MEET_MAX_CLIP_SEC }, ui: { label: "Clip (s)", order: 10 } },
    },
    accent: {
        type: "string",
        required: false,
        description: "The accent - the stamp, the ring around the attempt being taken, the total - as #rrggbb. Good and no lift stay green and red.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 11 } },
    },
    preset: {
        type: "string",
        required: false,
        description: 'Hand-tuned page: "dark" (default) or "light".',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 12 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits, the stamp and the total hold their bands, the board is there) and draw it over the frame.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
/* ── weights: kilograms in, the plate maths out ── */
/** 147.5 -> "147.5", 150 -> "150", 102.25 -> "102.25": never a trailing zero. */
function fmtMeetKg(kg) {
    return String(Math.round(kg * 100) / 100);
}
/** Whole pounds, rounded down - the way a lifter says a kilo bar out loud (160 kg is "352"). */
function meetLb(kg) {
    return Math.floor(kg * exports.MEET_LB_PER_KG + 1e-6);
}
/** The number a cell, a best or the total prints in its main unit. */
function fmtMeetWeight(kg, units) {
    return units === "lb" ? String(meetLb(kg)) : fmtMeetKg(kg);
}
/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 23 -> "23rd". */
function meetOrdinal(n) {
    var _a;
    const t = n % 100;
    if (t >= 11 && t <= 13)
        return `${n}th`;
    return `${n}${(_a = ["th", "st", "nd", "rd"][n % 10]) !== null && _a !== void 0 ? _a : "th"}`;
}
/** Latin diacritics folded (the bundled font is ASCII), the rest replaced, never a control character. */
function meetAscii(raw) {
    const s = typeof raw === "string" ? raw : raw === undefined || raw === null ? "" : String(raw);
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
}
function placeText(place) {
    const p = place.trim().toUpperCase();
    if (p === "")
        return { text: "", out: false };
    if (/^\d+$/.test(p) && Number(p) > 0)
        return { text: `${meetOrdinal(Number(p))} place`, out: false };
    if (p === "G")
        return { text: "Guest lifter", out: false };
    if (p === "DQ" || p === "DD")
        return { text: "Disqualified", out: true };
    if (p === "NS")
        return { text: "No-show", out: true };
    throw new Error(`${ID}: place ${JSON.stringify(place)} must be a number, or G, DQ, DD or NS (the CSV's Place).`);
}
function buildMeet(meta, raw, units) {
    const lifts = [];
    for (const lift of exports.MEET_LIFTS) {
        const r = raw[lift];
        if (!r)
            continue;
        const slots = [0, 1, 2].map((i) => { var _a; return (_a = r.attempts[i]) !== null && _a !== void 0 ? _a : null; });
        const anyAttempt = slots.some((v) => v !== null && v !== 0);
        if (anyAttempt) {
            const cells = slots.map((v, index) => (v === null || v === 0 ? null : { lift, index, kg: Math.abs(v), good: v > 0 }));
            const goods = cells.filter((c) => c !== null && c.good).map((c) => c.kg);
            lifts.push({ lift, cells, bestOnly: false, bestKg: goods.length > 0 ? Math.max(...goods) : null });
        }
        else if (r.best !== undefined && r.best !== null && r.best !== 0) {
            // Only the best was reported (a negative best is the lightest weight missed).
            lifts.push({ lift, cells: [{ lift, index: 0, kg: Math.abs(r.best), good: r.best > 0 }], bestOnly: true, bestKg: r.best > 0 ? r.best : null });
        }
    }
    if (lifts.length === 0)
        throw new Error(`${ID}: no attempts - give at least one weight for squat, bench or deadlift (kilograms; a negative number is a failed attempt).`);
    const order = lifts.flatMap((l) => l.cells.filter((c) => c !== null));
    const counted = lifts.filter((l) => !l.bestOnly).flatMap((l) => l.cells.filter((c) => c !== null));
    const place = placeText(meta.place);
    const complete = lifts.every((l) => l.bestKg !== null);
    const totalKg = complete && !place.out ? Math.round(lifts.reduce((a, l) => a + l.bestKg, 0) * 100) / 100 : null;
    const pointsLine = [
        totalKg !== null && units === "both" ? `${meetLb(totalKg)} lb` : "",
        totalKg !== null && meta.dots > 0 ? `${fmtMeetKg(meta.dots)} Dots` : "",
    ].filter((s) => s.length > 0).join(" - ");
    return {
        lifter: meta.lifter,
        meetName: meta.meetName,
        details: meta.details,
        lifts,
        order,
        good: counted.filter((c) => c.good).length,
        taken: counted.length,
        totalKg,
        stamp: counted.length > 0 ? `${counted.filter((c) => c.good).length}/${counted.length}` : "",
        placeLine: place.text,
        pointsLine,
    };
}
/** Header row + result rows. The format disallows quotes and in-field commas, so a split is the parser. */
function parseMeetCsv(text) {
    var _a;
    const lines = text.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const header = ((_a = lines[0]) !== null && _a !== void 0 ? _a : "").split(",").map((h) => h.trim());
    const known = exports.MEET_LIFTS.some((l) => header.includes(`${CSV_LIFT[l]}1Kg`) || header.includes(`Best3${CSV_LIFT[l]}Kg`));
    if (!header.includes("Name") || !known) {
        throw new Error(`${ID}: csv does not look like an OpenPowerlifting file - the first line must be the header row (Name, ..., Squat1Kg, ..., Best3SquatKg, ...).`);
    }
    if (lines.length < 2)
        throw new Error(`${ID}: csv has a header and no result row.`);
    return lines.slice(1).map((line) => {
        const cols = line.split(",");
        const row = {};
        header.forEach((h, i) => { var _a; row[h] = ((_a = cols[i]) !== null && _a !== void 0 ? _a : "").trim(); });
        return row;
    });
}
/** `row`: a 1-based number, else a Date, else a Name (the "#2" that tells namesakes apart is optional). */
function pickMeetRow(rows, which) {
    var _a, _b;
    const w = which.trim();
    if (w === "")
        return rows[0];
    if (/^\d+$/.test(w)) {
        const n = Number(w);
        if (n < 1 || n > rows.length)
            throw new Error(`${ID}: row ${n} is outside the csv - it has ${rows.length} result row${rows.length === 1 ? "" : "s"}.`);
        return rows[n - 1];
    }
    const bare = (s) => s.replace(/\s+#\d+$/, "").trim().toLowerCase();
    const hit = (_b = (_a = rows.find((r) => r.Date === w)) !== null && _a !== void 0 ? _a : rows.find((r) => { var _a; return ((_a = r.Name) !== null && _a !== void 0 ? _a : "").toLowerCase() === w.toLowerCase(); })) !== null && _b !== void 0 ? _b : rows.find((r) => { var _a; return bare((_a = r.Name) !== null && _a !== void 0 ? _a : "") === bare(w); });
    if (!hit)
        throw new Error(`${ID}: row ${JSON.stringify(which)} matches no Date and no Name in the csv - use a row number from 1 to ${rows.length}.`);
    return hit;
}
function csvNumber(row, key) {
    var _a;
    const v = ((_a = row[key]) !== null && _a !== void 0 ? _a : "").trim();
    if (v === "")
        return null;
    const n = Number(v);
    if (!Number.isFinite(n))
        throw new Error(`${ID}: csv ${key} ${JSON.stringify(v)} is not a number.`);
    return n;
}
/** One results row to the day it records. Fourth attempts (record attempts) do not count toward the total and are not drawn. */
function meetFromCsvRow(row) {
    var _a, _b, _c, _d, _e;
    const raw = {};
    for (const lift of exports.MEET_LIFTS) {
        const attempts = [1, 2, 3].map((n) => csvNumber(row, `${CSV_LIFT[lift]}${n}Kg`));
        const best = csvNumber(row, `Best3${CSV_LIFT[lift]}Kg`);
        if (attempts.some((v) => v !== null) || best !== null)
            raw[lift] = { attempts, best };
    }
    const cls = ((_a = row.WeightClassKg) !== null && _a !== void 0 ? _a : "").trim();
    const sexClass = [((_b = row.Sex) !== null && _b !== void 0 ? _b : "").trim(), cls ? `${cls} kg` : ""].filter((s) => s.length > 0).join(" ");
    const details = [row.Federation, row.Date, sexClass, row.Equipment].map((s) => meetAscii(s)).filter((s) => s.length > 0).join(" - ");
    // TotalKg is empty for a bomb-out or a disqualification; Place says which.
    const place = ((_c = row.Place) !== null && _c !== void 0 ? _c : "").trim();
    return {
        meta: {
            lifter: meetAscii(((_d = row.Name) !== null && _d !== void 0 ? _d : "").replace(/\s+#\d+$/, "")),
            meetName: meetAscii(row.MeetName),
            details,
            place,
            dots: (_e = csvNumber(row, "Dots")) !== null && _e !== void 0 ? _e : 0,
        },
        raw,
    };
}
function round3(n) {
    return Math.round(n * 1000) / 1000;
}
/** An eighth of the clip (at most 2 s) opens on the result, a quarter holds it at the end, the rest replays the day. */
function meetBeats(clipSec) {
    const hook = round3(Math.min(2, clipSec * 0.125));
    const hold = round3(clipSec * 0.25);
    const replay = round3(clipSec - hook - hold);
    return { clip: clipSec, hook, replay, end: round3(hook + replay) };
}
/** When attempt `k` of `n` lands: evenly spaced, the last one on the end of the replay. */
function meetLandAt(k, n, b) {
    return round3(b.hook + (b.replay * (k + 1)) / n);
}
/** Shown in the cold open and again from `at` on: ONE gate for two windows, so no `window` twin. */
function meetOpenAndFrom(hook, at) {
    return `lt(t,${hook})+gte(t,${at})`;
}
/** Every good lift that raises its lift's best, in meet order, with the subtotal it leaves. */
function meetSteps(model, b) {
    const steps = [];
    const best = { squat: 0, bench: 0, deadlift: 0 };
    model.order.forEach((a, k) => {
        if (!a.good || a.kg <= best[a.lift])
            return;
        best[a.lift] = a.kg;
        steps.push({ at: meetLandAt(k, model.order.length, b), lift: a.lift, bestKg: a.kg, subtotalKg: Math.round((best.squat + best.bench + best.deadlift) * 100) / 100 });
    });
    return steps;
}
/** How many decimals the counted total prints: none in pounds, else as many as the weights carry. */
function meetDecimals(model, units) {
    var _a;
    if (units === "lb")
        return 0;
    const cents = [(_a = model.totalKg) !== null && _a !== void 0 ? _a : 0, ...model.order.map((a) => a.kg)].map((v) => Math.round(v * 100));
    if (cents.every((c) => c % 100 === 0))
        return 0;
    return cents.every((c) => c % 10 === 0) ? 1 : 2;
}
/**
 * The total: ONE drawtext expression, evaluated per frame - the final total
 * in the cold open, then the subtotal, counting up over `rise` seconds each
 * time a good lift raises a best. Inside `%{...}` drawtext wants `\:` and
 * `\,`. The +0.0005 keeps trunc() from printing 392.4 for a 392.5 stored as
 * 392.4999.
 */
function meetTotalExpr(model, units, b) {
    var _a;
    const shown = (kg) => (units === "lb" ? meetLb(kg) : kg);
    const steps = meetSteps(model, b);
    const n = Math.max(1, model.order.length);
    const rise = Math.max(0.05, round3(Math.min(0.5, (0.6 * b.replay) / n)));
    const k = (1 / rise).toFixed(4);
    let last = 0;
    const terms = steps.map((s) => {
        const v = shown(s.subtotalKg);
        const inc = Math.round((v - last) * 100) / 100;
        last = v;
        return `${inc}*clip((t-${s.at.toFixed(3)})*${k}\\,0\\,1)`;
    });
    const F = shown((_a = model.totalKg) !== null && _a !== void 0 ? _a : 0);
    const X = `(if(lt(t\\,${b.hook.toFixed(3)})\\,${F}\\,${terms.length > 0 ? terms.join("+") : "0"})+0.0005)`;
    const whole = `%{eif\\:trunc(${X})\\:d}`;
    const d = meetDecimals(model, units);
    if (d === 0)
        return whole;
    if (d === 1)
        return `${whole}.%{eif\\:mod(trunc(${X}*10)\\,10)\\:d}`;
    return `${whole}.%{eif\\:mod(trunc(${X}*100)\\,100)\\:d\\:2}`;
}
/**
 * The largest 5-smooth number (2^a 3^b 5^c) at or below `n` - each child
 * renders on its own canvas, and a side with a large prime factor has no
 * divisor lattice, so placement degrades to exact and `latticeSmooth` fails.
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
/** One line, shrunk until it fits; ellipsized only at the floor. */
function fitOne(text, maxW, maxPx, minPx, bold = false) {
    let px = Math.max(minPx, Math.round(maxPx));
    while (px > minPx && (0, text_1.widthOf)(text, px, bold) > maxW)
        px = Math.max(minPx, Math.round(px * 0.92));
    const out = (0, text_1.widthOf)(text, px, bold) > maxW ? (0, text_1.ellipsize)(text, px, maxW, bold) : text;
    return { text: out, px, width: (0, text_1.widthOf)(out, px, bold) };
}
/** A drawtext string's width: measured in the bundled bold (the wider face), widened for the system font. */
function drawWidth(text, px) {
    return (0, text_1.widthOf)(text, px, true) * DRAWTEXT_WIDEN;
}
/** A rect of `w0 x h0` shrunk to 5-smooth sides and centred where it was. */
function smoothRect(x, y, w0, h0) {
    const w = smoothDown(w0);
    const h = smoothDown(h0);
    return { x: x + Math.floor((w0 - w) / 2), y: y + Math.floor((h0 - h) / 2), w, h };
}
function bestText(kg, units) {
    if (units === "lb")
        return `best ${meetLb(kg)} lb`;
    if (units === "both")
        return `best ${fmtMeetKg(kg)} kg / ${meetLb(kg)} lb`;
    return `best ${fmtMeetKg(kg)} kg`;
}
/**
 * The whole geometry as a pure function of the day and the canvas: the header
 * (lifter and stamp, meet, details), the board (three cells a lift, its name
 * above them or - on a square - beside them), and the total stack (label, number, bar, result) - under the board,
 * or beside it in landscape. The test asserts rects and fits without parsing m0.
 */
function layoutMeet(model, units, W, H) {
    var _a, _b, _c, _d;
    const S = Math.min(W, H);
    const landscape = W >= 1.25 * H;
    const tall = H >= 1.4 * W;
    const margin = Math.max(6, Math.round(0.045 * S));
    const gap = Math.max(4, Math.round(0.022 * S));
    const minPx = Math.max(5, Math.round(0.014 * S));
    const contentW = Math.max(40, W - 2 * margin);
    // ── header row 1: the lifter, the stamp box right ──
    const stamp = model.stamp ? fitOne(model.stamp, (0, text_1.budget)(Math.round(0.3 * contentW)), Math.max(minPx, Math.round(0.05 * S)), minPx, true) : null;
    const stampPadX = stamp ? Math.max(3, Math.round(0.6 * stamp.px)) : 0;
    const stampTextW = stamp ? Math.ceil(stamp.width / 0.94) + 4 : 1;
    const stampBoxW = stamp ? stampTextW + 2 * stampPadX : 0;
    const stampBoxH = stamp ? Math.max(8, Math.round(1.7 * stamp.px)) : 0;
    const lifterW = Math.max(16, contentW - (stamp ? stampBoxW + gap : 0));
    const lifter = model.lifter ? fitOne(model.lifter, (0, text_1.budget)(lifterW), Math.max(minPx, Math.round(0.07 * S)), minPx, true) : null;
    const row1H = Math.max(lifter ? Math.round(1.3 * lifter.px) : 0, stampBoxH, 1);
    const lifterRect = { x: margin, y: margin, w: lifterW, h: row1H };
    const stampBox = { x: margin + contentW - Math.max(1, stampBoxW), y: margin + Math.floor((row1H - stampBoxH) / 2), w: Math.max(1, stampBoxW), h: Math.max(1, stampBoxH) };
    const stampTextRect = { x: stampBox.x + stampPadX, y: stampBox.y, w: stampTextW, h: Math.max(1, stampBoxH) };
    // ── header rows 2 and 3: the meet, the details (one row when the canvas is not tall) ──
    const meetPx = Math.max(minPx, Math.round(0.04 * S));
    const detPx = Math.max(minPx, Math.round(0.03 * S));
    let meetName;
    let details;
    let meetRect;
    let detailsRect;
    let headerBottom;
    if (tall) {
        meetName = model.meetName ? fitOne(model.meetName, (0, text_1.budget)(contentW), meetPx, minPx) : null;
        details = model.details ? fitOne(model.details, (0, text_1.budget)(contentW), detPx, minPx) : null;
        const h2 = meetName ? Math.round(1.5 * meetName.px) : 0;
        const h3 = details ? Math.round(1.6 * details.px) : 0;
        meetRect = { x: margin, y: margin + row1H, w: contentW, h: Math.max(1, h2) };
        detailsRect = { x: margin, y: margin + row1H + h2, w: contentW, h: Math.max(1, h3) };
        headerBottom = margin + row1H + h2 + h3;
    }
    else {
        details = model.details ? fitOne(model.details, (0, text_1.budget)(Math.round(0.5 * contentW)), detPx, minPx) : null;
        const detW = details ? Math.ceil(details.width / 0.94) + 4 : 0;
        const meetW = Math.max(16, contentW - (details ? detW + gap : 0));
        meetName = model.meetName ? fitOne(model.meetName, (0, text_1.budget)(meetW), meetPx, minPx) : null;
        const h2 = meetName || details ? Math.round(1.5 * Math.max((_a = meetName === null || meetName === void 0 ? void 0 : meetName.px) !== null && _a !== void 0 ? _a : 0, (_b = details === null || details === void 0 ? void 0 : details.px) !== null && _b !== void 0 ? _b : 0)) : 0;
        meetRect = { x: margin, y: margin + row1H, w: meetW, h: Math.max(1, h2) };
        detailsRect = { x: margin + contentW - Math.max(1, detW), y: margin + row1H, w: Math.max(1, detW), h: Math.max(1, h2) };
        headerBottom = margin + row1H + h2;
    }
    // ── the total stack: label, number, bar, result ──
    const panelW = landscape ? Math.round(0.36 * contentW) : contentW;
    const totalLabel = fitOne(model.totalKg === null ? "TOTAL" : units === "lb" ? "TOTAL (LB)" : "TOTAL (KG)", (0, text_1.budget)(panelW), Math.max(minPx, Math.round(0.03 * S)), minPx);
    const counted = model.totalKg !== null;
    const d = meetDecimals(model, units);
    const finalText = counted ? (d === 0 ? String(Math.round(units === "lb" ? meetLb(model.totalKg) : model.totalKg)) : model.totalKg.toFixed(d)) : "NO TOTAL";
    const totalSample = counted ? finalText.replace(/\d/g, "8") : finalText;
    const totalWidthAt = (px) => (counted ? drawWidth(totalSample, px) : (0, text_1.widthOf)(totalSample, px, true));
    let totalPx = Math.max(minPx, Math.round(landscape ? 0.15 * S : Math.min(0.16 * S, 0.1 * H)));
    while (totalPx > minPx && totalWidthAt(totalPx) > (0, text_1.budget)(panelW))
        totalPx = Math.max(minPx, Math.round(totalPx * 0.92));
    const totalWidth = totalWidthAt(totalPx);
    const sumBests = model.lifts.reduce((a, l) => { var _a; return a + ((_a = l.bestKg) !== null && _a !== void 0 ? _a : 0); }, 0);
    const hasBar = sumBests > 0;
    // The result row: the place left, the points right.
    const resultPx = Math.max(minPx, Math.round(0.036 * S));
    const place = model.placeLine ? fitOne(model.placeLine, (0, text_1.budget)(Math.round((model.pointsLine ? 0.5 : 1) * panelW)), resultPx, minPx, true) : null;
    const placeW = place ? Math.min(panelW, Math.ceil(place.width / 0.94) + 4) : 0;
    const pointsW = Math.max(2, panelW - (place ? placeW + gap : 0));
    const points = model.pointsLine ? fitOne(model.pointsLine, (0, text_1.budget)(pointsW), resultPx, minPx) : null;
    const labelH = Math.round(1.5 * totalLabel.px);
    const totalH = Math.round(1.2 * totalPx);
    const barH = hasBar ? Math.max(4, Math.round(0.036 * S)) : 0;
    const barGap = hasBar ? Math.max(2, Math.round(0.5 * gap)) : 0;
    const resultH = place || points ? Math.round(1.7 * Math.max((_c = place === null || place === void 0 ? void 0 : place.px) !== null && _c !== void 0 ? _c : 0, (_d = points === null || points === void 0 ? void 0 : points.px) !== null && _d !== void 0 ? _d : 0)) : 0;
    const stackH = labelH + totalH + barGap + barH + resultH;
    const bodyTop = headerBottom + gap;
    let stackX;
    let stackY;
    let area;
    if (landscape) {
        const bodyH = Math.max(8, H - margin - bodyTop);
        stackX = margin + contentW - panelW;
        stackY = bodyTop + Math.max(0, Math.floor((bodyH - stackH) / 2));
        area = { x: margin, y: bodyTop, w: Math.max(24, contentW - panelW - 2 * gap), h: bodyH };
    }
    else {
        stackX = margin;
        stackY = H - margin - stackH;
        area = { x: margin, y: bodyTop, w: contentW, h: Math.max(8, stackY - gap - bodyTop) };
    }
    const totalLabelRect = { x: stackX, y: stackY, w: panelW, h: labelH };
    const totalRect = { x: stackX, y: stackY + labelH, w: Math.min(panelW, Math.ceil(totalWidth / 0.94) + 4), h: totalH };
    const bar = hasBar ? smoothRect(stackX, stackY + labelH + totalH + barGap, panelW, barH) : null;
    const resultY = stackY + labelH + totalH + barGap + barH;
    const placeRect = { x: stackX, y: resultY, w: Math.max(1, placeW), h: Math.max(1, resultH) };
    const pointsRect = { x: stackX + panelW - pointsW, y: resultY, w: pointsW, h: Math.max(1, resultH) };
    // ── the board: a row of cells for every lift, its name on a strip above
    //      them - or, where height is what runs out (a square), beside them ──
    const side = !tall && !landscape;
    const n = model.lifts.length;
    const ring = Math.max(2, Math.round(0.006 * S));
    const rowGap = gap;
    const liftPx = Math.max(minPx, Math.round(0.032 * S));
    const stripH = side ? 0 : Math.round(1.5 * liftPx);
    const rowH0 = Math.floor((area.h - (n - 1) * rowGap) / n);
    const cellH0 = Math.max(4 + 2 * ring, Math.min(rowH0 - stripH, Math.round((tall ? 0.3 : 0.24) * S)));
    const blockH = Math.min(area.h, n * (stripH + cellH0) + (n - 1) * rowGap);
    const board = smoothRect(area.x, area.y + Math.floor((area.h - blockH) / 2), area.w, blockH);
    const sideW = side ? Math.round(0.25 * board.w) : 0;
    const colGap = Math.max(2 * ring + 2, Math.round(0.02 * board.w));
    const cellW = Math.max(4, Math.floor((board.w - sideW - 2 * ring - 2 * colGap) / 3));
    const rows = [];
    const cells = [];
    const pitch = (board.h + rowGap) / n;
    // One size for every weight on the board: the largest that fits the tightest cell.
    const cellH = Math.max(4, Math.floor(pitch) - rowGap - stripH - 2 * ring);
    const both = units === "both";
    const mainTexts = model.lifts.flatMap((l) => l.cells.map((c) => (c ? fmtMeetWeight(c.kg, units) : "-")));
    const subTexts = both ? model.lifts.flatMap((l) => l.cells.map((c) => (c ? `${meetLb(c.kg)} lb` : ""))) : [];
    const padX = Math.max(2, Math.round(0.06 * cellW));
    const fitAll = (texts, maxPx, floor, bold) => {
        let px = Math.max(floor, Math.round(maxPx));
        while (px > floor && texts.some((t) => (0, text_1.widthOf)(t, px, bold) > (0, text_1.budget)(cellW - 2 * padX)))
            px = Math.max(floor, Math.round(px * 0.92));
        return px;
    };
    const floorPx = Math.max(3, Math.round(0.6 * minPx));
    const mainPx = fitAll(mainTexts, (both ? 0.4 : 0.46) * cellH, floorPx, true);
    const subPx = both ? fitAll(subTexts, 0.2 * cellH, floorPx, false) : 0;
    let k = 0;
    model.lifts.forEach((l, i) => {
        const y0 = Math.floor(i * pitch);
        const bestPx = Math.max(minPx, Math.round(0.9 * liftPx));
        let label;
        let best;
        let bestSub = null;
        let labelRect;
        let bestRect;
        let bestSubRect;
        if (side) {
            // Beside the cells: the name, the best under it, the best in pounds under that.
            const lines = both ? 3 : 2;
            const lineH = Math.max(1, Math.floor(cellH / lines));
            const colW = Math.max(8, sideW - gap);
            const top = board.y + y0 + ring + Math.floor((cellH - lines * lineH) / 2);
            label = fitOne(LIFT_LABEL[l.lift], (0, text_1.budget)(colW), Math.min(liftPx, Math.round(0.62 * lineH)), floorPx, true);
            best = l.bestKg !== null ? fitOne(bestText(l.bestKg, both ? "kg" : units), (0, text_1.budget)(colW), Math.min(bestPx, Math.round(0.56 * lineH)), floorPx) : null;
            bestSub = l.bestKg !== null && both ? fitOne(`${meetLb(l.bestKg)} lb`, (0, text_1.budget)(colW), Math.min(bestPx, Math.round(0.56 * lineH)), floorPx) : null;
            labelRect = { x: board.x + ring, y: top, w: colW, h: lineH };
            bestRect = { x: board.x + ring, y: top + lineH, w: colW, h: lineH };
            bestSubRect = { x: board.x + ring, y: top + (lines - 1) * lineH, w: colW, h: lineH };
        }
        else {
            const labelW = Math.round(0.4 * board.w);
            label = fitOne(LIFT_LABEL[l.lift], (0, text_1.budget)(labelW), liftPx, minPx, true);
            best = l.bestKg !== null ? fitOne(bestText(l.bestKg, units), (0, text_1.budget)(board.w - labelW - gap), bestPx, minPx) : null;
            labelRect = { x: board.x + ring, y: board.y + y0, w: labelW, h: stripH };
            bestRect = { x: board.x + labelW + gap, y: board.y + y0, w: Math.max(2, board.w - labelW - gap - ring), h: stripH };
            bestSubRect = bestRect;
        }
        const firstK = k;
        l.cells.forEach((c, slot) => {
            const w = l.bestOnly ? board.w - sideW - 2 * ring : cellW;
            const local = { x: sideW + ring + slot * (cellW + colGap), y: y0 + stripH + ring, w, h: cellH };
            const abs = { x: board.x + local.x, y: board.y + local.y, w, h: cellH };
            const mainText = c ? fmtMeetWeight(c.kg, units) : "-";
            const main = { text: mainText, px: mainPx, width: (0, text_1.widthOf)(mainText, mainPx, true) };
            const inner = { x: abs.x + padX, y: abs.y, w: Math.max(2, w - 2 * padX), h: cellH };
            const subOn = both && c !== null;
            const mainH = subOn ? Math.round(0.6 * cellH) : cellH;
            const subText = subOn ? `${meetLb(c.kg)} lb` : "";
            cells.push({
                lift: l.lift,
                slot,
                attempt: c,
                k: c ? k : null,
                local,
                main,
                mainRect: { ...inner, h: mainH },
                sub: subOn ? { text: subText, px: subPx, width: (0, text_1.widthOf)(subText, subPx) } : null,
                subRect: subOn ? { x: inner.x, y: abs.y + mainH - Math.round(0.08 * cellH), w: inner.w, h: Math.max(1, cellH - mainH) } : null,
            });
            if (c)
                k += 1;
        });
        rows.push({
            lift: l.lift,
            label,
            labelRect,
            best,
            bestRect,
            bestSub,
            bestSubRect,
            bestAlign: side ? "left" : "right",
            lastK: Math.max(firstK, k - 1),
        });
    });
    return {
        W, H, S, landscape,
        lifter, lifterRect, stamp, stampBox, stampTextRect,
        meetName, meetRect, details, detailsRect, detailsAlign: tall ? "left" : "right",
        board, ring, rows, cells,
        totalLabel, totalLabelRect, totalSample, totalPx, totalWidth, totalRect,
        bar, place, placeRect, points, pointsRect,
    };
}
/**
 * What the geometry promises. Every text is measured (the counted total at
 * its widest string, already widened for the system font); the stamp lives
 * in the top band; the total in the bottom half when it sits under the board
 * (beside it, in landscape, the promise is that it is there); the cells (the
 * board child, flattened by the checker) are present.
 */
function meetContract(L) {
    return [
        ...(L.lifter ? [(0, layout_1.textFitsMeasured)("lifter", L.lifter.text, L.lifter.px, L.lifter.width)] : []),
        ...(L.stamp ? [(0, layout_1.textFitsMeasured)("stamp-text", L.stamp.text, L.stamp.px, L.stamp.width), { label: "stamp-text", within: { yFrac: [0, 0.3] } }] : []),
        ...(L.meetName ? [(0, layout_1.textFitsMeasured)("meet", L.meetName.text, L.meetName.px, L.meetName.width)] : []),
        ...(L.details ? [(0, layout_1.textFitsMeasured)("details", L.details.text, L.details.px, L.details.width)] : []),
        ...L.rows.flatMap((r) => [
            (0, layout_1.textFitsMeasured)(`lift-${r.lift}`, r.label.text, r.label.px, r.label.width),
            ...(r.best ? [(0, layout_1.textFitsMeasured)(`best-${r.lift}`, r.best.text, r.best.px, r.best.width)] : []),
            ...(r.bestSub ? [(0, layout_1.textFitsMeasured)(`best-pounds-${r.lift}`, r.bestSub.text, r.bestSub.px, r.bestSub.width)] : []),
        ]),
        ...L.cells.flatMap((c) => [
            (0, layout_1.textFitsMeasured)(`weight-${c.lift}-${c.slot}`, c.main.text, c.main.px, c.main.width),
            ...(c.sub ? [(0, layout_1.textFitsMeasured)(`pounds-${c.lift}-${c.slot}`, c.sub.text, c.sub.px, c.sub.width)] : []),
        ]),
        (0, layout_1.textFitsMeasured)("total-label", L.totalLabel.text, L.totalLabel.px, L.totalLabel.width),
        (0, layout_1.textFitsMeasured)("total", L.totalSample, L.totalPx, L.totalWidth),
        ...(L.place ? [(0, layout_1.textFitsMeasured)("place", L.place.text, L.place.px, L.place.width)] : []),
        ...(L.points ? [(0, layout_1.textFitsMeasured)("points", L.points.text, L.points.px, L.points.width)] : []),
        L.landscape ? { label: "total" } : { label: "total", within: { yFrac: [0.5, 1] } },
        { label: "cell" },
    ];
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-09-27/.
 */
const WHY = {
    day: 8,
    date: "2026-09-27",
    agent: "claude",
    model: "claude-fable-5-1",
    id: ID,
    title: "Powerlifting Meet Recap",
    who: "Powerlifters, coaches and meet directors: at meets, on Instagram, and around openpowerlifting.org, which archives every sanctioned meet.",
    problem: [
        "After every meet the lifter posts the day, attempt by attempt. One write-up: \"This time, I went three-for-three, making 226, 253, and 259\", and it points to Instagram \"for videos of my heaviest successful lifts and a recap of my attempted weights\". It is typed and cut by hand.",
        "The data is already public and structured. OpenPowerlifting gives every lifter a CSV, one row a meet: \"Squat1Kg, Bench1Kg, Deadlift1Kg ... Negative values indicate failed attempts\"; TotalKg is the \"Sum of Best3SquatKg, Best3BenchKg, and Best3DeadliftKg\".",
        "What exists serves the room and the stream, not the post. OpenLifter's results page is zoomed onto a projector because audiences like \"something to look at\"; liftingcast-overlays draws \"graphic overlays\" for OBS and needs the meet's API key and password.",
    ],
    sources: [
        "https://openpowerlifting.gitlab.io/opl-csv/bulk-csv-docs.html",
        "https://squattersrites.substack.com/p/my-first-powerlifting-meet",
        "https://squattersrites.substack.com/p/my-second-powerlifting-meet",
        "https://www.openlifter.com/en/guide/",
        "https://github.com/liftingcast/liftingcast-overlays",
    ],
    solution: [
        "The results row is the prop. Paste an OpenPowerlifting CSV into csv (row picks the meet, or the lifter in a meet's export), or pass attempts in its convention: kilograms, a negative number is a no lift. The board is one row a lift, three tries each: solid green made, hollow red missed.",
        "The clip opens on the finished board, replays the attempts in meet order with a ring on the one being taken, and counts the total up as each good lift raises a best; the bar under it is the total to scale, one segment a lift. It ends where it began, so it loops.",
        "Weak spots, honestly: no lift videos yet - the nine cells are where the lifter's clips belong, and that is the v2 - and the CSV has no referee lights, so a 2-1 decision and a 3-0 look the same.",
    ],
    usage: {
        command: "m0saic make @one-a-day/sports/powerlifting-meet-recap/v1 --template-repo . -w 1080 -h 1920 -o recap.mp4",
        try: [
            "--props @props.json with {\"csv\": \"<your CSV text>\", \"row\": \"2026-09-12\"} - your own meet",
            "attempts {\"bench\": [100, 105, -110]} - a bench-only meet is one row",
            "units \"lb\" for whole pounds, \"both\" for kilograms over pounds in every cell",
            "-w 1920 -h 1080 puts the total beside the board; --durationMs 8000 for a teaser",
        ],
    },
    caveats: [
        "A negative weight is a failed attempt (the CSV's convention): write the weight that was on the bar, the sign says how it went.",
        "Fourth attempts (record attempts) are not drawn; they do not count toward the total.",
        "The counted total is drawtext in the machine's font; its pixels are deterministic per machine only.",
    ],
    // No runner trace.json: the machine was off at 09:00 and the founder ran the
    // day by hand in one Claude Code session (Fable 5.1, effort xhigh). Phases
    // are the session's own clock (journal/2026-09-27/logs/phase-marks.json);
    // tool calls, tokens and dollars are MEASURED from the session transcript,
    // one record per API response, by journal/2026-09-27/token-cost-audit.mjs
    // at the list prices of 2026-09-27 - through 22:28:08Z, when this card froze.
    // The rest of the ship phase (the journal, the gate, the push) is in
    // 60-token-costs.md.
    timeline: {
        source: "self-reported",
        costBasis: "estimated",
        pricedAt: "2026-09-27",
        phases: [
            { name: "orient", startMs: 0, durMs: 214000, calls: 40, tokens: 631871, costUsd: 2.25, tools: "Read 29, Bash 5, PowerShell 3" },
            { name: "scout", startMs: 214000, durMs: 358000, calls: 23, tokens: 1458540, costUsd: 2.77, tools: "WebSearch 13, Bash 8, WebFetch 1" },
            { name: "plan", startMs: 572000, durMs: 201000, calls: 7, tokens: 611578, costUsd: 1.77, tools: "Read 4, Bash 1, Edit 1" },
            { name: "build (2 variants)", startMs: 774000, durMs: 1833000, calls: 54, tokens: 9227122, costUsd: 10.09, tools: "Read 24, Bash 21, Write 7" },
            { name: "critique", startMs: 2607000, durMs: 68000, calls: 2, tokens: 399021, costUsd: 0.5, tools: "Bash 1, Write 1" },
            { name: "ship (until this card froze)", startMs: 2675000, durMs: 449000, calls: 8, tokens: 2111537, costUsd: 1.97, tools: "Bash 5, Read 1, WebFetch 1" },
        ],
    },
};
exports.PowerliftingMeetRecapV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-09-27 · Powerlifting Meet Recap",
    version: 1,
    description: "A powerlifting meet recap clip from the lifter's OpenPowerlifting row: nine attempts on a 3 x 3 board, solid green made, hollow red missed, the total counted up from the bests and drawn to scale.",
    capabilities: { tier: "core" },
    tags: ["sports", "2026-09-27", "day-008", "powerlifting", "meet", "attempts", "recap", "video"],
    outputHints: {
        width: 1080,
        height: 1920,
        fps: 30,
        durationMs: DEFAULTS.clipSec * 1000,
        format: { kind: "video", container: "mp4" },
        note: "A vertical reel by default; 1920x1080 puts the total beside the board. The clip is clipSec long; an explicit --durationMs overrides it and becomes the clip.",
    },
    resolveOutputHints: (props) => {
        const clipSec = numberOr(props === null || props === void 0 ? void 0 : props.clipSec, DEFAULTS.clipSec, exports.MEET_MIN_CLIP_SEC, exports.MEET_MAX_CLIP_SEC);
        return { durationMs: Math.round(clipSec * 1000) };
    },
    propsSchema,
    defaultProps: {
        lifter: DEFAULTS.lifter,
        meetName: DEFAULTS.meetName,
        details: DEFAULTS.details,
        attempts: { squat: [...exports.MEET_DEFAULT_ATTEMPTS.squat], bench: [...exports.MEET_DEFAULT_ATTEMPTS.bench], deadlift: [...exports.MEET_DEFAULT_ATTEMPTS.deadlift] },
        place: DEFAULTS.place,
        dots: DEFAULTS.dots,
        csv: "",
        row: DEFAULTS.row,
        units: DEFAULTS.units,
        clipSec: DEFAULTS.clipSec,
        accent: DEFAULTS.accent,
        preset: DEFAULTS.preset,
        debugLayout: false,
    },
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.PowerliftingMeetRecapV1;
/* ── props: render() is the gate ── */
function numberOr(v, fallback, min, max) {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}
function pickText(value, fallback, name) {
    if (value === undefined)
        return fallback;
    if (typeof value !== "string")
        throw new Error(`${ID}: ${name} must be a string.`);
    return meetAscii(value);
}
function pickWhole(value, fallback, name, min, max) {
    if (value === undefined)
        return fallback;
    const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n))
        throw new Error(`${ID}: ${name} must be a number. Got ${JSON.stringify(value)}.`);
    if (!Number.isInteger(n))
        throw new Error(`${ID}: ${name} must be a whole number. Got ${JSON.stringify(value)}.`);
    if (n < min || n > max)
        throw new Error(`${ID}: ${name} must be between ${min} and ${max}. Got ${JSON.stringify(value)}.`);
    return n;
}
function pickDots(value) {
    if (value === undefined || value === null || value === "")
        return DEFAULTS.dots;
    const n = typeof value === "string" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 2000)
        throw new Error(`${ID}: dots must be a number from 0 to 2000 (0 hides it). Got ${JSON.stringify(value)}.`);
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
function pickOne(value, fallback, options, name) {
    if (value === undefined || value === "")
        return fallback;
    if (typeof value !== "string" || !options.includes(value)) {
        throw new Error(`${ID}: ${name} must be one of ${options.map((o) => `"${o}"`).join(", ")}. Got ${JSON.stringify(value)}.`);
    }
    return value;
}
function pickAttempts(value) {
    let v = value;
    if (v === undefined)
        v = exports.MEET_DEFAULT_ATTEMPTS;
    if (typeof v === "string") {
        try {
            v = JSON.parse(v);
        }
        catch {
            throw new Error(`${ID}: attempts is not valid JSON - pass { "squat": [140, 147.5, 150], "bench": [...], "deadlift": [...] }.`);
        }
    }
    if (!v || typeof v !== "object" || Array.isArray(v))
        throw new Error(`${ID}: attempts must be an object { squat, bench, deadlift }, each a list of up to three weights in kilograms.`);
    const o = v;
    for (const key of Object.keys(o)) {
        if (!exports.MEET_LIFTS.includes(key))
            throw new Error(`${ID}: attempts.${key} is not a lift - the keys are squat, bench and deadlift.`);
    }
    const raw = {};
    for (const lift of exports.MEET_LIFTS) {
        const list = o[lift];
        if (list === undefined || list === null)
            continue;
        if (!Array.isArray(list))
            throw new Error(`${ID}: attempts.${lift} must be a list of up to three weights.`);
        if (list.length > 3)
            throw new Error(`${ID}: attempts.${lift} has ${list.length} weights - a lift has three attempts (a fourth is a record attempt and does not count).`);
        const attempts = list.map((w, i) => {
            if (w === null || w === undefined || w === "")
                return null;
            const n = typeof w === "string" ? Number(w) : w;
            if (typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > 1000) {
                throw new Error(`${ID}: attempts.${lift}[${i}] ${JSON.stringify(w)} is not a weight - kilograms, a negative number for a failed attempt.`);
            }
            return n;
        });
        if (attempts.some((a) => a !== null && a !== 0))
            raw[lift] = { attempts };
    }
    return raw;
}
/* ── colour helpers ── */
/** Ink that reads on `c`: the dark page for a light colour, white for a dark one. */
function onColor(c) {
    const n = parseInt(String(c).slice(1), 16);
    const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    return (lum > 0.6 ? "#0e1116" : "#ffffff");
}
function luminance(c) {
    const n = parseInt(String(c).slice(1), 16);
    const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(((n >> 16) & 255) / 255) + 0.7152 * lin(((n >> 8) & 255) / 255) + 0.0722 * lin((n & 255) / 255);
}
/** WCAG contrast of two colours, 1..21. */
function meetContrast(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** Linear byte mix: `t` of `a` over `1-t` of `b`. */
function mix(a, b, t) {
    const pa = parseInt(String(a).slice(1), 16);
    const pb = parseInt(String(b).slice(1), 16);
    const ch = (sa, sb) => Math.round(sa * t + sb * (1 - t));
    const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
    const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
    const bl = ch(pa & 255, pb & 255);
    return ("#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1));
}
/**
 * The accent as a colour to DRAW with on the page (the total, the ring): kept
 * as given when it reads there, else pulled toward the ink until it does - a
 * yellow picked for the dark page would vanish on the light one.
 */
function meetReadable(accent, page, ink) {
    let c = accent;
    for (let i = 0; i < 6 && meetContrast(c, page) < 3; i++)
        c = mix(c, ink, 0.75);
    return c;
}
/** The per-frame total: drawtext, video mode, one expression, always on. */
function totalSource(expr, px, color) {
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
        editor: { owner: "template", label: "total" },
    };
}
/** A static svg cell that shows only in the cold open and from a moment on. */
function gated(cell, gate) {
    return { ...cell, overlay: gate };
}
async function render(props, ctx) {
    var _a;
    // The schema is documentation; render() is the gate.
    const preset = pickOne(props.preset, DEFAULTS.preset, ["dark", "light"], "preset");
    const theme = THEMES[preset];
    const accent = pickColor(props.accent, DEFAULTS.accent, "accent");
    // The stamp is a box of the accent with its own ink; the total and the ring are drawn ON the page.
    const accentInk = meetReadable(accent, theme.bg, theme.ink);
    const units = pickOne(props.units, DEFAULTS.units, ["kg", "lb", "both"], "units");
    const clipSec = pickWhole(props.clipSec, DEFAULTS.clipSec, "clipSec", exports.MEET_MIN_CLIP_SEC, exports.MEET_MAX_CLIP_SEC);
    if (props.csv !== undefined && typeof props.csv !== "string")
        throw new Error(`${ID}: csv must be the text of an OpenPowerlifting CSV.`);
    const csv = ((_a = props.csv) !== null && _a !== void 0 ? _a : "").trim();
    let model;
    if (csv.length > 0) {
        const which = props.row === undefined ? DEFAULTS.row : typeof props.row === "number" ? String(props.row) : props.row;
        if (typeof which !== "string")
            throw new Error(`${ID}: row must be a row number, a Date or a Name.`);
        const day = meetFromCsvRow(pickMeetRow(parseMeetCsv(csv), which));
        model = buildMeet(day.meta, day.raw, units);
    }
    else {
        model = buildMeet({
            lifter: pickText(props.lifter, DEFAULTS.lifter, "lifter"),
            meetName: pickText(props.meetName, DEFAULTS.meetName, "meetName"),
            details: pickText(props.details, DEFAULTS.details, "details"),
            place: pickText(props.place, DEFAULTS.place, "place"),
            dots: pickDots(props.dots),
        }, pickAttempts(props.attempts), units);
    }
    // The clip is authored. An explicit user pin wins and BECOMES the clip;
    // the host-seeded target is never read as one.
    const pinned = (0, template_utils_1.resolvePinnedDurationMs)(ctx);
    const clip = pinned !== undefined ? Math.max(1, pinned / 1000) : clipSec;
    const durationMs = pinned !== undefined ? Math.round(pinned) : clipSec * 1000;
    const b = meetBeats(clip);
    const W = Math.max(1, Math.round(ctx.target.width));
    const H = Math.max(1, Math.round(ctx.target.height));
    const L = layoutMeet(model, units, W, H);
    const n = model.order.length;
    const landOf = (k) => meetLandAt(k, n, b);
    const finale = { enable: meetOpenAndFrom(b.hook, b.end) };
    const bound = csv.length === 0;
    const pieces = [];
    const piece = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    // ── 1. the board, as a CHILD document: every cell's pending face (static),
    //      the ring around the attempt being taken (gated to its stretch of the
    //      replay), and the outcome over it (the cold open, and from its landing
    //      on): solid green for a good lift, a red frame for a no lift. No
    //      masks, both sides 5-smooth. ──
    const boardPieces = [];
    const frame = Math.max(2, Math.round(1.6 * L.ring));
    L.cells.forEach((c) => {
        boardPieces.push({ rect: { ...c.local, importance: 2 }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(theme.pending), "cell") });
        if (c.k === null || c.attempt === null)
            return;
        const at = landOf(c.k);
        const from = c.k === 0 ? b.hook : landOf(c.k - 1);
        if (at > from) {
            const ringRect = { x: c.local.x - L.ring, y: c.local.y - L.ring, w: c.local.w + 2 * L.ring, h: c.local.h + 2 * L.ring, importance: 1 };
            boardPieces.push({ rect: ringRect, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accentInk, { overlay: { enable: `gte(t,${from})*lt(t,${at})`, window: { startSec: from, endSec: at } } }), "cell-now") });
        }
        const landed = { overlay: { enable: meetOpenAndFrom(b.hook, at) } };
        if (c.attempt.good) {
            boardPieces.push({ rect: { ...c.local, importance: 3 }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(theme.good, landed), "cell-good") });
        }
        else {
            boardPieces.push({ rect: { ...c.local, importance: 3 }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(theme.fail, landed), "cell-fail") });
            const inner = { x: c.local.x + frame, y: c.local.y + frame, w: c.local.w - 2 * frame, h: c.local.h - 2 * frame };
            if (inner.w >= 2 && inner.h >= 2)
                boardPieces.push({ rect: { ...inner, importance: 4 }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(theme.pending, landed), "cell-hollow") });
        }
    });
    const boardPlaced = (0, template_utils_1.placeInsetPieces)({ rootW: L.board.w, rootH: L.board.h, pieces: boardPieces });
    const children = {
        board: {
            kind: "mosaic_document",
            version: 1,
            m0: (0, dsl_stdlib_1.toM0String)(boardPlaced.m0, ID),
            assets: {},
            size: { width: L.board.w, height: L.board.h },
            fps: ctx.target.fps,
            durationMs,
            // The child's own canvas: the page colour, or the board reads as a black slab.
            backgroundColor: theme.bg,
            sources: boardPlaced.sources,
            editor: { label: `board - ${model.lifts.length} lift${model.lifts.length === 1 ? "" : "s"}` },
        },
    };
    piece(L.board, 1, (0, template_utils_1.tag)({ type: "mosaic", ref: "board", placement: { fit: "contain" } }, "board"));
    // ── 2. the bar, as a CHILD document: the total to scale, one segment a
    //      lift. A segment grows each time a good lift raises the best: the
    //      wider tile lands over the narrower one. ──
    if (L.bar) {
        const g = L.bar;
        const sum = model.lifts.reduce((a, l) => { var _a; return a + ((_a = l.bestKg) !== null && _a !== void 0 ? _a : 0); }, 0);
        const sep = Math.max(1, Math.round(0.004 * g.w));
        const barPieces = [{ rect: { x: 0, y: 0, w: g.w, h: g.h, importance: 1 }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(theme.pending), "bar-track") }];
        let offsetKg = 0;
        let z = 2;
        model.lifts.forEach((l) => {
            if (l.bestKg === null)
                return;
            const x0 = Math.round((offsetKg / sum) * g.w);
            const best = { v: 0 };
            l.cells.forEach((c) => {
                if (!c || !c.good || c.kg <= best.v)
                    return;
                best.v = c.kg;
                const k = model.order.indexOf(c);
                const x1 = Math.round(((offsetKg + c.kg) / sum) * g.w);
                const w = Math.max(1, x1 - x0 - (x1 < g.w ? sep : 0));
                barPieces.push({ rect: { x: x0, y: 0, w, h: g.h, importance: z++ }, source: (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(theme.lifts[l.lift], { overlay: { enable: meetOpenAndFrom(b.hook, landOf(k)) } }), `bar-${l.lift}`) });
            });
            offsetKg += l.bestKg;
        });
        const barPlaced = (0, template_utils_1.placeInsetPieces)({ rootW: g.w, rootH: g.h, pieces: barPieces });
        children.bar = {
            kind: "mosaic_document",
            version: 1,
            m0: (0, dsl_stdlib_1.toM0String)(barPlaced.m0, ID),
            assets: {},
            size: { width: g.w, height: g.h },
            fps: ctx.target.fps,
            durationMs,
            backgroundColor: theme.bg,
            sources: barPlaced.sources,
            editor: { label: "bar - the total to scale" },
        };
        piece(g, 1, (0, template_utils_1.tag)({ type: "mosaic", ref: "bar", placement: { fit: "contain" } }, "bar"));
    }
    // ── 3. the header: lifter, stamp (the cold open and the finish), meet, details ──
    const maybeBind = (src, prop) => (bound ? (0, template_utils_1.bindProp)(src, prop) : src);
    if (L.lifter)
        piece(L.lifterRect, 3, maybeBind((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.lifter.text, fontSize: L.lifter.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "lifter" }), "lifter"), "lifter"));
    if (L.stamp) {
        piece(L.stampBox, 3, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(accent, { overlay: finale }), "stamp"), "accent"));
        piece(L.stampTextRect, 4, gated((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.stamp.text, fontSize: L.stamp.px, color: onColor(accent), hAlign: "center", bold: true, vAlign: "middle", label: "stamp-text" }), "stamp-text"), finale));
    }
    if (L.meetName)
        piece(L.meetRect, 3, maybeBind((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.meetName.text, fontSize: L.meetName.px, color: theme.ink, hAlign: "left", vAlign: "middle", label: "meet" }), "meet"), "meetName"));
    if (L.details)
        piece(L.detailsRect, 3, maybeBind((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.details.text, fontSize: L.details.px, color: theme.dim, hAlign: L.detailsAlign, vAlign: "middle", label: "details" }), "details"), "details"));
    // ── 4. the rows: the lift's name in its bar colour, and its best once the
    //      lift is over ──
    L.rows.forEach((r) => {
        piece(r.labelRect, 3, (0, template_utils_1.tag)((0, text_1.textCell)({ text: r.label.text, fontSize: r.label.px, color: theme.lifts[r.lift], hAlign: "left", bold: true, vAlign: "middle", label: `lift-${r.lift}` }), `lift-${r.lift}`));
        if (r.best) {
            const gate = { enable: meetOpenAndFrom(b.hook, landOf(r.lastK)) };
            piece(r.bestRect, 3, gated((0, template_utils_1.tag)((0, text_1.textCell)({ text: r.best.text, fontSize: r.best.px, color: theme.dim, hAlign: r.bestAlign, vAlign: "middle", label: `best-${r.lift}` }), `best-${r.lift}`), gate));
            if (r.bestSub)
                piece(r.bestSubRect, 3, gated((0, template_utils_1.tag)((0, text_1.textCell)({ text: r.bestSub.text, fontSize: r.bestSub.px, color: theme.dim, hAlign: r.bestAlign, vAlign: "middle", label: `best-pounds-${r.lift}` }), `best-pounds-${r.lift}`), gate));
        }
    });
    // ── 5. the weights: static svg over the board, one cell an attempt, each
    //      bound to its own leaf of `attempts` (Make edits a weight in place).
    //      A pasted csv owns the weights, so then there is no leaf to bind. ──
    L.cells.forEach((c) => {
        const label = `weight-${c.lift}-${c.slot}`;
        const src = (0, template_utils_1.tag)((0, text_1.textCell)({ text: c.main.text, fontSize: c.main.px, color: c.attempt ? theme.ink : theme.dim, hAlign: "center", bold: true, vAlign: "middle", label }), label);
        const row = model.lifts.find((l) => l.lift === c.lift);
        piece(c.mainRect, 3, bound && row && !row.bestOnly ? (0, template_utils_1.bindPropPath)(src, "attempts", [c.lift, c.slot], "number") : src);
        if (c.sub && c.subRect) {
            const subLabel = `pounds-${c.lift}-${c.slot}`;
            piece(c.subRect, 3, (0, template_utils_1.tag)((0, text_1.textCell)({ text: c.sub.text, fontSize: c.sub.px, color: theme.ink, hAlign: "center", vAlign: "middle", label: subLabel }), subLabel));
        }
    });
    // ── 6. the total stack: the label, the counted number (or the words that
    //      replace it), the place and the points (the cold open and the finish) ──
    piece(L.totalLabelRect, 3, (0, template_utils_1.tag)((0, text_1.textCell)({ text: L.totalLabel.text, fontSize: L.totalLabel.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "total-label" }), "total-label"));
    if (model.totalKg !== null) {
        piece(L.totalRect, 4, (0, template_utils_1.tag)(totalSource(meetTotalExpr(model, units, b), L.totalPx, accentInk), "total"));
    }
    else {
        piece(L.totalRect, 4, gated((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.totalSample, fontSize: L.totalPx, color: theme.fail, hAlign: "left", bold: true, vAlign: "middle", label: "total" }), "total"), finale));
    }
    if (L.place)
        piece(L.placeRect, 3, maybeBind(gated((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.place.text, fontSize: L.place.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "place" }), "place"), finale), "place"));
    if (L.points)
        piece(L.pointsRect, 3, maybeBind(gated((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.points.text, fontSize: L.points.px, color: theme.dim, hAlign: L.place ? "right" : "left", vAlign: "middle", label: "points" }), "points"), finale), "dots"));
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets: {},
        size: { width: W, height: H },
        fps: ctx.target.fps,
        // The clip is authored, so it out-ranks the hint.
        durationMs,
        backgroundColor: theme.bg,
        sources: placed.sources,
        children,
        editor: { label: `Powerlifting Meet Recap - ${model.lifter || "lifter"} - ${model.stamp || "bests"} - ${model.totalKg !== null ? `${fmtMeetKg(model.totalKg)} kg` : "no total"}` },
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints: meetContract(L), debug: props.debugLayout === true });
}
