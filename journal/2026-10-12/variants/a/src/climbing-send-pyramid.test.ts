import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { sweepLayout } from "../../../_shared/layout";
import {
  ClimbingSendPyramidV1 as T,
  layoutPyramid,
  normalizePyramid,
} from "./climbing-send-pyramid";
import type { ClimbingSendPyramidProps, GradeRow } from "./climbing-send-pyramid";

const ID = "@one-a-day/sports/climbing-send-pyramid/v1";
const render = (p: ClimbingSendPyramidProps = {}, w = 1080, h = 1080) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: ClimbingSendPyramidProps, w = 1080, h = 1080) =>
  Object.fromEntries(layoutPyramid(p, w, h).cells.map((c) => [c.label, c.text]));

const LONG: ClimbingSendPyramidProps = {
  climber: "Maximiliana Wolfeschlegelstein-Hart",
  place: "New River Gorge, October session notes",
  discipline: "trad",
  grades: [
    { grade: "5.13a", sends: 1, flashes: 0 },
    { grade: "5.12d", sends: 2, flashes: 1 },
    { grade: "5.12c", sends: 4, flashes: 1 },
    { grade: "5.12b", sends: 6, flashes: 2 },
    { grade: "5.12a", sends: 9, flashes: 3 },
    { grade: "5.11d", sends: 14, flashes: 4 },
    { grade: "5.11c", sends: 20, flashes: 6 },
    { grade: "5.11b", sends: 28, flashes: 9 },
  ],
};

describe(ID, () => {
  it("shows a pyramid at its defaults: invented climber, eight grades, widest at the base", () => {
    const t = textOf({});
    expect(t).toMatchObject({
      climber: "Mara Ellison",
      place: "Red River Gorge, fall 2026",
      discipline: "SPORT",
      total: "65 clean sends",
      "grade-0": "5.12a",
      "count-0": "1",
      "grade-1": "5.11d",
      "count-1": "2",
      "flash-1": "(1)",
      "grade-7": "5.10b",
      "count-7": "18",
      "flash-7": "(7)",
      footnote: "Width = clean sends. Cap = flash or onsight. Hardest on top.",
    });
    expect(T.outputHints).toMatchObject({ width: 1080, height: 1080, format: { kind: "image" } });
    const L = layoutPyramid({}, 1080, 1080);
    expect(L.total).toBe(65);
    expect(L.maxSends).toBe(18);
    const widths = L.bars.map((b) => b.rect.w);
    expect(widths[0]).toBeLessThan(widths[7]);
    for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]);
    const track = L.tiles.find((tile) => tile.label === "track-0")!;
    for (const bar of L.bars) {
      const mid = bar.rect.x + bar.rect.w / 2;
      expect(Math.abs(mid - (track.rect.x + track.rect.w / 2))).toBeLessThanOrEqual(1);
    }
    expect(L.bars[0].cap).toBeNull();
    const capped = L.bars[7];
    expect(capped.cap).not.toBeNull();
    expect(capped.cap!.w).toBe(Math.round((capped.rect.w * 7) / 18));
  });

  it("sums sends and refuses a flash count past the sends, a duplicate, a short list, or an empty pyramid", () => {
    const rows = normalizePyramid({}).grades;
    expect(rows.reduce((s, g) => s + g.sends, 0)).toBe(65);
    const bad: Array<[string, ClimbingSendPyramidProps]> = [
      ["flashes", { grades: [{ grade: "V4", sends: 2, flashes: 3 }, { grade: "V3", sends: 4, flashes: 0 }, { grade: "V2", sends: 6, flashes: 1 }] }],
      ["duplicates", { grades: [{ grade: "V4", sends: 1, flashes: 0 }, { grade: "V4", sends: 2, flashes: 0 }, { grade: "V2", sends: 3, flashes: 0 }] }],
      ["needs 3", { grades: [{ grade: "V4", sends: 1 }, { grade: "V2", sends: 4 }] }],
      ["at least one send", { grades: [{ grade: "V4", sends: 0 }, { grade: "V3", sends: 0 }, { grade: "V2", sends: 0 }] }],
    ];
    for (const [needle, props] of bad) {
      expect(() => normalizePyramid(props)).toThrow(new RegExp(needle));
    }
  });

  it("keeps the caller's order and drops the place line when it is empty", () => {
    const grades: GradeRow[] = [
      { grade: "V8", sends: 1, flashes: 0 },
      { grade: "V4", sends: 3, flashes: 1 },
      { grade: "V2", sends: 9, flashes: 4 },
    ];
    expect(textOf({ grades, place: "", discipline: "boulder" })["grade-0"]).toBe("V8");
    expect(textOf({ grades, place: "" }).place).toBeUndefined();
    expect(textOf({ grades, place: "" }).total).toBe("13 clean sends");
    expect(textOf({ grades, place: "", discipline: "boulder" }).discipline).toBe("BOULDER");
  });

  it("binds the name, the chip, the inks and each grade row", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.climber).toHaveLength(1);
    expect(byProp.place).toHaveLength(1);
    expect(byProp.discipline).toBeUndefined();
    expect(byProp.accent.length).toBeGreaterThan(0);
    expect(byProp.cap.length).toBeGreaterThan(0);
    expect(byProp.grades.length).toBeGreaterThanOrEqual(8);
  });

  it("is a still, deterministic, and rejects a grade that is not a label", async () => {
    expect(await render()).toEqual(await render());
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
    await expect(render({ climber: 4 as never })).rejects.toThrow(/climber/);
    await expect(render({ discipline: "ice" as never })).rejects.toThrow(/discipline/);
  });

  it("keeps its layout contract at the seven contract canvases", async () => {
    for (const over of [{}, LONG, { place: "" }, { preset: "light" as const, cap: "#c45c26" }]) {
      await sweepLayout((p, ctx) => T.render(p, ctx).then(asDocument), ID, { ...T.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
  });
});
