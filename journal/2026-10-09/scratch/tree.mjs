import { parseM0StringToLogicalFrames, validateM0String, computeFeasibility } from "@m0saic/dsl";
// P(n, gen): gen 1..5; columns remaining = 6 - gen
function P(gen) {
  const cols = 6 - gen;
  if (cols === 1) return "1";
  const zeros = Array(cols - 2).fill("0");
  return `${cols}(1,${zeros.length ? zeros.join(",") + "," : ""}2[${P(gen + 1)},${P(gen + 1)}])`;
}
const m0 = P(1);
console.log(m0, m0.length);
console.log(JSON.stringify(validateM0String(m0)));
console.log(JSON.stringify(computeFeasibility(m0)));
// pre-order Ahnentafel
const order = [];
(function walk(n, g) { order.push(n); if (g < 5) { walk(2 * n, g + 1); walk(2 * n + 1, g + 1); } })(1, 1);
for (const [w, h] of [[1824, 800], [456, 199], [480, 200]]) {
  const fr = parseM0StringToLogicalFrames(m0, w, h);
  const rects = {};
  fr.forEach((f, i) => { rects[order[i]] = f; });
  console.log(w, h, fr.length, JSON.stringify(Object.keys(fr[0])), JSON.stringify(fr[0].meta));
  let ok = true;
  for (let n = 1; n <= 15; n++) {
    const a = rects[n], f = rects[2 * n], m = rects[2 * n + 1];
    if (a.y !== f.y || a.y + a.height !== m.y + m.height || f.y + f.height !== m.y) ok = false;
  }
  const hs = [1,2,4,8,16].map(s => Array.from({length:s},(_,i)=>rects[s+i].height));
  const ws = [1,2,4,8,16].map(s => rects[s].width);
  console.log("tree exact:", ok, "heights", JSON.stringify(hs), "widths", JSON.stringify(ws));
}
