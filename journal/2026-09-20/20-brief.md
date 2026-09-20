# Brief — 2026-09-20

## The use case (two sentences, from the scout)

Developers who publish from a build pipeline need a 1200x630 preview image
(`og:image`) for every post, docs page and changelog entry, regenerated
whenever the title changes; today that means a Figma card per post or a
headless browser / paid screenshot API in the build. The inputs are five
strings that already live in the post's front matter.

## The template

- id: `@one-a-day/dev/og-card/v1` (new pack `dev`: templates a developer
  runs from a build step or a terminal, fed by the repo's own metadata -
  cards, badges, banners; none of the existing vocabulary says "runs in CI")
- title: OG Card (displayed as "2026-09-20 · OG Card": the date is the ordinal)
- kind: image (png); canvas hint 1200x630 (the Open Graph standard); must
  also hold at 1920x1080, 1080x1080 and 1080x1920 (the gate's three, and
  the square / story crops people re-make by hand)
- duration: still

## Layout (regions, ratios, what goes where)

All sizes derive from `S = min(H, 0.75 * W)` (the chrome rule from the
knowledge base: never a fraction of H alone, or portrait grows a slab) and
`m = 0.08 * S` (margin). Text is fitted with the measured svg helpers, so
the cells are carved to the MEASURED block, not the other way round.

```
1200x630                                   1080x1920 (story)
+------------------------------------+     +--------------+
|#### accent bar (full width) #######|     |##############|
|                                    |     |              |
|  KICKER                            |     |              |
|  Title up to three lines,          |     |  KICKER      |
|  large, left-aligned               |     |  Title ...   |
|  Summary, one or two lines, muted  |     |  Summary ... |
|                                    |     |              |
|  site.example        by Author     |     |              |
+------------------------------------+     |  site   by A |
                                           +--------------+
```

- accent bar: full width, top, `h = max(4px, 0.012 * S)`; a lavfi colour
  tile (`makeColorTile`) bound to `accent`.
- text block: left-aligned, inside `[m, W - m]`; rows kicker / title /
  summary with gaps of `0.25 * titlePx`; the block is vertically centred
  between the bar and the footer row (so portrait does not spread the rows).
- footer row: `y = H - m - footerH`, `footerH = 1.4 * footerPx`; `site` left,
  `author` right, each in its own cell (half the width each), muted ink.
- backgrounds: `doc.backgroundColor` (no base tile).
- geometry: `placeInsetPieces` at the head (this is a head template that owns
  its canvas; absolute px are the right currency, the same as the scaffold).

Font caps (px, from `S`): kicker 0.034, title 0.115 (3 lines max), summary
0.042 (2 lines max), footer 0.036. Every fit uses the template-utils
measured search, so a 90-character title shrinks before it clips.

## Layout contract (added with the convention, same day)

Every text fits its box (measured against the bundled font, so the ruler is
the true width); the band spans the full width on the bottom edge and holds
the footer; the title stays inside the margins, at least half the canvas
wide, above the band. Swept at the seven contract canvases for the default
copy, the 106-character title, emptied rows and the light preset.

## Props (name · type · default · what it changes · required?)

| name | type | default | what it changes | required |
|---|---|---|---|---|
| title | string | "Ship a preview image for every post" | the headline, 1-3 lines, bound | yes (has a default) |
| summary | string | "One props file in, one 1200x630 PNG out. No browser, no API key, the same bytes every build." | the muted line under the title; empty removes it | no |
| kicker | string | "ENGINEERING BLOG" | small accent-coloured label above the title (a section, a tag); empty removes it | no |
| site | string | "example.dev" | footer left (domain or site name); empty removes it | no |
| author | string | "by one-a-day" | footer right; empty removes it | no |
| accent | string (color) | "#2f81f7" | the bar and the kicker colour | no |
| preset | "dark" \| "light" | "dark" | hand-tuned background / ink / muted trio | no |
| background | string (color) | "" (placeholder: preset background) | overrides the preset background | no |
| ink | string (color) | "" (placeholder: preset ink) | overrides the title ink | no |

Nine props. No media prop in v1 (a logo is the obvious v2; it must stay
optional and the gate renders with nothing supplied).

Validation in `render()`: `title` must be a non-empty string (throw);
every colour must be `#rrggbb` or empty (throw); `preset` outside the set
falls back to "dark".

## Beats

None - a still.

## Defaults must show

A dark card: a blue bar across the top, "ENGINEERING BLOG" in blue small
type, a two-line white title, a muted two-line summary, "example.dev" bottom
left and "by one-a-day" bottom right. A stranger reads it as a link preview.

## Acceptance rubric (the critic scores against this)

1. Renders at defaults on 1200x630, 1920x1080, 1080x1080 and 1080x1920 with
   exit 0 - no error mosaic, no clipped text, no empty canvas.
2. A 90-character title and a 160-character summary still fit (the fitter
   shrinks, the block never overlaps the footer) at all four canvases; the
   test locks this.
3. Every prop that is drawn is bound to its rect (title, summary, kicker,
   site, author as text; accent on the bar): `resolvePropBindings` rejects
   nothing and finds each.
4. Deterministic: two renders of the same props are deep-equal; an empty
   title and a bad colour throw with a readable message.
5. Aspect honesty: on square and portrait the block stays left-aligned and
   vertically centred, margins scale with `min(H, 0.75W)`, the footer sits
   on the bottom margin, nothing collides.

## Variants worth trying (up to 3, each ONE idea different)

- a: accent bar across the top (the brief above).
- b: accent bar as a vertical rule on the LEFT of the text block (editorial),
  the top edge plain.
- c: the footer becomes an accent-coloured band across the bottom with site
  and author in on-colour ink; no top bar.
