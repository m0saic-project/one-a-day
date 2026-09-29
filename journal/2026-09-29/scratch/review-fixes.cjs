// Review fixes after build call 4's review (tiny-canvas crash, themeless layout, contrast guard,
// empty-numbering constraint, teaser caption re-fit).
const fs = require("fs");
const f = "src/gaming/crossword-grid-card/v1/crossword-grid-card.ts";
let s = fs.readFileSync(f, "utf8");
const rep = (a, b) => { if (!s.includes(a)) { console.error("MISSING", a.slice(0, 100)); process.exit(1); } s = s.replace(a, b); };

// 1. The theme list never runs off its band: when it cannot fit even at 6 px it is dropped (the tint still marks the entries).
rep(`    const hp = headPx(px), pitch = pitchOf(px);
    const total = blockH(hp, 1) + Math.round(px * 0.35) + perCol * pitch;
    if (dryRun) return total;`,
`    const hp = headPx(px), pitch = pitchOf(px);
    const total = blockH(hp, 1) + Math.round(px * 0.35) + perCol * pitch;
    // Too small a canvas for the list even at 6 px: drop it (the tint still marks the entries) rather than overflow.
    if (total > h) return 0;
    if (dryRun) return total;`);

// 2a. Landscape: a themeless puzzle has no list to spread the column, so the title block centres above the caption line.
rep(`    const t = place("title", p.title, x, panel.y, w, panel.h * 0.3, S * 0.075, titleFloor, [2], { bold: true, vAlign: "top", bind: "title" });
    const bP = bylineFit(w, panel.h * 0.12, S * 0.036);
    const by = t.rect.y + t.rect.h + Math.round(S * 0.008);
    byline(bP, x, by, w);
    const mP = metaFit(w, panel.h * 0.1, S * 0.028);
    const metaH = mP.height;`,
`    const tf = fit(p.title, w, panel.h * 0.3, S * 0.075, titleFloor, [2], true);
    const bP = bylineFit(w, panel.h * 0.12, S * 0.036);
    const mP = metaFit(w, panel.h * 0.1, S * 0.028);
    const metaH = mP.height;
    // No theme list (the PROP is empty, not merely hidden): the title block centres in the space above the caption line.
    const groupH = blockH(tf.px, tf.lines.length) + Math.round(S * 0.008) + bP.height;
    const ty = p.themes.length > 0 ? panel.y : panel.y + Math.max(0, (panel.h - metaH - gutter / 2 - groupH) / 2);
    const t = place("title", p.title, x, ty, w, panel.h * 0.3, S * 0.075, titleFloor, [2], { bold: true, vAlign: "top", bind: "title" });
    const by = t.rect.y + t.rect.h + Math.round(S * 0.008);
    byline(bP, x, by, w);`);

// 2b. Portrait: a themeless puzzle splits the space evenly around the board, the caption line centred in its band.
rep(`    const headH = Math.round(rest * 0.36);`, `    const headH = Math.round(rest * (p.themes.length > 0 ? 0.36 : 0.5));`);
rep(`    meta(mP, x, footB - metaH);
    const free1 = footB - metaH - gutter / 2;`,
`    meta(mP, x, p.themes.length > 0 ? footB - metaH : footY + Math.max(0, (footB - footY - metaH) / 2));
    const free1 = footB - metaH - gutter / 2;`);

// 3. Contrast guard: letters, numbers and rings stay in ink over the theme fill.
rep(`  if (typeof p.themeColor !== "string" || !HEX.test(p.themeColor)) fail("themeColor", \`\${JSON.stringify(p.themeColor)} must be #rrggbb.\`);`,
`  if (typeof p.themeColor !== "string" || !HEX.test(p.themeColor)) fail("themeColor", \`\${JSON.stringify(p.themeColor)} must be #rrggbb.\`);
  const inkOnTheme = contrast(INK, p.themeColor);
  if (inkOnTheme < 4.5) fail("themeColor", \`\${p.themeColor} is too dark for the ink letters over it (\${inkOnTheme.toFixed(1)}:1, needs 4.5:1); pick a lighter highlighter colour.\`);`);
rep(`const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];`,
`/** WCAG contrast ratio of two #rrggbb colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];`);

// 4. No numbering (a grid with no entry): no cell-number constraint for a source that is never drawn.
rep(`  if (B.numberPx > 0) {
    const widest = String(Math.max(...p.numbers.values()));`,
`  if (B.numberPx > 0 && p.numbers.size > 0) {
    const widest = String(Math.max(...p.numbers.values()));`);

// 5. The caption line fits on its widest form ("solution"), so the teaser draws "puzzle" at the same size and place.
rep(`      const date = stacked ? p.metaDate : \`| \${p.metaDate}\`, tail = \`| \${p.metaTail}\`;
      const pubW = widthOf(p.publication, px, true), dateW = widthOf(date, px), tailW = widthOf(tail, px);`,
`      const date = stacked ? p.metaDate : \`| \${p.metaDate}\`, tail = \`| \${p.metaTail}\`;
      const pubW = widthOf(p.publication, px, true), dateW = widthOf(date, px), tailW = widthOf(tail, px);
      // Fit on the solved card's tail so the teaser's shorter "puzzle" lands at the same size and place.
      const fitW = Math.max(tailW, widthOf(\`| \${p.pz.cols}x\${p.pz.rows} | solution\`, px));`);
rep(`      if (!force && (pubW > budget(w) || w - x2 < 2 * px || tailW > budget(w - x2) || height > maxH)) return null;`,
    `      if (!force && (pubW > budget(w) || w - x2 < 2 * px || fitW > budget(w - x2) || height > maxH)) return null;`);

fs.writeFileSync(f, s);
console.log("ok");
