import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { sweepLayout } from "../../../_shared/layout";
import { chessSquareName } from "../v2/chess";
import { chessRecapBeats } from "../v2/chess-game-recap";
import {
  CHESS_V3_PLATFORMS,
  ChessGameRecapV3,
  chessV3Board,
  chessV3Gate,
  chessV3Pitch,
  chessV3States,
} from "./chess-game-recap";
import { readChessGame } from "../v2/chess";
import { chessMoments } from "../v2/story";
import { CHESS_RECAP_DEFAULT_PGN } from "../v2/chess-game-recap";

const ID = "@one-a-day/sports/chess-game-recap/v3";

const render = (props: Parameters<typeof ChessGameRecapV3.render>[0] = {}, w = 1920, h = 1080, ctx?: MosaicEngineContext) =>
  ChessGameRecapV3.render({ ...ChessGameRecapV3.defaultProps, ...props }, ctx ?? targetCtx(w, h)).then(asDocument);

type Src = { type?: string; assetId?: string; placement?: { inset?: unknown }; editor?: { label?: string; binding?: { propKey?: string } }; overlay?: { enable?: string; xExpr?: string; yExpr?: string }; layers?: Array<{ content?: { text?: string } }> };
const sourcesOf = (doc: MosaicDocument) => (doc.sources ?? []) as Src[];
const byLabel = (doc: MosaicDocument, label: string) => sourcesOf(doc).find((s) => s.editor?.label === label);

/** A gate the template writes, at clip time t: a sum (OR) of `lt`, `gte` and `gte*lt` terms. */
function on(enable: string | undefined, t: number): boolean {
  if (enable === undefined) return true;
  return enable.split("+").some((term) => {
    const lo = [...term.matchAll(/gte\(t,([\d.]+)\)/g)].map((x) => Number(x[1]));
    const hi = [...term.matchAll(/(?<!g)lt\(t,([\d.]+)\)/g)].map((x) => Number(x[1]));
    return lo.every((a) => t >= a) && hi.every((b) => t < b);
  });
}

const LONG = `[White "Maximilian Alexander von Wittelsbach-Zweibrucken"]\n[Black "Bartholomew Montgomery-Fitzwilliam III"]\n[WhiteElo "2712"]\n[BlackElo "2698"]\n[Event "Rated Classical game, round 7 of the club championship"]\n[Date "2026.10.04"]\n[TimeControl "5400+30"]\n[Result "1-0"]\n[Opening "Sicilian Defense: Najdorf Variation, English Attack, Anti-English"]\n[ECO "B90"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 b4 13. Ne2 Ne8 14. f4 a5 15. f5 a4 16. Nbd4 exd4 17. Nxd4 b3 18. Kb1 bxc2+ 19. Nxc2 Bb3 20. axb3 axb3 21. Na3 Ne5 22. Qc3 Rxa3 23. bxa3 Qa5 24. Qxa5 1-0`;

describe("chess-game-recap v3", () => {
  test("the platform knob picks the canvas; junk falls back; an explicit size still wins at render", async () => {
    const hints = (platform?: string) => ChessGameRecapV3.resolveOutputHints?.({ ...ChessGameRecapV3.defaultProps, platform } as never);
    expect(hints("desktop")).toEqual({ width: 1920, height: 1080, durationMs: 15400 });
    expect(hints("square")).toEqual({ width: 1080, height: 1080, durationMs: 15400 });
    expect(hints("mobile")).toEqual({ width: 1080, height: 1920, durationMs: 15400 });
    expect(hints("tv")).toEqual({ width: 1920, height: 1080, durationMs: 15400 });
    expect(ChessGameRecapV3.outputHints).toMatchObject({ ...CHESS_V3_PLATFORMS.desktop, durationMs: 15400 });
    const doc = await render({ platform: "mobile" }, 1920, 1080);
    expect(doc.size).toEqual({ width: 1920, height: 1080 });
    await expect(render({ platform: "tv" as never })).rejects.toThrow(/platform must be one of desktop, square, mobile/);
  });

  test("64 square cells, each exactly its square: on the lattice, no inset, on every platform and contract canvas", async () => {
    for (const [w, h] of [[1920, 1080], [1080, 1080], [1080, 1920], [1280, 720], [3840, 2160], [640, 360], [480, 270]] as const) {
      const doc = await render({}, w, h);
      const squares = sourcesOf(doc).filter((s) => /^sq-[a-h][1-8]$/.test(s.editor?.label ?? ""));
      expect(squares).toHaveLength(64);
      expect(squares.filter((s) => s.placement?.inset)).toEqual([]);
    }
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1280, 720]] as const) {
      const b = chessV3Board({ x: 60, y: 60, w: 960, h: 960 }, w, h);
      const { qx, qy } = chessV3Pitch(w, h);
      expect([b.x % qx, b.y % qy, b.sq % qx, b.sq % qy].every((r) => r === 0)).toBe(true);
    }
  });

  test("at every shown moment each square shows exactly the game's piece - one layer per piece, never two", async () => {
    const doc = await render();
    const game = readChessGame(CHESS_RECAP_DEFAULT_PGN);
    const moments = chessMoments(game);
    const B = chessRecapBeats(moments.length, 2.6);
    const states = chessV3States(moments, B);
    for (const st of states) {
      for (const t of [st.a + 0.01, (st.a + st.b) / 2, st.b - 0.01]) {
        for (let sq = 0; sq < 64; sq++) {
          const name = chessSquareName(sq);
          const visible = sourcesOf(doc).filter((s) => new RegExp(`^${name}-[wb][pnbrqk]$`).test(s.editor?.label ?? "") && on(s.overlay?.enable, t));
          const want = st.board[sq] && !st.hide.includes(sq) ? `${name}-${st.board[sq]!.color}${st.board[sq]!.type}` : null;
          expect(visible.map((s) => s.editor?.label)).toEqual(want ? [want] : []);
          const lit = sourcesOf(doc).filter((s) => s.editor?.label === `lit-${name}` && on(s.overlay?.enable, t));
          expect(lit.length).toBe(st.lit.includes(sq) ? 1 : 0);
        }
      }
    }
  });

  test("a piece that never moves is one static layer; a slide moves its rect by the square offset", async () => {
    const doc = await render();
    expect(byLabel(doc, "a2-wp")?.overlay).toBeUndefined();
    // 16. Qb8+ (moment 3): b3 -> b8, five squares up, no sideways move.
    const slide = byLabel(doc, "slide-3-0")!;
    const sq = chessV3Board({ x: 0, y: 0, w: 960, h: 960 }, 1920, 1080).sq;
    expect(slide.overlay?.xExpr).toMatch(/^0\*/);
    expect(slide.overlay?.yExpr).toMatch(new RegExp(`^-${5 * sq}\\*`));
    const flipped = byLabel(await render({ orientation: "black" }), "slide-3-0")!;
    expect(flipped.overlay?.yExpr).toMatch(new RegExp(`^${5 * sq}\\*`));
    // Castling slides two rects.
    const castle = await render({ moments: "12" });
    expect(sourcesOf(castle).filter((s) => /^slide-0-/.test(s.editor?.label ?? "")).map((s) => s.editor?.label).sort()).toEqual(["slide-0-0", "slide-0-1"]);
  });

  test("the gate writer: a union of stretches, static when it covers the clip", () => {
    expect(chessV3Gate([{ a: 0, b: 15.4 }], 15.4)).toBeUndefined();
    expect(chessV3Gate([{ a: 0, b: 1.4 }, { a: 3, b: 15.4 }], 15.4)?.enable).toBe("lt(t,1.4)+gte(t,3)");
    expect(chessV3Gate([{ a: 2, b: 3 }], 15.4)).toEqual({ enable: "gte(t,2)*lt(t,3)", window: { startSec: 2, endSec: 3 } });
  });

  test("the names and the event line are editable in place through their override props", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: ChessGameRecapV3.propsSchema });
    expect(rejected).toEqual([]);
    for (const p of ["white", "black", "event"]) expect(byProp[p]?.length ?? 0).toBe(1);
    const over = await render({ white: "Magnus Carlsen", event: "Club night, round 3" });
    expect(byLabel(over, "white")?.layers?.[0]?.content?.text).toBe("Magnus Carlsen");
    expect(byLabel(over, "black")?.layers?.[0]?.content?.text).toBe("Duke Karl / Count Isouard");
    expect(byLabel(over, "event")?.layers?.[0]?.content?.text).toBe("Club night, round 3");
  });

  test("the graph is a bar per ply, the marker a rect per moment", async () => {
    const doc = await render();
    const bars = sourcesOf(doc).filter((s) => /^bar-\d+$/.test(s.editor?.label ?? ""));
    expect(bars.length).toBeGreaterThan(10);
    expect(sourcesOf(doc).filter((s) => /^marker-\d$/.test(s.editor?.label ?? ""))).toHaveLength(5);
    const long = await render({ pgn: LONG });
    expect(sourcesOf(long).filter((s) => /^bar-\d+$/.test(s.editor?.label ?? "")).length).toBeLessThanOrEqual(60);
  });

  test("the layout contract holds on every contract canvas, for the default and for long copy", async () => {
    const r = (p: Parameters<typeof ChessGameRecapV3.render>[0], ctx: MosaicEngineContext) => ChessGameRecapV3.render(p, ctx).then(asDocument);
    await sweepLayout(r, ID, { ...ChessGameRecapV3.defaultProps }, (w, h) => targetCtx(w, h));
    await sweepLayout(r, ID, { ...ChessGameRecapV3.defaultProps, pgn: LONG, board: "slate", orientation: "black", white: "A very long override name that has to shrink or wrap" }, (w, h) => targetCtx(w, h));
  });

  test("bad input fails loudly; deterministic", async () => {
    await expect(render({ pgn: "1. e4 e5 2. Ke3" })).rejects.toThrow(/chess-game-recap\/v3: move 2 for White: Ke3 is not legal here/);
    await expect(render({ moments: "99" })).rejects.toThrow(/move 99 for White is not in this game/);
    await expect(render({ white: 7 as never })).rejects.toThrow(/white must be a string/);
    expect(JSON.stringify(await render({}, 1080, 1920))).toBe(JSON.stringify(await render({}, 1080, 1920)));
  });
});
