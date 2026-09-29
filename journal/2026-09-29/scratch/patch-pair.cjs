// One-off patch for the build phase: split byline and caption into bound cells.
const fs = require("fs");
const f = process.argv[2];
let s = fs.readFileSync(f, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 80)); s = s.replace(a, b); };

rep('hAlign: "left" | "right"; vAlign: "top" | "middle" | "bottom"; bind?: "title" };',
    'hAlign: "left" | "right"; vAlign: "top" | "middle" | "bottom"; bind?: "title" | "author" | "publication" };');

rep('  const meta = `${publication} | ${weekday(y, m, d)} ${m}/${d}/${String(y % 100).padStart(2, "0")} | ${pz.cols}x${pz.rows} | ${p.solved ? "solution" : "puzzle"}`;\n  return { ...p, pz, numbers, entries, themes, circles, title, author, publication, meta, themeColor: p.themeColor as MosaicColor };',
    '  const metaRest = `${weekday(y, m, d)} ${m}/${d}/${String(y % 100).padStart(2, "0")} | ${pz.cols}x${pz.rows} | ${p.solved ? "solution" : "puzzle"}`;\n  return { ...p, pz, numbers, entries, themes, circles, title, author, publication, meta: `${publication} | ${metaRest}`, metaRest, themeColor: p.themeColor as MosaicColor };');

rep('export type CrosswordBoard = {',
`/** A lead cell and a tail cell sharing one size: side by side (the tail may wrap in its own column), or stacked. */
type Pair = { px: number; stacked: boolean; tail: string[]; leadW: number; tailX: number; height: number };
const leadBoxW = (w: number) => Math.ceil((w + 3) / 0.94) + 1;

/**
 * The largest size at which \`lead\` + \`tail\` fit \`w\` x \`maxH\`, trying the
 * \`modes\` in order at each size range: "line" (one line), "wrap" (the tail
 * wraps to two lines beside the lead), "stack" (the tail on the next line).
 */
function pairFit(lead: string, leadBold: boolean, tail: string, tailStacked: string, w: number, maxH: number, maxPx: number, floorPx: number, modes: Array<"line" | "wrap" | "stack">): Pair {
  const at = (px: number, mode: "line" | "wrap" | "stack"): Pair | null => {
    const leadW = widthOf(lead, px, leadBold);
    if (mode === "stack") {
      const lines = wrap(tailStacked, px, budget(w), false);
      return leadW <= budget(w) && lines.length === 1 && 2 * blockH(px, 1) <= maxH ? { px, stacked: true, tail: lines, leadW, tailX: 0, height: 2 * blockH(px, 1) } : null;
    }
    const tailX = Math.max(leadBoxW(leadW), Math.round(leadW + px * 0.3));
    if (w - tailX < 2 * px) return null;
    const lines = wrap(tail, px, budget(w - tailX), false);
    return lines.length <= (mode === "line" ? 1 : 2) && blockH(px, lines.length) <= maxH ? { px, stacked: false, tail: lines, leadW, tailX, height: blockH(px, lines.length) } : null;
  };
  for (const [lo, hi] of [[floorPx, Math.floor(maxPx)], [6, floorPx - 1]]) {
    for (const mode of modes) for (let px = hi; px >= lo; px--) { const hit = at(px, mode); if (hit) return hit; }
  }
  const lines = wrap(tailStacked, 6, budget(w), false);
  return { px: 6, stacked: true, tail: lines, leadW: widthOf(lead, 6, leadBold), tailX: 0, height: blockH(6, 1) + blockH(6, lines.length) };
}

export type CrosswordBoard = {`);

rep('  /** The theme list as one block:',
`  /** Place a fitted pair at (x, y): lead and tail top-aligned, each its own cell (the bare prop value is bound). */
  const pair = (P: Pair, x: number, y: number, w: number, lead: { label: string; text: string; color: MosaicColor; bold: boolean; bind?: CrosswordTextBox["bind"] }, tail: { label: string; color: MosaicColor; bind?: CrosswordTextBox["bind"] }) => {
    texts.push({ label: lead.label, rect: rect(x, y, leadBoxW(P.leadW), blockH(P.px, 1)), text: lead.text, px: P.px, width: P.leadW, bold: lead.bold, color: lead.color, hAlign: "left", vAlign: "top", ...(lead.bind ? { bind: lead.bind } : {}) });
    const tx = x + P.tailX, ty = P.stacked ? y + blockH(P.px, 1) : y;
    texts.push({ label: tail.label, rect: rect(tx, ty, x + w - tx, blockH(P.px, P.tail.length)), text: P.tail.join("\\n"), px: P.px, width: Math.max(...P.tail.map((l) => widthOf(l, P.px))), bold: false, color: tail.color, hAlign: "left", vAlign: "top", ...(tail.bind ? { bind: tail.bind } : {}) });
  };
  const byline = (P: Pair, x: number, y: number, w: number) => pair(P, x, y, w, { label: "byline-by", text: "by", color: DIM, bold: false }, { label: "byline", color: INK, bind: "author" });
  const bylineFit = (w: number, maxH: number, maxPx: number) => pairFit("by", false, p.author, p.author, w, maxH, maxPx, floorPx, ["line", "wrap"]);
  const meta = (P: Pair, x: number, y: number, w: number) => pair(P, x, y, w, { label: "meta-publication", text: p.publication, color: INK, bold: true, bind: "publication" }, { label: "meta", color: DIM });
  const metaFit = (w: number, maxH: number, maxPx: number) => pairFit(p.publication, true, \`| \${p.metaRest}\`, p.metaRest, w, maxH, maxPx, floorPx, ["line", "stack"]);

  /** The theme list as one block:`);

// landscape
rep(`    const b = place("byline", \`by \${p.author}\`, x, t.rect.y + t.rect.h + Math.round(S * 0.008), w, panel.h * 0.12, S * 0.036, floorPx, [1, 2], { color: DIM, vAlign: "top" });
    const metaF = fit(p.meta, w, panel.h * 0.1, S * 0.028, floorPx, [1, 2], false);
    const metaH = blockH(metaF.px, metaF.lines.length);
    place("meta", p.meta, x, panel.y + panel.h - metaH, w, metaH, S * 0.028, floorPx, [1, 2], { color: DIM, vAlign: "bottom" });
    // The list sits centred in the space between the title block and the caption line.
    const free0 = b.rect.y + b.rect.h + gutter / 2,`,
`    const bP = bylineFit(w, panel.h * 0.12, S * 0.036);
    const by = t.rect.y + t.rect.h + Math.round(S * 0.008);
    byline(bP, x, by, w);
    const mP = metaFit(w, panel.h * 0.1, S * 0.028);
    const metaH = mP.height;
    meta(mP, x, panel.y + panel.h - metaH, w);
    // The list sits centred in the space between the title block and the caption line.
    const free0 = by + bP.height + gutter / 2,`);

// portrait
rep(`    const bf = fit(\`by \${p.author}\`, w, headH * 0.3, S * 0.04, floorPx, [1, 2], false);
    const gap = Math.round(S * 0.012);
    const headUsed = blockH(tf.px, tf.lines.length) + gap + blockH(bf.px, bf.lines.length);`,
`    const bP = bylineFit(w, headH * 0.3, S * 0.04);
    const gap = Math.round(S * 0.012);
    const headUsed = blockH(tf.px, tf.lines.length) + gap + bP.height;`);
rep(`    place("byline", \`by \${p.author}\`, x, t.rect.y + t.rect.h + gap, w, headH * 0.3, S * 0.04, floorPx, [1, 2], { color: DIM });`,
`    byline(bP, x, t.rect.y + t.rect.h + gap, w);`);
rep(`    const metaF = fit(p.meta, w, (footB - footY) * 0.2, S * 0.032, floorPx, [1, 2], false);
    const metaH = blockH(metaF.px, metaF.lines.length);
    place("meta", p.meta, x, footB - metaH, w, metaH, S * 0.032, floorPx, [1, 2], { color: DIM });`,
`    const mP = metaFit(w, (footB - footY) * 0.2, S * 0.032);
    const metaH = mP.height;
    meta(mP, x, footB - metaH, w);`);

// square
rep(`    const metaF = fit(p.meta, leftW, panel.h * 0.3, S * 0.022, floorPx, [1, 2], false);
    const metaH = blockH(metaF.px, metaF.lines.length);
    const bf = fit(\`by \${p.author}\`, leftW, panel.h * 0.3, S * 0.028, floorPx, [1, 2], false);
    const bylineH = blockH(bf.px, bf.lines.length);`,
`    const mP = metaFit(leftW, panel.h * 0.3, S * 0.022);
    const metaH = mP.height;
    const bP = bylineFit(leftW, panel.h * 0.3, S * 0.028);
    const bylineH = bP.height;`);
rep(`    place("byline", \`by \${p.author}\`, x, t.rect.y + t.rect.h + gap, leftW, bylineH, S * 0.028, floorPx, [1, 2], { color: DIM, vAlign: "top" });`,
`    byline(bP, x, t.rect.y + t.rect.h + gap, leftW);`);
rep(`    place("meta", p.meta, x, panel.y + panel.h - metaH, leftW, metaH, S * 0.022, floorPx, [1, 2], { color: DIM, vAlign: "bottom" });`,
`    meta(mP, x, panel.y + panel.h - metaH, leftW);`);
fs.writeFileSync(f, s);
console.log("ok");
