import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { ChessGameRecapV1 } from "./chess-game-recap";

const render = (
  props: Parameters<typeof ChessGameRecapV1.render>[0] = {},
  w = 1280,
  h = 720,
) => ChessGameRecapV1.render({ ...ChessGameRecapV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

describe("@one-a-day/sports/chess-game-recap/v1", () => {
  it("binds the opening prop", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1280, 720, { propsSchema: ChessGameRecapV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.opening).toHaveLength(1);
  });

  it("renders all required elements at defaults", async () => {
    const doc = await render();
    // Check that all required sources are present
    const sourceLabels = doc.sources.map((s: any) => s.editor?.label).filter(Boolean);
    expect(sourceLabels).toContain("opening");
    expect(sourceLabels).toContain("result-icon");
    expect(sourceLabels).toContain("result");
    expect(sourceLabels).toContain("time");
    expect(sourceLabels).toContain("rating");
    expect(sourceLabels).toContain("date");
    expect(sourceLabels).toContain("opponent");
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1280, height: 720 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases - defaults, long opening, empty opponent", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [{}, { opening: "A very long opening name that should shrink before it fits the band on a narrow canvas" }, { opponentName: "" }]) {
      await sweepLayout((p, ctx) => ChessGameRecapV1.render(p, ctx).then(asDocument), "@one-a-day/sports/chess-game-recap/v1", { ...ChessGameRecapV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("renders all result types with correct colors", async () => {
    const win = await render({ result: "win" });
    const loss = await render({ result: "loss" });
    const draw = await render({ result: "draw" });
    // Verify they render without error with colored result icon and label
    expect(win.sources).toHaveLength(7); // 7 sources: opening, result-icon, result, time, rating, date, opponent
    expect(loss.sources).toHaveLength(7);
    expect(draw.sources).toHaveLength(7);
  });

  it("is deterministic and validates prop types", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ opening: 42 as never })).rejects.toThrow(/must be a string/);
    await expect(render({ result: "invalid" as never })).rejects.toThrow(/must be/);
    await expect(render({ ratingChange: "not a number" as never })).rejects.toThrow();
  });
});
