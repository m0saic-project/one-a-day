import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";
import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  DEFAULT_SEGMENTS,
  SpeedrunPbRecapV1,
  analyzeRun,
  beatsOf,
  buildModel,
  cleanName,
  clockExpr,
  fmtDelta,
  fmtTime,
  landAt,
  layoutRecap,
  parseLss,
  parseTime,
  thousands,
} from "./speedrun-pb-recap";
import type { Seg, SegmentInput } from "./speedrun-pb-recap";

const ID = "@one-a-day/gaming/speedrun-pb-recap/v1";

const render = (
  props: Parameters<typeof SpeedrunPbRecapV1.render>[0] = {},
  w = 1080,
  h = 1920,
  ctx?: MosaicEngineContext,
) => SpeedrunPbRecapV1.render({ ...SpeedrunPbRecapV1.defaultProps, ...props }, ctx ?? targetCtx(w, h)).then(asDocument);

type Src = { type?: string; editor?: { label?: string }; overlay?: { enable?: string; window?: { startSec?: number; endSec?: number } }; layers?: Array<{ content?: { kind?: string; text?: string }; overlay?: { enable?: string; window?: { startSec?: number; endSec?: number } } }> };
const sourcesOf = (doc: MosaicDocument) => (doc.sources ?? []) as Src[];
const byLabel = (doc: MosaicDocument, label: string) => sourcesOf(doc).filter((s) => s.editor?.label === label);

/** The two gate shapes the template writes, evaluated at clip time t (undefined gate = always on). */
function on(enable: string | undefined, t: number): boolean {
  if (enable === undefined) return true;
  let m = /^lt\(t,([\d.]+)\)\+gte\(t,([\d.]+)\)$/.exec(enable);
  if (m) return t < Number(m[1]) || t >= Number(m[2]);
  m = /^gte\(t,([\d.]+)\)\*lt\(t,([\d.]+)\)$/.exec(enable);
  if (m) return t >= Number(m[1]) && t < Number(m[2]);
  throw new Error(`unexpected gate ${enable}`);
}

const segs = (rows: SegmentInput[]): Seg[] =>
  rows.map((r, i) => ({ name: cleanName(r.name, i), split: parseTime(r.split, "split"), pb: parseTime(r.pb, "pb"), best: parseTime(r.best, "best") }));

/** A LiveSplit file shaped like the real thing: three segments (one subsplit, one section), seven attempts. */
const LSS = `<?xml version="1.0" encoding="UTF-8"?>
<Run version="1.7.0">
  <GameIcon />
  <GameName>Mothlight Keep</GameName>
  <CategoryName>Any% &amp; Glitchless</CategoryName>
  <Metadata><Run id="" /><Platform usesEmulator="False"></Platform><Region></Region><Variables /></Metadata>
  <Offset>00:00:00</Offset>
  <AttemptCount>7</AttemptCount>
  <AttemptHistory>
    <Attempt id="1" started="09/20/2026 18:00:00" isStartedSynced="True" ended="09/20/2026 18:02:00" isEndedSynced="True" />
    <Attempt id="2" started="09/20/2026 18:03:00" isStartedSynced="True" ended="09/20/2026 18:06:11" isEndedSynced="True">
      <RealTime>00:03:10.5000000</RealTime>
    </Attempt>
    <Attempt id="3" started="09/20/2026 18:07:00" isStartedSynced="True" ended="09/20/2026 18:10:06" isEndedSynced="True">
      <RealTime>00:03:05.2500000</RealTime>
    </Attempt>
    <Attempt id="4" started="09/21/2026 18:00:00" isStartedSynced="True" ended="09/21/2026 18:01:00" isEndedSynced="True" />
    <Attempt id="5" started="09/21/2026 18:02:00" isStartedSynced="True" ended="09/21/2026 18:05:08" isEndedSynced="True">
      <RealTime>00:03:08.0000000</RealTime>
    </Attempt>
    <Attempt id="6" started="09/22/2026 18:00:00" isStartedSynced="True" ended="09/22/2026 18:03:00" isEndedSynced="True">
      <RealTime>00:02:59.7500000</RealTime>
    </Attempt>
    <Attempt id="7" started="09/22/2026 18:04:00" isStartedSynced="True" ended="09/22/2026 18:04:30" isEndedSynced="True" />
  </AttemptHistory>
  <Segments>
    <Segment>
      <Name>-Gatehouse</Name>
      <Icon />
      <SplitTimes>
        <SplitTime name="Personal Best">
          <RealTime>00:01:01.5000000</RealTime>
        </SplitTime>
      </SplitTimes>
      <BestSegmentTime>
        <RealTime>00:01:01.5000000</RealTime>
      </BestSegmentTime>
      <SegmentHistory>
        <Time id="1"><RealTime>00:01:05.0000000</RealTime></Time>
        <Time id="2"><RealTime>00:01:04.0000000</RealTime></Time>
        <Time id="3"><RealTime>00:01:02.0000000</RealTime></Time>
        <Time id="5"><RealTime>00:01:03.0000000</RealTime></Time>
        <Time id="6"><RealTime>00:01:01.5000000</RealTime></Time>
      </SegmentHistory>
    </Segment>
    <Segment>
      <Name>{Act 1}Moth Queen</Name>
      <Icon />
      <SplitTimes>
        <SplitTime name="Personal Best">
          <RealTime>00:02:05.0000000</RealTime>
        </SplitTime>
      </SplitTimes>
      <BestSegmentTime>
        <RealTime>00:01:02.2500000</RealTime>
      </BestSegmentTime>
      <SegmentHistory>
        <Time id="2"><RealTime>00:01:04.5000000</RealTime></Time>
        <Time id="3"><RealTime>00:01:00.0000000</RealTime></Time>
        <Time id="5"><RealTime>00:01:02.2500000</RealTime></Time>
        <Time id="6"><RealTime>00:01:03.5000000</RealTime></Time>
      </SegmentHistory>
    </Segment>
    <Segment>
      <Name>Final Ascent</Name>
      <Icon />
      <SplitTimes>
        <SplitTime name="Personal Best">
          <RealTime>00:02:59.7500000</RealTime>
        </SplitTime>
      </SplitTimes>
      <BestSegmentTime>
        <RealTime>00:00:54.7500000</RealTime>
      </BestSegmentTime>
      <SegmentHistory>
        <Time id="2"><RealTime>00:01:02.0000000</RealTime></Time>
        <Time id="3"><RealTime>00:01:03.2500000</RealTime></Time>
        <Time id="5"><RealTime>00:01:02.7500000</RealTime></Time>
        <Time id="6"><RealTime>00:00:54.7500000</RealTime></Time>
      </SegmentHistory>
    </Segment>
  </Segments>
  <AutoSplitterSettings />
</Run>`;

/** Sixteen rows, long names, a run past the hour: the table's worst case. */
const STRESS: SegmentInput[] = Array.from({ length: 16 }, (_, i) => {
  const split = (i + 1) * 290000 + 1000 * i;
  return {
    name: `Segment ${i + 1} - the long corridor under the second clock tower`,
    split: split / 1000,
    pb: (split + 5000 - 800 * i) / 1000,
    best: 280,
  };
});

describe(ID, () => {
  it("binds what it displays - game, category, runner, attempts, the splits, the stamp's accent", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1920, { propsSchema: SpeedrunPbRecapV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const p of ["game", "category", "runner", "attempts", "segments", "accent"]) expect(byProp[p]?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1920 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven canvases - defaults, 16 long rows past the hour, light, removed lines, no comparison, a pasted .lss", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const overs = [
      {},
      { segments: STRESS, game: "The Legend of an Extremely Long Game Title: Director's Cut", category: "All Bosses No Major Glitches Restricted Low%", runner: "@a_runner_with_a_really_long_handle" },
      { graph: "segments" as const, preset: "light" as const, accent: "#ffcc00" },
      { graph: "none" as const, runner: "", category: "", game: "", attempts: 0 },
      { segments: DEFAULT_SEGMENTS.map((s) => ({ name: s.name, split: s.split })) },
      { lss: LSS },
    ];
    for (const over of overs) {
      await sweepLayout((p, ctx) => SpeedrunPbRecapV1.render(p, ctx).then(asDocument), ID, { ...SpeedrunPbRecapV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("times: LiveSplit's formats in, hundredths out", () => {
    expect(parseTime("1:01.73", "t")).toBe(61730);
    expect(parseTime("00:01:23.4560000", "t")).toBe(83456);
    expect(parseTime("83.45", "t")).toBe(83450);
    expect(parseTime(83.45, "t")).toBe(83450);
    expect(parseTime("1:02:03.45", "t")).toBe(3723450);
    expect(parseTime("1.02:03:04.5000000", "t")).toBe((26 * 3600 + 3 * 60 + 4.5) * 1000);
    expect(parseTime("", "t")).toBeNull();
    expect(parseTime("-", "t")).toBeNull();
    expect(() => parseTime("1:2x", "t")).toThrow(/not a time/);
    expect(fmtTime(61730)).toBe("1:01.73");
    expect(fmtTime(42170)).toBe("42.17");
    expect(fmtTime(3723450)).toBe("1:02:03.45");
    expect(fmtTime(1271270)).toBe("21:11.27");
    expect(fmtDelta(-12340)).toBe("-12.34");
    expect(fmtDelta(260)).toBe("+0.26");
    expect(fmtDelta(-62340)).toBe("-1:02.34");
    expect(thousands(1284)).toBe("1,284");
    expect(thousands(1234567)).toBe("1,234,567");
    expect(cleanName("-Gatehouse", 0)).toBe("Gatehouse");
    expect(cleanName("{Act 1}Moth Queen", 0)).toBe("Moth Queen");
    expect(cleanName("", 3)).toBe("Split 4");
  });

  it("the deltas follow LiveSplit's colour rule: gold overrides, then ahead or behind, gaining or losing", () => {
    const rows = analyzeRun(segs(DEFAULT_SEGMENTS.map((s) => ({ ...s }))));
    expect(rows.map((r) => r.delta)).toEqual([-670, 260, -1430, 3220, 990, -1770, -940, -5490, -7980, -12340]);
    expect(rows.map((r) => r.tone)).toEqual(["gold", "behindLose", "gold", "behindLose", "behindGain", "aheadGain", "aheadLose", "gold", "aheadGain", "gold"]);
    const model = buildModel({ game: "g", category: "c", runner: "r", attempts: 1284 }, segs(DEFAULT_SEGMENTS.map((s) => ({ ...s }))));
    expect(model.isPb).toBe(true);
    expect(model.stamp).toBe("NEW PB");
    expect(model.verdict).toBe("PB by 12.34s");
    expect(model.stat).toBe("1,284 attempts - sum of best 20:54.18");
    // A skipped split: no time, no delta, and the next segment spans two, so it cannot be gold.
    const skipped = analyzeRun(segs([{ split: "1:00", pb: "1:01", best: "1:00" }, { split: "", pb: "2:00", best: "0:30" }, { split: "2:40", pb: "3:00", best: "0:10" }]));
    expect(skipped.map((r) => r.delta)).toEqual([-1000, null, -20000]);
    expect(skipped[2].gold).toBe(false);
    // Slower than the PB: a recap, not a stamp.
    const slower = buildModel({ game: "g", category: "", runner: "", attempts: 0 }, segs([{ split: "1:00", pb: "0:58" }, { split: "2:05.12", pb: "2:00" }]));
    expect(slower.isPb).toBe(false);
    expect(slower.stamp).toBe("RUN RECAP");
    expect(slower.verdict).toBe("5.12s off the PB");
    expect(slower.stat).toBe("");
  });

  it("reads a LiveSplit .lss: the PB, the golds, and the previous PB rebuilt from the attempt history", () => {
    const run = parseLss(LSS);
    expect(run.game).toBe("Mothlight Keep");
    expect(run.category).toBe("Any% & Glitchless");
    expect(run.attempts).toBe(7);
    expect(run.pbAttempt).toBe(6);
    expect(run.previousPbAttempt).toBe(3);
    expect(run.segments).toEqual([
      { name: "Gatehouse", split: 61500, pb: 62000, best: 61500 },
      { name: "Moth Queen", split: 125000, pb: 122000, best: 62250 },
      { name: "Final Ascent", split: 179750, pb: 185250, best: 54750 },
    ]);
    const model = buildModel({ game: run.game, category: run.category, runner: "", attempts: run.attempts }, run.segments);
    expect(model.rows.map((r) => r.tone)).toEqual(["gold", "behindLose", "gold"]);
    expect(model.verdict).toBe("PB by 5.50s");
    expect(() => parseLss(LSS, "game")).toThrow(/no Personal Best/);
    expect(() => parseLss("<nope/>")).toThrow(/LiveSplit/);
  });

  it("a pasted .lss wins over the row props and renders its own run", async () => {
    const doc = await render({ lss: LSS });
    const names = [0, 1, 2].map((i) => byLabel(doc, `name-${i}`)[0]?.layers?.[0]?.content?.text);
    expect(names).toEqual(["Gatehouse", "Moth Queen", "Final Ascent"]);
    expect(byLabel(doc, "verdict")[0]?.layers?.[0]?.content?.text).toBe("PB by 5.50s");
    expect(byLabel(doc, "category")[0]?.layers?.[0]?.content?.text).toBe("Any% & Glitchless");
  });

  it("frame 0 is the finished recap, the replay lands each split at its share of the run, and the last frame equals the first", async () => {
    const doc = await render();
    const b = beatsOf(20);
    expect(b).toEqual({ clip: 20, hook: 2.5, replay: 12.5, end: 15 });
    expect(landAt(1271270, 1271270, b)).toBe(15);
    expect(landAt(61730, 1271270, b)).toBeCloseTo(2.5 + (12.5 * 61730) / 1271270, 3);
    const times = byLabel(doc, "times")[0].layers ?? [];
    const deltas = byLabel(doc, "deltas")[0].layers ?? [];
    expect(times).toHaveLength(20);
    expect(deltas).toHaveLength(10);
    const shown = (layers: typeof times, t: number) => layers.filter((l) => on(l.overlay?.enable, t)).map((l) => l.content?.text);
    const finals = DEFAULT_SEGMENTS.map((s) => String(s.split));
    const pbs = DEFAULT_SEGMENTS.map((s) => String(s.pb));
    expect(shown(times, 0)).toEqual(finals);
    expect(shown(deltas, 0)).toHaveLength(10);
    expect(shown(times, 2.6)).toEqual(pbs);
    expect(shown(deltas, 2.6)).toHaveLength(0);
    const mid = landAt(parseTime("10:22.59", "t") as number, 1271270, b) + 0.001;
    expect(shown(times, mid)).toEqual([...finals.slice(0, 5), ...pbs.slice(5)]);
    expect(shown(times, 15)).toEqual(finals);
    expect(shown(times, 19.9)).toEqual(shown(times, 0));
    // The pending copies carry the structured window twin; the two-window gates carry none.
    for (const l of times) {
      if (l.overlay?.enable?.startsWith("gte(")) expect(l.overlay.window).toEqual({ startSec: 2.5, endSec: expect.any(Number) });
      else expect(l.overlay?.window).toBeUndefined();
    }
    // The stamp and the verdict: on in the cold open and from the last split on.
    for (const label of ["stamp", "stamp-text", "verdict"]) {
      const s = byLabel(doc, label)[0];
      expect(on(s.overlay?.enable, 0)).toBe(true);
      expect(on(s.overlay?.enable, 8)).toBe(false);
      expect(on(s.overlay?.enable, 15)).toBe(true);
    }
  });

  it("the clock prints the final time, counts the run fast-forwarded, and never passes the final", () => {
    const b = beatsOf(20);
    const expr = clockExpr(1271270, b);
    expect(expr).toContain("if(lt(t\\,2.500)\\,1271.270\\,min((t-2.500)*101.701600\\,1271.270))");
    expect(expr.match(/%\{eif/g)).toHaveLength(3);
    const hour = clockExpr(4655000, b);
    expect(hour.match(/%\{eif/g)).toHaveLength(4);
    expect(hour).toContain("/3600");
  });

  it("both children render on 5-smooth canvases: stripes and one highlight per landed split; a bar per split, gold caps on golds", async () => {
    const doc = await render({}, 1263, 711);
    const smooth = (v: number) => {
      let m = v;
      for (const p of [2, 3, 5]) while (m % p === 0) m /= p;
      return m === 1;
    };
    const rows = doc.children?.rows as MosaicDocument;
    const graph = doc.children?.graph as MosaicDocument;
    for (const child of [rows, graph]) {
      expect(child).toBeDefined();
      expect(smooth(child.size!.width) && smooth(child.size!.height)).toBe(true);
      expect(child.backgroundColor).toBe("#0d1117");
    }
    expect(byLabel(rows, "row-stripe")).toHaveLength(5);
    expect(byLabel(rows, "row-now")).toHaveLength(10);
    expect(byLabel(graph, "graph-bar")).toHaveLength(10);
    expect(byLabel(graph, "graph-gold")).toHaveLength(4);
    expect((await render({ graph: "none" })).children?.graph).toBeUndefined();
    const L = layoutRecap(buildModel({ game: "g", category: "c", runner: "r", attempts: 1 }, segs(STRESS)), "delta", 1080, 1920);
    expect(L.names).toHaveLength(16);
    expect(L.clockSample).toBe("8:88:88.88");
  });

  it("the clip is authored: clipSec sets it, an explicit pin overrides it", async () => {
    expect((await render()).durationMs).toBe(20000);
    expect((await render({ clipSec: 30 })).durationMs).toBe(30000);
    expect(SpeedrunPbRecapV1.resolveOutputHints?.(SpeedrunPbRecapV1.defaultProps)).toEqual({ durationMs: 20000 });
    expect((await render({}, 1080, 1920, targetCtx(1080, 1920, { durationMs: 2000 }))).durationMs).toBe(20000);
    const pinned = { ...targetCtx(1080, 1920), userIntent: { durationMs: 12000 } } as unknown as MosaicEngineContext;
    const doc = await SpeedrunPbRecapV1.render({ ...SpeedrunPbRecapV1.defaultProps }, pinned).then(asDocument);
    expect(doc.durationMs).toBe(12000);
    expect((doc.children?.rows as MosaicDocument).durationMs).toBe(12000);
  });

  it("is deterministic, takes the rows as a JSON string too, and rejects what the schema promises to reject", async () => {
    expect(await render()).toEqual(await render());
    expect((await render({ segments: JSON.stringify(DEFAULT_SEGMENTS) })).m0).toBe((await render()).m0);
    await expect(render({ segments: [] })).rejects.toThrow(/2\.\.16/);
    await expect(render({ segments: STRESS.concat(STRESS.slice(0, 1)) })).rejects.toThrow(/2\.\.16/);
    await expect(render({ segments: [{ name: "a", split: "1:00" }, { name: "b", split: "0:30" }] })).rejects.toThrow(/cumulative/);
    await expect(render({ segments: [{ name: "a", split: "1:2x" }, { name: "b", split: "2:00" }] })).rejects.toThrow(/not a time/);
    await expect(render({ segments: [{ name: "a", split: "1:00" }, { name: "b", split: "" }] })).rejects.toThrow(/final time/);
    await expect(render({ segments: "{not json" })).rejects.toThrow(/not valid JSON/);
    await expect(render({ accent: "blue" })).rejects.toThrow(/#rrggbb/);
    await expect(render({ preset: "sepia" as never })).rejects.toThrow(/must be one of/);
    await expect(render({ graph: "pie" as never })).rejects.toThrow(/must be one of/);
    await expect(render({ clipSec: 5 })).rejects.toThrow(/between 8 and 60/);
    await expect(render({ clipSec: 12.5 })).rejects.toThrow(/whole number/);
    await expect(render({ lss: "<nope/>" })).rejects.toThrow(/LiveSplit/);
  });
});
