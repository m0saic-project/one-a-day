// Truth-lens fixes to the WHY literal and the board aspect contract (build call 4).
const fs = require("fs");
const f = "src/gaming/crossword-grid-card/v1/crossword-grid-card.ts";
let s = fs.readFileSync(f, "utf8");
const Q = '\\"'; // a backslash-quote, as it appears inside the WHY strings
const rep = (a, b) => { if (!s.includes(a)) { console.error("MISSING", a.slice(0, 90)); process.exit(1); } s = s.replace(a, b); };
rep(`Zhoukin Burnikel * solution${Q}), and because`, `Zhoukin Burnikel * solution * 20260922${Q}), and because`);
rep(`"Paste the solution rows from the puzzle file (puzpy's p.solution pastes as is). The card derives the clue numbers, reads each theme answer from the grid, tints it and lists it, and writes the caption line, so every grid on a blog looks the same.`,
    `"Paste the solution rows from the puzzle file (for a square grid, puzpy's p.solution pastes as is). The card derives the clue numbers, reads each theme answer from the grid, tints it and lists it, and writes the caption line, so every grid on a blog matches.`);
rep(`"grid: the .puz solution string, or rows split by ${Q}/${Q} (${Q}#${Q} or ${Q}.${Q} is a block)",`,
    `"grid: rows split by ${Q}/${Q} (${Q}#${Q} or ${Q}.${Q} is a block); a square grid's unbroken .puz string also works",`);
rep(`"solved: false - the new-puzzle teaser, no letters, tint or answers"`,
    `"--props '{${Q}solved${Q}:false}' - the new-puzzle teaser: no letters, tint or answers"`);
rep(`"Grids 3 to 25 cells each way. Clue numbers are dropped below 6 px, so a 15x15 at 480x270 shows letters only."`,
    `"Grids 3 to 25 cells each way; paste a non-square grid as rows split by ${Q}/${Q}. Clue numbers are dropped below 6 px, so a 15x15 at 480x270 shows letters only."`);
rep(`  constraints.push({ label: "board", aspect: pz.cols / pz.rows,`,
    `  // The designed shape: the lattice plus its border (a 25x3 is not 25/3 once the border is on).
  const shape = (pz.cols * B.pitch - B.rule + 2 * B.border) / (pz.rows * B.pitch - B.rule + 2 * B.border);
  constraints.push({ label: "board", aspect: shape,`);
fs.writeFileSync(f, s);
const lit = s.slice(s.indexOf("const WHY: WhySpec"), s.indexOf('"timeline"'));
for (const m of lit.matchAll(/"((?:[^"\\]|\\.)*)"/g)) if (m[1].length > 200) console.log(m[1].length, m[1].slice(0, 60));
console.log("non-ascii:", /[^\x00-\x7f]/.test(lit));
