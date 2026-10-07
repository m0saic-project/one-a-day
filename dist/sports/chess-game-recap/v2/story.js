"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHESS_WORDS_MAX = exports.CHESS_MAX_CHOSEN = exports.CHESS_MAX_MOMENTS = void 0;
exports.chessMoveTitle = chessMoveTitle;
exports.chessSacrifice = chessSacrifice;
exports.chessFirstSentence = chessFirstSentence;
exports.chessDescribe = chessDescribe;
exports.chessWinningChances = chessWinningChances;
exports.chessSeries = chessSeries;
exports.chessParseMoments = chessParseMoments;
exports.chessMoments = chessMoments;
/**
 * The story the clip tells about a replayed game: which moves to feature
 * (the moments), what each one did in plain words, and the graph under it
 * (material balance, or the evaluation when the PGN carries `[%eval]`).
 *
 * Everything here is a pure function of the game - the same PGN picks the
 * same moments and says the same words on every render.
 */
const chess_1 = require("./chess");
/** The most moments the clip features BEFORE the final move (each is a few overlays). */
exports.CHESS_MAX_MOMENTS = 4;
/** The most a `moments` list may name (the final move is added on top). */
exports.CHESS_MAX_CHOSEN = 5;
/** The longest plain-words line before it is cut at a word boundary. */
exports.CHESS_WORDS_MAX = 64;
const art = (t) => (t === "q" || t === "k" ? "the" : "a");
function chessMoveTitle(m) {
    return `${m.moveNumber}.${m.color === "b" ? ".." : ""} ${m.san}${m.annotation}`;
}
/**
 * A sacrifice by the rule the brief states: the piece that moved is taken on
 * the very next ply and the mover is down at least 2 over the pair. Returns
 * the material given (positive) or 0.
 */
function chessSacrifice(game, m) {
    var _a;
    const reply = game.moves[m.ply];
    if (!reply || reply.capturedAt !== m.to)
        return 0;
    const gained = m.captured ? chess_1.CHESS_VALUES[m.captured.type] : 0;
    const lost = chess_1.CHESS_VALUES[((_a = m.promotion) !== null && _a !== void 0 ? _a : m.piece.type)];
    const net = gained - lost;
    return net <= -2 ? -net : 0;
}
/** The first sentence of a comment, cut at a word boundary to `max` characters. */
function chessFirstSentence(text, max = exports.CHESS_WORDS_MAX) {
    const t = (0, chess_1.chessAscii)(text);
    const dot = t.search(/[.!?](\s|$)/);
    let s = dot > 0 ? t.slice(0, dot + 1) : t;
    if (s.length <= max)
        return s.replace(/\.$/, "");
    s = s.slice(0, max + 1);
    const cut = s.lastIndexOf(" ");
    return (cut > max * 0.5 ? s.slice(0, cut) : s.slice(0, max)).replace(/[,;:\s]+$/, "");
}
/** What the move did, in words a non-player can follow. */
function chessDescribe(game, m) {
    if (m.comment)
        return chessFirstSentence(m.comment);
    if (m.checkmate)
        return "checkmate";
    if (m.stalemate)
        return "stalemate";
    const check = m.check ? " with check" : "";
    if (m.castle)
        return `castles ${m.castle === "k" ? "kingside" : "queenside"}${check}`;
    const mover = chess_1.CHESS_NAMES[m.piece.type];
    if (m.promotion) {
        const took = m.captured ? `takes ${art(m.captured.type)} ${chess_1.CHESS_NAMES[m.captured.type]}, ` : "";
        return `${took}promotes to ${art(m.promotion)} ${chess_1.CHESS_NAMES[m.promotion]}${check}`;
    }
    const sac = chessSacrifice(game, m);
    if (sac > 0) {
        if (m.captured)
            return `gives ${art(m.piece.type)} ${mover} for ${art(m.captured.type)} ${chess_1.CHESS_NAMES[m.captured.type]}${check}`;
        return `gives up the ${mover}${check}`;
    }
    if (m.captured)
        return `takes ${art(m.captured.type)} ${chess_1.CHESS_NAMES[m.captured.type]}${check}`;
    if (m.check)
        return `${mover}, check`;
    return `${mover} to ${(0, chess_1.chessSquareName)(m.to)}`;
}
/** Winning chances in -1..1 from a centipawn score (the curve Lichess plots). */
function chessWinningChances(pawns) {
    return 2 / (1 + Math.exp(-0.368208 * pawns)) - 1;
}
/** The value after each ply on White's side, or null; mate scores are +-1. */
function evalAfter(m) {
    if (m.evalMate !== null)
        return m.evalMate === 0 ? (m.color === "w" ? 1 : -1) : Math.sign(m.evalMate);
    if (m.evalPawns !== null)
        return chessWinningChances(m.evalPawns);
    if (m.checkmate)
        return m.color === "w" ? 1 : -1;
    return null;
}
/** The graph: the evaluation when at least 60% of the plies carry one, else material. */
function chessSeries(game) {
    const n = game.moves.length;
    const evals = game.moves.map(evalAfter);
    const known = evals.filter((v) => v !== null).length;
    if (n > 0 && known / n >= 0.6) {
        const values = [0];
        let last = 0;
        for (const v of evals) {
            if (v !== null)
                last = v;
            values.push(last);
        }
        return { kind: "eval", values, max: 1 };
    }
    const values = [(0, chess_1.chessMaterial)(game.start), ...game.moves.map((m) => (0, chess_1.chessMaterial)(m.after))];
    const max = Math.max(3, ...values.map((v) => Math.abs(v)));
    return { kind: "material", values, max };
}
/** How much a ply deserves to be featured (0 = never). */
function score(game, m, series) {
    const prev = game.moves[m.ply - 2];
    // The reply that takes a sacrificed piece is part of the sacrifice's moment.
    if (prev && chessSacrifice(game, prev) > 0)
        return { score: 0, why: "" };
    let s = 0;
    let why = "";
    const sac = chessSacrifice(game, m);
    if (sac > 0) {
        s = 2 * sac;
        why = "sacrifice";
    }
    else if (m.captured) {
        s = chess_1.CHESS_VALUES[m.captured.type];
        why = "capture";
    }
    if (m.promotion) {
        s += 4;
        why = why || "promotion";
    }
    if (m.check) {
        s += 1;
        why = why || "check";
    }
    if (m.annotation || m.nags.some((g) => g >= 1 && g <= 6) || m.comment) {
        s += 4;
        why = why || "annotated";
    }
    if (series.kind === "eval") {
        const swing = Math.abs(series.values[m.ply] - series.values[m.ply - 1]);
        if (swing >= 0.3) {
            s += 10 * swing;
            why = why || "eval";
        }
    }
    return { score: s, why };
}
/** Parse a `moments` list: "10 13 16" (White's moves), "12b" / "12..." (Black's). */
function chessParseMoments(game, spec) {
    const tokens = spec.split(/[\s,;]+/).filter((t) => t.length > 0);
    if (tokens.length > exports.CHESS_MAX_CHOSEN)
        throw new Error(`moments: at most ${exports.CHESS_MAX_CHOSEN} moves (the final move is always added) - got ${tokens.length}.`);
    const last = game.moves[game.moves.length - 1];
    return tokens.map((tok) => {
        const m = /^(\d+)\s*(w|b|\.\.\.|\.)?$/i.exec(tok);
        if (!m)
            throw new Error(`moments: "${tok}" is not a move number (write 16 for White's 16th move, 16b or 16... for Black's).`);
        const color = m[2] && (m[2].toLowerCase() === "b" || m[2] === "...") ? "b" : "w";
        const n = Number(m[1]);
        const found = game.moves.find((x) => x.moveNumber === n && x.color === color);
        if (!found)
            throw new Error(`moments: move ${n} for ${color === "w" ? "White" : "Black"} is not in this game (it ends at move ${last.moveNumber} for ${last.color === "w" ? "White" : "Black"}).`);
        return found;
    });
}
/**
 * The moments the clip features, in game order, the final move last.
 * `spec` empty = automatic (the brief's rule); else the named moves.
 */
function chessMoments(game, spec = "") {
    const n = game.moves.length;
    const final = game.moves[n - 1];
    const series = chessSeries(game);
    let picked;
    if (spec.trim().length > 0) {
        picked = chessParseMoments(game, spec).map((move) => ({ move, why: "chosen" }));
    }
    else {
        const ranked = game.moves
            .slice(0, n - 1)
            .map((m) => ({ move: m, ...score(game, m, series) }))
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score || a.move.ply - b.move.ply);
        picked = [];
        for (const r of ranked) {
            if (picked.length >= exports.CHESS_MAX_MOMENTS)
                break;
            if (picked.some((p) => Math.abs(p.move.ply - r.move.ply) < 2) || final.ply - r.move.ply < 2)
                continue;
            picked.push({ move: r.move, why: r.why });
        }
        // A quiet game still gets a story: fill to two moments at a third and two thirds.
        for (const f of [Math.round(n / 3), Math.round((2 * n) / 3)]) {
            if (picked.length >= 2)
                break;
            const m = game.moves[f - 1];
            if (m && m !== final && !picked.some((p) => Math.abs(p.move.ply - m.ply) < 2) && final.ply - m.ply >= 2)
                picked.push({ move: m, why: "filler" });
        }
    }
    const seen = new Set();
    const ordered = [...picked, { move: final, why: "final" }]
        .filter((p) => (seen.has(p.move.ply) ? false : (seen.add(p.move.ply), true)))
        .sort((a, b) => a.move.ply - b.move.ply);
    return ordered.map((p) => ({ move: p.move, title: chessMoveTitle(p.move), words: chessDescribe(game, p.move), why: p.move === final ? "final" : p.why }));
}
