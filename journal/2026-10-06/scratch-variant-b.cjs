// Variant b (one idea): no headline pair - all six counts are equal tiles, 3x2 (2x3 in portrait).
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 80)); s = s.replace(a, b); };

rep(`  const weights = shape === "wide" ? [0.16, 0.58, 0.26] : shape === "square" ? [0.16, 0.29, 0.25, 0.3] : [0.11, 0.28, 0.39, 0.22];`,
    `  const weights = shape === "wide" ? [0.16, 0.58, 0.26] : shape === "square" ? [0.16, 0.54, 0.3] : [0.11, 0.67, 0.22];`);
rep(`  if (shape === "tall") {
    let slack = 0;
    const heroCap = Math.floor(halfW * 1.3);
    if (hs[1] > heroCap) { slack += hs[1] - heroCap; hs[1] = heroCap; }
    const statCap = 2 * Math.floor(halfW * 1.3) + gap;
    if (hs[2] > statCap) { slack += hs[2] - statCap; hs[2] = statCap; }
    gapY += Math.floor(slack / (bandCount - 1));
  }`,
`  if (shape === "tall") {
    const gridCap = 3 * Math.floor(halfW * 1.3) + 2 * gap;
    if (hs[1] > gridCap) { gapY += Math.floor((hs[1] - gridCap) / (bandCount - 1)); hs[1] = gridCap; }
  }`);

const start = s.indexOf("  // ── the six tiles: rects first, then one shared label size, then the numbers ──");
const end = s.indexOf("  // ── the milestone band: always there; badges, or the one line for an empty week ──");
if (start < 0 || end < 0) throw new Error("tiles block");
s = s.slice(0, start) + `  // ── the six tiles: ONE equal grid, 3x2 (2x3 in portrait), one label size, one number size ──
  // Runstats order: finishers and the three runner counts, then the two volunteer counts.
  const ORDER: readonly CountKey[] = [HERO_KEYS[0], ...STAT_KEYS.slice(0, 3), HERO_KEYS[1], STAT_KEYS[3]];
  const cols = shape === "tall" ? 2 : 3, rows = 6 / cols;
  const gridY = headerY + headerH + gapY, gridH = hs[1];
  const colW = Math.floor((CW - (cols - 1) * gap) / cols), rowH = Math.floor((gridH - (rows - 1) * gap) / rows);
  const slots = ORDER.map((_, i) => ({ x: m + (i % cols) * (colW + gap), y: gridY + Math.floor(i / cols) * (rowH + gap), w: colW, h: rowH }));
  const statRects: ReportRect[] = snapGroup(slots, pitch, Math.floor(gap / 2));
  const heroRects: ReportRect[] = [];
  const bandY = gridY + gridH + gapY, bandH = hs[2];
  const padOf = (r: ReportRect) => Math.max(2, Math.round(Math.min(r.w, r.h) * 0.08));
  const inner = (r: ReportRect) => { const pd = padOf(r); return { x: r.x + pd, y: r.y + pd, w: r.w - 2 * pd, h: r.h - 2 * pd }; };
  const statIn = inner(statRects[0]);
  const labelCap = Math.round(S * 0.034);
  // The labels take one line when it costs no size, else the long one breaks in two.
  const statLabelOne = Math.min(labelCap, Math.floor((statIn.h * 0.26) / 1.22), ...ORDER.map((k) => fitPx(TILE_LABEL[k].one, statIn.w, labelCap, false)));
  const statLabelTwo = Math.min(labelCap, Math.floor((statIn.h * 0.3) / (2 * 1.22)), ...ORDER.flatMap((k) => TILE_LABEL[k].two.map((t) => fitPx(t, statIn.w, labelCap, false))));
  const twoLineLabels = statLabelTwo > statLabelOne;
  // All six tile labels share one size.
  const labelPx = twoLineLabels ? statLabelTwo : statLabelOne;
  if (labelPx < floor) unfit("the tile labels");
  const statLines = twoLineLabels ? 2 : 1;
  const labelGap = Math.round(labelPx * 0.25);
  const value = (k: CountKey) => formatCount(p.counts[k]);
  const statValueRoom = statIn.h - labelGap - statLines * lineH(labelPx);
  // Six equals: one number size, the largest every tile allows.
  const statPx = Math.min(Math.round(S * 0.2), Math.floor(statValueRoom / 1.22), ...ORDER.map((k) => fitPx(value(k), statIn.w, S, true)));
  const heroPx = statPx;
  if (statPx < floor) unfit("counts");

  ORDER.forEach((k, i) => {
    const r = statRects[i], group = \`tile-\${k}\`;
    groups.push({ key: group, label: "stat-tile", rect: r });
    tiles.push({ label: "stat-tile", rect: r, color: TILE as MosaicColor, radius: tileRadius, group });
    const ri = inner(r);
    const lines = twoLineLabels ? TILE_LABEL[k].two : [TILE_LABEL[k].one];
    const blockH = lineH(statPx) + labelGap + statLines * lineH(labelPx);
    const y0 = ri.y + Math.round((ri.h - blockH) / 2);
    line(\`value-\${k}\`, { x: ri.x, y: y0, w: ri.w, h: lineH(statPx) }, value(k), statPx, { bold: true, align: "center", color: INK as MosaicColor, bind: { prop: "counts", key: k }, over: true, field: \`counts.\${k}\`, group });
    lines.forEach((t, j) => line(lines.length === 1 ? \`label-\${k}\` : \`label-\${k}-\${j + 1}\`, { x: ri.x, y: y0 + lineH(statPx) + labelGap + j * lineH(labelPx), w: ri.w, h: lineH(labelPx) }, t, labelPx, { align: "center", color: DIM as MosaicColor, over: true, field: "the tile labels", group }));
  });

` + s.slice(end);

// render(): no headline tiles to promise.
rep(`  constraints.push({ label: "hero-tile", within: { yFrac: [0.1, 0.8] } });
`, ``);
rep(`    { label: "hero-tile", equal: "size", tolerancePx: 2 },
`, ``);
fs.writeFileSync(p, s);
console.log("ok");
