"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommanderDeckSpotlightV1 = void 0;
exports.normalizeSpotlight = normalizeSpotlight;
exports.layoutSpotlightCard = layoutSpotlightCard;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/gaming/commander-deck-spotlight/v1";
const DEFAULT_ACCENT = "#c9a227";
const THEMES = {
    dark: { bg: "#161d27", row: "#1e2733", ink: "#e8edf3", dim: "#8b98a8" },
    light: { bg: "#f2f0ea", row: "#e7e4db", ink: "#1b222b", dim: "#5c6672" },
};
/** Mana colours: W parchment, U blue, B near-black, R red, G green. */
const MANA = {
    W: "#e8d9b0",
    U: "#3f6fc4",
    B: "#2b2431",
    R: "#b3403a",
    G: "#4e8f57",
};
const WUBRG = ["W", "U", "B", "R", "G"];
// An invented Mardu tokens list - the shape every builder export shows:
// name, commander, colour identity, a curve, and the cards the deck is about.
const DEFAULT_HIGHLIGHTS = [
    { name: "Anointed Procession", note: "token doubler", qty: 1 },
    { name: "Skullclamp", note: "draw engine", qty: 1 },
    { name: "Ashnod's Altar", note: "sac outlet", qty: 1 },
    { name: "Impact Tremors", note: "the drain", qty: 1 },
];
const DEFAULTS = {
    deckName: "Caesar's Legion Tokens",
    commander: "Caesar, Legion's Emperor",
    manaIdentity: "WBR",
    bracket: 3,
    record: "4-0",
    curve: [4, 10, 16, 13, 9, 6, 3, 2],
    highlights: DEFAULT_HIGHLIGHTS,
    plan: "Flood the board with tokens, then drain everyone out with Impact Tremors.",
    accent: DEFAULT_ACCENT,
    preset: "dark",
    debugLayout: false,
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    deckName: {
        type: "string",
        required: false,
        description: "The deck's name, the largest line on the card. ASCII, 1 to 48 characters. The rect that shows it is bound to it, so Make's double-click edits it in place.",
        meta: { control: { placeholder: DEFAULTS.deckName }, ui: { label: "Deck name", order: 1, primary: true } },
    },
    commander: {
        type: "string",
        required: false,
        description: "The commander, the line under the deck name. ASCII, 1 to 40 characters.",
        meta: { control: { placeholder: DEFAULTS.commander }, ui: { label: "Commander", order: 2 } },
    },
    manaIdentity: {
        type: "string",
        required: false,
        description: 'The colour identity chips: letters from WUBRG, no duplicates, 0 to 5 letters. Drawn one square mana pip per letter in canonical WUBRG order (W parchment, U blue, B near-black, R red, G green). Empty removes the chip row.',
        meta: { control: { placeholder: DEFAULTS.manaIdentity }, ui: { label: "Color identity", order: 3 } },
    },
    bracket: {
        type: "number",
        required: false,
        description: "The bracket pill (power bracket 1-5), a whole number. The builder UI shows it; the export does not.",
        meta: { constraints: { min: 1, max: 5 }, ui: { label: "Bracket", order: 4 } },
    },
    record: {
        type: "string",
        required: false,
        description: 'The record pill beside the bracket pill ("4-0", "2-1-1"). ASCII, 0 to 8 characters. Empty removes the pill.',
        meta: { control: { placeholder: DEFAULTS.record }, ui: { label: "Record", order: 5 } },
    },
    curve: {
        type: "number[]",
        required: false,
        description: "The mana curve: 8 counts at MV 0, 1, 2, 3, 4, 5, 6 and 7+, each 0-99. Bar heights are proportional to these counts (the tallest fills the plot) and AVG MV and the spell count are computed from them - never typed.",
        meta: {
            constraints: { minItems: 8, maxItems: 8, min: 0, max: 99 },
            ui: { label: "Mana curve (8 counts)", order: 6 },
        },
    },
    highlights: {
        type: "list",
        required: false,
        description: "The highlight cards, 3 to 6 rows - the cards the deck is about, not the whole 100. Each row is { name, note, qty }: the card name (ASCII 1-48), a dim note like \"token doubler\" (ASCII 0-28) and the copies in the deck (1-99).",
        meta: { constraints: { minItems: 3, maxItems: 6 }, ui: { label: "Highlight cards", order: 7, primary: true } },
        fields: {
            name: { type: "string", required: true, description: "The card name, ASCII, 1 to 48 characters.", meta: { ui: { label: "Card name" } } },
            note: { type: "string", required: false, description: 'Dim note under the name - what the card does ("token doubler"). ASCII, 0 to 28 characters.', meta: { control: { placeholder: "none" }, ui: { label: "Note" } } },
            qty: { type: "number", required: true, description: "Copies in the deck, 1-99.", meta: { constraints: { min: 1, max: 99 }, ui: { label: "Qty" } } },
        },
    },
    plan: {
        type: "string",
        required: false,
        description: 'The plan one-liner across the footer, up to 90 characters: how the deck wins ("Flood the board with tokens, then drain everyone out."). Empty removes the line and the footer stays empty.',
        meta: { control: { placeholder: DEFAULTS.plan }, ui: { label: "Plan", order: 8 } },
    },
    accent: {
        type: "string",
        required: false,
        description: "Bar and pill accent ink, as #rrggbb.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 9 } },
    },
    preset: {
        type: "string",
        required: false,
        description: 'Page and ink: "dark" (the builder-UI night look, default) or "light".',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 10 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits its box, the pills sit top-right, the chips are square, the curve and rows live in the body band, the rows are one height) and draw it over the card.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
/* ---- the arithmetic: pure, exported, and what the test asserts ---- */
function fail(field, rule) {
    throw new Error(`${ID}: ${field} ${rule}`);
}
/** Printable ASCII only - the copy this card draws is ASCII by ruling. */
const DRAWN = /^[\x20-\x7e]*$/;
function text(value, field, min, max) {
    if (typeof value !== "string")
        fail(field, "must be a string.");
    if (!DRAWN.test(value))
        fail(field, `${JSON.stringify(value)} has a character outside printable ASCII; the card draws ASCII only.`);
    const s = value.trim();
    if (s.length < min)
        fail(field, `must not be blank.`);
    if (s.length > max)
        fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
    return s;
}
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
function normalizeSpotlight(props) {
    const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props !== null && props !== void 0 ? props : {}).filter(([, v]) => v !== undefined)) };
    const deckName = text(p.deckName, "deckName", 1, 48);
    const commander = text(p.commander, "commander", 1, 40);
    const record = text(p.record, "record", 0, 8);
    const plan = text(p.plan, "plan", 0, 90);
    if (typeof p.bracket !== "number" || !Number.isInteger(p.bracket))
        fail("bracket", `${JSON.stringify(p.bracket)} must be a whole number.`);
    if (p.bracket < 1 || p.bracket > 5)
        fail("bracket", `${p.bracket} is outside 1 to 5.`);
    if (typeof p.manaIdentity !== "string")
        fail("manaIdentity", "must be a string of WUBRG letters.");
    const seen = new Set();
    for (const ch of p.manaIdentity.trim().toUpperCase()) {
        if (!WUBRG.includes(ch))
            fail("manaIdentity", `${JSON.stringify(p.manaIdentity)} has ${JSON.stringify(ch)}: letters come from WUBRG.`);
        if (seen.has(ch))
            fail("manaIdentity", `${JSON.stringify(p.manaIdentity)} repeats ${ch}; each letter appears once.`);
        seen.add(ch);
    }
    if (seen.size > 5)
        fail("manaIdentity", `${JSON.stringify(p.manaIdentity)} is ${seen.size} letters; the card draws at most 5 chips.`);
    // Canonical WUBRG order, whatever order the caller typed.
    const colorLetters = WUBRG.filter((l) => seen.has(l));
    if (!Array.isArray(p.curve))
        fail("curve", "must be a list of 8 counts (MV 0,1,2,3,4,5,6,7+).");
    if (p.curve.length !== 8)
        fail("curve", `has ${p.curve.length} counts; a mana curve is exactly 8 (MV 0,1,2,3,4,5,6,7+).`);
    const curve = p.curve.map((c, i) => {
        if (typeof c !== "number" || !Number.isInteger(c))
            fail(`curve[${i}]`, `${JSON.stringify(c)} must be a whole number of cards.`);
        if (c < 0 || c > 99)
            fail(`curve[${i}]`, `${c} is outside 0 to 99.`);
        return c;
    });
    const spells = curve.reduce((s, c) => s + c, 0);
    if (spells === 0)
        fail("curve", "sums to 0; a deck with no spells has no curve to draw.");
    const avgMv = curve.reduce((s, c, mv) => s + mv * c, 0) / spells;
    if (!Array.isArray(p.highlights))
        fail("highlights", "must be a list of { name, note, qty } rows.");
    if (p.highlights.length < 3)
        fail("highlights", `has ${p.highlights.length} rows; the card shows 3 to 6 highlight cards.`);
    if (p.highlights.length > 6)
        fail("highlights", `has ${p.highlights.length} rows; the card shows 3 to 6 highlight cards - a longer list is a decklist, not a digest.`);
    const highlights = p.highlights.map((row, i) => {
        const at = `highlights[${i}]`;
        if (!row || typeof row !== "object" || Array.isArray(row))
            fail(at, "must be an object { name, note, qty }.");
        const name = text(row.name, `${at}.name`, 1, 48);
        const note = row.note === undefined ? "" : text(row.note, `${at}.note`, 0, 28);
        if (row.qty === undefined)
            fail(`${at}.qty`, "is missing; give the copies in the deck (1-99).");
        if (typeof row.qty !== "number" || !Number.isInteger(row.qty))
            fail(`${at}.qty`, `${JSON.stringify(row.qty)} must be a whole number.`);
        if (row.qty < 1 || row.qty > 99)
            fail(`${at}.qty`, `${row.qty} is outside 1 to 99.`);
        return { name, note, qty: row.qty };
    });
    if (p.preset !== "dark" && p.preset !== "light")
        fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
    if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim()))
        fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
    if (typeof p.debugLayout !== "boolean")
        fail("debugLayout", "must be a boolean.");
    return {
        deckName,
        commander,
        record,
        plan,
        colorLetters,
        bracket: p.bracket,
        curve,
        spells,
        maxCount: Math.max(...curve),
        avgMv,
        avgText: avgMv.toFixed(2),
        spellsText: `${spells} ${spells === 1 ? "SPELL" : "SPELLS"}`,
        figuresText: `AVG MV ${avgMv.toFixed(2)} - ${spells} ${spells === 1 ? "SPELL" : "SPELLS"}`,
        highlights,
        accent: p.accent.trim().toLowerCase(),
        preset: p.preset,
        debugLayout: p.debugLayout,
    };
}
/* ---- colour ---- */
function mix(a, b, t) {
    const ch = (s, i) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
    const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
    return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function luminance(hex) {
    const c = (i) => {
        const v = parseInt(hex.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
/** The readable ink over a filled chip: dark or white, whichever contrasts more. */
function onColor(fill) {
    const ratio = (other) => {
        const a = luminance(fill), b = luminance(other);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
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
/** The smallest cell that holds `t` at `px` in its budget. */
function snugW(t, px, bold) {
    return Math.ceil(((0, text_1.widthOf)(t, px, bold) + 2) / 0.94);
}
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
function layoutSpotlightCard(props, W, H) {
    const p = normalizeSpotlight(props);
    const theme = THEMES[p.preset];
    const ink = theme.ink, dim = theme.dim;
    const S = Math.min(W, H);
    const m = Math.round(S * 0.05);
    const CW = W - 2 * m;
    const gap = Math.round(S * 0.016);
    const hair = Math.max(1, Math.round(S * 0.0022));
    const floor = Math.max(6, Math.round(S * 0.017));
    const small = Math.max(5, Math.round(S * 0.013));
    const cells = [];
    const tiles = [];
    const unfit = (field) => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
    const line = (label, rect, value, px, o = {}) => {
        var _a, _b, _c, _d, _e;
        if (px < ((_a = o.floorPx) !== null && _a !== void 0 ? _a : floor))
            unfit((_b = o.field) !== null && _b !== void 0 ? _b : label);
        cells.push({
            label,
            rect,
            text: value,
            px,
            width: (0, text_1.widthOf)(value, px, o.bold === true),
            bold: o.bold === true,
            align: (_c = o.align) !== null && _c !== void 0 ? _c : "left",
            color: (_d = o.color) !== null && _d !== void 0 ? _d : ink,
            bind: (_e = o.bind) !== null && _e !== void 0 ? _e : null,
            over: o.over === true,
        });
    };
    /* ---- header band [0, 0.30): kicker + pills, deck name, commander + chips ---- */
    const headBottom = Math.round(H * 0.29);
    const usable = headBottom - m;
    const topH = Math.round(usable * 0.24);
    const nameH = Math.round(usable * 0.42);
    const cmdH = usable - topH - nameH;
    const cmdY = m + topH + nameH;
    // Pills first (they own the top-right), then the kicker in what is left.
    const pillH = Math.min(Math.round(topH * 0.78), Math.round(S * 0.058));
    const pillY = m + Math.round((topH - pillH) / 2);
    const pillPx0 = Math.max(small, Math.round(pillH * 0.42));
    const pillPad = Math.round(pillH * 0.45);
    const pillTexts = [
        { label: "bracket-pill", text: `BRACKET ${p.bracket}`, bind: { prop: "bracket" } },
    ];
    if (p.record !== "")
        pillTexts.push({ label: "record-pill", text: p.record, bind: { prop: "record" } });
    const pillW = pillTexts.map((t) => snugW(t.text, pillPx0, true) + 2 * pillPad);
    const pillsW = pillW.reduce((s, w) => s + w, 0) + (pillTexts.length - 1) * gap;
    let pillX = W - m - pillsW;
    pillTexts.forEach((t, i) => {
        // The text cell spans the whole pill (centred), so the fit has the pad
        // slack too - fitting against the inner width rounded one pixel short of
        // the text at 480x270 and dropped below the floor.
        const px = fitPx(t.text, pillW[i], pillPx0, true);
        tiles.push({ label: `${t.label}-bg`, rect: { x: pillX, y: pillY, w: pillW[i], h: pillH }, color: p.accent, radius: 0.5, layer: 1, bind: "accent" });
        line(t.label, { x: pillX, y: pillY, w: pillW[i], h: pillH }, t.text, px, { bold: true, align: "center", color: onColor(p.accent), bind: t.bind, over: true, floorPx: small });
        pillX += pillW[i] + gap;
    });
    const kicker = "DECK SPOTLIGHT";
    const kickH = Math.round(topH * 0.7);
    const kickW = W - m - pillsW - gap - m;
    line("kicker", { x: m, y: m + Math.round((topH - kickH) / 2), w: Math.max(1, kickW), h: kickH }, kicker, fitPx(kicker, Math.max(1, kickW), topH * 0.42, true), { bold: true, color: dim, floorPx: small, field: "kicker" });
    line("deck-name", { x: m, y: m + topH, w: CW, h: nameH }, p.deckName, fitPx(p.deckName, CW, nameH * 0.72, true), { bold: true, bind: { prop: "deckName" }, field: "deckName" });
    // The commander line with the mana chips right-aligned on the same line.
    const chipSide = Math.min(Math.round(cmdH * 0.62), Math.round(S * 0.055));
    const chipGap = Math.round(S * 0.008);
    const chipsW = p.colorLetters.length * chipSide + Math.max(0, p.colorLetters.length - 1) * chipGap;
    const cmdText = `Commander: ${p.commander}`;
    const cmdW = CW - (p.colorLetters.length ? chipsW + gap : 0);
    const cmdPx = fitPx(cmdText, cmdW, cmdH * 0.52, false);
    line("commander", { x: m, y: cmdY, w: Math.max(1, cmdW), h: cmdH }, cmdText, cmdPx, { bind: { prop: "commander" }, field: "commander" });
    const chipY = cmdY + Math.round((cmdH - chipSide) / 2);
    let chipX = W - m - chipsW;
    for (const letter of p.colorLetters) {
        const fill = MANA[letter];
        tiles.push({ label: `chip-${letter}`, rect: { x: chipX, y: chipY, w: chipSide, h: chipSide }, color: fill, radius: 0.08, layer: 1, bind: "manaIdentity" });
        line(`chip-letter-${letter}`, { x: chipX, y: chipY, w: chipSide, h: chipSide }, letter, fitPx(letter, chipSide * 0.9, chipSide * 0.55, true), {
            bold: true,
            align: "center",
            color: onColor(fill),
            bind: { prop: "manaIdentity" },
            over: true,
            floorPx: small,
            field: `manaIdentity ${letter}`,
        });
        chipX += chipSide + chipGap;
    }
    /* ---- body band [0.30, 0.86): curve cell + highlights cell ---- */
    const bodyTop = Math.round(H * 0.302);
    const bodyBottom = Math.round(H * 0.855);
    const bodyH = bodyBottom - bodyTop;
    const sideBySide = W >= H;
    const curveCell = sideBySide
        ? { x: m, y: bodyTop, w: Math.round(W * 0.46) - m, h: bodyH }
        : { x: m, y: bodyTop, w: CW, h: Math.round(bodyH * 0.45) };
    const hlCell = sideBySide
        ? { x: Math.round(W * 0.5), y: bodyTop, w: W - m - Math.round(W * 0.5), h: bodyH }
        : { x: m, y: bodyTop + Math.round(bodyH * 0.45) + gap, w: CW, h: bodyH - Math.round(bodyH * 0.45) - gap };
    // -- mana curve: label, counts above the bars, 8 bars, MV axis, derived figures
    const labelH = Math.round(S * 0.038);
    const figuresH = Math.round(S * 0.038);
    const mvH = Math.round(S * 0.032);
    const countH = Math.round(S * 0.03);
    line("curve-label", { x: curveCell.x, y: curveCell.y, w: curveCell.w, h: labelH }, "MANA CURVE", fitPx("MANA CURVE", curveCell.w, labelH * 0.72, true), { bold: true, color: dim, floorPx: small });
    const plotX = curveCell.x, plotW = curveCell.w;
    const plotTop = curveCell.y + labelH + Math.round(gap * 0.4) + countH;
    const plotBottom = curveCell.y + curveCell.h - figuresH - mvH - Math.round(gap * 0.8);
    const plotH = Math.max(4, plotBottom - plotTop);
    // The plot is present (the bare presence check the contract wants) and the
    // tallest bar fills it exactly - bars are count / max(count) of plotH.
    tiles.push({ label: "curve-plot", rect: { x: plotX, y: plotTop, w: plotW, h: plotH }, color: mix(theme.bg, theme.ink, 0.07), radius: 0.02, layer: 1, bind: null });
    const MV_LABELS = ["0", "1", "2", "3", "4", "5", "6", "7+"];
    const slotOf = (i) => {
        const x0 = plotX + Math.round((i * plotW) / 8);
        const x1 = plotX + Math.round(((i + 1) * plotW) / 8);
        return { x: x0, w: x1 - x0 };
    };
    const bars = [];
    p.curve.forEach((count, i) => {
        const slot = slotOf(i);
        const barW = Math.max(2, Math.round(slot.w * 0.62));
        const barH = count === 0 ? 0 : Math.max(1, Math.round((plotH * count) / p.maxCount));
        const rect = count === 0 ? null : { x: slot.x + Math.round((slot.w - barW) / 2), y: plotBottom - barH, w: barW, h: barH };
        if (rect)
            tiles.push({ label: `bar-${i}`, rect, color: p.accent, radius: 0.06, layer: 2, bind: { curve: i } });
        if (rect) {
            line(`bar-count-${i}`, { x: slot.x, y: rect.y - countH, w: slot.w, h: countH }, String(count), fitPx(String(count), slot.w, countH * 0.85, true), {
                bold: true,
                align: "center",
                bind: { curve: i },
                floorPx: small,
                field: `curve[${i}] count`,
            });
        }
        line(`mv-${i}`, { x: slot.x, y: plotBottom, w: slot.w, h: mvH }, MV_LABELS[i], fitPx(MV_LABELS[i], slot.w, mvH * 0.85, false), { align: "center", color: dim, floorPx: small, field: `curve[${i}] label` });
        bars.push({ i, rect, count });
    });
    // The derived figures - computed from the buckets above, never a prop.
    line("curve-figures", { x: plotX, y: plotBottom + mvH + Math.round(gap * 0.3), w: plotW, h: figuresH }, p.figuresText, fitPx(p.figuresText, plotW, figuresH * 0.72, true), {
        bold: true,
        floorPx: small,
        field: "the derived AVG MV and spell count",
    });
    // -- highlights: label, then 3-6 equal-height rows, hairline-separated
    line("hl-label", { x: hlCell.x, y: hlCell.y, w: hlCell.w, h: labelH }, "HIGHLIGHT CARDS", fitPx("HIGHLIGHT CARDS", hlCell.w, labelH * 0.72, true), { bold: true, color: dim, floorPx: small });
    const n = p.highlights.length;
    const rowsTop = hlCell.y + labelH + Math.round(gap * 0.5);
    const rowsBottom = hlCell.y + hlCell.h;
    const pitch = Math.floor((rowsBottom - rowsTop) / n);
    const rowH = pitch - hair;
    const badgeSide = Math.min(Math.round(rowH * 0.52), Math.round(S * 0.05));
    const rows = [];
    p.highlights.forEach((row, i) => {
        const y = rowsTop + i * pitch;
        const rect = { x: hlCell.x, y, w: hlCell.w, h: rowH };
        rows.push({ i, rect });
        tiles.push({ label: `hl-row-${i}`, rect, color: theme.row, radius: 0.04, layer: 1, bind: null });
        if (i > 0)
            tiles.push({ label: `hl-hair-${i}`, rect: { x: hlCell.x, y: y - hair, w: hlCell.w, h: hair }, color: mix(theme.bg, theme.ink, 0.22), radius: 0, layer: 1, bind: null });
        const badge = { x: hlCell.x + Math.round(rowH * 0.12), y: y + Math.round((rowH - badgeSide) / 2), w: badgeSide, h: badgeSide };
        tiles.push({ label: `hl-badge-${i}`, rect: badge, color: p.accent, radius: 0.15, layer: 2, bind: null });
        const qtyText = `${row.qty}x`;
        line(`hl-qty-${i}`, badge, qtyText, fitPx(qtyText, badgeSide * 0.94, badgeSide * 0.5, true), {
            bold: true,
            align: "center",
            color: onColor(p.accent),
            bind: { row: i, field: "qty" },
            over: true,
            floorPx: small,
            field: `highlights[${i}].qty`,
        });
        const textX = badge.x + badgeSide + gap;
        const textW = hlCell.x + hlCell.w - textX - Math.round(rowH * 0.12);
        const nameRect = { x: textX, y: y + Math.round(rowH * 0.08), w: textW, h: Math.round(rowH * 0.52) };
        line(`hl-name-${i}`, nameRect, row.name, fitPx(row.name, textW, rowH * 0.42, true), { bold: true, bind: { row: i, field: "name" }, floorPx: small, field: `highlights[${i}].name` });
        if (row.note !== "") {
            const noteRect = { x: textX, y: y + Math.round(rowH * 0.58), w: textW, h: Math.round(rowH * 0.38) };
            line(`hl-note-${i}`, noteRect, row.note, fitPx(row.note, textW, rowH * 0.28, false), { color: dim, bind: { row: i, field: "note" }, floorPx: small, field: `highlights[${i}].note` });
        }
    });
    /* ---- footer band [0.88, 1]: the plan one-liner ---- */
    if (p.plan !== "") {
        const planH = Math.round(S * 0.038);
        line("plan", { x: m, y: H - m - planH, w: CW, h: planH }, p.plan, fitPx(p.plan, CW, planH * 0.72, false), { color: dim, bind: { prop: "plan" }, field: "plan" });
    }
    return {
        p,
        theme,
        ink,
        dim,
        m,
        CW,
        gap,
        floor,
        small,
        cells,
        tiles,
        bars,
        rows,
        chipSide,
        sideBySide,
        curveCell,
        hlCell,
        bodyTop,
        bodyBottom,
        plotTop,
        plotBottom,
        plotH,
    };
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY = {
    "day": 27,
    "date": "2026-10-16",
    "agent": "opencode",
    "model": "mimo-v2.6-pro",
    "id": "@one-a-day/gaming/commander-deck-spotlight/v1",
    "title": "Commander Deck Spotlight Card",
    "who": "Commander/EDH players on r/EDH, deck-building Facebook groups and playgroup chats, sharing decklists exported from Moxfield, Archidekt or ManaBox",
    "problem": [
        "Mythichub's builder blog: \"I was looking into creating a reusable template that I could post there and on other social media. I created a tool for myself that turns decks into fun images\" - and \"it's easy to scroll past a plain list or a link to a decklist. I think an image gets more attention\".",
        "The ecosystem converged on one digest: Archidekt's FAQ answers \"How do I create an image of my deck to share on social media?\"; TopDeck.gg sells 16:9 deck images \"perfect for: Social media bragging rights - Share your 4-0 tournament deck\"; DeckPassport: \"No more walls of text to explain your deck. Just share the card.\""
    ],
    "sources": [
        "https://mythichub.com/blog/turn-a-boring-decklist-into-an-awesome-image",
        "https://mythichub.com/deck-spotlight",
        "https://archidekt.com/faq",
        "https://overpower.topdeck.gg/blog/visual-deck-display-20250626",
        "https://github.com/YohannBethoule/DeckPassport"
    ],
    "solution": [
        "One card per deck from the fields a builder export already shows: deck name, commander, colour identity, bracket and record, the eight-bucket mana curve, 3-6 highlight cards and the plan one-liner. Deterministic, so a game-night lineup or a top-8 is one CLI loop.",
        "The one decision: the curve never lies. AVG MV and the spell count are COMPUTED from the buckets (179/63 = 2.84 at defaults), never typed, and the bars are height-proportional to the counts with the tallest filling the plot - the card cannot disagree with itself."
    ],
    "usage": {
        "command": "m0saic make @one-a-day/gaming/commander-deck-spotlight/v1 --template-repo . -w 1920 -h 1080 -o journal/2026-10-16/commander-deck-spotlight.png",
        "try": [
            "curve: 8 counts for MV 0..7+; AVG MV and the spell count follow the buckets",
            "highlights: 3-6 rows of { name, note, qty } - the cards you would paste in chat",
            "manaIdentity \"UB\" drops the chips to two; \"\" removes the chip row entirely",
            "-w 1080 -h 1920 for the phone view: the body stacks, curve over highlights"
        ]
    },
    "caveats": [
        "No card art, no network: every existing tool puts Scryfall art at the center and a member may ask \"where's my commander's art?\" - this demo is rectangles and numbers only.",
        "Mana values and bracket are not in the raw export lines; the player reads them off the builder UI and passes them as props.",
        "A 100-card list cannot fit: 3-6 highlight rows is the digest the ecosystem converged on, not a full decklist."
    ],
    "timeline": {
        "source": "runner",
        "phases": [
            {
                "name": "scout",
                "startMs": 0,
                "durMs": 628558,
                "calls": 23,
                "tokens": 833417,
                "costUsd": 0.06,
                "tools": "bash 16, websearch 5, write 2"
            },
            {
                "name": "plan",
                "startMs": 628579,
                "durMs": 484895,
                "calls": 26,
                "tokens": 701093,
                "costUsd": 0.04,
                "tools": "bash 22, grep 3, write 1"
            },
            {
                "name": "build",
                "startMs": 1113517,
                "durMs": 4552072,
                "calls": 92,
                "tokens": 11259454,
                "costUsd": 0.25,
                "tools": "bash 60, edit 15, read 9",
                "status": "error"
            },
            {
                "name": "critique",
                "startMs": 5665632,
                "durMs": 883373,
                "calls": 48,
                "tokens": 1545853,
                "costUsd": 0.06,
                "tools": "bash 28, read 13, grep 6"
            }
        ],
        "costBasis": "reported"
    }
};
exports.CommanderDeckSpotlightV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-10-16 · Commander Deck Spotlight Card",
    version: 1,
    description: "A Magic Commander/EDH deck as one share card from the decklist fields themselves: kicker, bracket and record pills, deck name, commander line with WUBRG mana chips, an eight-bar mana curve with derived AVG MV and spell count, 3-6 highlight rows and the plan one-liner.",
    capabilities: { tier: "core" },
    tags: ["gaming", "2026-10-16", "day-027", "mtg", "commander", "edh", "decklist", "deck-tech", "share-card"],
    outputHints: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Still PNG. Landscape runs curve and highlights side by side; portrait stacks them in the same bands; square reads as landscape. Minimum tested canvas 480x270.",
    },
    propsSchema,
    defaultProps: DEFAULTS,
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.CommanderDeckSpotlightV1;
async function render(props, ctx) {
    const { width: W, height: H } = ctx.target;
    const L = layoutSpotlightCard(props, W, H);
    const pieces = [];
    const constraints = [];
    // Tiles first, then text: placeInsetPieces puts a rect on the first overlay
    // layer it does not collide with, so tiles of one kind share a layer.
    for (const t of [...L.tiles].sort((a, b) => a.layer - b.layer)) {
        const tile = (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(t.color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } }), t.label);
        const source = t.bind === "accent"
            ? (0, template_utils_1.bindProp)(tile, "accent")
            : t.bind === "manaIdentity"
                ? (0, template_utils_1.bindProp)(tile, "manaIdentity")
                : t.bind && typeof t.bind === "object"
                    ? (0, template_utils_1.bindProp)(tile, "curve", t.bind.curve)
                    : tile;
        pieces.push({ rect: { ...t.rect, importance: t.layer }, source });
        if (t.label.startsWith("bar-") && t.bind && typeof t.bind === "object")
            constraints.push({ label: t.label, within: { yFrac: [0.3, 0.86] } });
        if (t.label.startsWith("chip-") && !t.label.startsWith("chip-letter"))
            constraints.push({ label: t.label, aspect: 1, within: { yFrac: [0, 0.3] } });
        if (t.label === "curve-plot")
            constraints.push({ label: "curve-plot" });
        if (t.label.startsWith("hl-row-"))
            constraints.push({ label: t.label, within: { yFrac: [0.3, 0.86] } });
        if (t.label === "bracket-pill-bg" || t.label === "record-pill-bg")
            constraints.push({ label: t.label, within: { xFrac: [0.55, 1], yFrac: [0, 0.14] } });
    }
    for (const c of L.cells) {
        const cell = (0, template_utils_1.tag)((0, text_1.textCell)({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, vAlign: "middle", label: c.label }), c.label);
        // A text rect is BOUND to the prop it shows; derived figures (AVG MV and
        // the spell count) and axis labels are not.
        const source = c.bind === null
            ? cell
            : "curve" in c.bind
                ? (0, template_utils_1.bindProp)(cell, "curve", c.bind.curve)
                : "row" in c.bind
                    ? (0, template_utils_1.bindPropPath)(cell, "highlights", [c.bind.row, c.bind.field], c.bind.field === "qty" ? "number" : "string")
                    : (0, template_utils_1.bindProp)(cell, c.bind.prop);
        pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source });
        constraints.push((0, layout_1.textFitsMeasured)(c.label, c.text, c.px, c.width));
        const inBody = ["curve-label", "curve-figures", "hl-label"].includes(c.label) || /^(bar-count|mv)-/.test(c.label);
        if (inBody)
            constraints.push({ label: c.label, within: { yFrac: [0.3, 0.86] } });
        if (c.label === "kicker" || c.label === "deck-name" || c.label === "commander")
            constraints.push({ label: c.label, within: { yFrac: [0, 0.3] } });
        if (c.label.startsWith("chip-letter"))
            constraints.push({ label: c.label, within: { yFrac: [0, 0.3] } });
        if (c.label === "bracket-pill" || c.label === "record-pill")
            constraints.push({ label: c.label, within: { xFrac: [0.55, 1], yFrac: [0, 0.14] } });
        if (c.label.startsWith("hl-name-") || c.label.startsWith("hl-note-") || c.label.startsWith("hl-qty-"))
            constraints.push({ label: c.label, within: { yFrac: [0.3, 0.86] } });
        if (c.label === "plan")
            constraints.push({ label: c.label, within: { yFrac: [0.88, 1] } });
    }
    // What the geometry promises: the highlight rows are one uniform list.
    const rowLabels = L.rows.map((r) => `hl-row-${r.i}`);
    const relations = rowLabels.length > 1 ? [{ label: rowLabels, equal: "height", tolerancePx: 2 }] : [];
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
