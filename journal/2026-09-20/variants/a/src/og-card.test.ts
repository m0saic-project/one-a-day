import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { OgCardV1, layoutOgCard } from "./og-card";
import type { Rect } from "./og-card";

const ID = "@one-a-day/dev/og-card/v1";
/** The OG standard plus the gate's three. */
const CANVASES: Array<[number, number]> = [
  [1200, 630],
  [1920, 1080],
  [1080, 1080],
  [1080, 1920],
];
const LONG_TITLE =
  "How we cut our CI bill in half by rendering every social preview image at build time instead of in a browser";
const LONG_SUMMARY =
  "A deterministic template, one JSON file per post, and a diff you can review. Here is the pipeline, the numbers, and the three mistakes we made along the way before it worked.";

const render = (
  props: Partial<Parameters<typeof OgCardV1.render>[0]> = {},
  w = 1200,
  h = 630,
) => OgCardV1.render({ ...OgCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

const defaults = OgCardV1.defaultProps;
const copy = (over: Partial<typeof defaults> = {}) => ({
  title: over.title ?? defaults.title,
  summary: over.summary ?? defaults.summary ?? "",
  kicker: over.kicker ?? defaults.kicker ?? "",
  site: over.site ?? defaults.site ?? "",
  author: over.author ?? defaults.author ?? "",
});

const inside = (r: Rect, W: number, H: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe(ID, () => {
  it("binds every drawn prop to its rect and the bar to the accent - Make's double-click edits in place", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1200, 630, { propsSchema: OgCardV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const key of ["title", "summary", "kicker", "site", "author"]) expect(byProp[key]).toHaveLength(1);
    // accent paints the bar AND inks the kicker; ink rides the title rect
    expect(byProp.accent).toHaveLength(2);
    expect(byProp.ink).toHaveLength(1);
    expect(byProp.preset).toBeUndefined();
    expect(byProp.background).toBeUndefined();
  });

  it("clears its safe minimum at its own hint and at the gate's three canvases", async () => {
    for (const [w, h] of CANVASES) {
      const ev = evaluateM0(String((await render({}, w, h)).m0), { width: w, height: h });
      expect(ev.feasible && ev.meetsPrecision).toBe(true);
    }
  });

  it("carves honest rectangles: inside the canvas, no overlaps, footer on the bottom margin, block above it", () => {
    for (const [W, H] of CANVASES) {
      for (const text of [copy(), copy({ title: LONG_TITLE, summary: LONG_SUMMARY })]) {
        const L = layoutOgCard(text, W, H);
        const rects: Rect[] = [L.bar, L.title.rect];
        for (const p of [L.kicker, L.summary, L.site, L.author]) if (p) rects.push(p.rect);
        for (const r of rects) expect(inside(r, W, H)).toBe(true);
        for (let i = 0; i < rects.length; i++)
          for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i], rects[j])).toBe(false);
        // footer sits exactly on the bottom margin; the text block ends above it
        expect(L.site!.rect.y + L.site!.rect.h).toBe(H - L.margin);
        expect(L.author!.rect.y + L.author!.rect.h).toBe(H - L.margin);
        const blockEnd = (L.summary ?? L.title).rect.y + (L.summary ?? L.title).rect.h;
        expect(blockEnd).toBeLessThan(L.site!.rect.y);
        // chrome follows min(H, 0.75W): the margin is the same on 1080x1080 and 1080x1920
        expect(L.margin).toBe(Math.round(0.08 * Math.min(H, 0.75 * W)));
      }
    }
  });

  it("fits a 106-character title in at most three lines and a 170-character summary in two, at every canvas", () => {
    for (const [W, H] of CANVASES) {
      const L = layoutOgCard(copy({ title: LONG_TITLE, summary: LONG_SUMMARY }), W, H);
      expect(L.title.fit.lines).toBeLessThanOrEqual(3);
      expect(L.title.fit.text.replace(/\n/g, " ")).toBe(LONG_TITLE);
      expect(L.title.fit.width).toBeLessThanOrEqual(L.title.rect.w);
      expect(L.summary!.fit.lines).toBeLessThanOrEqual(2);
      expect(L.summary!.fit.width).toBeLessThanOrEqual(L.summary!.rect.w);
      // the fitter shrank the long title below the short default's size
      const short = layoutOgCard(copy(), W, H);
      expect(L.title.fit.fontSize).toBeLessThan(short.title.fit.fontSize);
      expect(L.title.fit.fontSize).toBeGreaterThanOrEqual(10);
    }
  });

  it("balances wrapped lines - no one-word widow on the default or the long title", () => {
    for (const [W, H] of CANVASES) {
      for (const text of [copy(), copy({ title: LONG_TITLE, summary: LONG_SUMMARY })]) {
        const L = layoutOgCard(text, W, H);
        for (const block of [L.title.fit, L.summary!.fit]) {
          const lines = block.text.split("\n");
          if (lines.length < 2) continue;
          for (const line of lines) expect(line.split(" ").length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("removes a row when its prop is emptied and keeps the rest in place", async () => {
    const bare = layoutOgCard(copy({ kicker: "", summary: "", author: "" }), 1200, 630);
    expect(bare.kicker).toBeNull();
    expect(bare.summary).toBeNull();
    expect(bare.author).toBeNull();
    expect(bare.site).not.toBeNull();
    const doc = await render({ kicker: "", summary: "", author: "" });
    const { byProp } = resolvePropBindings(doc, 1200, 630, { propsSchema: OgCardV1.propsSchema });
    expect(byProp.kicker).toBeUndefined();
    expect(byProp.title).toHaveLength(1);
    expect(doc.sources).toHaveLength(3); // bar, title, site
  });

  it("is deterministic, follows the preset, and rejects an empty title or a bad colour", async () => {
    expect(await render()).toEqual(await render());
    expect((await render()).backgroundColor).toBe("#0b1220");
    expect((await render({ preset: "light" })).backgroundColor).toBe("#ffffff");
    expect((await render({ background: "#123456" })).backgroundColor).toBe("#123456");
    await expect(render({ title: "   " })).rejects.toThrow(/title must not be empty/);
    await expect(render({ accent: "blue" })).rejects.toThrow(/#rrggbb/);
    await expect(render({ ink: "#12" })).rejects.toThrow(/#rrggbb/);
  });
});
