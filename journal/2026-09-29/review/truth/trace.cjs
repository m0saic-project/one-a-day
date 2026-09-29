// Walk build-4.jsonl: print Bash tool calls whose command matches a pattern, with a result excerpt.
const fs = require("fs");
const pat = new RegExp(process.argv[2]);
const resPat = process.argv[3] ? new RegExp(process.argv[3]) : null;
const lines = fs.readFileSync(__dirname + "/../../logs/build-4.jsonl", "utf8").split("\n").filter(Boolean);
const uses = new Map();
let n = 0;
for (const l of lines) {
  let e; try { e = JSON.parse(l); } catch { continue; }
  n++;
  const c = e.message && e.message.content;
  if (!Array.isArray(c)) continue;
  for (const b of c) {
    if (b.type === "tool_use") uses.set(b.id, { n, input: b.input });
    if (b.type === "tool_result") {
      const u = uses.get(b.tool_use_id);
      if (!u) continue;
      const cmd = JSON.stringify(u.input);
      if (!pat.test(cmd)) continue;
      const out = typeof b.content === "string" ? b.content : JSON.stringify(b.content);
      if (resPat && !resPat.test(out)) continue;
      console.log(`#${u.n} ${e.timestamp || ""} CMD: ${cmd.slice(0, 500)}`);
      console.log(`   OUT: ${out.replace(/\u001b\[[0-9;]*m/g, "").slice(0, 1500)}`);
    }
  }
}
