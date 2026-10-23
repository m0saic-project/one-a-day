import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import type { MosaicDocument } from "@m0saic/types";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  DiscBagMatrixV1,
  normalizeDiscBagMatrix,
  numbersLine,
  speedBandIndex,
  stabBandIndex,
} from "./disc-bag-matrix";

const render = (
  props: Parameters<typeof DiscBagMatrixV1.render>[0] = {},
  w = 1920,
  h = 1080,
) => DiscBagMatrixV1.render({ ...DiscBagMatrixV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

/** Every literal text on the card (tiles carry none). */
function textsOf(doc: MosaicDocument): string[] {
  return (doc.sources ?? [])
    .filter((s) => s && s.type === "text")
    .flatMap((s) => (s.layers ?? []).map((l) => (l.content as { kind: string; text?: string }).text ?? ""))
    .filter((t) => t !== "");
}

function labelsOf(doc: MosaicDocument): string[] {
  return (doc.sources ?? []).map((s) => (s as { editor?: { label?: string } }).editor?.label ?? "");
}

/** Five discs stacked in one slot - the densest cell at the chip floor. */
const fiveDeep = (names: string[] = ["WWWWWWWWWWWWWWWWWWWW", "ABCDEFGHIJKLMNOPQRST", "Sidewinder Bottom Stamp".slice(0, 20), "Firebird Sextuple X", "Destroyer Halo Proto"]) =>
  names.map((name, i) => ({ name, speed: 1 + (i % 3), glide: 3, turn: -2, fade: 1 }));

describe("@one-a-day/sports/disc-bag-matrix/v1", () => {
  it("binds the rects that show props - Make's double-click edits them in place", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: DiscBagMatrixV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const prop of ["title", "subtitle", "accent"]) {
      expect(byProp[prop]?.length ?? 0).toBeGreaterThanOrEqual(1);
    }
    // Every chip name binds its own discs[i].name leaf.
    expect(byProp.discs?.length ?? 0).toBe(18);
    // Closed pickers never carry a rect binding - Make edits them from the panel.
    expect(byProp.chipDetail ?? []).toHaveLength(0);
    expect(byProp.preset ?? []).toHaveLength(0);
    const declared = (DiscBagMatrixV1 as unknown as { bindings?: { unbound?: Record<string, string> } }).bindings?.unbound ?? {};
    expect(Object.keys(declared).sort()).toEqual([]);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1920, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
    expect(DiscBagMatrixV1.outputHints).toMatchObject({ width: 1920, height: 1080, format: { kind: "image" } });
  });

  it("slots every disc where its flight numbers say - and the counts agree with the grid", () => {
    const m = normalizeDiscBagMatrix(DiscBagMatrixV1.defaultProps as never);
    expect(m.total).toBe(18);
    expect(m.filled).toBe(13);
    expect(m.empty).toBe(7);
    // spot-checks against the brief's table: (row band, speed band, name)
    const at = (rowName: string, cls: string) => {
      const r = stabBandIndex(rowName === "BEEF" ? 4 : rowName === "OS" ? 2 : rowName === "STABLE" ? 0 : -1);
      const c = speedBandIndex(cls === "PUTTER" ? 2 : cls === "MID" ? 5 : cls === "FAIRWAY" ? 7 : cls === "CONTROL" ? 11 : 13);
      return m.cells[r][c].map((d) => d.name);
    };
    expect(at("BEEF", "FAIRWAY")).toEqual(["Firebird"]);
    expect(at("OS", "PUTTER")).toEqual(["Berg", "Pig"]);
    expect(at("OS", "CONTROL")).toEqual(["Wraith"]);
    expect(at("STABLE", "FAIRWAY")).toEqual(["River"]);
    expect(at("US", "MID")).toEqual(["Comet", "Meteor"]);
    expect(at("US", "DISTANCE")).toEqual(["Tern"]);
    expect(at("US", "PUTTER")).toEqual([]); // the hole the picture is about
    expect(at("OS", "DISTANCE")).toEqual(["Destroyer"]);
    // stability slot is DERIVED: turn + fade
    expect(m.discs.find((d) => d.name === "Firebird")?.s).toBe(4);
    expect(m.discs.find((d) => d.name === "Tern")?.s).toBe(-1);
    // within-cell stack order: name, then input order
    expect(m.cells[1][0].map((d) => d.name)).toEqual(["Berg", "Pig"]);
  });

  it("shows the sample bag as a finished card at defaults", async () => {
    const texts = textsOf(await render());
    for (const t of [
      "Dana Kovac",
      "league bag - Oct 2026",
      "18 DISCS",
      "Aviar",
      "2 3 0 1",
      "Thunderbird",
      "9 5 0 2",
      "Firebird",
      "9 3 0 4",
      "Wraith",
      "STABILITY = TURN + FADE",
      "US FLIPS - BEEF FADES",
      "20 SLOTS - 13 FILLED - 7 EMPTY",
      "PUTTER",
      "DISTANCE",
      "BEEF",
      "US",
      "1-3",
      "12-14",
    ]) {
      expect(texts).toContain(t);
    }
    // one chip per disc, exactly once
    const names = labelsOf(await render()).filter((l) => /^chip-name-\d+$/.test(l));
    expect(names).toHaveLength(18);
    expect(new Set(names).size).toBe(18);
  });

  it("keeps its layout contract at the seven contract canvases - defaults, the copy that stresses it, and every closed-set value", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    type Props = Parameters<typeof render>[0];
    const stressed: Props = {
      title: "WWWWWWWWWWWWWWWWWWWWXXXXXXXXXXXXXXXXXXXX", // 40 characters
      subtitle: "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY", // 48 characters
      discs: [
        { name: "ABCDEFGHIJKLMNOPQRST", speed: 2, glide: 3, turn: 0, fade: 1 },
        { name: "Champion Thunderbird", speed: 5, glide: 4, turn: -1, fade: 1 },
        { name: "Destroyer Halo Proto", speed: 13, glide: 6, turn: -2, fade: 2 },
      ],
    };
    const emptied: Props = { subtitle: "", chipDetail: "name" };
    for (const over of [
      {},
      stressed,
      emptied,
      { chipDetail: "numbers" },
      { preset: "light" },
      { accent: "#2f7bff" },
    ] as Props[]) {
      await sweepLayout(
        (p, ctx) => DiscBagMatrixV1.render(p, ctx).then(asDocument),
        "@one-a-day/sports/disc-bag-matrix/v1",
        { ...DiscBagMatrixV1.defaultProps, ...over },
        (w, h) => targetCtx(w, h),
      );
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("fits a 20-char name and a 5-deep cell at the big canvases - nothing clipped, nothing ellipsized", async () => {
    const props = { ...DiscBagMatrixV1.defaultProps, discs: fiveDeep() };
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]] as const) {
      await sweepLayout((p, ctx) => DiscBagMatrixV1.render(p, ctx).then(asDocument), "@one-a-day/sports/disc-bag-matrix/v1", props, (cw, ch) => targetCtx(cw, ch), [[w, h]]);
      const texts = textsOf(await render({ discs: fiveDeep() }, w, h));
      for (const t of ["WWWWWWWWWWWWWWWWWWWW", "ABCDEFGHIJKLMNOPQRST"]) expect(texts).toContain(t);
      for (const t of texts) expect(t).not.toMatch(/\.\.\./);
    }
  });

  it("refuses a bag the grid cannot hold at the chip floor - with the count in the error", async () => {
    await expect(render({ discs: fiveDeep() }, 1920, 1080)).resolves.toBeDefined();
    const six = [...fiveDeep(), { name: "Another Mold Name 22", speed: 2, glide: 3, turn: -2, fade: 1 }];
    await expect(render({ discs: six }, 1920, 1080)).rejects.toThrow(/6 discs in one slot.*at most 5 per slot/s);
    await expect(render({ discs: six }, 640, 360)).rejects.toThrow(/discs in one slot/);
  });

  it("refuses impossible input by name", async () => {
    const three = [
      { name: "Aviar", speed: 2, glide: 3, turn: 0, fade: 1 },
      { name: "Buzzz", speed: 5, glide: 4, turn: -1, fade: 1 },
      { name: "Teebird", speed: 7, glide: 5, turn: 0, fade: 2 },
    ];
    await expect(render({ discs: [...Array(31)].map((_, i) => ({ name: `Disc ${i}`, speed: 5, glide: 4, turn: -1, fade: 1 })) })).rejects.toThrow(/has 31 entries; the card holds 3 to 30/);
    await expect(render({ discs: three.slice(0, 1) })).rejects.toThrow(/has 1 entries/);
    await expect(render({ discs: [{ name: "x".repeat(21), speed: 2, glide: 3, turn: 0, fade: 1 }, ...three.slice(1)] })).rejects.toThrow(/discs entry 1 name/);
    await expect(render({ title: "" })).rejects.toThrow(/title/);
    await expect(render({ title: "Bag Of Jo\u00e9" })).rejects.toThrow(/title/);
    await expect(render({ discs: [{ name: "Aviar", speed: 15, glide: 3, turn: 0, fade: 1 }, ...three.slice(1)] })).rejects.toThrow(/discs entry 1 speed must be from 1 to 14/);
    await expect(render({ discs: [{ name: "Aviar", speed: 2, glide: 3, turn: -6, fade: 1 }, ...three.slice(1)] })).rejects.toThrow(/discs entry 1 turn/);
    await expect(render({ discs: [{ name: "Aviar", speed: 2, glide: 3, turn: 0, fade: 6 }, ...three.slice(1)] })).rejects.toThrow(/discs entry 1 fade/);
    await expect(render({ discs: [{ name: "Aviar", spedd: 2, glide: 3, turn: 0, fade: 1 } as never, ...three.slice(1)] })).rejects.toThrow(/unknown field 'spedd'; did you mean 'speed'\?/);
    await expect(render({ chipDetail: "both" as never })).rejects.toThrow(/chipDetail/);
    await expect(render({ preset: "sepia" as never })).rejects.toThrow(/preset/);
    await expect(render({ accent: "#e8b33" })).rejects.toThrow(/accent/);
    await expect(render({ titel: "Dana" } as never)).rejects.toThrow(/unknown prop 'titel'; did you mean 'title'\?/);
  });

  it("is deterministic and derives the copy", async () => {
    expect(await render()).toEqual(await render());
    expect(numbersLine({ speed: 9, glide: 5, turn: -1, fade: 2 })).toBe("9 5 -1 2");
    expect(speedBandIndex(1)).toBe(0);
    expect(speedBandIndex(14)).toBe(4);
    expect(stabBandIndex(-3)).toBe(3);
    expect(stabBandIndex(4)).toBe(0);
    const m = normalizeDiscBagMatrix({ ...DiscBagMatrixV1.defaultProps, chipDetail: "name", preset: "light" });
    expect(m.chipDetail).toBe("name");
    expect(m.preset).toBe("light");
  });
});
