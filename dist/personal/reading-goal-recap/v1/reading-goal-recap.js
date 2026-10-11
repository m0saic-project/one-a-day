"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingGoalRecapV1 = void 0;
exports.fmtInt = fmtInt;
exports.fmtRating = fmtRating;
exports.readingPace = readingPace;
exports.normalizeReadingCard = normalizeReadingCard;
exports.layoutReadingCard = layoutReadingCard;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/personal/reading-goal-recap/v1";
const DEFAULT_ACCENT = "#e8a13c";
const THEMES = {
    dark: { bg: "#171512", ink: "#efe9dc", dim: "#a89f8c" },
    light: { bg: "#f6f1e6", ink: "#221d14", dim: "#6b6252" },
};
// An invented reader's invented October: 15 books, 4,703 pages, 46 of 52 at
// day 304 - three ahead of pace - and four shelf titles.
const DEFAULTS = {
    month: "October 2026",
    reader: "@leah_reads",
    books: 15,
    pages: 4703,
    avgRating: 4.3,
    goalTotal: 52,
    booksSoFar: 46,
    dayOfYear: 304,
    titles: [
        { title: "The Dark Descent of Elizabeth Frankenstein", rating: 5 },
        { title: "Nettle & Bone", rating: 5 },
        { title: "Babel, or the Necessity of Violence", rating: 4.5 },
        { title: "The Ex Hex", rating: 4 },
    ],
    accent: DEFAULT_ACCENT,
    preset: "dark",
    debugLayout: false,
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    month: {
        type: "string",
        required: false,
        description: 'The month line, e.g. "October 2026" - the header\'s first line. Up to 24 characters; the sample month is invented.',
        meta: { control: { placeholder: DEFAULTS.month }, ui: { label: "Month", order: 1 } },
    },
    reader: {
        type: "string",
        required: false,
        description: "The reader's handle or name, under the month. Up to 32 characters; empty removes it. The sample handle is invented.",
        meta: { control: { placeholder: DEFAULTS.reader }, ui: { label: "Reader", order: 2 } },
    },
    books: {
        type: "number",
        required: false,
        description: "Books finished this month, an integer 0 to 999 - the first stat tile.",
        meta: { constraints: { min: 0, max: 999 }, ui: { label: "Books this month", order: 3, primary: true } },
    },
    pages: {
        type: "number",
        required: false,
        description: "Pages read this month, an integer 0 to 999999 - the second stat tile, printed with thousands separators.",
        meta: { constraints: { min: 0, max: 999999 }, ui: { label: "Pages this month", order: 4, primary: true } },
    },
    avgRating: {
        type: "number",
        required: false,
        description: "The month's average rating, 0 to 5 - the third stat tile, printed to one decimal.",
        meta: { constraints: { min: 0, max: 5 }, ui: { label: "Average rating", order: 5 } },
    },
    goalTotal: {
        type: "number",
        required: false,
        description: "The year's reading-challenge goal in books, an integer 1 to 999. 52 is the community's canonical one.",
        meta: { constraints: { min: 1, max: 999 }, ui: { label: "Year goal (books)", order: 6, primary: true } },
    },
    booksSoFar: {
        type: "number",
        required: false,
        description: "Books finished so far this year, an integer 0 to 999 - it may pass the goal (the bar clamps at full and the delta line tells how far past).",
        meta: { constraints: { min: 0, max: 999 }, ui: { label: "Books so far", order: 7, primary: true } },
    },
    dayOfYear: {
        type: "number",
        required: false,
        description: "The day of the year the card is for, an integer 1 to 366. Drives the pace tick: pace = goalTotal x dayOfYear / 365. A prop, not a clock, so the card stays deterministic.",
        meta: { constraints: { min: 1, max: 366 }, ui: { label: "Day of year", order: 8 } },
    },
    titles: {
        type: "json",
        required: false,
        description: 'The month\'s shelf: a list of { "title": string, "rating": number }, up to 12 entries, ratings 0 to 5 in half steps (4.5, never 4.7); the first 6 render, each title up to 80 characters.',
        meta: {
            constraints: { jsonSchema: { type: "array", maxItems: 12, items: { type: "object", required: ["title", "rating"], properties: { title: { type: "string", minLength: 1, maxLength: 80 }, rating: { type: "number", minimum: 0, maximum: 5 } } } } },
            ui: { label: "Shelf titles", order: 9 },
        },
    },
    accent: {
        type: "string",
        required: false,
        description: "The bar fill and the delta line when ahead of pace, as #rrggbb.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 10 } },
    },
    preset: {
        type: "string",
        required: false,
        description: 'Page and ink: "dark" (default) or "light" - the paper card.',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 11 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits its box, the tiles are one size, the bar is full-width, the pace tick is there) and draw it over the card.",
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
        fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use printable ASCII and accented Latin letters (U+00C0-U+017F).`);
    const s = value.trim();
    if (s.length > max)
        fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
    return s;
}
function int(value, field, min, max) {
    if (typeof value !== "number" || !Number.isInteger(value))
        fail(field, `${JSON.stringify(value)} is not an integer.`);
    if (value < min || value > max)
        fail(field, `${value} is outside ${min} to ${max}.`);
    return value;
}
/** Thousands separators, deterministic (no locale): 4703 -> "4,703". */
function fmtInt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/** A rating the way wrap-ups print it: 5, 4.5, 4 - never 4.50. */
function fmtRating(r) {
    return r % 1 === 0 ? String(r) : r.toFixed(1);
}
/** The wrap-up's pace line, from goal, count and day: the number people compute by hand. */
function readingPace(goalTotal, booksSoFar, dayOfYear) {
    const pace = (goalTotal * dayOfYear) / 365;
    const delta = booksSoFar - pace;
    const rounded = Math.round(delta);
    const deltaText = Math.abs(delta) < 0.5 ? "on pace" : rounded > 0 ? `${rounded} ahead of pace` : `${-rounded} behind pace`;
    return { pace, delta, deltaText };
}
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
function normalizeReadingCard(props) {
    const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props !== null && props !== void 0 ? props : {}).filter(([, v]) => v !== undefined)) };
    const month = text(p.month, "month", 24);
    if (month === "")
        fail("month", "is the header's first line; give it a month.");
    const reader = text(p.reader, "reader", 32);
    const books = int(p.books, "books", 0, 999);
    const pages = int(p.pages, "pages", 0, 999999);
    if (typeof p.avgRating !== "number" || Number.isNaN(p.avgRating))
        fail("avgRating", "must be a number.");
    if (p.avgRating < 0 || p.avgRating > 5)
        fail("avgRating", `${p.avgRating} is outside 0 to 5.`);
    const avgRating = Math.round(p.avgRating * 10) / 10;
    const goalTotal = int(p.goalTotal, "goalTotal", 1, 999);
    const booksSoFar = int(p.booksSoFar, "booksSoFar", 0, 999);
    const dayOfYear = int(p.dayOfYear, "dayOfYear", 1, 366);
    if (p.preset !== "dark" && p.preset !== "light")
        fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
    if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim()))
        fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
    if (typeof p.debugLayout !== "boolean")
        fail("debugLayout", "must be a boolean.");
    if (!Array.isArray(p.titles))
        fail("titles", "must be a list of { title, rating } entries.");
    if (p.titles.length > 12)
        fail("titles", `has ${p.titles.length} entries; the shelf takes at most 12 and renders the first 6.`);
    const titles = p.titles.map((entry, i) => {
        if (typeof entry !== "object" || entry === null)
            fail(`titles[${i}]`, "must be { title, rating }.");
        const t = text(entry.title, `titles[${i}].title`, 80);
        if (t === "")
            fail(`titles[${i}].title`, "is empty.");
        const r = entry.rating;
        if (typeof r !== "number" || Number.isNaN(r))
            fail(`titles[${i}].rating`, "must be a number.");
        if (r < 0 || r > 5)
            fail(`titles[${i}].rating`, `${r} is outside 0 to 5.`);
        if ((r * 2) % 1 !== 0)
            fail(`titles[${i}].rating`, `${r} is not a half step - wrap-ups print 4.5, never 4.7.`);
        return { title: t, rating: r };
    });
    const progress = booksSoFar / goalTotal;
    const fillFrac = Math.max(0, Math.min(1, progress));
    const { pace, deltaText } = readingPace(goalTotal, booksSoFar, dayOfYear);
    const paceFrac = Math.max(0, Math.min(1, pace / goalTotal));
    const pctText = `${Math.round(progress * 100)}% of goal`;
    const overGoal = booksSoFar > goalTotal;
    return {
        month, reader, books, pages, avgRating, goalTotal, booksSoFar, dayOfYear, titles,
        progress, fillFrac, pace, paceFrac, deltaText, pctText, overGoal,
        booksText: fmtInt(books), pagesText: fmtInt(pages), avgText: avgRating.toFixed(1),
        goalText: `${fmtInt(booksSoFar)} of ${fmtInt(goalTotal)}`,
        dayText: `day ${dayOfYear} of 365`,
        footnote: "Progress, pace and the delta are computed, not typed: pace = goal x day-of-year / 365.",
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
function layoutReadingCard(props, W, H) {
    const p = normalizeReadingCard(props);
    const theme = THEMES[p.preset];
    const ink = theme.ink, dim = theme.dim;
    const S = Math.min(W, H);
    const m = Math.round(S * 0.05), CW = W - 2 * m;
    const gap = Math.round(S * 0.016);
    const floor = Math.max(6, Math.round(S * 0.017)), small = Math.max(5, Math.round(S * 0.013));
    const cells = [];
    const tiles = [];
    const unfit = (field) => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
    /** One fitted line in `rect`; refuses below the floor instead of clipping. */
    const line = (label, rect, value, px, o = {}) => {
        var _a, _b, _c, _d, _e;
        if (px < ((_a = o.floorPx) !== null && _a !== void 0 ? _a : floor))
            unfit((_b = o.field) !== null && _b !== void 0 ? _b : label);
        cells.push({ label, rect, text: value, px, width: (0, text_1.widthOf)(value, px, o.bold === true), bold: o.bold === true, align: (_c = o.align) !== null && _c !== void 0 ? _c : "left", color: (_d = o.color) !== null && _d !== void 0 ? _d : ink, bind: (_e = o.bind) !== null && _e !== void 0 ? _e : null, ...(o.field ? { field: o.field } : {}) });
    };
    /** A snug cell that always satisfies the contract's budget: cell * 0.94 - 2px >= measured. */
    const snugW = (t, px, bold) => Math.ceil(((0, text_1.widthOf)(t, px, bold) + 2) / 0.94);
    /* ── header: the month, then the reader and the static kind line ── */
    let y = m;
    const monthPx = fitPx(p.month, CW, S * 0.072, true);
    const monthH = Math.round(monthPx * 1.3);
    line("month", { x: m, y, w: CW, h: monthH }, p.month, monthPx, { bold: true, bind: { prop: "month" }, floorPx: small });
    y += monthH + Math.round(gap * 0.4);
    const subPx = fitPx(p.reader !== "" ? p.reader : "MONTHLY WRAP-UP", CW, S * 0.03, false);
    const subH = Math.round(subPx * 1.35);
    if (p.reader !== "")
        line("reader", { x: m, y, w: snugW(p.reader, subPx, false), h: subH }, p.reader, subPx, { color: dim, bind: { prop: "reader" }, floorPx: small });
    const kindText = "MONTHLY WRAP-UP";
    const kindPx = p.reader !== "" ? subPx : fitPx(kindText, CW, S * 0.03, false);
    line("kind", { x: W - m - snugW(kindText, kindPx, false), y, w: snugW(kindText, kindPx, false), h: subH }, kindText, kindPx, { color: dim, align: "right", floorPx: small });
    y += subH;
    const headerBottom = y;
    /* ── footer, pinned to the bottom ── */
    const footPx = fitPx(p.footnote, CW, S * 0.024, false);
    if (footPx < small)
        unfit("the footnote");
    const footH = Math.round(footPx * 1.35);
    line("footnote", { x: m, y: H - m - footH, w: CW, h: footH }, p.footnote, footPx, { color: dim, floorPx: small });
    const footerTop = H - m - footH - Math.round(S * 0.02);
    /* ── stat tiles: books, pages, average rating - one row, one size ── */
    const tilesY = headerBottom + Math.round(S * 0.028);
    const tileH = Math.round(S * 0.17);
    const tileGap = Math.round(S * 0.02);
    const tileW = Math.floor((CW - 2 * tileGap) / 3);
    const STATS = [
        { value: p.booksText, label: "books this month", prop: "books" },
        { value: p.pagesText, label: "pages read", prop: "pages" },
        { value: p.avgText, label: "avg rating", prop: "avgRating" },
    ];
    STATS.forEach((st, i) => {
        const rect = { x: m + i * (tileW + tileGap), y: tilesY, w: tileW, h: tileH };
        tiles.push({ label: `tile-${i}`, rect, color: mix(theme.bg, theme.ink, 0.08), radius: 0.06, bind: null });
        const valuePx = fitPx(st.value, tileW * 0.88, tileH * 0.4, true);
        const valueH = Math.round(valuePx * 1.25);
        line(`tile-value-${i}`, { x: rect.x, y: rect.y + Math.round(tileH * 0.12), w: tileW, h: valueH }, st.value, valuePx, { bold: true, align: "center", bind: { prop: st.prop }, field: st.prop });
        const labelPx = fitPx(st.label, tileW * 0.88, tileH * 0.18, false);
        const labelH = Math.round(labelPx * 1.35);
        line(`tile-label-${i}`, { x: rect.x, y: rect.y + tileH - Math.round(tileH * 0.12) - labelH, w: tileW, h: labelH }, st.label, labelPx, { color: dim, align: "center", floorPx: small });
    });
    /* ── the goal block: count line, the bar with its pace tick, the delta line ── */
    const goalY = tilesY + tileH + Math.round(S * 0.042);
    const goalCap = fitPx("YEAR GOAL", CW * 0.3, S * 0.028, false);
    const goalCapH = Math.round(goalCap * 1.35);
    line("goal-caption", { x: m, y: goalY, w: snugW("YEAR GOAL", goalCap, false), h: goalCapH }, "YEAR GOAL", goalCap, { color: dim, floorPx: small });
    const readPx = fitPx(fmtInt(p.booksSoFar), CW * 0.2, S * 0.04, true);
    const ofText = `of ${fmtInt(p.goalTotal)}`;
    const ofPx = fitPx(ofText, CW * 0.25, S * 0.03, false);
    const readW = snugW(fmtInt(p.booksSoFar), readPx, true);
    const ofW = snugW(ofText, ofPx, false);
    const goalLineH = Math.max(Math.round(readPx * 1.3), goalCapH);
    line("goal-read", { x: W - m - readW - Math.round(gap * 0.4) - ofW, y: goalY + goalLineH - Math.round(readPx * 1.3), w: readW, h: Math.round(readPx * 1.3) }, fmtInt(p.booksSoFar), readPx, { bold: true, align: "right", bind: { prop: "booksSoFar" }, field: "booksSoFar" });
    line("goal-total", { x: W - m - ofW, y: goalY + goalLineH - Math.round(ofPx * 1.35), w: ofW, h: Math.round(ofPx * 1.35) }, ofText, ofPx, { color: dim, align: "right", bind: { prop: "goalTotal" }, field: "goalTotal" });
    const barY = goalY + goalLineH + Math.round(S * 0.018);
    const barH = Math.round(S * 0.062);
    const frame = { x: m, y: barY, w: CW, h: barH };
    tiles.push({ label: "goal-bar", rect: frame, color: mix(theme.bg, theme.ink, 0.12), radius: 0.5, bind: null });
    const fillW = Math.round(CW * p.fillFrac);
    if (fillW > 0)
        tiles.push({ label: "goal-fill", rect: { x: m, y: barY, w: fillW, h: barH }, color: p.accent, radius: 0.5, bind: "accent" });
    const tickW = Math.max(2, Math.round(S * 0.005));
    const tickX = Math.max(m, Math.min(m + CW - tickW, m + Math.round(CW * p.paceFrac) - Math.round(tickW / 2)));
    tiles.push({ label: "pace-tick", rect: { x: tickX, y: barY - Math.round(S * 0.008), w: tickW, h: barH + Math.round(S * 0.016) }, color: ink, radius: 0, bind: null });
    const deltaY = barY + barH + Math.round(S * 0.014);
    const deltaColor = p.deltaText === "on pace" ? ink : p.deltaText.startsWith("on") ? ink : p.deltaText.includes("ahead") ? p.accent : dim;
    const deltaText = `${p.deltaText} - ${p.pctText}`;
    const deltaPx = fitPx(deltaText, CW * 0.62, S * 0.03, p.deltaText.includes("ahead"));
    const deltaH = Math.round(deltaPx * 1.35);
    line("goal-delta", { x: m, y: deltaY, w: snugW(deltaText, deltaPx, p.deltaText.includes("ahead")), h: deltaH }, deltaText, deltaPx, { bold: p.deltaText.includes("ahead"), color: deltaColor, field: "the delta line" });
    const dayPx = fitPx(p.dayText, CW * 0.3, S * 0.026, false);
    line("day-of-year", { x: W - m - snugW(p.dayText, dayPx, false), y: deltaY + Math.round((deltaH - Math.round(dayPx * 1.35)) / 2), w: snugW(p.dayText, dayPx, false), h: Math.round(dayPx * 1.35) }, p.dayText, dayPx, { color: dim, align: "right", bind: { prop: "dayOfYear" }, field: "dayOfYear", floorPx: small });
    const goalBottom = deltaY + deltaH;
    /* ── the shelf: up to six title rows sharing the space left ── */
    const shelfLabelY = goalBottom + Math.round(S * 0.034);
    const shelfCapPx = fitPx("ON THE SHELF THIS MONTH", CW, S * 0.026, false);
    const shelfCapH = Math.round(shelfCapPx * 1.35);
    line("shelf-caption", { x: m, y: shelfLabelY, w: snugW("ON THE SHELF THIS MONTH", shelfCapPx, false), h: shelfCapH }, "ON THE SHELF THIS MONTH", shelfCapPx, { color: dim, floorPx: small });
    const shown = p.titles.slice(0, 6);
    const regionTop = shelfLabelY + shelfCapH + Math.round(gap * 0.7);
    const regionBottom = footerTop;
    const nRows = Math.max(1, shown.length);
    const rowH = Math.min(Math.round(S * 0.052), Math.floor((regionBottom - regionTop) / nRows));
    if (rowH < Math.round(floor * 1.8))
        unfit("the shelf rows");
    const titleW = (rating, px) => CW - snugW(rating, px, false) - Math.round(S * 0.03);
    shown.forEach((entry, i) => {
        const rowY = regionTop + i * rowH;
        const ratingText = fmtRating(entry.rating);
        const ratingPx = fitPx(ratingText, CW * 0.06, rowH * 0.5, false);
        const ratingW = snugW(ratingText, ratingPx, false);
        const tPx = fitPx(entry.title, titleW(ratingText, ratingPx), rowH * 0.5, false);
        line(`shelf-title-${i}`, { x: m, y: rowY, w: titleW(ratingText, ratingPx), h: rowH }, entry.title, tPx, { bind: { prop: "titles", key: i }, field: `titles[${i}].title` });
        line(`shelf-rating-${i}`, { x: W - m - ratingW, y: rowY, w: ratingW, h: rowH }, ratingText, ratingPx, { color: dim, align: "right", bind: { prop: "titles", key: i }, field: `titles[${i}].rating` });
    });
    if (shown.length === 0) {
        const emptyText = "No shelf titles given - the export's rows would fill this.";
        const emptyPx = fitPx(emptyText, CW, rowH * 0.5, false);
        line("shelf-empty", { x: m, y: regionTop, w: CW, h: rowH }, emptyText, emptyPx, { color: dim, floorPx: small });
    }
    /* ── spread the slack across the inter-section gaps on tall canvases ── */
    // On a portrait canvas the S-derived sections would huddle at the top with a
    // dead band above the pinned footnote. The free space goes into the gaps
    // between the header, the tiles, the goal block and the shelf, a quarter
    // each - the header keeps the top, the footnote keeps the bottom, and the
    // rhythm in between is even. A pure function of props and canvas.
    const shelfBottom = regionTop + nRows * rowH;
    const slack = Math.max(0, footerTop - m - (shelfBottom - m));
    const spread = (label) => {
        if (label.startsWith("tile-"))
            return Math.floor(slack / 4);
        if (label.startsWith("goal-") || label === "pace-tick" || label === "day-of-year")
            return Math.floor(slack / 2);
        if (label.startsWith("shelf-"))
            return Math.floor((3 * slack) / 4);
        return 0;
    };
    if (slack > 0) {
        for (const c of cells)
            c.rect.y += spread(c.label);
        for (const t of tiles)
            t.rect.y += spread(t.label);
    }
    return { p, theme, m, CW, gap, floor, small, cells, tiles, barRect: frame, fillW, tickX, headerBottom, footerTop, tilesY, tileW, tileH, slack };
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY = {
    "day": 22,
    "date": "2026-10-11",
    "agent": "opencode",
    "model": "kimi-k3",
    "id": "@one-a-day/personal/reading-goal-recap/v1",
    "title": "Reading Goal Recap",
    "who": "Book bloggers and the 52book reading-challenge crowd who post monthly wrap-ups and track the Goodreads Reading Challenge (books read vs yearly goal) by hand",
    "problem": [
        "The monthly wrap-up is a fixed ritual on book blogs - Leah's Books has run one every month since December 2020 - and its numbers are tabulated by hand every time: \"Books read: 43 ... Pages read: 9,130 ... Average pages: 338.1 ... Days per book: 2.63 ... Pages read per day: 125.33\".",
        "The challenge line is the one nobody enjoys: Kami's Library Thoughts keeps a hand star table and writes \"Goodreads Challenge - I am 16 books behind schedule. (88/125)\". A whole tool (booksense) turns the export into monthly charts \"ready to screenshot\" - Goodreads itself gives one summary, in December.",
    ],
    "sources": [
        "https://leahs-books.com/2022/11/05/monthly-wrap-up-october-2022/",
        "http://kamislibrarythoughts.blogspot.com/2022/11/october-stats.html",
        "https://booksense.app/tools/goodreads-stats",
    ],
    "solution": [
        "Give the month's numbers - books, pages, average rating, the shelf titles - plus the year goal, the books so far and the day of the year. One deterministic render returns the wrap-up card: three stat tiles, the goal bar, and the shelf.",
        "The one decision: the pace line is computed, never typed. The bar fill is booksSoFar/goalTotal, the tick sits at pace = goal x dayOfYear / 365, and the delta line (\"3 ahead of pace - 88% of goal\") falls out of both. dayOfYear is a prop, so the card is deterministic and cannot disagree with itself.",
    ],
    "usage": {
        "command": "m0saic make @one-a-day/personal/reading-goal-recap/v1 --template-repo . -w 1920 -h 1080 -o recap.png",
        "try": [
            "goalTotal, booksSoFar and dayOfYear drive the bar, the pace tick and the delta line - all three are computed",
            "titles takes up to 12 { title, rating } entries (ratings in half steps); the first 6 render",
            "booksSoFar past goalTotal is allowed: the bar clamps at full and the delta tells how far past",
            "preset \"light\" is the paper card; accent recolours the bar fill and an ahead-of-pace delta",
        ],
    },
    "caveats": [
        "No covers: the export has no images and nothing downloads into the repo, so the shelf is title and rating text only.",
        "No genre table: the Goodreads export has no genre column (booksense says the same of its own charts) - the card sticks to counts, pages, ratings and pace.",
        "The default month (@leah_reads, October 2026, 46 of 52) is invented, as the schema says; every number on it is consistent.",
    ],
    "timeline": {
        "source": "self-reported",
        "phases": [
            { "name": "scout", "startMs": 0, "durMs": 1560000, "tools": "WebSearch 4, Bash 11, Write 2" },
            { "name": "plan", "startMs": 1560000, "durMs": 720000, "tools": "Read 4, Write 2" },
            { "name": "build", "startMs": 2280000, "durMs": 5400000, "tools": "Bash 10, Edit 6, Read 5, Write 3" },
            { "name": "critique", "startMs": 7680000, "durMs": 900000, "tools": "Read 6, Bash 2, Write 1" },
            { "name": "ship", "startMs": 8580000, "durMs": 1200000, "tools": "Bash 4, Edit 2, Write 2" }
        ],
    },
};
exports.ReadingGoalRecapV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-10-11 · Reading Goal Recap",
    version: 1,
    description: "A monthly reading wrap-up card from the Goodreads export's own numbers: books, pages and average rating as stat tiles, the year's challenge goal as a progress bar with the pace tick drawn - the '16 behind schedule (88/125)' line, computed, not typed.",
    capabilities: { tier: "core" },
    tags: ["personal", "2026-10-11", "day-022", "reading", "books", "wrap-up", "goodreads", "challenge", "monthly"],
    outputHints: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Still PNG. The same sections stack on landscape, square and portrait; the shelf renders the first six titles. Minimum tested canvas 480x270.",
    },
    propsSchema,
    defaultProps: DEFAULTS,
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.ReadingGoalRecapV1;
async function render(props, ctx) {
    var _a, _b;
    const { width: W, height: H } = ctx.target;
    const L = layoutReadingCard(props, W, H);
    const pieces = [];
    const constraints = [];
    // Emitted in paint order: tiles (stat tiles, bar frame, fill, tick), then text.
    for (const t of L.tiles) {
        const tile = (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(t.color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } }), t.label);
        pieces.push({ rect: { ...t.rect, importance: 1 }, source: t.bind === "accent" ? (0, template_utils_1.bindProp)(tile, "accent") : tile });
    }
    for (const c of L.cells) {
        const cell = (0, template_utils_1.tag)((0, text_1.textCell)({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, vAlign: "middle", label: c.label }), c.label);
        // A text rect is BOUND to the prop it shows; derived text (the delta line, the captions) stays unbound.
        const source = c.bind === null ? cell : c.bind === "accent" ? (0, template_utils_1.bindProp)(cell, "accent") : typeof c.bind.key === "number" ? (0, template_utils_1.bindPropPath)(cell, "titles", [c.bind.key, ((_a = c.field) === null || _a === void 0 ? void 0 : _a.endsWith("rating")) ? "rating" : "title"], ((_b = c.field) === null || _b === void 0 ? void 0 : _b.endsWith("rating")) ? "number" : "string") : (0, template_utils_1.bindProp)(cell, c.bind.prop);
        pieces.push({ rect: { ...c.rect, importance: 3 }, source });
        constraints.push((0, layout_1.textFitsMeasured)(c.label, c.text, c.px, c.width));
    }
    // What the geometry promises, against the labels: the header is the top
    // band, the tiles one row of one size, the goal bar full-width in the
    // middle band with its pace tick present, the shelf below it, the footnote
    // in the bottom band. Every text fits its box (measured, above).
    constraints.push({ label: "month", within: { yFrac: [0, 0.36] } });
    constraints.push({ label: "goal-bar", within: { yFrac: [0.2, 0.8] }, minWidthFrac: 0.9 });
    constraints.push({ label: "pace-tick", within: { yFrac: [0.2, 0.82] } });
    constraints.push({ label: "shelf-caption", within: { yFrac: [0.35, 0.95] } });
    constraints.push({ label: "footnote", within: { yFrac: [0.85, 1] } });
    const relations = [
        { label: ["tile-0", "tile-1", "tile-2"], equal: "size", tolerancePx: 2 },
    ];
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
