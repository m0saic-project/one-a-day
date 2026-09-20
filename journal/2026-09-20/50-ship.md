# Ship — 2026-09-20

## @one-a-day/dev/og-card/v1 — OG Card

An Open Graph preview card from five strings: title, summary, kicker, site,
author, plus an accent colour and a light/dark preset. Aimed at developers
who publish from a build pipeline and need an `og:image` per post without a
headless browser or a paid screenshot API: feed it the front matter as a
props file and get a 1200x630 PNG whose bytes only change when the words
do. The same props lay out 1080x1080 and 1080x1920 for the square and story
crops. Variant c shipped: the accent is a full-width band on the bottom
edge carrying the footer, the one accent that survives thumbnail scaling.
Preview at `assets/templates/@one-a-day__dev__og-card__v1/preview.png`
(1920x1080, minted on the paid tier, no stamp). `npm run verify` green,
`m0saic doctor . --json` ok with zero warnings, `--validate-only` exit 0.

## Render it

```
m0saic make @one-a-day/dev/og-card/v1 --template-repo . -w 1200 -h 630 -o og.png
```

Props worth trying:

```
--props '{"title":"Postgres row-level security, explained with one table","summary":"Policies, roles, and the two mistakes that leak rows.","kicker":"DATABASE","site":"blog.example.dev","author":"by Jo Example"}'
--props '{"preset":"light","accent":"#dc2626","kicker":"RELEASE 2.4"}'
--props '{"kicker":"","summary":"","author":""}'          # rows disappear, the band stays
--props @post.json -w 1080 -h 1920 -o story.png           # the story crop from the same file
```

## Weak spots (honest; a human polish pass starts here)

- The kicker is inked with the raw accent, so a pale accent on the light
  preset reads faintly (yellow on white in
  `variants/c/stills/stress-light-1200x630.png`). Derive a darker text
  accent, or fall back to the muted ink below a contrast floor.
- White on the default blue band is about 3.7:1 - fine at footer size,
  not generous. A stronger default accent, or a luminance threshold that
  flips earlier, would help.
- `lattice: { canvas: "physical" }` is declared because 630 carries a 7.
  The type's doc gives print trims as the example; a platform-mandated
  pixel size is the same situation in spirit, but it is a judgment call.
  The construction itself is 5-smooth (`INSET_BASIS = 90`: pitch 7 -> 90
  rows). The alternative is hinting 1200x600.
- No logo, no date, no avatar. Deliberate for v1 (every prop shows at
  defaults; the gate renders with nothing supplied), and the first things a
  real blog will ask for.
- The default copy names this repo ("by one-a-day", "example.dev"). It
  shows what the fields are for; a house style might want neutral text.

## Follow-ups (what v2 would do)

- Optional `logo` media prop, top-right, scaled to the kicker's cap height;
  optional `date` string beside the author.
- Contrast-aware kicker ink (see above), and a `bandInk` override.
- A `layout` closed set exposing today's losing variants ("top-bar",
  "left-rule", "band") - they are one rect apart and the critique's only
  objection to a and b was thumbnail legibility, which some brands will
  not care about.
- A release-notes sibling (version, date, three bullets) was candidate #4
  in the scout; it is this template with a list prop.
