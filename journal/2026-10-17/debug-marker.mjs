const { ErgPbCardV1: T, ergMarkerFrac, parseErgSplit, layoutErgCard } = await import("../../dist/sports/erg-pb-card/v1/erg-pb-card.js");
const { checkLayoutIntent } = await import("../../dist/_shared/layout.js");

const CANVASES = [[1920, 1080], [1280, 720], [1080, 1920], [1080, 1080], [3840, 2160], [640, 360], [480, 270]];
const ctx = (w, h) => {
  const t = { width: w, height: h, fps: 30, durationMs: 2000 };
  return { mode: "render", target: t, output: { ...t, workspaceDir: "/tmp" }, media: {} };
};
for (const [w, h] of CANVASES) {
  for (const split of ["1:58.8", "1:00.0", "2:00.0", "2:30.0", "3:00.0", "9:59.9"]) {
    const renderable = await T.render({ split }, ctx(w, h));
    const doc = renderable.kind === "mosaic_document" ? renderable : null;
    const resolved = checkLayoutIntent(doc, w, h).resolved;
    const track = resolved["pace-track"][0].rect;
    const marker = resolved["pace-marker"][0].rect;
    const L = layoutErgCard({ split }, w, h);
    const frac = ergMarkerFrac(parseErgSplit(split));
    const off = Math.abs(marker.x + marker.w / 2 - (track.x + frac * track.w));
    const intentOff = Math.abs(L.markerRect.x + L.markerRect.w / 2 - (L.track.x + frac * L.track.w));
    if (off > 2 || intentOff > 2) {
      console.log(`${w}x${h} split ${split}: realizedOff=${off.toFixed(1)} marker=${JSON.stringify(marker)} track=${JSON.stringify(track)} | intentOff=${intentOff.toFixed(1)} intentMarker=${JSON.stringify(L.markerRect)} trackW=${L.track.w} mw=${L.markerRect.w}`);
    }
  }
}
console.log("done");

