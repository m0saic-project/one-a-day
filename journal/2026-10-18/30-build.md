# Build - 2026-10-18

## Template: @one-a-day/gaming/wh40k-roster-card/v1

## Variant a - dark datacard portrait list / landscape two-column

- **Gate:** clean (check-freeze, tsc, check-registry, check-layout, check-why all pass).
- **Render:** ok - landscape, portrait and square all exit 0, no degraded flag.
- **Stills:**
  - **landscape.png:** 1920x1080, two-column unit grid (3 rows x 2 cols), header with "Strike Force", faction/detachment, red points pill "815/2000", footer totals and "BattleScribe Roster".
  - **portrait.png:** 1080x1920, single tall list, HQ row shows model-count chip "x1", enhancement "Artificer Armour" pill and "WARLORD" pill; all six category badges present.
  - **square.png:** 1080x1080, centred single column, same chips visible.

## Variant b - light "print checklist" palette

- **Idea:** flip `preset` default to `"light"`, keeping the same layout and accent (#c0392b).
- **Gate:** clean.
- **Render:** ok.
- **Stills:** light page/row background with dark ink; red badges and points pill still read clearly. The credit and totals remain anchored to footer corners.

## Why-tutorial

- **Problem page (tutorial-2):** quotes Goonhammer ("BattleScribe printouts are ten pages long and practically illegible"), the Reddit observation that screenshots contain more info than needed to critique a list, and the prototype app built because native sharing was poor; lists the four sources opened.
- **Solution page (tutorial-3):** states the card turns faction, detachment, points and unit rows into a single share card, keeps a factual design with no GW art/stat blocks/rule text, and switches to two columns in landscape.

## What was hard

- The row layout has a lot of right-hand chrome (points, optional warlord/enhancement chips, model count). On small canvases the chips had to drop in order (enhancement first, then warlord, then model count) so the unit name never hits the floor first.
- Keeping the header sub-line inside the [0,0.26] band required anchoring it to the bottom of the header and shrinking the army-name cap; the first attempts let the sub-line drift below 26%.
- `bindPropPath` does not accept a nested `boolean` kind, so `warlord` is represented as a string chip (type "WARLORD") rather than a true boolean field.

## Revision 1 - variant c
- The verdict said: default `pointsUsed` is 815 but the brief demands 1995/2000, and why-tutorial page 6 omits the build phase while understating cost/tokens by >10x.
- Changed: raised `DEFAULTS.pointsUsed` to 1995 and rescaled the six default units so their points sum to 1995; the header pill, footer totals and unit points now read 1995/2000 across landscape, portrait and square. Replaced `WHY.timeline` with the runner's trace (`node pipeline/lib/trace.mjs --timeline journal/2026-10-18/trace.json`), so tutorial-6 shows scout, plan, build and critique with 201 calls, 15.4M tokens, $4.14 and ~1h 42m wall time.
- Also fixed: added a unit test asserting the default props match the briefed 1995/2000 army; re-rendered the layout fingerprint after the points change; ran the full `npm test` suite (all 555 tests pass, including the template's 12).
- Still weak: the brief planned variant b as a landscape-only two-column grid and c as the light palette, but the template switches layout by aspect ratio, so the "landscape two-column" behaviour is folded into the default render rather than a separate variant. Variant c is therefore the light tournament-checklist palette.

## Revision 2 - variant d
- The verdict said: the why-tutorial "how it was made" page still omits the revision build phase; WHY.timeline has four phases while trace.json has five, so the cost/token/call/wall-time totals are wrong.
- Changed: regenerated WHY.timeline from the runner's current trace (`node pipeline/lib/trace.mjs --timeline journal/2026-10-18/trace.json`) and pasted all six phases - scout, plan, build, critique, build (2), critique (2) - into the template. `tutorial-6.png` now reads "6 phases - 2h 11m wall time - 281 tool calls - 18.8M tokens - $5.07" and lists build (2) and critique (2), matching trace.json totals.
- Also fixed: verified the header pill, footer totals and unit points still read 1995/2000 across landscape, portrait and square; re-ran `npm run build` (clean), `npm test` (555 passed) and `npm run fingerprints:update` (unchanged); rendered variant d with no degraded flag.
- Still weak: on the landscape two-column still the HQ enhancement chip "Artificer Armour" is dropped while the warlord chip remains, because the narrower row drops optional chips in order. It is the documented fallback and the chip is visible in portrait and square, but a user editing only the landscape render might miss it.

## In place now: d

The corrected source is in `src/gaming/wh40k-roster-card/v1/` (default dark datacard). Variant d is rendered at defaults and the why-tutorial page 6 now shows all six phases from the runner's trace with the correct totals. `npm run build` is clean, `npm test` is green, and the layout fingerprint is unchanged.
