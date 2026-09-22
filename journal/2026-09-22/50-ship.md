# Ship - 2026-09-22

## `@one-a-day/social/testimonial-proof-card/v1` - Testimonial Proof Card

One selected customer review, turned into a social still a local service
business can post as itself. The inputs are the review's own words (`quote`),
who said it (`customerName`, an optional `customerDetail`), what it was for
(`service`), the `rating`, the business name, and a `sourceLabel` that stays on
the card. The quote is the largest measured rectangle; everything else is
proof attached to it, not decoration. The default badge says SAMPLE REVIEW and
the default disclosure says "verify source", so a render with untouched props
cannot pose as a published endorsement. A quote that will not fit five measured
lines fails the render instead of clipping - the excerpt is edited upstream,
by a person, which is the point.

**How this day shipped.** The agent (Codex) built and tested this template, and
the critic scored it 13/18 with no fatal flaw, but the day was recorded as
failed: a transient permission error on the shared m0saic mask cache led the
agent to redirect `M0SAIC_ROOT` into the journal, and under that fresh root
every why-tutorial render stalled (the root has no license or toolchain).
Then a stray `out.validate.json` at the repo root made the gate call the day a
scope violation. The maintainer verified the stall was the root and not the
template (yesterday's shipped template stalls the same way under a fresh root
and renders in 29 s under the real one), fixed the pipeline for both failure
modes in `maintain 2026-09-22`, restored the source from `variants/a/src/`,
copied the runner's finished timeline into `WHY`, and ran the ship steps and
the gate by hand. The template code is the agent's; the wiring, this note and
the pack description are the maintainer's.

## Render it

```
m0saic make @one-a-day/social/testimonial-proof-card/v1 --template-repo . \
  -w 1080 -h 1080 -o review.png
```

Props worth trying:

- `--props '{"quote":"<the customer's own words>","customerName":"<name>","sourceLabel":"Google review, verified 2026-09-22"}'`
  - the real thing. Replace the SAMPLE REVIEW defaults or the card says so.
- `--props '{"preset":"dark","accent":"#c2410c"}'` - the other palette; the
  accent drives the rule, the badge, the initials mark and the service chip.
- `--props '{"customerDetail":"","service":""}'` - both optional rows yield;
  the attribution block re-lays around name and rating alone.
- `-w 1920 -h 1080` and `-w 1080 -h 1920` from the same props - landscape and
  story crops, the card re-sized around the quote.
- `--props '{"debugLayout":true}'` - the measured cells and the contract drawn
  over the card.

Why it exists (the tutorial):

```
m0saic make @one-a-day/social/testimonial-proof-card/v1 --template-repo . --tutorial \
  -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- **The contract under-promises.** The brief asked for full-width accent rule
  and footer bands; the layout contract only asserts a 50% minimum width for
  both. The render does span the card, but a regression that halved them would
  pass the contract. Tighten to the card's width, not the canvas's.
- **It cannot verify anything.** `sourceLabel` is a string the user types; a
  wrong rating or an invented quote render just as cleanly as a real one. The
  defaults make an untouched card confess; they do nothing for a dishonest one.
- **ASCII only.** The bundled font has limited glyph coverage, so a review with
  an accented name or a curly quote is refused at the prop check. Reviews are
  written by customers, who use whatever characters they like.
- **Five lines is a hard budget.** A long review has to be cut to an excerpt
  before it reaches the template; the template gives no help choosing which
  sentence.
- **The initials mark is a guess at identity.** Two initials in an accent
  square reads as an avatar; on a card that refuses invented proof, a
  placeholder that looks like a photo is a small contradiction.
- **Page 6 of the tutorial is the agent's run, not the whole day.** The
  timeline is the runner's trace: scout, plan, three build calls, critique.
  The maintainer's restore is in this note and in `git log`, not on the card.

## Follow-ups (what v2 would do)

- Full-width bands in the contract, measured against the card rect.
- A `source` enum (google, yelp, facebook, email, other) with a `verifiedOn`
  date, printed in the footer, so the disclosure is structured instead of free
  text.
- Unicode-safe text: fall back to a wider font for the quote and name, or map
  the common cases (curly quotes, accented Latin) before refusing.
- An excerpt helper: given the full review, pick the sentence window that fits
  five lines and print which sentences were cut.
- A `quotes: [...]` prop for a carousel of three cards from one render, the
  batching the r/smallbusiness thread actually asked for.
