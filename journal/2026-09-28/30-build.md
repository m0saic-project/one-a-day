# Build - 2026-09-28

## Template: @one-a-day/events/bird-walk-sightings/v1

Implemented the brief in `src/events/bird-walk-sightings/v1/`: typed inputs, fictional defaults, whole-array validation, eight-entry page selection, ordered name/count pairs, X legend, measured wrapping without ellipsis, editable field bindings, and a label-based layout contract. The source, test and intended layout fingerprint are in place. Registry wiring and generated dist/manifest are built.

## Variant a - ruled paper | gate: clean for this template | render: blocked | stills: none

White paper, forest-green heading/rules, dark ink and thin row separators. Portrait/square use eight rows; landscape uses four rows per column, reading left then right. Empty slots are blank. Header/footer height is capped by the shorter canvas side; names use a wider rail to preserve 48-character identifiers at the smallest tested size. Counts occupy 16% of the column.

`npm run build` passes, including registry, layout and why gates. `npm run fingerprints:update` wrote only today's new fingerprint; the final build reports all 11 fingerprints unchanged. Today's template has no registry warning. The existing episode-audiogram overlay-depth warning and OG Card physical-canvas note remain unchanged.

`npm test` passes: 13 Jest suites, 168 tests, plus 41 pipeline tests. Today's 52 tests pass again after adding checks against resolved m0 rectangles. Coverage includes 1/8/9/16/17/200 rows; concatenated pages and partial-page blanks; duplicates, unidentified taxa, all-X rows and six-digit counts; invalid off-page rows; leap dates; omitted defaults versus explicit invalid inputs; bindings, determinism, nested targets, and seven-canvas sweeps with long spaced/unbroken wide-letter strings. Both authored and resolved text cells are checked for overlap and name/count adjacency. Essential type never falls below 8 px on the tested canvases.

The required render command was run twice as-is, with over one minute between failures:

```text
node pipeline/render/render-variant.mjs @one-a-day/events/bird-walk-sightings/v1 journal/2026-09-28/variants/a
```

Both attempts passed their build and failed at the CLI's validation/planning stage:

```text
Failed to resolve source masks: EPERM: operation not permitted, open
C:\Users\MainDesktop\m0saic\cache\masks\mask-bc4529258f520562.png
```

This cache is outside the writable workspace. Approval is unavailable in this run. `M0SAIC_ROOT` was never set or redirected. No image, tutorial video, still or source snapshot was produced by the renderer. The report has `ok: false`, `validate.code: 1`, and empty renders/stills; this is a failed render attempt, not an error-mosaic/degraded image. See `render-a.log`, `render-a-retry.log`, `render-a-first-report.json`, and `variants/a/report.json`.

Do not interpret the clean build as visual approval. The portrait, square, landscape, 480x270 and tutorial images still need to be rendered and inspected. No b/c alternative was built because there is no baseline picture to judge.

## Why-tutorial

Problem page: quotes the sanctuary's twice-weekly checklist workflow and explains the poor printed webpage, personal export, normalization boundary and X semantics, using the scout's opened links.

Solution page: explains eight-entry pagination, exact input order, persistent range/X disclosures, fictional defaults, and the requirement to supply all outing rows and render every page before posting.

All six steps pass the why gate, but their pixels have not been inspected. Timeline remains the scaffold's scout/plan snapshot; ship must refresh it from the finished trace. The scaffold initially left agent/model placeholders because the PowerShell-written run.json had a UTF-8 BOM. Removed that BOM and filled the existing journal values (`codex`, `gpt-6`); `model.corrected` was preserved.

## Reproducible props and page selection

`example-page-2.json` is a complete, fictional nine-entry outing with `page: 2`. Its only displayed row should be Downy Woodpecker / 1; the footer should say `Page 2 of 2` and `Entries 9-9 of 9`.

```text
m0saic make @one-a-day/events/bird-walk-sightings/v1 --template-repo . -w 1080 -h 1920 --props @journal/2026-09-28/example-page-2.json -o journal/2026-09-28/example-page-2.png
m0saic make @one-a-day/events/bird-walk-sightings/v1 --template-repo . -w 480 -h 270 --props @journal/2026-09-28/stress.json -o journal/2026-09-28/stress-480.png
m0saic make @one-a-day/events/bird-walk-sightings/v1 --template-repo . -w 480 -h 270 -o journal/2026-09-28/default-480.png
```

These extra image commands are handoff instructions, not successful renders. For real data, group MyEBirdData.csv by Submission ID, map Common Name/Count/Location/Date/Time/Number of Observers, convert numeric strings to numbers, and preserve uppercase X. Supply the entire outing array on every page. Change page to 1 in the example to render its first eight entries.

## What was hard

- Square needs shorter chrome so two-line boundary names retain readable type. At 480x270, 24 W glyphs measure 170.34 px at 8 px: a 170 px fitting budget caused a third line; widening the name rail fixed it without changing the ruler or capacity.
- Measure bold counts against the bold font, and test actual resolved rectangles as well as author geometry. Cache permissions prevented the final pixel check even though all pure gates passed.
- Use BOM-free JSON for the journal: the scaffold silently lost run metadata when JSON.parse encountered a BOM.

## In place now: a (source only; render blocked)

The build phase is deliberately NOT marked done. Resume by retrying the renderer after the normal m0saic cache is writable, inspect all required images/tutorial pages, and only then complete the ledger. No no-ship decision is made here: this is an environment blocker, not a failed template gate or visual judgment.

## Resumed build call

Retried the required render-variant command without changing source, cache location, or runtime settings. Its build passed again; validation failed with the same EPERM on `C:/Users/MainDesktop/m0saic/cache/masks/mask-bc4529258f520562.png`. This is the third recorded failure across the two build calls. `render-a-resume.log` records this attempt, and `variants/a/report.json` again reports `ok: false`, validation exit 1, zero renders/stills, and no source snapshot.

The active sandbox permits writes only within the workspace and temporary directories; the normal runtime cache remains outside that scope, and approval is unavailable. No cache redirection or permission change was attempted. Prior tests and fingerprints remain applicable because source is unchanged. Required visual inspection remains outstanding, so `build` is still unset.

## Second resumed build call

Re-declared `gpt-6` in run.json, preserving other metadata and BOM-free JSON. Retried the required render-variant command as-is. The fourth recorded attempt passed the build, then failed at validation with the same EPERM opening `C:/Users/MainDesktop/m0saic/cache/masks/mask-bc4529258f520562.png`. See `render-a-resume-2.log` and `variants/a/report.json`: build exit 0, validation exit 1, `ok: false`, zero renders/stills, and no source snapshot.

Source and layout fingerprints are unchanged. The normal runtime cache is still outside this run's writable scope; no permitted template change resolves that environment blocker. No further retry or cache workaround was attempted. Visual inspection remains outstanding and `build` remains unset, following the phase's instruction to stop on an issue outside its scope.
