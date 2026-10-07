import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicOverlayExpr, MosaicSource } from "@m0saic/types";
import { asAssetId, asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import {
  bindProp,
  defineMosaicTemplate,
  definePropsSchema,
  latticeMaxSlots,
  makeColorTile,
  placeInsetPieces,
  resolvePinnedDurationMs,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { textCell } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";
import { chessAscii, chessSquareName, readChessGame } from "../v2/chess";
import type { ChessGame, ChessPiece } from "../v2/chess";
import {
  CHESS_RECAP_DEFAULT_PGN,
  CHESS_RECAP_MAX_MOMENT_SEC,
  CHESS_RECAP_MIN_MOMENT_SEC,
  chessRecapBeats,
  chessRecapCopy,
  chessRecapLayout,
} from "../v2/chess-game-recap";
import type { ChessBlock, ChessLine, ChessRecapBeats, ChessRecapCopy, ChessRecapLayout, ChessRect } from "../v2/chess-game-recap";
import { CHESS_BOARD_THEMES, CHESS_PALETTES, chessPieceSvg, chessSquareXY, chessSvgUri } from "../v2/pieces";
import type { ChessBoardTheme } from "../v2/pieces";
import { chessMoments, chessSeries } from "../v2/story";
import type { ChessMoment, ChessSeries } from "../v2/story";

/**
 * `@one-a-day/sports/chess-game-recap/v3` - the v2 clip (a chess game told in
 * its key moments, from the PGN) with EXPLICIT geometry and a platform knob.
 *
 * WHAT CHANGED FROM v2 (the founder's ask, the same day): v2 drew each board
 * as one whole-board SVG image and stacked those images in time. v3 builds
 * the board out of the canvas itself: 64 square cells, every piece its own
 * rect on its square, the lit squares their own tiles, the moving piece its
 * own rect that slides, and the graph one bar rect per ply. Clicking around
 * in Make, every square and every piece is a cell. A `platform` knob picks
 * the canvas (desktop 1920x1080, square 1080x1080, mobile 1080x1920); the
 * names and the event line can be overridden and edited on the canvas.
 *
 * THE RULE THAT BITES: a piece is NOT drawn per frame - each square carries
 * one layer per piece that ever stands on it, enabled over the union of the
 * stretches it stands there (one layer per distinct value, never one per
 * change). A piece that does not move between two moments is the same layer
 * staying on, so nothing flickers. The board side is a multiple of the split
 * lattice on both axes (basis 360), so the square cells ARE the squares - no
 * quantized cell, no inset recovery - and a slide's pixel offset lands on the
 * exact cell of the square it targets.
 *
 * Reused, unchanged and frozen, from v2: the PGN reader and replayer
 * (`../v2/chess.ts`), the moments and the graph series (`../v2/story.ts`),
 * the piece drawings (`../v2/pieces.ts`), the copy, the beats and the three
 * arrangements (`../v2/chess-game-recap.ts`).
 */

export const CHESS_V3_PLATFORMS = {
  /** 16:9 - YouTube, a stream overlay, a club website. */
  desktop: { width: 1920, height: 1080 },
  /** 1:1 - a feed post, Discord, a forum. */
  square: { width: 1080, height: 1080 },
  /** 9:16 - Stories, Reels, Shorts, TikTok. */
  mobile: { width: 1080, height: 1920 },
} as const;
export type ChessV3Platform = keyof typeof CHESS_V3_PLATFORMS;
const PLATFORM_KEYS = Object.keys(CHESS_V3_PLATFORMS) as ChessV3Platform[];

export type ChessGameRecapV3Props = {
  /** The game: a PGN as exported (headers + moves; comments, NAGs, variations and [%eval] are read). */
  pgn?: string;
  /** Where it is going: the canvas follows (desktop | square | mobile). */
  platform?: ChessV3Platform;
  /** Which moves to feature: "10 13 16" (White's), "12b" or "12..." (Black's); empty = automatic. */
  moments?: string;
  /** White's name as shown; empty = the PGN's. */
  white?: string;
  /** Black's name as shown; empty = the PGN's. */
  black?: string;
  /** The line above the players; empty = the PGN's event, date and time control. */
  event?: string;
  /** Which side is at the bottom of the board. */
  orientation?: "white" | "black";
  /** Board colours. */
  board?: ChessBoardTheme;
  /** Seconds per moment (1.5..6). */
  momentSec?: number;
  /** Dev-only: check the layout contract and draw it over the frame. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/sports/chess-game-recap/v3";

const DEFAULTS = {
  pgn: CHESS_RECAP_DEFAULT_PGN,
  platform: "desktop" as ChessV3Platform,
  moments: "",
  white: "",
  black: "",
  event: "",
  orientation: "white" as const,
  board: "walnut" as ChessBoardTheme,
  momentSec: 2.6,
};

/** The split basis: fine enough that the board side sits on the lattice on every contract canvas. */
const BASIS = 360;

const PAGE = "#16171b" as MosaicColor;
const INK = "#f2f1ec" as MosaicColor;
const DIM = "#9b9da5" as MosaicColor;
const GOLD = "#e9b949" as MosaicColor;
const RULE = "#2c2e35" as MosaicColor;
const CHIP_EDGE = "#8b8d94" as MosaicColor;
const CHIP_LIGHT = "#f8f6f1" as MosaicColor;
const CHIP_DARK = "#2a2b30" as MosaicColor;
const GRAPH_BG = "#212328" as MosaicColor;
const GRAPH_UP = "#e7e5df" as MosaicColor;
const GRAPH_DOWN = "#0b0c0e" as MosaicColor;
const GRAPH_ZERO = "#4a4d55" as MosaicColor;

const propsSchema = definePropsSchema<ChessGameRecapV3Props>({
  pgn: {
    type: "string",
    required: false,
    description:
      "The game as PGN - Lichess: Share & export > PGN; Chess.com: Share > PGN. Headers (players, ratings, event, date, opening, time control) and every move are read; each move is replayed, and the first one that is not legal stops the render, named. One game per paste.",
    meta: { control: { multiline: true, mono: true, placeholder: '[White "..."]\n[Black "..."]\n\n1. e4 e5 2. Nf3 ...' }, ui: { label: "PGN", order: 1, primary: true } },
  },
  platform: {
    type: "string",
    required: false,
    description: 'Where the clip is going, and so its canvas: "desktop" 1920x1080 (default), "square" 1080x1080, "mobile" 1080x1920. An explicit width and height still win.',
    meta: { constraints: { oneOf: [...PLATFORM_KEYS] }, ui: { label: "Platform", order: 2 } },
  },
  moments: {
    type: "string",
    required: false,
    description:
      'The moves to feature, by move number: "10 13 16" are White\'s 10th, 13th and 16th; "12b" or "12..." is Black\'s 12th. Up to 5; the final move is always the last moment. Empty picks them: sacrifices, big captures, checks, annotated moves, eval swings.',
    meta: { control: { placeholder: "automatic" }, ui: { label: "Moments", order: 3 } },
  },
  white: {
    type: "string",
    required: false,
    description: "White's name as shown - empty uses the PGN's White header. Edit it on the canvas to fix a username or add a title.",
    meta: { control: { placeholder: "from the PGN" }, ui: { label: "White", order: 4 } },
  },
  black: {
    type: "string",
    required: false,
    description: "Black's name as shown - empty uses the PGN's Black header.",
    meta: { control: { placeholder: "from the PGN" }, ui: { label: "Black", order: 5 } },
  },
  event: {
    type: "string",
    required: false,
    description: "The small line above the players - empty uses the PGN's event, date and time control (\"Paris, 1858\").",
    meta: { control: { placeholder: "from the PGN" }, ui: { label: "Event line", order: 6 } },
  },
  orientation: {
    type: "string",
    required: false,
    description: 'Which side sits at the bottom of the board: "white" (default) or "black" - share your own games as Black from your side.',
    meta: { constraints: { oneOf: ["white", "black"] }, ui: { label: "Orientation", order: 7 } },
  },
  board: {
    type: "string",
    required: false,
    description: 'Board colours: "walnut" (default), "green" or "slate".',
    meta: { constraints: { oneOf: [...CHESS_BOARD_THEMES] }, ui: { label: "Board", order: 8 } },
  },
  momentSec: {
    type: "number",
    required: false,
    description: `Seconds per moment (${CHESS_RECAP_MIN_MOMENT_SEC}..${CHESS_RECAP_MAX_MOMENT_SEC}, default ${DEFAULTS.momentSec}). The clip is a short cold open on the finished card, then one moment each, then a hold. An explicit duration pin overrides it and becomes the clip.`,
    meta: { constraints: { min: CHESS_RECAP_MIN_MOMENT_SEC, max: CHESS_RECAP_MAX_MOMENT_SEC }, ui: { label: "Seconds per moment", order: 9 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits, the squares are square, the graph sits low) and draw it over the frame.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── props: render() is the gate ── */

function pickText(value: unknown, fallback: string, name: string): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") throw new Error(`${ID}: ${name} must be a string.`);
  return value;
}

function pickOne<T extends string>(value: unknown, fallback: T, allowed: readonly T[], name: string): T {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) throw new Error(`${ID}: ${name} must be one of ${allowed.join(", ")} - got ${JSON.stringify(value)}.`);
  return value as T;
}

function pickSeconds(value: unknown): number {
  if (value === undefined || value === null || value === "") return DEFAULTS.momentSec;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < CHESS_RECAP_MIN_MOMENT_SEC || n > CHESS_RECAP_MAX_MOMENT_SEC) {
    throw new Error(`${ID}: momentSec must be a number of seconds from ${CHESS_RECAP_MIN_MOMENT_SEC} to ${CHESS_RECAP_MAX_MOMENT_SEC} - got ${JSON.stringify(value)}.`);
  }
  return n;
}

function readRecap(props: ChessGameRecapV3Props): { game: ChessGame; moments: ChessMoment[] } {
  const pgn = pickText(props.pgn, DEFAULTS.pgn, "pgn");
  const spec = pickText(props.moments, DEFAULTS.moments, "moments");
  try {
    const game = readChessGame(pgn.trim().length === 0 ? "" : pgn);
    return { game, moments: chessMoments(game, spec) };
  } catch (e) {
    throw new Error(`${ID}: ${(e as Error).message}`);
  }
}

/** The PGN's copy with the shown-name overrides applied (ASCII, like everything rendered). */
export function chessV3Copy(game: ChessGame, props: ChessGameRecapV3Props): ChessRecapCopy {
  const copy = chessRecapCopy(game);
  const over = (v: unknown, name: string) => chessAscii(pickText(v, "", name));
  const white = over(props.white, "white");
  const black = over(props.black, "black");
  const event = over(props.event, "event");
  return {
    ...copy,
    ...(white ? { white } : {}),
    ...(black ? { black } : {}),
    ...(event ? { event, eventShorter: [] } : {}),
  };
}

/* ── the board on the lattice ── */

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** The split lattice's pitch per axis at this canvas (basis 360). */
export function chessV3Pitch(W: number, H: number): { qx: number; qy: number } {
  return { qx: W / latticeMaxSlots(W, BASIS), qy: H / latticeMaxSlots(H, BASIS) };
}

/**
 * The board inside v2's board rect, re-cut so a square's side is a multiple
 * of the split lattice's pitch on BOTH axes and its corner sits on the
 * lattice: every square cell is then exactly its square. A hostile canvas
 * (a prime side, no usable lattice) falls back to plain eighths - the
 * inset recovery still paints them exactly.
 */
export function chessV3Board(r: ChessRect, W: number, H: number): { x: number; y: number; sq: number } {
  const { qx, qy } = chessV3Pitch(W, H);
  const L = (qx * qy) / gcd(qx, qy);
  let sq = Math.floor(r.w / 8 / L) * L;
  let x: number;
  let y: number;
  if (sq >= Math.max(4, (r.w / 8) * 0.85)) {
    x = Math.round((r.x + (r.w - 8 * sq) / 2) / qx) * qx;
    y = Math.round((r.y + (r.h - 8 * sq) / 2) / qy) * qy;
  } else {
    sq = Math.max(1, Math.floor(r.w / 8));
    x = Math.round(r.x + (r.w - 8 * sq) / 2);
    y = Math.round(r.y + (r.h - 8 * sq) / 2);
  }
  return { x: Math.min(x, W - 8 * sq), y: Math.min(y, H - 8 * sq), sq };
}

/* ── the board in time: one layer per distinct value per square ── */

type Span = { a: number; b: number };
type BoardState = Span & { board: ReadonlyArray<ChessPiece | null>; lit: number[]; hide: number[] };

/** The positions the clip shows, in order: cold open, then before/after each moment. */
export function chessV3States(moments: ChessMoment[], B: ChessRecapBeats): BoardState[] {
  const K = moments.length;
  const final = moments[K - 1].move;
  const states: BoardState[] = [{ a: 0, b: B.slots[0].start, board: final.after.board, lit: [final.from, final.to], hide: [] }];
  moments.forEach((mo, i) => {
    const m = mo.move;
    const sl = B.slots[i];
    const hide = m.castle && m.rookFrom !== null ? [m.from, m.rookFrom] : [m.from];
    states.push({ a: sl.start, b: sl.settle, board: m.before.board, lit: [m.from], hide });
    states.push({ a: sl.settle, b: i < K - 1 ? B.slots[i + 1].start : B.total, board: m.after.board, lit: [m.from, m.to], hide: [] });
  });
  return states;
}

const pieceKey = (p: ChessPiece) => `${p.color}${p.type}`;

/** For one square: each value it takes (a piece key, or "lit") with the merged stretches it holds. */
export function chessV3SquareLayers(states: BoardState[], sq: number): Map<string, Span[]> {
  const out = new Map<string, Span[]>();
  const put = (key: string, s: Span) => {
    const list = out.get(key) ?? [];
    const last = list[list.length - 1];
    if (last && Math.abs(last.b - s.a) < 1e-9) last.b = s.b;
    else list.push({ a: s.a, b: s.b });
    out.set(key, list);
  };
  for (const st of states) {
    const p = st.board[sq];
    if (p && !st.hide.includes(sq)) put(pieceKey(p), st);
    if (st.lit.includes(sq)) put("lit", st);
  }
  return out;
}

const fmt = (n: number) => String(Math.round(n * 1000) / 1000);

/** An enable over a union of stretches; undefined = the whole clip (a static layer). */
export function chessV3Gate(spans: Span[], total: number): MosaicOverlayExpr | undefined {
  if (spans.length === 1 && spans[0].a <= 0 && spans[0].b >= total - 1e-9) return undefined;
  const terms = spans.map(({ a, b }) => (a <= 0 ? `lt(t,${fmt(b)})` : b >= total - 1e-9 ? `gte(t,${fmt(a)})` : `gte(t,${fmt(a)})*lt(t,${fmt(b)})`));
  const lo = Math.min(...spans.map((s) => s.a));
  const hi = Math.max(...spans.map((s) => s.b));
  const window = { ...(lo > 0 ? { startSec: lo } : {}), ...(hi < total - 1e-9 ? { endSec: hi } : {}) };
  return { enable: terms.join("+"), ...(Object.keys(window).length ? { window } : {}) };
}

function mixHex(a: string, b: string, t: number): MosaicColor {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}

/* ── geometry ── */

export type ChessV3Layout = ChessRecapLayout & { boardAt: { x: number; y: number; sq: number } };

export function chessV3Layout(copy: ChessRecapCopy, moments: ChessMoment[], kind: ChessSeries["kind"], W: number, H: number): ChessV3Layout {
  const L = chessRecapLayout(copy, moments, kind, W, H);
  const boardAt = chessV3Board(L.board, W, H);
  return { ...L, board: { x: boardAt.x, y: boardAt.y, w: 8 * boardAt.sq, h: 8 * boardAt.sq }, boardAt };
}

/** The graph's columns: one per ply, binned to at most 60 for a long game. */
export function chessV3Columns(series: ChessSeries): Array<{ ply: number; value: number }> {
  const n = series.values.length - 1;
  const count = Math.min(n, 60);
  return Array.from({ length: count }, (_, j) => {
    const ply = count === n ? j + 1 : Math.round(((j + 1) * n) / count);
    return { ply, value: series.values[ply] };
  });
}

/* ── render ── */

type Pieces = Parameters<typeof placeInsetPieces>[0]["pieces"];

function text(l: ChessLine, color: MosaicColor, label: string, hAlign: "left" | "right" = "left"): MosaicSource {
  return tag(textCell({ text: l.text, fontSize: l.px, color, hAlign, bold: l.bold, vAlign: "middle", label }), label);
}

function textBlock(b: ChessBlock, color: MosaicColor, label: string, bold = false, hAlign: "left" | "right" = "left"): MosaicSource {
  return tag(textCell({ text: b.lines.join("\n"), fontSize: b.px, color, hAlign, bold, vAlign: "middle", label }), label);
}

const between = (a: number, b: number): MosaicOverlayExpr => ({ enable: `gte(t,${fmt(a)})*lt(t,${fmt(b)})`, window: { startSec: a, endSec: b } });

async function render(props: ChessGameRecapV3Props, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { game, moments } = readRecap(props);
  pickOne(props.platform, DEFAULTS.platform, PLATFORM_KEYS, "platform");
  const flip = pickOne(props.orientation, DEFAULTS.orientation, ["white", "black"] as const, "orientation") === "black";
  const theme = pickOne(props.board, DEFAULTS.board, CHESS_BOARD_THEMES, "board");
  const momentSec = pickSeconds(props.momentSec);
  // An explicit user pin wins and BECOMES the clip; the host-seeded target is never read as one.
  const pinned = resolvePinnedDurationMs(ctx);
  const B = chessRecapBeats(moments.length, momentSec, pinned);
  const total = B.total;
  const durationMs = Math.round(total * 1000);
  const K = moments.length;
  const first = B.slots[0];
  const last = B.slots[K - 1];

  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const copy = chessV3Copy(game, props);
  const series = chessSeries(game);
  const L = chessV3Layout(copy, moments, series.kind, W, H);
  const { x: bx, y: by, sq } = L.boardAt;
  const pal = CHESS_PALETTES[theme];

  const pieces: Pieces = [];
  // Whole pixels: round the EDGES (not x and w apart), so neighbours stay
  // flush. And nothing thinner than one lattice cell: a sub-cell rect (a 1 px
  // zero line) makes placeInsetPieces fall to a finer pitch, which moves the
  // board's corner off the lattice and every square back onto an inset.
  const { qx, qy } = chessV3Pitch(W, H);
  const piece = (r: ChessRect, importance: number, source: MosaicSource) => {
    const x0 = Math.round(r.x);
    const y0 = Math.round(r.y);
    const rect = { x: x0, y: y0, w: Math.max(qx, Math.round(r.x + r.w) - x0), h: Math.max(qy, Math.round(r.y + r.h) - y0), importance };
    pieces.push({ rect, source });
  };
  const assets: NonNullable<MosaicDocument["assets"]> = {};
  const pieceAsset = (p: ChessPiece) => {
    const id = asAssetId(`piece-${pieceKey(p)}`);
    if (!assets[id]) assets[id] = { kind: "data-uri", uri: chessSvgUri(chessPieceSvg(p)), mediaType: "image", displayName: `${p.color === "w" ? "white" : "black"} ${p.type}` };
    return id;
  };
  const image = (id: ReturnType<typeof asAssetId>, overlay: MosaicOverlayExpr | undefined, label: string): MosaicSource =>
    tag({ type: "media", mediaType: "image", assetId: id, placement: { fit: "contain" }, ...(overlay ? { overlay } : {}), editor: { owner: "template" } } as MosaicSource, label);

  // ── 1. the board: 64 square cells; on each, its lit tile and one layer per
  //      piece that ever stands there, on over the stretches it does. ──
  const cell = (s: number): ChessRect => {
    const { x, y } = chessSquareXY(s, flip);
    return { x: bx + (x / 100) * sq, y: by + (y / 100) * sq, w: sq, h: sq };
  };
  const states = chessV3States(moments, B);
  for (let s = 0; s < 64; s++) {
    const name = chessSquareName(s);
    const light = ((s >> 3) + (s & 7)) % 2 === 1;
    const base = (light ? pal.light : pal.dark) as MosaicColor;
    const r = cell(s);
    piece(r, 1, tag(makeColorTile(base) as MosaicSource, `sq-${name}`));
    for (const [key, spans] of chessV3SquareLayers(states, s)) {
      const gate = chessV3Gate(spans, total);
      if (key === "lit") {
        piece(r, 2, tag(makeColorTile(mixHex(base, pal.lit, 0.55), gate ? { overlay: gate } : undefined) as MosaicSource, `lit-${name}`));
      } else {
        const p: ChessPiece = { color: key[0] as ChessPiece["color"], type: key[1] as ChessPiece["type"] };
        piece(r, 3, image(pieceAsset(p), gate, `${name}-${key}`));
      }
    }
  }
  // ── 2. the moving piece(s): a rect on the from-square that slides to the
  //      to-square (castling: the rook too), over the empty from-square. ──
  moments.forEach((mo, i) => {
    const m = mo.move;
    const sl = B.slots[i];
    const sliders: Array<{ p: ChessPiece; from: number; to: number }> = [{ p: m.piece, from: m.from, to: m.to }];
    if (m.castle && m.rookFrom !== null && m.rookTo !== null) sliders.push({ p: { color: m.piece.color, type: "r" }, from: m.rookFrom, to: m.rookTo });
    sliders.forEach((sd, j) => {
      const a = cell(sd.from);
      const b = cell(sd.to);
      const P = `clip((t-${sl.slide})/${B.slideSec},0,1)`;
      const ease = `(${P})*(${P})*(3-2*(${P}))`;
      piece(a, 4, image(pieceAsset(sd.p), { ...between(sl.start, sl.settle), xExpr: `${fmt(b.x - a.x)}*${ease}`, yExpr: `${fmt(b.y - a.y)}*${ease}` }, `slide-${i}-${j}`));
    });
  });

  // ── 3. the graph: a panel, the zero line, one bar per ply, a marker per moment ──
  const G = L.graph;
  const cols = chessV3Columns(series);
  const pad = Math.max(2, Math.round(G.h * 0.08));
  const mid = G.y + G.h / 2;
  const scale = (G.h / 2 - pad) / series.max;
  const colW = (G.w - 2 * pad) / Math.max(1, cols.length);
  const colX = (j: number) => G.x + pad + j * colW;
  piece(G, 1, tag(makeColorTile(GRAPH_BG) as MosaicSource, "graph"));
  piece({ x: G.x + pad, y: Math.round(mid), w: G.w - 2 * pad, h: Math.max(1, Math.round(G.h * 0.006)) }, 2, tag(makeColorTile(GRAPH_ZERO) as MosaicSource, "graph-zero"));
  cols.forEach((c, j) => {
    const h = Math.round(Math.abs(Math.max(-series.max, Math.min(series.max, c.value))) * scale);
    if (h < 1) return;
    const w = Math.max(1, colW * 0.72);
    const x = colX(j) + (colW - w) / 2;
    piece({ x, y: c.value > 0 ? mid - h : mid, w, h }, 3, tag(makeColorTile(c.value > 0 ? GRAPH_UP : GRAPH_DOWN) as MosaicSource, `bar-${c.ply}`));
  });
  const colOf = (ply: number) => cols.reduce((best, c, j) => (Math.abs(c.ply - ply) < Math.abs(cols[best].ply - ply) ? j : best), 0);
  moments.forEach((mo, i) => {
    const gate: MosaicOverlayExpr = i === K - 1 ? { enable: `lt(t,${fmt(first.start)})+gte(t,${fmt(last.start)})` } : between(B.slots[i].start, B.slots[i + 1].start);
    const w = Math.max(2, Math.min(colW, G.h * 0.025));
    const x = colX(colOf(mo.move.ply)) + (colW - w) / 2;
    piece({ x, y: G.y + pad, w, h: G.h - 2 * pad }, 4, tag(makeColorTile(GOLD, { overlay: gate }) as MosaicSource, `marker-${i}`));
  });

  // ── 4. the page: chrome on every frame, the caption per moment. The names
  //      and the event line are bound to their override props: edit them in
  //      place and the PGN's value is replaced on the canvas only. ──
  const chip = (r: ChessRect, fill: MosaicColor, label: string) => {
    piece(r, 2, tag(makeColorTile(CHIP_EDGE) as MosaicSource, `${label}-edge`));
    const e = Math.max(1, Math.round(r.w * 0.09));
    piece({ x: r.x + e, y: r.y + e, w: r.w - 2 * e, h: r.h - 2 * e }, 3, tag(makeColorTile(fill) as MosaicSource, label));
  };
  chip(L.whiteChip, CHIP_LIGHT, "white-chip");
  chip(L.blackChip, CHIP_DARK, "black-chip");
  if (L.event) piece(L.event.rect, 2, bindProp(text(L.event, DIM, "event"), "event"));
  piece(L.white.rect, 2, bindProp(textBlock(L.white, INK, "white", true), "white"));
  piece(L.black.rect, 2, bindProp(textBlock(L.black, INK, "black", true), "black"));
  if (L.whiteElo) piece(L.whiteElo.rect, 2, text(L.whiteElo, DIM, "white-elo", "right"));
  if (L.blackElo) piece(L.blackElo.rect, 2, text(L.blackElo, DIM, "black-elo", "right"));
  const side = L.arrangement === "landscape" ? "left" : "right";
  piece(L.result.rect, 2, text(L.result, INK, "result", side));
  piece(L.ending.rect, 2, textBlock(L.ending, DIM, "ending", false, side));
  if (L.opening) piece(L.opening.rect, 2, textBlock(L.opening, DIM, "opening"));
  if (L.rule) piece(L.rule, 2, tag(makeColorTile(RULE) as MosaicSource, "rule"));
  piece(L.graphLabel.rect, 2, text(L.graphLabel, DIM, "graph-label"));
  moments.forEach((mo, i) => {
    const gate: MosaicOverlayExpr = i === K - 1 ? { enable: `lt(t,${fmt(first.start)})+gte(t,${fmt(last.start)})` } : between(B.slots[i].start, B.slots[i + 1].start);
    piece(L.titles[i].rect, 3, { ...text(L.titles[i], GOLD, `title-${i}`), overlay: gate } as MosaicSource);
    piece(L.words[i].rect, 3, { ...textBlock(L.words[i], INK, `words-${i}`), overlay: gate } as MosaicSource);
  });

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces, basis: BASIS });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets,
    size: { width: W, height: H },
    fps: ctx.target.fps,
    // The clip is authored, so it out-ranks the hint.
    durationMs,
    backgroundColor: PAGE,
    sources: placed.sources,
    editor: { label: `Chess Game Recap - ${copy.white} vs ${copy.black} - ${copy.result} - ${K} moments` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: chessV3Contract(L), debug: props.debugLayout === true });
}

/** What the geometry promises: every text fits, the squares are square, the graph sits low. */
export function chessV3Contract(L: ChessV3Layout): LayoutConstraint[] {
  const fits: LayoutConstraint[] = [];
  const one = (label: string, l: ChessLine | null) => { if (l) fits.push(textFitsMeasured(label, l.text, l.px, l.width)); };
  const many = (label: string, b: ChessBlock | null) => { if (b) fits.push(textFitsMeasured(label, b.lines.join("\n"), b.px, b.width)); };
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
    { label: "sq-a1", aspect: 1 },
    { label: "sq-h8", aspect: 1 },
    { label: "graph", within: { yFrac: [L.arrangement === "landscape" ? 0.5 : 0.6, 1] } },
    { label: "white", within: { yFrac: [0, L.arrangement === "landscape" ? 0.4 : 0.2] } },
  ];
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * pages in Make and `m0saic make --tutorial`). Frozen with the template.
 */
const WHY: WhySpec = {
  day: 18,
  date: "2026-10-07",
  agent: "claude",
  model: "claude-opus-5-5",
  id: ID,
  title: "Chess Game Recap",
  who: "Chess players who share a game - Lichess and Chess.com club players, streamers, a club's game of the week - and post a screenshot of one position",
  problem: [
    "Every Lichess and Chess.com game exports as PGN: players, ratings, opening, every move, and on Lichess the engine's [%eval] after each one. What gets shared is a screenshot. Players build tools to review their own games because, as one put it, that beats \"clicking around Stockfish branches\".",
    "Day 018's v1 (claude-haiku) kept none of the PGN. v2, the founder's same-day fork, replayed the game but drew each board as one whole-board image, stacked in time: the geometry was hidden. The founder asked for v3: every square and piece its own cell, and a platform knob."
  ],
  sources: [
    "https://news.ycombinator.com/item?id=49857528",
    "https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/games/game-export-gameId.yaml",
    "https://en.wikipedia.org/wiki/Opera_Game"
  ],
  solution: [
    "Paste a PGN; every move is replayed and checked. The board is built from the canvas: 64 square cells, every piece its own rect on its square, the moving piece a rect that slides to its target, the graph one bar per ply. Pick desktop, square or mobile; edit the names in place.",
    "The decision that matters: one layer per piece per square, on over every stretch that piece stands there - never one per change - so a piece that does not move never flickers. The board side sits on the split lattice on every canvas, so each square cell is exactly its square."
  ],
  usage: {
    command: `m0saic make ${ID} --template-repo . --props @game.json -o recap.mp4`,
    try: [
      "game.json: {\"pgn\": \"<a Lichess or Chess.com PGN>\", \"platform\": \"mobile\"} for a 1080x1920 story",
      "platform \"square\" for a feed post; desktop 1920x1080 is the default",
      "white / black / event replace the PGN's names on the canvas only; empty uses the PGN",
      "moments \"12 18b 24\" picks the moves; orientation \"black\"; board \"green\" or \"slate\""
    ],
  },
  caveats: [
    "No engine: moments come from material, checks, annotations and any [%eval] already in the PGN, so a quiet positional mistake in an unanalysed game goes unnoticed.",
    "Positions change between moments with a cut, square by square (v2 cross-faded whole-board images).",
    "One game per paste, standard chess only; a game past 60 plies is graphed in 60 bars."
  ],
  timeline: {
    "source": "runner",
    "phases": [
      {
        "name": "direct",
        "startMs": 0,
        "durMs": 156016,
        "calls": 4,
        "tokens": 1895469,
        "costUsd": 4.12,
        "tools": "Bash 4"
      },
      {
        "name": "build",
        "startMs": 156016,
        "durMs": 995084,
        "calls": 32,
        "tokens": 12469397,
        "costUsd": 3.93,
        "tools": "Bash 19, Read 5, Write 5"
      },
      {
        "name": "critique",
        "startMs": 1151100,
        "durMs": 141029,
        "calls": 24,
        "tokens": 2191564,
        "costUsd": 0.69,
        "tools": "Read 13, Bash 9, SubagentHandback 1"
      },
      {
        "name": "ship",
        "startMs": 1292129,
        "durMs": 40821,
        "calls": 9,
        "tokens": 3860011,
        "costUsd": 0.89,
        "tools": "Bash 6, Edit 2, Read 1"
      }
    ],
    "costBasis": "estimated",
    "pricedAt": "2026-09-26"
  },
};

/**
 * Props with no rect to bind, and why (m0saic doctor's `bindingsDeclared`;
 * the template type this repo builds against predates the field, so it is
 * spread in).
 */
const UNBOUND = {
  bindings: {
    unbound: {
      pgn: "source: the moves, ratings, result and captions are all derived from it; the names and event have their own override props",
      moments: "selector: which moves are featured; the captions it picks are derived text",
      momentSec: "timing",
    },
  },
};

export const ChessGameRecapV3 = defineMosaicTemplate<ChessGameRecapV3Props>({
  ...UNBOUND,
  id: asTemplateId(ID),
  label: "2026-10-07 · Chess Game Recap",
  version: 3,
  description:
    "A chess game told in its key moments, from the PGN, built cell by cell: 64 square cells, every piece its own rect, the moving piece sliding to its square, a bar per ply on the material graph; a platform knob for desktop, square or mobile.",
  capabilities: { tier: "core" },
  tags: ["sports", "2026-10-07", "day-018", "chess", "pgn", "lichess", "chess.com", "replay", "video"],

  outputHints: {
    ...CHESS_V3_PLATFORMS[DEFAULTS.platform],
    fps: 30,
    durationMs: 15400,
    format: { kind: "video", container: "mp4" },
    note: "The canvas follows the platform knob (desktop 1920x1080 by default, square 1080x1080, mobile 1080x1920); an explicit width and height win. The clip is a 1.4 s cold open on the finished card, momentSec per moment, a 1 s hold; an explicit --durationMs re-spaces the moments to fit.",
  },
  // Never throws - a hint must not kill a render; junk falls back to the defaults.
  resolveOutputHints: (props) => {
    const p = (props ?? {}) as ChessGameRecapV3Props;
    const key = typeof p.platform === "string" && p.platform in CHESS_V3_PLATFORMS ? (p.platform as ChessV3Platform) : DEFAULTS.platform;
    try {
      const { moments } = readRecap(p);
      return { ...CHESS_V3_PLATFORMS[key], durationMs: Math.round(chessRecapBeats(moments.length, pickSeconds(p.momentSec)).total * 1000) };
    } catch {
      return { ...CHESS_V3_PLATFORMS[key] };
    }
  },

  propsSchema,
  defaultProps: {
    pgn: DEFAULTS.pgn,
    platform: DEFAULTS.platform,
    moments: DEFAULTS.moments,
    white: DEFAULTS.white,
    black: DEFAULTS.black,
    event: DEFAULTS.event,
    orientation: DEFAULTS.orientation,
    board: DEFAULTS.board,
    momentSec: DEFAULTS.momentSec,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});
