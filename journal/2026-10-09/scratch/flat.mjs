import { parseM0StringToLogicalFrames } from "@m0saic/dsl";
import { checkLayout, makeColorTile, placeInsetPieces, tag } from "@m0saic/template-utils";
const lf = parseM0StringToLogicalFrames("2(1{1},1)", 100, 50);
console.log("1{1} order:", lf.map(f => `${f.logicalIndex}:${f.meta.stableKey}:${f.x},${f.y},${f.width}x${f.height}`).join(" | "));
const text = (t, label) => ({ type: "text", rasterizer: "svg", renderMode: { kind: "image" }, layers: [{ content: { kind: "literal", text: t }, style: { fontSize: 12, fontColor: "#000000" }, placement: { hAlign: "left", vAlign: "middle" } }], editor: { owner: "template", label } });
const child = { kind: "mosaic_document", version: 1, m0: "2[1{1},1]", assets: {}, size: { width: 200, height: 100 }, backgroundColor: "#ffffff",
  sources: [tag(makeColorTile("#ff0000"), "cellA"), tag(text("hello", "textA"), "textA"), { ...tag(makeColorTile("#00ff00"), "cellB"), placement: { inset: { top: 0.5/50, left: 0, right: 0, bottom: 0 } } }] };
const placed = placeInsetPieces({ rootW: 640, rootH: 360, pieces: [
  { rect: { x: 100, y: 100, w: 200, h: 100, importance: 1 }, source: tag({ type: "mosaic", ref: "chart", placement: { fit: "contain" } }, "chart") },
  { rect: { x: 10, y: 10, w: 300, h: 30, importance: 1 }, source: tag(text("Title", "title"), "title") },
] });
const doc = { kind: "mosaic_document", version: 1, m0: placed.m0, assets: {}, size: { width: 640, height: 360 }, backgroundColor: "#eeeeee", sources: placed.sources, children: { chart: child } };
const res = checkLayout(doc, { canvasW: 640, canvasH: 360, constraints: [{ label: "chart" }, { label: "cellA" }, { label: "textA", textFits: { charWidthEm: 0.5, padPx: 0 } }, { label: "cellB" }, { label: "title" }], relations: [{ label: ["cellA", "cellB"], equal: "width", tolerancePx: 1 }] });
console.log(JSON.stringify(res, null, 1).slice(0, 3000));
