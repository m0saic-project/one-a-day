import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { AgentTimelineV1, SAMPLE_PHASES, fmtDuration, fmtTokens, fmtUsd, tickStepMs } from "./agent-timeline";

const ID = "@one-a-day/harness/agent-timeline/v1";
const render = (props: Partial<Parameters<typeof AgentTimelineV1.render>[0]> = {}, w = 1280, h = 720) =>
  AgentTimelineV1.render({ ...AgentTimelineV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);
const textOf = (doc: Awaited<ReturnType<typeof render>>) =>
  (doc.sources ?? []).flatMap((s) => ((s as { type: string }).type === "text" ? (s as { layers: Array<{ content: { text: string } }> }).layers.map((l) => l.content.text) : [])).join("\n");

describe(ID, () => {
  it("is internal (a harness fixture, never a top-level pick) and shows a sample day at defaults", async () => {
    expect(AgentTimelineV1.internal).toBe(true);
    const doc = await render();
    const text = textOf(doc);
    for (const p of SAMPLE_PHASES) expect(text).toContain(p.name);
    expect(text).toContain("6 phases - 2h 20m wall time - 261 tool calls - 1.7M tokens - $33");
    expect(text).toContain("numbers from the runner's trace");
    expect(text).toContain("cost as reported by the agent CLI");
    expect(text).toContain("720k tok - $15 - Bash 51");
    expect(text).toMatch(/^[\x20-\x7e\n]*$/);
  });

  it("binds the drawn props and clears its safe minimum", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1280, 720, { propsSchema: AgentTimelineV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const key of ["title", "subtitle", "header", "headerRight"]) expect(byProp[key]).toHaveLength(1);
    const ev = evaluateM0(String(doc.m0), { width: 1280, height: 720 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases, for one phase, twelve phases, and a self-reported run", async () => {
    const doc = await render();
    const intent = layoutIntentOf(doc);
    expect(intent).not.toBeNull();
    const textLabels = (doc.sources ?? []).filter((s) => (s as { type: string }).type === "text").map((s) => (s as { editor?: { label?: string } }).editor?.label);
    for (const label of textLabels) expect(intent!.constraints.some((c) => c.label === label && c.textFits)).toBe(true);
    const twelve = Array.from({ length: 12 }, (_, i) => ({ name: `phase ${i + 1} with a longer name`, startMs: i * 60000, durMs: 60000, calls: 10 + i, tokens: 12345 * (i + 1), tools: "Bash 9, Read 3, Edit 2, Write 1" }));
    const cases = [
      {},
      { phases: [{ name: "scout", startMs: 0, durMs: 48000, calls: 3 }], source: "self-reported" as const, header: "", headerRight: "", title: "" },
      { phases: twelve, status: "error" },
      { phases: SAMPLE_PHASES.map((p) => ({ ...p, tokens: undefined })), showTokens: false },
    ];
    for (const over of cases) {
      await sweepLayout((p, ctx) => AgentTimelineV1.render(p, ctx).then(asDocument), ID, { ...AgentTimelineV1.defaultProps, ...over }, (w, h) => targetCtx(w, h), CONTRACT_CANVASES);
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("formats compactly and picks nice ticks", () => {
    expect(fmtTokens(950)).toBe("950");
    expect(fmtTokens(12345)).toBe("12.3k");
    expect(fmtTokens(210000)).toBe("210k");
    expect(fmtTokens(1653000)).toBe("1.7M");
    expect(fmtUsd(0.42)).toBe("$0.42");
    expect(fmtUsd(3.2)).toBe("$3.20");
    expect(fmtUsd(48.4)).toBe("$48");
    expect(fmtUsd(1234)).toBe("$1.2k");
    expect(fmtDuration(48000)).toBe("48s");
    expect(fmtDuration(200000)).toBe("3m 20s");
    expect(fmtDuration(140 * 60000)).toBe("2h 20m");
    expect(tickStepMs(140 * 60000)).toBe(50 * 60000);
    expect(tickStepMs(90000)).toBe(20000);
  });

  it("is deterministic, drops the twelfth-plus phase, and rejects no phases or a bad accent", async () => {
    expect(await render()).toEqual(await render());
    const many = Array.from({ length: 15 }, (_, i) => ({ name: `p${i}`, startMs: i * 1000, durMs: 1000 }));
    expect(textOf(await render({ phases: many }))).not.toContain("p12");
    await expect(render({ phases: [] })).rejects.toThrow(/phases must hold at least one/);
    await expect(render({ accent: "orange" })).rejects.toThrow(/#rrggbb/);
  });
});
