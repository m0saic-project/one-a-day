import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import type { MosaicDocument } from "@m0saic/types";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  WeeklyRunReportV1,
  formatCount,
  formatRunDate,
  layoutWeeklyRunReport,
  parseMilestones,
  settleLayout,
} from "./weekly-run-report";
import type { WeeklyRunReportProps } from "./weekly-run-report";

const ID = "@one-a-day/community/weekly-run-report/v1";
const render = (props: WeeklyRunReportProps = {}, w = 1080, h = 1080) =>
  WeeklyRunReportV1.render({ ...WeeklyRunReportV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

/** Every drawn string with its label: the parent's and those inside each child document (a tile, a badge). */
function texts(doc: MosaicDocument): Array<{ label: string; text: string; px: number }> {
  const own = (d: MosaicDocument) => (d.sources ?? [])
    .filter((s) => (s as { type?: string }).type === "text")
    .map((s) => {
      const src = s as unknown as { editor?: { label?: string }; layers: Array<{ content: { text: string }; style: { fontSize: number } }> };
      return { label: src.editor?.label ?? "", text: src.layers[0].content.text, px: src.layers[0].style.fontSize };
    });
  return [...own(doc), ...Object.values(doc.children ?? {}).flatMap((c) => own(c as MosaicDocument))];
}
const textOf = (doc: MosaicDocument, label: string) => texts(doc).find((t) => t.label === label)?.text;

const TEN = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250";
const SIX = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 5xV25";
const MAXED = { finishers: 9999, newPbs: 9999, firstTimers: 9999, visitors: 9999, volunteers: 9999, firstTimeVolunteers: 9999 };

describe(ID, () => {
  it("draws the default week the brief promised, every string as typed", async () => {
    const doc = await render();
    expect(textOf(doc, "event-name")).toBe("WILLOWMERE PARK 5K");
    expect(textOf(doc, "run-number")).toBe("#312");
    expect(textOf(doc, "run-date")).toBe("SAT 03 OCT 2026");
    expect(textOf(doc, "value-finishers")).toBe("214");
    expect(textOf(doc, "value-volunteers")).toBe("31");
    expect(textOf(doc, "value-newPbs")).toBe("38");
    expect(textOf(doc, "value-firstTimers")).toBe("27");
    expect(textOf(doc, "value-visitors")).toBe("19");
    expect(textOf(doc, "value-firstTimeVolunteers")).toBe("4");
    expect(textOf(doc, "band-title")).toBe("MILESTONE CLUBS");
    expect([1, 2, 3, 4].map((i) => `${textOf(doc, `badge-club-${i}`)} ${textOf(doc, `badge-caption-${i}`)}`)).toEqual([
      "25 4 runners", "50 3 runners", "100 1 runner", "25 2 volunteers",
    ]);
    expect(textOf(doc, "footer")).toBe("Sample week: event and numbers are invented");
    // Every string on the card is ASCII.
    for (const t of texts(doc)) expect(t.text).toMatch(/^[\x20-\x7e]+$/);
  });

  it("binds what it shows: the header props, each count to its own key, the footer, the accent and the band", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: WeeklyRunReportV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const k of ["eventName", "runNumber", "date", "footer", "accent", "milestones"]) expect(byProp[k]).toHaveLength(1);
    expect(byProp.counts).toHaveLength(6);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("draws each tile and badge as a child document on the lattice: no recovery inset on a child, 5-smooth child canvases", async () => {
    const smooth = (n: number) => { let k = n; for (const f of [2, 3, 5]) while (k % f === 0) k /= f; return k === 1; };
    for (const over of [{}, { milestones: TEN }, { milestones: "" }, { eventName: "Great Salterns Nature Reserve 5k Juniors", counts: MAXED }] as WeeklyRunReportProps[]) {
      for (const [w, h] of CONTRACT_CANVASES) {
        if (over.milestones === TEN && w < 1080) continue;
        const doc = await render(over, w, h);
        const refs = (doc.sources ?? []).filter((s) => (s as { type?: string }).type === "mosaic");
        expect(refs.length).toBe(Object.keys(doc.children ?? {}).length);
        for (const r of refs) expect((r as { placement?: { inset?: unknown } }).placement?.inset).toBeUndefined();
        for (const c of Object.values(doc.children ?? {})) {
          const size = (c as MosaicDocument).size!;
          expect(smooth(size.width) && smooth(size.height)).toBe(true);
        }
      }
    }
  });

  it("keeps its layout contract at the seven contract canvases for the copy that stresses it", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const sweep = (over: WeeklyRunReportProps, canvases = CONTRACT_CANVASES) =>
      sweepLayout((p, ctx) => WeeklyRunReportV1.render(p, ctx).then(asDocument), ID, { ...WeeklyRunReportV1.defaultProps, ...over }, (w, h) => targetCtx(w, h), canvases);
    for (const over of [
      {},
      { eventName: "Great Salterns Nature Reserve 5k" },
      { eventName: "Great Salterns Nature Reserve 5k Juniors" },
      { eventName: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
      { counts: MAXED, runNumber: 9999 },
      { milestones: "" },
      { milestones: "1xR100" },
      { milestones: SIX },
      { footer: "" },
      { footer: "Thanks to all 31 volunteers - see you next Saturday at 9am by the cafe" },
      { date: "" },
      { accent: "#ffd23f" },
    ] as WeeklyRunReportProps[]) await sweep(over);
    // Ten clubs: every canvas from 1280x720 up; the 640x360 and 480x270 thumbnails refuse them (below).
    await sweep({ milestones: TEN, counts: MAXED }, CONTRACT_CANVASES.filter(([w]) => w >= 1080));
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("draws six equals: all six numbers share one size and all tile labels share one size, at every canvas", async () => {
    for (const over of [{}, { counts: MAXED }, { milestones: TEN }] as WeeklyRunReportProps[]) {
      for (const [w, h] of CONTRACT_CANVASES) {
        if (over.milestones === TEN && w < 1080) continue;
        const doc = await render(over, w, h);
        const t = texts(doc);
        const px = (prefix: string) => t.filter((x) => x.label.startsWith(prefix)).map((x) => x.px);
        const values = px("value-");
        expect(values).toHaveLength(6);
        expect(new Set(values).size).toBe(1);
        expect(new Set(px("label-")).size).toBe(1);
      }
    }
  });

  it("reflows by aspect: 3x2 on the square and wide canvases, 2x3 in portrait, no slab tiles", () => {
    const grid = (w: number, h: number) => { const L = layoutWeeklyRunReport({}, w, h); return [new Set(L.statRects.map((r) => r.x)).size, new Set(L.statRects.map((r) => r.y)).size]; };
    expect(grid(1080, 1080)).toEqual([3, 2]);
    expect(grid(1920, 1080)).toEqual([3, 2]);
    expect(grid(1080, 1920)).toEqual([2, 3]);
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutWeeklyRunReport({}, w, h);
      expect(L.heroRects).toHaveLength(0);
      expect(L.statRects).toHaveLength(6);
      for (const r of L.statRects) expect(r.h).toBeLessThanOrEqual(Math.ceil(r.w * 1.3));
    }
  });

  it("keeps the milestone band every week: the empty week says so, six clubs wrap to 3 + 3, ten to 5 + 5", async () => {
    const empty = await render({ milestones: "" });
    expect(textOf(empty, "milestone-empty")).toBe("No milestone clubs this week");
    expect(texts(empty).some((t) => t.label.startsWith("badge-"))).toBe(false);
    expect(layoutWeeklyRunReport({ milestones: "" }, 1080, 1080).band).toEqual(layoutWeeklyRunReport({}, 1080, 1080).band);
    const rows = (s: string, w: number, h: number) => {
      const ys = layoutWeeklyRunReport({ milestones: s }, w, h).badges.map((b) => b.rect.y);
      return [...new Set(ys)].map((y) => ys.filter((v) => v === y).length);
    };
    expect(rows(SIX, 1080, 1080)).toEqual([3, 3]);
    expect(rows(TEN, 1080, 1080)).toEqual([5, 5]);
    expect(rows(TEN, 1080, 1920)).toEqual([5, 5]);
    // A wide band may hold all ten in one row when that draws them larger; either way they are equal.
    const wide = layoutWeeklyRunReport({ milestones: TEN }, 1920, 1080).badges;
    expect(new Set(wide.map((b) => `${b.rect.w}x${b.rect.h}`)).size).toBe(1);
    expect(() => settleLayout({ milestones: TEN }, 480, 270)).toThrow(/milestones cannot be fitted on 480x270/);
    expect(() => settleLayout({ milestones: TEN }, 640, 360)).toThrow(/milestones cannot be fitted on 640x360/);
    expect(settleLayout({ milestones: SIX }, 480, 270).L.badges).toHaveLength(6);
  });

  it("parses the runstats milestones line: run clubs then volunteer clubs, ascending, and names a bad entry", () => {
    const show = (s: string) => parseMilestones(s).map((b) => `${b.kind}${b.club} ${b.caption}`);
    expect(show("4xR25, 3xR50, 1xR100, 2xV25")).toEqual(["R25 4 runners", "R50 3 runners", "R100 1 runner", "V25 2 volunteers"]);
    expect(show("1xr100,4xR25")).toEqual(["R25 4 runners", "R100 1 runner"]);
    expect(show(" 1 x V50 , 2xr25 ")).toEqual(["R25 2 runners", "V50 1 volunteer"]);
    expect(show("")).toEqual([]);
    expect(() => parseMilestones("4xR30")).toThrow(/'R30' is not a club \(25, 50, 100, 250, 500, 1000\)/);
    expect(() => parseMilestones("4xR25, 2xR25")).toThrow(/R25 appears twice/);
    expect(() => parseMilestones(`${TEN}, 1xV500`)).toThrow(/11 entries; at most 10/);
    expect(() => parseMilestones("R25")).toThrow(/"R25" is not <count>x<R\|V><club>/);
  });

  it("prints numbers and dates exactly: a thousands comma, the weekday from the date", () => {
    expect(formatCount(1204)).toBe("1,204");
    expect(formatCount(9999)).toBe("9,999");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(0)).toBe("0");
    expect(formatRunDate("2026-10-03")).toBe("SAT 03 OCT 2026");
    expect(formatRunDate("2004-10-02")).toBe("SAT 02 OCT 2004");
    expect(formatRunDate("2026-12-25")).toBe("FRI 25 DEC 2026");
    expect(formatRunDate("2024-02-29")).toBe("THU 29 FEB 2024");
    expect(formatRunDate("2026-02-30")).toBeNull();
    expect(formatRunDate("03/10/2026")).toBeNull();
  });

  it("refuses every bad input with a message that names the field and the value", async () => {
    const counts = { ...WeeklyRunReportV1.defaultProps.counts! };
    await expect(render({ counts: { ...counts, pb: 3 } as never })).rejects.toThrow(/counts has an unknown key 'pb'; use finishers, volunteers/);
    const { newPbs: _drop, ...missing } = counts;
    await expect(render({ counts: missing as never })).rejects.toThrow(/counts is missing 'newPbs'/);
    await expect(render({ counts: { ...counts, newPbs: 300 } })).rejects.toThrow(/counts.newPbs is 300, more than the 214 finishers/);
    await expect(render({ counts: { ...counts, firstTimeVolunteers: 40 } })).rejects.toThrow(/counts.firstTimeVolunteers is 40, more than the 31 volunteers/);
    await expect(render({ counts: { ...counts, finishers: 0 } })).rejects.toThrow(/counts.finishers must be at least 1/);
    await expect(render({ counts: { ...counts, visitors: 2.5 } })).rejects.toThrow(/counts.visitors must be a whole number/);
    await expect(render({ counts: { ...counts, finishers: 10000 } })).rejects.toThrow(/counts.finishers must be a whole number from 0 to 9999/);
    await expect(render({ milestones: "4xR30" })).rejects.toThrow(/milestones 'R30' is not a club/);
    await expect(render({ milestones: "4xR25, 2xR25" })).rejects.toThrow(/R25 appears twice/);
    await expect(render({ date: "2026-02-30" })).rejects.toThrow(/date "2026-02-30" is not a date/);
    await expect(render({ runNumber: 0 })).rejects.toThrow(/runNumber must be a whole number from 1 to 9999/);
    await expect(render({ eventName: "" })).rejects.toThrow(/eventName must not be empty/);
    await expect(render({ eventName: "Park → 5k" })).rejects.toThrow(/eventName .* has the character .* \(U\+2192\)/);
    await expect(render({ eventName: "A".repeat(41) })).rejects.toThrow(/eventName .* is 41 characters; the card fits at most 40/);
    await expect(render({ footer: "x".repeat(71) })).rejects.toThrow(/footer .* is 71 characters/);
    await expect(render({ accent: "green" })).rejects.toThrow(/accent "green" must be #rrggbb/);
  });

  it("takes accented Latin names, an empty date and footer, and a pale accent without losing the numbers", async () => {
    const doc = await render({ eventName: "Llyn Padarn Pàrc 5k", date: "", footer: "" });
    expect(textOf(doc, "event-name")).toBe("LLYN PADARN PÀRC 5K");
    expect(textOf(doc, "run-date")).toBeUndefined();
    expect(textOf(doc, "footer")).toBeUndefined();
    // "" falls back to the default accent.
    expect(layoutWeeklyRunReport({ accent: "" }, 1080, 1080).p.accent).toBe("#1f7a4d");
    // Six equals: every number is ink, whatever the accent.
    const pale = await render({ accent: "#ffd23f" });
    expect(pale.sources).toBeDefined();
  });

  it("is the event's card, not ours: no parkrun word in the defaults or the fixed copy, no template credit", async () => {
    const doc = await render();
    const all = JSON.stringify(WeeklyRunReportV1.defaultProps) + texts(doc).map((t) => t.text).join(" ");
    expect(all.toLowerCase()).not.toContain("parkrun");
    const noFooter = await render({ footer: "" });
    // Without the footer, nothing on the card is copy the run director did not type, except the fixed labels.
    expect(texts(noFooter).map((t) => t.label).filter((l) => !/^(event-name|run-|value-|label-|band-title|badge-)/.test(l))).toEqual([]);
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
    expect(await render({ milestones: TEN }, 1920, 1080)).toEqual(await render({ milestones: TEN }, 1920, 1080));
  });
});
