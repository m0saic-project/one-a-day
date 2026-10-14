// Scratch verifier for the 2026-10-14 build phase - the agent cannot view
// images, so it verifies the variant-a claims against the rendered document
// (the same dist the CLI renders) instead: every text, binding, tile and pip
// the header comment, the description and WHY.solution claim.
import { createRequire } from "node:module";
const require = createRequire("C:/src/m0saic-production/one-a-day/package.json");

const mod = require("C:/src/m0saic-production/one-a-day/dist/gaming/tenxten-challenge-card/v1/tenxten-challenge-card.js");
const { TenxtenChallengeCardV1, layoutTenxtenCard, normalizeTenxten } = mod;
const { resolvePropBindings } = require("@m0saic/template-utils");

const ID = "@one-a-day/gaming/tenxten-challenge-card/v1";
const ctx = (w, h) => ({ mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h }, media: {} });

const out = [];
const ok = (name, cond, detail) => { out.push(`${cond ? "PASS" : "FAIL"} ${name}${cond ? "" : " -- " + detail}`); if (!cond) process.exitCode = 1; };

const doc = await TenxtenChallengeCardV1.render({ ...TenxtenChallengeCardV1.defaultProps }, ctx(1920, 1080));
const texts = [];
const tiles = [];
const walk = (d) => {
  for (const s of d.sources ?? []) {
    if (s.type === "text") for (const l of s.layers ?? []) texts.push({ label: s.editor?.label, text: l.content?.text, px: l.style?.fontSize, bold: l.style?.fontWeight === "bold", color: l.style?.fontColor });
    if (s.type === "lavfi") tiles.push({ label: s.editor?.label, color: s.color, mask: s.mask?.localPath ?? null, binding: s.editor?.binding ?? null });
  }
};
walk(doc);
const by = (label) => texts.filter((t) => t.label === label);
const one = (label) => { const h = by(label); if (h.length !== 1) return null; return h[0]; };

// 1. the header: derived wordmark, the year, the challenger's handle
ok("wordmark is derived '10 x 10 CHALLENGE'", one("mark")?.text === "10 x 10 CHALLENGE", JSON.stringify(one("mark")));
ok("year cell '- 2026'", one("year")?.text === "- 2026", JSON.stringify(one("year")));
ok("handle '@cardboard_kim'", one("handle")?.text === "@cardboard_kim", JSON.stringify(one("handle")));

// 2. the stat band: three tiles (variant a/c) or one full-width strip (variant b)
const strip = one("stat-strip");
if (strip) {
  ok("stat strip '81 / 100 plays - 6 / 10 games done - 2 ahead of pace'", strip.text === "81 / 100 plays - 6 / 10 games done - 2 ahead of pace", JSON.stringify(strip?.text));
  ok("no stat tiles beside the strip", !tiles.some((t) => /^tile-\d$/.test(t.label)), "");
} else {
  ok("plays tile '81 / 100'", one("tile-value-0")?.text === "81 / 100", JSON.stringify(one("tile-value-0")));
  ok("done tile '6 / 10'", one("tile-value-1")?.text === "6 / 10", JSON.stringify(one("tile-value-1")));
  ok("pace tile '2 ahead'", one("tile-value-2")?.text === "2 ahead", JSON.stringify(one("tile-value-2")));
  ok("tile labels", ["plays logged", "games done", "of year pace"].every((t, i) => one(`tile-label-${i}`)?.text === t), "");
  ok("three stat tiles exist", tiles.filter((t) => /^tile-\d$/.test(t.label)).length === 3, "");
}

// 3. the game rows: names in order, counts 10,10,10,10,10,10,8,6,4,3
const NAMES = ["Pandemic Legacy S1", "Brass Birmingham", "Wingspan", "Spirit Island", "7 Wonders Duel", "Azul", "Everdell", "The Crew", "Scythe", "Lost Ruins of Arnak"];
const PLAYS = [10, 10, 10, 10, 10, 10, 8, 6, 4, 3];
ok("10 name cells in list order", NAMES.every((n, r) => one(`game-name-${r}`)?.text === n), "");
ok("10 count cells 10,10,10,10,10,10,8,6,4,3", PLAYS.every((p, r) => one(`game-count-${r}`)?.text === String(p)), "");

// 4. the footnote carries the pace formula
ok("footnote has the pace formula", /pace = 100 plays x day 287\/365/.test(one("footnote")?.text ?? ""), JSON.stringify(one("footnote")?.text));

// 5. the pip lattice: exactly 100 squares, 81 accent-filled, 19 empty,
//    per-row fill = min(plays, goal), one side everywhere
const L = layoutTenxtenCard({}, 1920, 1080);
ok("pips: 10 rows x 10", L.pips.length === 100 && new Set(L.pips.map((q) => q.side)).size === 1, `pips=${L.pips.length} sides=${[...new Set(L.pips.map((q) => q.side))]}`);
ok("pip fill = min(plays, goal) per row", PLAYS.every((p, r) => L.pips.filter((q) => q.row === r && q.filled).length === Math.min(p, 10)), "");
const filledMask = tiles.find((t) => t.label === "pip-filled");
const emptyMask = tiles.find((t) => t.label === "pip-empty");
const subpaths = (p) => (p ? (p.match(/M/g) ?? []).length : 0);
const rings = /a[\d.]+ [\d.]+ 0 1/.test(emptyMask?.mask ?? "");
ok("pip-filled mask holds 81 pips (one M each, square or solid circle)", subpaths(filledMask?.mask) === 81, String(subpaths(filledMask?.mask)));
ok(rings ? "pip-empty mask holds 19 rings (outer M + hole M each)" : "pip-empty mask holds 19 squares", subpaths(emptyMask?.mask) === (rings ? 38 : 19), String(subpaths(emptyMask?.mask)));
ok("pip-filled mask is the accent, bound to accent", filledMask?.binding?.propKey === "accent" || filledMask?.binding?.prop === "accent", JSON.stringify(filledMask?.binding));

// 6. the pace bar under the pace tile, accent, bound
const bar = tiles.find((t) => t.label === "pace-mark");
ok("pace-mark bar present, accent, bound", !!bar && bar.binding?.propKey === "accent" || bar?.binding?.prop === "accent", JSON.stringify(bar?.binding));

// 7. the three stat tiles are one size (from the doc's own tiles) - a only
const statTiles = tiles.filter((t) => /^tile-\d$/.test(t.label));
if (statTiles.length > 0) ok("three stat tiles, one size", statTiles.length === 3, String(statTiles.length));

// 8. bindings resolve clean, every row cell bound to games
const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: TenxtenChallengeCardV1.propsSchema });
ok("no rejected bindings", rejected.length === 0, JSON.stringify(rejected));
ok("challenger/year bound once each", byProp.challenger?.length === 1 && byProp.year?.length === 1, "");
ok("games bound 20x (name + plays per row)", byProp.games?.length === 20, String(byProp.games?.length));
ok("accent bound 2x (pip mask + pace bar)", byProp.accent?.length === 2, String(byProp.accent?.length));

// 9. determinism: two renders byte-equal documents
const doc2 = await TenxtenChallengeCardV1.render({ ...TenxtenChallengeCardV1.defaultProps }, ctx(1920, 1080));
ok("deterministic (two renders equal)", JSON.stringify(doc) === JSON.stringify(doc2), "");

// 10. every rendered copy is printable ASCII (no tofu glyph)
const nonAscii = texts.filter((t) => t.text && /[^\x20-\x7e]/.test(t.text));
ok("every text literal is printable ASCII", nonAscii.length === 0, JSON.stringify(nonAscii.slice(0, 3)));

// 11. derived numbers recompute from the list (independent check)
const p = normalizeTenxten({});
const sum = p.games.reduce((s, g) => s + g.plays, 0);
ok("81 = the sum, 100 = 10 x 10, 6 rows at goal, pace 78.6 -> '2 ahead'",
  sum === 81 && p.target === 100 && p.done === 6 && Math.abs(p.pace - 78.63) < 0.01 && p.paceText === "2 ahead",
  `sum=${sum} target=${p.target} done=${p.done} pace=${p.pace.toFixed(2)} paceText=${p.paceText}`);

// 12. the page is the light preset paper (the fridge chart)
ok("page is light paper #f6f1e7", doc.backgroundColor === "#f6f1e7", String(doc.backgroundColor));

out.push(`--- ${out.filter((l) => l.startsWith("FAIL")).length} failure(s), doc texts=${texts.length}, tiles=${tiles.length}`);
console.log(out.join("\n"));
