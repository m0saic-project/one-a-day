// revise — the critic's NO SHIP is a review, not the end of the day.
//
// Day 013 (2026-10-02): the build left out the one thing the brief was about
// (the delta bars), the critic said so and named "the one thing that would
// change the verdict", and the runner closed the day as a no-ship 22 minutes
// into a 270-minute day - the fix written down, and nobody called to make it.
// Now a rejected day goes back to the builder with the verdict, and the
// critic judges the result again: at most `revise.maxRounds` rounds a run.
//
//   state.json            revision: n    the round that is open; the build and
//                                        critique prompts read it (run.mjs)
//                         revisions: [{ round, at, rejected, verdict }]
//   40-critique.r<n>.md   the verdict round n answers; the live 40-critique.md
//                         is always the last one
//   rejected/tree.patch   the tree of a day that ENDED rejected, so
//                         `node pipeline/run.mjs --from revise` can take it up
import fs from "node:fs";
import path from "node:path";
import { patchState, readState } from "./journal.mjs";

export function reviseConfig(config) {
  const n = Number(config?.revise?.maxRounds);
  return { maxRounds: Number.isFinite(n) && n > 0 ? Math.floor(n) : 0 };
}

/** The round that is open on this day; 0 is the first pass. */
export function revisionOf(state) {
  const n = Number(state?.revision);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

/** The name the verdict that opened round n is kept under. */
export function verdictFile(n) { return `40-critique.r${n}.md`; }

/** The variants the day built: what state.json lists, else the folders that hold a source snapshot. */
export function variantsOf(dayDir, state = readState(dayDir)) {
  if (Array.isArray(state?.variants) && state.variants.length) return state.variants.map(String);
  try { return fs.readdirSync(path.join(dayDir, "variants")).filter((v) => fs.existsSync(path.join(dayDir, "variants", v, "src"))).sort(); }
  catch { return []; }
}

/**
 * Did the CRITIC reject work that exists? Only that is worth another round.
 * A build that left no variant, a phase that ran out of calls and a day the
 * session limit ended are not reviews, and none of them sets `critique`.
 */
export function rejectedByCritic(dayDir) {
  const st = readState(dayDir);
  return st.critique === "done" && st.decision === "no-ship" && variantsOf(dayDir, st).length > 0;
}

/**
 * Open the next round: the verdict moves aside under its round's name, and
 * build and critique are owed again. Everything else in state.json stays -
 * the scaffold, the variants, the brief are the same day's.
 */
export function openRevision(dayDir, now = new Date()) {
  const st = readState(dayDir);
  const round = revisionOf(st) + 1;
  const verdict = verdictFile(round);
  const live = path.join(dayDir, "40-critique.md");
  if (fs.existsSync(live)) fs.renameSync(live, path.join(dayDir, verdict));
  const rejected = st.noShipReason ?? null;
  patchState(dayDir, {
    revision: round,
    revisions: [...(Array.isArray(st.revisions) ? st.revisions : []), { round, at: now.toISOString(), rejected, verdict }],
    build: undefined, critique: undefined, decision: undefined, pick: undefined, noShipReason: undefined,
  });
  return { round, verdict, rejected };
}
