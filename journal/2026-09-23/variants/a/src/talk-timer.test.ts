import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import type { MosaicEngineContext } from "@m0saic/types";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  TalkTimerV1,
  digitsExpr,
  layoutTalkTimer,
  litSlicesAt,
  phaseWindows,
  sliceSecondsFor,
  sliceWindows,
  smoothDown,
} from "./talk-timer";

const ID = "@one-a-day/events/talk-timer/v1";
const LONG_TITLE = "Keynote: what we learned shipping deterministic media pipelines to ten thousand developers in production";

const render = (
  props: Partial<Parameters<typeof TalkTimerV1.render>[0]> = {},
  w = 1920,
  h = 1080,
  ctx?: MosaicEngineContext,
) => TalkTimerV1.render({ ...TalkTimerV1.defaultProps, ...props }, ctx ?? targetCtx(w, h)).then(asDocument);

/** Every source's overlay gate, by label, the bar's child included - the timing the bar and the phases promise. */
function gates(doc: { sources?: unknown[]; children?: Record<string, unknown> }): Array<{ label: string; enable: string; window: { startSec?: number; endSec?: number } }> {
  const all = [...(doc.sources ?? []), ...Object.values(doc.children ?? {}).flatMap((c) => (c as { sources?: unknown[] }).sources ?? [])];
  return all
    .map((s) => s as { editor?: { label?: string }; overlay?: { enable?: string; window?: { startSec?: number; endSec?: number } } })
    .filter((s) => s.overlay?.enable)
    .map((s) => ({ label: String(s.editor?.label ?? ""), enable: String(s.overlay?.enable), window: s.overlay?.window ?? {} }));
}

describe(ID, () => {
  it("binds the title, the subtitle, the end word and the accent to the rects that show them", async () => {
    const { byProp, rejected } = resolvePropBindings(await render(), 1920, 1080, { propsSchema: TalkTimerV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const prop of ["title", "subtitle", "endText", "accent"]) expect(byProp[prop]?.length).toBeGreaterThan(0);
  });

  it("clears its safe minimum at its hint and at portrait and square", async () => {
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const ev = evaluateM0(String((await render({}, w, h)).m0), { width: w, height: h });
      expect(ev.feasible && ev.meetsPrecision).toBe(true);
    }
  });

  it("cuts the countdown into at most 30 human slices", () => {
    expect(sliceSecondsFor(300)).toBe(10);
    expect(sliceSecondsFor(60)).toBe(2);
    expect(sliceSecondsFor(180)).toBe(10);
    expect(sliceSecondsFor(1080)).toBe(60);
    expect(sliceSecondsFor(3600)).toBe(120);
    expect(sliceSecondsFor(5)).toBe(1);
    for (const s of [5, 7, 45, 60, 90, 300, 600, 1080, 2700, 3600, 21600]) expect(sliceWindows(s, 0, 0).length).toBeLessThanOrEqual(30);
  });

  it("lights exactly ceil(remaining / slice) slices at every moment, and colours them by the phase they tip", () => {
    const w = sliceWindows(300, 60, 30);
    expect(w).toHaveLength(30);
    expect(w[0].outAtSec).toBe(300);
    expect(w[29].outAtSec).toBe(10);
    for (const t of [0, 5, 10, 10.5, 11, 150, 239, 240, 269, 270, 299, 299.9, 300, 305]) {
      expect(litSlicesAt(w, t)).toBe(Math.max(0, Math.ceil((300 - t) / 10)));
    }
    expect(w.map((x) => x.phase).join(",")).toBe(["final", "final", "final", "warn", "warn", "warn", ...Array(24).fill("calm")].join(","));
    // an uneven countdown: the last slice is partial and still counted
    const odd = sliceWindows(127, 30, 10); // 5 s slices: 25 whole ones and a 2 s stub
    expect(odd).toHaveLength(26);
    expect(odd[25].frac).toBeCloseTo(0.4);
    expect(litSlicesAt(odd, 0)).toBe(26);
    expect(litSlicesAt(odd, 2.5)).toBe(25);
    expect(litSlicesAt(odd, 126.9)).toBe(1);
  });

  it("prints MM:SS from one drawtext expression and gates the three phase copies to windows that meet exactly", async () => {
    expect(digitsExpr(300)).toBe("%{eif\\:trunc((max(0\\,ceil(300-t-0.001)))/60)\\:d\\:2}:%{eif\\:mod(max(0\\,ceil(300-t-0.001))\\,60)\\:d\\:2}");
    expect(phaseWindows(300, 60, 30)).toEqual({ calm: { startSec: 0, endSec: 240 }, warn: { startSec: 240, endSec: 270 }, final: { startSec: 270, endSec: null } });
    expect(phaseWindows(300, 0, 0)).toEqual({ calm: { startSec: 0, endSec: null }, warn: null, final: null });
    expect(phaseWindows(300, 0, 10)).toEqual({ calm: { startSec: 0, endSec: 290 }, warn: null, final: { startSec: 290, endSec: null } });
    const g = gates(await render());
    const by = (label: string) => g.filter((x) => x.label === label);
    expect(by("digits-calm")).toEqual([{ label: "digits-calm", enable: "lt(t,240)", window: { endSec: 240 } }]);
    expect(by("digits-warn")).toEqual([{ label: "digits-warn", enable: "gte(t,240)*lt(t,270)", window: { startSec: 240, endSec: 270 } }]);
    expect(by("digits-final")).toEqual([{ label: "digits-final", enable: "gte(t,270)", window: { startSec: 270 } }]);
    expect(by("caption-warn")[0].enable).toBe("gte(t,240)*lt(t,270)");
    expect(by("caption-final")[0].enable).toBe("gte(t,270)*lt(t,300)");
    expect(by("caption-end")[0].enable).toBe("gte(t,300)");
    expect(by("seg-lit")).toHaveLength(30);
    expect(by("seg-lit").map((x) => x.enable)).toContain("lt(t,10)");
    expect(by("seg-lit").map((x) => x.enable)).toContain("lt(t,300)");
    // the spent tiles are static (no gate) so they lower onto the grid sheet
    expect(by("seg-spent")).toHaveLength(0);
    const bar = (await render()).children?.bar as { sources?: Array<{ editor?: { label?: string } }>; durationMs?: number } | undefined;
    expect(bar?.durationMs).toBe(305000);
    expect(bar?.sources?.filter((s) => s.editor?.label === "seg-spent")).toHaveLength(30);
  });

  it("makes the clip exactly the countdown plus the hold, and an explicit pin becomes the countdown", async () => {
    expect((await render()).durationMs).toBe(305000);
    expect((await render({ seconds: 180, holdSec: 0 })).durationMs).toBe(180000);
    expect(TalkTimerV1.resolveOutputHints?.(TalkTimerV1.defaultProps)).toEqual({ durationMs: TalkTimerV1.outputHints?.durationMs });
    expect(TalkTimerV1.resolveOutputHints?.({ seconds: 180, holdSec: 5 })).toEqual({ durationMs: 185000 });
    expect(TalkTimerV1.resolveOutputHints?.({ seconds: "nonsense" as unknown as number })).toEqual({ durationMs: 305000 });
    const pinned = { ...targetCtx(1920, 1080), userIntent: { durationMs: 60000 } } as unknown as MosaicEngineContext;
    const doc = await render({}, 1920, 1080, pinned);
    expect(doc.durationMs).toBe(60000);
    expect(gates(doc).filter((x) => x.label === "seg-lit")).toHaveLength(28); // 55 s of countdown in 2 s slices
    expect(gates(doc).find((x) => x.label === "caption-end")?.enable).toBe("gte(t,55)");
    // the host-seeded target is a hint, never a pin
    expect((await render({}, 1920, 1080, targetCtx(1920, 1080, { durationMs: 2000 }))).durationMs).toBe(305000);
  });

  it("gives the bar a 5-smooth canvas of its own at any size", () => {
    expect(smoothDown(1790)).toBe(1728);
    expect(smoothDown(90)).toBe(90);
    expect(smoothDown(179)).toBe(162);
    expect(smoothDown(1)).toBe(1);
    for (const [w, h] of [[1920, 1080], [1280, 720], [1080, 1920], [1080, 1080], [3840, 2160], [640, 360], [480, 270], [1366, 768], [1200, 630], [999, 777]]) {
      const L = layoutTalkTimer({ seconds: 300, holdSec: 5, title: "Lightning talk", subtitle: "", warnSec: 60, finalSec: 30, endText: "TIME" }, w, h);
      for (const side of [L.bar.w, L.bar.h]) {
        let m = side;
        for (const p of [2, 3, 5]) while (m % p === 0) m /= p;
        expect(m).toBe(1);
      }
      expect(L.bar.w).toBeGreaterThan(0.9 * (w - 2 * L.margin));
    }
  });

  it("lays the digits out as the biggest thing on the frame, with room for the system font", () => {
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080], [480, 270]]) {
      const L = layoutTalkTimer({ seconds: 300, holdSec: 5, title: "Lightning talk", subtitle: "5 minute slot - hard stop", warnSec: 60, finalSec: 30, endText: "TIME" }, w, h);
      expect(L.digitsPx).toBeGreaterThan((L.title?.px ?? 0) * 2);
      expect(L.digitsWidth * 1.15).toBeLessThanOrEqual(L.digitsRect.w);
      expect(L.digitsRect.y).toBeGreaterThan(L.subtitleRect.y + L.subtitleRect.h - 1);
      expect(L.digitsRect.y + L.digitsRect.h).toBeLessThanOrEqual(L.bar.y);
      expect(L.bar.y + L.bar.h).toBeLessThanOrEqual(L.ruleRect.y);
      expect(L.slices).toHaveLength(30);
      expect(L.slices[29].x + L.slices[29].w).toBeLessThanOrEqual(L.bar.x + L.bar.w + 1);
      for (let i = 1; i < L.slices.length; i++) expect(L.slices[i].x).toBeGreaterThan(L.slices[i - 1].x + L.slices[i - 1].w);
    }
  });

  it("keeps its layout contract at the seven contract canvases for the copy that stresses it", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [
      {},
      { title: LONG_TITLE, subtitle: LONG_TITLE },
      { title: "", subtitle: "", endText: "" },
      { warnSec: 0, finalSec: 0 },
      { seconds: 21600, warnSec: 600, finalSec: 60, preset: "light" as const },
      { seconds: 5, warnSec: 3, finalSec: 1, holdSec: 0 },
    ]) {
      await sweepLayout((p, ctx) => TalkTimerV1.render(p, ctx).then(asDocument), ID, { ...TalkTimerV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("is deterministic and rejects a clock that cannot be honest", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ seconds: 3 })).rejects.toThrow(/between 5 and 21600/);
    await expect(render({ seconds: 300.5 })).rejects.toThrow(/whole number/);
    await expect(render({ warnSec: 300 })).rejects.toThrow(/warnSec/);
    await expect(render({ finalSec: 90 })).rejects.toThrow(/must not exceed warnSec/);
    await expect(render({ holdSec: 100 })).rejects.toThrow(/holdSec/);
    await expect(render({ accent: "green" })).rejects.toThrow(/#rrggbb/);
    await expect(render({ preset: "neon" as unknown as "dark" })).rejects.toThrow(/preset/);
  });
});
