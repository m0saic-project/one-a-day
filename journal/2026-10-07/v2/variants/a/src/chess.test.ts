import { chessMaterial, chessSquareName, chessToFen, readChessGame } from "./chess";
import { chessMoments, chessSacrifice, chessSeries } from "./story";

const OPERA = `[Event "Paris"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[White "Paul Morphy"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]
[ECO "C41"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7
8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7
14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;

const at = (fen: string, moves: string) => `[SetUp "1"]\n[FEN "${fen}"]\n\n${moves}`;

describe("chess-game-recap v2: the replay", () => {
  test("the Opera Game replays to its known final position, mate, 1-0", () => {
    const g = readChessGame(OPERA);
    expect(g.moves).toHaveLength(33);
    const last = g.moves[32];
    expect(chessToFen(last.after)).toBe("1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k -");
    expect(last.san).toBe("Rd8#");
    expect(last.checkmate).toBe(true);
    expect(g.result).toBe("1-0");
    expect(chessMaterial(last.after)).toBe(-10);
  });

  test("castling queenside moves king and rook", () => {
    const m = readChessGame(OPERA).moves[22];
    expect(m.san).toBe("O-O-O");
    expect([chessSquareName(m.from), chessSquareName(m.to), chessSquareName(m.rookFrom!), chessSquareName(m.rookTo!)]).toEqual(["e1", "c1", "a1", "d1"]);
  });

  test("both castles from a position", () => {
    const g = readChessGame(at("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "1. O-O O-O-O"));
    expect(chessToFen(g.moves[1].after)).toBe("2kr3r/8/8/8/8/8/8/R4RK1 w - -");
  });

  test("en passant removes the pawn beside, not on, the target", () => {
    const g = readChessGame("1. e4 a6 2. e5 d5 3. exd6");
    const m = g.moves[4];
    expect(m.captured?.type).toBe("p");
    expect(chessSquareName(m.capturedAt!)).toBe("d5");
    expect(chessToFen(m.after).split(" ")[0]).toBe("rnbqkbnr/1pp1pppp/p2P4/8/8/8/PPPP1PPP/RNBQKBNR");
  });

  test("a pinned knight is not a candidate, so SAN without disambiguation resolves", () => {
    const g = readChessGame(at("4k3/8/8/8/1b6/6N1/3N4/4K3 w - - 0 1", "1. Ne4"));
    expect(chessSquareName(g.moves[0].from)).toBe("g3");
  });

  test("ambiguous and illegal moves name themselves", () => {
    expect(() => readChessGame(at("8/8/8/8/8/2N3N1/8/K6k w - - 0 1", "1. Ne4"))).toThrow(/move 1 for White: Ne4 is ambiguous - 2 knights can go to e4/);
    expect(() => readChessGame("1. e4 e5 2. Ke3")).toThrow(/move 2 for White: Ke3 is not legal here/);
    expect(() => readChessGame("1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxe8")).toThrow(/move 4 for White/);
    expect(() => readChessGame("1. e4 e5 2. hello")).toThrow(/"hello" is not a chess move/);
    expect(() => readChessGame(at("8/P7/8/8/8/8/8/k6K w - - 0 1", "1. a8"))).toThrow(/names no promotion piece/);
    expect(() => readChessGame("   ")).toThrow(/the PGN is empty/);
    expect(() => readChessGame('[Event "x"]\n\n*')).toThrow(/no moves/);
  });

  test("promotion, computed check suffix, comments, evals, NAGs and variations", () => {
    const g = readChessGame(at("8/P7/8/8/8/8/8/k6K w - - 0 1", "1. a8=Q { [%eval #-0] A new queen. } $1 1-0"));
    expect(g.moves[0].san).toBe("a8=Q+");
    expect(g.moves[0].promotion).toBe("q");
    expect(g.moves[0].comment).toBe("A new queen.");
    expect(g.moves[0].nags).toEqual([1]);
    const h = readChessGame("1. e4!? { [%eval 0.3] [%clk 0:05:00] } 1... c5 (1... e5 2. Nf3) 2. Nf3 { [%eval 0.4] } *");
    expect(h.moves.map((m) => m.san)).toEqual(["e4", "c5", "Nf3"]);
    expect(h.moves[0].annotation).toBe("!?");
    expect(h.moves[0].evalPawns).toBe(0.3);
    expect(h.moves[0].comment).toBe("");
  });

  test("non-ASCII names and comments are folded for the bundled font", () => {
    const g = readChessGame('[White "Józef Dziewoński"]\n\n1. e4 { Ein gewöhnlicher Zug → gut }');
    expect(g.headers.White).toBe("Józef Dziewoński");
    expect(g.moves[0].comment).toBe("Ein gewohnlicher Zug -> gut");
  });
});

describe("chess-game-recap v2: the story", () => {
  test("the Opera Game's automatic moments are its canonical story", () => {
    const g = readChessGame(OPERA);
    const moments = chessMoments(g);
    expect(moments.map((m) => m.title)).toEqual(["10. Nxb5", "13. Rxd7", "15. Bxd7+", "16. Qb8+", "17. Rd8#"]);
    expect(moments.map((m) => m.words)).toEqual([
      "gives a knight for a pawn",
      "gives a rook for a knight",
      "takes a rook with check",
      "gives up the queen with check",
      "checkmate",
    ]);
    expect(chessSacrifice(g, g.moves[30])).toBe(9);
  });

  test("named moments: White by default, b or ... for Black, the final move always last", () => {
    const g = readChessGame(OPERA);
    expect(chessMoments(g, "4b 12").map((m) => m.title)).toEqual(["4... Bxf3", "12. O-O-O", "17. Rd8#"]);
    expect(chessMoments(g, "13...").map((m) => m.title)).toEqual(["13... Rxd7", "17. Rd8#"]);
    expect(() => chessMoments(g, "40")).toThrow(/move 40 for White is not in this game \(it ends at move 17 for White\)/);
    expect(() => chessMoments(g, "x1")).toThrow(/not a move number/);
  });

  test("the graph is material unless most plies carry an eval", () => {
    const g = readChessGame(OPERA);
    const s = chessSeries(g);
    expect(s.kind).toBe("material");
    expect(s.values).toHaveLength(34);
    expect(s.values[33]).toBe(-10);
    expect(s.max).toBe(10);
    const e = chessSeries(readChessGame("1. e4 { [%eval 0.3] } e5 { [%eval 0.2] } 2. Qh5 { [%eval -0.5] } *"));
    expect(e.kind).toBe("eval");
    expect(e.values[0]).toBe(0);
    expect(e.values[3]).toBeLessThan(0);
  });

  test("a quiet game still gets two moments", () => {
    const g = readChessGame("1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 1/2-1/2");
    const m = chessMoments(g);
    expect(m.length).toBeGreaterThanOrEqual(3);
    expect(m[m.length - 1].why).toBe("final");
  });
});
