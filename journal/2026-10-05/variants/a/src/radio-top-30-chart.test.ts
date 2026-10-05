import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { widthOf } from "../../../_shared/text";
import {
  RADIO_CHART_ALONE_FLOOR,
  RADIO_CHART_SHARED_FLOOR,
  RadioTop30ChartV1 as T,
  layoutRadioChart,
  normalizeRadioChart,
  parseRadioChartRow,
} from "./radio-top-30-chart";
import type { RadioTop30ChartProps } from "./radio-top-30-chart";

const ID = "@one-a-day/music/radio-top-30-chart/v1";
const render = (p: RadioTop30ChartProps = {}, w = 1080, h = 1080) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: RadioTop30ChartProps, w = 1080, h = 1080) => Object.fromEntries(layoutRadioChart(p, w, h).cells.map((c) => [c.label, c.text]));
const ROWS = T.defaultProps!.rows as string[];
const first = (n: number) => ROWS.slice(0, n);
/** The same chart with no last-week field on any line. */
const BARE = ROWS.map((r) => r.split("|").slice(0, 3).join("|").trim());

// The copy that stresses the card. 80 characters is the longest title a row takes, 40 the longest label.
const TITLE_80 = "The Night We Drove the Long Way Home Past Every Radio Tower in the County, Twice";
const ARTIST_60 = "The Extremely Long Named Orchestra of Upper Tidewater County";
const LABEL_40 = "Half Moon Recordings & Tapes Cooperative";
const withRow = (i: number, line: string) => ROWS.map((r, k) => (k === i ? line : r));
const ALL_LONG = ROWS.map(() => `${ARTIST_60} | ${TITLE_80} | Brass Key`);
const ALL_TOO_LONG = ROWS.map(() => `${ARTIST_60} | ${TITLE_80} | ${LABEL_40}`);

const CASES: Array<[string, RadioTop30ChartProps]> = [
  ["the defaults", {}],
  ["an 80-character title among normal rows", { rows: withRow(11, `Tall Grass Choir | ${TITLE_80} | Low Tide | NEW`) }],
  ["a 40-character label", { rows: withRow(2, `The Marigolds | Kitchen Radio | ${LABEL_40} | 5`) }],
  ["a 60-character artist", { rows: withRow(20, `${ARTIST_60} | Idle | Night Shift | 16`) }],
  ["thirty rows of a 60-character artist and an 80-character title", { rows: ALL_LONG }],
  ["a 32-character station and a genre", { station: "WXYZ 101.5 FM Student Radio Club", genre: "Loud Rock", rows: first(10) }],
  ["the longest genre the card takes", { genre: "Singer-Songwriter & Folk", rows: first(10) }],
  ["1 row", { rows: first(1) }],
  ["5 rows", { rows: first(5) }],
  ["11 rows", { rows: first(11) }],
  ["15 rows", { rows: first(15) }],
  ["16 rows", { rows: first(16) }],
  ["29 rows", { rows: first(29) }],
  ["no last-week field on any row", { rows: BARE }],
  ["no week and no footer", { weekOf: "", footer: "" }],
  ["an accented artist and a wide marker", { rows: withRow(0, "Sigur Rós | Ágætis byrjun | Smekkleysa | 200") }],
  ["the light page with a pale accent", { preset: "light", accent: "#ffe45c" }],
  ["a lead row", { lead: true }],
  ["a lead row over ten rows on the light page", { lead: true, rows: first(10), genre: "Electronic", preset: "light" }],
  ["a lead row and an 80-character title at number one", { lead: true, rows: withRow(0, `Paper Lanterns | ${TITLE_80} | Tidewater | 2`) }],
];

describe(ID, () => {
  it("shows the use case at its defaults: the station, a computed TOP 30, the week, thirty rows with their markers", () => {
    const t = textOf({});
    expect(t).toMatchObject({
      station: "KOAD 91.6 FM", "chart-title": "TOP 30", "week-of": "Week of Oct 6, 2026",
      footer: "Sample chart: artists, titles and labels are invented",
      "rank-0": "1", "artist-0": "Paper Lanterns", "title-0": "Night Bus Home", "label-0": "Tidewater",
      "rank-4": "5", "artist-4": "Nora Vance", "title-4": '"Blue Receipt" [Single]', "label-4": "Self-Released",
      "rank-6": "7", "title-6": "A Field Guide to Leaving Early Without Saying Goodbye", "label-6": "Brass Key",
      "rank-29": "30", "artist-29": "The Long Weekend", "title-29": "Monday", "label-29": "Brass Key",
    });
    // The markers the brief lists: last week's rank minus this week's, NEW and RE as typed.
    const markers = ROWS.map((_, i) => t[`marker-${i}`]).join(" ");
    expect(markers).toBe("+1 -1 +2 = NEW -3 +5 -2 = +5 -3 NEW -6 -4 +7 -5 -4 RE -5 NEW -5 -3 -6 +3 -7 -6 +3 -7 NEW -6");
    for (const kind of ["rank", "artist", "title", "label", "marker"]) expect(Object.keys(t).filter((k) => k.startsWith(`${kind}-`))).toHaveLength(30);
    expect(T.outputHints).toMatchObject({ width: 1080, height: 1080, format: { kind: "image" } });
    expect(T.defaultProps).toMatchObject({ lead: false, preset: "dark", genre: "" });
  });

  it("reads a chart line: three or four fields, the rank from the position, the marker from last week", () => {
    expect(parseRadioChartRow("Clairo | Charm | Virgin", 0)).toEqual({ rank: 1, artist: "Clairo", title: "Charm", label: "Virgin", marker: "", move: null });
    expect(parseRadioChartRow("  Clairo|Charm |  Virgin | 4 ", 0)).toMatchObject({ artist: "Clairo", title: "Charm", label: "Virgin", marker: "+3", move: "up" });
    expect(parseRadioChartRow("A | B | C | 2", 4)).toMatchObject({ rank: 5, marker: "-3", move: "down" });
    expect(parseRadioChartRow("A | B | C | 5", 4)).toMatchObject({ marker: "=", move: "same" });
    expect(parseRadioChartRow("A | B | C | new", 4)).toMatchObject({ marker: "NEW", move: "new" });
    expect(parseRadioChartRow("A | B | C | Re", 4)).toMatchObject({ marker: "RE", move: "re" });
    expect(parseRadioChartRow("A | B | C |", 4)).toMatchObject({ marker: "", move: null });
    expect(parseRadioChartRow("A | B | C | 200", 0)).toMatchObject({ marker: "+199" });
    // NACC's copy conventions pass through untouched.
    expect(parseRadioChartRow('Nora Vance | "Blue Receipt" [Single] | Self-Released', 0).title).toBe('"Blue Receipt" [Single]');
    expect(parseRadioChartRow("Juno Park | Soft Machines [EP] | Night Shift", 0).title).toBe("Soft Machines [EP]");
  });

  it("computes the chart title from the rows and the genre, never from a typed count", () => {
    expect(normalizeRadioChart({}).chartTitle).toBe("TOP 30");
    expect(normalizeRadioChart({ rows: first(10) }).chartTitle).toBe("TOP 10");
    expect(normalizeRadioChart({ rows: first(10), genre: "Loud Rock" }).chartTitle).toBe("LOUD ROCK TOP 10");
    expect(normalizeRadioChart({ rows: first(1), genre: " jazz " }).chartTitle).toBe("JAZZ TOP 1");
    // The list order is the chart: nothing is sorted, deduped or re-ranked.
    const twice = normalizeRadioChart({ rows: [ROWS[3], ROWS[3], ROWS[0]] }).rows;
    expect(twice.map((r) => `${r.rank} ${r.artist} ${r.marker}`)).toEqual(["1 Delta Kiosk +3", "2 Delta Kiosk +2", "3 Paper Lanterns -1"]);
  });

  it("lays the rows out as the grid the aspect asks for: 3 x 10 wide, 2 x 15 square and portrait, ranks down the columns", () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutRadioChart({}, w, h);
      const wide = w / h >= 1.3;
      expect([L.columns, L.perColumn]).toEqual(wide ? [3, 10] : [2, 15]);
      expect(L.rows).toHaveLength(30);
      L.rows.forEach((r, i) => {
        expect(r.row.rank).toBe(i + 1);
        expect(r.column).toBe(Math.floor(i / L.perColumn));
        expect(r.slot).toBe(i % L.perColumn);
        // Equal cells, and a rank further down the list is lower in its column or in a later one.
        expect([r.tile.w, r.tile.h]).toEqual([L.rows[0].tile.w, L.rows[0].tile.h]);
        if (i > 0) {
          const prev = L.rows[i - 1];
          if (prev.column === r.column) { expect(r.tile.x).toBe(prev.tile.x); expect(r.tile.y).toBeGreaterThan(prev.tile.y); }
          else { expect(r.tile.x).toBeGreaterThan(prev.tile.x + prev.tile.w); expect(r.tile.y).toBe(L.rows[0].tile.y); }
        }
      });
    }
  });

  it("sizes the grid from the count: one column for a short chart, a short last column, a capped row height", () => {
    const shape = (n: number, w: number, h: number) => { const L = layoutRadioChart({ rows: first(n) }, w, h); return [L.columns, L.perColumn, L.rows.filter((r) => r.column === L.columns - 1).length]; };
    expect(shape(1, 1080, 1080)).toEqual([1, 1, 1]);
    expect(shape(5, 1080, 1080)).toEqual([1, 5, 5]);
    expect(shape(15, 1080, 1080)).toEqual([1, 15, 15]);
    expect(shape(16, 1080, 1080)).toEqual([2, 8, 8]);
    expect(shape(29, 1080, 1080)).toEqual([2, 15, 14]);
    expect(shape(29, 1080, 1920)).toEqual([2, 15, 14]);
    expect(shape(10, 1920, 1080)).toEqual([1, 10, 10]);
    expect(shape(11, 1920, 1080)).toEqual([2, 6, 5]);
    expect(shape(16, 1920, 1080)).toEqual([2, 8, 8]);
    expect(shape(29, 1920, 1080)).toEqual([3, 10, 9]);
    // A Top 5 does not become slabs: the rows keep a capped height and group at the top of the band.
    for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920]] as const) {
      const L = layoutRadioChart({ rows: first(5) }, w, h);
      expect(L.pitch).toBeLessThanOrEqual(Math.round(Math.min(w, h) * 0.11));
      expect(L.rows[0].tile.y).toBe(L.gridTop);
      expect(L.rows[4].tile.y + L.rows[4].tile.h).toBeLessThan(L.bandBottom - L.pitch);
    }
  });

  it("walks the fit ladder: shared sizes first, a long line alone second, and at the defaults that line is row 7's title", () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutRadioChart({}, w, h);
      // Nothing at the defaults is inside the shared allowance, so the shared sizes are the caps.
      expect(L.shared).toBe(1);
      expect(L.artistShared).toBeGreaterThan(L.artistCap * 0.98);
      expect(L.titleShared).toBeGreaterThan(L.titleCap * 0.98);
      expect(L.titleShared).toBeLessThan(L.artistShared);
      L.rows.forEach((r) => {
        expect(r.artistAlone).toBe(false);
        expect(r.artistPx).toBe(L.artistShared);
        expect(r.titleAlone).toBe(r.row.rank === 7);
        if (r.row.rank !== 7) expect(r.titlePx).toBe(L.titleShared);
      });
      // Row 7's 53-character title needs more than the allowance, so it shrinks alone and costs the others nothing.
      const seven = L.rows[6].titlePx / L.titleCap;
      expect(seven).toBeLessThan(RADIO_CHART_SHARED_FLOOR);
      expect(seven).toBeGreaterThan(0.7);
      // The label shares its title's size and sits after it on the same line.
      const cell = (label: string) => L.cells.find((c) => c.label === label)!;
      expect(cell("label-6").px).toBe(cell("title-6").px);
      expect(cell("label-6").rect.y).toBe(cell("title-6").rect.y);
    }
  });

  it("brings the shared sizes down together for a line inside the allowance, and only for such a line", () => {
    // 36 characters: at 1080x1080 this title needs about 9% off its cap, inside the 15% allowance.
    const inBand = withRow(6, "Hollow Pines | A Field Guide to Leaving Early Tonight | Half Moon Recordings | 12");
    const L = layoutRadioChart({ rows: inBand }, 1080, 1080);
    expect(L.shared).toBeLessThan(0.97);
    expect(L.shared).toBeGreaterThanOrEqual(RADIO_CHART_SHARED_FLOOR);
    // Both sizes came down by the same factor, and every row shares them: no row shrank alone.
    expect(L.artistShared / L.artistCap).toBeCloseTo(L.shared, 1);
    expect(L.titleShared / L.titleCap).toBeCloseTo(L.shared, 1);
    L.rows.forEach((r) => { expect([r.artistAlone, r.titleAlone]).toEqual([false, false]); expect([r.artistPx, r.titlePx]).toEqual([L.artistShared, L.titleShared]); });
    // An artist that needs more than the allowance shrinks alone too; the titles keep the shared size.
    const A = layoutRadioChart({ rows: withRow(20, `${ARTIST_60} | Idle | Night Shift | 16`) }, 1080, 1080);
    expect(A.rows[20].artistAlone).toBe(true);
    expect(A.rows[20].artistPx).toBeLessThan(A.artistShared * RADIO_CHART_SHARED_FLOOR);
    expect(A.rows[20].titlePx).toBe(A.titleShared);
    expect(A.rows[19].artistPx).toBe(A.artistShared);
  });

  it("is the same picture at every size: an 80-character title fits at all seven canvases, and nothing goes under half its cap", () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const one = layoutRadioChart({ rows: withRow(11, `Tall Grass Choir | ${TITLE_80} | Low Tide | NEW`) }, w, h);
      expect(one.rows[11].titleAlone).toBe(true);
      expect(one.rows[11].titlePx).toBeGreaterThanOrEqual(one.titleCap * RADIO_CHART_ALONE_FLOOR);
      expect(one.rows.filter((r) => r.titleAlone).map((r) => r.row.rank)).toEqual([7, 12]);
      // Thirty rows of a 60-character artist and an 80-character title: every aspect fits them, each line alone.
      const all = layoutRadioChart({ rows: ALL_LONG }, w, h);
      all.rows.forEach((r) => {
        expect([r.artistAlone, r.titleAlone]).toEqual([true, true]);
        expect(r.artistPx).toBe(all.rows[0].artistPx);
        expect(r.titlePx).toBe(all.rows[0].titlePx);
        expect(r.artistPx).toBeGreaterThanOrEqual(all.artistCap * RADIO_CHART_ALONE_FLOOR);
        expect(r.titlePx).toBeGreaterThanOrEqual(all.titleCap * RADIO_CHART_ALONE_FLOOR);
      });
    }
  });

  it("refuses a row it cannot fit, by name, instead of clipping it - at every canvas", () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      // An 80-character title next to a 40-character label is past the floor on every aspect; the first row is the one named.
      expect(() => layoutRadioChart({ rows: ALL_TOO_LONG }, w, h)).toThrow(new RegExp(`row 1 title cannot be fitted on ${w}x${h}: shorten it`));
      expect(() => layoutRadioChart({ rows: withRow(6, `Hollow Pines | ${TITLE_80} | ${LABEL_40} | 12`) }, w, h)).toThrow(/row 7 title cannot be fitted/);
    }
    // An artist of 80 capitals is past the floor too, and is named as the artist.
    expect(() => layoutRadioChart({ rows: withRow(2, `${"W".repeat(80)} | Kitchen Radio | Fern & Flint`) }, 1080, 1080)).toThrow(/row 3 artist cannot be fitted on 1080x1080: shorten it \(80 characters\)/);
    // A station and a genre that cannot share the header line are refused together.
    expect(() => layoutRadioChart({ station: "W".repeat(32), genre: "W".repeat(24) }, 1080, 1920)).toThrow(/station and the chart title cannot be fitted on 1080x1920: shorten the station or the genre/);
  });

  it("keeps every text inside its row cell and a column's label clear of the next column's rank", () => {
    for (const [, props] of CASES) {
      for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920], [480, 270]] as const) {
        const L = layoutRadioChart(props, w, h);
        for (const r of L.rows) {
          const i = r.row.rank - 1;
          const mine = L.cells.filter((c) => new RegExp(`^(rank|marker|artist|title|label)-${i}$`).test(c.label));
          expect(mine.length).toBeGreaterThanOrEqual(4);
          for (const c of mine) {
            expect(c.rect.x).toBeGreaterThanOrEqual(r.tile.x);
            expect(c.rect.x + c.rect.w).toBeLessThanOrEqual(r.tile.x + r.tile.w);
            expect(c.rect.y).toBeGreaterThanOrEqual(r.tile.y);
            expect(c.rect.y + c.rect.h).toBeLessThanOrEqual(r.tile.y + r.tile.h);
            // The ink fits its own cell with the 2% the contract's ruler asks for.
            expect(widthOf(c.text, c.px, c.bold) * 1.02).toBeLessThanOrEqual(c.rect.w);
          }
          const title = mine.find((c) => c.label === `title-${i}`)!, label = mine.find((c) => c.label === `label-${i}`)!;
          expect(label.rect.x).toBeGreaterThanOrEqual(title.rect.x + title.rect.w);
        }
        // Columns do not touch: the gutter is at least 2% of the short side.
        const grid = L.rows.filter((r) => !r.lead);
        grid.forEach((r, k) => { if (k > 0 && grid[k - 1].column !== r.column) expect(r.tile.x - (grid[k - 1].tile.x + grid[k - 1].tile.w)).toBeGreaterThanOrEqual(Math.floor(Math.min(w, h) * 0.02)); });
      }
    }
  });

  it("draws no marker when no row has a last-week field, and centres the numerals in their cells", () => {
    const L = layoutRadioChart({ rows: BARE }, 1080, 1080);
    expect(L.cells.filter((c) => c.label.startsWith("marker-"))).toHaveLength(0);
    L.rows.forEach((r, i) => { const rank = L.cells.find((c) => c.label === `rank-${i}`)!; expect([rank.rect.y, rank.rect.h]).toEqual([r.tile.y, r.tile.h]); });
    // One row without the field among rows with it: that row has no marker, the others keep theirs.
    const mixed = layoutRadioChart({ rows: withRow(3, "Delta Kiosk | Parking Lot Hymns | Low Tide") }, 1080, 1080);
    expect(mixed.cells.filter((c) => c.label.startsWith("marker-"))).toHaveLength(29);
    expect(mixed.cells.find((c) => c.label === "marker-3")).toBeUndefined();
    // Up, NEW and RE take the accent; down and "=" the dim ink. No red, no green.
    const D = layoutRadioChart({}, 1080, 1080);
    const colour = (i: number) => D.cells.find((c) => c.label === `marker-${i}`)!.color;
    expect(new Set([colour(0), colour(4), colour(17)])).toEqual(new Set([D.cells.find((c) => c.label === "rank-0")!.color]));
    expect(new Set([colour(1), colour(3)])).toEqual(new Set([D.cells.find((c) => c.label === "footer")!.color]));
  });

  it("puts rank 1 in a full-width lead row when asked, and the other ranks in the grid", () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutRadioChart({ lead: true }, w, h);
      const wide = w / h >= 1.3;
      const lead = L.rows[0], grid = L.rows.slice(1);
      expect(lead).toMatchObject({ lead: true, column: -1 });
      expect(lead.row.rank).toBe(1);
      expect(lead.tile.w).toBe(w - 2 * L.m);
      expect(lead.tile.y + lead.tile.h).toBeLessThanOrEqual(grid[0].tile.y);
      expect(lead.artistPx).toBeGreaterThan(grid[0].artistPx * 1.4);
      expect(grid).toHaveLength(29);
      expect([L.columns, L.perColumn]).toEqual(wide ? [3, 10] : [2, 15]);
      expect(grid.filter((r) => r.column === L.columns - 1)).toHaveLength(wide ? 9 : 14);
      expect(grid[0].row.rank).toBe(2);
      expect(L.tiles.map((t) => t.label)).toEqual(expect.arrayContaining(["lead", "row-1", "row-29"]));
      expect(L.tiles.find((t) => t.label === "row-0")).toBeUndefined();
    }
    // A chart of one row has nothing to lead: it stays a grid of one.
    expect(layoutRadioChart({ lead: true, rows: first(1) }, 1080, 1080).rows[0].lead).toBe(false);
  });

  it("binds what it shows: the station, the week, the footer, the accent rule, and each row's three strings to its line", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    expect(Object.fromEntries(Object.entries(byProp).map(([key, v]) => [key, v.length]))).toEqual({ station: 1, weekOf: 1, footer: 1, accent: 1, rows: 90 });
    const withGenre = resolvePropBindings(await render({ genre: "Loud Rock", rows: first(10) }), 1080, 1080, { propsSchema: T.propsSchema });
    expect(withGenre.rejected).toEqual([]);
    expect(withGenre.byProp.genre).toHaveLength(1);
  });

  it("clears its safe minimum at its own hint and stays inside the cost budget", async () => {
    const doc = await render();
    const ev = evaluateM0(String(doc.m0), { width: 1080, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
    // 30 row cells and the rule, 5 texts a row, 4 lines of chrome.
    expect(doc.sources).toHaveLength(31 + 150 + 4);
  });

  it("keeps its layout contract at the seven contract canvases for the copy that stresses it", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const [name, props] of CASES) {
      try {
        await sweepLayout((p, ctx) => T.render(p, ctx).then(asDocument), ID, props, (w, h) => targetCtx(w, h));
      } catch (err) {
        throw new Error(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
    expect((await render({ lead: true, debugLayout: true }, 1920, 1080)).editor).toMatchObject({ layoutContract: { ok: true } });
    expect((await render({ rows: ALL_LONG, debugLayout: true }, 1080, 1920)).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("promises what the brief promised: the header at the top, the footer at the bottom, equal row cells a quarter of the canvas wide", async () => {
    const intent = layoutIntentOf(await render())!;
    const of = (label: string) => intent.constraints.filter((c) => c.label === label);
    expect(of("station")).toEqual(expect.arrayContaining([expect.objectContaining({ within: { yFrac: [0, 0.2] } })]));
    expect(of("chart-title")).toEqual(expect.arrayContaining([expect.objectContaining({ within: { yFrac: [0, 0.2] } })]));
    expect(of("footer")).toEqual(expect.arrayContaining([expect.objectContaining({ within: { yFrac: [0.9, 1] } })]));
    for (let i = 0; i < 30; i++) {
      expect(of(`row-${i}`)).toEqual([expect.objectContaining({ within: { yFrac: [0.08, 0.97] }, minWidthFrac: 0.25 })]);
      for (const kind of ["rank", "marker", "artist", "title", "label"]) expect(of(`${kind}-${i}`)).toEqual([expect.objectContaining({ textFits: expect.anything() })]);
    }
    expect(intent.relations).toEqual([expect.objectContaining({ equal: "size", label: Array.from({ length: 30 }, (_, i) => `row-${i}`) })]);
  });

  it("takes the light page and any accent, and darkens a pale accent until it reads on paper", () => {
    const dark = layoutRadioChart({}, 1080, 1080), light = layoutRadioChart({ preset: "light" }, 1080, 1080);
    expect(light.theme.bg).not.toBe(dark.theme.bg);
    const ink = (L: typeof dark) => L.cells.find((c) => c.label === "chart-title")!.color;
    expect(ink(dark)).toBe("#ff3d9a");
    // The rule keeps the accent as given; the accent as text moves toward the ink only when it has to.
    const pale = layoutRadioChart({ preset: "light", accent: "#FFE45C" }, 1080, 1080);
    expect(pale.tiles.find((t) => t.label === "header-rule")!.color).toBe("#ffe45c");
    expect(ink(pale)).not.toBe("#ffe45c");
    expect(ink(layoutRadioChart({ accent: "#ffe45c" }, 1080, 1080))).toBe("#ffe45c");
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
    expect(await render({ lead: true }, 1920, 1080)).toEqual(await render({ lead: true }, 1920, 1080));
  });

  it.each<[string, RadioTop30ChartProps, RegExp]>([
    ["an empty station", { station: "  " }, /station is empty/],
    ["a station over 32 characters", { station: "W".repeat(33) }, /station .* is 33 characters; the card takes at most 32/],
    ["a station that is not a string", { station: 42 as never }, /station must be a string/],
    ["a character the font cannot draw", { station: "KOAD → 91.6" }, /station .* has a character the bundled font is not known to draw/],
    ["rows that are not a list", { rows: "A | B | C" as never }, /rows must be a list of chart lines/],
    ["no rows", { rows: [] }, /rows is empty/],
    ["more than 30 rows", { rows: [...ROWS, ROWS[0]] }, /rows has 31 lines; a station chart is 30, and a longer list needs a second card/],
    ["a row that is not a string", { rows: [{ artist: "A" } as never] }, /rows\[0\] \(line 1\) must be a string/],
    ["a row with two fields", { rows: [ROWS[0], "Clairo | Charm"] }, /rows\[1\] \(line 2\) "Clairo \| Charm" has 2 fields between "\|"/],
    ["a row with five fields", { rows: ["A | B | C | 4 | extra"] }, /rows\[0\] \(line 1\) .* has 5 fields/],
    ["a row with no label", { rows: ["Clairo | Charm | "] }, /rows\[0\] \(line 1\) has an empty label/],
    ["a row with no artist", { rows: [" | Charm | Virgin"] }, /rows\[0\] \(line 1\) has an empty artist/],
    ["a title over 80 characters", { rows: [`A | ${"t".repeat(81)} | C`] }, /rows\[0\] \(line 1\) title is 81 characters; the card takes at most 80/],
    ["a label over 40 characters", { rows: [`A | B | ${"l".repeat(41)}`] }, /label is 41 characters; the card takes at most 40/],
    ["a last week that is not a rank", { rows: ["A | B | C | up 3"] }, /rows\[0\] \(line 1\) last week "up 3" must be a rank from 1 to 200, NEW, RE, or empty/],
    ["a last week of zero", { rows: ["A | B | C | 0"] }, /last week "0" must be a rank from 1 to 200/],
    ["a last week over 200", { rows: ["A | B | C | 201"] }, /last week "201" must be a rank from 1 to 200/],
    ["an arrow in a row", { rows: ["A | B ↑ | C"] }, /rows\[0\] \(line 1\) .* has a character the bundled font is not known to draw/],
    ["an accent that is not #rrggbb", { accent: "hotpink" }, /accent "hotpink" must be #rrggbb/],
    ["an unknown preset", { preset: "sepia" as never }, /preset "sepia" must be "dark" or "light"/],
    ["a lead that is not a boolean", { lead: "yes" as never }, /lead must be a boolean/],
    ["a debugLayout that is not a boolean", { debugLayout: "yes" as never }, /debugLayout must be a boolean/],
    ["a week line over 48 characters", { weekOf: "w".repeat(49) }, /weekOf .* is 49 characters; the card takes at most 48/],
  ])("refuses %s", async (_name, props, message) => {
    await expect(render(props)).rejects.toThrow(message);
  });
});
