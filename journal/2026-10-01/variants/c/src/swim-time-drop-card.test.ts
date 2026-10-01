import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { getOpentype, bundledFontPath, resolveFontFile, resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, checkLayoutIntent, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  SwimTimeDropCardV1 as T,
  formatSwimDrop,
  formatSwimShare,
  formatSwimTime,
  layoutSwimCard,
  normalizeSwimCard,
  parseSwimTime,
} from "./swim-time-drop-card";
import type { SwimRow, SwimTimeDropCardProps } from "./swim-time-drop-card";

const ID = "@one-a-day/sports/swim-time-drop-card/v1";
const render = (p: SwimTimeDropCardProps = {}, w = 1080, h = 1080) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: SwimTimeDropCardProps, w = 1080, h = 1080) => Object.fromEntries(layoutSwimCard(p, w, h).cells.map((c) => [c.label, c.text.replace(/\n/g, " ")]));
const SWIMS = T.defaultProps!.swims as SwimRow[];

// The copy that stresses the card: eight rows, a 30-character name, the longest
// event name a club writes, a distance swim with a drop over a minute, a chip
// of four wide letters on every row.
const LONG: SwimTimeDropCardProps = {
  swimmer: "Maximiliana Wolfeschlegelstein",
  club: "Greater Larkmoor Aquatic Association",
  meet: "Autumn Long Course Championship Invitational",
  details: "Oct 3-4, 2026 - Girls 11-12 - Session 3",
  swims: [
    { event: "100 Breaststroke", entry: "1:32.40", final: "1:29.95", standard: "AAAA" },
    { event: "1650 Freestyle", entry: "19:58.44", final: "18:56.11", standard: "AAAA" },
    { event: "200 Breaststroke", entry: "3:18.02", final: "3:20.77", standard: "AAAA" },
    { event: "100 Butterfly", entry: "1:25.10", final: "1:25.10", standard: "AAAA" },
    { event: "400 Individual Medley", entry: "NT", final: "6:02.18", standard: "AAAA" },
    { event: "200 Backstroke", entry: "2:51.36", final: "DQ" },
    { event: "500 Freestyle", entry: "6:41.90", final: "6:33.05", standard: "AAAA" },
    { event: "50 Freestyle", entry: "33.20", final: "33.19", standard: "AAAA" },
  ],
};
const CASES: SwimTimeDropCardProps[] = [
  {},
  { bar: "seconds" },
  LONG,
  { ...LONG, bar: "seconds", preset: "light", course: "LCM" },
  { club: "", meet: "", details: "" },
  { club: "", details: "" },
  { meet: "", course: "SCM" },
  { swims: SWIMS.slice(0, 1) },
  { swims: SWIMS.slice(0, 2), details: "" },
  { swims: [{ event: "50 Free", entry: "NT", final: "30.97" }, { event: "100 Free", entry: "1:10.52", final: "DQ" }] },
  { swims: [{ event: "100 Back", entry: "1:19.77", final: "1:20.19" }] },
  { swimmer: "Zoë Åström-Niño", club: "Łódź Swim Club", accent: "#f2c14e" },
];

describe(ID, () => {
  it("shows the use case at its defaults: one invented swimmer, six swims, five drops, an honest slower swim", () => {
    const t = textOf({});
    expect(t).toMatchObject({
      swimmer: "Tessa Marlow", club: "Larkmoor Swim Club", meet: "October Kickoff Invitational", details: "Oct 3-4, 2026", course: "SCY",
      "head-event": "EVENT", "head-entry": "ENTRY", "head-final": "FINAL", "head-drop": "DROP",
      "event-0": "50 Free", "entry-0": "31.84", "final-0": "30.97", "drop-0": "-0.87", "standard-0": "BB",
      "event-2": "200 Free", "entry-2": "2:36.40", "final-2": "2:29.85", "drop-2": "-6.55", "standard-2": "B",
      "drop-3": "+0.42",
      "summary-count": "5 of 6 swims faster", "summary-total": "14.82 s dropped",
      footnote: "vs entry time. Bars and their percentages: share of the entry time dropped.",
      // Each percent bar prints its own number; the slower swim has neither a bar nor a number.
      "share-0": "2.7%", "share-1": "3.1%", "share-2": "4.2%", "share-4": "3.3%", "share-5": "2.3%",
    });
    expect(t["share-3"]).toBeUndefined();
    expect(["drop-0", "drop-1", "drop-2", "drop-3", "drop-4", "drop-5"].map((k) => t[k])).toEqual(["-0.87", "-2.21", "-6.55", "+0.42", "-1.18", "-4.01"]);
    // Four chips, and the rows without a standard have none.
    expect(Object.keys(t).filter((k) => k.startsWith("standard-"))).toEqual(["standard-0", "standard-1", "standard-2", "standard-4"]);
    expect(T.outputHints).toMatchObject({ width: 1080, height: 1080, format: { kind: "image" } });
  });

  it("does its arithmetic in integer hundredths and prints times the way a results sheet does", () => {
    expect(parseSwimTime("31.84")).toBe(3184);
    expect(parseSwimTime("1:10.52")).toBe(7052);
    expect(parseSwimTime("19:58.44")).toBe(119844);
    expect(parseSwimTime("0:31.84")).toBe(3184);
    expect(parseSwimTime("65.20")).toBe(6520);
    for (const bad of ["", "31.8", "31", "1:75.00", "1:5.20", "31,84", "1:10:52", "-31.84", "31.840", "0.00", "abc", " 31.84"]) expect(parseSwimTime(bad)).toBeNull();
    expect([3184, 7052, 119844, 6520, 5, 6000].map(formatSwimTime)).toEqual(["31.84", "1:10.52", "19:58.44", "1:05.20", "0.05", "1:00.00"]);
    expect([87, -42, 0, 6233, -6001].map(formatSwimDrop)).toEqual(["-0.87", "+0.42", "0.00", "-1:02.33", "+1:00.01"]);
    expect(formatSwimShare(655, 15640)).toBe("4.2%");
    expect(formatSwimShare(87, 3184)).toBe("2.7%");
    // A real drop too small to round to a tenth of a percent says so instead of reading as no drop.
    expect(formatSwimShare(1, 119844)).toBe("<0.1%");
    expect(formatSwimShare(60, 119844)).toBe("0.1%");
    // 0.1 + 0.2 territory: the float sum of these drops is 14.819999..., the integer sum is 1482.
    const n = normalizeSwimCard({});
    expect([n.faster, n.compared, n.totalCs]).toEqual([5, 6, 1482]);
    expect(n.lines.map((l) => l.dropCs)).toEqual([87, 221, 655, -42, 118, 401]);
  });

  it("prints a slower swim without drawing it, and makes no claim for an NT or a DQ", () => {
    const p: SwimTimeDropCardProps = { swims: [
      { event: "100 Back", entry: "1:19.77", final: "1:20.19", standard: "B" },
      { event: "50 Fly", entry: "36.10", final: "36.10" },
      { event: "200 IM", entry: "NT", final: "2:54.02", standard: "BB" },
      { event: "100 Free", entry: "", final: "1:08.31" },
      { event: "50 Free", entry: "31.84", final: "dq" },
      { event: "200 Free", entry: "2:36.40", final: "2:29.85" },
    ] };
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutSwimCard(p, w, h);
      expect(L.rows.map((r) => r.bar !== null)).toEqual([false, false, false, false, false, true]);
      expect(L.tiles.filter((t) => t.label.startsWith("bar-")).map((t) => t.label)).toEqual(["bar-5"]);
      // Every row keeps its track, and no ink on the card is a warning colour:
      // text is the ink, the dim ink, or the on-chip ink.
      expect(L.tiles.filter((t) => t.label.startsWith("track-"))).toHaveLength(6);
      const inks = new Set(L.cells.filter((c) => !/^(standard|share)-/.test(c.label) && c.label !== "course").map((c) => c.color));
      expect([...inks].sort()).toEqual([L.theme.dim, L.theme.ink].sort());
      expect(L.cells.find((c) => c.label === "drop-0")!.color).toBe(L.cells.find((c) => c.label === "drop-5")!.color);
    }
    const t = textOf(p);
    expect([t["drop-0"], t["drop-1"], t["drop-2"], t["drop-3"], t["drop-4"], t["drop-5"]]).toEqual(["+0.42", "0.00", "first swim", "first swim", undefined, "-6.55"]);
    expect([t["entry-2"], t["entry-3"], t["final-4"]]).toEqual(["NT", "NT", "DQ"]);
    // Counted: the three swims with both times. Not netted: the slower swim does not reduce the total.
    expect(t["summary-count"]).toBe("1 of 3 swims faster");
    expect(t["summary-total"]).toBe("6.55 s dropped");

    const none = textOf({ swims: [{ event: "100 Back", entry: "1:19.77", final: "1:20.19" }] });
    expect(none["summary-count"]).toBe("0 of 1 swim faster");
    expect(none["summary-total"]).toBeUndefined();
    expect(none.footnote).toBe("vs entry time. No swim was faster, so no bar is drawn.");
    const first = textOf({ swims: [{ event: "50 Free", entry: "NT", final: "30.97" }, { event: "100 Free", entry: "1:10.52", final: "DQ" }] });
    expect(first["summary-count"]).toBe("No times to compare");
    expect(first["summary-total"]).toBeUndefined();
    expect(first.footnote).not.toMatch(/Bars/);
    // A total over a minute is printed as a time.
    expect(textOf(LONG)["summary-total"]).toBe("1:13.64 dropped");
  });

  it("says vs entry time on every card and never calls a swim a best", async () => {
    for (const p of CASES) {
      const drawn = JSON.stringify((await render(p)).sources);
      expect(drawn).toContain("vs entry time");
      expect(drawn).not.toMatch(/\bPB\b|best time|personal best/i);
    }
  });

  it("draws bars proportional to what the footnote names, the longest filling its track", async () => {
    const shares = (bar: "percent" | "seconds") => normalizeSwimCard({ bar }).lines.map((l) => l.share);
    // percent: drop / entry against the largest share (200 Free, 655 / 15640).
    const pct = [87 / 3184, 221 / 7052, 655 / 15640, 0, 118 / 3610, 401 / 17803].map((s) => s / (655 / 15640));
    const sec = [87, 221, 655, 0, 118, 401].map((d) => d / 655);
    shares("percent").forEach((s, i) => expect(s).toBeCloseTo(pct[i], 12));
    shares("seconds").forEach((s, i) => expect(s).toBeCloseTo(sec[i], 12));
    // The two variants disagree visibly: the 50 Free outranks the 200 IM in percent, not in seconds.
    expect(shares("percent")[0]).toBeGreaterThan(shares("percent")[5]);
    expect(shares("seconds")[5]).toBeGreaterThan(shares("seconds")[0] * 4);
    expect(textOf({ bar: "seconds" }).footnote).toBe("vs entry time. Bars: seconds dropped; the longest is 6.55 s.");
    expect(textOf({ ...LONG, bar: "seconds" }).footnote).toBe("vs entry time. Bars: seconds dropped; the longest is 1:02.33.");

    for (const bar of ["percent", "seconds"] as const) for (const [w, h] of CONTRACT_CANVASES) {
      const want = shares(bar);
      const resolved = checkLayoutIntent(await render({ bar }, w, h), w, h)!.resolved;
      const tracks = want.map((_, i) => resolved[`track-${i}`][0].rect);
      // One size, one left edge - from the rects the engine realizes.
      for (const t of tracks) {
        expect(Math.abs(t.x - tracks[0].x)).toBeLessThanOrEqual(1);
        expect(Math.abs(t.w - tracks[0].w)).toBeLessThanOrEqual(2);
        expect(Math.abs(t.h - tracks[0].h)).toBeLessThanOrEqual(2);
        expect(t.w).toBeGreaterThanOrEqual(w * 0.2);
      }
      want.forEach((share, i) => {
        if (share === 0) { expect(resolved[`bar-${i}`]).toBeUndefined(); return; }
        const b = resolved[`bar-${i}`][0].rect;
        expect(Math.abs(b.x - tracks[i].x)).toBeLessThanOrEqual(1);
        // Proportional within the pixel or two quantization takes (and the 1% floor of a tiny bar).
        expect(Math.abs(b.w - share * tracks[i].w)).toBeLessThanOrEqual(Math.max(3, tracks[i].w * 0.011));
        if (share === 1) expect(Math.abs(b.w - tracks[i].w)).toBeLessThanOrEqual(2);
      });
    }
  });

  it("keeps its contract from 1 to 8 rows at the seven contract canvases, with nothing colliding", async () => {
    const rowCounts = Array.from({ length: 8 }, (_, i) => ({ ...LONG, swims: LONG.swims!.slice(0, i + 1) }));
    for (const p of [...CASES, ...rowCounts]) {
      await sweepLayout((q, ctx) => T.render(q, ctx).then(asDocument), ID, p, targetCtx);
      for (const [w, h] of CONTRACT_CANVASES) {
        const L = layoutSwimCard(p, w, h);
        // The document itself, for the stress copy (the row-count walk is swept above and laid out here, not rendered twice).
        if (CASES.includes(p)) {
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
        const texts = L.cells.map((c) => ({ label: c.label, rect: c.rect }));
        const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
          if (hit(texts[i].rect, texts[j].rect)) throw new Error(`${texts[i].label} overlaps ${texts[j].label} at ${w}x${h}`);
        }
        for (const t of L.tiles) for (const c of L.cells) {
          const own = (t.label === "course-chip" && c.label === "course") || (t.label.startsWith("chip-") && c.label === `standard-${t.label.slice(5)}`)
            || (/^(track|bar)-/.test(t.label) && c.label === `share-${t.label.split("-")[1]}`);
          if (!own && hit(t.rect, c.rect)) throw new Error(`${c.label} overlaps ${t.label} at ${w}x${h}`);
        }
        // The rows keep to their band, in order, and one or two swims do not become slabs.
        expect(L.rowH).toBeLessThanOrEqual(L.cap);
        expect(L.rows[0].top).toBeGreaterThan(L.bandTop);
        L.rows.forEach((r, i) => expect(r.top).toBe(L.rows[0].top + i * L.rowH));
        expect(L.rows[L.rows.length - 1].top + L.rowH).toBeLessThanOrEqual(L.bandBottom);
        // The name is the largest text; the summary is second.
        const px = Object.fromEntries(L.cells.map((c) => [c.label, c.px]));
        if (p === CASES[0]) {
          expect(px.swimmer).toBeGreaterThan(px["summary-count"]);
          expect(px["summary-count"]).toBeGreaterThan(px["event-0"]);
        }
      }
    }
  });

  it("prints a percent bar's own number at its end, and none in seconds", () => {
    for (const [w, h] of CONTRACT_CANVASES) for (const p of [{}, LONG]) {
      const L = layoutSwimCard(p, w, h);
      for (const [i, r] of L.rows.entries()) {
        const label = L.cells.find((c) => c.label === `share-${i}`);
        // A label exactly where there is a bar: a slower, equal, NT or DQ row has neither.
        expect(label !== undefined).toBe(r.bar !== null);
        if (!label || !r.bar) continue;
        expect(label.text).toBe(formatSwimShare(r.line.dropCs!, r.line.entryCs!));
        // On the track, on the bar's own line: just past the bar's end, or inside a bar too long to leave room.
        expect(label.rect.y).toBe(r.track.y);
        expect(label.rect.h).toBe(r.track.h);
        expect(label.rect.x).toBeGreaterThanOrEqual(r.track.x);
        expect(label.rect.x + label.rect.w).toBeLessThanOrEqual(r.track.x + r.track.w);
        const end = r.bar.x + r.bar.w;
        const after = label.rect.x >= end;
        if (!after) expect(label.rect.x + label.rect.w).toBeLessThanOrEqual(end);
        expect(label.color).toBe(after ? L.theme.ink : L.cells.find((c) => c.label === "course")!.color);
        expect(label.px).toBeGreaterThanOrEqual(L.small);
      }
      // In seconds the row already prints the bar's number as the drop: no labels, on the same
      // track column. (The footnote's length can move the band a line, so heights are not compared.)
      const S = layoutSwimCard({ ...p, bar: "seconds" }, w, h);
      expect(S.cells.some((c) => c.label.startsWith("share-"))).toBe(false);
      expect(S.rows.map((r) => [r.track.x, r.track.w])).toEqual(L.rows.map((r) => [r.track.x, r.track.w]));
    }
    expect(textOf(LONG)["share-1"]).toBe("5.2%");
    expect(textOf(LONG)["share-7"]).toBe("<0.1%");
  });

  it("puts the bar in a column on a wide canvas and under the row's text line otherwise", () => {
    const wide = layoutSwimCard({}, 1920, 1080), square = layoutSwimCard({}, 1080, 1080), tall = layoutSwimCard({}, 1080, 1920);
    expect([wide.wide, square.wide, tall.wide]).toEqual([true, false, false]);
    const cell = (L: typeof wide, label: string) => L.cells.find((c) => c.label === label)!.rect;
    // Wide: the track sits between FINAL and DROP on the text line.
    expect(wide.rows[0].track.x).toBeGreaterThan(cell(wide, "final-0").x + cell(wide, "final-0").w);
    expect(wide.rows[0].track.x + wide.rows[0].track.w).toBeLessThan(cell(wide, "drop-0").x);
    // Square and portrait: the full content width, under the text line.
    for (const L of [square, tall]) {
      expect(L.rows[0].track.w).toBe(L.cells.find((c) => c.label === "footnote")!.rect.w);
      expect(L.rows[0].track.y).toBeGreaterThanOrEqual(cell(L, "event-0").y + cell(L, "event-0").h);
    }
    // A row without a standard keeps the space: the columns do not shift between rows.
    for (const L of [wide, square, tall]) {
      expect(new Set(L.rows.map((_, i) => cell(L, `drop-${i}`).x)).size).toBe(1);
      expect(new Set(L.rows.filter((r) => r.chip).map((r) => r.chip!.x)).size).toBe(1);
    }
  });

  it("binds each text rect to the prop it shows; derived text and the enums stay unbound", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    // 6 events + 6 entries + 6 finals + 4 standards on `swims`; the accent on the course chip.
    expect(Object.fromEntries(Object.entries(byProp).map(([key, v]) => [key, v.length]))).toEqual({ swimmer: 1, club: 1, meet: 1, details: 1, accent: 1, swims: 22 });
    const bound = (await render({ club: "", meet: "", details: "" })).sources!.filter((s) => s.editor?.binding).length;
    expect(bound).toBe(24);
  });

  it("follows the accent and the preset, with the page as the document background", async () => {
    const dark = await render(), light = await render({ preset: "light", accent: "#E4572E" });
    expect([dark.backgroundColor, light.backgroundColor]).toEqual(["#0e1b25", "#f5f9fa"]);
    const L = layoutSwimCard({ preset: "light", accent: "#E4572E" }, 1080, 1080);
    expect(new Set(L.tiles.filter((t) => /^(bar|chip)-|course-chip/.test(t.label)).map((t) => t.color))).toEqual(new Set(["#e4572e"]));
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
    expect(textOf({ swimmer: "Zoë Åström" }).swimmer).toBe("Zoë Åström");
    // What it cannot promise to draw is refused by name, never drawn as tofu.
    expect(() => normalizeSwimCard({ swimmer: "游泳" })).toThrow(/swimmer .*not known to draw/);
    expect(() => normalizeSwimCard({ club: "Wave → Aquatics" })).toThrow(/club .*not known to draw/);
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

  it.each<[string, SwimTimeDropCardProps, RegExp]>([
    ["a time that does not parse", { swims: [{ event: "50 Free", entry: "31.8", final: "30.97" }] }, /swims\[0\]\.entry "31\.8" is not a time/],
    ["a final that does not parse", { swims: [SWIMS[0], { event: "100 Free", entry: "1:10.52", final: "1:75.00" }] }, /swims\[1\]\.final "1:75\.00" is not a time/],
    ["a missing final", { swims: [{ event: "50 Free", entry: "31.84" } as SwimRow] }, /swims\[0\]\.final is missing/],
    ["a blank final", { swims: [{ event: "50 Free", entry: "31.84", final: " " }] }, /swims\[0\]\.final must not be blank/],
    ["a blank event", { swims: [{ event: "", entry: "31.84", final: "30.97" }] }, /swims\[0\]\.event must not be blank/],
    ["zero rows", { swims: [] }, /swims must hold at least one/],
    ["nine rows", { swims: Array.from({ length: 9 }, () => SWIMS[0]) }, /swims has 9 rows; one card holds at most 8 - split the meet across two cards/],
    ["a long standard", { swims: [{ ...SWIMS[0], standard: "AAAAA" }] }, /swims\[0\]\.standard "AAAAA" is longer than 4 characters/],
    ["a standard on a DQ", { swims: [{ event: "50 Free", entry: "31.84", final: "DQ", standard: "B" }] }, /swims\[0\]\.standard "B" is set on a DQ/],
    ["a row that is not an object", { swims: ["50 Free" as unknown as SwimRow] }, /swims\[0\] must be an object/],
    ["swims that is not a list", { swims: "50 Free" as unknown as SwimRow[] }, /swims must hold at least one/],
    ["a blank swimmer", { swimmer: "  " }, /swimmer must not be blank/],
    ["a 41-character swimmer", { swimmer: "W".repeat(41) }, /swimmer .* is 41 characters; the card fits at most 40/],
    ["a two-line club", { club: "Larkmoor\nSwim Club" }, /club .*not known to draw/],
    ["a swimmer that is not a string", { swimmer: 42 as unknown as string }, /swimmer must be a string/],
    ["an unknown course", { course: "SCX" as never }, /course "SCX" must be "SCY", "SCM" or "LCM"/],
    ["an unknown bar", { bar: "ratio" as never }, /bar "ratio" must be "percent" or "seconds"/],
    ["an unknown preset", { preset: "sepia" as never }, /preset "sepia" must be "dark" or "light"/],
    ["a bad accent", { accent: "teal" }, /accent "teal" must be #rrggbb/],
    ["a debugLayout that is not a boolean", { debugLayout: "yes" as never }, /debugLayout must be a boolean/],
  ])("rejects %s by name, without falling back to the sample", (_name, props, message) => {
    expect(() => normalizeSwimCard(props)).toThrow(message);
    expect(() => normalizeSwimCard(props)).toThrow(new RegExp(`^${ID.replace(/[/]/g, "\\/")}: `));
  });

  it("refuses copy it cannot fit instead of clipping it", () => {
    expect(() => layoutSwimCard({ swimmer: "W".repeat(40) }, 160, 90)).toThrow(/cannot be fitted on 160x90/);
  });
});
