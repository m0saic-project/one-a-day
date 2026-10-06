// Review fixes 3 (build call 2): badges robust to the lattice snap, counts as a JSON string, honest snap comment.
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 80)); s = s.replace(a, b); };

// 1. The caption takes up to 0.3 of the badge and the club number the rest of the padded height, so the
//    few px a lattice snap takes off a badge no longer drop a caption that just fitted under the floor.
rep(`      const badgePx = Math.min(statPx, Math.floor((sh * 0.52) / 1.22), ...p.milestones.map((b) => fitPx(String(b.club), sw - 2 * ip, S, true)));
      const captionPx = Math.min(labelPx, Math.floor((sh * 0.26) / 1.22), ...p.milestones.map((b) => fitPx(b.caption, sw - 2 * ip, S, false)));`,
`      // The caption is sized first (up to 0.3 of the badge), the club number takes what is left of the
      // padded height, so a snap that trims a badge by a step does not push a caption under the floor.
      const captionPx = Math.min(labelPx, Math.floor((sh * 0.3) / 1.22), ...p.milestones.map((b) => fitPx(b.caption, sw - 2 * ip, S, false)));
      const badgePx = Math.min(statPx, Math.floor((sh * 0.52) / 1.22), Math.floor((sh - 2 * ip - lineH(captionPx)) / 1.22), ...p.milestones.map((b) => fitPx(String(b.club), sw - 2 * ip, S, true)));`);
// 2. Any band whose two rows fall below the floor (not only a wide one) tries one long row before refusing.
rep(`    // At most five a row: six to ten clubs make two rows (ceil/floor). Only a wide band whose two
    // rows would fall below the floor (a thumbnail) takes one long row of n instead.
    const rows2 = n <= 5 ? arrange([n], 5) : arrange([Math.ceil(n / 2), Math.floor(n / 2)], 5);
    const A = n > 5 && shape === "wide" && !rows2.fits ? arrange([n], n) : rows2;`,
`    // At most five a row: six to ten clubs make two rows (ceil/floor). Only a band whose two rows
    // would fall below the floor (a thumbnail, a short band) takes one long row of n instead.
    const rows2 = n <= 5 ? arrange([n], 5) : arrange([Math.ceil(n / 2), Math.floor(n / 2)], 5);
    const A = n > 5 && !rows2.fits ? arrange([n], n) : rows2;`);
// 3. counts may arrive as a raw JSON string (a json prop's plain editor delivers one).
rep(`export function parseCounts(value: unknown): RunCounts {
  if (typeof value !== "object"`,
`export function parseCounts(value: unknown): RunCounts {
  // A json prop may arrive as the raw string its editor holds.
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { fail("counts", \`is not valid JSON: \${JSON.stringify(value.slice(0, 60))}.\`); }
  }
  if (typeof value !== "object"`);
// 4. Honest snap comment: the sides are 5-smooth multiples of the pitch, which is smooth on the contract canvases.
rep(`/**
 * Equal rects for a group of equal slots, each ON the parent lattice with
 * 5-smooth sides, centred on its slot and never larger than it.`,
`/**
 * Equal rects for a group of equal slots, each ON the parent lattice with a
 * 5-smooth number of steps (so 5-smooth sides wherever the pitch is, as on
 * every contract canvas; an odd canvas with a pitch of 7 or 13 gets rough
 * child sides, which still render), centred on its slot and never larger than it.`);
fs.writeFileSync(p, s);

const t = "src/community/weekly-run-report/v1/weekly-run-report.test.ts";
let x = fs.readFileSync(t, "utf8");
const rt = (a, b) => { if (!x.includes(a)) throw new Error("test missing " + a.slice(0, 80)); x = x.replace(a, b); };
rt(`    expect(rows(TEN, 1920, 1080)).toEqual([5, 5]);`,
`    expect(rows(TEN, 1920, 1080)).toEqual([5, 5]);
    // Mid-size canvases whose lattice snap trims the badges still take every club count.
    for (const [w, h] of [[1000, 800], [1200, 900], [1290, 1000], [1440, 900], [1024, 768], [1600, 900]] as const) {
      for (let n = 6; n <= 10; n++) expect(() => settleLayout({ milestones: TEN.split(", ").slice(0, n).join(", ") }, w, h)).not.toThrow();
    }`);
fs.writeFileSync(t, x);
console.log("ok");
