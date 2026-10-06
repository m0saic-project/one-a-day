const M = require("../../../../dist/community/weekly-run-report/v1/weekly-run-report.js");
const assert = require("assert");
const LONG = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 15xV25, 13xV50, 2xV100, 1xV250".split(", ");
let calls = 0;
const tryS = (props, W, H) => { calls++; try { const r = M.settleLayout(props, W, H); return r; } catch (e) { return { err: e.message }; } };
console.log("== long captions on thumbnails ==");
for (const [W,H,ns] of [[480,270,[7]],[640,274,[7,8,9]]]) for (const n of ns) {
  const r = tryS({ milestones: LONG.slice(0,n).join(", ") }, W, H);
  console.log(`${W}x${H} long n=${n}:`, r.err ? "REFUSED " + r.err.split(": ").slice(1).join(": ") : `ok badgePx=${r.L.badgePx} captionPx=${r.L.captionPx} small=${r.L.small}`);
}
console.log("\n== item 2: counts as JSON string ==");
const obj = { finishers: 150, newPbs: 20, firstTimers: 11, visitors: 9, volunteers: 25, firstTimeVolunteers: 3 };
const a = M.normalizeWeeklyRunReport({ counts: obj });
const b = M.normalizeWeeklyRunReport({ counts: JSON.stringify(obj) });
try { assert.deepStrictEqual(b, a); console.log("normalize string == object: EQUAL"); } catch (e) { console.log("normalize DIFFER", e.message); }
const b2 = M.normalizeWeeklyRunReport({ counts: JSON.stringify(obj, null, 2) });
try { assert.deepStrictEqual(b2, a); console.log("normalize pretty-printed string == object: EQUAL"); } catch (e) { console.log("pretty DIFFER", e.message); }
const sa = tryS({ counts: obj }, 1080, 1080), sb = tryS({ counts: JSON.stringify(obj) }, 1080, 1080);
try { assert.deepStrictEqual(sb, sa); console.log("settleLayout 1080x1080 string == object: EQUAL"); } catch (e) { console.log("settle DIFFER", e.message.slice(0,300)); }
const bad = ['{finishers: 214', '{"finishers":214,', '', 'not json', 'null', '[1,2,3]', '"hello"', '42', '{"finishers":214,"newPbs":38,"firstTimers":27,"visitors":19,"volunteers":31}', '{"finishers":214,"newPbs":38,"firstTimers":27,"visitors":19,"volunteers":31,"firstTimeVolunteers":4,"dnf":1}', '{"finishers":214,"newPbs":"38","firstTimers":27,"visitors":19,"volunteers":31,"firstTimeVolunteers":4}'];
for (const s of bad) { try { M.normalizeWeeklyRunReport({ counts: s }); console.log(`ACCEPTED ${JSON.stringify(s)}`); } catch (e) { const msg = e.message.replace(/^@one-a-day\/community\/weekly-run-report\/v1: /, ""); console.log(`refused ${JSON.stringify(s).padEnd(30).slice(0,60)} -> names counts: ${/^counts/.test(msg)} | ${msg}`); } }
console.log("settleLayout calls:", calls);
