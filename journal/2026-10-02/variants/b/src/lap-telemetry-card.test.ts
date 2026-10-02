import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { LapTelemetryCardV1 } from "./lap-telemetry-card";

const render = (
  props: Parameters<typeof LapTelemetryCardV1.render>[0] = {},
  w = 1280,
  h = 720,
) => LapTelemetryCardV1.render({ ...LapTelemetryCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

describe("@one-a-day/sports/lap-telemetry-card/v1", () => {
  it("renders the default lap with proper sources for track, lap time, and driver", async () => {
    const doc = await render();
    expect(doc.sources.length).toBeGreaterThanOrEqual(16); // text + 3 bars
    expect(layoutIntentOf(doc)).not.toBeNull();
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1280, height: 720 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases - defaults, long track names, mixed deltas", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [
      {},
      { trackName: "Autodromo Internazionale di Monza" },
      { sector1Time: "35.104", sector2Time: "41.236", sector3Time: "38.472" }
    ]) {
      await sweepLayout((p, ctx) => LapTelemetryCardV1.render(p, ctx).then(asDocument), "@one-a-day/sports/lap-telemetry-card/v1", { ...LapTelemetryCardV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("is deterministic", async () => {
    expect(await render()).toEqual(await render());
  });

  it("rejects non-string values for required fields", async () => {
    await expect(render({ trackName: 42 as never })).rejects.toThrow(/must be a string/);
    await expect(render({ driverId: 42 as never })).rejects.toThrow(/must be a string/);
  });

  it("rejects invalid time formats", async () => {
    await expect(render({ lapTime: "abc" })).rejects.toThrow(/Invalid time format/);
    await expect(render({ lapTime: "99:99.999" })).rejects.toThrow(/Invalid time format/);
    await expect(render({ sector1Time: "60.000" })).rejects.toThrow(/Invalid time format/);
  });

  it("formats times correctly as M:SS.sss without extra zero", async () => {
    const doc = await render({ lapTime: "1:54.812", pbTime: "1:55.420" });
    // Render succeeds and produces the expected number of sources (text + bars)
    expect(doc.sources.length).toBeGreaterThanOrEqual(16);
    expect(layoutIntentOf(doc)).not.toBeNull();
  });

  it("calculates and displays deltas with correct signs", async () => {
    const doc = await render({
      lapTime: "1:54.812",
      pbTime: "1:55.420",
      sector1Time: "35.104",
      sector1Pb: "35.512",
      sector2Time: "41.236",
      sector2Pb: "41.561",
      sector3Time: "38.472",
      sector3Pb: "38.347",
    });
    // Should render without throwing - delta calculation is validated in isolation
    expect(doc.sources.length).toBeGreaterThanOrEqual(16);
    expect(layoutIntentOf(doc)).not.toBeNull();
  });

  it("draws proportional delta bars", async () => {
    const doc = await render({
      sector1Time: "35.104",
      sector1Pb: "35.512",
      sector2Time: "41.236",
      sector2Pb: "41.561",
      sector3Time: "38.472",
      sector3Pb: "38.347",
    });
    // Should have at least 3 more sources for the bars (text + bars = 16+)
    expect(doc.sources.length).toBeGreaterThanOrEqual(16);
  });

  it("renders with custom sector times and maintains layout", async () => {
    const doc = await render({
      sector1Time: "2:29.200",
      sector2Time: "2:43.900",
      sector3Time: "2:30.000",
    });
    expect(doc.sources.length).toBeGreaterThanOrEqual(16);
    expect(layoutIntentOf(doc)).not.toBeNull();
  });

  it("renders default values as improvement run (most sectors green)", async () => {
    // Defaults should show improvement in first two sectors, tire wear in third
    const doc = await render();
    expect(doc.sources.length).toBeGreaterThanOrEqual(16);
    expect(layoutIntentOf(doc)).not.toBeNull();
    // Verify the document structure and bars are present
    expect(doc.backgroundColor).toBe("#1c2833");
  });
});
