const m = require("../../../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
const cases = [["themeless", { themeEntries: "" }], ["teaser", { solved: false }], ["default", {}]];
for (const [W, H] of [[1920, 1080], [1200, 630], [1080, 1920], [1080, 1350], [1080, 1080]]) {
  for (const [name, props] of cases) {
    const p = m.normalizeCrossword(props);
    const L = m.layoutCrosswordCard(p, W, H);
    const byY = (l) => L.texts.filter((t) => t.label.startsWith(l));
    const top = L.texts.filter((t) => /^(title|byline)/.test(t.label));
    const metaT = L.texts.filter((t) => t.label.startsWith("meta"));
    const list = L.texts.filter((t) => t.label.startsWith("theme"));
    const bb = L.board.ink;
    let gap;
    if (L.mode === "landscape") {
      const a = Math.max(...top.map((t) => t.rect.y + t.rect.h)), b = Math.min(...metaT.map((t) => t.rect.y));
      // largest gap among text in the panel
      const ys = L.texts.map((t) => [t.rect.y, t.rect.y + t.rect.h]).sort((u, v) => u[0] - v[0]);
      let maxGap = 0, end = ys[0][1];
      for (const [s, e] of ys.slice(1)) { if (s > end) maxGap = Math.max(maxGap, s - end); end = Math.max(end, e); }
      gap = `byline-bottom->meta-top ${Math.round(b - a)} px (${(100 * (b - a) / H).toFixed(0)}% H); largest text-free band ${Math.round(maxGap)} px (${(100 * maxGap / H).toFixed(0)}% H)`;
    } else if (L.mode === "portrait") {
      const hb = Math.max(...top.map((t) => t.rect.y + t.rect.h));
      const b = Math.min(...metaT.map((t) => t.rect.y));
      const underBoard = list.length ? Math.min(...list.map((t) => t.rect.y)) - (bb.y + bb.h) : b - (bb.y + bb.h);
      gap = `header-bottom->board ${Math.round(bb.y - hb)} px; board-bottom->next text ${Math.round(underBoard)} px (${(100 * underBoard / H).toFixed(0)}% H); board-bottom->meta ${Math.round(b - (bb.y + bb.h))} px`;
    } else gap = "square";
    console.log(`${W}x${H} ${L.mode} ${name.padEnd(9)} board y=${bb.y} h=${bb.h} | ${gap} | list lines ${list.length}`);
  }
}
