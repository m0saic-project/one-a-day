// Review fixes 2: at most five badges a row (one long row only as the wide fallback), no footer length cap.
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 80)); s = s.replace(a, b); };

rep(`    // Six to ten clubs: two rows (ceil/floor), or - on a wide band - one row of n when that draws them larger.
    const options = n <= 5 ? [arrange([n], 5)] : [arrange([Math.ceil(n / 2), Math.floor(n / 2)], 5), ...(shape === "wide" ? [arrange([n], n)] : [])];
    const A = options.reduce((best, o) => (o.captionPx > best.captionPx || (o.captionPx === best.captionPx && o.badgePx > best.badgePx) ? o : best), options[0]);`,
`    // At most five a row: six to ten clubs make two rows (ceil/floor). Only a wide band whose two
    // rows would fall below the floor (a thumbnail) takes one long row of n instead.
    const rows2 = n <= 5 ? arrange([n], 5) : arrange([Math.ceil(n / 2), Math.floor(n / 2)], 5);
    const A = n > 5 && shape === "wide" && (rows2.captionPx < small || rows2.badgePx < small) ? arrange([n], n) : rows2;`);
rep(`  const footer = drawn(p.footer, "footer", 70, true);`,
    `  // No length cap: the footer shrinks alone to the floor and is refused there (the fit ladder).
  const footer = drawn(p.footer, "footer", Number.POSITIVE_INFINITY, true);`);
rep(`Up to 70 characters of printable ASCII or accented Latin letters. Empty removes it and the space goes back to the card.`,
    `One line of printable ASCII or accented Latin letters; a long one shrinks, and only a line that cannot fit above the readability floor is refused. Empty removes it and the space goes back to the card.`);
fs.writeFileSync(p, s);

const t = "src/community/weekly-run-report/v1/weekly-run-report.test.ts";
let x = fs.readFileSync(t, "utf8");
const rt = (a, b) => { if (!x.includes(a)) throw new Error("test missing " + a.slice(0, 80)); x = x.replace(a, b); };
rt(`    // A wide band may hold all ten in one row when that draws them larger; either way they are equal.
    const wide = layoutWeeklyRunReport({ milestones: TEN }, 1920, 1080).badges;`,
`    expect(rows(TEN, 1920, 1080)).toEqual([5, 5]);
    expect(rows(SIX, 1920, 1080)).toEqual([3, 3]);
    expect(rows(SIX, 1080, 1920)).toEqual([3, 3]);
    // Only a wide thumbnail whose two rows would fall below the floor takes one long row.
    expect(settleLayout({ milestones: SIX }, 480, 270).L.badges.map((b) => b.rect.y).every((y, _, a) => y === a[0])).toBe(true);
    const wide = layoutWeeklyRunReport({ milestones: TEN }, 1920, 1080).badges;`);
rt(`    await expect(render({ footer: "x".repeat(71) })).rejects.toThrow(/footer .* is 71 characters/);`,
`    // The footer has no length cap: it shrinks to the floor and only then is refused.
    expect(textOf(await render({ footer: "Thanks to all 58 volunteers - see you next Saturday at 9am by the cafe!" }), "footer")).toMatch(/cafe!$/);
    await expect(render({ footer: "word ".repeat(60).trim() })).rejects.toThrow(/footer cannot be fitted on 1080x1080 above the 24px readability floor/);`);
fs.writeFileSync(t, x);
console.log("ok");
