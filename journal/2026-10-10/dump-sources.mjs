// scratch: dump every source of a default render, string by string, for the
// build phase's stills audit (this session's model cannot view images).
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const entry = require("../../dist/index.js");
const T = entry.templates.find((t) => t.id === "@one-a-day/sports/golf-round-scorecard/v1");
if (!T) { console.error("template not found in dist"); process.exit(1); }
for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080], [640, 360]]) {
  const doc = await T.render(T.defaultProps, { mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h }, media: {} });
  const rows = [];
  for (const s of doc.sources ?? []) {
    const label = s.editor?.label ?? "(unlabelled)";
    if (s.type === "text") {
      const layer = s.layers?.[0];
      const text = layer?.content?.kind === "literal" ? layer.content.text : "?";
      const px = layer?.style?.fontSize ?? "?";
      const rect = [s.editor?.binding ? "bind" : "-", label, JSON.stringify(text), `${px}px`];
      rows.push(rect.join(" "));
    } else {
      rows.push(`tile ${label} ${s.type}${s.mask ? " +mask" : ""}${s.visual?.backgroundColor ? " " + s.visual.backgroundColor : ""}${s.editor?.binding ? " bind:" + JSON.stringify(s.editor.binding) : ""}`);
    }
  }
  console.log(`\n=== ${w}x${h} — ${rows.length} sources ===`);
  for (const r of rows) console.log(r);
}
