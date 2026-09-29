// Size ladder scan: every n x n and some non-square grids at every contract canvas + hint.
const path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CONTRACT_CANVASES } = require(path.join(root, "dist/_shared/layout.js"));
const { widthOf } = require(path.join(root, "dist/_shared/text.js"));
const open = (c, r) => Array.from({ length: r }, (_, i) => "ABCDEFGHIJKLMNOPQRSTUVWXY".slice(0, c).split("").map((_, j) => String.fromCharCode(65 + ((i + j) % 26))).join("")).join("/");
const sizes = [];
for (let n = 3; n <= 25; n++) sizes.push([n, n]);
sizes.push([15,16],[16,15],[25,3],[3,25],[21,3],[3,21],[21,5],[5,21],[25,15],[15,25]);
const canv = [[1080,1080], ...CONTRACT_CANVASES];
const issues = [];
for (const [c, r] of sizes) {
  const p = T.normalizeCrossword({ grid: open(c, r), themeEntries: "", circles: "" });
  for (const [w, h] of canv) {
    const L = T.layoutCrosswordCard(p, w, h);
    const B = L.board;
    const hole = B.hole(0);
    const minHoleW = Math.min(...Array.from({ length: c * r }, (_, i) => B.hole(i).w));
    const minHoleH = Math.min(...Array.from({ length: c * r }, (_, i) => B.hole(i).h));
    const wW = widthOf("W", B.letterPx, true);
    const briefFit = minHoleW * 0.94 - 2;
    const longSide = Math.max(c, r);
    const rawLetter = B.pitch * 0.6;
    const n = Math.round(B.pitch * 0.28);
    const tag = `${c}x${r}@${w}x${h}`;
    if (wW > briefFit) issues.push(`${tag}: letter W ${wW.toFixed(2)}px > cell*0.94-2 = ${briefFit.toFixed(2)} (letterPx ${B.letterPx}, pitch ${B.pitch.toFixed(2)}, holeW ${minHoleW})`);
    // letter height vs hole height: cap height 0.711em placed at 0.57 of hole
    const capTop = hole.h * 0.57 - 0.711 * B.letterPx / 2, capBot = hole.h * 0.57 + 0.711 * B.letterPx / 2;
    if (capTop < 0 || capBot > minHoleH) issues.push(`${tag}: letter cap box ${capTop.toFixed(1)}..${capBot.toFixed(1)} outside hole h ${minHoleH}`);
    if (B.letterPx > Math.round(rawLetter) && longSide <= 21) issues.push(`${tag}: letter forced up from ${rawLetter.toFixed(2)} to ${B.letterPx}`);
    if (B.rule < 1) issues.push(`${tag}: rule ${B.rule}`);
    if (B.numberPx > 0 && B.numberPx < 6) issues.push(`${tag}: number ${B.numberPx}`);
    // number glyph vs letter glyph collision (number bottom vs letter cap top)
    if (B.numberPx > 0) {
      const numBot = hole.h * 0.06 + 0.711 * B.numberPx;
      if (numBot > capTop) issues.push(`${tag}: number bottom ${numBot.toFixed(1)} > letter cap top ${capTop.toFixed(1)} (overlap if the number sits over the letter)`);
    }
  }
}
console.log(issues.length ? issues.join("\n") : "no issues");
