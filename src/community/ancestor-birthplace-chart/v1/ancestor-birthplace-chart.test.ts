import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";
import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  ANCESTRY_DEFAULT_ROWS,
  ANCESTRY_PALETTE,
  ANCESTRY_SLOTS,
  AncestorBirthplaceChartV1,
  ancestryBeatsOf,
  ancestryContrast,
  ancestryFoldAscii,
  ancestryKeyOf,
  ancestryLayout,
  ancestryModelOf,
  ancestryParseRows,
  ancestryRowsFromGedcom,
} from "./ancestor-birthplace-chart";

const ID = "@one-a-day/community/ancestor-birthplace-chart/v1";

const render = (
  props: Parameters<typeof AncestorBirthplaceChartV1.render>[0] = {},
  w = 1920,
  h = 1080,
  ctx?: MosaicEngineContext,
) => AncestorBirthplaceChartV1.render({ ...AncestorBirthplaceChartV1.defaultProps, ...props }, ctx ?? targetCtx(w, h)).then(asDocument);

type Src = { type?: string; editor?: { label?: string }; overlay?: { enable?: string }; layers?: Array<{ content?: { text?: string } }> };
const childSources = (doc: MosaicDocument, key: string) => ((doc.children?.[key] as MosaicDocument).sources ?? []) as Src[];
const sourcesOf = (doc: MosaicDocument) => (doc.sources ?? []) as Src[];
const textOf = (s: Src) => s.layers?.[0]?.content?.text ?? "";

const OPTS = { keyBy: "state-or-country", homeCountry: "USA", colors: new Map(), event: "birth" as const };
const copy = { title: "T", subtitle: "S" };

/** A 4-generation fixture: an ABT date, a missing parent (no FAM for I6's mother), an adoptive FAMC and pedigree collapse (I8 is both 8 and 10). */
const GEDCOM = [
  "0 HEAD",
  "1 GEDC",
  "2 VERS 5.5.1",
  "0 @I1@ INDI",
  "1 NAME Clara /Whitfield/",
  "1 BIRT",
  "2 DATE 12 MAR 1988",
  "2 PLAC Columbus, Franklin, Ohio, United States",
  "1 FAMC @F9@",
  "2 PEDI adopted",
  "1 FAMC @F1@",
  "2 PEDI birth",
  "0 @I2@ INDI",
  "1 NAME Daniel /Whitfield/",
  "1 BIRT",
  "2 DATE ABT 1958",
  "2 PLAC Dayton, Montgomery, Ohio, USA",
  "1 DEAT",
  "2 DATE 2020",
  "2 PLAC Toronto, Ontario, Canada",
  "1 FAMC @F2@",
  "0 @I3@ INDI",
  "1 NAME Laura /Brandt/",
  "1 BIRT",
  "2 DATE 1960",
  "2 PLAC Erie, Erie, Pennsylvania, USA",
  "1 FAMC @F3@",
  "0 @I4@ INDI",
  "1 NAME Harold /Whitfield/",
  "1 BIRT",
  "2 DATE 1929",
  "2 PLAC Lexington, Fayette, Kentucky, USA",
  "1 FAMC @F4@",
  "0 @I5@ INDI",
  "1 NAME Mae /Corrigan/",
  "1 BIRT",
  "2 PLAC Cincinnati, Hamilton, Ohio, USA",
  "1 FAMC @F4@",
  "0 @I6@ INDI",
  "1 NAME Walter /Brandt/",
  "1 BIRT",
  "2 DATE 1927",
  "2 PLAC Bremen, Germany",
  "0 @I8@ INDI",
  "1 NAME Amos /Whitfield/",
  "1 BIRT",
  "2 DATE BET 1898 AND 1899",
  "2 PLAC Harlan, Harlan, Kentucky, USA",
  "0 @I9@ INDI",
  "1 NAME Müller, Ruth /Penníngton/",
  "1 BIRT",
  "2 DATE 1902",
  "2 PLAC Abingdon, Washington, Virginia, USA",
  "0 @I99@ INDI",
  "1 NAME Adoptive /Parent/",
  "0 @F1@ FAM",
  "1 HUSB @I2@",
  "1 WIFE @I3@",
  "0 @F9@ FAM",
  "1 HUSB @I99@",
  "0 @F2@ FAM",
  "1 HUSB @I4@",
  "1 WIFE @I5@",
  "0 @F3@ FAM",
  "1 HUSB @I6@",
  "0 @F4@ FAM",
  "1 HUSB @I8@",
  "1 WIFE @I9@",
  "0 TRLR",
].join("\r\n");

/** The stress rows: 31 known, long names, 12 distinct keys so "Other" appears, the longest labels. */
const STRESS_ROWS = (() => {
  const keys = ["Pennsylvania", "Mecklenburg-Schwerin", "Ohio", "Kentucky", "Ireland", "Germany", "Sweden", "New York", "Virginia", "Massachusetts", "North Carolina", "Netherlands"];
  const rows: string[] = [];
  for (let n = 1; n <= 31; n++) {
    const key = keys[n % keys.length];
    const place = key === "Ireland" || key === "Germany" || key === "Sweden" || key === "Netherlands" || key === "Mecklenburg-Schwerin" ? `Town, ${key}` : `Town, County, ${key}, USA`;
    rows.push(`${n} | Wilhelmina Featherstonehaugh ${n} | c. 18${String(n).padStart(2, "0")} | ${place}`);
  }
  return rows.join("\n");
})();

describe(ID, () => {
  it("binds the title rect to its prop - Make's double-click edits it in place", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: AncestorBirthplaceChartV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.title).toHaveLength(1);
  });

  it("clears its safe minimum at its own hint, in portrait and in square", async () => {
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]] as const) {
      const doc = await render({}, w, h);
      const ev = evaluateM0(String(doc.m0), { width: w, height: h });
      expect(ev.feasible && ev.meetsPrecision).toBe(true);
      const chart = doc.children?.chart as MosaicDocument;
      const cev = evaluateM0(String(chart.m0), { width: chart.size!.width, height: chart.size!.height });
      expect(cev.feasible && cev.meetsPrecision).toBe(true);
    }
  });

  it("counts the sample family: 28 of 31 known, the legend as the brief lists it, adding up to 31", () => {
    const m = ancestryModelOf(ancestryParseRows(undefined), OPTS);
    expect(m.known).toBe(28);
    expect(m.rootName).toBe("Clara Whitfield");
    expect(m.legend.map((e) => `${e.label} ${e.count}`)).toEqual(["Ohio 4", "Pennsylvania 4", "Kentucky 4", "Ireland 4", "Germany 4", "Virginia 3", "Sweden 3", "New York 2", "Unknown 3"]);
    expect(m.legend.reduce((a, e) => a + e.count, 0)).toBe(ANCESTRY_SLOTS);
    expect(m.legend[8].members).toEqual([23, 30, 31]);
    expect(m.legend.slice(0, 8).map((e) => e.color)).toEqual(ANCESTRY_PALETTE.slice(0, 8));
  });

  it("is the Ahnentafel: 1/2/4/8/16 cells, father above mother, cell n level with 2n and 2n+1, one height per generation", () => {
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080], [480, 270]] as const) {
      const L = ancestryLayout(ancestryModelOf(ancestryParseRows(undefined), OPTS), copy, w, h);
      for (let n = 1; n <= 15; n++) {
        const c = L.cells[n];
        const f = L.cells[2 * n];
        const mo = L.cells[2 * n + 1];
        expect(f.y).toBe(c.y); // the father's line is the top half
        expect(mo.y + mo.h).toBe(c.y + c.h); // the mother's line is the bottom half
        expect(f.y + f.h).toBeLessThan(mo.y);
        expect(f.x).toBeGreaterThan(c.x + c.w); // the next column to the right
        expect(f.x).toBe(mo.x);
      }
      for (let g = 0; g < 5; g++) {
        const hs = new Set<number>();
        let count = 0;
        for (let n = 2 ** g; n < 2 ** (g + 1); n++) {
          hs.add(L.cells[n].h);
          count += 1;
        }
        expect(count).toBe(2 ** g);
        expect(hs.size).toBe(1);
        expect([...hs][0]).toBe(L.unit * 2 ** (4 - g) - L.gap);
      }
      expect(new Set(L.cells.slice(1).map((c) => c.w)).size).toBe(1);
      expect(L.cells[1].h + L.gap).toBe(16 * L.unit);
    }
  });

  it("renders 31 blank cells, 31 gated fills, five generation headers and one legend row per key", async () => {
    const doc = await render();
    const chart = childSources(doc, "chart");
    const fills = chart.filter((s) => s.editor?.label?.startsWith("ancestor-fill-"));
    expect(fills).toHaveLength(31);
    for (let g = 1; g <= 5; g++) expect(chart.filter((s) => s.editor?.label === `ancestor-cell-g${g}`)).toHaveLength(2 ** (g - 1));
    const heads = chart.filter((s) => s.editor?.label?.startsWith("gen-head-")).sort((a, b) => a.editor!.label!.localeCompare(b.editor!.label!));
    expect(heads.map(textOf)).toEqual(["YOU", "PARENTS", "GRANDPARENTS", "GREAT-GRANDPARENTS", "2X GREAT-GRANDPARENTS"]);
    expect(chart.filter((s) => s.editor?.label?.startsWith("gen-now-"))).toHaveLength(5);
    const legend = sourcesOf(doc).filter((s) => s.editor?.label?.startsWith("legend-label-")).map(textOf);
    expect(legend).toEqual(["Ohio 4", "Pennsylvania 4", "Kentucky 4", "Ireland 4", "Germany 4", "Virginia 3", "Sweden 3", "New York 2", "Unknown 3"]);
    expect(sourcesOf(doc).filter((s) => s.editor?.label === "legend-swatch")).toHaveLength(9);
    expect(sourcesOf(doc).find((s) => s.editor?.label === "title") && textOf(sourcesOf(doc).find((s) => s.editor?.label === "title")!)).toBe("CLARA WHITFIELD - ANCESTOR BIRTHPLACES");
    expect(textOf(sourcesOf(doc).find((s) => s.editor?.label === "subtitle")!)).toBe("Fictional sample family - 28 of 31 known");
  });

  it("shows name, year and place in every generation at 1920x1080, and degrades by tier, never by clipping, at 480x270", () => {
    const m = ancestryModelOf(ancestryParseRows(undefined), OPTS);
    const big = ancestryLayout(m, copy, 1920, 1080);
    expect(big.columns.map((c) => c.tier)).toEqual(["name-year-place", "name-year-place", "name-year-place", "name-year-place", "name-year-place"]);
    const g5 = big.columns[4].cells.find((c) => c.n === 16)!;
    expect(g5.nameLines).toEqual(["16 Josiah Whitfield"]);
    expect(g5.meta).toBe("1866 - Kentucky");
    expect(big.columns[4].cells.find((c) => c.n === 23)!.nameLines).toEqual(["23 unknown"]);
    const small = ancestryLayout(m, copy, 480, 270);
    expect(["name", "surname", "number", "none"]).toContain(small.columns[4].tier);
    expect(small.columns[0].tier).not.toBe("none");
    for (const L of [big, small]) {
      for (const col of L.columns) {
        for (const cell of col.cells) {
          expect(cell.nameLines.length).toBeLessThanOrEqual(2);
          for (const line of cell.nameLines) expect(line).not.toMatch(/\.\.\./);
        }
      }
    }
    // tier snapshot per generation per canvas - a change here is a design change
    const tiers = [[1920, 1080], [1280, 720], [1080, 1920], [1080, 1080], [3840, 2160], [640, 360], [480, 270]].map(([w, h]) => `${w}x${h}: ${ancestryLayout(m, copy, w, h).columns.map((c) => c.tier).join(" / ")}`);
    expect(tiers).toMatchSnapshot();
  });

  it("walks a GEDCOM into Ahnentafel slots: PEDI birth wins, an ABT date is circa, a missing parent is unknown, pedigree collapse repeats a person", () => {
    const rows = ancestryRowsFromGedcom(GEDCOM, "", "birth");
    const by = new Map(rows.map((r) => [r.n, r]));
    expect(by.get(1)!.name).toBe("Clara Whitfield");
    expect(by.get(2)!.year).toBe("c. 1958");
    expect(by.get(3)!.name).toBe("Laura Brandt");
    expect(by.get(4)!.name).toBe("Harold Whitfield");
    expect(by.get(5)!.year).toBe(""); // no DATE
    expect(by.get(6)!.name).toBe("Walter Brandt");
    expect(by.has(7)).toBe(false); // F3 has no WIFE
    expect(by.get(8)!.year).toBe("c. 1898"); // BET ... AND
    expect(by.get(9)!.name).toBe("Muller, Ruth Pennington"); // folded, slashes gone
    expect(by.get(10)!.name).toBe("Amos Whitfield"); // 5's FAMC is F4 too: collapse
    expect(by.get(11)!.name).toBe("Muller, Ruth Pennington");
    expect(by.has(12)).toBe(false);
    expect(by.get(1)!.place).toBe("Columbus, Franklin, Ohio, United States");
    const m = ancestryModelOf(rows, OPTS);
    expect(m.legend.map((e) => `${e.label} ${e.count}`)).toEqual(["Ohio 3", "Kentucky 3", "Virginia 2", "Pennsylvania 1", "Germany 1", "Unknown 21"]);
    // another root, another event
    expect(ancestryRowsFromGedcom(GEDCOM, "@I2@", "birth").find((r) => r.n === 1)!.name).toBe("Daniel Whitfield");
    expect(ancestryRowsFromGedcom(GEDCOM, "@I2@", "death").find((r) => r.n === 1)!.place).toBe("Toronto, Ontario, Canada");
    expect(ancestryRowsFromGedcom(GEDCOM, "@I2@", "death").find((r) => r.n === 2)!.place).toBe("");
  });

  it("keys a place by state inside the home country and by country elsewhere, folds the USA's spellings, lets an explicit key win", () => {
    expect(ancestryKeyOf("Columbus, Franklin, Ohio, USA", undefined, "state-or-country", "USA")).toBe("Ohio");
    expect(ancestryKeyOf("Columbus, Franklin, Ohio, United States", undefined, "state-or-country", "USA")).toBe("Ohio");
    expect(ancestryKeyOf("Columbus, Franklin, Ohio, U.S.A.", undefined, "state-or-country", "United States of America")).toBe("Ohio");
    expect(ancestryKeyOf("Bremen, Germany", undefined, "state-or-country", "USA")).toBe("Germany");
    expect(ancestryKeyOf("Columbus, Franklin, Ohio, USA", undefined, "country", "USA")).toBe("USA");
    expect(ancestryKeyOf("Toronto, Ontario, Canada", undefined, "state-or-country", "Canada")).toBe("Ontario");
    expect(ancestryKeyOf("Germany", undefined, "state-or-country", "USA")).toBe("Germany");
    expect(ancestryKeyOf("Columbus, Ohio, USA", "Farmer", "state-or-country", "USA")).toBe("Farmer");
    expect(ancestryKeyOf("", undefined, "state-or-country", "USA")).toBeNull();
    const m = ancestryModelOf(ancestryParseRows(["1 | Root Person | 1990 |", "2 | Dad Person | 1960 | Ulm, Germany"]), OPTS);
    expect(m.known).toBe(2);
    expect(m.legend.map((e) => `${e.label} ${e.count}`)).toEqual(["Germany 1", "Unknown 30"]);
    expect(m.people[1]!.key).toBeNull();
  });

  it("folds names to ASCII and reads rows as strings, tabs, JSON text or objects", () => {
    expect(ancestryFoldAscii("Müller Bjørk Straße Łódź — “q”")).toBe('Muller Bjork Strasse Lodz - "q"');
    const a = ancestryParseRows("1\tClara Whitfield\t1988\tColumbus, Ohio, USA\n\n# comment\n2 | Daniel | c.1958 | Dayton, Ohio, USA | Buckeye");
    expect(a).toEqual([
      { n: 1, name: "Clara Whitfield", year: "1988", place: "Columbus, Ohio, USA" },
      { n: 2, name: "Daniel", year: "c. 1958", place: "Dayton, Ohio, USA", key: "Buckeye" },
    ]);
    expect(ancestryParseRows('[{"n":1,"name":"A","year":"1900","place":"X, Y"},"2 | B | | "]')).toEqual([
      { n: 1, name: "A", year: "1900", place: "X, Y" },
      { n: 2, name: "B", year: "", place: "" },
    ]);
    expect(ancestryParseRows(undefined)).toHaveLength(28);
    expect(ANCESTRY_DEFAULT_ROWS.split("\n")).toHaveLength(28);
  });

  it("refuses bad input by row, key, xref and prop", async () => {
    expect(() => ancestryParseRows("1 | A | 1900 | X\n1 | B | 1900 | Y")).toThrow(/ancestors\[1\]: Ahnentafel number 1 was already given by ancestors\[0\]/);
    expect(() => ancestryParseRows("1 | A | 1900 | X\n32 | B | 1900 | Y")).toThrow(/ancestors\[1\]: the Ahnentafel number "32"/);
    expect(() => ancestryParseRows("1 | A | 19x0 | X")).toThrow(/ancestors\[0\]: year "19x0"/);
    expect(() => ancestryParseRows("2 | A | 1900 | X")).toThrow(/no row 1/);
    expect(() => ancestryParseRows("1 |  | 1900 | X")).toThrow(/ancestors\[0\]: the name is empty/);
    expect(() => ancestryParseRows("")).toThrow(/no rows/);
    expect(() => ancestryRowsFromGedcom("1 NAME x", "", "birth")).toThrow(/no "0 HEAD" line/);
    expect(() => ancestryRowsFromGedcom(GEDCOM, "@I404@", "birth")).toThrow(/root "@I404@" is not an INDI/);
    await expect(render({ colors: { Ohio: "red" } })).rejects.toThrow(/colors\.Ohio/);
    await expect(render({ colors: "{nope" })).rejects.toThrow(/not valid JSON/);
    await expect(render({ event: "marriage" })).rejects.toThrow(/event must be one of "birth", "death"/);
    await expect(render({ keyBy: "county" })).rejects.toThrow(/keyBy must be one of/);
    await expect(render({ clipSec: 2 })).rejects.toThrow(/clipSec/);
    await expect(render({ title: "x".repeat(61) })).rejects.toThrow(/title is 61 characters/);
  });

  it("lands the colours in Ahnentafel order, generation by generation, opens and closes on the finished chart", async () => {
    const b = ancestryBeatsOf(16);
    expect([b.hook, b.start, b.end]).toEqual([1.28, 2.24, 13.44]);
    expect(b.gens.map((g) => g.start)).toEqual([2.24, 3.36, 5.04, 7.28, 10.08]);
    expect(b.gens[4].end).toBe(13.44);
    for (let n = 2; n <= 31; n++) expect(b.lands[n]).toBeGreaterThan(b.lands[n - 1]);
    expect(b.lands[1]).toBe(2.24);
    expect(b.lands[16]).toBe(10.08);
    expect(b.lands[31]).toBe(13.23);
    const doc = await render();
    const chart = childSources(doc, "chart");
    const fill = (n: number) => chart.find((s) => s.editor?.label === `ancestor-fill-${n}`)!.overlay?.enable;
    expect(fill(1)).toBe("lt(t,1.28)+gte(t,2.24)");
    expect(fill(16)).toBe("lt(t,1.28)+gte(t,10.08)");
    expect(fill(31)).toBe("lt(t,1.28)+gte(t,13.23)");
    const now = (g: number) => chart.find((s) => s.editor?.label === `gen-now-${g}`)!.overlay?.enable;
    expect(now(1)).toBe("gte(t,2.24)*lt(t,3.36)");
    expect(now(5)).toBe("gte(t,10.08)*lt(t,13.44)");
    // the copy is static (no drawtext anywhere), so the reset shows names on blank cells
    expect(childSources(doc, "chart").filter((s) => s.type === "text" && s.overlay)).toHaveLength(0);
    expect(childSources(doc, "chart").every((s) => (s as { renderMode?: { kind?: string } }).renderMode?.kind !== "video")).toBe(true);
  });

  it("is a clip of clipSec, and an explicit pin overrides it and rescales every gate", async () => {
    expect((await render()).durationMs).toBe(16000);
    expect((await render({ clipSec: 8 })).durationMs).toBe(8000);
    expect(AncestorBirthplaceChartV1.resolveOutputHints?.(AncestorBirthplaceChartV1.defaultProps)).toEqual({ durationMs: 16000 });
    const pinned = { ...targetCtx(1920, 1080), userIntent: { durationMs: 8000 } } as unknown as MosaicEngineContext;
    const doc = await AncestorBirthplaceChartV1.render({ ...AncestorBirthplaceChartV1.defaultProps }, pinned).then(asDocument);
    expect(doc.durationMs).toBe(8000);
    expect((doc.children?.chart as MosaicDocument).durationMs).toBe(8000);
    expect(childSources(doc, "chart").find((s) => s.editor?.label === "ancestor-fill-1")!.overlay?.enable).toBe("lt(t,0.64)+gte(t,1.12)");
  });

  it("keeps every fill readable under the ink (4.5:1), flips to white ink and gates the copy on a dark override", async () => {
    for (const fill of [...ANCESTRY_PALETTE, "#cdc9c2", "#e9e4da"]) expect(ancestryContrast(fill, "#1f1b16")).toBeGreaterThanOrEqual(4.5);
    const doc = await render({ colors: { Ohio: "#1d3557" } });
    const chart = childSources(doc, "chart");
    const ohio = chart.filter((s) => s.editor?.label === "cell-name-g1");
    expect(ohio).toHaveLength(1);
    expect(ohio[0].overlay?.enable).toBe("lt(t,1.28)+gte(t,2.24)");
    expect(JSON.stringify(ohio[0])).toContain("#ffffff");
    expect(sourcesOf(doc).filter((s) => s.editor?.label === "legend-swatch").map((s) => JSON.stringify(s)).join("|")).toContain("#1d3557");
  });

  it("folds keys beyond nine into Other, and overrides Other and Unknown by name", async () => {
    const m = ancestryModelOf(ancestryParseRows(STRESS_ROWS), { ...OPTS, colors: new Map([["other", "#123456"], ["unknown", "#654321"]]) });
    expect(m.known).toBe(31);
    expect(m.legend).toHaveLength(11);
    expect(m.legend[9].kind).toBe("other");
    expect(m.legend[9].color).toBe("#123456");
    expect(m.legend[10]).toMatchObject({ kind: "unknown", count: 0, color: "#654321" });
    expect(m.legend.reduce((a, e) => a + e.count, 0)).toBe(ANCESTRY_SLOTS);
    const doc = await render({ ancestors: STRESS_ROWS });
    expect(textOf(sourcesOf(doc).find((s) => s.editor?.label === "subtitle")!)).toBe("5 generations - 31 of 31 known");
  });

  it("keeps its layout contract at the seven contract canvases - defaults, the stress rows, the GEDCOM, a long title, a thin tree", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const overs: object[] = [
      {},
      { ancestors: STRESS_ROWS },
      { gedcom: GEDCOM, root: "@I1@" },
      { title: "A title long enough that it has to wrap or shrink before it fits the header band of a narrow canvas" .slice(0, 60) },
      { ancestors: "1 | Root Person | 1990 | Town, Ohio, USA" },
      { keyBy: "country", event: "death" },
    ];
    for (const over of overs) {
      try {
        await sweepLayout((p, ctx) => AncestorBirthplaceChartV1.render(p, ctx).then(asDocument), ID, { ...AncestorBirthplaceChartV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
      } catch (err) {
        throw new Error(`override ${JSON.stringify(Object.keys(over))}: ${(err as Error).message}`);
      }
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
  });
});
