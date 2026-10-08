import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";
import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  ASTRO_DEFAULT_SESSIONS,
  AstroIntegrationSummaryV1,
  astroBeatsOf,
  astroHoursText,
  astroLayout,
  astroModelFromCsv,
  astroModelFromSessions,
  astroParseCsv,
  astroTrackEdge,
} from "./astro-integration-summary";

const ID = "@one-a-day/science/astro-integration-summary/v1";

const render = (
  props: Parameters<typeof AstroIntegrationSummaryV1.render>[0] = {},
  w = 1920,
  h = 1080,
  ctx?: MosaicEngineContext,
) => AstroIntegrationSummaryV1.render({ ...AstroIntegrationSummaryV1.defaultProps, ...props }, ctx ?? targetCtx(w, h)).then(asDocument);

type Src = { type?: string; editor?: { label?: string }; overlay?: { enable?: string }; layers?: Array<{ content?: { text?: string }; overlay?: { enable?: string } }> };
const sourcesOf = (doc: MosaicDocument) => (doc.sources ?? []) as Src[];
const childSources = (doc: MosaicDocument, key: string) => ((doc.children?.[key] as MosaicDocument).sources ?? []) as Src[];
const noOverrides = new Map();
const copy = { target: "T", equipment: "E", footer: "F" };

/** The stress copy: 8 filters, 30 nights, the longest names the template accepts. */
const NAMES = ["Ha", "OIII", "SII", "L", "R", "G", "B", "Optolong L-eXtreme 7nm"];
const STRESS_SESSIONS = Array.from({ length: 30 }, (_, n) => {
  const day = String((n % 28) + 1).padStart(2, "0");
  const month = n < 28 ? "03" : "04";
  return NAMES.slice(0, 1 + (n % 8)).map((filter, i) => ({
    night: `2026-${month}-${day}`,
    filter,
    frames: 5 + ((n * 7 + i * 3) % 40),
    exposureSec: [60, 120, 180, 300][(n + i) % 4],
  }));
}).flat();
const STRESS = {
  target: "The Great Hercules Globular Cluster and its neighbours M13",
  equipment: "Esprit 120ED + ASI6200MM Pro + EQ6-R Pro + OAG guiding",
  sessions: STRESS_SESSIONS,
};

describe(ID, () => {
  it("binds the target, equipment and footer rects to their props - Make's double-click edits them in place", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: AstroIntegrationSummaryV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.target).toHaveLength(1);
    expect(byProp.equipment).toHaveLength(1);
    expect(byProp.footer).toHaveLength(1);
  });

  it("clears its safe minimum at its own hint, in portrait and in square", async () => {
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]] as const) {
      const ev = evaluateM0(String((await render({}, w, h)).m0), { width: w, height: h });
      expect(ev.feasible && ev.meetsPrecision).toBe(true);
    }
  });

  it("gets the numbers right: 6.4 / 4.1 / 5.3 h per filter, 15.8 h in all, and the captions", () => {
    const m = astroModelFromSessions(undefined, noOverrides);
    expect(m.filters.map((f) => f.name)).toEqual(["Ha", "OIII", "SII"]);
    expect(m.filters.map((f) => astroHoursText(f.sec))).toEqual(["6.4", "4.1", "5.3"]);
    expect(m.filters.map((f) => f.frames)).toEqual([128, 123, 105]);
    expect(m.filters.map((f) => f.exposure)).toEqual([180, 120, 180]);
    expect(m.totalSec).toBe(56700);
    expect(astroHoursText(m.totalSec)).toBe("15.8");
    expect(m.nights.map((n) => n.label)).toEqual(["N1 09-12", "N2 09-13", "N3 09-19", "N4 09-20"]);
    expect(m.nights.map((n) => astroHoursText(n.cumSec))).toEqual(["3.0", "7.2", "10.7", "15.8"]);
  });

  it("rounds hours half up on whole seconds, once", () => {
    expect(astroHoursText(56700)).toBe("15.8");
    expect(astroHoursText(0)).toBe("0.0");
    expect(astroHoursText(1800)).toBe("0.5");
    expect(astroHoursText(1620)).toBe("0.5");
    expect(astroHoursText(1619)).toBe("0.4");
  });

  it("puts every bar on ONE scale fixed from the first frame: lengths are proportional to hours", () => {
    const m = astroModelFromSessions(undefined, noOverrides);
    for (const [w, h] of [[1920, 1080], [1080, 1920], [480, 270]] as const) {
      const L = astroLayout(m, copy, w, h);
      const edges = m.filters.map((f) => astroTrackEdge(f.sec, m.maxSec, L.trackW));
      expect(edges[0]).toBe(L.trackW); // Ha is the largest: it fills the track
      m.filters.forEach((f, i) => expect(Math.abs(edges[i] - (L.trackW * f.sec) / m.maxSec)).toBeLessThanOrEqual(0.5));
      // segments end exactly on their cumulative edge, so the last one is the bar's length
      expect(astroTrackEdge(m.filters[2].segs[m.filters[2].segs.length - 1].cumSec, m.maxSec, L.trackW)).toBe(edges[2]);
    }
  });

  it("lands night k at its share of the replay, opens and closes on the finished card", async () => {
    const b = astroBeatsOf(12, 4);
    expect([b.hook, b.start, b.end]).toEqual([0.72, 1.68, 9.84]);
    expect(b.lands).toEqual([1.68, 3.72, 5.76, 7.8]);
    const doc = await render();
    const segs = childSources(doc, "chart").filter((s) => s.editor?.label === "bar-segment");
    expect(segs.length).toBeGreaterThanOrEqual(9);
    // every segment is shown in the cold open and from its night's landing on
    for (const s of segs) expect(s.overlay?.enable).toMatch(/^lt\(t,0\.72\)\+gte\(t,(1\.68|3\.72|5\.76|7\.8)\)$/);
    // the total counts up: the finished value first, 0.0 h in the reset, then one value per night
    const total = sourcesOf(doc).find((s) => s.editor?.label === "total")!;
    expect(total.layers!.map((l) => l.content!.text)).toEqual(["15.8 h", "0.0 h", "3.0 h", "7.2 h", "10.7 h", "15.8 h"]);
    expect(total.layers![total.layers!.length - 1].overlay!.enable).toBe("gte(t,7.8)");
  });

  it("is a clip of clipSec, and an explicit pin overrides it and rescales every gate", async () => {
    expect((await render()).durationMs).toBe(12000);
    expect((await render({ clipSec: 8 })).durationMs).toBe(8000);
    expect(AstroIntegrationSummaryV1.resolveOutputHints?.(AstroIntegrationSummaryV1.defaultProps)).toEqual({ durationMs: 12000 });
    const pinned = { ...targetCtx(1920, 1080), userIntent: { durationMs: 6000 } } as unknown as MosaicEngineContext;
    const doc = await AstroIntegrationSummaryV1.render({ ...AstroIntegrationSummaryV1.defaultProps }, pinned).then(asDocument);
    expect(doc.durationMs).toBe(6000);
    expect((doc.children?.chart as MosaicDocument).durationMs).toBe(6000);
    const total = sourcesOf(doc).find((s) => s.editor?.label === "total")!;
    expect(total.layers![0].overlay!.enable).toBe("lt(t,0.36)");
  });

  it("reads a NINA ImageMetaData.csv by header name: three columns, a new night after a 6 h gap", () => {
    const rows = ["ExposureNumber,FilterName,ExposureStartUTC,Duration,Gain,HFR"];
    const add = (filter: string, ts: string, dur: number) => rows.push(`${rows.length},${filter},${ts},${dur},100,2.1`);
    for (let i = 0; i < 4; i++) add("Ha", `2026-09-12 21:${String(10 + i * 4).padStart(2, "0")}:00`, 180);
    for (let i = 0; i < 2; i++) add("OIII", `2026-09-12T23:0${i * 4}:00.5000000Z`, 120);
    for (let i = 0; i < 3; i++) add('"Ha"', `2026-09-13 22:${String(10 + i * 4).padStart(2, "0")}:00`, 180);
    const m = astroModelFromCsv(rows.join("\r\n") + "\r\n", noOverrides);
    expect(m.nights.map((n) => n.date)).toEqual(["2026-09-12", "2026-09-13"]);
    expect(m.filters.map((f) => [f.name, f.frames, f.sec])).toEqual([["Ha", 7, 1260], ["OIII", 2, 240]]);
    expect(m.filters[0].exposure).toBe(180);
    expect(m.filters[0].segs.map((s) => s.night)).toEqual([0, 1]);
  });

  it("refuses bad input by name and row", async () => {
    const csv = (body: string) => `ExposureNumber,FilterName,ExposureStartUTC,Duration\n${body}`;
    expect(() => astroModelFromCsv("A,B\n1,2", noOverrides)).toThrow(/no "FilterName" column/);
    expect(() => astroModelFromCsv("FilterName,Duration\nHa,180", noOverrides)).toThrow(/no "ExposureStartUTC" column/);
    expect(() => astroModelFromCsv(csv("1,Ha,2026-09-12 21:00:00,180\n2,Ha,yesterday,180"), noOverrides)).toThrow(/csv row 3: ExposureStartUTC "yesterday"/);
    expect(() => astroModelFromCsv(csv("1,Ha,2026-09-12 21:00:00,abc"), noOverrides)).toThrow(/csv row 2: Duration "abc"/);
    expect(() => astroModelFromCsv(csv("1,Ha,2026-02-30 21:00:00,180"), noOverrides)).toThrow(/not a calendar date/);
    await expect(render({ sessions: [] })).rejects.toThrow(/sessions is empty/);
    await expect(render({ sessions: [{ night: "2026-02-30", filter: "Ha", frames: 3, exposureSec: 60 }] })).rejects.toThrow(/sessions\[0\]\.night/);
    await expect(render({ sessions: [{ night: "2026-09-12", filter: "Ha", frames: 0, exposureSec: 60 }] })).rejects.toThrow(/sessions\[0\]\.frames/);
    await expect(render({ sessions: [{ night: "2026-09-12", filter: "Ha", frames: 3, exposureSec: 4000 }] })).rejects.toThrow(/sessions\[0\]\.exposureSec/);
    await expect(render({ sessions: "{nope" })).rejects.toThrow(/not valid JSON/);
    await expect(render({ filterColors: { Ha: "red" } })).rejects.toThrow(/filterColors\.Ha/);
    await expect(render({ target: "" })).rejects.toThrow(/target must not be empty/);
    await expect(render({ clipSec: 2 })).rejects.toThrow(/clipSec/);
    const nine = NAMES.slice(0, 7).concat(["Extra", "More"]).map((filter) => ({ night: "2026-09-12", filter, frames: 3, exposureSec: 60 }));
    await expect(render({ sessions: nine })).rejects.toThrow(/9 filters; at most 8/);
  });

  it("csv replaces sessions, and quoted fields survive", async () => {
    const csv = 'ExposureNumber,FilterName,ExposureStartUTC,Duration\n1,"Ha",2026-10-01 22:00:00,300\n2,"Ha",2026-10-01 22:06:00,300\n';
    const doc = await render({ csv });
    const total = sourcesOf(doc).find((s) => s.editor?.label === "total")!;
    expect(total.layers![0].content!.text).toBe("0.2 h");
    expect(astroParseCsv('a,"b,c",d\n"x ""y""",2,3')).toEqual([["a", "b,c", "d"], ['x "y"', "2", "3"]]);
  });

  it("applies fixed colours, a fallback cycle and per-filter overrides", async () => {
    const colorsOf = async (props: object) => {
      const doc = await render(props);
      return childSources(doc, "chart").filter((s) => s.editor?.label === "bar-segment").map((s) => JSON.stringify(s)).join("|");
    };
    const base = await colorsOf({});
    expect(base).toContain("#e4431d"); // Ha
    expect(base).toContain("#0c8f84"); // OIII
    expect(base).toContain("#7d1426"); // SII
    expect(await colorsOf({ filterColors: '{"ha":"#123456"}' })).toContain("#123456");
    const fallback = await colorsOf({ sessions: [{ night: "2026-09-12", filter: "Optolong", frames: 3, exposureSec: 60 }] });
    expect(fallback).toContain("#b8860b");
  });

  it("keeps its layout contract at the seven contract canvases - defaults, the stress copy, long titles, no equipment or footer", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const overs: object[] = [
      {},
      STRESS,
      { target: "x".repeat(60) },
      { target: "A target name with a good many short words to wrap on lines" },
      { equipment: "", footer: "" },
      { footer: "A footer line long enough that it has to shrink before it fits the bottom band of a narrow canvas" },
      { sessions: [{ night: "2026-09-12", filter: "Ha", frames: 1, exposureSec: 1 }] },
    ];
    for (const over of overs) {
      await sweepLayout((p, ctx) => AstroIntegrationSummaryV1.render(p, ctx).then(asDocument), ID, { ...AstroIntegrationSummaryV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("degrades by ladder, never by clipping: night labels thin out above 12 nights, captions shorten then drop", () => {
    const stress = astroLayout(astroModelFromSessions(STRESS_SESSIONS, noOverrides), copy, 1920, 1080);
    expect(stress.labels.filter(Boolean).length).toBeLessThanOrEqual(2);
    const full = astroLayout(astroModelFromSessions(undefined, noOverrides), copy, 1920, 1080);
    expect(full.labels.map((l) => l?.fit.text)).toEqual(["N1 09-12", "N2 09-13", "N3 09-19", "N4 09-20"]);
    expect(full.captions?.[0].fit.text).toBe("128 x 180 s");
    const small = astroLayout(astroModelFromSessions(undefined, noOverrides), copy, 480, 270);
    expect(small.captions === null || small.captions[0].fit.text.length <= "128 x 180 s".length).toBe(true);
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
    expect(ASTRO_DEFAULT_SESSIONS.length).toBe(9);
  });
});
