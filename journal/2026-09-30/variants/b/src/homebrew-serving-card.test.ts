import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, checkLayoutIntent, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { HomebrewServingCardV1 as T, servingCardFloorPx, layoutServingCard, normalizeServingCard } from "./homebrew-serving-card";
import type { HomebrewServingCardProps } from "./homebrew-serving-card";

const ID = "@one-a-day/events/homebrew-serving-card/v1";
const render = (p: HomebrewServingCardProps = {}, w = 1920, h = 1080) => T.render(p, targetCtx(w, h)).then(asDocument);
const textOf = (p: HomebrewServingCardProps, w = 1920, h = 1080) => Object.fromEntries(layoutServingCard(p, w, h).cells.map((c) => [c.label, c.text.replace(/\n/g, " ")]));
// "@" is the widest printable ASCII glyph in the bundled font, regular and bold.
const TOKEN = "@".repeat(48);
const WORDS = "@@@@@@@ @@@@@@@ @@@@@@@ @@@@@@@ @@@@@@@ @@@@@@@@";
const CASES: HomebrewServingCardProps[] = [
  {},
  { beerName: TOKEN, beerStyle: TOKEN, brewer: TOKEN, abv: "100.00", abvBasis: "batch" },
  { beerName: WORDS, beerStyle: WORDS, brewer: WORDS, abv: "0" },
  { abv: "" },
  { brewer: "" },
  { beerName: TOKEN, abv: "", brewer: "" },
  { beerName: "A", beerStyle: "B", abv: "0", brewer: "C" },
];

describe(ID, () => {
  it("shows the use case at its defaults: a fictional beer, its style, an estimated strength, a brewer", () => {
    expect(textOf({})).toEqual({
      "beer-name": "Workshop Pale Ale",
      "beer-style": "American Pale Ale",
      "abv-value": "5.2%",
      "abv-qualifier": "Estimated ABV",
      brewer: "BREWER: Example Homebrew Club",
    });
    expect(T.defaultProps).toEqual({ beerName: "Workshop Pale Ale", beerStyle: "American Pale Ale", abv: "5.2", abvBasis: "estimated", brewer: "Example Homebrew Club", debugLayout: false });
  });

  it("says what kind of number the strength is, and never invents one", () => {
    const abv = (p: HomebrewServingCardProps) => { const t = textOf(p); return [t["abv-value"], t["abv-qualifier"]]; };
    expect(abv({ abv: "5.2", abvBasis: "estimated" })).toEqual(["5.2%", "Estimated ABV"]);
    expect(abv({ abv: "5.2", abvBasis: "batch" })).toEqual(["5.2%", "Batch ABV"]);
    // Missing is a state of its own: no number, no percent sign, no provenance claim - on either basis.
    expect(abv({ abv: "" })).toEqual(["ABV", "Not supplied"]);
    expect(abv({ abv: "", abvBasis: "batch" })).toEqual(["ABV", "Not supplied"]);
    expect(abv({ abv: "  " })).toEqual(["ABV", "Not supplied"]);
    // A real zero is not the missing state, and the caller's precision is kept.
    expect(abv({ abv: "0" })).toEqual(["0%", "Estimated ABV"]);
    expect(abv({ abv: "5.20", abvBasis: "batch" })).toEqual(["5.20%", "Batch ABV"]);
    expect(abv({ abv: "100.00" })).toEqual(["100.00%", "Estimated ABV"]);
    expect(abv({ abv: " 0.5 " })).toEqual(["0.5%", "Estimated ABV"]);
    expect(JSON.stringify(layoutServingCard({ abv: "" }, 1080, 1080).cells)).not.toMatch(/5\.2|%/);
  });

  it("hides the brewer credit and its prefix when the brewer is empty, and keeps the footer rule", async () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutServingCard({ brewer: "  " }, w, h);
      expect(L.cells.map((c) => c.label)).toEqual(["beer-name", "beer-style", "abv-value", "abv-qualifier"]);
      expect(L.rules.map((r) => r.label)).toContain("footer-rule");
    }
    const doc = await render({ brewer: "" });
    expect(JSON.stringify(doc.sources)).not.toContain("BREWER");
    expect(normalizeServingCard({ beerName: "  Kolsch  " }).beerName).toBe("Kolsch");
  });

  it("fits every accepted copy above the floor at the seven contract canvases, losing no glyph", async () => {
    for (const p of CASES) {
      await sweepLayout((q, ctx) => T.render(q, ctx).then(asDocument), ID, p, targetCtx);
      for (const [w, h] of CONTRACT_CANVASES) {
        const L = layoutServingCard(p, w, h);
        const doc = await render(p, w, h);
        const ev = evaluateM0(String(doc.m0), { width: w, height: h });
        expect(ev.feasible && ev.meetsPrecision).toBe(true);
        expect(doc.backgroundColor).toBe("#ffffff");

        // Every source is labelled and promised something; every text promises that it fits.
        const intent = layoutIntentOf(doc)!;
        for (const s of doc.sources ?? []) {
          expect(s.editor?.label).toBeTruthy();
          expect(intent.constraints.some((c) => c.label === s.editor?.label)).toBe(true);
          if (s.type === "text") expect(intent.constraints.some((c) => c.label === s.editor?.label && c.textFits)).toBe(true);
        }

        // The words are the caller's: wrapped, never cut, never below the floor.
        const shown = Object.fromEntries(L.cells.map((c) => [c.label, c]));
        const squeeze = (s: string) => s.replace(/\s/g, "");
        expect(squeeze(shown["beer-name"].text)).toBe(squeeze(L.p.beerName));
        expect(squeeze(shown["beer-style"].text)).toBe(squeeze(L.p.beerStyle));
        expect(squeeze(shown["abv-value"].text)).toBe(squeeze(L.p.value));
        expect(shown["abv-value"].text).not.toContain("\n");
        expect(squeeze(shown["abv-qualifier"].text)).toBe(squeeze(L.p.qualifier));
        if (L.p.credit) expect(squeeze(shown.brewer.text)).toBe(squeeze(L.p.credit)); else expect(shown.brewer).toBeUndefined();
        for (const c of L.cells) {
          expect(c.px).toBeGreaterThanOrEqual(servingCardFloorPx(w, h));
          expect(c.text).not.toContain("...");
          expect(c.rect.x).toBeGreaterThanOrEqual(L.mx);
          expect(c.rect.y).toBeGreaterThanOrEqual(L.my);
          expect(c.rect.x + c.rect.w).toBeLessThanOrEqual(w - L.mx);
          expect(c.rect.y + c.rect.h).toBeLessThanOrEqual(h - L.my);
        }

        // Where things are, from the rects the engine realizes.
        const resolved = checkLayoutIntent(doc, w, h)!.resolved;
        const at = (label: string) => resolved[label][0].rect;
        const drawn = [...L.cells, ...L.rules].map((x) => ({ label: x.label, rect: at(x.label) }));
        for (let i = 0; i < drawn.length; i++) for (let j = i + 1; j < drawn.length; j++) {
          const a = drawn[i].rect, b = drawn[j].rect;
          expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
        }
        const name = at("beer-name"), style = at("beer-style"), value = at("abv-value"), qualifier = at("abv-qualifier"), foot = at("footer-rule");
        expect(style.y).toBeGreaterThanOrEqual(name.y + name.h);
        // The qualifier is directly under its number, in the same column.
        expect(qualifier.y).toBeGreaterThanOrEqual(value.y + value.h);
        expect(qualifier.y - (value.y + value.h)).toBeLessThanOrEqual(Math.min(w, h) * 0.02 + 2);
        expect(Math.abs(qualifier.x - value.x)).toBeLessThanOrEqual(2);
        if (L.wide) {
          expect(value.x).toBeGreaterThan(name.x + name.w);
          expect(value.x).toBeGreaterThan(style.x + style.w);
        } else {
          expect(value.y).toBeGreaterThan(style.y + style.h);
        }
        // The footer and its rule live in the bottom fifth; the rule spans the content.
        expect(foot.y).toBeGreaterThanOrEqual(h * 0.8);
        expect(foot.w).toBeGreaterThanOrEqual(w * 0.85);
        expect(foot.y).toBeGreaterThan(qualifier.y + qualifier.h);
        if (L.p.credit) expect(at("brewer").y).toBeGreaterThan(foot.y);
      }
    }
  });

  it("balances wrapped lines instead of leaving a widow word under a full line", () => {
    const lines = (p: HomebrewServingCardProps, w: number, h: number, label: string) => layoutServingCard(p, w, h).cells.find((c) => c.label === label)!.text.split("\n");
    for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920]]) expect(lines({}, w, h, "beer-name")).toEqual(["Workshop", "Pale Ale"]);
    // Balancing moves breaks, it never adds a line or changes the words.
    const long = lines({ beerName: "Barrel Aged Imperial Oatmeal Breakfast Stout" }, 1080, 1080, "beer-name");
    expect(long.join(" ")).toBe("Barrel Aged Imperial Oatmeal Breakfast Stout");
    expect(long.length).toBeLessThanOrEqual(4);
    // A token that has to be split keeps its greedy breaks: every line but the last is full.
    const split = lines({ beerName: TOKEN }, 1080, 1080, "beer-name");
    expect(split.join("")).toBe(TOKEN);
    expect(new Set(split.slice(0, -1).map((l) => l.length)).size).toBe(1);
  });

  it("leads with the name and the number at the defaults, on every canvas", () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const px = Object.fromEntries(layoutServingCard({}, w, h).cells.map((c) => [c.label, c.px]));
      expect(px["beer-name"]).toBeGreaterThanOrEqual(px["beer-style"] * 2);
      expect(px["abv-value"]).toBeGreaterThanOrEqual(px["abv-qualifier"] * 2);
      expect(px["beer-style"]).toBeGreaterThanOrEqual(px.brewer);
    }
  });

  it("binds each text rect to the string prop it shows; the enum keeps its schema picker", async () => {
    const bound = async (p: HomebrewServingCardProps) => {
      const { byProp, rejected } = resolvePropBindings(await render(p), 1920, 1080, { propsSchema: T.propsSchema });
      expect(rejected).toEqual([]);
      return Object.fromEntries(Object.entries(byProp).map(([k, v]) => [k, v.length]));
    };
    // The qualifier shows abvBasis, which a text rect cannot edit in place: it stays unbound.
    expect(await bound({})).toEqual({ beerName: 1, beerStyle: 1, abv: 1, brewer: 1 });
    expect(await bound({ abvBasis: "batch" })).toEqual({ beerName: 1, beerStyle: 1, abv: 1, brewer: 1 });
    // With no value both strength rects edit `abv`; an empty brewer leaves nothing to bind.
    expect(await bound({ abv: "", brewer: "" })).toEqual({ beerName: 1, beerStyle: 1, abv: 2 });
  });

  it("is deterministic, follows ctx.target when nested, and passes its own contract with the overlay on", async () => {
    expect(await render()).toEqual(await render());
    const ctx = targetCtx(480, 270);
    ctx.output.width = 3840;
    ctx.output.height = 2160;
    expect(await T.render({}, ctx).then(asDocument)).toEqual(await render({}, 480, 270));
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
    expect((await render({ debugLayout: true }, 1080, 1080)).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it.each<[string, unknown]>([
    ["beerName", ""], ["beerName", "   "], ["beerName", "W".repeat(49)], ["beerName", null], ["beerName", 42], ["beerName", "Kölsch"], ["beerName", "a\nb"],
    ["beerStyle", ""], ["beerStyle", "\t"], ["beerStyle", "W".repeat(49)], ["beerStyle", null],
    ["brewer", "W".repeat(49)], ["brewer", null], ["brewer", "Café Brewers"], ["brewer", "a\r\nb"],
    ["abv", "5.2%"], ["abv", "05"], ["abv", "5."], ["abv", ".5"], ["abv", "5.123"], ["abv", "100.01"], ["abv", "101"], ["abv", "1000"],
    ["abv", "-1"], ["abv", "+5"], ["abv", "5,2"], ["abv", "1e1"], ["abv", "five"], ["abv", "5.2 ABV"], ["abv", "5.2\n"], ["abv", 5.2], ["abv", null],
    ["abvBasis", "measured"], ["abvBasis", ""], ["abvBasis", "Batch"], ["abvBasis", null],
    ["debugLayout", "false"], ["debugLayout", null],
  ])("rejects an invalid %s (%p) by name, without falling back to the sample", (field, value) => {
    expect(() => normalizeServingCard({ [field]: value } as HomebrewServingCardProps)).toThrow(new RegExp(`${ID}: ${field} `));
  });
});
