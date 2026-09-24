import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import { asAssetId } from "@m0saic/types";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout, textLabelsOf } from "../../../_shared/layout";
import { AppStoreScreenshotFrameV1, layoutAppStoreFrame } from "./app-store-screenshot-frame";

const ID = "@one-a-day/dev/app-store-screenshot-frame/v1";
const render = (
  props: Partial<Parameters<typeof AppStoreScreenshotFrameV1.render>[0]> = {},
  w = 1080,
  h = 1920,
  media: NonNullable<Parameters<typeof targetCtx>[2]>["media"] = {},
) => AppStoreScreenshotFrameV1.render({ ...AppStoreScreenshotFrameV1.defaultProps, ...props }, targetCtx(w, h, { media })).then(asDocument);

describe(ID, () => {
  it("binds every displayed prop to the rect that shows it", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1920, { propsSchema: AppStoreScreenshotFrameV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const key of ["sourceIds", "headline", "subhead", "appName", "slideNumber", "slideCount", "accentColor"]) {
      expect(byProp[key]?.length).toBeGreaterThan(0);
    }
    expect(textLabelsOf(doc).every(Boolean)).toBe(true);
  });

  it("keeps the shell exact, the capture inside it and media contained", async () => {
    for (const [w, h] of [[1080, 1920], [1080, 1080], [1920, 1080], [480, 270]] as const) {
      const L = layoutAppStoreFrame({ headline: "A localized promise that stays complete", subhead: "Supporting copy", appName: "DAYLIGHT", slideIndex: "01/05", markLetter: "D" }, w, h);
      expect(L.deviceShell.w / L.deviceShell.h).toBeCloseTo(9 / 19.5, 2);
      expect(L.capture.x).toBeGreaterThan(L.deviceShell.x);
      expect(L.capture.y).toBeGreaterThan(L.deviceShell.y);
      expect(L.capture.x + L.capture.w).toBeLessThan(L.deviceShell.x + L.deviceShell.w);
      expect(L.capture.y + L.capture.h).toBeLessThan(L.deviceShell.y + L.deviceShell.h);
    }
    const doc = await render({ sourceIds: ["capture.png"] }, 1080, 1920, {
      [asAssetId("capture.png")]: { kind: "image", width: 1170, height: 2532, hasVideo: true, hasAudio: false },
    });
    const media = doc.sources.find((source) => source.type === "media");
    expect(media).toMatchObject({ type: "media", mediaType: "image", assetId: "capture.png", placement: { fit: "contain" } });
    expect(AppStoreScreenshotFrameV1.outputHints?.format).toMatchObject({ kind: "image", container: "png" });
  });

  it("passes the seven-canvas contract for defaults, long copy and an empty subhead", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const variants = [
      {},
      { headline: "Coordinate every task and focus session from one calm place", subhead: "Localized supporting copy remains fully visible across each promised canvas." },
      { subhead: "" },
    ];
    for (const over of variants) {
      await sweepLayout((p, ctx) => AppStoreScreenshotFrameV1.render(p, ctx).then(asDocument), ID, { ...AppStoreScreenshotFrameV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("is deterministic, feasible at its hint and shows a generated demo with no media", async () => {
    const a = await render();
    expect(a).toEqual(await render());
    expect(a.sources.some((source) => source.type === "media")).toBe(false);
    expect(a.sources.length).toBeGreaterThan(12);
    const ev = evaluateM0(String(a.m0), { width: 1080, height: 1920 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("fails fast for invalid copy, colors, sequence values and media", async () => {
    await expect(render({ headline: "   " })).rejects.toThrow(/headline must not be empty/);
    await expect(render({ appName: "x".repeat(25) })).rejects.toThrow(/appName must be at most 24/);
    await expect(render({ accentColor: "indigo" })).rejects.toThrow(/#rrggbb/);
    await expect(render({ slideNumber: 6, slideCount: 5 })).rejects.toThrow(/must not exceed/);
    await expect(render({ slideCount: 100 })).rejects.toThrow(/integer from 1 to 99/);
    await expect(render({ sourceIds: ["a.png", "b.png"] })).rejects.toThrow(/zero or one image/);
    await expect(render({ sourceIds: ["clip.mp4"] }, 1080, 1920, {
      [asAssetId("clip.mp4")]: { kind: "video", width: 1080, height: 1920, hasVideo: true, hasAudio: true, durationMs: 1000 },
    })).rejects.toThrow(/must be an image/);
  });
});
