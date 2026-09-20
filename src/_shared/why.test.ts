import { evaluateM0, toM0String } from "@m0saic/dsl-stdlib";
import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";

import { targetCtx } from "../__testutils__/render";
import { checkLayoutIntent } from "./layout";
import { WHY_BUDGET, WHY_MADE_LABEL, WHY_PAGE_LABELS, WHY_PLACEHOLDER, assertWhySpec, whySpecFor, whyTutorial } from "./why";
import type { WhySpec } from "./why";

const SPEC: WhySpec = {
  day: 7,
  date: "2026-09-26",
  agent: "codex",
  model: "gpt-5-codex",
  id: "@one-a-day/test/why-fixture/v1",
  title: "Why Fixture",
  who: "People in a test suite.",
  problem: ["A paragraph that was observed.", "A second paragraph with a long token: https://example.com/a-very-long-path-that-has-no-spaces-in-it-at-all-and-keeps-going-and-going"],
  sources: ["https://example.com/one", "https://news.ycombinator.com/item?id=1"],
  solution: ["The template answers it like so."],
  usage: { command: "m0saic make @one-a-day/test/why-fixture/v1 --template-repo . -w 1280 -h 720 -o out.png", try: ["a thing", "another thing"] },
  caveats: ["One honest weak spot."],
  timeline: {
    source: "runner",
    costBasis: "estimated",
    pricedAt: "2026-09-20",
    phases: [
      { name: "scout", startMs: 0, durMs: 600000, calls: 20, tokens: 150000, costUsd: 3.1, tools: "Bash 12, WebSearch 5" },
      { name: "plan", startMs: 600000, durMs: 300000, calls: 5, tokens: 40000, costUsd: 0.8 },
      { name: "build", startMs: 900000, durMs: 1500000, calls: 60, tokens: 500000, costUsd: 9.9, tools: "Bash 40, Edit 12" },
    ],
  },
};

const design = (w: number, h: number): MosaicEngineContext => ({ ...targetCtx(w, h), mode: "design" }) as MosaicEngineContext;

/** A stand-in template render: one colour tile, its duration from the target (a still). */
const render = async (_props: unknown, ctx: MosaicEngineContext): Promise<MosaicDocument> => ({
  kind: "mosaic_document",
  version: 1,
  m0: toM0String("1", "why-fixture"),
  assets: {},
  size: { width: ctx.target.width, height: ctx.target.height },
  sources: [{ type: "lavfi", color: "#123456" }],
});

const textOf = (doc: MosaicDocument): string =>
  (doc.sources ?? [])
    .flatMap((s) => (s.type === "text" ? (s as { layers: Array<{ content: { text: string } }> }).layers.map((l) => l.content.text) : []))
    .join("\n");

describe("_shared/why: the why-tutorial", () => {
  const tutorial = whyTutorial(SPEC, render);

  it("registers the spec by id and stamps it on the renderer", () => {
    expect(whySpecFor(SPEC.id)).toEqual(SPEC);
    expect(tutorial.why).toEqual(SPEC);
    expect(Object.isFrozen(tutorial.why)).toBe(true);
  });

  it("renders six steps in the convention's order - the template fifth, how it was made last - each page owning its duration", async () => {
    for (const [w, h] of [[1280, 720], [1080, 1920], [1200, 630], [640, 360], [3840, 2160]] as Array<[number, number]>) {
      const p = await tutorial({}, design(w, h));
      expect(p.kind).toBe("mosaic_pipeline");
      expect(p.steps).toHaveLength(6);
      p.steps.forEach((step, i) => {
        expect(step.durationMs).toBeGreaterThan(0);
        const doc = step.file as MosaicDocument;
        expect(doc.kind).toBe("mosaic_document");
        if (i < 4) {
          expect(String(doc.editor?.label)).toMatch(new RegExp("^" + WHY_PAGE_LABELS[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
          expect(doc.durationMs).toBe(step.durationMs);
          expect(doc.durationMs).not.toBe(2000); // never ctx.target.durationMs
          const ev = evaluateM0(String(doc.m0), { width: w, height: h });
          expect(ev.feasible && ev.meetsPrecision).toBe(true);
          // every page carries a layout contract that holds: text fits, chrome in place
          const check = checkLayoutIntent(doc, w, h);
          expect(check).not.toBeNull();
          expect(check!.violations.map((v) => v.detail)).toEqual([]);
        }
      });
      // the fifth step IS the template's own default render; the last is the harness timeline
      expect(String((p.steps[4].file as MosaicDocument).m0)).toBe(String((await render({}, design(w, h))).m0));
      const made = p.steps[5].file as MosaicDocument;
      expect(String(made.editor?.label)).toBe(WHY_MADE_LABEL);
      expect(textOf(made)).toContain("How this template was made");
      expect(textOf(made)).toContain("codex / gpt-5-codex");
      expect(textOf(made)).toContain("numbers from the runner's trace");
      expect(textOf(made)).toContain("690k tokens - $14");
      expect(textOf(made)).toContain("cost estimated at list prices of 2026-09-20");
      expect(checkLayoutIntent(made, w, h)!.violations.map((v) => v.detail)).toEqual([]);
    }
  });

  it("says who ran it on every chrome page, and puts the sources on the problem page", async () => {
    const p = await tutorial({}, design(1280, 720));
    const pages = p.steps.slice(0, 4).map((s) => textOf(s.file as MosaicDocument));
    for (const text of pages) {
      expect(text).toContain("day 007 - 2026-09-26");
      expect(text).toContain("codex / gpt-5-codex");
      expect(text).toContain("journal/2026-09-26/");
    }
    expect(pages[0]).toContain("Why Fixture");
    expect(pages[0]).toContain("self-declared by the agent");
    // the date sits on the cover's title row, big, beside "Day 007"
    const cover = p.steps[0].file as MosaicDocument;
    const titleRow = (cover.sources ?? []).filter((s) => ["title", "title-right"].includes(String((s as { editor?: { label?: string } }).editor?.label)));
    expect(titleRow).toHaveLength(2);
    const [dayCell, dateCell] = titleRow as Array<{ layers: Array<{ content: { text: string }; style: { fontSize: number } }> }>;
    expect(dayCell.layers[0].content.text).toBe("Day 007");
    expect(dateCell.layers[0].content.text).toBe("2026-09-26");
    expect(dateCell.layers[0].style.fontSize).toBeGreaterThanOrEqual(dayCell.layers[0].style.fontSize * 0.8);
    expect(pages[1]).toContain("People in a test suite.");
    expect(pages[1]).toContain("example.com/one");
    expect(pages[1]).toContain("news.ycombinator.com/item?id=1");
    expect(pages[2]).toContain("One honest weak spot.");
    expect(pages[3]).toContain("--template-repo . -w 1280 -h 720");
    // every drawn character is ASCII (the bundled font has no tofu to show)
    for (const text of pages) expect(text).toMatch(/^[\x20-\x7e\n]*$/);
  });

  it("breaks a token wider than the page instead of running it off the edge", async () => {
    const p = await tutorial({}, design(640, 360));
    const text = textOf(p.steps[1].file as MosaicDocument);
    const longest = text.split("\n").reduce((n, l) => Math.max(n, l.length), 0);
    expect(longest).toBeLessThan(120);
    expect(text.replace(/\n/g, "")).toContain("a-very-long-path-that-has-no-spaces");
  });

  it("is deterministic", async () => {
    expect(await tutorial({}, design(1280, 720))).toEqual(await tutorial({}, design(1280, 720)));
  });

  it("refuses a spec over budget, with a placeholder, non-ASCII copy or a bad source - at definition time", () => {
    const bad = (patch: Partial<WhySpec>) => () => assertWhySpec({ ...SPEC, ...patch });
    expect(bad({ problem: [] })).toThrow(/problem needs at least 1/);
    expect(bad({ problem: ["a", "b", "c", "d"] })).toThrow(/max 3/);
    expect(bad({ who: "x".repeat(WHY_BUDGET.maxWhoChars + 1) })).toThrow(/chars/);
    expect(bad({ solution: [`${WHY_PLACEHOLDER} later`] })).toThrow(/placeholder/);
    expect(bad({ who: "an arrow → here" })).toThrow(/non-ASCII/);
    expect(bad({ sources: [] })).toThrow(/sources needs at least 1/);
    expect(bad({ sources: ["not a url"] })).toThrow(/not a URL/);
    expect(bad({ sources: ["ftp://example.com/x"] })).toThrow(/not http/);
    expect(bad({ date: "20-09-2026" })).toThrow(/YYYY-MM-DD/);
    expect(bad({ day: 0 })).toThrow(/positive integer/);
    expect(() => whyTutorial({ ...SPEC, usage: { command: "", try: [] } }, render)).toThrow(/usage.command is empty/);
    expect(bad({ timeline: { source: "runner", phases: [] } })).toThrow(/timeline.phases needs at least 1/);
    expect(bad({ timeline: { source: "guess" as "runner", phases: SPEC.timeline.phases } })).toThrow(/timeline.source/);
    expect(bad({ timeline: { source: "runner", phases: [{ name: "x", startMs: -1, durMs: 5 }] } })).toThrow(/startMs/);
  });

  it("registers one spec per id", () => {
    expect(() => whyTutorial({ ...SPEC }, render)).toThrow(/already registered/);
  });
});
