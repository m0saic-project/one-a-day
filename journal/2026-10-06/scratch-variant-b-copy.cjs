// Variant b: the words (header comment, description, WHY, tests) follow the six-equal layout.
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
const t = "src/community/weekly-run-report/v1/weekly-run-report.test.ts";
const r = "src/community/registry.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 80)); s = s.replace(a, b); };

rep(` * ONE CONCEPT: two numbers carry the week. Finishers and volunteers get the
 * two big tiles, the same size, side by side (stacked in a left column on a
 * wide canvas): the run cannot happen without either, and the run report
 * thanks both. New PBs, first timers, visitors and first-time volunteers sit
 * under them as four equal smaller tiles, and their numbers are capped at
 * 1/1.6 of the headline numbers, so the hierarchy holds on every canvas.`,
` * ONE CONCEPT: the six counts are six equals. Finishers, new PBs, first
 * timers, visitors, volunteers and first-time volunteers each get the same
 * tile and the same number size, in the order parkrun-runstats lists them,
 * 3x2 on a square or wide canvas and 2x3 in portrait. No count is ranked
 * above another; the card is the results page's summary, drawn.`);
const descA = "The weekly results card a volunteer-run Saturday 5k posts after every run: event, run number and date, finishers and volunteers as the two headline numbers, new PBs, first timers, visitors and first-time volunteers under them, and the milestone clubs reached. Numbers are typed in, never fetched.";
const descB = "The weekly results card a volunteer-run Saturday 5k posts after every run: event, run number and date, the six counts of the results page as six equal tiles (finishers, new PBs, first timers, visitors, volunteers, first-time volunteers), and the milestone clubs reached. Numbers are typed in, never fetched.";
rep(descA, descB);
rep(`    "The decision that matters: two numbers carry the week. Finishers and volunteers get the two big tiles; the other four are smaller tiles, their numbers capped at 1/1.6 of the headline size. The milestone band never moves: an empty week says so and keeps the shape. No parkrun name, logo or colours."`,
    `    "The decision that matters: the six counts are six equal tiles in the runstats order, 3x2 (2x3 in portrait), one number size for all. The milestone band never moves: an empty week says so and keeps the shape. No parkrun name, logo or colours."`);
fs.writeFileSync(p, s);

let reg = fs.readFileSync(r, "utf8");
if (!reg.includes(JSON.stringify(descA))) throw new Error("registry desc");
reg = reg.replace(JSON.stringify(descA), JSON.stringify(descB));
fs.writeFileSync(r, reg);

let x = fs.readFileSync(t, "utf8");
const rt = (a, b) => { if (!x.includes(a)) throw new Error("test missing " + a.slice(0, 80)); x = x.replace(a, b); };
rt(`  it("keeps the hierarchy: the headline numbers are at least 1.5x the stat numbers and all tile labels share one size, at every canvas", async () => {`,
   `  it("draws six equals: all six numbers share one size and all tile labels share one size, at every canvas", async () => {`);
rt(`        const hero = px("value-finishers").concat(px("value-volunteers"));
        const stat = ["newPbs", "firstTimers", "visitors", "firstTimeVolunteers"].flatMap((k) => px(\`value-\${k}\`));
        expect(hero).toHaveLength(2);
        expect(stat).toHaveLength(4);
        expect(Math.min(...hero)).toBeGreaterThanOrEqual(1.5 * Math.max(...stat));`,
   `        const values = px("value-");
        expect(values).toHaveLength(6);
        expect(new Set(values).size).toBe(1);`);
rt(`  it("reflows by aspect: 4x1 stats on the square, 2x2 in portrait and in the wide right column, no slab tiles", () => {
    const sq = layoutWeeklyRunReport({}, 1080, 1080);
    expect(sq.shape).toBe("square");
    expect(new Set(sq.statRects.map((r) => r.y)).size).toBe(1);
    const tall = layoutWeeklyRunReport({}, 1080, 1920);
    expect(tall.shape).toBe("tall");
    expect(new Set(tall.statRects.map((r) => r.y)).size).toBe(2);
    const wide = layoutWeeklyRunReport({}, 1920, 1080);
    expect(wide.shape).toBe("wide");
    expect(wide.heroRects[0].x).toBe(wide.heroRects[1].x);
    expect(new Set(wide.statRects.map((r) => r.x)).size).toBe(2);
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutWeeklyRunReport({}, w, h);
      for (const r of [...L.heroRects, ...L.statRects]) expect(r.h).toBeLessThanOrEqual(Math.ceil(r.w * 1.3));
    }
  });`,
   `  it("reflows by aspect: 3x2 on the square and wide canvases, 2x3 in portrait, no slab tiles", () => {
    const grid = (w: number, h: number) => { const L = layoutWeeklyRunReport({}, w, h); return [new Set(L.statRects.map((r) => r.x)).size, new Set(L.statRects.map((r) => r.y)).size]; };
    expect(grid(1080, 1080)).toEqual([3, 2]);
    expect(grid(1920, 1080)).toEqual([3, 2]);
    expect(grid(1080, 1920)).toEqual([2, 3]);
    for (const [w, h] of CONTRACT_CANVASES) {
      const L = layoutWeeklyRunReport({}, w, h);
      expect(L.heroRects).toHaveLength(0);
      expect(L.statRects).toHaveLength(6);
      for (const r of L.statRects) expect(r.h).toBeLessThanOrEqual(Math.ceil(r.w * 1.3));
    }
  });`);
rt(`    // A pale accent keeps the fills and the numbers go to ink.
    const pale = layoutWeeklyRunReport({ accent: "#ffd23f" }, 1080, 1080);
    expect(pale.p.heroInk).toBe("#1b1f1c");
    expect(layoutWeeklyRunReport({}, 1080, 1080).p.heroInk).toBe("#1f7a4d");`,
   `    // Six equals: every number is ink, whatever the accent.
    const pale = await render({ accent: "#ffd23f" });
    expect(pale.sources).toBeDefined();`);
fs.writeFileSync(t, x);
console.log("ok");
