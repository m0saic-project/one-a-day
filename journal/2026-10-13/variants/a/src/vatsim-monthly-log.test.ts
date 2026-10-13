import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { VatsimMonthlyLogV1, layoutVatsimLogCard, normalizeVatsimLog } from "./vatsim-monthly-log";

const render = (
  props: Parameters<typeof VatsimMonthlyLogV1.render>[0] = {},
  w = 1920,
  h = 1080,
) => VatsimMonthlyLogV1.render({ ...VatsimMonthlyLogV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

describe("@one-a-day/gaming/vatsim-monthly-log/v1", () => {
  it("binds the pilot, month, airline, footer and every row cell to its line", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: VatsimMonthlyLogV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.pilot).toHaveLength(1);
    expect(byProp.month).toHaveLength(1);
    expect(byProp.airline).toHaveLength(1);
    expect(byProp.footer).toHaveLength(1);
    expect(byProp.rows).toHaveLength(70); // 10 rows x 7 columns
  });

  it("computes every total from the rows - nothing typed twice", () => {
    const L = normalizeVatsimLog({});
    // independent recomputation of the default September
    const mins = L.rows.reduce((s, r) => s + r.hours * 60 + r.minutes, 0);
    expect(L.flightsText).toBe(String(L.rows.length));
    expect(L.hoursText).toBe((mins / 60).toFixed(1));
    expect(L.hoursText).toBe("30.7");
    expect(L.longestText).toBe("7:42");
    expect(L.longestSector).toBe("KIAH-MMGL");
    const vs = L.rows.map((r) => r.vs).filter((v): v is number => v !== null);
    expect(L.avgVsText).toBe(String(Math.round(vs.reduce((s, v) => s + v, 0) / vs.length)));
    // the milestone bar: career + the MONTH'S COMPUTED hours, never a typed total
    const career = 415 + mins / 60;
    expect(L.careerText).toBe(career.toFixed(1));
    expect(L.milestoneText).toBe("500");
    expect(L.toGoText).toBe((500 - career).toFixed(1));
    expect(L.fillFrac).toBeCloseTo((career - 400) / 100, 10);
  });

  it("excludes -- values from the average and keeps them in the table", () => {
    const one = "01 Sep | DL13 | KRIC-KCMH | A319 | 02:22 | -- | --";
    const L = normalizeVatsimLog({ rows: [one], careerHours: 0 });
    expect(L.avgVsText).toBe("--");
    expect(L.cells[0].vs).toBe("--");
    expect(L.cells[0].score).toBe("--");
    const L2 = normalizeVatsimLog({ rows: [one, "02 Sep | DL13 | KCMH-KRIC | A319 | 01:00 | -300 | 95"] });
    expect(L2.avgVsText).toBe("-300");
  });

  it("refuses a bad row by name, not a clipped card", () => {
    expect(() => normalizeVatsimLog({ rows: new Array(11).fill("01 Sep | DL13 | KRIC-KCMH | A319 | 01:00 | -100 | 95") }))
      .toThrow(/up to 10 PIREPs/);
    expect(() => normalizeVatsimLog({ rows: ["01 Sep | DL13 | KRIC-KCMH | A319 | 01:00 | -100"] }))
      .toThrow(/has 6 fields/);
    expect(() => normalizeVatsimLog({ rows: ["01 Sep | DL13 | KRIC-KCMH | A319 | 1:75 | -100 | 95"] }))
      .toThrow(/block/);
    expect(() => normalizeVatsimLog({ rows: ["01 Sep | DL13 | KRIC-KCMH | A319 | 01:00 | +100 | 95"] }))
      .toThrow(/touchdown/);
    expect(() => normalizeVatsimLog({ rows: ["32 Sep | DL13 | KRIC-KCMH | A319 | 01:00 | -100 | 95"] }))
      .toThrow(/date/);
    expect(() => normalizeVatsimLog({ rows: ["01 Sep | DL13 | KRIC→KCMH | A319 | 01:00 | -100 | 95"] }))
      .toThrow(/bundled font/);
    expect(() => normalizeVatsimLog({ careerHours: 415.5 })).toThrow(/whole number/);
  });

  it("clamps the milestone fill inside the next hundred", () => {
    const L = normalizeVatsimLog({ careerHours: 495, rows: ["01 Sep | DL13 | KRIC-KCMH | A319 | 02:22 | -100 | 95"] });
    expect(L.careerText).toBe("497.4");
    expect(L.milestoneText).toBe("500");
    expect(L.fillFrac).toBeCloseTo(0.9736666666666667, 10);
    const landed = normalizeVatsimLog({ careerHours: 498, rows: ["01 Sep | DL13 | KRIC-KCMH | A319 | 02:00 | -100 | 95"] });
    expect(landed.careerText).toBe("500.0");
    expect(landed.milestoneText).toBe("600");
    expect(landed.fillFrac).toBe(0);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1920, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [
      {},
      { rows: ["01 Sep | DL1701/C.PF | KRIC-KSMF | B763 | 15:59 | -2000 | 100"] },
      { pilot: "Pilot at the maximum allowed length here", airline: "", footer: "" },
      { careerHours: 0 },
    ]) {
      await sweepLayout((p, ctx) => VatsimMonthlyLogV1.render(p, ctx).then(asDocument), "@one-a-day/gaming/vatsim-monthly-log/v1", { ...VatsimMonthlyLogV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("stacks the same sections on portrait and square - tiles over the log over the bar", () => {
    const order = (W: number, H: number) => {
      const L = layoutVatsimLogCard({}, W, H);
      const y = (label: string) => L.tiles.find((t) => t.label === label)!.rect.y;
      expect(y("tile-0")).toBeLessThan(y("row-0"));
      expect(y("row-9")).toBeLessThan(y("milestone-bar"));
      return [y("milestone-bar"), y("row-9")];
    };
    order(1080, 1920);
    order(1080, 1080);
  });

  it("is deterministic and rejects props of the wrong kind", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ pilot: 42 as never })).rejects.toThrow(/must be a string/);
    await expect(render({ rows: "01 Sep | DL13 | KRIC-KCMH | A319 | 01:00 | -100 | 95" as never })).rejects.toThrow(/must be a list/);
  });
});
