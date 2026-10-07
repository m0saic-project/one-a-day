/**
 * The PGN reader and move replayer behind `chess-game-recap/v2`.
 *
 * No dependency: the PGN is parsed here and every SAN move is REPLAYED on a
 * plain 64-square board with a legality check (pins, castling through check,
 * en passant, promotion). The positions the clip draws are the game's real
 * positions, and a move that does not parse or is not legal stops the render
 * with an error that names it - a wrong board would be worse than none.
 *
 * Squares are 0..63, a1 = 0, h1 = 7, a8 = 56 (rank * 8 + file).
 */

export type ChessColor = "w" | "b";
export type ChessPieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type ChessPiece = { color: ChessColor; type: ChessPieceType };

export type ChessPosition = {
  board: ReadonlyArray<ChessPiece | null>;
  turn: ChessColor;
  castling: { wk: boolean; wq: boolean; bk: boolean; bq: boolean };
  ep: number | null;
  fullmove: number;
};

export type ChessMove = {
  /** 1-based half-move index in the game. */
  ply: number;
  moveNumber: number;
  color: ChessColor;
  /** SAN with the check suffix the replay computed (annotations stripped). */
  san: string;
  /** "!!", "!", "!?", "?!", "?", "??" or "". */
  annotation: string;
  nags: number[];
  /** The comment after the move, `[%...]` commands removed, ASCII-folded. */
  comment: string;
  /** `[%eval]` in pawns from White's side, or null. */
  evalPawns: number | null;
  /** `[%eval #n]`: mate in n (positive = White mates), or null. */
  evalMate: number | null;
  from: number;
  to: number;
  piece: ChessPiece;
  captured: ChessPiece | null;
  /** Where the captured piece stood (differs from `to` for en passant). */
  capturedAt: number | null;
  promotion: ChessPieceType | null;
  castle: "k" | "q" | null;
  rookFrom: number | null;
  rookTo: number | null;
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
  before: ChessPosition;
  after: ChessPosition;
};

export type ChessGame = {
  headers: Record<string, string>;
  start: ChessPosition;
  moves: ChessMove[];
  /** "1-0" | "0-1" | "1/2-1/2" | "*" - the movetext's, else the Result header's. */
  result: string;
};

export const CHESS_VALUES: Readonly<Record<ChessPieceType, number>> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export const CHESS_NAMES: Readonly<Record<ChessPieceType, string>> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
export const CHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const FILES = "abcdefgh";

export function chessSquareName(sq: number): string {
  return FILES[sq & 7] + String((sq >> 3) + 1);
}

function squareOf(name: string): number {
  return (Number(name[1]) - 1) * 8 + FILES.indexOf(name[0]);
}

const fileOf = (sq: number) => sq & 7;
const rankOf = (sq: number) => sq >> 3;
const other = (c: ChessColor): ChessColor => (c === "w" ? "b" : "w");
const sideName = (c: ChessColor) => (c === "w" ? "White" : "Black");

/** Accents folded, anything else outside printable ASCII dropped: rendered copy is ASCII only. */
export function chessAscii(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── FEN ── */

export function chessFromFen(fen: string): ChessPosition {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) throw new Error(`FEN "${fen}" needs at least 4 fields (board, side, castling, en passant).`);
  const rows = parts[0].split("/");
  if (rows.length !== 8) throw new Error(`FEN "${fen}": the board needs 8 ranks.`);
  const board: (ChessPiece | null)[] = new Array(64).fill(null);
  rows.forEach((row, i) => {
    const rank = 7 - i;
    let file = 0;
    for (const ch of row) {
      if (/[1-8]/.test(ch)) { file += Number(ch); continue; }
      const type = ch.toLowerCase() as ChessPieceType;
      if (!"pnbrqk".includes(type) || file > 7) throw new Error(`FEN "${fen}": bad rank ${8 - i} "${row}".`);
      board[rank * 8 + file] = { color: ch === type ? "b" : "w", type };
      file++;
    }
    if (file !== 8) throw new Error(`FEN "${fen}": rank ${rank + 1} "${row}" is not 8 squares.`);
  });
  if (parts[1] !== "w" && parts[1] !== "b") throw new Error(`FEN "${fen}": side to move must be w or b.`);
  const c = parts[2];
  const ep = parts[3] !== "-" && /^[a-h][36]$/.test(parts[3]) ? squareOf(parts[3]) : null;
  return {
    board,
    turn: parts[1],
    castling: { wk: c.includes("K"), wq: c.includes("Q"), bk: c.includes("k"), bq: c.includes("q") },
    ep,
    fullmove: Math.max(1, Number(parts[5] ?? 1) || 1),
  };
}

export function chessToFen(pos: ChessPosition): string {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = "";
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pos.board[r * 8 + f];
      if (!p) { empty++; continue; }
      if (empty) { row += String(empty); empty = 0; }
      row += p.color === "w" ? p.type.toUpperCase() : p.type;
    }
    rows.push(row + (empty ? String(empty) : ""));
  }
  const c = pos.castling;
  const castle = `${c.wk ? "K" : ""}${c.wq ? "Q" : ""}${c.bk ? "k" : ""}${c.bq ? "q" : ""}` || "-";
  return `${rows.join("/")} ${pos.turn} ${castle} ${pos.ep === null ? "-" : chessSquareName(pos.ep)}`;
}

/* ── attacks and moves ── */

function pathClear(board: ReadonlyArray<ChessPiece | null>, from: number, to: number): boolean {
  const df = Math.sign(fileOf(to) - fileOf(from));
  const dr = Math.sign(rankOf(to) - rankOf(from));
  let f = fileOf(from) + df;
  let r = rankOf(from) + dr;
  while (f !== fileOf(to) || r !== rankOf(to)) {
    if (board[r * 8 + f]) return false;
    f += df;
    r += dr;
  }
  return true;
}

/** Does the piece on `from` attack `to` (capture geometry - a pawn attacks diagonally)? */
function attacks(board: ReadonlyArray<ChessPiece | null>, from: number, to: number): boolean {
  const p = board[from];
  if (!p || from === to) return false;
  const df = fileOf(to) - fileOf(from);
  const dr = rankOf(to) - rankOf(from);
  const adf = Math.abs(df);
  const adr = Math.abs(dr);
  switch (p.type) {
    case "p": return adf === 1 && dr === (p.color === "w" ? 1 : -1);
    case "n": return (adf === 1 && adr === 2) || (adf === 2 && adr === 1);
    case "k": return Math.max(adf, adr) === 1;
    case "b": return adf === adr && pathClear(board, from, to);
    case "r": return (df === 0 || dr === 0) && pathClear(board, from, to);
    case "q": return (adf === adr || df === 0 || dr === 0) && pathClear(board, from, to);
  }
}

function attacked(board: ReadonlyArray<ChessPiece | null>, sq: number, by: ChessColor): boolean {
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (p && p.color === by && attacks(board, s, sq)) return true;
  }
  return false;
}

function kingOf(board: ReadonlyArray<ChessPiece | null>, color: ChessColor): number {
  return board.findIndex((p) => p !== null && p.color === color && p.type === "k");
}

function inCheck(pos: ChessPosition, color: ChessColor): boolean {
  const k = kingOf(pos.board, color);
  return k >= 0 && attacked(pos.board, k, other(color));
}

/** Pseudo-legal: the piece on `from` can go to `to` by its own rules (own king safety not checked). */
function canGo(pos: ChessPosition, from: number, to: number): boolean {
  const p = pos.board[from];
  const target = pos.board[to];
  if (!p || from === to || (target && target.color === p.color)) return false;
  if (p.type !== "p") return attacks(pos.board, from, to);
  const dir = p.color === "w" ? 1 : -1;
  const df = fileOf(to) - fileOf(from);
  const dr = rankOf(to) - rankOf(from);
  if (df === 0) {
    if (target) return false;
    if (dr === dir) return true;
    const home = p.color === "w" ? 1 : 6;
    return dr === 2 * dir && rankOf(from) === home && !pos.board[from + 8 * dir];
  }
  return Math.abs(df) === 1 && dr === dir && (target !== null || pos.ep === to);
}

type Plan = { from: number; to: number; promotion: ChessPieceType | null; castle: "k" | "q" | null };

/** Play `plan` (assumed pseudo-legal) and return the new position plus what happened. */
function play(pos: ChessPosition, plan: Plan) {
  const board = pos.board.slice();
  const piece = board[plan.from] as ChessPiece;
  let captured: ChessPiece | null = board[plan.to];
  let capturedAt: number | null = captured ? plan.to : null;
  let rookFrom: number | null = null;
  let rookTo: number | null = null;
  if (piece.type === "p" && plan.to === pos.ep && !captured) {
    capturedAt = plan.to - 8 * (piece.color === "w" ? 1 : -1);
    captured = board[capturedAt];
    board[capturedAt] = null;
  }
  board[plan.to] = plan.promotion ? { color: piece.color, type: plan.promotion } : piece;
  board[plan.from] = null;
  if (plan.castle) {
    const base = piece.color === "w" ? 0 : 56;
    rookFrom = base + (plan.castle === "k" ? 7 : 0);
    rookTo = base + (plan.castle === "k" ? 5 : 3);
    board[rookTo] = board[rookFrom];
    board[rookFrom] = null;
  }
  const castling = { ...pos.castling };
  if (piece.type === "k") {
    if (piece.color === "w") { castling.wk = false; castling.wq = false; } else { castling.bk = false; castling.bq = false; }
  }
  for (const sq of [plan.from, plan.to]) {
    if (sq === 0) castling.wq = false;
    if (sq === 7) castling.wk = false;
    if (sq === 56) castling.bq = false;
    if (sq === 63) castling.bk = false;
  }
  const ep = piece.type === "p" && Math.abs(plan.to - plan.from) === 16 ? (plan.from + plan.to) / 2 : null;
  const after: ChessPosition = {
    board,
    turn: other(pos.turn),
    castling,
    ep,
    fullmove: pos.fullmove + (pos.turn === "b" ? 1 : 0),
  };
  return { after, piece, captured, capturedAt, rookFrom, rookTo };
}

function legal(pos: ChessPosition, plan: Plan): boolean {
  return !inCheck(play(pos, plan).after, pos.turn);
}

function castlePlan(pos: ChessPosition, side: "k" | "q"): Plan | null {
  const base = pos.turn === "w" ? 0 : 56;
  const king = base + 4;
  const rook = base + (side === "k" ? 7 : 0);
  const right = pos.turn === "w" ? (side === "k" ? pos.castling.wk : pos.castling.wq) : side === "k" ? pos.castling.bk : pos.castling.bq;
  const k = pos.board[king];
  const r = pos.board[rook];
  if (!right || !k || k.type !== "k" || k.color !== pos.turn || !r || r.type !== "r" || r.color !== pos.turn) return null;
  const between = side === "k" ? [base + 5, base + 6] : [base + 1, base + 2, base + 3];
  if (between.some((s) => pos.board[s])) return null;
  const by = other(pos.turn);
  const crossed = side === "k" ? [king, base + 5, base + 6] : [king, base + 3, base + 2];
  if (crossed.some((s) => attacked(pos.board, s, by))) return null;
  return { from: king, to: base + (side === "k" ? 6 : 2), promotion: null, castle: side };
}

function hasLegalMove(pos: ChessPosition): boolean {
  for (let from = 0; from < 64; from++) {
    const p = pos.board[from];
    if (!p || p.color !== pos.turn) continue;
    for (let to = 0; to < 64; to++) {
      if (!canGo(pos, from, to)) continue;
      const last = p.type === "p" && (rankOf(to) === 0 || rankOf(to) === 7);
      if (legal(pos, { from, to, promotion: last ? "q" : null, castle: null })) return true;
    }
  }
  return castlePlan(pos, "k") !== null || castlePlan(pos, "q") !== null;
}

const SAN_RE = /^([NBRQK])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=?([NBRQ]))?$/;

/** Resolve one SAN against `pos`; throws with the reason when it is not exactly one legal move. */
function resolveSan(pos: ChessPosition, san: string, where: string): Plan {
  const bare = san.replace(/[+#]+$/, "").replace(/0/g, "O");
  if (bare === "O-O" || bare === "O-O-O") {
    const plan = castlePlan(pos, bare === "O-O" ? "k" : "q");
    if (!plan) throw new Error(`${where}: ${san} - castling is not legal here.`);
    return plan;
  }
  const m = SAN_RE.exec(san.replace(/[+#]+$/, ""));
  if (!m) throw new Error(`${where}: "${san}" is not a chess move.`);
  const type = (m[1] ? m[1].toLowerCase() : "p") as ChessPieceType;
  const to = squareOf(m[5]);
  const wantFile = m[2] ? FILES.indexOf(m[2]) : null;
  const wantRank = m[3] ? Number(m[3]) - 1 : null;
  const promotion = m[6] ? (m[6].toLowerCase() as ChessPieceType) : null;
  const lastRank = pos.turn === "w" ? 7 : 0;
  if (type === "p" && rankOf(to) === lastRank && !promotion) throw new Error(`${where}: ${san} reaches the last rank but names no promotion piece (e.g. ${san.replace(/[+#]+$/, "")}=Q).`);
  if (promotion && (type !== "p" || rankOf(to) !== lastRank)) throw new Error(`${where}: ${san} promotes, but only a pawn reaching the last rank can.`);
  const found: Plan[] = [];
  for (let from = 0; from < 64; from++) {
    const p = pos.board[from];
    if (!p || p.color !== pos.turn || p.type !== type) continue;
    if (wantFile !== null && fileOf(from) !== wantFile) continue;
    if (wantRank !== null && rankOf(from) !== wantRank) continue;
    if (!canGo(pos, from, to)) continue;
    const plan: Plan = { from, to, promotion, castle: null };
    if (legal(pos, plan)) found.push(plan);
  }
  if (found.length === 1) return found[0];
  const what = CHESS_NAMES[type];
  if (found.length > 1) throw new Error(`${where}: ${san} is ambiguous - ${found.length} ${what}s can go to ${m[5]}.`);
  throw new Error(`${where}: ${san} is not legal here - no ${sideName(pos.turn)} ${what} can go to ${m[5]}.`);
}

/* ── PGN ── */

type RawMove = { san: string; annotation: string; nags: number[]; comment: string; evalPawns: number | null; evalMate: number | null };

const RESULT_RE = /^(1-0|0-1|1\/2-1\/2|\*)$/;

/** Split a comment into its prose and its `[%eval]`. */
function readComment(text: string): { prose: string; evalPawns: number | null; evalMate: number | null } {
  let evalPawns: number | null = null;
  let evalMate: number | null = null;
  const ev = /\[%eval\s+(#?)(-?\d+(?:\.\d+)?)/.exec(text);
  if (ev) {
    if (ev[1] === "#") evalMate = Number(ev[2]);
    else evalPawns = Number(ev[2]);
  }
  const prose = chessAscii(text.replace(/\[%[^\]]*\]/g, " "));
  return { prose, evalPawns, evalMate };
}

/** Headers and the main line of the FIRST game in `text` (variations are skipped). */
export function parsePgnText(text: string): { headers: Record<string, string>; moves: RawMove[]; result: string | null } {
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const headers: Record<string, string> = {};
  let i = 0;
  const headerRe = /\[\s*([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\s*\]/y;
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] !== "[") break;
    headerRe.lastIndex = i;
    const h = headerRe.exec(src);
    if (!h) break;
    headers[h[1]] = h[2].replace(/\\(["\\])/g, "$1");
    i = headerRe.lastIndex;
  }
  const moves: RawMove[] = [];
  let result: string | null = null;
  const attach = (raw: string) => {
    const c = readComment(raw);
    const last = moves[moves.length - 1];
    if (!last) return;
    if (c.prose) last.comment = last.comment ? `${last.comment} ${c.prose}` : c.prose;
    if (c.evalPawns !== null) last.evalPawns = c.evalPawns;
    if (c.evalMate !== null) last.evalMate = c.evalMate;
  };
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === "{") {
      const end = src.indexOf("}", i + 1);
      attach(src.slice(i + 1, end < 0 ? src.length : end));
      i = end < 0 ? src.length : end + 1;
      continue;
    }
    if (ch === ";") {
      const end = src.indexOf("\n", i);
      attach(src.slice(i + 1, end < 0 ? src.length : end));
      i = end < 0 ? src.length : end + 1;
      continue;
    }
    if (ch === "(") {
      let depth = 0;
      while (i < src.length) {
        if (src[i] === "{") { const end = src.indexOf("}", i + 1); i = end < 0 ? src.length : end + 1; continue; }
        if (src[i] === "(") depth++;
        if (src[i] === ")") { depth--; if (depth === 0) { i++; break; } }
        i++;
      }
      continue;
    }
    if (ch === ")") { i++; continue; }
    if (ch === "[") break; // the next game's headers: one game per paste
    if (ch === "%" && (i === 0 || src[i - 1] === "\n")) { const end = src.indexOf("\n", i); i = end < 0 ? src.length : end + 1; continue; }
    let j = i;
    while (j < src.length && !/[\s{}();[]/.test(src[j])) j++;
    let tok = src.slice(i, j);
    i = j;
    if (tok.startsWith("$")) {
      const n = Number(tok.slice(1));
      if (Number.isInteger(n) && moves.length) moves[moves.length - 1].nags.push(n);
      continue;
    }
    if (RESULT_RE.test(tok)) { result = tok; break; }
    const num = /^\d+(\.+)(.*)$/.exec(tok);
    if (num) { tok = num[2]; if (!tok) continue; }
    if (/^\d+$/.test(tok)) continue;
    if (tok === "--" || tok === "Z0") throw new Error(`move ${moves.length + 1}: null moves ("${tok}") are not supported.`);
    tok = tok.replace(/e\.p\.$/, "");
    const ann = /([!?]+)$/.exec(tok);
    const san = ann ? tok.slice(0, -ann[1].length) : tok;
    if (!san) continue;
    moves.push({ san, annotation: ann ? ann[1] : "", nags: [], comment: "", evalPawns: null, evalMate: null });
  }
  return { headers, moves, result };
}

/** Parse and replay one game. Every move is checked; the first bad one throws, named. */
export function readChessGame(text: string): ChessGame {
  if (typeof text !== "string" || text.trim().length === 0) throw new Error("the PGN is empty - paste a game's PGN (Lichess: Share & export; Chess.com: Share, PGN).");
  const raw = parsePgnText(text);
  const fen = raw.headers.FEN && raw.headers.SetUp !== "0" ? raw.headers.FEN : CHESS_START_FEN;
  if ((raw.headers.Variant ?? "").toLowerCase().includes("960")) throw new Error("Chess960 games are not supported (castling differs).");
  const start = chessFromFen(fen);
  if (raw.moves.length === 0) throw new Error("the PGN has no moves.");
  let pos = start;
  const moves: ChessMove[] = raw.moves.map((rm, k) => {
    const where = `move ${pos.fullmove} for ${sideName(pos.turn)}`;
    const plan = resolveSan(pos, rm.san, where);
    const done = play(pos, plan);
    const check = inCheck(done.after, done.after.turn);
    const stuck = !hasLegalMove(done.after);
    const bare = rm.san.replace(/[+#]+$/, "").replace(/0/g, "O");
    const move: ChessMove = {
      ply: k + 1,
      moveNumber: pos.fullmove,
      color: pos.turn,
      san: bare + (check && stuck ? "#" : check ? "+" : ""),
      annotation: rm.annotation,
      nags: rm.nags,
      comment: rm.comment,
      evalPawns: rm.evalPawns,
      evalMate: rm.evalMate,
      from: plan.from,
      to: plan.to,
      piece: done.piece,
      captured: done.captured,
      capturedAt: done.capturedAt,
      promotion: plan.promotion,
      castle: plan.castle,
      rookFrom: done.rookFrom,
      rookTo: done.rookTo,
      check,
      checkmate: check && stuck,
      stalemate: !check && stuck,
      before: pos,
      after: done.after,
    };
    pos = done.after;
    return move;
  });
  const header = raw.headers.Result;
  const result = raw.result && raw.result !== "*" ? raw.result : header && RESULT_RE.test(header) ? header : (raw.result ?? "*");
  return { headers: raw.headers, start, moves, result };
}

/** White's material minus Black's (P 1, N 3, B 3, R 5, Q 9). */
export function chessMaterial(pos: ChessPosition): number {
  let sum = 0;
  for (const p of pos.board) if (p) sum += (p.color === "w" ? 1 : -1) * CHESS_VALUES[p.type];
  return sum;
}
