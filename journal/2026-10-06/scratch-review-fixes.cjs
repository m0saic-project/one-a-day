// Review fixes (build call 1): unknown props, milestone sums, badge <= stat numbers, honest copy.
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 80)); s = s.replace(a, b); };

// 1. A misspelled prop is refused by name (a typo would otherwise print the sample week).
rep(`/** The schema is documentation; this is the gate. Only \`undefined\` takes a default. */
export function normalizeWeeklyRunReport(props: WeeklyRunReportProps) {
  const p = { ...DEFAULTS,`,
`/** Edit distance, for "did you mean" on a misspelled prop. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** The schema is documentation; this is the gate. Only \`undefined\` takes a default. */
export function normalizeWeeklyRunReport(props: WeeklyRunReportProps) {
  // A prop the card does not know is refused by name: "count" for "counts" would
  // otherwise leave the sample week's invented numbers on a real event's card.
  const known = Object.keys(DEFAULTS);
  for (const k of Object.keys(props ?? {})) {
    if (known.includes(k)) continue;
    const near = known.find((n) => distance(n.toLowerCase(), k.toLowerCase()) <= 2);
    fail("props", \`has an unknown prop '\${k}'\${near ? \`; did you mean '\${near}'?\` : ""} The props are \${known.join(", ")}.\`);
  }
  const p = { ...DEFAULTS,`);

// 2. Milestone counts cannot exceed the people who ran or volunteered this week.
rep(`  const milestones = parseMilestones(p.milestones);`,
`  const milestones = parseMilestones(p.milestones);
  // Everyone who reached a run club finished this week, everyone who reached a volunteer club volunteered.
  const runners = milestones.filter((b) => b.kind === "R").reduce((a, b) => a + b.count, 0);
  const helpers = milestones.filter((b) => b.kind === "V").reduce((a, b) => a + b.count, 0);
  if (runners > counts.finishers) fail("milestones", \`count \${runners} runners reaching a club, more than the \${counts.finishers} finishers.\`);
  if (helpers > counts.volunteers) fail("milestones", \`count \${helpers} volunteers reaching a club, more than the \${counts.volunteers} volunteers.\`);`);

// 3. A club number never outranks a stat number: headline > stat >= badge.
rep(`      const badgePx = Math.min(Math.floor((bh * 0.52) / 1.22), ...p.milestones.map((b) => fitPx(String(b.club), bw - 2 * ip, S, true)));`,
    `      const badgePx = Math.min(statPx, Math.floor((bh * 0.52) / 1.22), ...p.milestones.map((b) => fitPx(String(b.club), bw - 2 * ip, S, true)));`);
rep(`    badgePx = Math.min(Math.floor((sh * 0.52) / 1.22), ...p.milestones.map((b) => fitPx(String(b.club), sw - 2 * ip, S, true)));`,
    `    // A club number never outranks a stat number: headline > stat >= badge.
    badgePx = Math.min(statPx, Math.floor((sh * 0.52) / 1.22), ...p.milestones.map((b) => fitPx(String(b.club), sw - 2 * ip, S, true)));`);

// 4. Honest copy.
rep(`      "week.json: {\\"eventName\\":\\"Your Park 5k\\",\\"runNumber\\":313,\\"counts\\":{...},\\"milestones\\":\\"2xR25, 1xV50\\"}",`,
    `      "week.json: {\\"eventName\\":\\"Your Park 5k\\",\\"runNumber\\":313,\\"date\\":\\"2026-10-10\\",\\"counts\\":{...},\\"footer\\":\\"\\"}",`);
rep(`    "From six clubs the badges get smaller (two rows, or one long row on a wide card); ten clubs need 1280x720 or larger and are refused on the 640x360 and 480x270 thumbnails.",`,
    `    "From six clubs the badges get smaller (two rows, or one long row on a wide card). Eight or more clubs are refused on a 480x270 thumbnail, ten on 640x360.",`);
rep(`Ten milestone clubs need 1280x720 or larger.",`, `Eight or more milestone clubs are refused at 480x270, ten at 640x360.",`);
rep(`description: 'The milestone clubs reached this week, as parkrun-runstats prints them plus V for volunteer clubs: "4xR25, 3xR50, 1xR100, 2xV25" (count x R or V, club 25, 50, 100, 250, 500 or 1000; count 1-999). Up to 10 entries, each club and kind once; run clubs are shown first, then volunteer clubs, each ascending.`,
    `description: 'The milestone clubs reached this week, as parkrun-runstats prints them plus V for volunteer clubs: "4xR25, 3xR50, 1xR100, 2xV25" (count x R or V, club 25, 50, 100, 250, 500 or 1000; count 1-999). Up to 10 entries, each club and kind once; the run counts add up to at most the finishers, the volunteer counts to at most the volunteers. Run clubs are shown first, then volunteer clubs, each ascending.`);
fs.writeFileSync(p, s);

// Tests.
const t = "src/community/weekly-run-report/v1/weekly-run-report.test.ts";
let x = fs.readFileSync(t, "utf8");
const rt = (a, b) => { if (!x.includes(a)) throw new Error("test missing " + a.slice(0, 80)); x = x.replace(a, b); };
rt(`    await expect(render({ accent: "green" })).rejects.toThrow(/accent "green" must be #rrggbb/);`,
`    await expect(render({ accent: "green" })).rejects.toThrow(/accent "green" must be #rrggbb/);
    // A misspelled prop is refused by name, so a typo never leaves the sample week on a real card.
    await expect(render({ count: counts } as never)).rejects.toThrow(/unknown prop 'count'; did you mean 'counts'\\?/);
    await expect(render({ milestone: "1xR50" } as never)).rejects.toThrow(/unknown prop 'milestone'; did you mean 'milestones'\\?/);
    await expect(render({ colour: "#000000" } as never)).rejects.toThrow(/unknown prop 'colour'\\. The props are eventName/);
    // Club counts cannot exceed the people who ran or volunteered.
    const small = { finishers: 40, newPbs: 5, firstTimers: 3, visitors: 2, volunteers: 8, firstTimeVolunteers: 1 };
    await expect(render({ counts: small, milestones: "30xR25, 20xR50" })).rejects.toThrow(/milestones count 50 runners reaching a club, more than the 40 finishers/);
    await expect(render({ counts: small, milestones: "9xV25" })).rejects.toThrow(/milestones count 9 volunteers reaching a club, more than the 8 volunteers/);
    expect(await render({ counts: small, milestones: "40xR25, 8xV25" })).toBeDefined();`);
rt(`        expect(Math.min(...hero)).toBeGreaterThanOrEqual(1.5 * Math.max(...stat));`,
`        expect(Math.min(...hero)).toBeGreaterThanOrEqual(1.5 * Math.max(...stat));
        // ...and no club number outranks a stat number.
        for (const b of px("badge-club-")) expect(b).toBeLessThanOrEqual(Math.min(...stat));`);
fs.writeFileSync(t, x);
console.log("ok");
