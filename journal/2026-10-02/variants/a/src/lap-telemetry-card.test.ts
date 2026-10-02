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
    expect(doc.sources).toHaveLength(13);
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
      { sector1Time: "2:29.123", sector2Time: "2:44.000", sector3Time: "2:30.500" }
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

  it("renders with custom sector times and maintains layout", async () => {
    const doc = await render({
      sector1Time: "2:29.200",
      sector2Time: "2:43.900",
      sector3Time: "2:30.000",
    });
    expect(doc.sources).toHaveLength(13);
    expect(layoutIntentOf(doc)).not.toBeNull();
  });
});
