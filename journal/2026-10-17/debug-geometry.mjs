// The build agent cannot view images in this session, so it verifies the
// render's claims two ways: the deterministic geometry inventory (this file)
// and pixel probes of the rendered PNGs (probe-pixels.mjs). Same math that
// produced the m0 the CLI rendered.
const { layoutErgCard } = await import("../../dist/sports/erg-pb-card/v1/erg-pb-card.js");

for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920]]) {
  const L = layoutErgCard({}, w, h);
  console.log(`=== ${w}x${h} ===`);
  for (const c of L.cells) {
    console.log(`  ${c.label.padEnd(20)} "${c.text.replace(/\n/g, " | ")}" ${c.px}px ${c.bold ? "bold " : ""}${c.align} @ ${Math.round(c.rect.x)},${Math.round(c.rect.y)} ${Math.round(c.rect.w)}x${Math.round(c.rect.h)}`);
  }
  for (const t of L.tiles) {
    console.log(`  [${t.label.padEnd(18)}] ${t.color} r${t.radius} @ ${Math.round(t.rect.x)},${Math.round(t.rect.y)} ${Math.round(t.rect.w)}x${Math.round(t.rect.h)}`);
  }
  const split = L.cells.find((c) => c.label === "split");
  const rest = L.cells.filter((c) => c.label !== "split");
  console.log(`  tallest cell: split ${split.px}px vs next ${Math.max(...rest.map((c) => c.px))}px; splitH ${split.rect.h} vs maxH ${Math.max(...rest.map((c) => c.rect.h))}`);
}
