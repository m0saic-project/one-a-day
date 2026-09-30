# Ship - 2026-09-30

## @one-a-day/events/homebrew-serving-card/v1 - Homebrew Serving Card

One still PNG that says what is in the keg: the beer's name, its style, its strength and who brewed it, on white with dark type and thin rules. It is for homebrewers who re-type the same three fields into a label template for every batch, keg change and club meeting; the five text props are the fields a BeerXML or Brewfather recipe export already carries (`NAME`, `STYLE.NAME`, `EST_ABV` or `ABV`, `BREWER`). The line under the number always says which kind of number it is - `Estimated ABV`, `Batch ABV`, or `Not supplied` when there is none - so a recipe estimate never passes for a measured batch and a missing value never becomes a default or a zero.

Variant a (the divided card) shipped: 15/18 against b's 14/18 in `40-critique.md`.

## Render it

```
m0saic make @one-a-day/events/homebrew-serving-card/v1 --template-repo . -w 1920 -h 1080 -o out.png
```

Props worth trying:

```
--props '{"beerName":"Kolsch No. 4","beerStyle":"Kolsch","abv":"4.8","abvBasis":"batch","brewer":"North Valley Homebrewers"}'
--props '{"abv":""}'                 the card says ABV / Not supplied
--props '{"abv":"0","brewer":""}'    a real 0%, and no brewer credit
-w 1080 -h 1920   or   -w 1080 -h 1080     name and style stack above the strength
```

Why it exists (the tutorial):

```
m0saic make @one-a-day/events/homebrew-serving-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## How the day was run

The scheduled run drew `codex-astra-ultra`. Codex (gpt-6-astra) wrote the scout and the brief, then hit its usage limit 70 seconds into the build and the day closed as a no-ship (`8cce9ea`). The founder had a Claude Code session (Fable 5.1) finish it: build call 4, the critique and this ship phase, from Codex's brief. `run.json` `runner.session` has the account; the tutorial's third caveat says it on the card; `60-token-costs.md` has what each half cost. The same session retired the Codex roster slots (maintain `0a0fb74`) and fixed the reader that lost this day's `run.json` to a UTF-8 BOM (maintain `92a346e`) before it started on the template.

Checked at ship, on the final source: `npm run verify` green (228 jest tests, 55 pipeline tests, loader contract and dependency policy clean), `m0saic doctor` ok with no finding on this template, `--validate-only` exit 0 for the card and for the tutorial, a 54 KB `preview.png` that is the landscape default.

## Weak spots (honest; a human polish pass starts here)

- **Printable ASCII only.** Kolsch, Marzen and Weissbier have to be typed without the umlaut or the eszett. The template refuses the letter with a field-named error rather than dropping it, but a brewer should not have to transliterate a style name.
- **One card, one PNG.** No sheet of tags, no paper size, no bleed, no DPI. The brewer in the evidence prints a sheet and cuts it; this does not replace that step.
- **No importer.** The mapping from a recipe export to the five props is documented, not done.
- **Portrait is half white.** The groups are sized from the short side and centred, so a 9:16 page leaves a lot of empty space above and below each.
- **The landscape divider runs the full body height** while the text beside it is centred; it is taller than anything it separates.
- **The fit prefers size over line count.** A long style line wraps to two large lines before it shrinks to one smaller line.
- **Odd canvases are untested beyond the seven.** The defaults fit any sane canvas; 48 wide glyphs in every field are only promised at the contract set, and render() throws a field-named error when a block cannot reach the floor.

## Follow-ups (what v2 would do)

- Accept Latin-1 letters once the glyph coverage of the bundled font is confirmed by the gate.
- A `tag` layout sized for a hanging keg tag, and a sheet template that lays out N cards from a list for one print run.
- A small `beerxml-to-props` script beside the template (outside `render()`), choosing `ABV` with basis `batch` when present and `EST_ABV` with `estimated` otherwise.
- An optional second strength line (IBU or OG/FG) only if a brewer asks; the card is deliberately three facts.
