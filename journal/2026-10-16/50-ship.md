# Ship - 2026-10-16

## @one-a-day/gaming/commander-deck-spotlight/v1 - Commander Deck Spotlight Card

A still share card for a Magic Commander/EDH deck, built from the fields a
Moxfield/Archidekt/ManaBox export already shows: kicker, bracket and record
pills, deck name, commander line with WUBRG mana chips, an eight-bucket mana
curve with derived AVG MV and spell count (computed from the buckets - 179/63
= 2.84 at defaults - never typed), 3-6 highlight rows and the plan one-liner.
For players posting "rate my deck" digests in chats and tournament coverage;
inputs are plain props, deterministic, so a game-night lineup is one CLI loop.

Shipped variant is **a** (vertical histogram left, highlight rows right) - the
critic's pick and already in place, so no copy was needed. Variant b (swapped
body axes) stays in the journal; its why-tutorial described a's geometry, which
was fatal for it.

## Render it

    m0saic make @one-a-day/gaming/commander-deck-spotlight/v1 --template-repo . -w 1920 -h 1080 -o out.png

Props worth trying: --props '{"curve": [0, 0, 0, 0, 0, 0, 0, 4], "highlights": [{"name": "Sol Ring", "note": "the classic", "qty": 1}], "manaIdentity": "UB", "preset": "light"}'

- `curve`: 8 counts for MV 0..7+; AVG MV and the spell count follow the buckets
- `highlights`: 3-6 rows of { name, note, qty }
- `manaIdentity "UB"` drops the chips to two; `""` removes the chip row
- `-w 1080 -h 1920` for the phone view: the body stacks, curve over highlights

Why it exists (the tutorial):

    m0saic make @one-a-day/gaming/commander-deck-spotlight/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4

## What ship did

- Refreshed `WHY.timeline` from `trace.json` and rebuilt - the tutorial's page
  6 now shows all four phases (critique dock #1: the build bar was missing;
  it is the day's biggest at 75 min / $0.25 and now appears).
- Lint fix in the test: the independent spell-count recomputation is now
  asserted against `L.spells` (was an unused binding). Mirrored into
  `variants/a/src/` so the snapshot matches what ships.
- Verified: `npm run build && npm run previews && npm run build &&
  npm run fingerprints:update && npm run verify` all green (509 jest + 68 node
  tests, lint, bundle, contract, deps); fingerprints unchanged (0 written).
  `m0saic doctor . --json` reports `"ok": true`; `--tutorial --validate-only`
  exits 0.
- Browse card checked: `assets/templates/@one-a-day__gaming__commander-deck-spotlight__v1/preview.png`
  is the 1920x1080 defaults render (102 KB, identical to the clean landscape
  render in variant a's report.json). Image template - no blank-first-frame
  risk.

## Weak spots (honest; a human polish pass starts here)

- No card art, no network: every existing tool puts Scryfall art at the center
  and a member may ask "where's my commander's art?" - this is rectangles and
  numbers only.
- The color prop is named `manaIdentity`, not the brief's `colorIdentity`: the
  `colorProps` convention matches `/color/i` and demands a swatch picker,
  which is wrong for WUBRG letters. The ui.label still reads "Color identity"
  and the tutorial teaches the real name, but a CLI user following the brief
  gets one failed render before finding it.
- The B pip is near-black on the dark preset - it reads at preview size (the
  letter carries it) but at 480x270 it may pass for a gap; a hairline border
  if it disappears.
- Mana values and bracket are not in the raw export lines; the player reads
  them off the builder UI and passes them as props.
- Doctor's `catalogSidecar` finding (conventions since 0.3.1) applies to all
  31 templates in the repo including this one; the build gate does not
  require a sidecar yet and none of the recent ships carry one. Not fixed
  here to stay with repo practice.
- The build phase call ran 75 min and timed out once (its trace entry carries
  `status: "error"`); the work landed and the gate is green, but the wall
  time is the day's cost story.

## Follow-ups (what v2 would do)

- An optional user-supplied art slot (a source image prop, still no network)
  behind the header band, off by default.
- Variant c's motion probe on a clip-native day: bars grow from the axis, rows
  stagger in, hold on the full card - the still must stay readable as its
  final frame.
- A catalog sidecar the day the repo adopts the 0.3.1 convention.
- Parsing aid: a documented mapping from a Moxfield/Archidekt export block to
  the `curve`/`highlights` props (docs, not code - the template stays
  deterministic and offline).

## Tokens and costs

Per `trace.json` / `token-costs.json`, through critique (this ship call is not
in the snapshot yet): 189 calls, 14,339,817 tokens, **$0.41 reported** by the
CLI - not an estimate; no dated rates needed. Build dominates: 11,259,454
tokens / $0.249 / 75 min wall (one timed-out call that finished its work).
Scout 833k / $0.056, plan 701k / $0.042, critique 1,546k / $0.063. Missing
token usage: 0 phases; missing cost: 0 phases. OpenCode Go dollars are
reported usage against plan allowance, not an additional per-run invoice.

Final totals land in [60-token-costs.md](60-token-costs.md), refreshed by the
runner after this ship call ends - the snapshot above cannot include it yet.
