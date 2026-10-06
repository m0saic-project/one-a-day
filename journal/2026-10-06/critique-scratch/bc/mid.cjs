const path = require("path");
const TEN = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250".split(", ");
const v = process.argv[2]; {
  const m = require(path.join(__dirname, v, "wrr.js"));
  const out = [];
  for (const [w, h] of [[1000, 800], [1200, 900], [1290, 1000], [1440, 900], [1024, 768], [1600, 900], [960, 540], [1366, 768], [1080, 1350], [1200, 628], [1200, 1200]]) {
    const bad = [];
    for (let n = 6; n <= 10; n++) { try { m.settleLayout({ milestones: TEN.slice(0, n).join(", ") }, w, h); } catch (e) { bad.push(n); } }
    out.push(`${w}x${h}:${bad.length ? "REFUSES " + bad.join(",") : "ok"}`);
  }
  console.log(v, out.join("  "));
}
