import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import type { MosaicDocument } from "@m0saic/types";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  TypingPbCardV1,
  formatWpm,
  layoutTypingPbCard,
  normalizeTypingPbCard,
  parseChart,
  pbDelta,
  peakOf,
} from "./typing-pb-card";
import type { TypingPbCardProps } from "./typing-pb-card";

const ID = "@one-a-day/gaming/typing-pb-card/v1";
const render = (props: TypingPbCardProps = {}, w = 1080, h = 1080) =>
  TypingPbCardV1.render({ ...TypingPbCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

/** Every drawn string with its label, from the document's own sources (no child docs in this card). */
function texts(doc: MosaicDocument): Array<{ label: string; text: string; px: number }> {
  return (doc.sources ?? [])
    .filter((s) => (s as { type?: string }).type === "text")
    .map((s) => {
      const src = s as unknown as { editor?: { label?: string }; layers: Array<{ content: { text: string }; style: { fontSize: number } }> };
      return { label: src.editor?.label ?? "", text: src.layers[0].content.text, px: src.layers[0].style.fontSize };
    });
}
const textOf = (doc: MosaicDocument, label: string) => texts(doc).find((t) => t.label === label)?.text;

describe(ID, () => {
  it("draws the default card the brief promised, every string as derived or typed", async () => {
    const doc = await render();
    expect(textOf(doc, "typing-label")).toBe("TYPING TEST");
    expect(textOf(doc, "handle")).toBe("KEYRUNNER");
    expect(textOf(doc, "mode-line")).toBe("english - time 60");
    expect(textOf(doc, "wpm-count")).toBe("102");
    expect(textOf(doc, "wpm-unit")).toBe("WPM");
    expect(textOf(doc, "delta-line")).toBe("+3 vs PB");
    expect(textOf(doc, "pb-badge-text")).toBe("NEW PB");
    expect(textOf(doc, "chart-caption")).toBe("wpm each second - peak 112 at 41s");
    expect(textOf(doc, "tile-acc-value")).toBe("98.2%");
    expect(textOf(doc, "tile-acc-label")).toBe("ACC");
    expect(textOf(doc, "tile-cons-value")).toBe("84.5");
    expect(textOf(doc, "tile-cons-label")).toBe("CONS");
    expect(textOf(doc, "tile-raw-value")).toBe("108");
    expect(textOf(doc, "tile-raw-label")).toBe("RAW");
    expect(textOf(doc, "footer")).toBe("Sample card: the typist and the numbers are invented");
    for (const t of texts(doc)) expect(t.text).toMatch(/^[\x20-\x7e]+$/);
  });

  it("binds what it shows: the handle, the wpm, each tile value, the mode line, the footer; the accent inks the rule, the badge and the peak bar", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: TypingPbCardV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const k of ["handle", "wpm", "raw", "acc", "consistency", "mode", "footer"]) expect(byProp[k]).toHaveLength(1);
    expect(byProp.accent).toHaveLength(3);
    // chart is a json list and pb is derived: neither is bound to a rect, both are declared unbound.
    expect(byProp.chart).toBeUndefined();
    expect(byProp.pb).toBeUndefined();
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases for the copy that stresses it", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const sweep = (over: TypingPbCardProps, canvases = CONTRACT_CANVASES) =>
      sweepLayout((p, ctx) => TypingPbCardV1.render(p, ctx).then(asDocument), ID, { ...TypingPbCardV1.defaultProps, ...over }, (w, h) => targetCtx(w, h), canvases);
    for (const over of [
      {},
      { handle: "sixteencharacter" },
      { wpm: 98 },
      { wpm: 102.4 },
      { pb: 102 },
      { footer: "" },
      { accent: "#5aa2ff" },
      { chart: [100, 105, 103] },
      { mode: "code_javascript - words 50" },
    ] as TypingPbCardProps[]) await sweep(over);
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("keeps the hierarchy: the hero wpm is the largest text, above the handle and every tile value, at every canvas", async () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const doc = await render({}, w, h);
      const t = texts(doc);
      const px = (label: string) => t.filter((x) => x.label === label).map((x) => x.px);
      const wpm = px("wpm-count");
      const handle = px("handle");
      const tileValues = ["tile-acc-value", "tile-cons-value", "tile-raw-value"].flatMap((l) => px(l));
      expect(wpm).toHaveLength(1);
      expect(Math.max(...wpm)).toBeGreaterThan(Math.max(...handle));
      expect(Math.max(...wpm)).toBeGreaterThan(Math.max(...tileValues));
    }
  });

  it("derives the PB line and the badge, never types them: 102 beats 99, 98 does not, 99 ties", async () => {
    const pb1 = await render();
    expect(textOf(pb1, "delta-line")).toBe("+3 vs PB");
    expect(textOf(pb1, "pb-badge-text")).toBe("NEW PB");
    const no1 = await render({ wpm: 98 });
    expect(textOf(no1, "delta-line")).toBe("1 under PB");
    expect(textOf(no1, "pb-badge-text")).toBeUndefined();
    const tie = await render({ wpm: 99, pb: 99 });
    expect(textOf(tie, "delta-line")).toBe("ties PB");
    expect(textOf(tie, "pb-badge-text")).toBeUndefined();
    expect(textOf(await render({ wpm: 102.4, pb: 98.9 }), "delta-line")).toBe("+3.5 vs PB");
    expect(textOf(await render({ wpm: 102.4, pb: 98.9 }), "pb-badge-text")).toBe("NEW PB");
  });

  it("formats a wpm with at most one decimal, no trailing zero", () => {
    expect(formatWpm(102)).toBe("102");
    expect(formatWpm(102.37)).toBe("102.4");
    expect(formatWpm(102.4)).toBe("102.4");
    expect(formatWpm(3.5)).toBe("3.5");
    expect(formatWpm(0.1)).toBe("0.1");
  });

  it("computes the delta and the peak from the numbers, not from typed copy", () => {
    expect(pbDelta(102, 99)).toEqual({ isNew: true, line: "+3 vs PB" });
    expect(pbDelta(99, 99)).toEqual({ isNew: false, line: "ties PB" });
    expect(pbDelta(98, 99)).toEqual({ isNew: false, line: "1 under PB" });
    expect(peakOf([92, 94, 112, 111, 112])).toEqual({ value: 112, second: 3 });
    expect(peakOf([60, 60])).toEqual({ value: 60, second: 1 });
    expect(parseChart([100, 105, 103])).toEqual([100, 105, 103]);
    expect(parseChart(JSON.stringify([90, 91]))).toEqual([90, 91]);
  });

  it("refuses every bad input with a message that names the field and the value", async () => {
    await expect(render({ raw: 101 })).rejects.toThrow(/raw is 101 but wpm is 102: raw wpm counts mistakes too/);
    await expect(render({ wpm: 0 })).rejects.toThrow(/wpm must be from 0.1 to 400/);
    await expect(render({ acc: 100.5 })).rejects.toThrow(/acc must be from 0 to 100/);
    await expect(render({ consistency: -1 })).rejects.toThrow(/consistency must be from 0 to 100/);
    await expect(render({ pb: 0 })).rejects.toThrow(/pb must be from 0.1 to 400/);
    await expect(render({ chart: [500, 100] })).rejects.toThrow(/chart entry 0 \(500\) must be 0 to 400/);
    await expect(render({ chart: [100] })).rejects.toThrow(/chart has 1 entries; a chart holds 2 to 120 seconds/);
    await expect(render({ chart: [0, 0] })).rejects.toThrow(/chart needs at least one second above 0/);
    await expect(render({ chart: "{not json" } as never)).rejects.toThrow(/chart is not valid JSON/);
    await expect(render({ handle: "seventeenchars!!!" })).rejects.toThrow(/handle .* is 17 characters/);
    await expect(render({ mode: "english - time 6\u00b0" })).rejects.toThrow(/mode .* has the character/);
    await expect(render({ accent: "yellow" })).rejects.toThrow(/accent "yellow" must be #rrggbb/);
    // A misspelled prop is refused by name, so a typo never leaves the sample on a real card.
    await expect(render({ wpn: 100 } as never)).rejects.toThrow(/unknown prop 'wpn'; did you mean 'wpm'\?/);
    // A handle at the 16-character site limit fits a real canvas, caps and all.
    expect(textOf(await render({ handle: "sixteencharacter" }, 1080, 1080), "handle")).toBe("SIXTEENCHARACTER");
  });

  it("takes a pale accent and still reads the hero number in ink", () => {
    expect(normalizeTypingPbCard({}).heroInk).toBe("#e2b714");
    expect(normalizeTypingPbCard({ accent: "#5a5a5a" }).heroInk).toBe("#f4f4f6");
    expect(normalizeTypingPbCard({ accent: "" }).accent).toBe("#e2b714");
  });

  it("stacks the bands on the square and portrait, side by side on the wide canvas", () => {
    expect(layoutTypingPbCard({}, 1080, 1080).shape).toBe("square");
    expect(layoutTypingPbCard({}, 1080, 1920).shape).toBe("tall");
    expect(layoutTypingPbCard({}, 1920, 1080).shape).toBe("wide");
    const wide = layoutTypingPbCard({}, 1920, 1080);
    expect(wide.headRect.y).toBe(wide.heroRect.y);
    expect(wide.heroRect.x).toBeGreaterThan(wide.headRect.x + wide.headRect.w);
    const square = layoutTypingPbCard({}, 1080, 1080);
    expect(square.heroRect.y).toBeGreaterThan(square.headRect.y + square.headRect.h);
    // Every default second draws a bar on every shape.
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080], [480, 270]] as const) {
      expect(layoutTypingPbCard({}, w, h).barCount).toBe(60);
    }
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
    expect(await render({ wpm: 104 }, 1920, 1080)).toEqual(await render({ wpm: 104 }, 1920, 1080));
  });
});
