// Review fixes 4: copy and tests follow the new badge sizing (ten clubs now fit 640x360) and counts-as-string.
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 80)); s = s.replace(a, b); };
rep(`Eight or more clubs are refused on a 480x270 thumbnail, ten on 640x360.",`, `Eight or more clubs are refused on a 480x270 thumbnail.",`);
rep(`Eight or more milestone clubs are refused at 480x270, ten at 640x360.",`, `Eight or more milestone clubs are refused at 480x270.",`);
rep(`The six counts from the results page, typed in, never fetched: {`, `The six counts from the results page, typed in, never fetched (an object or its JSON string): {`);
fs.writeFileSync(p, s);

const t = "src/community/weekly-run-report/v1/weekly-run-report.test.ts";
let x = fs.readFileSync(t, "utf8");
const rt = (a, b) => { if (!x.includes(a)) throw new Error("test missing " + a.slice(0, 80)); x = x.replace(a, b); };
rt(`    // Ten clubs: every canvas from 1280x720 up; the 640x360 and 480x270 thumbnails refuse them (below).
    await sweep({ milestones: TEN, counts: MAXED }, CONTRACT_CANVASES.filter(([w]) => w >= 1080));`,
`    // Ten clubs: every canvas from 640x360 up; the 480x270 thumbnail refuses them (below).
    await sweep({ milestones: TEN, counts: MAXED }, CONTRACT_CANVASES.filter(([w]) => w > 480));`);
rt(`        if (over.milestones === TEN && w < 1080) continue;`, `        if (over.milestones === TEN && w <= 480) continue;`);
rt(`    // Only a wide thumbnail whose two rows would fall below the floor takes one long row.`,
   `    // Only a band whose two rows would fall below the floor (here a wide thumbnail) takes one long row.`);
rt(`    expect(() => settleLayout({ milestones: TEN }, 640, 360)).toThrow(/milestones cannot be fitted on 640x360/);`,
   `    expect(settleLayout({ milestones: TEN }, 640, 360).L.badges).toHaveLength(10);`);
rt(`    await expect(render({ count: counts } as never))`,
`    // counts may arrive as the raw JSON string a json prop's editor holds.
    expect(textOf(await render({ counts: JSON.stringify({ ...counts, finishers: 1204 }) } as never), "value-finishers")).toBe("1,204");
    await expect(render({ counts: "{finishers: 214" } as never)).rejects.toThrow(/counts is not valid JSON/);
    await expect(render({ count: counts } as never))`);
fs.writeFileSync(t, x);
console.log("ok");
