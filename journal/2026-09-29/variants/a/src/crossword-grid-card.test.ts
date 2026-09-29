import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { getComplexityMetricsFast, parseM0StringComplete } from "@m0saic/dsl";
import { latticeReport, resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { budget, widthOf } from "../../../_shared/text";
import {
  CrosswordGridCardV1,
  layoutCrosswordCard,
  normalizeCrossword,
  numberCrosswordGrid,
  parseCrosswordGrid,
} from "./crossword-grid-card";
import type { CrosswordGridCardProps, CrosswordRect } from "./crossword-grid-card";

const ID = "@one-a-day/gaming/crossword-grid-card/v1";
const render = (props: CrosswordGridCardProps = {}, w = 1080, h = 1080) =>
  CrosswordGridCardV1.render({ ...CrosswordGridCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);
const labels = (doc: Awaited<ReturnType<typeof render>>) => (doc.sources ?? []).map((s) => (s as { editor?: { label?: string } }).editor?.label ?? "");
const texts = (doc: Awaited<ReturnType<typeof render>>) =>
  (doc.sources ?? []).flatMap((s) => ((s as { layers?: Array<{ content: { text: string } }> }).layers ?? []).map((l) => l.content.text));

/** A deterministic synthetic grid: blocks on a symmetric pattern, letters cycling A-Z. */
function synthetic(cols: number, rows: number): string {
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c);
      const block = (rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0;
      line += block ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26));
    }
    out.push(line);
  }
  return out.join("/");
}

/** The 8 longest entries of a grid, as themeEntries. */
function longThemes(grid: string): string {
  const { entries } = numberCrosswordGrid(parseCrosswordGrid(grid));
  return [...entries.values()].sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, 8).map((e) => e.id).join(" ");
}

const BRITISH = "STARE/H#N#A/OPERA/E#W#R/SASSY";
const OPEN21 = Array.from({ length: 21 }, (_, r) => "ABCDEFGHIJKLMNOPQRSTU".slice(r % 21) + "ABCDEFGHIJKLMNOPQRSTU".slice(0, r % 21)).join("/");
const STRESS: Array<[string, CrosswordGridCardProps]> = [
  ["defaults", {}],
  ["15x15", { grid: synthetic(15, 15), themeEntries: "", circles: "" }],
  ["21x21 with 8 long themes", { grid: OPEN21, themeEntries: longThemes(OPEN21), circles: "0 22 44" }],
  ["25x25", { grid: synthetic(25, 25), themeEntries: longThemes(synthetic(25, 25)), circles: "" }],
  ["15x16 non-square", { grid: synthetic(15, 16), themeEntries: "", circles: "" }],
  ["23x23, the largest odd prime", { grid: synthetic(23, 23), themeEntries: "", circles: "" }],
  ["unchecked cells", { grid: BRITISH, themeEntries: "1A 2D", circles: "7" }],
  ["max-length copy", { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" }],
  ["teaser", { solved: false }],
];

describe(ID, () => {
  it("derives the default numbering the brief lists: 1-19, theme answers read from the grid", () => {
    const { numbers, entries } = numberCrosswordGrid(parseCrosswordGrid(CrosswordGridCardV1.defaultProps.grid));
    const answers = (dir: "A" | "D") => [...entries.values()].filter((e) => e.dir === dir).map((e) => `${e.number} ${e.answer}`);
    expect(answers("A")).toEqual(["1 PAN", "4 BOW", "7 AGE", "8 ARE", "9 DOGSLED", "11 AIL", "12 CATNAPS", "16 OWE", "17 SAT", "18 YES", "19 TRY"]);
    expect(answers("D")).toEqual(["1 PAD", "2 AGO", "3 NEGATES", "4 BALLAST", "5 ORE", "6 WED", "10 SIN", "12 COY", "13 AWE", "14 PAR", "15 STY"]);
    expect(Math.max(...numbers.values())).toBe(19);
    const p = normalizeCrossword({});
    expect(p.themes.map((t) => `${t.id} ${t.answer}`)).toEqual(["9A DOGSLED", "12A CATNAPS"]);
    expect(p.meta).toBe("Demo Mini | Tue 9/29/26 | 7x7 | solution");
  });

  it("numbers a British-style grid with unchecked cells and a non-square grid", () => {
    const uk = numberCrosswordGrid(parseCrosswordGrid(BRITISH));
    expect([...uk.numbers.entries()]).toEqual([[0, 1], [2, 2], [4, 3], [10, 4], [20, 5]]);
    expect([...uk.entries.keys()].sort()).toEqual(["1A", "1D", "2D", "3D", "4A", "5A"]);
    const wide = numberCrosswordGrid(parseCrosswordGrid("ABCD/E#FG/HIJK"));
    expect([...wide.entries.values()].map((e) => `${e.id} ${e.answer}`)).toEqual(["1A ABCD", "1D AEH", "2D CFJ", "3D DGK", "4A FG", "5A HIJK"]);
    expect(normalizeCrossword({ grid: "ABCD/E#FG/HIJK", themeEntries: "", circles: "" }).meta).toContain("| 4x3 |");
  });

  it("reads a .puz-style unbroken solution string as a square grid", () => {
    const flat = synthetic(15, 15).replace(/\//g, "").replace(/#/g, ".");
    expect(flat).toHaveLength(225);
    const pz = parseCrosswordGrid(flat);
    expect([pz.cols, pz.rows]).toEqual([15, 15]);
  });

  it("fails fast with the field named", async () => {
    const bad: Array<[CrosswordGridCardProps, RegExp]> = [
      [{ grid: "ABC/DE/FGH" }, /grid row 2 has 2 cells/],
      [{ grid: "ABC/D?F/GHI" }, /grid row 2 column 2 is "\?"/],
      [{ grid: "ABC/DeF/GHI" }, /grid row 2 column 2 is lowercase/],
      [{ grid: "AB/CD" }, /grid must have 3-25 rows/],
      [{ grid: "ABCDEFGHIJKLMNOPQRSTUVWXYZ/ABCDEFGHIJKLMNOPQRSTUVWXYZ/ABCDEFGHIJKLMNOPQRSTUVWXYZ" }, /rows must have 3-25 cells/],
      [{ grid: "###/###/###" }, /at least one white cell/],
      [{ themeEntries: "20A" }, /themeEntries 20A is not an entry/],
      [{ themeEntries: "9A 9A" }, /themeEntries lists 9A twice/],
      [{ themeEntries: "9a" }, /themeEntries "9a" must be a clue id/],
      [{ themeEntries: "1A 4A 7A 8A 9A 11A 12A 16A 17A" }, /at most 8/],
      [{ circles: "3" }, /circles 3 \(row 1 column 4\) is a block/],
      [{ circles: "49" }, /circles 49 is outside/],
      [{ circles: "14 14" }, /circles lists 14 twice/],
      [{ date: "2026-02-30" }, /date 2026-02-30 is not a calendar date/],
      [{ date: "9/29/26" }, /date must be YYYY-MM-DD/],
      [{ themeColor: "gold" }, /themeColor "gold" must be #rrggbb/],
      [{ themeColor: "#1E3A8A" }, /themeColor #1E3A8A is too dark for the ink letters over it \(1\.\d:1, needs 4\.5:1\)/],
      [{ title: "" }, /title must have 1-40/],
      [{ author: "x".repeat(49) }, /author must have 1-48/],
      [{ publication: "Café" }, /publication must be printable ASCII/],
      [{ solved: "yes" as unknown as boolean }, /solved must be true or false/],
    ];
    for (const [props, re] of bad) await expect(render(props)).rejects.toThrow(re);
  });

  it("binds every prop that can carry a handle to the rect that shows it - the caption's derived rest is never bound", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: CrosswordGridCardV1.propsSchema });
    expect(rejected).toEqual([]);
    // The 0.3.0 roll call (bindingsDeclared): every non-boolean prop is reachable on the canvas at the defaults.
    expect(Object.keys(byProp).sort()).toEqual(["author", "circles", "date", "grid", "publication", "themeColor", "themeEntries", "title"]);
    for (const key of ["title", "author", "publication", "date", "grid", "circles"]) expect(byProp[key]).toHaveLength(1);
    const bound = (key: string) => (doc.sources ?? []).filter((s) => {
      const e = (s as { editor?: { binding?: { propKey: string }; bindings?: Array<{ propKey: string }> } }).editor;
      return e?.binding?.propKey === key || (e?.bindings ?? []).some((b) => b.propKey === key);
    }) as Array<{ editor: { label?: string; binding?: { focus?: { start: number; end: number } }; bindings?: Array<{ propKey: string }> } }>;
    // The board opens the puzzle: the grid first, then what marks it.
    expect(bound("grid").map((s) => s.editor.label)).toEqual(["board"]);
    expect(bound("grid")[0].editor.bindings!.map((b) => b.propKey)).toEqual(["grid", "themeEntries", "circles", "themeColor"]);
    // Each theme-list id is a handle on ITS token of the raw prop string.
    const raw = CrosswordGridCardV1.defaultProps.themeEntries!;
    const ids = bound("themeEntries").filter((s) => s.editor.label?.startsWith("theme-id-"));
    expect(ids.map((s) => raw.slice(s.editor.binding!.focus!.start, s.editor.binding!.focus!.end))).toEqual(["9A", "12A"]);
    expect(bound("themeColor").map((s) => s.editor.label).sort()).toEqual(["board", "theme-swatch", "theme-swatch"]);
    // The date cell shows the date alone; the size and "solution" after it stay unbound.
    expect(bound("date").map((s) => (s as unknown as { layers: Array<{ content: { text: string } }> }).layers[0].content.text)).toEqual(["| Tue 9/29/26"]);
    const rest = (doc.sources ?? []).find((s) => (s as { editor?: { label?: string } }).editor?.label === "meta") as { editor: { binding?: unknown; bindings?: unknown } };
    expect(rest.editor.binding ?? rest.editor.bindings).toBeUndefined();
    // The teaser board offers only what it shows.
    const teaser = await render({ solved: false });
    expect(Object.keys(resolvePropBindings(teaser, 1080, 1080, { propsSchema: CrosswordGridCardV1.propsSchema }).byProp).sort()).toEqual(["author", "circles", "date", "grid", "publication", "title"]);
  });

  it("clears its safe minimum at its own hint and at the contract canvases", async () => {
    for (const [w, h] of [[1080, 1080], ...CONTRACT_CANVASES]) {
      const ev = evaluateM0(String((await render({}, w, h)).m0), { width: w, height: h });
      expect(ev.feasible && ev.meetsPrecision).toBe(true);
    }
  });

  it("shows no letter, tint or answer when solved is false; numbers and rings stay", async () => {
    const doc = await render({ solved: false });
    const ls = labels(doc);
    expect(ls).not.toContain("cell-letter");
    expect(ls).not.toContain("theme-tint");
    expect(ls.filter((l) => l.startsWith("theme"))).toEqual([]);
    expect(ls).toContain("cell-number");
    expect(ls).toContain("rings");
    const drawn = texts(doc);
    for (const w of ["DOGSLED", "CATNAPS", "THEME ANSWERS"]) expect(drawn).not.toContain(w);
    expect(drawn.filter((t) => /^[A-Z]$/.test(t))).toEqual([]);
    expect(drawn).toEqual(expect.arrayContaining(["| Tue 9/29/26", "| 7x7 | puzzle"]));
    // Nothing else moves: the caption keeps the solved card's rects at every canvas, for the defaults and the longest copy.
    const maxCopy = STRESS.find(([name]) => name === "max-length copy")![1];
    for (const over of [{}, maxCopy]) {
      for (const [w, h] of [[1080, 1080], ...CONTRACT_CANVASES]) {
        const rects = (solved: boolean) => layoutCrosswordCard(normalizeCrossword({ ...over, solved }), w, h).texts.filter((t) => !t.label.startsWith("theme")).map((t) => [t.label, t.rect.x, t.rect.y, t.rect.w, t.rect.h, t.px]);
        expect(rects(false)).toEqual(rects(true));
      }
    }
  });

  it("draws the defaults: 41 letters, 19 numbers, 6 rings, both theme lines", async () => {
    const doc = await render();
    const drawn = texts(doc);
    expect(drawn.filter((t) => /^[A-Z]$/.test(t))).toHaveLength(41);
    expect(drawn.filter((t) => /^\d+$/.test(t))).toHaveLength(19);
    expect(drawn).toEqual(expect.arrayContaining(["Cats and Dogs", "by", "one-a-day agent", "THEME ANSWERS", "9A", "DOGSLED", "12A", "CATNAPS", "Demo Mini", "| Tue 9/29/26", "| 7x7 | solution"]));
    const rings = (doc.sources ?? []).find((s) => (s as { editor?: { label?: string } }).editor?.label === "rings") as { mask: { localPath: string } };
    expect(rings.mask.localPath.match(/M/g)).toHaveLength(12);
  });

  it("keeps its layout contract at the seven contract canvases for the stress copy", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const [, over] of STRESS) {
      await sweepLayout((p, ctx) => CrosswordGridCardV1.render(p, ctx).then(asDocument), ID, { ...CrosswordGridCardV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("holds the geometry: equal cells, rules >= 1px, panel clear of the board, text floors", () => {
    const hit = (a: CrosswordRect, b: CrosswordRect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    for (const [name, over] of STRESS) {
      const p = normalizeCrossword(over);
      for (const [w, h] of [[1080, 1080], ...CONTRACT_CANVASES]) {
        const L = layoutCrosswordCard(p, w, h);
        const B = L.board;
        const where = `${name} @ ${w}x${h}`;
        const spread = (xs: number[]) => { const d = xs.slice(1).map((x, i) => x - xs[i]); return Math.max(...d) - Math.min(...d); };
        expect(spread(B.X)).toBeLessThanOrEqual(1);
        expect(spread(B.Y)).toBeLessThanOrEqual(1);
        expect(B.rule).toBeGreaterThanOrEqual(1);
        // Letters are never omitted and fit the paper part of a cell; numbers are dropped, never shrunk, below 6px.
        expect(B.letterPx).toBeGreaterThanOrEqual(6);
        expect(widthOf("W", B.letterPx, true)).toBeLessThanOrEqual(budget(B.hole(0).w) + 1);
        expect(B.numberPx === 0 || B.numberPx >= 6).toBe(true);
        // The board stays on the canvas and the copy never touches it.
        expect(B.ink.x >= 0 && B.ink.y >= 0 && B.ink.x + B.ink.w <= w && B.ink.y + B.ink.h <= h).toBe(true);
        for (const t of L.texts) {
          if (hit(t.rect, B.ink)) throw new Error(`${where}: ${t.label} overlaps the board`);
          if (t.rect.x < 0 || t.rect.y < 0 || t.rect.x + t.rect.w > w || t.rect.y + t.rect.h > h) throw new Error(`${where}: ${t.label} leaves the canvas`);
          if (w === 480 && t.px < 8) throw new Error(`${where}: ${t.label} is ${t.px}px, under the 8px floor`);
        }
        for (const s of L.themeLines) if (hit(s.swatch, B.ink)) throw new Error(`${where}: a swatch overlaps the board`);
      }
    }
  });

  it("keeps the size ladder the brief states", () => {
    const at = (grid: string, w: number, h: number) => layoutCrosswordCard(normalizeCrossword({ grid, themeEntries: "", circles: "" }), w, h).board;
    const b15 = at(synthetic(15, 15), 1080, 1080);
    expect(b15.letterPx).toBeGreaterThanOrEqual(28);
    expect(b15.numberPx).toBeGreaterThanOrEqual(13);
    expect(at(synthetic(15, 15), 480, 270).numberPx).toBe(0);
    for (const [w, h] of CONTRACT_CANVASES) expect(at(synthetic(21, 21), w, h).letterPx).toBeGreaterThanOrEqual(6);
    const L = layoutCrosswordCard(normalizeCrossword({}), 1080, 1080);
    expect(L.texts.find((t) => t.label === "title")!.px).toBeGreaterThanOrEqual(1080 / 20);
    // The square card wraps a long title to two lines before it shrinks; the board gives up one line's height.
    const long = layoutCrosswordCard(normalizeCrossword({ title: "A Sunday-Size Stress Grid" }), 1080, 1080);
    const lt = long.texts.find((t) => t.label === "title")!;
    expect(lt.text.split("\n")).toHaveLength(2);
    expect(lt.px).toBeGreaterThanOrEqual(1080 / 20);
    expect(long.board.ink.h / 1080).toBeGreaterThan(0.64);
    const max = layoutCrosswordCard(normalizeCrossword({ title: "A Title Long Enough To Need Two Lines Ok" }), 1080, 1080).texts;
    for (const other of max.filter((t) => t.label !== "title")) expect(max.find((t) => t.label === "title")!.px).toBeGreaterThanOrEqual(other.px);
    for (const [w, h] of [[1920, 1080], [1080, 1920]]) {
      expect(layoutCrosswordCard(normalizeCrossword({}), w, h).texts.find((t) => t.label === "title")!.px).toBeGreaterThanOrEqual(Math.min(w, h) / 20);
    }
  });

  it("stays inside the engine's cost budget and on the 5-smooth lattice at every grid size", async () => {
    for (const n of [3, 13, 17, 19, 23, 25]) {
      const grid = synthetic(n, n);
      const doc = await render({ grid, themeEntries: n > 3 ? longThemes(grid) : "", circles: "" });
      expect(doc.sources!.length).toBeLessThan(400);
      // One text source for every letter and one for every number: the engine's root overlay chain stays
      // ~8 deep at any size (a source per row reached 37 at 21x21 and tripped OVERLAY_CHAIN_DEEP).
      expect(labels(doc).filter((l) => l === "cell-letter" || l === "cell-number")).toEqual(["cell-number", "cell-letter"]);
      expect(getComplexityMetricsFast(String(doc.m0)).frameCount).toBeLessThan(400);
      // The engine drops inline masks past ~25 overlay layers (COST_BUDGETS.overlayDepth is 20): rows never stack.
      const parsed = parseM0StringComplete(String(doc.m0), 1080, 1080);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(Math.max(...parsed.ir.editorFrames.map((f) => Number(f.overlayDepth ?? 0)))).toBeLessThanOrEqual(20);
      expect(latticeReport([String(doc.m0)]).offenders).toEqual([]);
    }
  });

  it("uses its space on purpose without a theme, and never overflows a canvas too small for the list", async () => {
    // Landscape, themeless: the title block sits mid-column above the caption, not at the top over an empty band.
    const L = layoutCrosswordCard(normalizeCrossword({ themeEntries: "" }), 1920, 1080);
    const title = L.texts.find((t) => t.label === "title")!, meta = L.texts.find((t) => t.label === "meta")!;
    expect(title.rect.y - L.panel.y).toBeGreaterThan((meta.rect.y - L.panel.y) * 0.25);
    // Portrait, themeless: the caption line is centred in the band under the board, not pinned to the bottom.
    const P = layoutCrosswordCard(normalizeCrossword({ themeEntries: "" }), 1080, 1920);
    const pm = P.texts.find((t) => t.label === "meta")!;
    expect(1920 - P.panel.y - (pm.rect.y + pm.rect.h)).toBeGreaterThan(100);
    // A 300x300 card with 8 long answers drops the list (the tint still marks them) instead of throwing.
    const grid = OPEN21;
    for (const [w, h] of [[300, 300], [240, 240], [360, 300]]) {
      const doc = await render({ grid, themeEntries: longThemes(grid), circles: "" }, w, h);
      expect(labels(doc)).toContain("theme-tint");
    }
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
    expect(await render({ grid: synthetic(21, 21), themeEntries: "", circles: "" }, 1920, 1080)).toEqual(await render({ grid: synthetic(21, 21), themeEntries: "", circles: "" }, 1920, 1080));
  });
});
