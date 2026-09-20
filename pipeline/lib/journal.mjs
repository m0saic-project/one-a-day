// journal — the day folder is the only memory shared between agent calls,
// the runner and the humans who read the repo. Everything here is plain JSON
// or Markdown on disk; nothing lives in process memory across phases.
import fs from "node:fs";
import path from "node:path";

export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isIsoDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s)); }

export function journalRoot(repo) { return path.join(repo, "journal"); }
export function dayDir(repo, date) { return path.join(journalRoot(repo), date); }
export function indexPath(repo) { return path.join(journalRoot(repo), "index.json"); }

export function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
export function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

/** Create journal/<date>/ (+ logs/, variants/) if missing. */
export function ensureDay(repo, date) {
  const dir = dayDir(repo, date);
  const created = !fs.existsSync(dir);
  for (const sub of ["", "logs", "variants"]) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  return { dir, created };
}

/* ── state.json: the phase ledger the agent and the runner both write ── */

export function statePath(dir) { return path.join(dir, "state.json"); }
export function readState(dir) { return readJson(statePath(dir), {}); }
export function patchState(dir, patch) {
  const next = { ...readState(dir), ...patch };
  writeJson(statePath(dir), next);
  return next;
}

/* ── run.json: who ran, what model answered, how each phase went ── */

export function runPath(dir) { return path.join(dir, "run.json"); }
export function readRun(dir) { return readJson(runPath(dir), {}); }
/** One-level-deep merge: `phases` and `model` and `runner` merge by key; everything else replaces. */
export function patchRun(dir, patch) {
  const cur = readRun(dir);
  const next = { ...cur };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && cur[k] && typeof cur[k] === "object" && !Array.isArray(cur[k])) next[k] = { ...cur[k], ...v };
    else next[k] = v;
  }
  writeJson(runPath(dir), next);
  return next;
}

/* ── index.json: one row per day, the machine-readable table of contents ── */

export function readIndex(repo) {
  const v = readJson(indexPath(repo), []);
  return Array.isArray(v) ? v : [];
}
export function upsertIndex(repo, row) {
  const rows = readIndex(repo).filter((r) => r.date !== row.date);
  rows.push(row);
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  writeJson(indexPath(repo), rows);
  return rows;
}
/** Day number = position in the index (1-based); today gets rows-before-it + 1. */
export function dayNumber(repo, date) {
  const rows = readIndex(repo);
  const existing = rows.find((r) => r.date === date);
  if (existing && existing.day) return existing.day;
  return rows.filter((r) => r.date < date).length + 1;
}

/* ── prompts ── */

export function renderTemplate(text, vars) {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
