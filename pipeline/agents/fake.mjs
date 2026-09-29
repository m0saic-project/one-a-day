// fake — a test double that performs a canned day with no model at all.
// It does what a well-behaved agent would: scaffolds one template with
// `npm run new`, writes every journal file, marks each phase done. Used by
// pipeline/lib/*.test.mjs and by `node pipeline/run.mjs --agent fake --no-push`
// to exercise the runner and the gate end to end.
import fs from "node:fs";
import path from "node:path";
import { runProcess } from "../lib/spawn.mjs";
import { patchRun, patchState, readState } from "../lib/journal.mjs";
import { createTraceRecorder } from "../lib/trace.mjs";

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
  // A canned trace, so the day's WHY.timeline has runner numbers like a real day.
  const startedAt = Date.now();
  const m = /^(.*?)-(\d+)$/.exec(label);
  const trace = createTraceRecorder({ phase: m ? m[1] : label, call: m ? Number(m[2]) : 1, startedAt });
  trace.onLine(JSON.stringify({ type: "assistant", message: { usage: { input_tokens: 1200, output_tokens: 300 }, content: [{ type: "tool_use", id: `${label}-1`, name: "Bash", input: { command: `fake ${phase}` } }] } }));
  trace.onLine(JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: `${label}-1` }] } }));
  trace.onLine(JSON.stringify({ type: "result", total_cost_usd: 0.01, num_turns: 1 }));
  if (phase === "scout") {
    w("10-scout.md", `# Scout — ${date}\n\nCandidate: a fake use case (test double).\n\nSources: none.\n\nPick: fake.\n`);
    // `who` + one source: the scaffold pre-fills the WHY spec from these, and the
    // why-tutorial gate refuses a placeholder - a fake day must still explain itself.
    patchState(dayDir, { scout: "done", useCase: "fake use case", who: "fake people, found nowhere", sources: ["https://example.com/fake-use-case"], tags: ["fake"] });
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
      // The account's session limit cutting the first build call, the way
      // Claude Code reports it: the work is in the tree, the phase is not done,
      // and the call ends with a rejection naming the window and its reset.
      // five_hour resets in a second (the runner waits it out); seven_day
      // resets in six days (the runner ends the day with the tree kept).
      const cut = process.env.ONE_A_DAY_FAKE_LIMIT;
      if (cut && label === "build-1") {
        w("30-build.md", `# Build — ${date}\n\n(in progress - call 1)\n\nScaffolded; the session limit cut this call (fake).\n`);
        const resetsAt = new Date(Date.now() + (cut === "seven_day" ? 6 * 86_400_000 : 1000)).toISOString();
        const windows = { five_hour: { utilization: cut === "five_hour" ? 1.01 : 0.4, resetsAt }, seven_day: { utilization: cut === "seven_day" ? 1.0 : 0.05, resetsAt } };
        fs.appendFileSync(log, `[fake] session limit (${cut}) — rejected\n`);
        return { exitCode: 1, timedOut: false, ms: Date.now() - startedAt, transcript: null, log, trace: trace.finish({ exitCode: 1 }), limit: { seen: true, hit: true, window: cut, resetsAt, status: "rejected", windows, message: "You've hit your session limit (fake)" } };
      }
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
  return { exitCode: 0, timedOut: false, ms: Date.now() - startedAt, transcript: null, log, trace: trace.finish({ exitCode: 0 }) };
}
