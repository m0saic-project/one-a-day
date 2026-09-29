// Final 30-build.md edits after the full review came back (build call 4).
const fs = require("fs");
const f = "journal/2026-09-29/30-build.md";
let s = fs.readFileSync(f, "utf8");
const rep = (a, b) => { if (!s.includes(a)) { console.error("MISSING", a.slice(0, 80)); process.exit(1); } s = s.replace(a, b); };

rep(`- Not reached: the correctness and stress lenses were still running when
  this call closed. The brief and truth lenses, and their skeptics, had
  finished.
`, `- The correctness and stress lenses finished after the lines above. See
  "Review, second half" below.
`);

rep(`- disclosed (low): a long theme list shrinks with no floor. 8 answers of 21
  letters give 10 px at the 1080x1080 hint; 8 answers of 25 letters at
  480x270 give 7 px, under the 8 px promise (the brief's stress set stops
  at 21 letters).`,
`- disclosed (low, also confirmed by the correctness lens): the theme list
  shrinks with no floor. In the square strip, the brief's own "two
  sub-columns when there are more than four answers" makes a cliff: 4
  answers of 15-21 letters get 19 px, 5 or more get 13 px (15 letters) or
  10 px (21 letters), under the 14 px heading. 8 answers of 25 letters at
  480x270 give 7 px, under the 8 px promise; the brief's stress set stops
  at 21 letters. Choosing the column count by the size it yields, or taking
  height from the board as the long title now does, is the v2 fix.`);

const reopened = s.indexOf("## Reopened (call 4, 15:31Z)");
const second = `## Review, second half (reopened after build was first marked done)

The correctness and stress lenses came back after build had been marked done
at 15:23Z. Build was unmarked, and these were fixed in variant a (in place),
re-rendered and re-checked:

- CONFIRMED, fixed: a canvas under ~400 px with a long theme list (a 21x21
  with 8 answers at 300x300, 240x240, 360x300) crashed the render with an
  anonymous \`placeInsetRects: ... overflows rootH\`. The list now drops when
  it cannot fit even at 6 px; the board's tint still marks the entries
  (\`stress/21x21-tiny-300x300.png\`, exit 0). Tested.
- CONFIRMED, fixed: a themeless puzzle (\`themeEntries: ""\`, routine on a
  Friday or Saturday) left 75% of the landscape column empty under a
  top-pinned title, and ~25% of H empty under the portrait board. Now the
  landscape title block centres above the caption line, and the portrait
  card splits the space evenly around the board with the caption centred in
  its band (\`stress/themeless-1920x1080.png\`, \`themeless-1080x1920.png\`).
  This follows the PROP, so the teaser of a themed puzzle still keeps the
  solved card's geometry and its empty list band (the brief's "nothing else
  moves" wins there). Tested.
- CONFIRMED, fixed: no contrast guard on \`themeColor\`. A navy fill (1.7:1
  against the ink) hid letters, numbers and rings. \`render()\` now refuses a
  fill under 4.5:1 with the field and the ratio named (the brief's own bar;
  the default is 13.9:1). Tested.
- fixed (low): the teaser re-fitted the caption line for long copy
  ("puzzle" is narrower than "solution"). The line now fits on the solved
  form. The "nothing else moves" test covers the max-length copy too.
- fixed (low): a grid with no entry at all stamped a \`cell-number\`
  constraint for a source that is never drawn.
- not fixed (low): a 48-character author of wide glyphs (48 x "W") drops
  the byline to 7 px at 480x270. Real names with spaces, or a long handle,
  stay at 8 px or more.
- not fixed (low): the \`cell-letter\` / \`cell-number\` textFits are checked
  against the whole-board rect, so they cannot catch a glyph overflowing its
  cell. The test checks the widest glyph against a cell's paper width at
  every size and canvas instead.
- noted (low): the date handle sits on derived text ("| Tue 9/29/26"), and
  neighbouring caption rects overlap by the fit's slack (transparent).

After the fixes: \`npm run build\` clean, fingerprint unchanged (the defaults
did not move), doctor "meets 0.3.0" with 0 errors and 0 warnings for this
template, \`npm test\` 182 jest + 54 pipeline tests pass
(\`logs/test-call4-final.log\`), and variant a re-rendered with the final code.
`;
s = s.slice(0, reopened).trimEnd() + "\n";
rep("## Why-tutorial", second + "\n## Why-tutorial");

rep(`unchanged, doctor clean (\`logs/doctor-call4-final.json\`). \`npm test\`: 181
jest + 54 pipeline tests passed before the review fixes
(\`logs/test-call4-final.log\`). After them the template's own suite
(13 tests) and \`npm run build\` pass; the fixes touched only this
template's folder.`,
`unchanged, doctor clean (\`logs/doctor-call4-final.json\`). \`npm test\`: 182
jest + 54 pipeline tests pass with the final code
(\`logs/test-call4-final.log\`).`);

fs.writeFileSync(f, s);
console.log("ok");
