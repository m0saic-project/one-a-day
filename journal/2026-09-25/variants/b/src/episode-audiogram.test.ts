import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";
import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  DEFAULT_WAVE,
  EpisodeAudiogramV1,
  clockText,
  initialsOf,
  layoutAudiogram,
  litBarsAt,
  litTimes,
  fiveSmoothDown,
  timecodeExpr,
} from "./episode-audiogram";

const ID = "@one-a-day/social/episode-audiogram/v1";

const render = (
  props: Parameters<typeof EpisodeAudiogramV1.render>[0] = {},
  w = 1080,
  h = 1080,
  ctx?: MosaicEngineContext,
) => EpisodeAudiogramV1.render({ ...EpisodeAudiogramV1.defaultProps, ...props }, ctx ?? targetCtx(w, h)).then(asDocument);

const defaultOpts = {
  showName: "SIGNAL PATH",
  episodeTitle: "Ep 12 - The batch is the workflow",
  quote: "We stopped making clips by hand the day the feed started making them for us.",
  cta: "New episode - out now",
  wave: [...DEFAULT_WAVE],
  clipSec: 30,
};

describe(ID, () => {
  it("binds what it displays - episode, show, quote, CTA, wave, cover", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: EpisodeAudiogramV1.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.episodeTitle).toHaveLength(1);
    expect(byProp.showName).toHaveLength(1);
    expect(byProp.quote).toHaveLength(1);
    expect(byProp.cta).toHaveLength(1);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven canvases - defaults, stress copy, removed lines, light", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const overs = [
      {},
      {
        episodeTitle: "Episode 128 - A very long episode name that must shrink before it fits a narrow canvas without clipping",
        quote:
          "A much longer pull quote than the default one, the kind a producer actually pastes: two full sentences of transcript that have to wrap into several lines and still sit beside the cover art.",
      },
      { showName: "", cta: "", quote: "" },
      { preset: "light" as const, accent: "#0e7a5f" },
    ];
    for (const over of overs) {
      await sweepLayout(
        (p, ctx) => EpisodeAudiogramV1.render(p, ctx).then(asDocument),
        ID,
        { ...EpisodeAudiogramV1.defaultProps, ...over },
        (w, h) => targetCtx(w, h),
      );
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("sweep arithmetic: bar k lights at k*clip/n, frame 0 is lit, the end is all lit", () => {
    const n = DEFAULT_WAVE.length;
    const times = litTimes(n, 30);
    expect(times[0]).toBe(0);
    expect(times).toHaveLength(n);
    for (let k = 1; k < n; k++) expect(times[k]).toBeGreaterThan(times[k - 1]);
    expect(times[n - 1]).toBeLessThan(30);
    for (const t of [0, 0.4, 7.5, 15, 29.9]) {
      expect(litBarsAt(times, t)).toBe(Math.min(n, Math.floor((t * n) / 30) + 1));
    }
    expect(litBarsAt(times, 30)).toBe(n);
  });

  it("the timecode expression caps at the total and pads both fields", () => {
    const expr = timecodeExpr(30);
    expect(expr).toContain("min(trunc(t)\\,30)");
    expect(expr.match(/d\\:2/g)).toHaveLength(2);
    expect(clockText(30)).toBe("00:30");
    expect(clockText(600)).toBe("10:00");
  });

  it("the wave child renders on a 5-smooth canvas with two tiles per bar, the accent copies gated", async () => {
    // 1263x711 - both sides carry awkward factors; the child must not.
    const doc = await render({}, 1263, 711);
    const child = doc.children?.wave as MosaicDocument | undefined;
    expect(child).toBeDefined();
    const factorsOut = (v: number) => {
      let m = v;
      for (const p of [2, 3, 5]) while (m % p === 0) m /= p;
      return m;
    };
    expect(factorsOut(child!.size!.width)).toBe(1);
    expect(factorsOut(child!.size!.height)).toBe(1);
    expect(fiveSmoothDown(child!.size!.width)).toBe(child!.size!.width);
    const sources = (child!.sources ?? []) as Array<{ editor?: { label?: string }; overlay?: { enable?: string } }>;
    const dim = sources.filter((s) => s.editor?.label === "bar-dim");
    const lit = sources.filter((s) => s.editor?.label === "bar-lit");
    expect(dim).toHaveLength(DEFAULT_WAVE.length);
    expect(lit).toHaveLength(DEFAULT_WAVE.length);
    expect(lit.filter((s) => s.overlay?.enable && s.overlay.enable !== "1").length).toBe(DEFAULT_WAVE.length - 1);
  });

  it("audio is an input: no file, no track intent; a file joins the assets and the mix", async () => {
    const silent = await render();
    expect(Object.keys(silent.assets ?? {})).toHaveLength(0);
    expect((silent.sources ?? []).some((s) => (s as { mediaType?: string }).mediaType === "audio")).toBe(false);

    const withAudio = await render({ audioSrc: ["snippet.mp3"] });
    const assets = Object.values(withAudio.assets ?? {}) as Array<{ mediaType?: string; path?: string }>;
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({ mediaType: "audio", path: "snippet.mp3" });
    expect((withAudio.sources ?? []).some((s) => (s as { mediaType?: string }).mediaType === "audio")).toBe(true);
  });

  it("the clip is the snippet: clipSec authors the duration, an explicit pin overrides it", async () => {
    expect((await render()).durationMs).toBe(30000);
    expect((await render({ clipSec: 45 })).durationMs).toBe(45000);
    expect(EpisodeAudiogramV1.resolveOutputHints?.(EpisodeAudiogramV1.defaultProps)).toEqual({ durationMs: 30000 });
    expect(EpisodeAudiogramV1.resolveOutputHints?.({ clipSec: 90 })).toEqual({ durationMs: 90000 });
    // The host-seeded target is never read as a pin...
    expect((await render({}, 1080, 1080, targetCtx(1080, 1080, { durationMs: 2000 }))).durationMs).toBe(30000);
    // ...an explicit user pin is, and becomes the clip.
    const pinned = { ...targetCtx(1080, 1080), userIntent: { durationMs: 45000 } } as unknown as MosaicEngineContext;
    const doc = await EpisodeAudiogramV1.render({ ...EpisodeAudiogramV1.defaultProps }, pinned).then(asDocument);
    expect(doc.durationMs).toBe(45000);
    const child = doc.children?.wave as MosaicDocument;
    expect(child.durationMs).toBe(45000);
  });

  it("is deterministic and rejects what the schema promises to reject", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ accent: "purple" })).rejects.toThrow(/#rrggbb/);
    await expect(render({ wave: [0.5, 0.5] })).rejects.toThrow(/8\.\.32/);
    await expect(render({ wave: Array(16).fill(1.5) })).rejects.toThrow(/0\.\.1/);
    await expect(render({ clipSec: 3 })).rejects.toThrow(/between 5 and 600/);
    await expect(render({ clipSec: 12.5 })).rejects.toThrow(/whole number/);
    await expect(render({ audioSrc: ["a.mp3", "b.mp3"] })).rejects.toThrow(/zero or one/);
    await expect(render({ preset: "sepia" as never })).rejects.toThrow(/dark.*light/);
  });

  it("geometry invariants: cover square, wave under the row, footer at the bottom, initials from the show", () => {
    for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920], [480, 270]] as const) {
      const L = layoutAudiogram(defaultOpts, w, h);
      expect(L.cover.w).toBe(L.cover.h);
      expect(L.wave.y).toBeGreaterThan(L.cover.y);
      expect(L.timecodeRect.y).toBeGreaterThan(L.wave.y);
      expect(L.timecodeRect.y + L.timecodeRect.h).toBeLessThanOrEqual(h);
      expect(L.bars).toHaveLength(defaultOpts.wave.length);
      for (const b of L.bars) {
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.y + b.h).toBeLessThanOrEqual(L.wave.h);
      }
    }
    expect(initialsOf("Signal Path")).toBe("SP");
    expect(initialsOf("mono")).toBe("M");
    expect(initialsOf("")).toBe("");
  });
});
