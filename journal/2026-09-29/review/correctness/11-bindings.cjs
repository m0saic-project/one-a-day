// Rendered bindings: every theme-id cell's focus must slice ITS id out of the RAW themeEntries string;
// and list what text each bound rect shows.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { resolvePropBindings } = require("@m0saic/template-utils");
const ctx = (W, H) => ({ mode: "render", target: { width: W, height: H, fps: 30, durationMs: 2000 }, output: { width: W, height: H, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
(async () => {
  let bad = 0;
  for (const raw of ["9A 12A", " 12A,\n  9A ", ",,9A,,,12A,,", "1A 4A 7A 8A 9A 11A 12A 16A", "3D\t1A 12D"]) {
    for (const [W, H] of [[1080, 1080], [1920, 1080], [480, 270]]) {
      const doc = await T.CrosswordGridCardV1.render({ ...T.CrosswordGridCardV1.defaultProps, themeEntries: raw }, ctx(W, H));
      const ids = doc.sources.filter((s) => /^theme-id-\d+$/.test(s.editor?.label ?? ""));
      for (const s of ids) {
        const b = s.editor.binding, shown = s.layers[0].content.text;
        const slice = raw.slice(b.focus.start, b.focus.end);
        if (slice !== shown || b.range.start !== 0 || b.range.end !== raw.length) { bad++; console.log(`MISMATCH raw=${JSON.stringify(raw)} ${W}x${H} ${s.editor.label}: shows ${shown}, focus slices ${JSON.stringify(slice)}, range ${JSON.stringify(b.range)}`); }
      }
      const { rejected } = resolvePropBindings(doc, W, H, { propsSchema: T.CrosswordGridCardV1.propsSchema });
      if (rejected.length) { bad++; console.log(`rejected bindings raw=${JSON.stringify(raw)} ${W}x${H}: ${JSON.stringify(rejected).slice(0, 300)}`); }
    }
  }
  console.log(`theme-id focus spans: ${bad ? bad + " problem(s)" : "all slice their own id"}`);
  const doc = await T.CrosswordGridCardV1.render({ ...T.CrosswordGridCardV1.defaultProps }, ctx(1080, 1080));
  for (const s of doc.sources) {
    const e = s.editor ?? {};
    const keys = e.binding ? [e.binding.propKey] : (e.bindings ?? []).map((b) => b.propKey);
    if (keys.length) console.log(`${(e.label ?? "").padEnd(18)} binds ${keys.join(",").padEnd(40)} shows ${JSON.stringify(s.layers?.[0]?.content?.text ?? "(non-text)")}`);
  }
})();
