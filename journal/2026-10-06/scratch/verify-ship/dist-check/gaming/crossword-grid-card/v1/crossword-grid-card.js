"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrosswordGridCardV1 = exports.CROSSWORD_DEFAULTS = void 0;
exports.parseCrosswordGrid = parseCrosswordGrid;
exports.numberCrosswordGrid = numberCrosswordGrid;
exports.normalizeCrossword = normalizeCrossword;
exports.layoutCrosswordCard = layoutCrosswordCard;
exports.drawCrosswordCard = drawCrosswordCard;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/gaming/crossword-grid-card/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
const PAGE = "#F2EFE8";
const PAPER = "#FFFFFF";
const INK = "#15171C";
const DIM = "#5E626B";
const MIN_SIDE = 3;
const MAX_SIDE = 25;
const MAX_THEMES = 8;
const MAX_CIRCLES = 120;
const LETTER_EM = 0.6;
const NUMBER_EM = 0.28;
const NUMBER_FLOOR_PX = 6;
/** Roboto: ascent 0.928 em, cap height 0.711 em - where the ink sits under a top-aligned layer. */
const CAP_TOP_EM = 0.928 - 0.711;
const CAP_MID_EM = CAP_TOP_EM + 0.711 / 2;
exports.CROSSWORD_DEFAULTS = {
    grid: "PAN#BOW/AGE#ARE/DOGSLED/##AIL##/CATNAPS/OWE#SAT/YES#TRY",
    themeEntries: "9A 12A",
    circles: "14 15 16 28 29 30",
    title: "Cats and Dogs",
    author: "one-a-day agent",
    publication: "Demo Mini",
    date: "2026-09-29",
    solved: true,
    themeColor: "#FFE08A",
    debugLayout: false,
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    grid: {
        type: "string",
        required: false,
        description: 'The solution grid. Rows split by "/" or newlines; "#" or "." is a block; letters A-Z (uppercase). 3-25 cells each way, rows of equal length. An unbroken string whose length is a square (the .puz solution string, puzpy p.solution) is read as n x n.',
        meta: { control: { multiline: true, placeholder: exports.CROSSWORD_DEFAULTS.grid }, ui: { label: "Grid (solution rows)", order: 1 } },
    },
    themeEntries: {
        type: "string",
        required: false,
        description: 'Clue ids to tint and list, e.g. "17A 38A 3D" (spaces or commas). Each must exist in the grid numbering; at most 8. "" for none.',
        meta: { control: { placeholder: "17A 38A 61A" }, ui: { label: "Theme entries", order: 2 } },
    },
    circles: {
        type: "string",
        required: false,
        description: 'Circled squares as 0-based row-major cell indices (the .puz order), spaces or commas; each must be a white cell. "" for none.',
        meta: { control: { placeholder: "14 15 16" }, ui: { label: "Circled squares", order: 3 } },
    },
    title: {
        type: "string",
        required: false,
        description: "Puzzle title, 1-40 printable ASCII characters. The rect that shows it is bound to it.",
        meta: { control: { placeholder: exports.CROSSWORD_DEFAULTS.title }, ui: { label: "Title", order: 4 } },
    },
    author: {
        type: "string",
        required: false,
        description: 'Constructor(s), 1-48 printable ASCII characters; drawn as "by <author>".',
        meta: { control: { placeholder: exports.CROSSWORD_DEFAULTS.author }, ui: { label: "Author", order: 5 } },
    },
    publication: {
        type: "string",
        required: false,
        description: "Outlet or series for the caption line, 1-24 printable ASCII characters.",
        meta: { control: { placeholder: exports.CROSSWORD_DEFAULTS.publication }, ui: { label: "Publication", order: 6 } },
    },
    date: {
        type: "string",
        required: false,
        description: "Puzzle date as YYYY-MM-DD; the caption shows the weekday and M/D/YY.",
        meta: { control: { placeholder: exports.CROSSWORD_DEFAULTS.date }, ui: { label: "Date", order: 7 } },
    },
    solved: {
        type: "boolean",
        required: false,
        description: "true = the solution card. false = the new-puzzle teaser: blocks, numbers and circles only; letters, theme tint and answers are hidden.",
        meta: { ui: { label: "Show solution", order: 8 } },
    },
    themeColor: {
        type: "string",
        required: false,
        description: "Theme-cell fill and list swatches as #rrggbb. Letters stay in ink.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: exports.CROSSWORD_DEFAULTS.themeColor }, ui: { label: "Theme color", order: 9 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits, the board keeps its shape) and draw it over the card.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
// ---------------------------------------------------------------- the puzzle
function fail(field, rule) {
    throw new Error(`${ID}: ${field} ${rule}`);
}
/** Parse the grid prop. Every refusal names the field, and for a cell its row and column (1-based). */
function parseCrosswordGrid(raw) {
    if (typeof raw !== "string")
        fail("grid", "must be a string of rows.");
    const text = raw.trim();
    let lines = text.split(/\s*[/\r\n]+\s*/).filter((l) => l.length > 0);
    if (lines.length === 1) {
        const n = Math.round(Math.sqrt(lines[0].length));
        if (n * n === lines[0].length && n >= MIN_SIDE)
            lines = Array.from({ length: n }, (_, r) => lines[0].slice(r * n, (r + 1) * n));
    }
    if (lines.length < MIN_SIDE || lines.length > MAX_SIDE)
        fail("grid", `must have ${MIN_SIDE}-${MAX_SIDE} rows (got ${lines.length}); split rows with "/" or newlines.`);
    const cols = lines[0].length;
    if (cols < MIN_SIDE || cols > MAX_SIDE)
        fail("grid", `rows must have ${MIN_SIDE}-${MAX_SIDE} cells (row 1 has ${cols}).`);
    const cells = [];
    lines.forEach((line, r) => {
        if (line.length !== cols)
            fail("grid", `row ${r + 1} has ${line.length} cells but row 1 has ${cols}; every row must be the same length.`);
        for (let c = 0; c < cols; c++) {
            const ch = line[c];
            if (ch === "#" || ch === ".")
                cells.push(null);
            else if (ch >= "A" && ch <= "Z")
                cells.push(ch);
            else if (ch >= "a" && ch <= "z")
                fail("grid", `row ${r + 1} column ${c + 1} is lowercase "${ch}"; letters must be A-Z (the .puz solution is uppercase).`);
            else
                fail("grid", `row ${r + 1} column ${c + 1} is ${JSON.stringify(ch)}; use A-Z for letters and "#" or "." for a block.`);
        }
    });
    if (!cells.some((c) => c !== null))
        fail("grid", "must have at least one white cell.");
    return { rows: lines.length, cols, cells };
}
/**
 * The standard American numbering: a white cell takes the next number when it
 * starts an across entry (left is edge or block, right is white) or a down
 * entry (above is edge or block, below is white). Left to right, top to bottom.
 * Unchecked cells (British style) simply start nothing.
 */
function numberCrosswordGrid(pz) {
    const { rows, cols, cells } = pz;
    const white = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && cells[r * cols + c] !== null;
    const numbers = new Map();
    const entries = new Map();
    let n = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!white(r, c))
                continue;
            const across = !white(r, c - 1) && white(r, c + 1);
            const down = !white(r - 1, c) && white(r + 1, c);
            if (!across && !down)
                continue;
            n++;
            numbers.set(r * cols + c, n);
            const walk = (dir) => {
                const idx = [];
                for (let rr = r, cc = c; white(rr, cc); dir === "A" ? cc++ : rr++)
                    idx.push(rr * cols + cc);
                entries.set(`${n}${dir}`, { id: `${n}${dir}`, number: n, dir, cells: idx, answer: idx.map((i) => cells[i]).join("") });
            };
            if (across)
                walk("A");
            if (down)
                walk("D");
        }
    }
    return { numbers, entries };
}
function tokens(raw, field) {
    if (typeof raw !== "string")
        fail(field, 'must be a string (spaces or commas between items; "" for none).');
    return raw.split(/[\s,]+/).filter((t) => t.length > 0);
}
function ascii(raw, field, max) {
    if (typeof raw !== "string" || /[^\x20-\x7e]/.test(raw))
        fail(field, "must be printable ASCII text.");
    const s = raw.trim().replace(/\s+/g, " ");
    if (s.length < 1 || s.length > max)
        fail(field, `must have 1-${max} characters (got ${s.length}).`);
    return s;
}
/** WCAG contrast ratio of two #rrggbb colours. */
function contrast(a, b) {
    const lum = (hex) => {
        const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Weekday by calendar arithmetic (Sakamoto) - no clock, no Date. */
function weekday(y, m, d) {
    const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    const yy = m < 3 ? y - 1 : y;
    return WEEKDAYS[(yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[m - 1] + d) % 7];
}
/** Every prop validated; a bad value fails with its field named, never falls back to the sample. */
function normalizeCrossword(props) {
    const p = { ...exports.CROSSWORD_DEFAULTS, ...Object.fromEntries(Object.entries(props !== null && props !== void 0 ? props : {}).filter(([, v]) => v !== undefined)) };
    const pz = parseCrosswordGrid(p.grid);
    const { numbers, entries } = numberCrosswordGrid(pz);
    const themeIds = tokens(p.themeEntries, "themeEntries");
    if (themeIds.length > MAX_THEMES)
        fail("themeEntries", `may list at most ${MAX_THEMES} entries (got ${themeIds.length}).`);
    const themes = [];
    for (const id of themeIds) {
        if (!/^[1-9]\d{0,2}[AD]$/.test(id))
            fail("themeEntries", `"${id}" must be a clue id like 17A or 3D.`);
        if (themes.some((t) => t.id === id))
            fail("themeEntries", `lists ${id} twice.`);
        const e = entries.get(id);
        if (!e)
            fail("themeEntries", `${id} is not an entry in this grid's numbering.`);
        themes.push(e);
    }
    const circleIds = tokens(p.circles, "circles");
    if (circleIds.length > MAX_CIRCLES)
        fail("circles", `may ring at most ${MAX_CIRCLES} squares (got ${circleIds.length}).`);
    const circles = [];
    for (const t of circleIds) {
        if (!/^\d+$/.test(t))
            fail("circles", `"${t}" must be a 0-based cell index.`);
        const i = Number(t);
        if (i >= pz.rows * pz.cols)
            fail("circles", `${i} is outside the ${pz.cols}x${pz.rows} grid (0-${pz.rows * pz.cols - 1}).`);
        if (pz.cells[i] === null)
            fail("circles", `${i} (row ${Math.floor(i / pz.cols) + 1} column ${(i % pz.cols) + 1}) is a block; only white squares are circled.`);
        if (circles.includes(i))
            fail("circles", `lists ${i} twice.`);
        circles.push(i);
    }
    const title = ascii(p.title, "title", 40);
    const author = ascii(p.author, "author", 48);
    const publication = ascii(p.publication, "publication", 24);
    if (typeof p.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.date))
        fail("date", "must be YYYY-MM-DD.");
    const [y, m, d] = p.date.split("-").map(Number);
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (y < 1 || m < 1 || m > 12 || d < 1 || d > days[m - 1])
        fail("date", `${p.date} is not a calendar date.`);
    if (typeof p.solved !== "boolean")
        fail("solved", "must be true or false.");
    if (typeof p.themeColor !== "string" || !HEX.test(p.themeColor))
        fail("themeColor", `${JSON.stringify(p.themeColor)} must be #rrggbb.`);
    const inkOnTheme = contrast(INK, p.themeColor);
    if (inkOnTheme < 4.5)
        fail("themeColor", `${p.themeColor} is too dark for the ink letters over it (${inkOnTheme.toFixed(1)}:1, needs 4.5:1); pick a lighter highlighter colour.`);
    if (typeof p.debugLayout !== "boolean")
        fail("debugLayout", "must be true or false.");
    // Where each theme id sits in the RAW prop string, so its list cell can bind that token.
    const themeSpans = [...p.themeEntries.matchAll(/[^\s,]+/g)].map((t) => { var _a, _b; return ({ start: (_a = t.index) !== null && _a !== void 0 ? _a : 0, end: ((_b = t.index) !== null && _b !== void 0 ? _b : 0) + t[0].length }); });
    const metaDate = `${weekday(y, m, d)} ${m}/${d}/${String(y % 100).padStart(2, "0")}`;
    const metaTail = `${pz.cols}x${pz.rows} | ${p.solved ? "solution" : "puzzle"}`;
    const metaRest = `${metaDate} | ${metaTail}`;
    return { ...p, pz, numbers, entries, themes, themeSpans, circles, title, author, publication, meta: `${publication} | ${metaRest}`, metaRest, metaDate, metaTail, themeColor: p.themeColor };
}
const rect = (x, y, w, h) => {
    const x0 = Math.round(x), y0 = Math.round(y);
    return { x: x0, y: y0, w: Math.max(1, Math.round(x + w) - x0), h: Math.max(1, Math.round(y + h) - y0) };
};
/** Height a fitted block needs: Roboto's em box is 1.17 em (ascent + descent), each extra line 1.25 em, plus 2px. */
const blockH = (px, lines) => Math.ceil(px * (1.17 + 1.25 * (lines - 1))) + 2;
/** Lossless line breaks: split at spaces, cut an over-long token, never drop a glyph. */
function wrap(text, px, maxW, bold) {
    const lines = [];
    let rest = text;
    while ((0, text_1.widthOf)(rest, px, bold) > maxW) {
        let n = 1;
        while (n < rest.length && (0, text_1.widthOf)(rest.slice(0, n + 1), px, bold) <= maxW)
            n++;
        const space = rest.lastIndexOf(" ", n);
        if (space > 0) {
            lines.push(rest.slice(0, space));
            rest = rest.slice(space + 1);
        }
        else {
            lines.push(rest.slice(0, n));
            rest = rest.slice(n);
        }
    }
    lines.push(rest);
    return lines;
}
/**
 * The largest size (maxPx down to floorPx, then on down to 6 so the contract
 * flags it rather than the render dying) at which `text` fits `w` x `maxH` in
 * one of `lineOptions` line counts, tried in order.
 */
function fit(text, w, maxH, maxPx, floorPx, lineOptions, bold) {
    const tryAt = (px, maxLines) => {
        const lines = wrap(text, px, (0, text_1.budget)(w), bold);
        if (lines.length > maxLines || blockH(px, lines.length) > maxH)
            return null;
        return { lines, px, width: Math.max(...lines.map((l) => (0, text_1.widthOf)(l, px, bold))) };
    };
    for (const maxLines of lineOptions) {
        for (let px = Math.max(floorPx, Math.floor(maxPx)); px >= floorPx; px--) {
            const hit = tryAt(px, maxLines);
            if (hit)
                return hit;
        }
    }
    const most = Math.max(...lineOptions);
    for (let px = floorPx - 1; px >= 6; px--) {
        const hit = tryAt(px, most);
        if (hit)
            return hit;
    }
    const lines = wrap(text, 6, (0, text_1.budget)(w), bold);
    return { lines, px: 6, width: Math.max(...lines.map((l) => (0, text_1.widthOf)(l, 6, bold))) };
}
const leadBoxW = (w) => Math.ceil((w + 3) / 0.94) + 1;
/**
 * The largest size at which `lead` + `tail` fit `w` x `maxH`, trying the
 * `modes` in order at each size range: "line" (one line), "wrap" (the tail
 * wraps to two lines beside the lead), "stack" (the tail on the next line).
 */
function pairFit(lead, leadBold, tail, tailStacked, w, maxH, maxPx, floorPx, modes) {
    const at = (px, mode) => {
        const leadW = (0, text_1.widthOf)(lead, px, leadBold);
        if (mode === "stack") {
            const lines = wrap(tailStacked, px, (0, text_1.budget)(w), false);
            return leadW <= (0, text_1.budget)(w) && lines.length === 1 && 2 * blockH(px, 1) <= maxH ? { px, stacked: true, tail: lines, leadW, tailX: 0, height: 2 * blockH(px, 1) } : null;
        }
        const tailX = Math.max(leadBoxW(leadW), Math.round(leadW + px * 0.3));
        if (w - tailX < 2 * px)
            return null;
        const lines = wrap(tail, px, (0, text_1.budget)(w - tailX), false);
        return lines.length <= (mode === "line" ? 1 : 2) && blockH(px, lines.length) <= maxH ? { px, stacked: false, tail: lines, leadW, tailX, height: blockH(px, lines.length) } : null;
    };
    for (const [lo, hi] of [[floorPx, Math.max(floorPx, Math.floor(maxPx))], [6, floorPx - 1]]) {
        for (const mode of modes)
            for (let px = hi; px >= lo; px--) {
                const hit = at(px, mode);
                if (hit)
                    return hit;
            }
    }
    const lines = wrap(tailStacked, 6, (0, text_1.budget)(w), false);
    return { px: 6, stacked: true, tail: lines, leadW: (0, text_1.widthOf)(lead, 6, leadBold), tailX: 0, height: blockH(6, 1) + blockH(6, lines.length) };
}
function boardSizing(cols, rows, availW, availH) {
    let pitch = Math.min(availW / cols, availH / rows);
    for (let k = 0; k < 3; k++) {
        const rule = Math.max(1, Math.round(pitch * 0.03));
        const border = Math.max(2, 2 * rule, Math.round(pitch * 0.06));
        pitch = Math.min((availW - 2 * border + rule) / cols, (availH - 2 * border + rule) / rows);
    }
    const rule = Math.max(1, Math.round(pitch * 0.03));
    const border = Math.max(2, 2 * rule, Math.round(pitch * 0.06));
    return { pitch, rule, border, inkW: cols * pitch - rule + 2 * border, inkH: rows * pitch - rule + 2 * border };
}
function boardAt(cols, rows, s, inkX, inkY) {
    const { pitch, rule, border } = s;
    const lead = border - Math.ceil(rule / 2);
    const x0 = Math.round(inkX) + lead, y0 = Math.round(inkY) + lead;
    const X = Array.from({ length: cols + 1 }, (_, k) => Math.round(x0 + k * pitch));
    const Y = Array.from({ length: rows + 1 }, (_, k) => Math.round(y0 + k * pitch));
    const ink = { x: X[0] - lead, y: Y[0] - lead, w: X[cols] - X[0] - rule + 2 * border, h: Y[rows] - Y[0] - rule + 2 * border };
    const hole = (i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const x = X[c] + Math.ceil(rule / 2), y = Y[r] + Math.ceil(rule / 2);
        return { x, y, w: X[c + 1] - Math.floor(rule / 2) - x, h: Y[r + 1] - Math.floor(rule / 2) - y };
    };
    const letterPx = Math.max(6, Math.round(pitch * LETTER_EM));
    const n = Math.round(pitch * NUMBER_EM);
    return { pitch, rule, border, X, Y, ink, hole, letterPx, numberPx: n >= NUMBER_FLOOR_PX ? n : 0 };
}
/**
 * The card's geometry from ctx.target alone. Margin ~3.6% of the short side;
 * the board-to-panel gutter is twice that. Landscape: board left, full height,
 * copy in a column. Portrait: header over a full-width board, list and caption
 * under it. Between: board on top, caption strip under it.
 */
function layoutCrosswordCard(p, W, H) {
    const { rows, cols } = p.pz;
    const S = Math.min(W, H), a = W / H;
    const margin = Math.round(S * 0.036), gutter = 2 * margin;
    const mode = a >= 1.25 ? "landscape" : a <= 0.8 ? "portrait" : "square";
    const floorPx = Math.max(8, Math.round(S * 0.013));
    const titleFloor = Math.max(9, Math.round(S * 0.022));
    const texts = [];
    const themeLines = [];
    const showThemes = p.solved && p.themes.length > 0;
    const place = (label, text, x, y, w, maxH, maxPx, floor, lineOptions, opts = {}) => {
        const bold = opts.bold === true;
        const f = fit(text, w, maxH, maxPx, floor, lineOptions, bold);
        const box = { label, rect: rect(x, y, w, blockH(f.px, f.lines.length)), text: f.lines.join("\n"), px: f.px, width: f.width, bold, color: INK, hAlign: "left", vAlign: "middle", ...opts };
        texts.push(box);
        return box;
    };
    /** Place a fitted pair at (x, y): lead and tail top-aligned, each its own cell (the bare prop value is bound). */
    const pair = (P, x, y, w, lead, tail) => {
        texts.push({ label: lead.label, rect: rect(x, y, leadBoxW(P.leadW), blockH(P.px, 1)), text: lead.text, px: P.px, width: P.leadW, bold: lead.bold, color: lead.color, hAlign: "left", vAlign: "top", ...(lead.bind ? { bind: lead.bind } : {}) });
        const tx = x + P.tailX, ty = P.stacked ? y + blockH(P.px, 1) : y;
        texts.push({ label: tail.label, rect: rect(tx, ty, x + w - tx, blockH(P.px, P.tail.length)), text: P.tail.join("\n"), px: P.px, width: Math.max(...P.tail.map((l) => (0, text_1.widthOf)(l, P.px))), bold: false, color: tail.color, hAlign: "left", vAlign: "top", ...(tail.bind ? { bind: tail.bind } : {}) });
    };
    const byline = (P, x, y, w) => pair(P, x, y, w, { label: "byline-by", text: "by", color: DIM, bold: false }, { label: "byline", color: INK, bind: "author" });
    const bylineFit = (w, maxH, maxPx) => pairFit("by", false, p.author, p.author, w, maxH, maxPx, floorPx, ["line", "wrap"]);
    /**
     * The caption line as three cells - publication, date, the rest - so the two
     * that show a prop are each its own handle. One line, or the date and the
     * rest on a second line under the publication; the largest size that fits.
     */
    const metaFit = (w, maxH, maxPx) => {
        const at = (px, stacked, force) => {
            const lh = blockH(px, 1);
            const date = stacked ? p.metaDate : `| ${p.metaDate}`, tail = `| ${p.metaTail}`;
            const pubW = (0, text_1.widthOf)(p.publication, px, true), dateW = (0, text_1.widthOf)(date, px), tailW = (0, text_1.widthOf)(tail, px);
            // Fit on the solved card's tail so the teaser's shorter "puzzle" lands at the same size and place.
            const fitW = Math.max(tailW, (0, text_1.widthOf)(`| ${p.pz.cols}x${p.pz.rows} | solution`, px));
            // The next cell starts one space after this one's ink, as the brief's single-spaced line reads;
            // the boxes overlap by the fit's slack, which is transparent.
            const step = (segW) => Math.round(segW + (0, text_1.widthOf)(" ", px));
            const x1 = stacked ? 0 : step(pubW), dy = stacked ? lh : 0, x2 = x1 + step(dateW);
            const height = stacked ? 2 * lh : lh;
            if (!force && (pubW > (0, text_1.budget)(w) || w - x2 < 2 * px || fitW > (0, text_1.budget)(w - x2) || height > maxH))
                return null;
            return {
                px,
                height,
                cells: [
                    { text: p.publication, bold: true, dx: 0, dy: 0, w: leadBoxW(pubW), width: pubW },
                    { text: date, bold: false, dx: x1, dy, w: leadBoxW(dateW), width: dateW },
                    { text: tail, bold: false, dx: x2, dy, w: Math.max(1, w - x2), width: tailW },
                ],
            };
        };
        for (const [lo, hi] of [[floorPx, Math.max(floorPx, Math.floor(maxPx))], [6, floorPx - 1]]) {
            for (const stacked of [false, true])
                for (let px = hi; px >= lo; px--) {
                    const hit = at(px, stacked, false);
                    if (hit)
                        return hit;
                }
        }
        return at(6, true, true);
    };
    const meta = (M, x, y) => {
        const cell = (c, label, color, bind) => texts.push({ label, rect: rect(x + c.dx, y + c.dy, c.w, blockH(M.px, 1)), text: c.text, px: M.px, width: c.width, bold: c.bold, color, hAlign: "left", vAlign: "top", ...(bind ? { bind } : {}) });
        cell(M.cells[0], "meta-publication", INK, "publication");
        cell(M.cells[1], "meta-date", DIM, "date");
        cell(M.cells[2], "meta", DIM);
    };
    /** The theme list as one block: heading + lines, `perCol` lines per sub-column. Returns its height. */
    const themeBlock = (x, y, w, h, maxPx, subCols, dryRun) => {
        if (!showThemes)
            return 0;
        const n = p.themes.length, perCol = Math.ceil(n / subCols);
        const colGap = Math.round(S * 0.03);
        const colW = (w - (subCols - 1) * colGap) / subCols;
        const idText = (t) => t.id;
        // One size for every line: the largest that fits every line's width and the block's height.
        let px = Math.floor(maxPx);
        const lineW = (q) => Math.max(...p.themes.map((t) => Math.round(q * 0.75) + Math.round(q * 0.5) + Math.max(...p.themes.map((u) => (0, text_1.widthOf)(idText(u), q))) + Math.round(q * 0.6) + (0, text_1.widthOf)(t.answer, q, true)));
        const pitchOf = (q) => Math.max(blockH(q, 1), Math.round(q * 1.55));
        const headPx = (q) => Math.max(floorPx, Math.round(q * 0.72));
        while (px > 6 && (lineW(px) > (0, text_1.budget)(colW) || blockH(headPx(px), 1) + Math.round(px * 0.35) + perCol * pitchOf(px) > h))
            px--;
        const hp = headPx(px), pitch = pitchOf(px);
        const total = blockH(hp, 1) + Math.round(px * 0.35) + perCol * pitch;
        // Too small a canvas for the list even at 6 px: drop it (the tint still marks the entries) rather than overflow.
        if (total > h)
            return 0;
        if (dryRun)
            return total;
        place("theme-heading", "THEME ANSWERS", x, y, w, blockH(hp, 1), hp, Math.min(hp, floorPx), [1], { bold: true, color: DIM });
        const idW = Math.max(...p.themes.map((u) => (0, text_1.widthOf)(idText(u), px)));
        p.themes.forEach((t, i) => {
            const col = Math.floor(i / perCol), row = i % perCol;
            const cx = x + col * (colW + colGap);
            const ry = y + blockH(hp, 1) + Math.round(px * 0.35) + row * pitch;
            const sw = Math.round(px * 0.75);
            const swatch = rect(cx, ry + (pitch - sw) / 2, sw, sw);
            const idX = cx + sw + Math.round(px * 0.5);
            const idBox = { label: `theme-id-${i}`, rect: rect(idX, ry, Math.ceil((idW + 3) / 0.94) + 1, pitch), text: t.id, px, width: (0, text_1.widthOf)(t.id, px), bold: false, color: DIM, hAlign: "left", vAlign: "middle", bind: "themeEntries", token: p.themeSpans[i] };
            const ansX = idX + idW + Math.round(px * 0.6);
            const ansBox = { label: `theme-${i}`, rect: rect(ansX, ry, cx + colW - ansX, pitch), text: t.answer, px, width: (0, text_1.widthOf)(t.answer, px, true), bold: true, color: INK, hAlign: "left", vAlign: "middle" };
            texts.push(idBox, ansBox);
            themeLines.push({ swatch, id: idBox, answer: ansBox });
        });
        return total;
    };
    let board;
    let panel;
    if (mode === "landscape") {
        const s = boardSizing(cols, rows, Math.min(H - 2 * margin, (W - 2 * margin - gutter) * 0.6), H - 2 * margin);
        board = boardAt(cols, rows, s, margin, (H - s.inkH) / 2);
        const px0 = board.ink.x + board.ink.w + gutter;
        const top = Math.min(board.ink.y, margin + (H - 2 * margin) * 0.04), bottom = H - top;
        panel = rect(px0, top, W - margin - px0, bottom - top);
        const w = panel.w, x = panel.x;
        const tf = fit(p.title, w, panel.h * 0.3, S * 0.075, titleFloor, [2], true);
        const bP = bylineFit(w, panel.h * 0.12, S * 0.036);
        const mP = metaFit(w, panel.h * 0.1, S * 0.028);
        const metaH = mP.height;
        // No theme list (the PROP is empty, not merely hidden): the title block centres in the space above the caption line.
        const groupH = blockH(tf.px, tf.lines.length) + Math.round(S * 0.008) + bP.height;
        const ty = p.themes.length > 0 ? panel.y : panel.y + Math.max(0, (panel.h - metaH - gutter / 2 - groupH) / 2);
        const t = place("title", p.title, x, ty, w, panel.h * 0.3, S * 0.075, titleFloor, [2], { bold: true, vAlign: "top", bind: "title" });
        const by = t.rect.y + t.rect.h + Math.round(S * 0.008);
        byline(bP, x, by, w);
        meta(mP, x, panel.y + panel.h - metaH);
        // The list sits centred in the space between the title block and the caption line.
        const free0 = by + bP.height + gutter / 2, free1 = panel.y + panel.h - metaH - gutter / 2;
        const listH = themeBlock(x, free0, w, free1 - free0, S * 0.038, 1, true);
        themeBlock(x, free0 + Math.max(0, (free1 - free0 - listH) / 2), w, free1 - free0, S * 0.038, 1, false);
    }
    else if (mode === "portrait") {
        const s = boardSizing(cols, rows, W - 2 * margin, (H - 2 * margin - 2 * gutter) * 0.6);
        const rest = H - 2 * margin - 2 * gutter - s.inkH;
        const headH = Math.round(rest * (p.themes.length > 0 ? 0.36 : 0.5));
        board = boardAt(cols, rows, s, (W - s.inkW) / 2, margin + headH + gutter);
        panel = rect(margin, margin, W - 2 * margin, H - 2 * margin);
        const x = margin, w = W - 2 * margin;
        // Header: title + byline, centred in the band above the board.
        const tf = fit(p.title, w, headH * 0.66, S * 0.085, titleFloor, [2], true);
        const bP = bylineFit(w, headH * 0.3, S * 0.04);
        const gap = Math.round(S * 0.012);
        const headUsed = blockH(tf.px, tf.lines.length) + gap + bP.height;
        const hy = margin + Math.max(0, (headH - headUsed) / 2);
        const t = place("title", p.title, x, hy, w, headH * 0.66, S * 0.085, titleFloor, [2], { bold: true, bind: "title" });
        byline(bP, x, t.rect.y + t.rect.h + gap, w);
        // Footer: the list centred in the band under the board, the caption line at the bottom.
        const footY = board.ink.y + board.ink.h + gutter, footB = H - margin;
        const mP = metaFit(w, (footB - footY) * 0.2, S * 0.032);
        const metaH = mP.height;
        meta(mP, x, p.themes.length > 0 ? footB - metaH : footY + Math.max(0, (footB - footY - metaH) / 2));
        const free1 = footB - metaH - gutter / 2;
        const listH = themeBlock(x, footY, w, free1 - footY, S * 0.042, 1, true);
        themeBlock(x, footY + Math.max(0, (free1 - footY - listH) / 2), w, free1 - footY, S * 0.042, 1, false);
    }
    else {
        // The column split follows the PROP, not solved: the teaser keeps the solved card's geometry ("nothing else moves").
        const leftW = (W - 2 * margin) * (p.themes.length > 0 ? 0.54 : 1);
        // A title too long for one line at S/20 wraps to two, and the board gives up that second line's height.
        const tp = Math.ceil(S / 20);
        const twoLines = wrap(p.title, tp, (0, text_1.budget)(leftW), true).length > 1;
        const s = boardSizing(cols, rows, W - 2 * margin, H * 0.72 - (twoLines ? blockH(tp, 2) - blockH(tp, 1) : 0));
        board = boardAt(cols, rows, s, (W - s.inkW) / 2, margin);
        const y0 = board.ink.y + board.ink.h + gutter;
        panel = rect(margin, y0, W - 2 * margin, H - margin - y0);
        const x = panel.x;
        const mP = metaFit(leftW, panel.h * 0.3, S * 0.022);
        const metaH = mP.height;
        const bP = bylineFit(leftW, panel.h * 0.3, S * 0.028);
        const bylineH = bP.height;
        const gap = Math.round(S * 0.006);
        const titleMax = panel.h - metaH - bylineH - 2 * gap;
        const t = place("title", p.title, x, panel.y, leftW, titleMax, S * 0.058, titleFloor, [2], { bold: true, vAlign: "top", bind: "title" });
        byline(bP, x, t.rect.y + t.rect.h + gap, leftW);
        meta(mP, x, panel.y + panel.h - metaH);
        if (showThemes) {
            const rx = panel.x + panel.w * 0.58, rw = panel.x + panel.w - rx;
            themeBlock(rx, panel.y, rw, panel.h, S * 0.03, p.themes.length > 4 ? 2 : 1, false);
        }
    }
    return { mode, margin, gutter, board, panel, texts, themeLines };
}
// ---------------------------------------------------------------- drawing
const num = (v) => String(Math.round(v * 100) / 100);
/** One svg text source holding many glyphs, each placed by a pixel offset inside its rect. */
function glyphRow(label, glyphs, px, bold) {
    return {
        type: "text",
        rasterizer: "svg",
        renderMode: { kind: "image" },
        layers: glyphs.map((g) => ({
            content: { kind: "literal", text: g.text },
            style: { fontSize: px, fontColor: INK, ...(bold ? { fontWeight: "bold" } : {}) },
            placement: { hAlign: "left", vAlign: "top", xExpr: num(g.x), yExpr: num(g.y) },
        })),
        editor: { owner: "template", label },
    };
}
const masked = (color, r, path, label) => (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(color, { mask: { kind: "inline-mask", localPath: path, bounds: { x: 0, y: 0, width: r.w, height: r.h } } }), label);
/** Circle subpath; `cw` picks the winding so a pair makes an annulus under nonzero and evenodd alike. */
const circle = (cx, cy, r, cw) => `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 ${cw ? 1 : 0} ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 ${cw ? 1 : 0} ${num(-2 * r)} 0z`;
function drawCrosswordCard(p, W, H) {
    const L = layoutCrosswordCard(p, W, H);
    const { pz } = p;
    const B = L.board;
    const pieces = [];
    const add = (r, importance, source) => pieces.push({ rect: { ...r, importance }, source });
    const ink = B.ink;
    const local = (r) => ({ x: r.x - ink.x, y: r.y - ink.y, w: r.w, h: r.h });
    // 1. paper under the whole board.
    add(ink, 1, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(PAPER), "board-paper"));
    // 2. theme tint: the lattice cells of every theme entry (a crossing cell once).
    const themeCells = [...new Set(p.solved ? p.themes.flatMap((t) => t.cells) : [])].sort((a, b) => a - b);
    if (themeCells.length > 0) {
        const path = themeCells.map((i) => {
            const r = Math.floor(i / pz.cols), c = i % pz.cols;
            const q = local({ x: B.X[c], y: B.Y[r], w: B.X[c + 1] - B.X[c], h: B.Y[r + 1] - B.Y[r] });
            return `M${q.x} ${q.y}h${q.w}v${q.h}h${-q.w}z`;
        }).join("");
        add(ink, 2, masked(p.themeColor, ink, path, "theme-tint"));
    }
    // 3. ink: the board minus every paper cell = the border, the rules and the blocks in one path.
    const holes = pz.cells.map((ch, i) => (ch === null ? "" : (() => { const q = local(B.hole(i)); return `M${q.x} ${q.y}v${q.h}h${q.w}v${-q.h}z`; })())).join("");
    // The board is the puzzle's handle: a double-click opens the grid first, then what marks it.
    const marks = p.solved ? [{ propKey: "grid" }, { propKey: "themeEntries" }, { propKey: "circles" }, { propKey: "themeColor" }] : [{ propKey: "grid" }, { propKey: "circles" }];
    add(ink, 3, (0, template_utils_1.bindProps)(masked(INK, ink, `M0 0H${ink.w}V${ink.h}H0Z${holes}`, "board"), marks));
    // 4. rings, over the tint and under the letter.
    if (p.circles.length > 0) {
        const path = p.circles.map((i) => {
            const q = local(B.hole(i));
            const ro = Math.min(q.w, q.h) / 2 - Math.max(0.5, B.pitch * 0.02);
            const t = Math.max(1, B.pitch * 0.035);
            return circle(q.x + q.w / 2, q.y + q.h / 2, ro, true) + circle(q.x + q.w / 2, q.y + q.h / 2, ro - t, false);
        }).join("");
        add(ink, 4, masked(INK, ink, path, "rings"));
        // A knockout in the cell's own fill behind a clue number that sits on a ring, as solving apps do.
        if (B.numberPx > 0) {
            const tinted = new Set(themeCells);
            const knock = { paper: [], theme: [] };
            for (const i of p.circles) {
                const n = p.numbers.get(i);
                if (n === undefined)
                    continue;
                const q = local(B.hole(i));
                const w = Math.ceil(Math.max(1, q.w * 0.07) + (0, text_1.widthOf)(String(n), B.numberPx) + q.w * 0.03);
                const h = Math.ceil(q.h * 0.06 + 0.711 * B.numberPx + q.h * 0.04);
                knock[tinted.has(i) ? "theme" : "paper"].push(`M${q.x} ${q.y}h${w}v${h}h${-w}z`);
            }
            if (knock.paper.length > 0)
                add(ink, 5, masked(PAPER, ink, knock.paper.join(""), "number-knockout"));
            if (knock.theme.length > 0)
                add(ink, 6, masked(p.themeColor, ink, knock.theme.join(""), "number-knockout"));
        }
    }
    // 7-8. numbers and letters: ONE source each over the lattice, every glyph placed on it. A source
    // per row would stack 2 x rows overlays at the root, and past ~25 the engine drops inline masks.
    const band = { x: B.X[0], y: B.Y[0], w: B.X[pz.cols] - B.X[0], h: B.Y[pz.rows] - B.Y[0] };
    const nums = [];
    const lets = [];
    pz.cells.forEach((ch, i) => {
        if (ch === null)
            return;
        const h = B.hole(i);
        const n = p.numbers.get(i);
        if (n !== undefined && B.numberPx > 0) {
            nums.push({ text: String(n), x: h.x - band.x + Math.max(1, h.w * 0.07), y: Math.max(0, h.y - band.y + h.h * 0.06 - CAP_TOP_EM * B.numberPx) });
        }
        if (p.solved) {
            lets.push({ text: ch, x: h.x - band.x + (h.w - (0, text_1.widthOf)(ch, B.letterPx, true)) / 2, y: Math.max(0, h.y - band.y + h.h * 0.57 - CAP_MID_EM * B.letterPx) });
        }
    });
    if (nums.length > 0)
        add(band, 7, glyphRow("cell-number", nums, B.numberPx, false));
    if (lets.length > 0)
        add(band, 8, glyphRow("cell-letter", lets, B.letterPx, true));
    // The caption copy and the list swatches.
    for (const t of L.texts) {
        const src = (0, template_utils_1.tag)((0, text_1.textCell)({ text: t.text, fontSize: t.px, color: t.color, hAlign: t.hAlign, vAlign: t.vAlign, bold: t.bold, label: t.label }), t.label);
        const raw = t.bind === "themeEntries" ? String(p.themeEntries) : "";
        add(t.rect, 1, !t.bind ? src : t.token ? (0, template_utils_1.bindPropRange)(src, t.bind, undefined, { start: 0, end: raw.length }, t.token) : (0, template_utils_1.bindProp)(src, t.bind));
    }
    for (const line of L.themeLines)
        add(line.swatch, 1, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(p.themeColor), "theme-swatch"), "themeColor"));
    // The contract: every text fits (measured), the board keeps its shape and size.
    const constraints = L.texts.map((t) => (0, layout_1.textFitsMeasured)(t.label, t.text, t.px, t.width));
    if (p.solved)
        constraints.push((0, layout_1.textFitsMeasured)("cell-letter", "W", B.letterPx, (0, text_1.widthOf)("W", B.letterPx, true)));
    if (B.numberPx > 0 && p.numbers.size > 0) {
        const widest = String(Math.max(...p.numbers.values()));
        constraints.push((0, layout_1.textFitsMeasured)("cell-number", widest, B.numberPx, (0, text_1.widthOf)(widest, B.numberPx)));
    }
    // The designed shape: the lattice plus its border (a 25x3 is not 25/3 once the border is on), within 2%.
    const shape = (pz.cols * B.pitch - B.rule + 2 * B.border) / (pz.rows * B.pitch - B.rule + 2 * B.border);
    constraints.push({ label: "board", aspect: shape, aspectTolerance: 0.02 * Math.max(shape, 1 / shape), ...(pz.cols === pz.rows ? { minWidthFrac: 0.45, minHeightFrac: 0.45 } : {}) });
    if (L.themeLines.length > 0)
        constraints.push({ label: "theme-swatch", aspect: 1, aspectTolerance: 0.2 });
    const relations = [];
    // The cells are not rects (they are holes in one mask), so equal cells are the test's to assert, from the lattice lines.
    if (L.themeLines.length >= 2)
        relations.push({ label: "theme-swatch", equal: "size", tolerance: 0.02, tolerancePx: 1 });
    return { pieces, layout: L, constraints, relations };
}
// ---------------------------------------------------------------- the story
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY = {
    "day": 10,
    "date": "2026-09-29",
    "agent": "claude",
    "model": "claude-opus-5-5",
    "id": "@one-a-day/gaming/crossword-grid-card/v1",
    "title": "Crossword Grid Card",
    "who": "Crossword bloggers who post the solved grid atop every write-up (Crossword Fiend, NYT to Universal) and indie constructors posting a weekly .puz",
    "problem": [
        "Every Crossword Fiend write-up opens with a picture of the solved grid, and each one is a screenshot or phone photo of whatever app the reviewer solved in: Screenshot-2026-09-22-213516.png, IMG_2411.jpeg, grid.png, wpsol092726.png. Size, style and app chrome change from grid to grid.",
        "The caption under it is typed by hand (\"WSJ * 9/22/26 * Tues * \"Variety Pack\" * Zhoukin Burnikel * solution * 20260922\"), and because the picture cannot mark the theme, every post retypes a separate \"THEME ANSWERS:\" list. The .puz on the same site holds the grid, title, author and circles, but not the theme.",
    ],
    "sources": [
        "https://crosswordfiend.com/2026/09/21/tuesday-september-22-2026/",
        "https://crosswordfiend.com/2026/09/24/friday-september-25-2026/",
        "https://crosswordfiend.com/2026/09/26/sunday-september-27-2026/",
        "https://crosswordfiend.com/download/",
        "https://crosshare.org/crosswords/pJMezWuZ6oRSxfHehRTw/wanting-for-winter",
        "https://github.com/alexdej/puzpy",
        "https://github.com/viresh-ratnakar/exet"
    ],
    "solution": [
        "Paste the solution rows from the puzzle file (for a square grid, puzpy's p.solution pastes as is). The card derives the clue numbers, reads each theme answer from the grid, tints it and lists it, and writes the caption line, so every grid on a blog matches. solved=false hides the letters for a new-puzzle teaser.",
        "The decision that matters: the board is a few layers (paper, theme tint, ink with the paper cells cut out, rings, number knockouts) plus two text sources, one holding every letter and one every number, on one integer lattice. A 25x25 needs no more layers than a 7x7 (8 at most, text included).",
    ],
    "usage": {
        "command": "m0saic make @one-a-day/gaming/crossword-grid-card/v1 --template-repo . -w 1080 -h 1080 -o grid.png",
        "try": [
            "grid: rows split by \"/\" (\"#\" or \".\" is a block); a square grid's unbroken .puz string also works",
            "themeEntries: \"17A 38A 61A\" - the ids your write-up already lists",
            "circles: \"14 15 16\" - 0-based cell indices, the .puz order",
            "--props '{\"solved\":false}' - the new-puzzle teaser: no letters, tint or answers"
        ]
    },
    "caveats": [
        "No .puz parser: paste the solution rows. A rebus square shows its first letter (what the .puz solution string holds), and shaded squares are not drawn.",
        "Grids 3 to 25 cells each way; paste a non-square grid as rows split by \"/\". Clue numbers are dropped below 6 px, so a 15x15 at 480x270 shows letters only.",
        "A still card: no clue text and no fill-in animation yet."
    ],
    "timeline": {
        "source": "runner",
        "phases": [
            {
                "name": "scout",
                "startMs": 0,
                "durMs": 701073,
                "calls": 41,
                "tokens": 8010625,
                "costUsd": 9.8,
                "tools": "Bash 25, WebSearch 6, WebFetch 3"
            },
            {
                "name": "plan",
                "startMs": 701118,
                "durMs": 525743,
                "calls": 24,
                "tokens": 4086662,
                "costUsd": 6.46,
                "tools": "Bash 19, Read 1, TaskStop 1"
            },
            {
                "name": "build",
                "startMs": 1226895,
                "durMs": 1521702,
                "calls": 80,
                "tokens": 22637564,
                "costUsd": 6.44,
                "tools": "Bash 66, Read 10, Write 3",
                "status": "error"
            },
            {
                "name": "build (2)",
                "startMs": 2748619,
                "durMs": 2278,
                "costUsd": 0,
                "status": "error"
            },
            {
                "name": "build (3)",
                "startMs": 2750908,
                "durMs": 2338,
                "costUsd": 0,
                "status": "error"
            },
            {
                "name": "build (4)",
                "startMs": 5832542,
                "durMs": 3118992,
                "calls": 183,
                "tokens": 82471601,
                "costUsd": 31.73,
                "tools": "Bash 122, Read 33, Edit 18",
                "status": "error"
            },
            {
                "name": "critique",
                "startMs": 8951551,
                "durMs": 331765,
                "calls": 39,
                "tokens": 7896056,
                "costUsd": 4.23,
                "tools": "Bash 21, Read 16, Workflow 1"
            }
        ],
        "costBasis": "reported"
    }
};
exports.CrosswordGridCardV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-09-29 · Crossword Grid Card",
    version: 1,
    description: "Crossword Grid Card: the solved grid for a crossword write-up from the puzzle's own fields - blocks, derived clue numbers, circles, theme entries tinted and listed, and the caption line. solved=false makes the teaser.",
    capabilities: { tier: "core" },
    tags: ["gaming", "2026-09-29", "day-010", "crossword", "puzzle", "share-card"],
    outputHints: {
        width: 1080,
        height: 1080,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Static card - square for the top of a write-up; 1920x1080 and 1080x1920 lay out for link shares and stories.",
    },
    propsSchema,
    defaultProps: { ...exports.CROSSWORD_DEFAULTS },
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.CrosswordGridCardV1;
async function render(props, ctx) {
    // The schema is documentation; render() is the gate.
    const p = normalizeCrossword(props);
    const W = Math.max(1, Math.round(ctx.target.width));
    const H = Math.max(1, Math.round(ctx.target.height));
    const { pieces, constraints, relations } = drawCrosswordCard(p, W, H);
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets: {},
        backgroundColor: PAGE,
        sources: placed.sources,
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints, relations, debug: p.debugLayout === true });
}
