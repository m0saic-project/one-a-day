const path = require("path");
const M = require(path.resolve("dist/dev/bench-delta/v1/bench-delta.js"));
const { layoutBenchDelta, verdictOf, verdictText, fmtRatio } = M;

const OPTS = (o = {}) => ({
  title: "v1.5 vs v1.4",
  subtitle: "best of 10 runs - 8-core M4 Pro - cold caches",
  baselineLabel: "v1.4",
  candidateLabel: "v1.5",
  smallerIsBetter: true,
  ...o,
});

const CANVASES = [[1600, 900], [1920, 1080], [1080, 1920], [1080, 1080], [640, 360], [480, 270]];

function audit(name, rows, opts = {}, canvases = CANVASES) {
  const out = [];
  for (const [W, H] of canvases) {
    const L = layoutBenchDelta(rows, OPTS(opts), W, H);
    for (let i = 0; i < L.rows.length; i++) {
      const r = L.rows[i];
      const truth = r.row.value / r.row.base;
      const drawn = r.candBar.w / r.baseBar.w;
      const err = truth === 0 ? (drawn === 0 ? 0 : Infinity) : (drawn - truth) / truth;
      out.push({
        case: name, W, H, i, row: r.row.name,
        base: r.row.base, value: r.row.value,
        baseW: r.baseBar.w, candW: r.candBar.w,
        truth: +truth.toFixed(6), drawn: +drawn.toFixed(6),
        errPct: Number.isFinite(err) ? +(err * 100).toFixed(2) : err,
        verdict: verdictText(r.verdict),
        trackW: L.trackW, ref: L.ref,
        clampedBar: r.candBar.x + r.candBar.w >= L.trackX + L.trackW,
        footer: L.footer.text,
      });
    }
  }
  return out;
}

function show(rows, filter = () => true) {
  const bad = rows.filter(filter);
  for (const r of bad) {
    console.log(
      `${r.case} ${r.W}x${r.H} row${r.i} "${r.row}" base=${r.base} value=${r.value} | ` +
      `bars ${r.candW}/${r.baseW}=${r.drawn} truth=${r.truth} ERR=${r.errPct}% | ${r.verdict}` +
      (r.clampedBar ? " [CLAMPED]" : "")
    );
  }
  if (!bad.length) console.log("  (none)");
}

module.exports = { audit, show, OPTS, CANVASES, M };
if (require.main === module) {
  const which = process.argv[2];
  require(path.resolve("journal/2026-09-21/logs/attack-make-it-lie/" + which + ".js"));
}
