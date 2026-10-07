// record-dir - which journal folder holds a template's record.
//
// A day's template (v1) is recorded in journal/<date>/: the runner's run.json
// (who ran, which model), trace.json (the timeline), the scout and the ship
// note. A FOUNDER-DIRECTED follow-up - a vN (N >= 2) of that day's template,
// made when a day's idea deserved a stronger build - keeps its own record
// beside it in journal/<date>/vN/, with the same file names. The day number
// and the date stay the day's (it is that day's idea); who made it, the
// model and the timeline come from the follow-up's own folder.
//
//   recordDirFor(root, "@one-a-day/sports/chess-game-recap/v2", "2026-10-07")
//     -> { dir: "<root>/journal/2026-10-07/v2", rel: "journal/2026-10-07/v2", followUp: true }
import fs from "node:fs";
import path from "node:path";

export function recordDirFor(root, id, date) {
  const day = path.join(root, "journal", date);
  const v = /\/v(\d+)$/.exec(String(id));
  const n = v ? Number(v[1]) : 1;
  if (n >= 2) {
    const own = path.join(day, `v${n}`);
    if (fs.existsSync(path.join(own, "run.json"))) return { dir: own, rel: `journal/${date}/v${n}`, followUp: true };
  }
  return { dir: day, rel: `journal/${date}`, followUp: false };
}
