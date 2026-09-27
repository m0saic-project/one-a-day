import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";
import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  MEET_DEFAULT_ATTEMPTS,
  PowerliftingMeetRecapV1,
  buildMeet,
  fmtMeetKg,
  fmtMeetWeight,
  layoutMeet,
  meetAscii,
  meetBeats,
  meetContrast,
  meetDecimals,
  meetFromCsvRow,
  meetLandAt,
  meetLb,
  meetOrdinal,
  meetReadable,
  meetSteps,
  meetTotalExpr,
  parseMeetCsv,
  pickMeetRow,
} from "./powerlifting-meet-recap";
import type { MeetRawLift } from "./powerlifting-meet-recap";

const ID = "@one-a-day/sports/powerlifting-meet-recap/v1";

const render = (
  props: Parameters<typeof PowerliftingMeetRecapV1.render>[0] = {},
  w = 1080,
  h = 1920,
  ctx?: MosaicEngineContext,
) => PowerliftingMeetRecapV1.render({ ...PowerliftingMeetRecapV1.defaultProps, ...props }, ctx ?? targetCtx(w, h)).then(asDocument);

type Src = { type?: string; editor?: { label?: string }; overlay?: { enable?: string; window?: { startSec?: number; endSec?: number } }; layers?: Array<{ content?: { kind?: string; text?: string; expr?: string } }> };
const sourcesOf = (doc: MosaicDocument) => (doc.sources ?? []) as Src[];
const byLabel = (doc: MosaicDocument, label: string) => sourcesOf(doc).filter((s) => s.editor?.label === label);
const textOf = (doc: MosaicDocument, label: string) => byLabel(doc, label)[0]?.layers?.[0]?.content?.text;

/** The two gate shapes the template writes, evaluated at clip time t (undefined gate = always on). */
function on(enable: string | undefined, t: number): boolean {
  if (enable === undefined) return true;
  let m = /^lt\(t,([\d.]+)\)\+gte\(t,([\d.]+)\)$/.exec(enable);
  if (m) return t < Number(m[1]) || t >= Number(m[2]);
  m = /^gte\(t,([\d.]+)\)\*lt\(t,([\d.]+)\)$/.exec(enable);
  if (m) return t >= Number(m[1]) && t < Number(m[2]);
  throw new Error(`unexpected gate ${enable}`);
}

/** The counted total at clip time t, read back out of the drawtext expression. */
function totalAt(expr: string, t: number): number {
  const m = /if\(lt\(t\\,([\d.]+)\)\\,([\d.]+)\\,(.*?)\)\+0\.0005\)/.exec(expr);
  if (!m) throw new Error(`unexpected total expression ${expr}`);
  if (t < Number(m[1])) return Number(m[2]);
  let sum = 0;
  for (const term of m[3].matchAll(/([\d.]+)\*clip\(\(t-([\d.]+)\)\*([\d.]+)\\,0\\,1\)/g)) {
    sum += Number(term[1]) * Math.min(1, Math.max(0, (t - Number(term[2])) * Number(term[3])));
  }
  return Math.round(sum * 100) / 100;
}

const META = { lifter: "A", meetName: "M", details: "D", place: "1", dots: 0 };
const raw = (o: Partial<Record<"squat" | "bench" | "deadlift", Array<number | null>>>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { attempts: v } as MeetRawLift]));

/**
 * An OpenPowerlifting file in the documented format (the lifter download's 42
 * columns): a full meet with a missed squat, a bench-only meet, an old meet
 * whose federation reported only the bests, and a bomb-out. Nobody real.
 */
const HEADER =
  "Name,Sex,Event,Equipment,Age,AgeClass,BirthYearClass,Division,BodyweightKg,WeightClassKg,Squat1Kg,Squat2Kg,Squat3Kg,Squat4Kg,Best3SquatKg,Bench1Kg,Bench2Kg,Bench3Kg,Bench4Kg,Best3BenchKg,Deadlift1Kg,Deadlift2Kg,Deadlift3Kg,Deadlift4Kg,Best3DeadliftKg,TotalKg,Place,Dots,Wilks,Glossbrenner,Goodlift,Tested,Country,State,Federation,ParentFederation,Date,MeetCountry,MeetState,MeetTown,MeetName,Sanctioned";
const CSV = [
  HEADER,
  "Tomás Rivera #2,M,SBD,Raw,31,24-34,24-39,Open,81.6,82.5,200,212.5,-220,,212.5,130,137.5,142.5,,142.5,240,255,-265,,255,610,2,412.77,410.2,390.1,84.3,Yes,USA,OR,USAPL,IPF,2026-05-16,USA,OR,Portland,Rose City Classic,Yes",
  "Tomás Rivera #2,M,B,Raw,30,24-34,24-39,Open,82.1,82.5,,,,,,125,-132.5,132.5,,132.5,,,,,,132.5,1,89.5,89.1,84.7,70.2,Yes,USA,OR,USAPL,IPF,2025-11-08,USA,OR,Salem,Bench Bash,Yes",
  "Tomás Rivera #2,M,SBD,Raw,27,24-34,24-39,Open,80.9,82.5,,,,,180,,,,,120,,,,,215,515,5,350.12,348,331,71,Yes,USA,OR,USPA,IPL,2022-03-05,USA,OR,Bend,High Desert Open,Yes",
  "Tomás Rivera #2,M,SBD,Raw,26,24-34,24-39,Open,80.2,82.5,-170,-170,-170,,-170,,,,,,,,,,,,DQ,,,,,Yes,USA,OR,USPA,IPL,2021-10-02,USA,OR,Bend,Fall Classic,Yes",
].join("\n");

describe(ID, () => {
  it("binds what it displays - lifter, meet, details, every weight, the place, the points, the stamp's accent", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1920, { propsSchema: PowerliftingMeetRecapV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const p of ["lifter", "meetName", "details", "place", "dots", "accent"]) expect(byProp[p]?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(byProp.attempts).toHaveLength(9);
    // A pasted csv owns the copy: nothing but the accent is left to edit in place.
    const pasted = resolvePropBindings(await render({ csv: CSV }), 1080, 1920, { propsSchema: PowerliftingMeetRecapV1.propsSchema });
    expect(pasted.rejected).toEqual([]);
    expect(Object.keys(pasted.byProp)).toEqual(["accent"]);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1920 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven canvases - defaults, both units, pounds, long copy with quarter kilos, one lift, a bomb-out, light, every csv row", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const overs = [
      {},
      { units: "both" as const },
      { units: "lb" as const, preset: "light" as const, accent: "#0057b8" },
      {
        lifter: "Maximiliana Oluwaseun-Fitzgerald van der Westhuizen",
        meetName: "The 47th Annual Pacific Northwest Regional Raw Open Championships",
        details: "USA Powerlifting - 2026-09-12 - F 84+ kg - Raw with Wraps - Masters 2",
        attempts: { squat: [302.25, 312.75, -322.25], bench: [202.25, -210.75, 210.75], deadlift: [322.25, 337.75, 347.25] },
        dots: 1234.56,
        place: "123",
        units: "both" as const,
      },
      { attempts: { bench: [100, 105, -110] }, lifter: "", meetName: "", details: "", place: "", dots: 0 },
      { attempts: { squat: [-170, -170, -170], bench: [100, null, null] }, place: "DQ" },
      { csv: CSV, row: "1" },
      { csv: CSV, row: "2", units: "both" as const },
      { csv: CSV, row: "3" },
      { csv: CSV, row: "4" },
    ];
    for (const over of overs) {
      await sweepLayout((p, ctx) => PowerliftingMeetRecapV1.render(p, ctx).then(asDocument), ID, { ...PowerliftingMeetRecapV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("weights: kilograms as written, pounds rounded down, names folded to ASCII", () => {
    expect(fmtMeetKg(147.5)).toBe("147.5");
    expect(fmtMeetKg(150)).toBe("150");
    expect(fmtMeetKg(102.25)).toBe("102.25");
    // The write-ups the scout read say 352, 385 and 407 for 160, 175 and 185 kg.
    expect([160, 175, 185].map(meetLb)).toEqual([352, 385, 407]);
    expect(fmtMeetWeight(147.5, "lb")).toBe("325");
    expect(fmtMeetWeight(147.5, "kg")).toBe("147.5");
    expect(fmtMeetWeight(147.5, "both")).toBe("147.5");
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(meetOrdinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th"]);
    expect(meetAscii("Tomás  Rivera")).toBe("Tomas Rivera");
    expect(meetAscii("李 娜")).toBe("? ?");
  });

  it("the day follows the CSV's rule: a negative weight is a no lift, the best is the heaviest good lift, the total their sum", () => {
    const m = buildMeet({ ...META, dots: 398.12 }, raw({ squat: [...MEET_DEFAULT_ATTEMPTS.squat], bench: [...MEET_DEFAULT_ATTEMPTS.bench], deadlift: [...MEET_DEFAULT_ATTEMPTS.deadlift] }), "kg");
    expect(m.lifts.map((l) => l.bestKg)).toEqual([150, 82.5, 160]);
    expect(m.lifts[1].cells.map((c) => c?.good)).toEqual([true, true, false]);
    expect(m.lifts[1].cells[2]?.kg).toBe(85);
    expect(m.totalKg).toBe(392.5);
    expect(m.stamp).toBe("8/9");
    expect(m.placeLine).toBe("1st place");
    expect(m.pointsLine).toBe("398.12 Dots");
    expect(buildMeet({ ...META, dots: 398.12 }, raw({ squat: [140], bench: [80], deadlift: [150] }), "both").pointsLine).toBe("815 lb - 398.12 Dots");
    // A heavier miss never becomes the best; an attempt not taken is not counted.
    const gaps = buildMeet(META, raw({ squat: [100, -120, null], deadlift: [0, 150, 140] }), "kg");
    expect(gaps.lifts.map((l) => l.bestKg)).toEqual([100, 150]);
    expect(gaps.stamp).toBe("3/4");
    expect(gaps.order.map((a) => `${a.lift}${a.index + 1}`)).toEqual(["squat1", "squat2", "deadlift2", "deadlift3"]);
    expect(gaps.totalKg).toBe(250);
    // No good lift in a contested lift is a bomb-out: there is no total, and no points are printed.
    const bomb = buildMeet({ ...META, place: "DQ", dots: 300 }, raw({ squat: [-170, -170, -170], bench: [100] }), "kg");
    expect(bomb.totalKg).toBeNull();
    expect(bomb.stamp).toBe("1/4");
    expect(bomb.placeLine).toBe("Disqualified");
    expect(bomb.pointsLine).toBe("");
    // A disqualified lifter has no total even when every lift was made.
    expect(buildMeet({ ...META, place: "DD" }, raw({ bench: [100] }), "kg").totalKg).toBeNull();
    expect(buildMeet({ ...META, place: "G" }, raw({ bench: [100] }), "kg").placeLine).toBe("Guest lifter");
    expect(() => buildMeet({ ...META, place: "first" }, raw({ bench: [100] }), "kg")).toThrow(/Place/);
    expect(() => buildMeet(META, {}, "kg")).toThrow(/no attempts/);
  });

  it("reads an OpenPowerlifting csv: the header names the columns, row picks the meet by number, date or name", () => {
    const rows = parseMeetCsv(CSV);
    expect(rows).toHaveLength(4);
    expect(pickMeetRow(rows, "").MeetName).toBe("Rose City Classic");
    expect(pickMeetRow(rows, "2").MeetName).toBe("Bench Bash");
    expect(pickMeetRow(rows, "2022-03-05").MeetName).toBe("High Desert Open");
    expect(pickMeetRow(rows, "tomás rivera").MeetName).toBe("Rose City Classic");
    expect(() => pickMeetRow(rows, "5")).toThrow(/4 result rows/);
    expect(() => pickMeetRow(rows, "2030-01-01")).toThrow(/matches no Date and no Name/);
    expect(() => parseMeetCsv("a,b,c\n1,2,3")).toThrow(/OpenPowerlifting/);
    expect(() => parseMeetCsv(HEADER)).toThrow(/no result row/);
    // Windows line ends and a byte order mark change nothing.
    expect(parseMeetCsv("﻿" + CSV.replace(/\n/g, "\r\n"))).toEqual(rows);

    const full = meetFromCsvRow(rows[0]);
    expect(full.meta).toEqual({ lifter: "Tomas Rivera", meetName: "Rose City Classic", details: "USAPL - 2026-05-16 - M 82.5 kg - Raw", place: "2", dots: 412.77 });
    const day = buildMeet(full.meta, full.raw, "kg");
    expect(day.lifts.map((l) => l.bestKg)).toEqual([212.5, 142.5, 255]);
    expect(day.totalKg).toBe(610);
    expect(day.stamp).toBe("7/9");
    expect(day.placeLine).toBe("2nd place");

    // Bench-only: one row. Bests-only: one cell a lift, nothing to count. A bomb-out: no total.
    const bench = meetFromCsvRow(rows[1]);
    const benchDay = buildMeet(bench.meta, bench.raw, "kg");
    expect(benchDay.lifts.map((l) => l.lift)).toEqual(["bench"]);
    expect(benchDay.stamp).toBe("2/3");
    expect(benchDay.totalKg).toBe(132.5);
    const old = meetFromCsvRow(rows[2]);
    const oldDay = buildMeet(old.meta, old.raw, "kg");
    expect(oldDay.lifts.map((l) => [l.bestOnly, l.cells.length, l.bestKg])).toEqual([[true, 1, 180], [true, 1, 120], [true, 1, 215]]);
    expect(oldDay.stamp).toBe("");
    expect(oldDay.totalKg).toBe(515);
    const out = meetFromCsvRow(rows[3]);
    const outDay = buildMeet(out.meta, out.raw, "kg");
    expect(outDay.totalKg).toBeNull();
    expect(outDay.stamp).toBe("0/3");
  });

  it("a pasted csv wins over the props and renders its own day", async () => {
    const doc = await render({ csv: CSV, row: "2026-05-16", lifter: "ignored", units: "kg" });
    expect(textOf(doc, "lifter")).toBe("Tomas Rivera");
    expect(textOf(doc, "meet")).toBe("Rose City Classic");
    expect(textOf(doc, "stamp-text")).toBe("7/9");
    expect(textOf(doc, "weight-squat-2")).toBe("220");
    expect(textOf(doc, "best-deadlift")).toBe("best 255 kg");
    expect(textOf(doc, "place")).toBe("2nd place");
    expect(textOf(doc, "points")).toBe("412.77 Dots");
    const dual = await render({ csv: CSV, row: "2026-05-16", units: "both" });
    expect(textOf(dual, "weight-squat-2")).toBe("220");
    expect(textOf(dual, "pounds-squat-2")).toBe("485 lb");
    expect(textOf(dual, "best-deadlift")).toBe("best 255 kg / 562 lb");
    expect(textOf(dual, "points")).toBe("1344 lb - 412.77 Dots");
    expect(textOf(dual, "total-label")).toBe("TOTAL (KG)");
    const pounds = await render({ csv: CSV, row: "2026-05-16", units: "lb" });
    expect(textOf(pounds, "weight-squat-2")).toBe("485");
    expect(textOf(pounds, "best-deadlift")).toBe("best 562 lb");
    expect(textOf(pounds, "total-label")).toBe("TOTAL (LB)");
    const board = doc.children?.board as MosaicDocument;
    expect(byLabel(board, "cell-good")).toHaveLength(7);
    expect(byLabel(board, "cell-fail")).toHaveLength(2);
    // The bomb-out says so where the number would be.
    const bomb = await render({ csv: CSV, row: "4" });
    expect(textOf(bomb, "total")).toBe("NO TOTAL");
    expect(textOf(bomb, "total-label")).toBe("TOTAL");
    expect(bomb.children?.bar).toBeUndefined();
  });

  it("frame 0 is the finished board, the attempts land in meet order, and the last frame equals the first", async () => {
    const doc = await render();
    const b = meetBeats(12);
    expect(b).toEqual({ clip: 12, hook: 1.5, replay: 7.5, end: 9 });
    expect(meetLandAt(8, 9, b)).toBe(9);
    expect(meetLandAt(0, 9, b)).toBeCloseTo(1.5 + 7.5 / 9, 3);
    const board = doc.children?.board as MosaicDocument;
    const outcomes = sourcesOf(board).filter((s) => s.editor?.label === "cell-good" || s.editor?.label === "cell-fail");
    const rings = byLabel(board, "cell-now");
    expect(byLabel(board, "cell")).toHaveLength(9);
    expect(outcomes).toHaveLength(9);
    expect(rings).toHaveLength(9);
    expect(byLabel(board, "cell-hollow")).toHaveLength(1);
    const landed = (t: number) => outcomes.filter((s) => on(s.overlay?.enable, t)).length;
    expect(landed(0)).toBe(9);
    expect(landed(1.6)).toBe(0);
    expect(landed(meetLandAt(3, 9, b) + 0.001)).toBe(4);
    expect(landed(9)).toBe(9);
    expect(landed(11.9)).toBe(landed(0));
    // Exactly one ring at any moment of the replay, none outside it; each carries the structured window twin.
    for (const t of [1.5, 2, 4.4, 8.99]) expect(rings.filter((s) => on(s.overlay?.enable, t))).toHaveLength(1);
    for (const t of [0, 1.49, 9, 11.9]) expect(rings.filter((s) => on(s.overlay?.enable, t))).toHaveLength(0);
    for (const s of rings) expect(s.overlay?.window).toEqual({ startSec: expect.any(Number), endSec: expect.any(Number) });
    for (const s of outcomes) expect(s.overlay?.window).toBeUndefined();
    // The stamp, the place and the points: on in the cold open and from the last attempt on.
    for (const label of ["stamp", "stamp-text", "place", "points"]) {
      const s = byLabel(doc, label)[0];
      expect(on(s.overlay?.enable, 0)).toBe(true);
      expect(on(s.overlay?.enable, 5)).toBe(false);
      expect(on(s.overlay?.enable, 9)).toBe(true);
    }
    // A lift's best is named once its last attempt has landed.
    const best = byLabel(doc, "best-squat")[0];
    expect(on(best.overlay?.enable, meetLandAt(2, 9, b) - 0.01)).toBe(false);
    expect(on(best.overlay?.enable, meetLandAt(2, 9, b))).toBe(true);
    // The weights wait in their cells through the whole clip.
    for (const s of sourcesOf(doc).filter((x) => x.editor?.label?.startsWith("weight-"))) expect(s.overlay).toBeUndefined();
  });

  it("the counted total opens on the total, restarts at zero, climbs by the bests, and ends on the exact total", async () => {
    const m = buildMeet(META, raw({ squat: [...MEET_DEFAULT_ATTEMPTS.squat], bench: [...MEET_DEFAULT_ATTEMPTS.bench], deadlift: [...MEET_DEFAULT_ATTEMPTS.deadlift] }), "kg");
    const b = meetBeats(12);
    const steps = meetSteps(m, b);
    // Eight good lifts, each heavier than the one before it: eight steps. The missed bench is not one.
    expect(steps.map((s) => s.subtotalKg)).toEqual([140, 147.5, 150, 227.5, 232.5, 377.5, 387.5, 392.5]);
    expect(meetDecimals(m, "kg")).toBe(1);
    expect(meetDecimals(m, "lb")).toBe(0);
    const expr = meetTotalExpr(m, "kg", b);
    expect(expr.match(/%\{eif/g)).toHaveLength(2);
    expect(expr).toContain("if(lt(t\\,1.500)\\,392.5\\,");
    expect(totalAt(expr, 0)).toBe(392.5);
    expect(totalAt(expr, 1.6)).toBe(0);
    expect(totalAt(expr, steps[2].at + 0.6)).toBe(150);
    expect(totalAt(expr, steps[4].at + 0.6)).toBe(232.5);
    expect(totalAt(expr, 9.5)).toBe(392.5);
    expect(totalAt(expr, 11.99)).toBe(392.5);
    // Pounds count whole pounds and end on the converted total, not on a sum of rounded steps.
    const lb = meetTotalExpr(m, "lb", b);
    expect(lb.match(/%\{eif/g)).toHaveLength(1);
    expect(totalAt(lb, 11)).toBe(meetLb(392.5));
    expect(totalAt(lb, 0)).toBe(865);
    // Quarter kilos print two decimals.
    expect(meetDecimals(buildMeet(META, raw({ bench: [102.25] }), "kg"), "kg")).toBe(2);
    expect(meetDecimals(buildMeet(META, raw({ bench: [100] }), "kg"), "kg")).toBe(0);
    const doc = await render({ units: "kg" });
    expect(byLabel(doc, "total")[0].layers?.[0]?.content?.expr).toBe(expr);
    // Both units count in kilograms: the pounds are said once, beside the points.
    expect(byLabel(await render({ units: "both" }), "total")[0].layers?.[0]?.content?.expr).toBe(expr);
  });

  it("both children render on 5-smooth canvases; the bar is the total to scale, one segment a lift", async () => {
    const doc = await render({}, 1263, 711);
    const smooth = (v: number) => {
      let m = v;
      for (const p of [2, 3, 5]) while (m % p === 0) m /= p;
      return m === 1;
    };
    const board = doc.children?.board as MosaicDocument;
    const bar = doc.children?.bar as MosaicDocument;
    for (const child of [board, bar]) {
      expect(child).toBeDefined();
      expect(smooth(child.size!.width) && smooth(child.size!.height)).toBe(true);
      expect(child.backgroundColor).toBe("#0e1116");
    }
    expect(byLabel(bar, "bar-track")).toHaveLength(1);
    expect(byLabel(bar, "bar-squat")).toHaveLength(3);
    expect(byLabel(bar, "bar-bench")).toHaveLength(2);
    expect(byLabel(bar, "bar-deadlift")).toHaveLength(3);
    const m = buildMeet(META, raw({ squat: [...MEET_DEFAULT_ATTEMPTS.squat], bench: [...MEET_DEFAULT_ATTEMPTS.bench], deadlift: [...MEET_DEFAULT_ATTEMPTS.deadlift] }), "both");
    for (const [w, h] of [[1080, 1920], [1920, 1080], [1080, 1080], [480, 270]] as const) {
      const L = layoutMeet(m, "both", w, h);
      expect(L.cells).toHaveLength(9);
      // Every cell, and the ring around it, stays inside the board child.
      for (const c of L.cells) {
        expect(c.local.x - L.ring).toBeGreaterThanOrEqual(0);
        expect(c.local.y - L.ring).toBeGreaterThanOrEqual(0);
        expect(c.local.x + c.local.w + L.ring).toBeLessThanOrEqual(L.board.w);
        expect(c.local.y + c.local.h + L.ring).toBeLessThanOrEqual(L.board.h);
        expect(c.sub?.text).toBe(`${meetLb(c.attempt!.kg)} lb`);
      }
      // The board and the total stack never share pixels.
      const stackTop = L.totalLabelRect.y;
      if (!L.landscape) expect(L.board.y + L.board.h).toBeLessThanOrEqual(stackTop);
      else expect(L.board.x + L.board.w).toBeLessThanOrEqual(L.totalLabelRect.x);
      expect(L.totalSample).toBe("888.8");
    }
    // A square runs out of height first: each lift's name sits beside its cells, so the cells keep theirs.
    const square = layoutMeet(m, "both", 1080, 1080);
    expect(square.rows[0].bestAlign).toBe("left");
    expect(square.rows[0].best?.text).toBe("best 150 kg");
    expect(square.rows[0].bestSub?.text).toBe("330 lb");
    expect(square.rows[0].labelRect.x + square.rows[0].labelRect.w).toBeLessThanOrEqual(square.board.x + square.cells[0].local.x);
    expect(square.cells[0].local.h).toBeGreaterThanOrEqual(100);
    const reel = layoutMeet(m, "both", 1080, 1920);
    expect(reel.rows[0].bestAlign).toBe("right");
    expect(reel.rows[0].best?.text).toBe("best 150 kg / 330 lb");
    expect(reel.rows[0].bestSub).toBeNull();
  });

  it("the accent is drawn as given where it reads, and pulled toward the ink where it would vanish", async () => {
    const yellow = "#ffd23f" as never;
    expect(meetReadable(yellow, "#0e1116" as never, "#f2f5f8" as never)).toBe("#ffd23f");
    const onLight = meetReadable(yellow, "#f5f6f8" as never, "#12161c" as never);
    expect(onLight).not.toBe("#ffd23f");
    expect(meetContrast(onLight, "#f5f6f8" as never)).toBeGreaterThanOrEqual(3);
    expect(meetContrast("#000000" as never, "#ffffff" as never)).toBeCloseTo(21, 5);
    const style = (doc: MosaicDocument) => (byLabel(doc, "total")[0].layers?.[0] as { style?: { fontColor?: string } }).style?.fontColor;
    expect(style(await render())).toBe("#ffd23f");
    expect(style(await render({ preset: "light" }))).toBe(onLight);
    // The stamp stays a box of the accent itself, with ink that reads on it.
    const light = await render({ preset: "light" });
    expect(JSON.stringify(byLabel(light, "stamp")[0])).toContain("#ffd23f");
  });

  it("the clip is authored: clipSec sets it, an explicit pin overrides it", async () => {
    expect((await render()).durationMs).toBe(12000);
    expect((await render({ clipSec: 20 })).durationMs).toBe(20000);
    expect(PowerliftingMeetRecapV1.resolveOutputHints?.(PowerliftingMeetRecapV1.defaultProps)).toEqual({ durationMs: 12000 });
    expect((await render({}, 1080, 1920, targetCtx(1080, 1920, { durationMs: 2000 }))).durationMs).toBe(12000);
    const pinned = { ...targetCtx(1080, 1920), userIntent: { durationMs: 8000 } } as unknown as MosaicEngineContext;
    const doc = await PowerliftingMeetRecapV1.render({ ...PowerliftingMeetRecapV1.defaultProps }, pinned).then(asDocument);
    expect(doc.durationMs).toBe(8000);
    expect((doc.children?.board as MosaicDocument).durationMs).toBe(8000);
  });

  it("is deterministic, takes the attempts as a JSON string too, and rejects what the schema promises to reject", async () => {
    expect(await render()).toEqual(await render());
    expect((await render({ attempts: JSON.stringify(MEET_DEFAULT_ATTEMPTS) })).m0).toBe((await render()).m0);
    await expect(render({ attempts: {} })).rejects.toThrow(/no attempts/);
    await expect(render({ attempts: { squat: [100, 110, 120, 125] } })).rejects.toThrow(/three attempts/);
    await expect(render({ attempts: { squat: ["heavy"] } as never })).rejects.toThrow(/not a weight/);
    await expect(render({ attempts: { snatch: [100] } as never })).rejects.toThrow(/not a lift/);
    await expect(render({ attempts: [100, 110] as never })).rejects.toThrow(/must be an object/);
    await expect(render({ attempts: "{not json" })).rejects.toThrow(/not valid JSON/);
    await expect(render({ place: "first" })).rejects.toThrow(/Place/);
    await expect(render({ dots: -1 })).rejects.toThrow(/dots/);
    await expect(render({ accent: "gold" })).rejects.toThrow(/#rrggbb/);
    await expect(render({ preset: "sepia" as never })).rejects.toThrow(/must be one of/);
    await expect(render({ units: "stone" as never })).rejects.toThrow(/must be one of/);
    await expect(render({ clipSec: 5 })).rejects.toThrow(/between 6 and 30/);
    await expect(render({ clipSec: 12.5 })).rejects.toThrow(/whole number/);
    await expect(render({ csv: "not,a,results,file\n1,2,3,4" })).rejects.toThrow(/OpenPowerlifting/);
    await expect(render({ csv: CSV, row: "9" })).rejects.toThrow(/outside the csv/);
  });
});
