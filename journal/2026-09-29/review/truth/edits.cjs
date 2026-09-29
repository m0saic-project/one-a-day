// List tool calls (Edit/Write/Bash touching crossword-grid-card.ts) between two line indexes of build-4.jsonl.
const fs = require("fs");
const [from, to] = process.argv.slice(2).map(Number);
const lines = fs.readFileSync(__dirname + "/../../logs/build-4.jsonl", "utf8").split("\n").filter(Boolean);
let n = 0;
for (const l of lines) {
  let e; try { e = JSON.parse(l); } catch { continue; }
  n++;
  if (n < from || n > to) continue;
  const c = e.message && e.message.content;
  if (!Array.isArray(c)) continue;
  for (const b of c) {
    if (b.type === "tool_use") {
      const s = JSON.stringify(b.input);
      console.log(`#${n} ${e.timestamp || ""} ${b.name}: ${s.slice(0, 700)}`);
    }
    if (b.type === "text" && b.text) console.log(`#${n} TEXT: ${b.text.slice(0, 300)}`);
  }
}
