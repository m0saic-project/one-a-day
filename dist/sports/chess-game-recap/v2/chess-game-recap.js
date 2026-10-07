"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChessGameRecapV2 = exports.CHESS_RECAP_MAX_MOMENT_SEC = exports.CHESS_RECAP_MIN_MOMENT_SEC = exports.CHESS_RECAP_DEFAULT_PGN = void 0;
exports.chessRecapCopy = chessRecapCopy;
exports.chessRecapBeats = chessRecapBeats;
exports.chessSmoothDown = chessSmoothDown;
exports.chessRecapLayout = chessRecapLayout;
exports.chessGraphSvg = chessGraphSvg;
exports.chessRecapContract = chessRecapContract;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const chess_1 = require("./chess");
const pieces_1 = require("./pieces");
const story_1 = require("./story");
const ID = "@one-a-day/sports/chess-game-recap/v2";
/** Paul Morphy vs Duke Karl / Count Isouard, Paris 1858 - the Opera Game. Public domain, 17 moves. */
exports.CHESS_RECAP_DEFAULT_PGN = `[Event "Paris"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[White "Paul Morphy"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]
[ECO "C41"]
[Opening "Philidor Defense"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7
8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7
14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;
const DEFAULTS = {
    pgn: exports.CHESS_RECAP_DEFAULT_PGN,
    moments: "",
    orientation: "white",
    board: "walnut",
    momentSec: 2.6,
};
exports.CHESS_RECAP_MIN_MOMENT_SEC = 1.5;
exports.CHESS_RECAP_MAX_MOMENT_SEC = 6;
const PAGE = "#16171b";
const INK = "#f2f1ec";
const DIM = "#9b9da5";
const GOLD = "#e9b949";
const RULE = "#2c2e35";
const CHIP_EDGE = "#8b8d94";
const CHIP_LIGHT = "#f8f6f1";
const CHIP_DARK = "#2a2b30";
const propsSchema = (0, template_utils_1.definePropsSchema)({
    pgn: {
        type: "string",
        required: false,
        description: "The game as PGN - Lichess: Share & export > PGN; Chess.com: Share > PGN. Headers (players, ratings, event, date, opening, time control) and every move are read; each move is replayed, and the first one that is not legal stops the render, named. One game per paste.",
        meta: { control: { multiline: true, mono: true, placeholder: '[White "..."]\n[Black "..."]\n\n1. e4 e5 2. Nf3 ...' }, ui: { label: "PGN", order: 1, primary: true } },
    },
    moments: {
        type: "string",
        required: false,
        description: 'The moves to feature, by move number: "10 13 16" are White\'s 10th, 13th and 16th; "12b" or "12..." is Black\'s 12th. Up to 5; the final move is always the last moment. Empty picks them: sacrifices, big captures, checks, annotated moves, eval swings.',
        meta: { control: { placeholder: "automatic" }, ui: { label: "Moments", order: 2 } },
    },
    orientation: {
        type: "string",
        required: false,
        description: 'Which side sits at the bottom of the board: "white" (default) or "black" - share your own games as Black from your side.',
        meta: { constraints: { oneOf: ["white", "black"] }, ui: { label: "Orientation", order: 3 } },
    },
    board: {
        type: "string",
        required: false,
        description: 'Board colours: "walnut" (default), "green" or "slate".',
        meta: { constraints: { oneOf: [...pieces_1.CHESS_BOARD_THEMES] }, ui: { label: "Board", order: 4 } },
    },
    momentSec: {
        type: "number",
        required: false,
        description: `Seconds per moment (${exports.CHESS_RECAP_MIN_MOMENT_SEC}..${exports.CHESS_RECAP_MAX_MOMENT_SEC}, default ${DEFAULTS.momentSec}). The clip is a short cold open on the finished card, then one moment each, then a hold. An explicit duration pin overrides it and becomes the clip.`,
        meta: { constraints: { min: exports.CHESS_RECAP_MIN_MOMENT_SEC, max: exports.CHESS_RECAP_MAX_MOMENT_SEC }, ui: { label: "Seconds per moment", order: 5 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits, the board is square, the graph sits low) and draw it over the frame.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function header(game, key) {
    var _a;
    const v = (0, chess_1.chessAscii)((_a = game.headers[key]) !== null && _a !== void 0 ? _a : "");
    return v === "?" || v === "-" || v === "??" ? "" : v;
}
function pgnDate(raw) {
    var _a;
    const m = /^(\d{4})\.(\d{2}|\?\?)\.(\d{2}|\?\?)$/.exec(raw);
    if (!m)
        return "";
    if (m[2] === "??")
        return m[1];
    const month = (_a = MONTHS[Number(m[2]) - 1]) !== null && _a !== void 0 ? _a : "";
    if (m[3] === "??")
        return `${month} ${m[1]}`;
    return `${Number(m[3])} ${month} ${m[1]}`;
}
function timeControl(raw) {
    var _a;
    if (/^1\/\d+$/.test(raw))
        return "daily";
    const m = /^(\d+)(?:\+(\d+))?$/.exec(raw);
    if (!m)
        return "";
    const base = Number(m[1]);
    const clock = base >= 60 ? String(Math.round((base / 60) * 10) / 10) : `${base}s`;
    return `${clock}+${Number((_a = m[2]) !== null && _a !== void 0 ? _a : 0)}`;
}
function openingName(game) {
    var _a;
    const named = header(game, "Opening");
    if (named)
        return named;
    const url = /\/openings\/([^?#\s]+)/.exec((_a = game.headers.ECOUrl) !== null && _a !== void 0 ? _a : "");
    if (!url)
        return "";
    const words = [];
    for (const w of url[1].split("-")) {
        if (/^\d/.test(w))
            break;
        words.push(w);
    }
    return (0, chess_1.chessAscii)(words.join(" "));
}
function elo(game, side) {
    const e = header(game, `${side}Elo`);
    if (!/^\d{2,4}$/.test(e))
        return "";
    const d = header(game, `${side}RatingDiff`);
    return /^[+-]?\d+$/.test(d) ? `${e} (${d.startsWith("-") || d.startsWith("+") ? d : `+${d}`})` : e;
}
function chessRecapCopy(game) {
    const last = game.moves[game.moves.length - 1];
    const site = header(game, "Site");
    const event = header(game, "Event") || (/^https?:/.test(site) ? "" : site);
    const date = pgnDate(header(game, "Date") || header(game, "UTCDate"));
    const result = game.result;
    let ending;
    if (last.checkmate)
        ending = `checkmate on move ${last.moveNumber}`;
    else if (last.stalemate)
        ending = `stalemate on move ${last.moveNumber}`;
    else {
        const term = header(game, "Termination");
        const winner = result === "1-0" ? "White" : result === "0-1" ? "Black" : "";
        let main;
        if (/time/i.test(term) && winner)
            main = `${winner} wins on time`;
        else if (term && !/^(normal|unterminated|abandoned)$/i.test(term))
            main = term.length <= 40 ? term : `${winner || "game"} ${result === "1/2-1/2" ? "drawn" : "wins"}`;
        else
            main = winner ? `${winner} wins` : result === "1/2-1/2" ? "drawn" : "unfinished";
        ending = `${main}, move ${last.moveNumber}`;
    }
    const tc = timeControl(header(game, "TimeControl"));
    const join = (parts) => parts.filter((p) => p.length > 0).join(", ");
    const eco = /^[A-E]\d\d$/.test(header(game, "ECO")) ? header(game, "ECO") : "";
    const name = openingName(game);
    return {
        event: join([event, date, tc]),
        eventShorter: [join([event, date]), join([date, tc]), date].filter((v, i, all) => v.length > 0 && all.indexOf(v) === i && v !== join([event, date, tc])),
        white: header(game, "White") || "White",
        black: header(game, "Black") || "Black",
        whiteElo: elo(game, "White"),
        blackElo: elo(game, "Black"),
        result: result === "*" ? "*" : result,
        ending,
        opening: eco && name ? `${eco} ${name}` : name || (eco ? `ECO ${eco}` : ""),
    };
}
const r3 = (n) => Math.round(n * 1000) / 1000;
/**
 * Cold open on the finished card, then `count` moments of `momentSec`, the
 * last one held a beat longer - it is the card the clip opened on, so the
 * loop is seamless. A pinned duration re-spaces the moments to fit it.
 */
function chessRecapBeats(count, momentSec, pinnedMs) {
    const intro = 1.4;
    const tail = 1.0;
    const per = pinnedMs !== undefined ? Math.max(1, (pinnedMs / 1000 - intro - tail) / count) : momentSec;
    const total = pinnedMs !== undefined ? pinnedMs / 1000 : intro + count * per + tail;
    const hold = Math.min(0.55, per * 0.22);
    const slideSec = Math.min(0.6, per * 0.24);
    const fade = Math.min(0.3, per * 0.12);
    const slots = [];
    for (let i = 0; i < count; i++) {
        const start = intro + i * per;
        slots.push({ start: r3(start), slide: r3(start + hold), settle: r3(start + hold + slideSec), end: r3(i === count - 1 ? total : start + per) });
    }
    return { intro, fade: r3(fade), slideSec: r3(slideSec), slots, total: r3(total) };
}
/** The largest 5-smooth number at or below `n` - child canvases need a divisor lattice. */
function chessSmoothDown(n) {
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
const LH = 1.22;
/**
 * The board's corner on the root's split lattice (`placeInsetPieces` quantizes
 * cells outward to it). The paint is exact either way - the inset recovers
 * the rect - but a snapped corner keeps the CELL square too, which is what
 * the flattened layout check measures.
 */
function snapCorner(x, y, W, H) {
    const qx = W / (0, template_utils_1.latticeMaxSlots)(W);
    const qy = H / (0, template_utils_1.latticeMaxSlots)(H);
    return { x: Math.round(x / qx) * qx, y: Math.round(y / qy) * qy };
}
/** One line, shrunk until it fits `w` (never wrapped). */
function line(text, rect, maxPx, minPx, bold = false) {
    const w = (0, text_1.budget)(rect.w);
    let px = Math.max(minPx, Math.round(Math.min(maxPx, rect.h / LH)));
    while (px > minPx && (0, text_1.widthOf)(text, px, bold) > w)
        px = Math.max(minPx, Math.floor(px * 0.94));
    return { text, px, width: (0, text_1.widthOf)(text, px, bold), rect, bold };
}
/**
 * The same number of lines, broken as evenly as they go: a greedy wrap fills
 * the first line and leaves a widow ("gives a knight for a / pawn"). Narrow
 * the measure until one more step would add a line.
 */
function balance(text, lines, px, w, bold) {
    if (lines.length < 2)
        return lines;
    let lo = w / lines.length;
    let hi = w;
    let best = lines;
    for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        const next = (0, text_1.wrapFit)(text, px, mid);
        if (next.length === lines.length && Math.max(...next.map((l) => (0, text_1.widthOf)(l, px, bold))) <= w) {
            best = next;
            hi = mid;
        }
        else
            lo = mid;
    }
    return best;
}
/** A block of up to `maxLines`, the largest size whose wrap fits the box. */
function block(text, rect, maxPx, minPx, maxLines, bold = false) {
    const w = (0, text_1.budget)(rect.w);
    let px = Math.max(minPx, Math.round(maxPx));
    for (;;) {
        const lines = (0, text_1.wrapFit)(text, px, w);
        const width = Math.max(...lines.map((l) => (0, text_1.widthOf)(l, px, bold)));
        const fits = lines.length <= maxLines && lines.length * px * LH <= rect.h && width <= w;
        if (fits || px <= minPx) {
            const even = balance(text, lines, px, w, bold);
            return { lines: even, px, width: Math.max(...even.map((l) => (0, text_1.widthOf)(l, px, bold))), rect };
        }
        px = Math.max(minPx, Math.floor(px * 0.94));
    }
}
/** The event line, compacted (time control, then the event's name, dropped) before it would clip. */
function eventLine(copy, rect, maxPx, minPx) {
    if (!copy.event)
        return null;
    const tries = [copy.event, ...copy.eventShorter];
    for (const t of tries) {
        const l = line(t, rect, maxPx, minPx);
        if (l.width <= (0, text_1.budget)(rect.w))
            return l;
    }
    const last = tries[tries.length - 1];
    return last && (0, text_1.widthOf)(last, minPx) <= (0, text_1.budget)(rect.w) ? line(last, rect, maxPx, minPx) : null;
}
/** One size for every caption, so the moments read as one voice. */
function captions(moments, title, words, titlePx, wordsPx, minPx, maxLines) {
    let tp = Math.round(Math.min(titlePx, title.h / LH));
    const tw = (0, text_1.budget)(title.w);
    while (tp > minPx && moments.some((m) => (0, text_1.widthOf)(m.title, tp, true) > tw))
        tp = Math.max(minPx, Math.floor(tp * 0.94));
    let wp = Math.round(Math.min(wordsPx, words.h / LH));
    const fitsAt = (px) => moments.every((m) => {
        const b = block(m.words, words, px, px, maxLines);
        return b.lines.length <= maxLines && b.lines.length * px * LH <= words.h && b.width <= (0, text_1.budget)(words.w);
    });
    while (wp > minPx && !fitsAt(wp))
        wp = Math.max(minPx, Math.floor(wp * 0.94));
    return {
        titles: moments.map((m) => ({ text: m.title, px: tp, width: (0, text_1.widthOf)(m.title, tp, true), rect: title, bold: true })),
        words: moments.map((m) => block(m.words, words, wp, wp, maxLines)),
    };
}
/** A player row: chip, name (one or two lines), rating at the right. */
function playerRow(name, eloText, row, namePx, eloPx, minPx) {
    const chipSide = Math.max(4, Math.round(namePx * 0.62));
    const chip = { x: row.x, y: Math.round(row.y + (row.h - chipSide) / 2), w: chipSide, h: chipSide };
    const gap = Math.round(namePx * 0.42);
    const eloW = eloText ? Math.ceil((0, text_1.widthOf)(eloText, eloPx) / 0.94) + 4 : 0;
    const eloRect = { x: row.x + row.w - eloW, y: row.y, w: eloW, h: row.h };
    const nameRect = { x: chip.x + chipSide + gap, y: row.y, w: Math.max(8, row.w - chipSide - gap - (eloW ? eloW + gap : 0)), h: row.h };
    const nameBlock = block(name, nameRect, namePx, minPx, 2, true);
    const eloLine = eloText ? line(eloText, eloRect, eloPx, minPx) : null;
    return { chip, name: nameBlock, elo: eloLine };
}
/**
 * The whole geometry as a pure function of the copy, the moments and the
 * canvas: landscape (board left, column right), square (players across the
 * top, board and caption, graph across the bottom) or portrait (stacked).
 */
function chessRecapLayout(copy, moments, kind, W, H) {
    const short = Math.min(W, H);
    const minPx = Math.max(6, Math.round(short / 70));
    // The legend is in the label: which side is up is not obvious to a non-player.
    const graphText = `${kind === "eval" ? "EVALUATION" : "MATERIAL"} - WHITE ABOVE THE LINE`;
    const A = W / H;
    if (A >= 1.25) {
        const m = Math.round(short * 0.055);
        const s = chessSmoothDown(H - 2 * m);
        const corner = snapCorner(Math.floor((H - s) / 2), Math.floor((H - s) / 2), W, H);
        const by = Math.min(corner.y, H - s);
        const bx = corner.x;
        const gap = Math.round(s * 0.07);
        const px = bx + s + gap;
        const pw = Math.max(40, W - px - Math.floor((H - s) / 2));
        const k = s / 960;
        let y = by;
        const take = (h) => { const r = { x: px, y: Math.round(y), w: pw, h: Math.max(1, Math.round(h)) }; y += h; return r; };
        const eventRect = take(36 * k);
        y += 16 * k;
        const wRow = take(62 * k);
        const bRow = take(62 * k);
        y += 20 * k;
        const resultRow = take(92 * k);
        const openingRect = take(46 * k);
        y += 34 * k;
        const rule = { ...take(Math.max(1, 2 * k)) };
        y += 34 * k;
        const titleRect = take(112 * k);
        const wordsRect = take(98 * k);
        const graphH = chessSmoothDown(Math.max(150 * k, Math.min(300 * k, by + s - y - 110 * k)));
        const graphW = chessSmoothDown(pw);
        const graph = { x: px, y: by + s - graphH, w: graphW, h: graphH };
        const labelRect = { x: px, y: Math.round(graph.y - 40 * k), w: pw, h: Math.max(1, Math.round(30 * k)) };
        const wp = playerRow(copy.white, copy.whiteElo, wRow, 40 * k, 30 * k, minPx);
        const bp = playerRow(copy.black, copy.blackElo, bRow, 40 * k, 30 * k, minPx);
        const result = line(copy.result, { x: px, y: resultRow.y, w: Math.ceil((0, text_1.widthOf)(copy.result, Math.round(80 * k), true) / 0.94) + 4, h: resultRow.h }, 80 * k, minPx, true);
        const endX = result.rect.x + result.rect.w + Math.round(24 * k);
        const ending = block(copy.ending, { x: endX, y: resultRow.y, w: Math.max(8, px + pw - endX), h: resultRow.h }, 30 * k, minPx, 2);
        const cap = captions(moments, titleRect, wordsRect, 92 * k, 38 * k, minPx, 2);
        return {
            arrangement: "landscape",
            board: { x: bx, y: by, w: s, h: s },
            graph,
            graphLabel: line(graphText, labelRect, 22 * k, minPx, true),
            event: eventLine(copy, eventRect, 26 * k, minPx),
            whiteChip: wp.chip,
            blackChip: bp.chip,
            white: wp.name,
            black: bp.name,
            whiteElo: wp.elo,
            blackElo: bp.elo,
            result,
            ending,
            opening: copy.opening ? block(copy.opening, openingRect, 28 * k, minPx, 1) : null,
            rule,
            titles: cap.titles,
            words: cap.words,
        };
    }
    // Square and portrait share the header: event, then two player rows with
    // the result at their right.
    const portrait = A <= 0.85;
    const m = Math.round(short * 0.05);
    const k = (portrait ? W : short) / 1080;
    const cw = W - 2 * m;
    let y = m;
    const at = (h, x = m, w = cw) => { const r = { x, y: Math.round(y), w, h: Math.max(1, Math.round(h)) }; y += h; return r; };
    const eventRect = at((portrait ? 34 : 30) * k);
    y += 10 * k;
    const resultW = Math.round(cw * 0.3);
    const rowW = cw - resultW - Math.round(20 * k);
    const rowsTop = y;
    const wRow = at((portrait ? 60 : 54) * k, m, rowW);
    const bRow = at((portrait ? 60 : 54) * k, m, rowW);
    const rowsH = y - rowsTop;
    const resultRect = { x: m + cw - resultW, y: Math.round(rowsTop), w: resultW, h: Math.round(rowsH * 0.62) };
    const endingRect = { x: resultRect.x, y: resultRect.y + resultRect.h, w: resultW, h: Math.round(rowsH - resultRect.h) };
    const namePx = (portrait ? 40 : 34) * k;
    const eloPx = (portrait ? 30 : 26) * k;
    const wp = playerRow(copy.white, copy.whiteElo, wRow, namePx, eloPx, minPx);
    const bp = playerRow(copy.black, copy.blackElo, bRow, namePx, eloPx, minPx);
    const result = line(copy.result, resultRect, (portrait ? 72 : 60) * k, minPx, true);
    const ending = block(copy.ending, endingRect, (portrait ? 26 : 22) * k, minPx, 1);
    const event = eventLine(copy, eventRect, (portrait ? 28 : 24) * k, minPx);
    y += (portrait ? 34 : 24) * k;
    if (!portrait) {
        const gH = chessSmoothDown(118 * k);
        const labelH = 28 * k;
        const bottom = H - m;
        const graph = { x: m, y: bottom - gH, w: chessSmoothDown(cw), h: gH };
        const labelRect = { x: m, y: Math.round(graph.y - labelH - 8 * k), w: cw, h: Math.max(1, Math.round(labelH)) };
        const s = chessSmoothDown(Math.min(cw * 0.66, labelRect.y - 24 * k - y));
        const sc = snapCorner(m, Math.round(y), W, H);
        const board = { x: sc.x, y: sc.y, w: s, h: s };
        const colX = m + s + Math.round(30 * k);
        const colW = Math.max(20, m + cw - colX);
        const titleRect = { x: colX, y: board.y, w: colW, h: Math.round(80 * k) };
        const wordsRect = { x: colX, y: titleRect.y + titleRect.h, w: colW, h: Math.round(150 * k) };
        const openingRect = { x: colX, y: board.y + s - Math.round(64 * k), w: colW, h: Math.round(64 * k) };
        const cap = captions(moments, titleRect, wordsRect, 62 * k, 30 * k, minPx, 4);
        return {
            arrangement: "square",
            board,
            graph,
            graphLabel: line(graphText, labelRect, 20 * k, minPx, true),
            event,
            whiteChip: wp.chip,
            blackChip: bp.chip,
            white: wp.name,
            black: bp.name,
            whiteElo: wp.elo,
            blackElo: bp.elo,
            result,
            ending,
            opening: copy.opening ? block(copy.opening, openingRect, 24 * k, minPx, 2) : null,
            rule: null,
            titles: cap.titles,
            words: cap.words,
        };
    }
    // Portrait: header, board, caption, graph, opening - the board as wide as
    // the canvas allows once the rest has its share.
    const below = (104 + 92 + 30 + 28 + 8 + 170 + 24 + 40) * k;
    const s = chessSmoothDown(Math.min(cw, H - m - y - below - 34 * k));
    const pc = snapCorner(Math.round((W - s) / 2), Math.round(y), W, H);
    const board = { x: Math.min(pc.x, W - s), y: pc.y, w: s, h: s };
    // A tall canvas has height to spare once the board is as wide as it can
    // be: the graph takes some, the gaps between the sections the rest.
    const slack = Math.max(0, H - m - y - s - 34 * k - below);
    const grow = Math.min(slack * 0.4, 90 * k);
    const g = (slack - grow) / 3;
    y += s + 34 * k + g;
    const titleRect = at(104 * k);
    const wordsRect = at(92 * k);
    y += 30 * k + g;
    const labelRect = at(28 * k);
    y += 8 * k;
    const gH = chessSmoothDown(170 * k + grow);
    const graph = { x: m, y: Math.round(y), w: chessSmoothDown(cw), h: gH };
    y += gH + 24 * k + g;
    const openingRect = at(40 * k);
    const cap = captions(moments, titleRect, wordsRect, 84 * k, 36 * k, minPx, 2);
    return {
        arrangement: "portrait",
        board,
        graph,
        graphLabel: line(graphText, labelRect, 22 * k, minPx, true),
        event,
        whiteChip: wp.chip,
        blackChip: bp.chip,
        white: wp.name,
        black: bp.name,
        whiteElo: wp.elo,
        blackElo: bp.elo,
        result,
        ending,
        opening: copy.opening ? block(copy.opening, openingRect, 26 * k, minPx, 1) : null,
        rule: null,
        titles: cap.titles,
        words: cap.words,
    };
}
/* ── the graph ── */
const GRAPH = { bg: "#212328", up: "#e7e5df", down: "#0b0c0e", zero: "#4a4d55", dot: GOLD };
/**
 * The material (or eval) area chart, White up and Black down, with every
 * moment as a faint dot and the current one - when given - as a gold line.
 */
function chessGraphSvg(series, w, h, plies, current) {
    const n = series.values.length - 1;
    const pad = Math.max(2, Math.round(h * 0.08));
    const mid = h / 2;
    const sx = (i) => pad + (n === 0 ? 0 : (i / n) * (w - 2 * pad));
    const sy = (v) => mid - (Math.max(-series.max, Math.min(series.max, v)) / series.max) * (mid - pad);
    // Split each segment at its zero crossing so both areas end exactly on the line.
    const pts = [];
    series.values.forEach((v, i) => {
        if (i > 0) {
            const u = series.values[i - 1];
            if ((u > 0 && v < 0) || (u < 0 && v > 0))
                pts.push([i - 1 + u / (u - v), 0]);
        }
        pts.push([i, v]);
    });
    const area = (sign) => `M${sx(0).toFixed(1)} ${mid.toFixed(1)} ` +
        pts.map(([i, v]) => `L${sx(i).toFixed(1)} ${sy(sign > 0 ? Math.max(0, v) : Math.min(0, v)).toFixed(1)}`).join(" ") +
        ` L${sx(n).toFixed(1)} ${mid.toFixed(1)} Z`;
    const r = Math.max(2, h * 0.035);
    const dots = plies.map((p) => `<circle cx="${sx(p).toFixed(1)}" cy="${sy(series.values[p]).toFixed(1)}" r="${r.toFixed(1)}" fill="${GRAPH.dot}" fill-opacity="0.45"/>`).join("");
    const marker = current === null
        ? ""
        : `<rect x="${(sx(current) - Math.max(1, h * 0.012)).toFixed(1)}" y="${pad}" width="${Math.max(2, h * 0.024).toFixed(1)}" height="${(h - 2 * pad).toFixed(1)}" fill="${GRAPH.dot}"/>` +
            `<circle cx="${sx(current).toFixed(1)}" cy="${sy(series.values[current]).toFixed(1)}" r="${(r * 1.9).toFixed(1)}" fill="${GRAPH.dot}" stroke="${PAGE}" stroke-width="${Math.max(1, h * 0.012).toFixed(1)}"/>`;
    return (`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
        `<rect x="0" y="0" width="${w}" height="${h}" rx="${Math.round(h * 0.06)}" fill="${GRAPH.bg}"/>` +
        `<path d="${area(1)}" fill="${GRAPH.up}"/>` +
        `<path d="${area(-1)}" fill="${GRAPH.down}"/>` +
        `<rect x="${pad}" y="${(mid - 0.5).toFixed(1)}" width="${w - 2 * pad}" height="1" fill="${GRAPH.zero}"/>` +
        dots +
        marker +
        `</svg>`);
}
/* ── props: render() is the gate ── */
function pickText(value, fallback, name) {
    if (value === undefined || value === null)
        return fallback;
    if (typeof value !== "string")
        throw new Error(`${ID}: ${name} must be a string.`);
    return value;
}
function pickOne(value, fallback, allowed, name) {
    if (value === undefined || value === null || value === "")
        return fallback;
    if (typeof value !== "string" || !allowed.includes(value))
        throw new Error(`${ID}: ${name} must be one of ${allowed.join(", ")} - got ${JSON.stringify(value)}.`);
    return value;
}
function pickSeconds(value) {
    if (value === undefined || value === null || value === "")
        return DEFAULTS.momentSec;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < exports.CHESS_RECAP_MIN_MOMENT_SEC || n > exports.CHESS_RECAP_MAX_MOMENT_SEC) {
        throw new Error(`${ID}: momentSec must be a number of seconds from ${exports.CHESS_RECAP_MIN_MOMENT_SEC} to ${exports.CHESS_RECAP_MAX_MOMENT_SEC} - got ${JSON.stringify(value)}.`);
    }
    return n;
}
/** The game and its moments, or an error that names the template and the bad move. */
function readRecap(props) {
    const pgn = pickText(props.pgn, DEFAULTS.pgn, "pgn");
    const spec = pickText(props.moments, DEFAULTS.moments, "moments");
    try {
        const game = (0, chess_1.readChessGame)(pgn.trim().length === 0 ? "" : pgn);
        return { game, moments: (0, story_1.chessMoments)(game, spec) };
    }
    catch (e) {
        throw new Error(`${ID}: ${e.message}`);
    }
}
function text(l, color, label, hAlign = "left") {
    return (0, template_utils_1.tag)((0, text_1.textCell)({ text: l.text, fontSize: l.px, color, hAlign, bold: l.bold, vAlign: "middle", label }), label);
}
function textBlock(b, color, label, bold = false) {
    return (0, template_utils_1.tag)((0, text_1.textCell)({ text: b.lines.join("\n"), fontSize: b.px, color, hAlign: "left", bold, vAlign: "middle", label }), label);
}
function gated(src, overlay) {
    return { ...src, overlay };
}
const between = (a, b) => ({ enable: `gte(t,${a})*lt(t,${b})`, window: { startSec: a, endSec: b } });
/** The board with one lone piece on `sq` and nothing else (transparent) - the slider. */
function loneSvg(p, sq, flip) {
    const { x, y } = (0, pieces_1.chessSquareXY)(sq, flip);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${(0, pieces_1.chessPieceMarkup)(p, x, y)}</svg>`;
}
async function render(props, ctx) {
    const { game, moments } = readRecap(props);
    const flip = pickOne(props.orientation, DEFAULTS.orientation, ["white", "black"], "orientation") === "black";
    const theme = pickOne(props.board, DEFAULTS.board, pieces_1.CHESS_BOARD_THEMES, "board");
    const momentSec = pickSeconds(props.momentSec);
    // An explicit user pin wins and BECOMES the clip; the host-seeded target is never read as one.
    const pinned = (0, template_utils_1.resolvePinnedDurationMs)(ctx);
    const B = chessRecapBeats(moments.length, momentSec, pinned);
    const durationMs = Math.round(B.total * 1000);
    const K = moments.length;
    const first = B.slots[0];
    const last = B.slots[K - 1];
    const finalMove = moments[K - 1].move;
    const W = Math.max(1, Math.round(ctx.target.width));
    const H = Math.max(1, Math.round(ctx.target.height));
    const copy = chessRecapCopy(game);
    const series = (0, story_1.chessSeries)(game);
    const L = chessRecapLayout(copy, moments, series.kind, W, H);
    // ── 1. the board, a CHILD document: every image covers the whole board, so
    //      a slide offset in board pixels lands exactly on the square the next
    //      image draws. Back to front: the final board (cold open + ending),
    //      then per moment the board before the move, the sliding piece(s),
    //      the board after it. Images only - no masks at any depth. ──
    const S = L.board.w;
    const unit = S / 8;
    const boardAssets = {};
    const bp = [];
    let z = 1;
    const image = (id, svg, overlay, label) => {
        boardAssets[(0, types_1.asAssetId)(id)] = { kind: "data-uri", uri: (0, pieces_1.chessSvgUri)(svg), mediaType: "image", displayName: label };
        bp.push({
            rect: { x: 0, y: 0, w: S, h: S, importance: z++ },
            source: (0, template_utils_1.tag)({ type: "media", mediaType: "image", assetId: (0, types_1.asAssetId)(id), placement: { fit: "contain" }, overlay, editor: { owner: "template" } }, label),
        });
    };
    image("board-final", (0, pieces_1.chessBoardSvg)(finalMove.after.board, { flip, theme, lit: [finalMove.from, finalMove.to] }), { enable: `lt(t,${r3(first.start + B.fade)})+gte(t,${last.settle})` }, "board-final");
    moments.forEach((mo, i) => {
        const sl = B.slots[i];
        const m = mo.move;
        const arrive = (0, template_utils_1.entrance)({ kind: "fade", durationMs: Math.round(B.fade * 1000), atSec: sl.start });
        const hide = m.castle && m.rookFrom !== null ? [m.from, m.rookFrom] : [m.from];
        image(`board-${i}-before`, (0, pieces_1.chessBoardSvg)(m.before.board, { flip, theme, lit: [m.from], hide }), (0, template_utils_1.composeMotion)(arrive, between(sl.start, sl.settle)), `board-before-${i}`);
        const sliders = [{ p: m.piece, from: m.from, to: m.to }];
        if (m.castle && m.rookFrom !== null && m.rookTo !== null)
            sliders.push({ p: { color: m.piece.color, type: "r" }, from: m.rookFrom, to: m.rookTo });
        sliders.forEach((s, j) => {
            const a = (0, pieces_1.chessSquareXY)(s.from, flip);
            const b = (0, pieces_1.chessSquareXY)(s.to, flip);
            const P = `clip((t-${sl.slide})/${B.slideSec},0,1)`;
            const ease = `(${P})*(${P})*(3-2*(${P}))`;
            const dx = r3(((b.x - a.x) / 100) * unit);
            const dy = r3(((b.y - a.y) / 100) * unit);
            const slide = { xExpr: `${dx}*${ease}`, yExpr: `${dy}*${ease}` };
            image(`piece-${i}-${j}`, loneSvg(s.p, s.from, flip), (0, template_utils_1.composeMotion)(arrive, between(sl.start, sl.settle), slide), `slide-${i}-${j}`);
        });
        if (i < K - 1) {
            image(`board-${i}-after`, (0, pieces_1.chessBoardSvg)(m.after.board, { flip, theme, lit: [m.from, m.to] }), between(sl.settle, r3(B.slots[i + 1].start + B.fade)), `board-after-${i}`);
        }
    });
    const boardPlaced = (0, template_utils_1.placeInsetPieces)({ rootW: S, rootH: S, pieces: bp });
    // ── 2. the graph, a CHILD document: one image per moment with its marker
    //      (the final one also covers the cold open). ──
    const G = L.graph;
    const plies = moments.map((mo) => mo.move.ply);
    const graphAssets = {};
    const gp = [];
    moments.forEach((mo, i) => {
        const id = (0, types_1.asAssetId)(`graph-${i}`);
        graphAssets[id] = { kind: "data-uri", uri: (0, pieces_1.chessSvgUri)(chessGraphSvg(series, G.w, G.h, plies, mo.move.ply)), mediaType: "image", displayName: `graph at move ${mo.title}` };
        const gate = i === K - 1 ? { enable: `lt(t,${first.start})+gte(t,${last.start})` } : between(B.slots[i].start, B.slots[i + 1].start);
        gp.push({ rect: { x: 0, y: 0, w: G.w, h: G.h, importance: i + 1 }, source: (0, template_utils_1.tag)({ type: "media", mediaType: "image", assetId: id, placement: { fit: "contain" }, overlay: gate, editor: { owner: "template" } }, i === K - 1 ? "graph-final" : `graph-${i}`) });
    });
    const graphPlaced = (0, template_utils_1.placeInsetPieces)({ rootW: G.w, rootH: G.h, pieces: gp });
    const child = (label, size, h, placed, assets) => ({
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets,
        size: { width: size, height: h },
        fps: ctx.target.fps,
        durationMs,
        // The child's own canvas is the page colour, or it reads as a black slab.
        backgroundColor: PAGE,
        sources: placed.sources,
        editor: { label },
    });
    const children = {
        board: child(`board - ${K} moment${K === 1 ? "" : "s"}`, S, S, boardPlaced, boardAssets),
        graph: child(`${series.kind} graph`, G.w, G.h, graphPlaced, graphAssets),
    };
    // ── 3. the page: chrome on every frame, the caption per moment ──
    const pieces = [];
    const piece = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    piece(L.board, 1, (0, template_utils_1.tag)({ type: "mosaic", ref: "board", placement: { fit: "contain" } }, "board"));
    piece(L.graph, 1, (0, template_utils_1.tag)({ type: "mosaic", ref: "graph", placement: { fit: "contain" } }, "graph"));
    const chip = (r, fill, label) => {
        piece(r, 2, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(CHIP_EDGE), `${label}-edge`));
        const e = Math.max(1, Math.round(r.w * 0.09));
        piece({ x: r.x + e, y: r.y + e, w: r.w - 2 * e, h: r.h - 2 * e }, 3, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(fill), label));
    };
    chip(L.whiteChip, CHIP_LIGHT, "white-chip");
    chip(L.blackChip, CHIP_DARK, "black-chip");
    // Nothing on the page is bound to a prop for in-place editing: every word
    // here is READ from the PGN, and an edit to a name would overwrite the game.
    if (L.event)
        piece(L.event.rect, 2, text(L.event, DIM, "event"));
    piece(L.white.rect, 2, textBlock(L.white, INK, "white", true));
    piece(L.black.rect, 2, textBlock(L.black, INK, "black", true));
    if (L.whiteElo)
        piece(L.whiteElo.rect, 2, text(L.whiteElo, DIM, "white-elo", "right"));
    if (L.blackElo)
        piece(L.blackElo.rect, 2, text(L.blackElo, DIM, "black-elo", "right"));
    piece(L.result.rect, 2, text(L.result, INK, "result", L.arrangement === "landscape" ? "left" : "right"));
    piece(L.ending.rect, 2, (0, template_utils_1.tag)((0, text_1.textCell)({ text: L.ending.lines.join("\n"), fontSize: L.ending.px, color: DIM, hAlign: L.arrangement === "landscape" ? "left" : "right", vAlign: "middle", label: "ending" }), "ending"));
    if (L.opening)
        piece(L.opening.rect, 2, textBlock(L.opening, DIM, "opening"));
    if (L.rule)
        piece(L.rule, 2, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(RULE), "rule"));
    piece(L.graphLabel.rect, 2, text(L.graphLabel, DIM, "graph-label"));
    // Captions CUT on the moment's first frame, in step with the graph marker:
    // a fade-in left a blank caption over an already-moved marker (critique).
    moments.forEach((mo, i) => {
        const gate = i === K - 1 ? { enable: `lt(t,${first.start})+gte(t,${last.start})` } : between(B.slots[i].start, B.slots[i + 1].start);
        const title = L.titles[i];
        const words = L.words[i];
        piece(title.rect, 3 + i, gated(text(title, GOLD, `title-${i}`), gate));
        piece(words.rect, 3 + i, gated(textBlock(words, INK, `words-${i}`), gate));
    });
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
        backgroundColor: PAGE,
        sources: placed.sources,
        children,
        editor: { label: `Chess Game Recap - ${copy.white} vs ${copy.black} - ${copy.result} - ${K} moments` },
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints: chessRecapContract(L), debug: props.debugLayout === true });
}
/** What the geometry promises: every text fits, the board is square and leads, the graph sits low. */
function chessRecapContract(L) {
    const fits = [];
    const one = (label, l) => { if (l)
        fits.push((0, layout_1.textFitsMeasured)(label, l.text, l.px, l.width)); };
    const many = (label, b) => { if (b)
        fits.push((0, layout_1.textFitsMeasured)(label, b.lines.join("\n"), b.px, b.width)); };
    one("event", L.event);
    many("white", L.white);
    many("black", L.black);
    one("white-elo", L.whiteElo);
    one("black-elo", L.blackElo);
    one("result", L.result);
    many("ending", L.ending);
    many("opening", L.opening);
    one("graph-label", L.graphLabel);
    L.titles.forEach((t, i) => one(`title-${i}`, t));
    L.words.forEach((w, i) => many(`words-${i}`, w));
    return [
        ...fits,
        // The checker flattens the children, so the board and graph are held by the labels inside them.
        { label: "board-final", aspect: 1 },
        { label: "graph-final", within: { yFrac: [L.arrangement === "landscape" ? 0.5 : 0.6, 1] } },
        { label: "white", within: { yFrac: [0, L.arrangement === "landscape" ? 0.4 : 0.2] } },
    ];
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * pages in Make and `m0saic make --tutorial`). Frozen with the template.
 */
const WHY = {
    day: 18,
    date: "2026-10-07",
    agent: "claude",
    model: "claude-opus-5-5",
    id: ID,
    title: "Chess Game Recap",
    who: "Chess players who share a game - Lichess and Chess.com club players, streamers, a club's game of the week - and post a screenshot of one position",
    problem: [
        "Every Lichess and Chess.com game exports as PGN: players, ratings, opening, every move, and on Lichess the engine's [%eval] after each one. What gets shared is a screenshot. Players build tools to review their own games because, as one put it, that beats \"clicking around Stockfish branches\".",
        "Day 018's v1, written by claude-haiku that morning, kept none of the PGN: six typed fields (opening, result, rating change, time control, date, opponent) and a coloured square, no board. The founder called the idea worth doing well and asked for this fork the same day, built by Claude Opus 5.5."
    ],
    sources: [
        "https://news.ycombinator.com/item?id=49857528",
        "https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/games/game-export-gameId.yaml",
        "https://en.wikipedia.org/wiki/Opera_Game"
    ],
    solution: [
        "Paste a PGN. Every move is replayed on a real board and checked, so a bad move stops the render, named. The clip opens on the finished card, then plays the four or five moves that decided the game: the piece slides to its square, the move is named in SAN and in words, a marker walks the material graph.",
        "The decision that matters is what counts as a key moment: a sacrifice (the piece is taken next move and its side is down 2 or more), a big capture, a check, a ! or ? or comment in the PGN, an eval swing. On the Opera Game that picks 10. Nxb5, 13. Rxd7, 15. Bxd7+, 16. Qb8+ and 17. Rd8# by itself."
    ],
    usage: {
        command: `m0saic make ${ID} --template-repo . -w 1920 -h 1080 --props @game.json -o recap.mp4`,
        try: [
            "game.json: {\"pgn\": \"<a Lichess or Chess.com PGN>\"} - one game, headers and moves",
            "moments \"12 18b 24\" picks the moves yourself; the final move is always the last moment",
            "orientation \"black\" for your games as Black; board \"green\" or \"slate\"",
            "-w 1080 -h 1920 for a story; a Lichess export with evals graphs the evaluation, not material"
        ],
    },
    caveats: [
        "No engine: moments come from material, checks, annotations and any [%eval] already in the PGN, so a quiet positional mistake in an unanalysed game goes unnoticed.",
        "One game per paste, standard chess only (no Chess960); variations in the PGN are skipped.",
        "The pieces are this template's own flat drawings, not a set players already know."
    ],
    timeline: {
        "source": "runner",
        "phases": [
            {
                "name": "direct",
                "startMs": 0,
                "durMs": 493062,
                "calls": 30,
                "tokens": 2926899,
                "costUsd": 1.66,
                "tools": "Bash 25, Edit 3, AskUserQuestion 1"
            },
            {
                "name": "plan",
                "startMs": 493062,
                "durMs": 336965,
                "calls": 28,
                "tokens": 4987894,
                "costUsd": 2,
                "tools": "Bash 25, Write 2, Read 1"
            },
            {
                "name": "build",
                "startMs": 830027,
                "durMs": 1457052,
                "calls": 84,
                "tokens": 22800724,
                "costUsd": 8.72,
                "tools": "Bash 54, Write 12, Read 11"
            },
            {
                "name": "critique",
                "startMs": 2287079,
                "durMs": 181664,
                "calls": 33,
                "tokens": 4518107,
                "costUsd": 1.39,
                "tools": "Read 15, Bash 12, Write 2"
            },
            {
                "name": "ship",
                "startMs": 2468743,
                "durMs": 66231,
                "calls": 8,
                "tokens": 2131308,
                "costUsd": 0.56,
                "tools": "Bash 4, Edit 3, Read 1"
            }
        ],
        "costBasis": "estimated",
        "pricedAt": "2026-09-26"
    },
};
/**
 * Props with no rect to bind, and why (m0saic doctor's `bindingsDeclared`;
 * the template type this repo builds against predates the field, so it is
 * spread in). Nothing on the page is a prop's value: every word is READ from
 * the PGN, and an in-place edit of a name would overwrite the whole game.
 */
const UNBOUND = {
    bindings: {
        unbound: {
            pgn: "source: names, ratings, moves and captions are all derived from it; an in-place edit of one would overwrite the game",
            moments: "selector: which moves are featured; the captions it picks are derived text",
            momentSec: "timing",
        },
    },
};
exports.ChessGameRecapV2 = (0, template_utils_1.defineMosaicTemplate)({
    ...UNBOUND,
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-10-07 · Chess Game Recap",
    version: 2,
    description: "A chess game told in its key moments, from the PGN: every move replayed and checked, the four or five that decided it played on the board with the piece sliding to its square, named in SAN with a plain-words line, over a material (or eval) graph.",
    capabilities: { tier: "core" },
    tags: ["sports", "2026-10-07", "day-018", "chess", "pgn", "lichess", "chess.com", "replay", "video"],
    outputHints: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationMs: 15400,
        format: { kind: "video", container: "mp4" },
        note: "Landscape by default; 1080x1920 stacks the board over the caption, 1080x1080 puts the caption beside it. The clip is a 1.4 s cold open on the finished card, momentSec per moment, a 1 s hold; an explicit --durationMs re-spaces the moments to fit.",
    },
    resolveOutputHints: (props) => {
        try {
            const p = (props !== null && props !== void 0 ? props : {});
            const { moments } = readRecap(p);
            return { durationMs: Math.round(chessRecapBeats(moments.length, pickSeconds(p.momentSec)).total * 1000) };
        }
        catch {
            return {};
        }
    },
    propsSchema,
    defaultProps: {
        pgn: DEFAULTS.pgn,
        moments: DEFAULTS.moments,
        orientation: DEFAULTS.orientation,
        board: DEFAULTS.board,
        momentSec: DEFAULTS.momentSec,
        debugLayout: false,
    },
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
