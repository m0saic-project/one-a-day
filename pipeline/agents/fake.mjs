// fake — a test double that performs a canned day with no model at all.
// It does what a well-behaved agent would: scaffolds one template with
// `npm run new`, writes every journal file, marks each phase done. Used by
// pipeline/lib/*.test.mjs and by `node pipeline/run.mjs --agent fake --no-push`
// to exercise the runner and the gate end to end.
import fs from "node:fs";
import path from "node:path";
import { runProcess } from "../lib/spawn.mjs";
import { patchRun, patchState, readState } from "../lib/journal.mjs";

export async function available() { return true; }

export async function run({ prompt, cwd, logDir, label, env = {} }) {
  const phase = label.replace(/-\d+$/, "");
  const dayDir = env.ONE_A_DAY_DAY_DIR;
  const date = env.ONE_A_DAY_DATE;
  const log = path.join(logDir, `${label}.log`);
  const w = (rel, text) => fs.writeFileSync(path.join(dayDir, rel), text);
  const slug = (process.env.ONE_A_DAY_FAKE_SLUG ?? `fake-${date.replace(/-/g, "")}`);
  const pack = process.env.ONE_A_DAY_FAKE_PACK ?? "dev";
  const sh = (cmd, args) => runProcess({ cmd, args, cwd, env, timeoutMs: 10 * 60 * 1000, logFile: log });
  fs.appendFileSync(log, `[fake] phase ${phase}\n`);
  if (phase === "scout") {
    w("10-scout.md", `# Scout — ${date}\n\nCandidate: a fake use case (test double).\n\nSources: none.\n\nPick: fake.\n`);
    patchState(dayDir, { scout: "done", useCase: "fake use case", sources: [], tags: ["fake"] });
    patchRun(dayDir, { model: { selfDeclared: "fake-model" } });
  } else if (phase === "plan") {
    w("20-brief.md", `# Brief — ${date}\n\nPack: ${pack}. Slug: ${slug}. A static card. Canvas 1280x720.\n`);
    patchState(dayDir, { plan: "done", pack, slug });
  } else if (phase === "build") {
    if (process.env.ONE_A_DAY_FAKE_BUILD === "skip") { w("30-build.md", "# Build\n\nnothing built (fake)\n"); patchState(dayDir, { build: "done" }); }
    else {
      const r = await sh("node", ["tools/new-template.mjs", `${pack}/${slug}`, "--title", `Fake ${date}`]);
      if (process.env.ONE_A_DAY_FAKE_OUT_OF_SCOPE) fs.writeFileSync(path.join(cwd, "AGENTS.md"), fs.readFileSync(path.join(cwd, "AGENTS.md"), "utf8") + "\n<!-- tampered -->\n");
      await sh("npm", ["run", "build"]);
      await sh("npm", ["run", "fingerprints:update"]);
      w("30-build.md", `# Build — ${date}\n\nVariant a: scaffold as generated (exit ${r.exitCode}).\n`);
      patchState(dayDir, { build: "done", variants: ["a"] });
    }
  } else if (phase === "critique") {
    const decision = process.env.ONE_A_DAY_FAKE_DECISION ?? "ship";
    w("40-critique.md", `# Critique — ${date}\n\nDecision: ${decision}.\n`);
    patchState(dayDir, { critique: "done", decision, pick: "a", ...(decision === "no-ship" ? { noShipReason: "fake said no" } : {}) });
  } else if (phase === "ship") {
    await sh("npm", ["run", "build"]);
    await sh("node", ["tools/gen-previews.mjs"]);
    await sh("npm", ["run", "build"]);
    await sh("npm", ["run", "fingerprints:update"]);
    const st = readState(dayDir);
    w("50-ship.md", `# Ship — ${date}\n\nShipped @one-a-day/${st.pack}/${st.slug}/v1 (fake).\n`);
    patchState(dayDir, { ship: "done" });
  }
  return { exitCode: 0, timedOut: false, ms: 1, transcript: null, log };
}
