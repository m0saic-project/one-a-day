import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import type { MosaicDocument } from "@m0saic/types";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  GeocacheMilestoneCardV1,
  isMilestone,
  layoutGeocacheMilestoneCard,
  normalizeGeocacheMilestoneCard,
  ordinal,
  parseTypeMix,
} from "./geocache-milestone-card";
import type { GeocacheMilestoneCardProps } from "./geocache-milestone-card";

const ID = "@one-a-day/community/geocache-milestone-card/v1";
const render = (props: GeocacheMilestoneCardProps = {}, w = 1080, h = 1080) =>
  GeocacheMilestoneCardV1.render({ ...GeocacheMilestoneCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

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
    expect(textOf(doc, "geocache-label")).toBe("GEOCACHING");
    expect(textOf(doc, "cacher-name")).toBe("GEOHIKER55");
    expect(textOf(doc, "caching-since")).toBe("caching since 2015");
    expect(textOf(doc, "find-count")).toBe("1,000");
    expect(textOf(doc, "milestone-line")).toBe("1,000th find");
    expect(textOf(doc, "milestone-badge-text")).toBe("MILESTONE");
    expect(textOf(doc, "mix-legend")).toBe("Trad 812 / Mystery 121 / Multi 38 / Event 20 / Letterbox 9");
    expect(textOf(doc, "tile-ftf-value")).toBe("24");
    expect(textOf(doc, "tile-ftf-label")).toBe("FTF");
    expect(textOf(doc, "tile-d-value")).toBe("2.3");
    expect(textOf(doc, "tile-d-label")).toBe("AVG D");
    expect(textOf(doc, "tile-t-value")).toBe("1.8");
    expect(textOf(doc, "tile-t-label")).toBe("AVG T");
    expect(textOf(doc, "footer")).toBe("Sample card: the geocacher and the numbers are invented");
    // The default counts sum exactly to the find count: no Other in the legend.
    expect(textOf(doc, "mix-legend")).not.toContain("Other");
    for (const t of texts(doc)) expect(t.text).toMatch(/^[\x20-\x7e]+$/);
  });

  it("binds what it shows: the name, the count, each tile value, the since line, the mix, the accent, the footer", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: GeocacheMilestoneCardV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const k of ["cacherName", "findCount", "ftfCount", "avgD", "avgT", "sinceYear", "footer"]) expect(byProp[k]).toHaveLength(1);
    // The accent colours the header rule and the milestone badge.
    expect(byProp.accent).toHaveLength(2);
    // typeMix is a json list: edited as a structured form, not bound to a rect.
    expect(byProp.typeMix).toBeUndefined();
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases for the copy that stresses it", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const sweep = (over: GeocacheMilestoneCardProps, canvases = CONTRACT_CANVASES) =>
      sweepLayout((p, ctx) => GeocacheMilestoneCardV1.render(p, ctx).then(asDocument), ID, { ...GeocacheMilestoneCardV1.defaultProps, ...over }, (w, h) => targetCtx(w, h), canvases);
    for (const over of [
      {},
      { cacherName: "TEAM_GEOHIKER_AND_FRIEND" },
      { findCount: 1042 },
      { findCount: 1500 },
      { findCount: 9999999 },
      { footer: "" },
      { accent: "#ffd23f" },
      { typeMix: [{ type: "Traditional", count: 320 }, { type: "Mystery", count: 80 }] },
    ] as GeocacheMilestoneCardProps[]) await sweep(over);
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("keeps the hierarchy: the hero count is the largest text, above the name and every tile value, at every canvas", async () => {
    for (const [w, h] of CONTRACT_CANVASES) {
      const doc = await render({}, w, h);
      const t = texts(doc);
      const px = (label: string) => t.filter((x) => x.label === label).map((x) => x.px);
      const find = px("find-count");
      const name = px("cacher-name");
      const tileValues = ["tile-ftf-value", "tile-d-value", "tile-t-value"].flatMap((l) => px(l));
      expect(find).toHaveLength(1);
      expect(Math.max(...find)).toBeGreaterThan(Math.max(...name));
      expect(Math.max(...find)).toBeGreaterThan(Math.max(...tileValues));
    }
  });

  it("derives the milestone and the ordinal, never types them: 1000 is one, 1042 is not", async () => {
    const m1 = await render();
    expect(textOf(m1, "milestone-badge-text")).toBe("MILESTONE");
    const n1 = await render({ findCount: 1042 });
    expect(textOf(n1, "milestone-line")).toBe("1,042nd find");
    expect(textOf(n1, "milestone-badge-text")).toBeUndefined();
    expect(textOf(await render({ findCount: 1500 }), "milestone-badge-text")).toBe("MILESTONE");
    expect(textOf(await render({ findCount: 5000 }), "milestone-badge-text")).toBe("MILESTONE");
    expect(textOf(await render({ findCount: 6000 }), "milestone-badge-text")).toBe("MILESTONE");
  });

  it("follows Project-GC's milestone ladder exactly", () => {
    for (const n of [1, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 10000]) {
      expect(isMilestone(n)).toBe(true);
    }
    for (const n of [0, 2, 9, 11, 49, 51, 99, 101, 199, 201, 1042, 1001, 1100, 1300, 5500, 5600]) {
      expect(isMilestone(n)).toBe(false);
    }
  });

  it("formats the ordinal and the count with a thousands comma and the right suffix", () => {
    expect(ordinal(1000)).toBe("1,000th");
    expect(ordinal(1042)).toBe("1,042nd");
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(21)).toBe("21st");
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(111)).toBe("111th");
    expect(ordinal(121)).toBe("121st");
    expect(ordinal(122)).toBe("122nd");
    expect(ordinal(123)).toBe("123rd");
    expect(ordinal(1204)).toBe("1,204th");
    expect(ordinal(9999999)).toBe("9,999,999th");
  });

  it("keeps the top five types by count and folds the rest into a grey Other", () => {
    const mix = parseTypeMix(
      [
        { type: "Traditional", count: 812 },
        { type: "Mystery", count: 121 },
        { type: "Multi", count: 38 },
        { type: "Letterbox", count: 9 },
        { type: "Event", count: 20 },
      ],
      1000,
    );
    expect(mix.top.map((e) => `${e.type} ${e.count}`)).toEqual(["Traditional 812", "Mystery 121", "Multi 38", "Event 20", "Letterbox 9"]);
    expect(mix.other).toBe(0);
    expect(mix.legend).toBe("Trad 812 / Mystery 121 / Multi 38 / Event 20 / Letterbox 9");
    const partial = parseTypeMix([{ type: "Traditional", count: 320 }, { type: "Mystery", count: 80 }], 1000);
    expect(partial.top).toHaveLength(2);
    expect(partial.other).toBe(600);
    expect(partial.legend).toBe("Trad 320 / Mystery 80 / Other 600");
    expect(parseTypeMix([], 1000).legend).toBe("Other 1,000");
  });

  it("refuses every bad input with a message that names the field and the value", async () => {
    await expect(render({ findCount: 2.5 })).rejects.toThrow(/findCount must be a whole number/);
    await expect(render({ findCount: 0 })).rejects.toThrow(/findCount must be a whole number from 1/);
    await expect(render({ avgD: 5.5 })).rejects.toThrow(/avgD must be a number from 1.0 to 5.0/);
    await expect(render({ avgT: 0.5 })).rejects.toThrow(/avgT must be a number from 1.0 to 5.0/);
    await expect(render({ ftfCount: 1001 })).rejects.toThrow(/ftfCount must be a whole number from 0 to findCount \(1000\)/);
    await expect(render({ sinceYear: 1999 })).rejects.toThrow(/sinceYear must be a whole year from 2000 to 2026/);
    await expect(render({ typeMix: [{ type: "Traditionl", count: 10 }] })).rejects.toThrow(/unknown type "Traditionl"; did you mean 'Traditional'\?/);
    await expect(render({ typeMix: [{ type: "Traditional", count: 1200 }] })).rejects.toThrow(/shown types count 1200 finds, more than findCount 1000/);
    await expect(render({ typeMix: [{ type: "Traditional", count: 10 }, { type: "Traditional", count: 5 }] })).rejects.toThrow(/'Traditional' appears twice/);
    await expect(render({ cacherName: "" })).rejects.toThrow(/cacherName must not be empty/);
    await expect(render({ accent: "green" })).rejects.toThrow(/accent "green" must be #rrggbb/);
    // A misspelled prop is refused by name, so a typo never leaves the sample on a real card.
    await expect(render({ findcount: 500 } as never)).rejects.toThrow(/unknown prop 'findcount'; did you mean 'findCount'\?/);
    // typeMix may arrive as the raw JSON string a json prop's editor holds.
    expect(textOf(await render({ typeMix: JSON.stringify([{ type: "Traditional", count: 900 }]) } as never), "mix-legend")).toBe("Trad 900 / Other 100");
    await expect(render({ typeMix: "{not json" } as never)).rejects.toThrow(/typeMix is not valid JSON/);
    // A name too long for the thumbnail is refused above the floor, but fits a real canvas.
    expect(textOf(await render({ cacherName: "A".repeat(40) }, 1080, 1080), "cacher-name")).toBe("A".repeat(40));
    await expect(render({ cacherName: "A".repeat(40) }, 480, 270)).rejects.toThrow(/cacherName cannot be fitted on 480x270/);
  });

  it("takes a pale accent and still reads the hero number in ink", () => {
    expect(normalizeGeocacheMilestoneCard({}).heroInk).toBe("#4a8f3c");
    expect(normalizeGeocacheMilestoneCard({ accent: "#ffd23f" }).heroInk).toBe("#1b1f1c");
    expect(normalizeGeocacheMilestoneCard({ accent: "" }).accent).toBe("#4a8f3c");
  });

  it("stacks four bands on the square and portrait, side by side on the wide canvas", () => {
    expect(layoutGeocacheMilestoneCard({}, 1080, 1080).shape).toBe("square");
    expect(layoutGeocacheMilestoneCard({}, 1080, 1920).shape).toBe("tall");
    expect(layoutGeocacheMilestoneCard({}, 1920, 1080).shape).toBe("wide");
    const wide = layoutGeocacheMilestoneCard({}, 1920, 1080);
    expect(wide.headRect.y).toBe(wide.heroRect.y);
    expect(wide.heroRect.x).toBeGreaterThan(wide.headRect.x + wide.headRect.w);
    const square = layoutGeocacheMilestoneCard({}, 1080, 1080);
    expect(square.heroRect.y).toBeGreaterThan(square.headRect.y + square.headRect.h);
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
    expect(await render({ findCount: 1042 }, 1920, 1080)).toEqual(await render({ findCount: 1042 }, 1920, 1080));
  });
});
