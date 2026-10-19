import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, checkLayoutIntent, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  DEFAULT_SPLITS,
  HyroxSplitCardV1 as T,
  SLOWEST_RULE,
  STATIONS,
  TAPE,
  formatRaceTime,
  layoutHyroxCard,
  normalizeHyroxCard,
  parseRaceTime,
  tapeWidths,
} from "./hyrox-split-card";
import type { HyroxSplit, HyroxSplitCardProps } from "./hyrox-split-card";

const ID = "@one-a-day/sports/hyrox-split-card/v1";
const render = (p: HyroxSplitCardProps = {}, w = 1080, h = 1080) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: HyroxSplitCardProps, w = 1080, h = 1080) =>
  Object.fromEntries(layoutHyroxCard(p, w, h).cells.map((c) => [c.label, c.text]));

const LONG: HyroxSplitCardProps = {
  athlete: "Maximiliana Wolfeschlegelstein",
  race: "Harbor Open Championship Weekend",
  division: "Pro, Women 35-39 Open",
  rank: 99999,
  finish: "2:05:09",
  roxzone: "12:40",
  runTotal: "1:01:05",
  bestLap: "10:04",
};

const MISMATCH: HyroxSplit[] = DEFAULT_SPLITS.map((s, i) => (i === 0 ? { ...s, run: "9:00" } : s));

const CASES: HyroxSplitCardProps[] = [
  {},
  { preset: "light" },
  { rank: 0 },
  { athlete: "", race: "", division: "" },
  { race: "" },
  { rank: 99999 },
  LONG,
  { ...LONG, preset: "light", accent: "#2f6f62" },
  { splits: MISMATCH },
  { splits: DEFAULT_SPLITS.map((s, i) => (i === 2 ? { run: s.run, station: s.station } : s)) },
  { splits: DEFAULT_SPLITS.map((s, i) => (i === 5 ? { ...s, place: 0 } : s)) },
  { athlete: "Zo\u00eb \u00c5str\u00f6m" },
];

describe(ID, () => {
  it("shows the invented athlete at the defaults: finish first, eight named rows, footer as entered", () => {
    const t = textOf({});
    expect(t.athlete).toBe("Jordan Hale");
    expect(t.race).toBe("Harbor Open");
    expect(t.division).toBe("Open, 35-39");
    expect(t.finish).toBe("1:11:40");
    expect(t.rank).toBe("#64");
    expect(t["finish-label"]).toBe("FINISH");
    expect(t["rank-label"]).toBe("RANK");
    expect(STATIONS.map((name, i) => t[`name-${i}`])).toEqual([...STATIONS]);
    expect(t["run-time-0"]).toBe("4:20");
    expect(t["station-time-3"]).toBe("5:12");
    expect(t["station-time-5"]).toBe("1:52");
    expect(t["place-3"]).toBe("240");
    expect(t.roxzone).toBe("6:06");
    expect(t["run-total"]).toBe("36:20");
    expect(t["best-lap"]).toBe("4:20");
    expect(Object.values(t).join(" ")).not.toMatch(/HYROX|SkiErg/);
    expect(T.outputHints).toMatchObject({ width: 1080, height: 1080, format: { kind: "image", container: "png" } });
  });

  it("parses compact times and refuses a decimal, and the default sums are a checksum not a render check", () => {
    expect(parseRaceTime("4:20")).toBe(260);
    expect(parseRaceTime("71:40")).toBe(4300);
    expect(parseRaceTime("1:11:40")).toBe(4300);
    expect(parseRaceTime("00:04:20")).toBe(260);
    expect(parseRaceTime("01:12:40")).toBe(4360);
    expect(formatRaceTime(260)).toBe("4:20");
    expect(formatRaceTime(4300)).toBe("1:11:40");
    expect(formatRaceTime(4360)).toBe("1:12:40");
    for (const bad of ["", "4:5", "4:60", "62:36.58", "1:11:40.0", "abc", "4.20"]) {
      expect(parseRaceTime(bad)).toBeNull();
    }
    expect(parseRaceTime(" 4:20 ")).toBe(260);
    const n = normalizeHyroxCard({});
    const runs = n.rows.reduce((a, r) => a + r.runSec, 0);
    const stations = n.rows.reduce((a, r) => a + r.stationSec, 0);
    expect(formatRaceTime(runs)).toBe("36:20");
    expect(formatRaceTime(stations)).toBe("29:14");
    expect(formatRaceTime(runs + stations + parseRaceTime("6:06")!)).toBe("1:11:40");
    expect(formatRaceTime(Math.min(...n.rows.map((r) => r.runSec)))).toBe("4:20");
    expect(n.maxPair).toBe(584);
    expect(n.rows[3].runSec + n.rows[3].stationSec).toBe(584);
    expect(n.rows[5].runSec + n.rows[5].stationSec).toBe(386);
    expect(n.slowest).toBe(3);
  });

  it("does not recompute the footer, and a hidden place or rank leaves the cell empty", () => {
    const t = textOf({ splits: MISMATCH });
    expect(t.finish).toBe("1:11:40");
    expect(t["run-total"]).toBe("36:20");
    expect(t.roxzone).toBe("6:06");
    expect(t["best-lap"]).toBe("4:20");
    expect(t["run-time-0"]).toBe("9:00");
    const hidden = layoutHyroxCard({ splits: DEFAULT_SPLITS.map((s, i) => (i === 5 ? { ...s, place: 0 } : s)) }, 1080, 1080);
    expect(hidden.cells.some((c) => c.label === "place-5")).toBe(false);
    expect(hidden.cells.some((c) => c.text === "-")).toBe(false);
    expect(hidden.cells.some((c) => c.label === "place-0")).toBe(true);
    const omitted = layoutHyroxCard({ splits: DEFAULT_SPLITS.map((s, i) => (i === 1 ? { run: s.run, station: s.station } : s)) }, 1080, 1080);
    expect(omitted.cells.some((c) => c.label === "place-1")).toBe(false);
    const noRank = layoutHyroxCard({ rank: 0 }, 1080, 1080);
    expect(noRank.cells.some((c) => c.label === "rank" || c.label === "rank-label")).toBe(false);
    expect(noRank.tiles.some((t) => t.label === "rank-chip")).toBe(false);
    expect(noRank.cells.find((c) => c.label === "finish")!.text).toBe("1:11:40");
  });

  it("draws a shared-scale tape: lap 4 fills the track, lap 6 is 386/584, longer time is a longer bar", () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutHyroxCard({}, w, h);
      const rail = L.tiles.find((t) => t.label === "rail-0")!.rect;
      expect(rail.w / w).toBeGreaterThanOrEqual(0.34);
      const bars = L.p.rows.map((_, i) => ({
        run: L.tiles.find((t) => t.label === `run-${i}`)!.rect,
        station: L.tiles.find((t) => t.label === `station-${i}`)!.rect,
        rail: L.tiles.find((t) => t.label === `rail-${i}`)!.rect,
      }));
      for (const b of bars) {
        expect(b.run.h).toBeGreaterThanOrEqual(4);
        expect(b.station.h).toBeGreaterThanOrEqual(4);
        expect(b.run.y).toBe(b.rail.y);
        expect(b.station.x).toBe(b.run.x + b.run.w);
        expect(b.run.x).toBeGreaterThanOrEqual(b.rail.x);
        expect(b.station.x + b.station.w).toBeLessThanOrEqual(b.rail.x + b.rail.w + 1);
      }
      if (TAPE === "shared") {
        const full = bars[3].run.w + bars[3].station.w;
        expect(Math.abs(full - bars[3].rail.w)).toBeLessThanOrEqual(1);
        const short = bars[5].run.w + bars[5].station.w;
        expect(Math.abs(short - Math.round(bars[5].rail.w * 386 / 584))).toBeLessThanOrEqual(1);
        expect(full).toBeGreaterThan(short);
        for (const b of bars) expect(full).toBeGreaterThanOrEqual(b.run.w + b.station.w);
        expect(short).toBeLessThanOrEqual(Math.min(...bars.map((b) => b.run.w + b.station.w)));
        expect(bars[3].station.w).toBeGreaterThan(bars[3].run.w);
        expect(bars[5].station.w).toBeLessThan(bars[5].run.w);
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
          const ri = L.p.rows[i], rj = L.p.rows[j];
          if (ri.runSec > rj.runSec) expect(bars[i].run.w).toBeGreaterThanOrEqual(bars[j].run.w);
          if (ri.stationSec > rj.stationSec) expect(bars[i].station.w).toBeGreaterThanOrEqual(bars[j].station.w);
        }
        expect(bars[3].station.w - bars[5].station.w).toBeGreaterThan(2);
      } else {
        for (const b of bars) expect(Math.abs(b.run.w + b.station.w - b.rail.w)).toBeLessThanOrEqual(1);
        expect(bars[3].station.w).toBeGreaterThan(bars[3].run.w);
      }
      const accent = L.p.accent;
      for (let i = 0; i < 8; i++) {
        const station = L.tiles.find((t) => t.label === `station-${i}`)!;
        const run = L.tiles.find((t) => t.label === `run-${i}`)!;
        expect(run.color).not.toBe(accent);
        if (!SLOWEST_RULE || i === L.p.slowest) expect(station.color).toBe(accent);
        else expect(station.color).not.toBe(accent);
      }
      const finish = L.cells.find((c) => c.label === "finish")!;
      for (const c of L.cells) if (c.label !== "finish") expect(c.px).toBeLessThan(finish.px);
      expect(finish.rect.y + finish.rect.h).toBeLessThanOrEqual(Math.floor(h * 0.3));
    }
    expect(tapeWidths(584, 272, 312, 584).filled).toBe(584);
    expect(tapeWidths(584, 274, 112, 584).filled).toBe(386);
  });

  it("keeps the finish the hero and the contract at the seven canvases, including a long name and a hidden rank", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of CASES) {
      await sweepLayout((p, ctx) => T.render(p, ctx).then(asDocument), ID, over, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("binds every prop-driven string and keeps the page colour off the canvas rect", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.athlete).toHaveLength(1);
    expect(byProp.race).toHaveLength(1);
    expect(byProp.division).toHaveLength(1);
    expect(byProp.finish).toHaveLength(1);
    expect(byProp.rank).toHaveLength(1);
    expect(byProp.roxzone).toHaveLength(1);
    expect(byProp.runTotal).toHaveLength(1);
    expect(byProp.bestLap).toHaveLength(1);
    expect(byProp.splits.length).toBe(24);
    expect(byProp.accent.length).toBeGreaterThanOrEqual(1);
    expect(doc.backgroundColor).toBe("#14110f");
    expect((await render({ preset: "light" })).backgroundColor).toBe("#f6f3ee");
    const noRank = await render({ rank: 0, athlete: "", race: "", division: "" });
    const kept = resolvePropBindings(noRank, 1080, 1080, { propsSchema: T.propsSchema });
    expect(kept.rejected).toEqual([]);
    expect(kept.byProp.rank).toBeUndefined();
    expect(kept.byProp.athlete).toBeUndefined();
    expect(kept.byProp.finish).toHaveLength(1);
  });

  it("is deterministic and fails fast, naming the field", async () => {
    expect(await render()).toEqual(await render());
    const bad = async (p: HyroxSplitCardProps, field: string) => {
      await expect(render(p)).rejects.toThrow(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    };
    await bad({ finish: "62:36.58" }, "finish");
    await bad({ finish: "abc" }, "finish");
    await bad({ roxzone: "6:06.2" }, "roxzone");
    await bad({ runTotal: "36:60" }, "runTotal");
    await bad({ bestLap: "" }, "bestLap");
    await bad({ splits: DEFAULT_SPLITS.slice(0, 7) }, "splits");
    await bad({ splits: [...DEFAULT_SPLITS, DEFAULT_SPLITS[0]] }, "splits");
    await bad({ splits: DEFAULT_SPLITS.map((s, i) => (i === 3 ? { ...s, place: 10000 } : s)) }, "splits[3].place");
    await bad({ splits: DEFAULT_SPLITS.map((s, i) => (i === 0 ? { ...s, run: "0:00" } : s)) }, "splits[0].run");
    await bad({ rank: 100000 }, "rank");
    await bad({ rank: -1 }, "rank");
    await bad({ rank: 1.5 }, "rank");
    await bad({ athlete: "Jordan \u2192 Hale" }, "athlete");
    await bad({ preset: "yellow" as "dark" }, "preset");
    await bad({ accent: "yellow" }, "accent");
    const resolved = checkLayoutIntent(await render(), 1080, 1080)!;
    expect(resolved.violations).toEqual([]);
  });
});
