// Correctness probes: weekday arithmetic vs a Date-based calendar, grid parsing edge cases,
// and theme-token spans vs the tokens they claim to point at.
const path = require("path");
const T = require(path.resolve(__dirname, "../../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { normalizeCrossword, parseCrosswordGrid, numberCrosswordGrid } = T;

let bad = 0;
const say = (...a) => console.log(...a);

// ---- 1. weekday vs Date (proleptic Gregorian via setUTCFullYear so years < 100 are not remapped)
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function trusted(y, m, d) {
  const dt = new Date(0);
  dt.setUTCFullYear(y, m - 1, d);
  dt.setUTCHours(0, 0, 0, 0);
  return `${WD[dt.getUTCDay()]} ${m}/${d}/${String(y % 100).padStart(2, "0")}`;
}
const dates = [
  "2026-09-29", "2000-02-29", "1900-02-28", "1900-03-01", "2100-03-01", "2024-02-29", "2024-03-01",
  "1600-02-29", "1700-03-01", "0001-01-01", "0004-02-29", "0099-12-31", "0100-03-01", "9999-12-31",
  "2026-01-01", "2026-02-28", "2026-03-01", "2026-12-31", "1999-12-31", "2000-01-01", "1970-01-01",
];
// plus a brute-force sweep across every day 1580..2420
for (let y = 1580; y <= 2420; y++) for (let m = 1; m <= 12; m++) {
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  for (let d = 1; d <= days; d++) dates.push(`${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
}
let checked = 0, wrong = 0;
for (const date of dates) {
  const [y, m, d] = date.split("-").map(Number);
  const p = normalizeCrossword({ date });
  const want = trusted(y, m, d);
  checked++;
  if (p.metaDate !== want) { wrong++; if (wrong < 10) say("WEEKDAY MISMATCH", date, p.metaDate, "want", want); }
}
say(`weekday: ${checked} dates checked, ${wrong} wrong`);
if (wrong) bad++;
// Invalid dates must be refused
for (const date of ["1900-02-29", "2100-02-29", "2026-04-31", "2026-13-01", "2026-00-10", "0000-01-01", "2026-9-29", " 2026-09-29"]) {
  try { normalizeCrossword({ date }); say("DATE ACCEPTED (should fail):", JSON.stringify(date)); bad++; } catch (e) { /* ok */ }
}

// ---- 2. grid parsing
const cases = [
  ["crlf", "PAN#BOW\r\nAGE#ARE\r\nDOGSLED\r\n##AIL##\r\nCATNAPS\r\nOWE#SAT\r\nYES#TRY\r\n", [7, 7]],
  ["spaces around slash", "  PAN#BOW / AGE#ARE /DOGSLED/ ##AIL## /CATNAPS/OWE#SAT/YES#TRY  ", [7, 7]],
  ["dot blocks flat 49", "PAN.BOWAGE.AREDOGSLED..AIL..CATNAPSOWE.SATYES.TRY", [7, 7]],
  ["flat 225", "A".repeat(225), [15, 15]],
  ["flat 441", "A".repeat(441), [21, 21]],
  ["flat 625", "A".repeat(625), [25, 25]],
  ["flat 9", "ABCDEFGHI", [3, 3]],
  ["flat w/ trailing newline", "A".repeat(225) + "\n", [15, 15]],
  ["tabs + newlines", "\tABC\t\n\tDEF\n GHI ", [3, 3]],
  ["blank lines", "ABC\n\n\nDEF\n\nGHI", [3, 3]],
];
for (const [name, g, [c, r]] of cases) {
  try {
    const pz = parseCrosswordGrid(g);
    const ok = pz.cols === c && pz.rows === r;
    say(`parse ${name}: ${pz.cols}x${pz.rows}${ok ? "" : "  <-- WRONG"}`);
    if (!ok) bad++;
  } catch (e) { say(`parse ${name}: THREW ${e.message}`); bad++; }
}
// non-square flat strings -> a named failure, not a crash
for (const [name, g] of [["flat 240 (15x16)", "A".repeat(240)], ["flat 4", "ABCD"], ["flat 676", "A".repeat(676)]]) {
  try { const pz = parseCrosswordGrid(g); say(`parse ${name}: accepted as ${pz.cols}x${pz.rows}`); } catch (e) { say(`parse ${name}: refused -> ${e.message}`); }
}

// ---- 3. numbering: 1-letter runs, unchecked cells, all-isolated
const iso = numberCrosswordGrid(parseCrosswordGrid("A#A/###/A#A"));
say("isolated whites numbers:", [...iso.numbers.entries()], "entries:", [...iso.entries.keys()]);
const one = numberCrosswordGrid(parseCrosswordGrid("A#B/CDE/F#G"));
say("A#B/CDE/F#G:", [...one.entries.values()].map((e) => `${e.id}=${e.answer}`).join(" "));

// ---- 4. theme spans: each list line's token must slice to ITS id in the raw string
const spanCases = ["9A 12A", "9A,12A", " 9A,  12A ", "9A\n12A", "\t12A ,9A", ",9A,,12A,", "9A 12A", "12A 9A"];
for (const raw of spanCases) {
  try {
    const p = normalizeCrossword({ themeEntries: raw });
    const got = p.themes.map((t, i) => raw.slice(p.themeSpans[i].start, p.themeSpans[i].end));
    const want = p.themes.map((t) => t.id);
    const ok = JSON.stringify(got) === JSON.stringify(want);
    say(`spans ${JSON.stringify(raw)} -> ${JSON.stringify(got)}${ok ? "" : "  <-- MISMATCH want " + JSON.stringify(want)}`);
    if (!ok) bad++;
  } catch (e) { say(`spans ${JSON.stringify(raw)}: THREW ${e.message}`); }
}
say(bad ? `\n${bad} problem(s)` : "\nno problems");
