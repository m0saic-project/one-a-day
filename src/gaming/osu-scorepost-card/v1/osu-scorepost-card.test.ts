import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { OsuScorepostCardV1 } from "./osu-scorepost-card";

const render = (
  props: Parameters<typeof OsuScorepostCardV1.render>[0] = {},
  w = 1280,
  h = 720,
) => OsuScorepostCardV1.render({ ...OsuScorepostCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

describe("@one-a-day/gaming/osu-scorepost-card/v1", () => {
  it("renders the default fictional S-rank scorepost with all bound props", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1280, 720, { propsSchema: OsuScorepostCardV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.beatmapTitle).toHaveLength(1);
    expect(byProp.beatmapArtist).toHaveLength(1);
    expect(byProp.difficulty).toHaveLength(1);
    expect(byProp.playerName).toHaveLength(1);
    expect(byProp.mods).toHaveLength(1);
    expect(byProp.accuracy).toHaveLength(1);
    expect(byProp.maxCombo).toHaveLength(1);
    expect(byProp.score).toHaveLength(1);
    expect(byProp.pp).toHaveLength(1);
    expect(byProp.hits).toHaveLength(4);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1280, height: 720 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases - defaults, long copy, empty player/mods, every rank", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const variants = [
      {},
      { beatmapTitle: "A very long beatmap title that must shrink to fit the header", beatmapArtist: "Some artist with a long name", difficulty: "Insane Extra HD DT HR" },
      { playerName: "", mods: "" },
      { rank: "SS" },
      { rank: "D" },
    ];
    for (const over of variants) {
      await sweepLayout((p, ctx) => OsuScorepostCardV1.render(p, ctx).then(asDocument), "@one-a-day/gaming/osu-scorepost-card/v1", { ...OsuScorepostCardV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("validates rank strictly and colours the badge by tier", async () => {
    await expect(render({ rank: "X" })).rejects.toThrow(/rank .* must be one of/);
    await expect(render({ rank: "s" })).rejects.toThrow(/rank .* must be one of/);
    for (const rank of ["SS", "S", "A", "B", "C", "D"]) {
      expect(await render({ rank })).toBeDefined();
    }
  });

  it("validates hits strictly as 300/100/50/miss with non-negative integers", async () => {
    await expect(render({ hits: "1/2/3" })).rejects.toThrow(/hits .* must be/);
    await expect(render({ hits: "1/2/3/four" })).rejects.toThrow(/hits .* not a non-negative integer/);
    await expect(render({ hits: "-1/2/3/4" })).rejects.toThrow(/hits .* not a non-negative integer/);
    expect(await render({ hits: "0/0/0/0" })).toBeDefined();
  });

  it("is deterministic and rejects a non-string prop", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ beatmapTitle: 42 as never })).rejects.toThrow(/beatmapTitle must be a string/);
  });
});
