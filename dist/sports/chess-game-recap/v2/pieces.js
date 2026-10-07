"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHESS_PALETTES = exports.CHESS_BOARD_THEMES = void 0;
exports.chessPieceMarkup = chessPieceMarkup;
exports.chessPieceSvg = chessPieceSvg;
exports.chessSquareXY = chessSquareXY;
exports.chessBoardSvg = chessBoardSvg;
exports.chessSvgUri = chessSvgUri;
exports.CHESS_BOARD_THEMES = ["walnut", "green", "slate"];
exports.CHESS_PALETTES = {
    walnut: { light: "#f0d9b5", dark: "#b58863", lit: "#e8c44a" },
    green: { light: "#eceed1", dark: "#7a9a59", lit: "#f2d64b" },
    slate: { light: "#dfe3e6", dark: "#8aa0ad", lit: "#e6c75a" },
};
const INK = {
    w: { fill: "#f8f6f1", line: "#1c1c1e", detail: "#1c1c1e" },
    b: { fill: "#2a2b30", line: "#0b0b0d", detail: "#dcd9d2" },
};
const BASE = `<rect x="22" y="76" width="56" height="11" rx="3.5"/>`;
const FOOT = `<rect x="28" y="68" width="44" height="9" rx="3"/>`;
/** The shapes (filled, outlined) and the detail strokes of one piece type. */
const SHAPES = {
    p: {
        body: `<path d="M41 47 C42 58 37 68 31 76 H69 C63 68 58 58 59 47 Z"/>` +
            `<rect x="25" y="75" width="50" height="11" rx="4"/>` +
            `<ellipse cx="50" cy="45" rx="14" ry="4.6"/>` +
            `<circle cx="50" cy="27" r="12"/>`,
        detail: "",
    },
    r: {
        body: `<path d="M33 68 L35.5 40 H64.5 L67 68 Z"/>` +
            BASE +
            FOOT +
            `<rect x="30" y="34" width="40" height="7" rx="2"/>` +
            `<path d="M28 14 H37 V21 H45 V14 H55 V21 H63 V14 H72 V35 H28 Z"/>`,
        detail: "",
    },
    n: {
        body: `<path d="M30 77 C30 64 36 58 44 52 C46 50 46 47 43 46 C38 47 32 50 27 49 C22 48 20 43 23 39 C28 32 34 27 40 22 L41 11 L48 19 C62 19 74 30 75 48 C76 60 73 69 71 77 Z"/>` +
            BASE,
        detail: `<circle cx="40.5" cy="30" r="2.8" stroke="none" fill="DETAIL"/>` +
            `<circle cx="26" cy="43" r="1.6" stroke="none" fill="DETAIL"/>` +
            `<path d="M51 22 C61 26 68 36 69.5 50" fill="none"/>`,
    },
    b: {
        body: `<path d="M33 76 C36 70 40 67 40 62 H60 C60 67 64 70 67 76 Z"/>` +
            `<rect x="24" y="76" width="52" height="11" rx="3.5"/>` +
            `<rect x="36" y="56" width="28" height="7" rx="3"/>` +
            `<path d="M50 18 C38 27 33 38 36 48 C38 54 43 57 50 57 C57 57 62 54 64 48 C67 38 62 27 50 18 Z"/>` +
            `<circle cx="50" cy="13" r="5"/>`,
        detail: `<path d="M56 29 L46.5 42" fill="none"/>`,
    },
    q: {
        body: `<path d="M31 68 L23 33 L37 49 L38 25 L47 46 L50 21 L53 46 L62 25 L63 49 L77 33 L69 68 Z"/>` +
            BASE +
            FOOT +
            `<circle cx="23" cy="30" r="4.5"/><circle cx="38" cy="22" r="4.5"/><circle cx="50" cy="17" r="4.5"/><circle cx="62" cy="22" r="4.5"/><circle cx="77" cy="30" r="4.5"/>`,
        detail: `<path d="M32 60 Q50 55 68 60" fill="none"/>`,
    },
    k: {
        body: `<path d="M31 68 C26 58 21 46 29 40 C37 34 45 41 50 49 C55 41 63 34 71 40 C79 46 74 58 69 68 Z"/>` +
            `<path d="M44 49 C44 38 47 33 50 31 C53 33 56 38 56 49 Z"/>` +
            BASE +
            FOOT +
            `<path d="M47.5 8 H52.5 V14 H58 V19 H52.5 V30 H47.5 V19 H42 V14 H47.5 Z"/>`,
        detail: `<path d="M32 60 Q50 55 68 60" fill="none"/>`,
    },
};
/** One piece's markup at (x, y) in board units (100 per square). */
function chessPieceMarkup(p, x, y) {
    const ink = INK[p.color];
    const s = SHAPES[p.type];
    const detail = s.detail
        ? `<g stroke="${ink.detail}" stroke-width="3" stroke-linecap="round">${s.detail.replace(/DETAIL/g, ink.detail)}</g>`
        : "";
    return (`<g transform="translate(${x} ${y})">` +
        `<g fill="${ink.fill}" stroke="${ink.line}" stroke-width="3" stroke-linejoin="round">${s.body}</g>` +
        detail +
        `</g>`);
}
/** A lone piece on a transparent 100 x 100 square - the one that slides. */
function chessPieceSvg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${chessPieceMarkup(p, 0, 0)}</svg>`;
}
/** Where square `sq` is drawn, in board units, for the side at the bottom. */
function chessSquareXY(sq, flip) {
    const file = sq & 7;
    const rank = sq >> 3;
    return flip ? { x: (7 - file) * 100, y: rank * 100 } : { x: file * 100, y: (7 - rank) * 100 };
}
/**
 * A whole board: squares, the lit squares (the move being shown), and every
 * piece except the squares in `hide` (the piece that is about to slide).
 */
function chessBoardSvg(board, opts) {
    var _a, _b;
    const pal = exports.CHESS_PALETTES[opts.theme];
    const lit = new Set((_a = opts.lit) !== null && _a !== void 0 ? _a : []);
    const hide = new Set((_b = opts.hide) !== null && _b !== void 0 ? _b : []);
    let squares = "";
    let pieces = "";
    for (let sq = 0; sq < 64; sq++) {
        const { x, y } = chessSquareXY(sq, opts.flip);
        const light = ((sq >> 3) + (sq & 7)) % 2 === 1;
        squares += `<rect x="${x}" y="${y}" width="100" height="100" fill="${light ? pal.light : pal.dark}"/>`;
        if (lit.has(sq))
            squares += `<rect x="${x}" y="${y}" width="100" height="100" fill="${pal.lit}" fill-opacity="0.55"/>`;
        const p = board[sq];
        if (p && !hide.has(sq))
            pieces += chessPieceMarkup(p, x, y);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" shape-rendering="geometricPrecision">${squares}${pieces}</svg>`;
}
function chessSvgUri(svg) {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
