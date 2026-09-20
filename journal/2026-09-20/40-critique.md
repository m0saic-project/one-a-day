# Critique — 2026-09-20

Judged from the stills in `variants/<x>/stills/` (landscape, portrait,
square, plus the hand-rendered 1200x630 hint for each variant and a stress
still for c), the three `report.json` files (every render exit 0, `degraded:
false`, `validate.code: 0`), the seven-test suite each variant carries, and
`node tools/check-registry.mjs --json` (0 errors; one note: the hinted canvas
is declared physical).

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 15 | no |
| b | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 15 | no |
| c | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 16 | no |

## What each variant gets right / wrong

**a — top bar.** Right: `og-1200x630.png` is exactly the card the brief drew;
the block is centred between bar and footer on every canvas, the footer sits
on the margin, the balanced title has no widow. Wrong: at the ~500px width a
link preview is actually shown, an 8px bar is a hairline and the accent does
nothing, so the card is indistinguishable from every other dark OG card.
Score 6 = 1 for that reason alone.

**b — left rule.** Right: the editorial rule anchors the block; portrait and
square (`square.png`) look composed rather than empty; the rule's length
follows the rows that exist. Wrong: same thumbnail problem as a (a 2px rule
beside the title at preview size), and with kicker and summary emptied the
rule becomes a stub beside a two-line title. Score 6 = 1.

**c — bottom band.** Right: the band is the one accent that survives
thumbnail scaling, and it makes the site name the second thing read - which
is what an `og:image` is for. Footer ink flips by luminance (white on the
blue default, near-black on the pale yellow of `stress-light-1200x630.png`);
the stress still fits a 106-character title in three lines with no clip.
Wrong: the kicker still uses the raw accent as ink, so a pale accent on the
light preset (the same stress still) reads yellow-on-white; and white on the
default blue band is about 3.7:1, fine for the footer size but not generous.

Checked for fatal conditions on all three: no degraded render anywhere; the
tests assert bindings, feasibility, exact rects, wrap counts, determinism and
thrown errors (not tautologies); every optional prop carries a default or a
placeholder (the gate's definition-time audit passed); `dev/og-card` says
what it is.

## Decision: SHIP c

## If ship: what a human polish pass should look at first

1. Kicker contrast: when `accent` is pale on the light preset, derive a darker
   ink for the kicker (or fall back to the preset's muted ink) instead of
   using the accent verbatim.
2. `lattice: { canvas: "physical" }` on a platform pixel size - confirm that
   reading of the declaration, or hint 1200x600 and drop it.
3. A `logo` media prop (top-right, optional, gate-safe) is the obvious v2; so
   is a `date` line. Keep the prop count under twelve.
4. The default copy is self-referential ("by one-a-day", "example.dev") -
   fine for a demo card, but a house style might prefer neutral placeholders.
