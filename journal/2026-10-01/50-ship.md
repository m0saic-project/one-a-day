# Ship — 2026-10-01

## @one-a-day/sports/swim-time-drop-card/v1 — Swim Time Drop Card

One still PNG per swimmer per meet: for each event the entry time, the time swum, the drop in seconds with its sign, a bar, and the standard reached, then `5 of 6 swims faster` and the seconds dropped in total. It is for age-group swim club coaches and parent volunteers who type time drops and new cuts into a meet recap by hand after every meet (the Wave, CATCC and Maverick pages in [`10-scout.md`](10-scout.md)). The input is what a results row already holds: `swims: [{ event, entry, final, standard? }]`, 1 to 8 rows, plus the swimmer, club, meet, a details line, the course, an accent colour and a preset. The bar is the share of the entry time dropped and prints that percent at its end, so a 50 and a 200 compare fairly and nobody has to find the footnote to see why `-0.87` outranks `-4.01`. A slower swim is printed with a plus sign in the same ink and gets an empty track.

Variant c shipped: 17/18 against a's 16 and b's 15 (b had a tutorial page describing a's default) in [`40-critique.md`](40-critique.md). It was already in place, so no code moved.

## Render it

```
m0saic make @one-a-day/sports/swim-time-drop-card/v1 --template-repo . -w 1080 -h 1080 -o out.png
```

Props worth trying:

```
--props '{"swimmer":"Zoë Hartwell","course":"LCM","accent":"#e4572e","preset":"light","swims":[{"event":"100 Free","entry":"1:10.52","final":"1:08.31","standard":"BB"},{"event":"200 IM","entry":"NT","final":"2:54.02"},{"event":"100 Breast","entry":"1:31.20","final":"DQ"}]}'
                                 a first swim and a DQ: printed, not counted (scratch/ship-props.png)
--props '{"bar":"seconds"}'      bars in seconds dropped; the labels go and the footnote names the longest
-w 1920 -h 1080                  the bars move into a column between FINAL and DROP
-w 1080 -h 1920                  portrait: the bar under each row, summary stacked
```

Why it exists (the tutorial):

```
m0saic make @one-a-day/sports/swim-time-drop-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## From a results file to `swims`

The template does not read `.hy3` or `.cl2`. Someone else has to parse the meet results file and look up the standards; this card starts where that ends. For one individual result of one swimmer:

| prop | from the result row |
|---|---|
| `event` | distance + stroke, as the club writes it (`50 Free`, `200 IM`), up to 24 characters |
| `entry` | the seed time, `"31.84"` or `"1:10.52"`; `"NT"` (or omitted) when there is none |
| `final` | the time swum, same formats; `"DQ"` for a disqualified swim |
| `standard` | not in the file: the caller looks it up for the swimmer's age, sex, course and season, up to 4 characters |

Relays are left out (a relay result has no entry time per swimmer). A swimmer with more than eight individual swims needs two cards; the ninth row is refused by name.

## What the ship phase changed

Three edits to the picked source, all before the folder freezes. [`variants/c/src/`](variants/c/src/) is the snapshot the critic judged and was left as it was.

- **The description** in the template and in the `src/sports/registry.ts` row said "a bar whose scale the footnote names", which was variant a. It now says "a bar that prints the percent of the entry time it stands for" (critique item 1).
- **`BAR_LABELS`** was a module constant that was always `true`; the untaken branches were variant a's thin strip and footnote. They are removed (critique item 4). The renders at 1920x1080, 1080x1920 and 1080x1080 are byte-identical to the ones in `variants/c/renders/`, and the layout fingerprint did not change.
- **`WHY.timeline`** now holds all four phases from `trace.json`, pasted from `pipeline/lib/trace.mjs --timeline` (critique item 2). The tutorial's last page reads `4 phases - 1h 7m wall time - 176 tool calls - 39.0M tokens - $24`. The build bar is red: that phase ran 56 minutes against a 45 minute cap and the runner cut it off (`status: "error"` in the trace). It had already written its output and marked itself done. This ship phase is not on the page; the timeline freezes with the folder before the phase that writes it has ended.

Checked on the final source: `npm run verify` exit 0 (16 jest suites, 261 tests; 56 pipeline tests; loader contract and dependency policy clean), fingerprints 14 unchanged, `m0saic doctor . --json` `ok: true` with no finding on this template, `--tutorial --validate-only` exit 0 (59 s, six pages). `preview.png` is the 1920x1080 default card, 171 KB; I looked at it and at the tutorial's timeline page (`scratch/ship-tutorial-6.png`). It is an image template, so there is no blank first frame to worry about.

## Weak spots (honest; a human polish pass starts here)

- **No reader, no standards.** The recap this replaces is one team-wide post. A parent can type six rows; a coach with 100 swimmers needs a parser and a standards table that today does not deliver. This is the critic's lowest line and it is still true.
- **The square is the tightest canvas, and it is the hinted one.** At 1080x1080 the percent labels are 23 px with six rows and 16 px with eight, the smallest data on the card; the standard chips sit about 4 px above the track.
- **A lone faster swim fills its track.** The longest bar on a card is always full width, so with one faster swim the bar says nothing the label does not (`scratch/ship-props.png`). Bars compare one swimmer's swims with each other, never two cards.
- **"vs entry time" is not "best time".** The seed is not always the swimmer's fastest earlier swim. The card says what it compares and claims nothing more, but a parent may read it as a personal best.
- **Few rows leave the card empty.** Rows are capped in height, so one or two swims sit at the top of a mostly empty square, and portrait with six rows leaves a band of about 100 px above the summary rule. The brief chose that over slabs.
- **Long event names shrink the event column.** `400 Individual Medley` drops it to 24 px in the square with eight rows; the template does not abbreviate.
- **The default chips are illustrative.** `BB` and `B` on the sample card were not checked against a season's table, and the sample names no age group.
- **`scaleText` in percent mode** is still computed and returned by `normalizeSwimCard`, but nothing draws it now that the labels carry the numbers.

## Follow-ups (what v2 would do)

- A small `hy3-to-swims` script beside the template (outside `render()`), built on flipturn's parser, that writes one props file per swimmer for a batch render.
- A standards lookup as data the caller passes (a table per season), so the chip is checked instead of typed.
- A second comparison when the file has it: the swimmer's best time before the meet, labelled as such, beside the entry time.
- Larger bar labels in the square at seven and eight rows, or two cards by default above six.
- A team sheet: the top N drops of the meet on one card, which is what the club recap actually posts.
