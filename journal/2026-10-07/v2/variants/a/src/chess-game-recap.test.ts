import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { sweepLayout } from "../../../_shared/layout";
import { widthOf } from "../../../_shared/text";
import { readChessGame } from "./chess";
import {
  CHESS_RECAP_DEFAULT_PGN,
  ChessGameRecapV2,
  chessRecapBeats,
  chessRecapCopy,
  chessRecapLayout,
  chessSmoothDown,
} from "./chess-game-recap";
import { chessMoments } from "./story";

const ID = "@one-a-day/sports/chess-game-recap/v2";

const render = (props: Parameters<typeof ChessGameRecapV2.render>[0] = {}, w = 1920, h = 1080, ctx?: MosaicEngineContext) =>
  ChessGameRecapV2.render({ ...ChessGameRecapV2.defaultProps, ...props }, ctx ?? targetCtx(w, h)).then(asDocument);

type Src = { type?: string; assetId?: string; editor?: { label?: string }; overlay?: { enable?: string; xExpr?: string; yExpr?: string; window?: { startSec?: number; endSec?: number } }; layers?: Array<{ content?: { text?: string } }> };
const sourcesOf = (doc: MosaicDocument) => (doc.sources ?? []) as Src[];
const childOf = (doc: MosaicDocument, key: string) => (doc.children as Record<string, MosaicDocument>)[key];
const textOf = (doc: MosaicDocument, label: string) => sourcesOf(doc).find((s) => s.editor?.label === label)?.layers?.[0]?.content?.text;

/** A gate the template writes, at clip time t: `gte*lt`, `lt+gte`, or the entrance-composed `gte*lt` inside a product. */
function on(enable: string | undefined, t: number): boolean {
  if (enable === undefined) return true;
  let m = /lt\(t,([\d.]+)\)\+gte\(t,([\d.]+)\)/.exec(enable);
  if (m) return t < Number(m[1]) || t >= Number(m[2]);
  const lo = [...enable.matchAll(/gte\(t,([\d.]+)\)/g)].map((x) => Number(x[1]));
  const hi = [...enable.matchAll(/(?<!g)lt\(t,([\d.]+)\)/g)].map((x) => Number(x[1]));
  m = null;
  return lo.every((a) => t >= a) && hi.every((b) => t < b);
}

const OPERA_FINAL = "Rd8#";
const LONG = `[White "Maximilian Alexander von Wittelsbach-Zweibrucken"]\n[Black "Bartholomew Montgomery-Fitzwilliam III"]\n[WhiteElo "2712"]\n[BlackElo "2698"]\n[WhiteRatingDiff "+6"]\n[BlackRatingDiff "-6"]\n[Event "Rated Classical game, round 7 of the club championship"]\n[Date "2026.10.04"]\n[TimeControl "5400+30"]\n[Result "1-0"]\n[Termination "Normal"]\n[Opening "Sicilian Defense: Najdorf Variation, English Attack, Anti-English"]\n[ECO "B90"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 b4 13. Ne2 Ne8 14. f4 a5 15. f5 a4 16. Nbd4 exd4 17. Nxd4 b3 18. Kb1 bxc2+ 19. Nxc2 Bb3 20. axb3 axb3 21. Na3 Ne5 22. Qc3 Rxa3 23. bxa3 Qa5 24. Qxa5 1-0`;

describe("chess-game-recap v2", () => {
  test("the copy reads the Opera Game's headers", () => {
    const c = chessRecapCopy(readChessGame(CHESS_RECAP_DEFAULT_PGN));
    expect(c).toEqual({
      event: "Paris, 1858",
      eventShorter: ["1858"],
      white: "Paul Morphy",
      black: "Duke Karl / Count Isouard",
      whiteElo: "",
      blackElo: "",
      result: "1-0",
      ending: "checkmate on move 17",
      opening: "C41 Philidor Defense",
    });
    const l = chessRecapCopy(readChessGame(LONG));
    expect(l.whiteElo).toBe("2712 (+6)");
    expect(l.event).toBe("Rated Classical game, round 7 of the club championship, 4 Oct 2026, 90+30");
    expect(l.ending).toBe("White wins, move 24");
    const cc = chessRecapCopy(readChessGame('[ECOUrl "https://www.chess.com/openings/Sicilian-Defense-Old-Sicilian-Variation-3.d4"]\n[TimeControl "180+2"]\n[Termination "Hikaru won on time"]\n[Result "1-0"]\n\n1. e4 c5 1-0'));
    expect(cc.opening).toBe("Sicilian Defense Old Sicilian Variation");
    expect(cc.ending).toBe("White wins on time, move 1");
  });

  test("the beats: cold open, one slot a moment, a held ending; a pin re-spaces them", () => {
    const b = chessRecapBeats(5, 2.6);
    expect(b.total).toBe(15.4);
    expect(b.slots[0].start).toBe(1.4);
    expect(b.slots[4].end).toBe(15.4);
    for (const s of b.slots) expect(s.start < s.slide && s.slide < s.settle && s.settle < s.end).toBe(true);
    const p = chessRecapBeats(5, 2.6, 30000);
    expect(p.total).toBe(30);
    expect(p.slots[4].end).toBe(30);
    expect(ChessGameRecapV2.resolveOutputHints?.(ChessGameRecapV2.defaultProps)).toEqual({ durationMs: 15400 });
    expect(ChessGameRecapV2.outputHints?.durationMs).toBe(15400);
  });

  test("frame 0 is the finished card: final board, final graph, final caption", async () => {
    const doc = await render();
    expect(doc.durationMs).toBe(15400);
    const board = childOf(doc, "board");
    const visibleAt = (d: MosaicDocument, t: number) => sourcesOf(d).filter((s) => on(s.overlay?.enable, t)).map((s) => s.editor?.label);
    expect(visibleAt(board, 0)).toEqual(["board-final"]);
    expect(visibleAt(childOf(doc, "graph"), 0)).toEqual(["graph-final"]);
    const captions = sourcesOf(doc).filter((s) => /^title-/.test(s.editor?.label ?? "") && on(s.overlay?.enable, 0));
    expect(captions.map((s) => s.layers?.[0]?.content?.text)).toEqual([`17. ${OPERA_FINAL}`]);
    expect(textOf(doc, "white")).toBe("Paul Morphy");
    expect(textOf(doc, "result")).toBe("1-0");
  });

  test("each moment slides its piece from the from-square to the to-square, then the board after it", async () => {
    const doc = await render({}, 1920, 1080);
    const board = childOf(doc, "board");
    const S = board.size!.width;
    const b = chessRecapBeats(5, 2.6);
    // Moment 3 is 16. Qb8+ (index 3): the queen goes b3 -> b8, five squares up.
    const slider = sourcesOf(board).find((s) => s.editor?.label === "slide-3-0")!;
    expect(slider.overlay?.xExpr).toMatch(/^0\*/);
    expect(slider.overlay?.yExpr).toMatch(new RegExp(`^-${((5 * S) / 8).toFixed(3).replace(/\.?0+$/, "")}\\*`));
    const s3 = b.slots[3];
    const visibleAt = (t: number) => sourcesOf(board).filter((s) => on(s.overlay?.enable, t)).map((s) => s.editor?.label);
    expect(visibleAt((s3.slide + s3.settle) / 2)).toEqual(expect.arrayContaining(["board-before-3", "slide-3-0"]));
    expect(visibleAt((s3.settle + s3.end) / 2)).toEqual(expect.arrayContaining(["board-after-3"]));
    expect(visibleAt((s3.settle + s3.end) / 2)).not.toContain("slide-3-0");
    // Castling slides two pieces: 12. O-O-O as a named moment.
    const castle = await render({ moments: "12" });
    expect(sourcesOf(childOf(castle, "board")).filter((s) => /^slide-0-/.test(s.editor?.label ?? "")).map((s) => s.editor?.label)).toEqual(["slide-0-0", "slide-0-1"]);
  });

  test("black at the bottom flips the slide", async () => {
    const doc = await render({ orientation: "black" });
    const slider = sourcesOf(childOf(doc, "board")).find((s) => s.editor?.label === "slide-3-0")!;
    expect(slider.overlay?.yExpr).not.toMatch(/^-/);
  });

  test("child canvases are 5-smooth and the board is square", async () => {
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080], [480, 270]] as const) {
      const doc = await render({}, w, h);
      for (const key of ["board", "graph"]) {
        const c = childOf(doc, key);
        for (const n of [c.size!.width, c.size!.height]) expect(chessSmoothDown(n)).toBe(n);
      }
      expect(childOf(doc, "board").size!.width).toBe(childOf(doc, "board").size!.height);
    }
  });

  test("long names, a long event and a long opening still fit; captions share one size", () => {
    const g = readChessGame(LONG);
    const moments = chessMoments(g);
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080], [480, 270]] as const) {
      const L = chessRecapLayout(chessRecapCopy(g), moments, "material", w, h);
      for (const b of [L.white, L.black]) expect(b.width).toBeLessThanOrEqual(Math.floor(b.rect.w * 0.94 - 2) + 0.5);
      expect(new Set(L.titles.map((t) => t.px)).size).toBe(1);
      for (const t of L.titles) expect(widthOf(t.text, t.px, true)).toBeLessThanOrEqual(Math.floor(t.rect.w * 0.94 - 2) + 0.5);
    }
  });

  test("the layout contract holds on every contract canvas, for the default and for long copy", async () => {
    const r = (p: Parameters<typeof ChessGameRecapV2.render>[0], ctx: MosaicEngineContext) => ChessGameRecapV2.render(p, ctx).then(asDocument);
    await sweepLayout(r, ID, { ...ChessGameRecapV2.defaultProps }, (w, h) => targetCtx(w, h));
    await sweepLayout(r, ID, { ...ChessGameRecapV2.defaultProps, pgn: LONG, board: "slate", orientation: "black" }, (w, h) => targetCtx(w, h));
  });

  test("bad input fails loudly, naming the move or the prop", async () => {
    await expect(render({ pgn: "1. e4 e5 2. Ke3" })).rejects.toThrow(/chess-game-recap\/v2: move 2 for White: Ke3 is not legal here/);
    await expect(render({ pgn: "   " })).rejects.toThrow(/the PGN is empty/);
    await expect(render({ moments: "99" })).rejects.toThrow(/move 99 for White is not in this game/);
    await expect(render({ board: "pink" as never })).rejects.toThrow(/board must be one of walnut, green, slate/);
    await expect(render({ momentSec: 0.5 })).rejects.toThrow(/momentSec must be a number of seconds from 1.5 to 6/);
  });

  test("deterministic: two renders are identical", async () => {
    const a = JSON.stringify(await render({}, 1080, 1920));
    const b = JSON.stringify(await render({}, 1080, 1920));
    expect(a).toBe(b);
  });
});
