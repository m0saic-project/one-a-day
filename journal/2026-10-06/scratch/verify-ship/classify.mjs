// READ-ONLY gate simulation: imports only classifyChanges + porcelain.
import { classifyChanges, porcelain } from "file:///C:/src/m0saic-production/one-a-day/pipeline/lib/git.mjs";
const REPO = "C:/src/m0saic-production/one-a-day";
const entries = porcelain(REPO);
const c = classifyChanges(entries, { date: "2026-10-06" });
const summary = {
  entryCount: entries.length,
  forbidden: c.forbidden,
  scratch: c.scratch,
  newTemplateDirs: c.newTemplateDirs,
  touchedAssetDirs: c.touchedAssetDirs,
  allowedCount: c.allowed.length,
  allowedNonJournal: c.allowed.filter((e) => !e.path.startsWith("journal/")).map((e) => `${e.status} ${e.path}`),
  allowedJournalCount: c.allowed.filter((e) => e.path.startsWith("journal/")).length,
  allowedJournalOutsideDay: c.allowed.filter((e) => e.path.startsWith("journal/") && !e.path.startsWith("journal/2026-10-06/")).map((e) => e.path),
};
console.log(JSON.stringify(summary, null, 2));
