import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { getOpentype, bundledFontPath, resolveFontFile, resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, checkLayoutIntent, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { widthOf } from "../../../_shared/text";
import {
  CubingAverageCardV1 as T,
  cubingAverage,
  formatCubingDelta,
  formatCubingTime,
  layoutCubingCard,
  normalizeCubingCard,
  parseCubingTime,
  parseSolve,
} from "./cubing-average-card";
import type { CubingAverageCardProps } from "./cubing-average-card";

const ID = "@one-a-day/sports/cubing-average-card/v1";
const render = (p: CubingAverageCardProps = {}, w = 1080, h = 1080) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: CubingAverageCardProps, w = 1080, h = 1080) => Object.fromEntries(layoutCubingCard(p, w, h).cells.map((c) => [c.label, c.text.replace(/\n/g, " ")]));
const SOLVES = T.defaultProps!.solves as string[];
const AO12 = ["27.39", "29.10", "26.55", "31.02", "DNF", "28.44", "25.98", "27.71", "30.36", "26.83", "28.90", "27.15"];
const rect = (L: ReturnType<typeof layoutCubingCard>, label: string) => L.tiles.find((t) => t.label === label)?.rect;

// The copy that stresses the card: twelve solves, one over a minute and a DNF, a
// 30-character handle, the long event name, a previous PB over a minute.
const LONG: CubingAverageCardProps = {
  event: "3x3 One-Handed",
  solves: ["27.39", "1:02.45", "26.55", "31.02", "DNF", "28.44", "25.98", "27.71", "30.36", "26.83", "28.90+", "27.15"],
  previousPb: "1:05.00",
  cuber: "the_quick_brown_fox_jumps_ov",
  date: "Sat, Oct 4, 2026 - session 3",
};
const CASES: CubingAverageCardProps[] = [
  {},
  LONG,
  { ...LONG, bar: "spread", avgLine: true, preset: "light" },
  { ...LONG, solves: ["DNF", "1:02.45", "DNF", "31.02", "DNF", "28.44", "25.98", "27.71", "30.36", "26.83", "28.90+", "27.15"] },
  { solves: AO12, event: "OH", bar: "spread" },
  { solves: AO12, avgLine: true },
  { event: "", cuber: "", date: "" },
  { event: "", cuber: "mira_cubes", date: "" },
  { solves: ["19.04", "18.50", "20.00"], event: "3BLD" },
  { solves: ["19.04", "18.50", "DNF"], previousPb: "" },
  { solves: ["DNF", "DNF", "DNF", "DNF", "DNF"] },
  { solves: ["DNF", "DNF", "31.02", "28.44", "25.98"], bar: "spread" },
  { solves: ["10.00", "10.00", "10.00", "10.00", "10.00"], bar: "spread", previousPb: "10.00" },
  { previousPb: "DNF" },
  { previousPb: "25.00", accent: "#2ec4b6" },
  { cuber: "Zoë Åström", date: "Łódź, 4 Oct" },
];

describe(ID, () => {
  it("shows the use case at its defaults: an Ao5, two dropped solves, the average, a new PB", () => {
    const t = textOf({});
    expect(t).toMatchObject({
      kind: "AO5", event: "3x3", cuber: "mira_cubes", date: "Oct 4, 2026",
      headline: "27.80", pb: "NEW PB", delta: "-0.55 vs previous Ao5 PB", "pb-value": "28.35",
      "index-0": "1", "time-0": "27.84",
      "index-1": "2", "time-1": "(24.19)",
      "index-2": "3", "time-2": "29.50+",
      "index-3": "4", "time-3": "(31.62)",
      "index-4": "5", "time-4": "26.07",
      footnote: "Best and worst dropped (in parentheses). Average of the middle 3, rounded to hundredths. A trailing + is a +2, already included. Bars: distance from the average, left = faster.",
    });
    expect(Object.keys(t).filter((k) => k.startsWith("time-"))).toHaveLength(5);
    expect(T.outputHints).toMatchObject({ width: 1080, height: 1080, format: { kind: "image" } });
    expect(T.defaultProps).toMatchObject({ bar: "spread", avgLine: false });
  });

  it("does its arithmetic in integer hundredths, the average rounded half up", () => {
    expect(parseCubingTime("27.84")).toBe(2784);
    expect(parseCubingTime("1:02.45")).toBe(6245);
    expect(parseCubingTime("0:27.84")).toBe(2784);
    for (const bad of ["", "27.8", "27", "1:75.00", "1:2.00", "27,84", "-27.84", "27.840", "0.00", "abc", "27.84+"]) expect(parseCubingTime(bad)).toBeNull();
    expect(parseSolve("29.50+")).toEqual({ cs: 2950, plus: true });
    expect(parseSolve("DNF")).toEqual({ cs: null, plus: false });
    expect(parseSolve("dnf(15.20)")).toEqual({ cs: null, plus: false });
    expect(parseSolve("DNF(1:02.45)")).toEqual({ cs: null, plus: false });
    expect(parseSolve("DNF+")).toBeNull();
    expect([2784, 6245, 5, 6000].map(formatCubingTime)).toEqual(["27.84", "1:02.45", "0.05", "1:00.00"]);
    expect([-55, 31, 0, -6233].map(formatCubingDelta)).toEqual(["-0.55", "+0.31", "0.00", "-1:02.33"]);

    // The defaults: best 24.19, worst 31.62, counting 2784 + 2950 + 2607 = 8341, / 3 = 2780.33.
    const d = cubingAverage(SOLVES);
    expect([d.kind, d.avgCs, d.counting]).toEqual(["Ao5", 2780, 3]);
    expect(d.solves.map((s) => s.drop)).toEqual([null, "best", null, "worst", null]);
    expect(normalizeCubingCard({}).headline).toBe("27.80");
    // The Ao12 rounding edge: ten counting solves sum to 28345, 2834.5 rounds up. A float sum prints 28.34.
    const e = cubingAverage(AO12);
    expect([e.kind, e.avgCs, e.counting]).toEqual(["Ao12", 2835, 10]);
    expect(e.solves[4]).toMatchObject({ drop: "worst", text: "(DNF)" });
    expect(e.solves[6]).toMatchObject({ drop: "best", text: "(25.98)" });
    expect(normalizeCubingCard({ solves: AO12 }).headline).toBe("28.35");
    // Mo3 keeps all three; one DNF makes it DNF.
    expect(cubingAverage(["19.04", "18.50", "20.00"])).toMatchObject({ kind: "Mo3", avgCs: 1918, counting: 3 });
    expect(cubingAverage(["19.04", "18.50", "20.00"]).solves.every((s) => s.drop === null)).toBe(true);
    expect(cubingAverage(["19.04", "18.50", "DNF"]).avgCs).toBeNull();
    // Ao5 with one DNF: the DNF is the dropped worst and the average still counts.
    expect(cubingAverage(["20.00", "DNF", "21.00", "22.00", "23.00"])).toMatchObject({ avgCs: 2200 });
    // Ao5 with two DNFs: the last DNF is the worst, the best is dropped, the other DNF still counts -> DNF.
    const two = cubingAverage(["DNF", "20.00", "DNF", "21.00", "22.00"]);
    expect(two.avgCs).toBeNull();
    expect(two.solves.map((s) => s.drop)).toEqual([null, "best", "worst", null, null]);
    // Ties: the first of equal fastest, the last of equal slowest - two different solves.
    const tie = cubingAverage(["10.00", "10.00", "10.00", "10.00", "10.00"]);
    expect(tie.solves.map((s) => s.drop)).toEqual(["best", null, null, null, "worst"]);
    expect(tie.avgCs).toBe(1000);
    // Every solve a DNF: two different solves are still dropped, the average is DNF.
    expect(cubingAverage(["DNF", "DNF", "DNF", "DNF", "DNF"]).solves.map((s) => s.drop)).toEqual(["best", null, null, null, "worst"]);
    // A +2 is already in the number; it is printed, counted as it stands, and hangs "+" past the digit edge.
    expect(cubingAverage(["29.50+", "20.00", "21.00"]).solves[0]).toMatchObject({ plus: true, cs: 2950, text: "29.50+", suffix: "+" });
    expect(cubingAverage(["20.00", "30.50+", "21.00", "19.00", "22.00"]).solves[1]).toMatchObject({ drop: "worst", text: "(30.50+)", suffix: "+)" });
  });

  it("prints the delta with its sign, a chip only for a strictly faster average, and no warning colour", () => {
    const faster = normalizeCubingCard({});
    expect([faster.newPb, faster.deltaText, faster.pbText]).toEqual([true, "-0.55 vs previous Ao5 PB", "28.35"]);
    const slower = normalizeCubingCard({ previousPb: "25.00" });
    expect([slower.newPb, slower.deltaText]).toEqual([false, "+2.80 vs previous Ao5 PB"]);
    const tie = normalizeCubingCard({ previousPb: "27.80" });
    expect([tie.newPb, tie.deltaText]).toEqual([false, "ties previous Ao5 PB"]);
    for (const none of [{ previousPb: "" }, { previousPb: "DNF" }, { previousPb: "dnf" }, { solves: ["19.04", "18.50", "DNF"] }]) {
      const n = normalizeCubingCard(none);
      expect([n.newPb, n.deltaText]).toEqual([false, ""]);
    }
    // No chip, no delta cells, when there is nothing to compare.
    for (const none of [{ previousPb: "" }, { solves: ["DNF", "20.00", "DNF", "21.00", "22.00"] }]) {
      const t = textOf(none);
      expect([t.pb, t.delta, t["pb-value"]]).toEqual([undefined, undefined, undefined]);
    }
    expect(textOf({ solves: ["DNF", "20.00", "DNF", "21.00", "22.00"] }).headline).toBe("DNF");
    // The slower card has no NEW PB tile and nothing red: text is the ink, the dim ink, the accent or the on-chip ink.
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutCubingCard({ previousPb: "25.00" }, w, h);
      expect(L.tiles.some((t) => t.label === "pb-chip")).toBe(false);
      const colours = new Set(L.cells.map((c) => c.color));
      for (const c of colours) expect([L.theme.ink, L.theme.dim, L.p.accent, "#0b1220", "#ffffff"]).toContain(c);
      expect(L.cells.find((c) => c.label === "delta")!.color).toBe(L.theme.ink);
    }
  });

  it("draws one bar per solve with a time, proportional to the footnote's quantity, hollow when dropped", async () => {
    for (const [w, h] of CONTRACT_CANVASES) for (const q of [{}, { solves: AO12 }, { solves: ["19.04", "18.50", "DNF"] }, { solves: ["DNF", "DNF", "31.02", "28.44", "25.98"] }, LONG]) {
      const p = { ...q, bar: "length" as const };
      const L = layoutCubingCard(p, w, h);
      const resolved = checkLayoutIntent(await render(p, w, h), w, h)!.resolved;
      const tracks = L.rows.map((_, i) => resolved[`track-${i}`][0].rect);
      // One size, one left edge - from the rects the engine realizes.
      for (const t of tracks) {
        expect(Math.abs(t.x - tracks[0].x)).toBeLessThanOrEqual(1);
        expect(Math.abs(t.w - tracks[0].w)).toBeLessThanOrEqual(2);
        expect(Math.abs(t.h - tracks[0].h)).toBeLessThanOrEqual(2);
        expect(t.w).toBeGreaterThanOrEqual(w * 0.2);
      }
      const maxCs = Math.max(...L.p.lines.filter((l) => l.cs !== null).map((l) => l.cs as number));
      let filled = 0;
      L.p.lines.forEach((l, i) => {
        const bar = resolved[`bar-${i}`]?.[0]?.rect, hole = resolved[`hole-${i}`]?.[0]?.rect;
        if (l.cs === null) { expect(bar).toBeUndefined(); expect(hole).toBeUndefined(); return; }
        expect(bar).toBeDefined();
        // The bar grows from the track's left edge; its width is time / slowest of the track, within the pixel or two quantization takes.
        expect(Math.abs(bar!.x - tracks[i].x)).toBeLessThanOrEqual(1);
        expect(Math.abs(bar!.w - (l.cs / maxCs) * tracks[i].w)).toBeLessThanOrEqual(Math.max(3, tracks[i].w * 0.011));
        if (l.cs === maxCs) { filled++; expect(Math.abs(bar!.w - tracks[i].w)).toBeLessThanOrEqual(2); }
        // Dropped = outline: a track-coloured hole inside the bar. Counting = solid.
        expect(hole !== undefined).toBe(l.drop !== null);
        if (hole) {
          expect(hole.x).toBeGreaterThan(bar!.x);
          expect(hole.x + hole.w).toBeLessThan(bar!.x + bar!.w);
          expect(hole.y).toBeGreaterThan(bar!.y);
          expect(hole.y + hole.h).toBeLessThan(bar!.y + bar!.h);
          expect(L.tiles.find((t) => t.label === `hole-${i}`)!.color).toBe(L.trackColor);
        }
        expect(L.tiles.find((t) => t.label === `bar-${i}`)!.color).toBe(L.p.accent);
      });
      expect(filled).toBeGreaterThan(0);
    }
    // Defaults, as the brief tabulates them (share of the 31.62 track; 24.19/31.62 is 76.5%, which rounds to 77).
    const shares = layoutCubingCard({ bar: "length" }, 1080, 1080).p.lines.map((l) => Math.round(l.share * 100));
    expect(shares).toEqual([88, 77, 93, 100, 82]);
    // Every DNF has its empty track and no bar tile; an all-DNF card has no bars at all.
    const noBars = layoutCubingCard({ solves: ["DNF", "DNF", "DNF", "DNF", "DNF"], bar: "length" }, 1080, 1080);
    expect(noBars.tiles.filter((t) => t.label.startsWith("bar-"))).toHaveLength(0);
    expect(noBars.tiles.filter((t) => t.label.startsWith("track-"))).toHaveLength(5);
    expect(noBars.p.footnote).not.toMatch(/Bars/);
  });

  it("spread bars grow from the average: left faster, right slower, the largest distance fills its half", async () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutCubingCard({ bar: "spread" }, w, h);
      const resolved = checkLayoutIntent(await render({ bar: "spread" }, w, h), w, h)!.resolved;
      const avg = 2780;
      const times = [2784, 2419, 2950, 3162, 2607], maxDist = 3162 - avg;
      times.forEach((cs, i) => {
        const track = resolved[`track-${i}`][0].rect, bar = resolved[`bar-${i}`][0].rect, c = resolved[`centre-${i}`][0].rect;
        const mid = track.x + track.w / 2, half = track.w / 2;
        expect(Math.abs(c.x + c.w / 2 - mid)).toBeLessThanOrEqual(2);
        if (cs < avg) expect(Math.abs(bar.x + bar.w - mid)).toBeLessThanOrEqual(2); else expect(Math.abs(bar.x - mid)).toBeLessThanOrEqual(2);
        expect(Math.abs(bar.w - (Math.abs(cs - avg) / maxDist) * half)).toBeLessThanOrEqual(Math.max(3, half * 0.012));
        if (cs === 3162) expect(Math.abs(bar.w - half)).toBeLessThanOrEqual(2);
      });
      // The centre line is clear of every label: texts live in their own columns.
      for (const [i, r] of L.rows.entries()) for (const c of L.cells) {
        const hit = r.centre!.x < c.rect.x + c.rect.w && c.rect.x < r.centre!.x + r.centre!.w && r.centre!.y < c.rect.y + c.rect.h && c.rect.y < r.centre!.y + r.centre!.h;
        if (hit) throw new Error(`centre-${i} collides with ${c.label} at ${w}x${h}`);
      }
    }
    expect(textOf({ bar: "spread" }).footnote).toContain("Bars: distance from the average, left = faster.");
    // With a DNF average there is no centre: spread falls back to length and says so.
    const fb = layoutCubingCard({ bar: "spread", solves: ["DNF", "20.00", "DNF", "21.00", "22.00"] }, 1080, 1080);
    expect(fb.p.barKind).toBe("length");
    expect(fb.tiles.some((t) => t.label.startsWith("centre-"))).toBe(false);
    expect(fb.p.footnote).toContain("No average, so bars are drawn from zero");
    // A solve exactly at the average has no distance to draw and gets no bar.
    const same = layoutCubingCard({ solves: ["10.00", "10.00", "10.00", "10.00", "10.00"], bar: "spread" }, 1080, 1080);
    expect(same.tiles.filter((t) => t.label.startsWith("bar-"))).toHaveLength(0);
  });

  it("the average tick sits at the average in every track and is named in the footnote", async () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutCubingCard({ bar: "length", avgLine: true }, w, h);
      const resolved = checkLayoutIntent(await render({ bar: "length", avgLine: true }, w, h), w, h)!.resolved;
      for (let i = 0; i < 5; i++) {
        const track = resolved[`track-${i}`][0].rect, t = resolved[`tick-${i}`][0].rect;
        expect(Math.abs(t.x + t.w / 2 - (track.x + track.w * (2780 / 3162)))).toBeLessThanOrEqual(2);
      }
      expect(L.p.footnote).toContain("Tick = the average.");
    }
    expect(layoutCubingCard({}, 1080, 1080).tiles.some((t) => t.label.startsWith("tick-"))).toBe(false);
    expect(textOf({ bar: "length" }).footnote).toContain("Bars are drawn from zero; the slowest fills the track.");
    expect(textOf({}).footnote).not.toContain("Tick");
    // No average, no tick; a spread card has its centre line instead.
    expect(layoutCubingCard({ bar: "length", avgLine: true, solves: ["19.04", "18.50", "DNF"] }, 1080, 1080).tiles.some((t) => t.label.startsWith("tick-"))).toBe(false);
    expect(layoutCubingCard({ avgLine: true, bar: "spread" }, 1080, 1080).tiles.some((t) => t.label.startsWith("tick-"))).toBe(false);
  });

  it("keeps its contract from Mo3 to Ao12 at the seven contract canvases, with nothing colliding", async () => {
    for (const p of CASES) {
      await sweepLayout((q, ctx) => T.render(q, ctx).then(asDocument), ID, p, targetCtx);
      for (const [w, h] of CONTRACT_CANVASES) {
        const L = layoutCubingCard(p, w, h);
        const doc = await render(p, w, h);
        const ev = evaluateM0(String(doc.m0), { width: w, height: h });
        expect(ev.feasible && ev.meetsPrecision).toBe(true);
        // Every source is labelled and promised something; every text promises that it fits.
        const intent = layoutIntentOf(doc)!;
        for (const s of doc.sources ?? []) {
          expect(s.editor?.label).toBeTruthy();
          expect(intent.constraints.some((c) => c.label === s.editor?.label)).toBe(true);
          if (s.type === "text") expect(intent.constraints.some((c) => c.label === s.editor?.label && c.textFits)).toBe(true);
        }

        // Inside the margins, never below the floor, never cut.
        for (const c of L.cells) {
          expect(c.px).toBeGreaterThanOrEqual(L.small);
          expect(c.text).not.toContain("...");
          expect(c.rect.x).toBeGreaterThanOrEqual(L.m);
          expect(c.rect.y).toBeGreaterThanOrEqual(L.m);
          expect(c.rect.x + c.rect.w).toBeLessThanOrEqual(w - L.m);
          expect(c.rect.y + c.rect.h).toBeLessThanOrEqual(h - L.m);
        }
        // No two texts overlap, and no text sits on a tile it does not belong to.
        const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        for (let i = 0; i < L.cells.length; i++) for (let j = i + 1; j < L.cells.length; j++) {
          if (hit(L.cells[i].rect, L.cells[j].rect)) throw new Error(`${L.cells[i].label} overlaps ${L.cells[j].label} at ${w}x${h}`);
        }
        for (const t of L.tiles) for (const c of L.cells) {
          const own = (t.label === "kind-chip" && c.label === "kind") || (t.label === "pb-chip" && c.label === "pb");
          if (!own && hit(t.rect, c.rect)) throw new Error(`${c.label} overlaps ${t.label} at ${w}x${h}`);
        }
        // The headline in the top half, the footnote in the bottom fifth; the rows in their band, in order, one size.
        const cell = (label: string) => L.cells.find((c) => c.label === label)!;
        expect(cell("headline").rect.y + cell("headline").rect.h).toBeLessThanOrEqual(h * 0.5);
        expect(cell("footnote").rect.y).toBeGreaterThanOrEqual(h * 0.8);
        expect(L.rowH).toBeLessThanOrEqual(L.cap);
        expect(L.rows[0].top).toBeGreaterThanOrEqual(L.bandTop);
        L.rows.forEach((r, i) => expect(r.top).toBe(L.rows[0].top + i * L.rowH));
        expect(L.rows[L.rows.length - 1].top + L.rowH).toBeLessThanOrEqual(L.bandBottom);
        for (const label of ["index", "time"]) expect(new Set(L.cells.filter((c) => c.label.startsWith(`${label}-`)).map((c) => c.px)).size).toBe(1);
        // The headline is the largest text on the card, by a clear margin.
        const others = Math.max(...L.cells.filter((c) => c.label !== "headline").map((c) => c.px));
        expect(cell("headline").px).toBeGreaterThanOrEqual(others * (L.p.headline === "DNF" || p === LONG ? 1.2 : 1.8));
      }
    }
  });

  it("stacks the header, the solves and the footnote when narrow, and puts the solves in a right column when wide", () => {
    const wide = layoutCubingCard({}, 1920, 1080), square = layoutCubingCard({}, 1080, 1080), tall = layoutCubingCard({}, 1080, 1920);
    expect([wide.wide, square.wide, tall.wide]).toEqual([true, false, false]);
    const cell = (L: typeof wide, label: string) => L.cells.find((c) => c.label === label)!.rect;
    // Wide: the solves are a column to the right of the headline and of the footnote.
    expect(wide.rows[0].track.x).toBeGreaterThan(cell(wide, "headline").x + cell(wide, "headline").w);
    expect(wide.rows[0].track.x).toBeGreaterThan(cell(wide, "footnote").x + cell(wide, "footnote").w);
    expect(wide.rows[0].top).toBe(wide.m);
    // Stacked: the rows start under the delta line and end above the footnote.
    for (const L of [square, tall]) {
      expect(L.rows[0].top).toBeGreaterThan(cell(L, "pb-value").y + cell(L, "pb-value").h);
      expect(L.rows[4].top + L.rowH).toBeLessThanOrEqual(cell(L, "footnote").y);
      expect(L.footLines).toBeLessThanOrEqual(2);
    }
    // The columns do not shift between rows, and the time digits end on one edge (the decimal points stack).
    for (const L of [wide, square, tall]) {
      expect(new Set(L.rows.map((_, i) => cell(L, `index-${i}`).x)).size).toBe(1);
      L.rows.forEach((r, i) => {
        const c = L.cells.find((q) => q.label === `time-${i}`)!;
        expect(c.rect.x + c.rect.w - Math.ceil(widthOf(r.line.suffix, L.rowPx))).toBe(L.R);
      });
    }
    // A Mo3 does not become three slabs; the group sits at the top of its band.
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutCubingCard({ solves: ["19.04", "18.50", "20.00"] }, w, h);
      expect(L.rowH).toBe(L.cap);
      expect(L.cap).toBeLessThanOrEqual(Math.round(Math.min(w, h) * 0.17));
      expect(L.rows[0].top).toBe(L.bandTop);
    }
  });

  it("binds the text it shows to the prop it shows; derived text and the solves stay unbound", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    expect(Object.fromEntries(Object.entries(byProp).map(([key, v]) => [key, v.length]))).toEqual({ event: 1, cuber: 1, date: 1, previousPb: 1, accent: 1 });
    const bare = (await render({ event: "", cuber: "", date: "", previousPb: "" })).sources!.filter((s) => s.editor?.binding).length;
    expect(bare).toBe(1);
  });

  it("follows the accent and the preset, with the page as the document background", async () => {
    const dark = await render(), light = await render({ preset: "light", accent: "#E4572E" });
    expect([dark.backgroundColor, light.backgroundColor]).toEqual(["#10151c", "#f6f4ef"]);
    const L = layoutCubingCard({ preset: "light", accent: "#E4572E" }, 1080, 1080);
    expect(new Set(L.tiles.filter((t) => /^(bar|kind-chip|pb-chip)/.test(t.label)).map((t) => t.color))).toEqual(new Set(["#e4572e"]));
  });

  it("draws accented Latin names: every character it accepts has a glyph in both weights", () => {
    const opentype = getOpentype() as { loadSync(path: string): { charToGlyph(ch: string): { index: number } } };
    for (const path of [bundledFontPath(), resolveFontFile({ weight: "bold" })!.path]) {
      const font = opentype.loadSync(path);
      for (let code = 0xc0; code <= 0x17f; code++) {
        if (code === 0xd7 || code === 0xf7) continue;
        expect(font.charToGlyph(String.fromCodePoint(code)).index).not.toBe(0);
      }
    }
    expect(textOf({ cuber: "Zoë Åström" }).cuber).toBe("Zoë Åström");
    expect(() => normalizeCubingCard({ cuber: "魔方" })).toThrow(/cuber .*not known to draw/);
    expect(() => normalizeCubingCard({ event: "3x3 → OH" })).toThrow(/event .*not known to draw/);
  });

  it("is deterministic, follows ctx.target when nested, and passes its own contract with the overlay on", async () => {
    expect(await render()).toEqual(await render());
    const ctx = targetCtx(480, 270);
    ctx.output.width = 3840;
    ctx.output.height = 2160;
    expect(await T.render({}, ctx).then(asDocument)).toEqual(await render({}, 480, 270));
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
    expect((await render({ ...LONG, debugLayout: true }, 1920, 1080)).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it.each<[string, CubingAverageCardProps, RegExp]>([
    ["a solve that does not parse", { solves: ["27.84", "24.1", "29.50", "31.62", "26.07"] }, /solves\[1\] "24\.1" is not a solve/],
    ["a parenthesised solve", { solves: ["27.84", "(24.19)", "29.50", "31.62", "26.07"] }, /solves\[1\] "\(24\.19\)" is in parentheses: drop the parentheses/],
    ["a count of 7", { solves: Array(7).fill("20.00") }, /solves has 7 entries; .*a count of 7 would need 5 \(drop the last 2\) or 12 \(add 5 more\)/],
    ["a count of 2", { solves: ["20.00", "21.00"] }, /a count of 2 would need 3 \(add 1 more\)/],
    ["a count of 13", { solves: Array(13).fill("20.00") }, /a count of 13 would need 12 \(drop the last 1\)/],
    ["no solves", { solves: [] }, /solves has 0 entries/],
    ["solves that is not a list", { solves: "27.84" as unknown as string[] }, /solves must be a list of 3, 5 or 12/],
    ["a solve that is not a string", { solves: [27.84, 24.19, 29.5] as unknown as string[] }, /solves\[0\] must be a string/],
    ["a bad previousPb", { previousPb: "28.3" }, /previousPb "28\.3" is not a time/],
    ["a +2 previousPb", { previousPb: "28.35+" }, /previousPb "28\.35\+" is not a time/],
    ["a previousPb that is not a string", { previousPb: 28.35 as unknown as string }, /previousPb must be a string/],
    ["a 33-character cuber", { cuber: "W".repeat(33) }, /cuber .* is 33 characters; the card fits at most 32/],
    ["a two-line event", { event: "3x3\nOH" }, /event .*not known to draw/],
    ["an event that is not a string", { event: 3 as unknown as string }, /event must be a string/],
    ["an unknown bar", { bar: "ratio" as never }, /bar "ratio" must be "length" or "spread"/],
    ["an avgLine that is not a boolean", { avgLine: "yes" as never }, /avgLine must be a boolean/],
    ["an unknown preset", { preset: "sepia" as never }, /preset "sepia" must be "dark" or "light"/],
    ["a bad accent", { accent: "orange" }, /accent "orange" must be #rrggbb/],
    ["a debugLayout that is not a boolean", { debugLayout: "yes" as never }, /debugLayout must be a boolean/],
  ])("rejects %s by name, without falling back to the sample", (_name, props, message) => {
    expect(() => normalizeCubingCard(props)).toThrow(message);
    expect(() => normalizeCubingCard(props)).toThrow(new RegExp(`^${ID.replace(/[/]/g, "\\/")}: `));
  });

  it("refuses copy it cannot fit instead of clipping it", () => {
    expect(() => layoutCubingCard({ cuber: "W".repeat(32), event: "W".repeat(24) }, 160, 90)).toThrow(/cannot be fitted on 160x90/);
  });

  it("leaves the rect of an absent tile alone", () => {
    expect(rect(layoutCubingCard({ previousPb: "" }, 1080, 1080), "pb-chip")).toBeUndefined();
  });
});
