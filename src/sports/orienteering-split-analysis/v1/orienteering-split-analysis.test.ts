import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  DEFAULT_LEGS,
  OrienteeringSplitAnalysisV1 as T,
  formatSplitTime,
  layoutSplitCard,
  normalizeSplitCard,
  parseSplitTime,
} from "./orienteering-split-analysis";
import type { OrienteeringLeg, OrienteeringSplitAnalysisProps } from "./orienteering-split-analysis";

const ID = "@one-a-day/sports/orienteering-split-analysis/v1";
const render = (p: OrienteeringSplitAnalysisProps = {}, w = 1280, h = 720) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: OrienteeringSplitAnalysisProps, w = 1280, h = 720) =>
  Object.fromEntries(layoutSplitCard(p, w, h).cells.map((c) => [c.label, c.text]));

/** An 18-leg long-course stress list. */
const eighteen: OrienteeringLeg[] = [
  { control: "1", split: "4:08", loss: "0:47" },
  { control: "2", split: "2:41", loss: "0:00" },
  { control: "3", split: "3:15", loss: "0:00" },
  { control: "4", split: "2:58", loss: "0:00" },
  { control: "5", split: "5:22", loss: "1:20" },
  { control: "6", split: "3:40", loss: "0:00" },
  { control: "7", split: "1:32", loss: "0:00" },
  { control: "8", split: "4:05", loss: "0:00" },
  { control: "9", split: "3:51", loss: "0:51" },
  { control: "10", split: "2:44", loss: "0:00" },
  { control: "11", split: "3:33", loss: "0:00" },
  { control: "12", split: "4:11", loss: "0:00" },
  { control: "13", split: "2:55", loss: "0:00" },
  { control: "14", split: "3:02", loss: "0:00" },
  { control: "15", split: "4:30", loss: "0:00" },
  { control: "16", split: "2:20", loss: "0:00" },
  { control: "17", split: "3:48", loss: "0:00" },
  { control: "F", split: "1:55", loss: "0:00" },
];

const fourLegs: OrienteeringLeg[] = [
  { control: "1", split: "3:10", loss: "0:00" },
  { control: "2", split: "2:50", loss: "0:00" },
  { control: "3", split: "3:40", loss: "0:25" },
  { control: "F", split: "1:10", loss: "0:00" },
];

const longClub: OrienteeringSplitAnalysisProps = {
  name: "Maximiliana Wolfeschlegelstein",
  club: "Ytterhogdals IK Orientering",
  className: "D21E",
  course: "Long distance, 9.8 km, 24 controls",
};

const lastLegMistake: OrienteeringSplitAnalysisProps = {
  splits: DEFAULT_LEGS.map((s, i) => (i === DEFAULT_LEGS.length - 1 ? { ...s, loss: "0:47" } : s)),
};

describe(ID, () => {
  it("shows the sample card at defaults: finish hero, place chip, pink mistakes, computed footer", () => {
    const t = textOf({});
    expect(t.name).toBe("Emma Lindqvist");
    expect(t.club).toBe("OK Klyftamo");
    expect(t.class).toBe(" \u00b7 W21E");
    expect(t.course).toBe("Middle, 4.2 km");
    expect(t.finish).toBe("45:02");
    expect(t["finish-label"]).toBe("FINISH");
    expect(t["place-label"]).toBe("PLACE");
    expect(t.place).toBe("#12");
    expect(t.behind).toBe("+1:23");
    for (const ctrl of ["1", "2", "5", "9", "F"]) {
      const i = DEFAULT_LEGS.findIndex((s) => s.control === ctrl);
      expect(t[`ctrl-${i}`]).toBe(ctrl);
    }
    expect(t["split-0"]).toBe("4:08");
    expect(t["split-6"]).toBe("1:32");
    expect(t["loss-0"]).toBe("+0:47");
    expect(t["loss-4"]).toBe("+1:20");
    expect(t["loss-8"]).toBe("+0:51");
    expect(t["split-1"]).toBe("2:41");
    expect(t["time-wo"]).toBe("42:04");
    expect(t["total-loss"]).toBe("+2:58");
    expect(t["best-leg"]).toBe("1:32");
    expect(t["split-4"]).toBe("5:22");
  });

  it("computes the footer from the entered numbers and never from the split sum", () => {
    const n = normalizeSplitCard({});
    expect(n.totalLossSec).toBe(178);
    expect(n.totalLossText).toBe("+2:58");
    expect(n.timeWoText).toBe("42:04");
    expect(n.bestText).toBe("1:32");
    expect(n.slowestSec).toBe(322);
    // finish is printed as entered, not checked against the split sum
    expect(n.finish).toBe("45:02");
    expect(n.legs.filter((l) => l.isMistake).length).toBe(3);
    expect(formatSplitTime(n.finishSec - n.totalLossSec)).toBe("42:04");
  });

  it("draws a shared tape: bar length = split / slowest, mistake legs pink, clean legs neutral and blank", () => {
    const L = layoutSplitCard({}, 1280, 720);
    const rail = L.tiles.find((t) => t.label === "rail-0")!;
    expect(rail.rect.w / 1280).toBeGreaterThanOrEqual(0.32);
    const bars = L.p.legs.map((_, i) => L.tiles.find((t) => t.label === `bar-${i}`)!);
    for (const b of bars) expect(b.rect.w).toBeGreaterThanOrEqual(1);
    // slowest leg (index 4, 5:22) fills the track
    expect(bars[4].rect.w).toBeGreaterThanOrEqual(bars[0].rect.w);
    expect(bars[4].rect.w).toBeGreaterThanOrEqual(bars[6].rect.w);
    for (const leg of L.p.legs) {
      const b = L.tiles.find((t) => t.label === `bar-${leg.index}`)!;
      if (leg.isMistake) expect(b.color).toBe(L.p.accent);
      else expect(b.color).not.toBe(L.p.accent);
    }
    // clean legs leave the loss cell blank
    expect(L.cells.some((c) => c.label === "loss-1")).toBe(false);
    expect(L.cells.some((c) => c.label === "loss-0")).toBe(true);
    const finish = L.cells.find((c) => c.label === "finish")!;
    for (const c of L.cells) if (c.label !== "finish") expect(c.px).toBeLessThan(finish.px);
  });

  it("parses compact times and refuses decimals, hours in a loss, and over-long times", () => {
    expect(parseSplitTime("4:08")).toBe(248);
    expect(parseSplitTime("45:02")).toBe(2702);
    expect(parseSplitTime("1:11:40")).toBe(4300);
    expect(formatSplitTime(248)).toBe("4:08");
    expect(formatSplitTime(178)).toBe("2:58");
    expect(formatSplitTime(2524)).toBe("42:04");
    for (const bad of ["", "4:8", "4:60", "45:02.5", "abc", "4.20"]) expect(parseSplitTime(bad)).toBeNull();
  });

  it("keeps the finish the hero and the contract at the seven canvases, including the stress copy", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [
      {},
      { preset: "light" },
      { place: 0 },
      { name: "", club: "", className: "", course: "" },
      { behind: "" },
      longClub,
      { ...longClub, preset: "light", accent: "#2f6f62" },
      { splits: fourLegs },
      lastLegMistake,
      { splits: DEFAULT_LEGS.map((s, i) => (i === 4 ? { ...s, loss: "0:00" } : s)) },
    ] as OrienteeringSplitAnalysisProps[]) {
      await sweepLayout((p, ctx) => T.render(p, ctx).then(asDocument), ID, over, (w, h) => targetCtx(w, h));
    }
    // an 18-leg course fits everywhere but the 480x270 floor
    await sweepLayout(
      (p, ctx) => T.render(p, ctx).then(asDocument),
      ID,
      { splits: eighteen },
      (w, h) => targetCtx(w, h),
      CONTRACT_CANVASES.filter(([w, h]) => !(w === 480 && h === 270)),
    );
    await expect(render({ splits: eighteen }, 480, 270)).rejects.toThrow(/leg rows|floor/);
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
    const ev = evaluateM0(String((await render()).m0), { width: 1280, height: 720 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("binds every prop-driven string and keeps the page colour off the canvas rect", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1280, 720, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.name).toHaveLength(1);
    expect(byProp.club).toHaveLength(1);
    expect(byProp.className).toHaveLength(1);
    expect(byProp.course).toHaveLength(1);
    expect(byProp.finish).toHaveLength(1);
    expect(byProp.place).toHaveLength(1);
    expect(byProp.behind).toHaveLength(1);
    expect(byProp.accent.length).toBeGreaterThanOrEqual(1);
    // 13 legs: control + split on every leg, loss only on the three mistakes
    expect(byProp.splits.length).toBe(13 + 13 + 3);
    expect(doc.backgroundColor).toBe("#14111d");
    expect((await render({ preset: "light" })).backgroundColor).toBe("#f6f2ef");
    const noChip = await render({ place: 0, behind: "", name: "", club: "", className: "", course: "" });
    const kept = resolvePropBindings(noChip, 1280, 720, { propsSchema: T.propsSchema });
    expect(kept.rejected).toEqual([]);
    expect(kept.byProp.place).toBeUndefined();
    expect(kept.byProp.behind).toBeUndefined();
    expect(kept.byProp.finish).toHaveLength(1);
  });

  it("is deterministic and fails fast, naming the field", async () => {
    expect(await render()).toEqual(await render());
    const bad = async (p: OrienteeringSplitAnalysisProps, field: string) => {
      await expect(render(p)).rejects.toThrow(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    };
    await bad({ finish: "45:02.5" }, "finish");
    await bad({ finish: "abc" }, "finish");
    await bad({ finish: "100:00:00" }, "finish");
    await bad({ splits: DEFAULT_LEGS.slice(0, 3) }, "splits");
    await bad({ splits: [...DEFAULT_LEGS, ...DEFAULT_LEGS.slice(0, 6)] }, "splits");
    await bad({ splits: DEFAULT_LEGS.map((s, i) => (i === 0 ? { ...s, loss: "1:00:00" } : s)) }, "splits[0].loss");
    await bad({ splits: DEFAULT_LEGS.map((s, i) => (i === 3 ? { ...s, split: "0:00" } : s)) }, "splits[3].split");
    await bad({ splits: DEFAULT_LEGS.map((s, i) => (i === 0 ? { ...s, control: "" } : s)) }, "splits[0].control");
    await bad({ place: 10000 }, "place");
    await bad({ place: 1.5 }, "place");
    await bad({ name: "Emma \u2192 Lindqvist" }, "name");
    await bad({ name: "X".repeat(41) }, "name");
    await bad({ preset: "sepia" as "dark" }, "preset");
    await bad({ accent: "pink" }, "accent");
    await bad({ splits: "not json" }, "splits");
  });

  it("refuses losses that sum past the finish", async () => {
    const big = DEFAULT_LEGS.map((s) => ({ ...s, loss: "4:00" }));
    await expect(render({ splits: big })).rejects.toThrow(/more than the finish/);
  });
});
