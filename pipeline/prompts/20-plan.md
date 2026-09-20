Turn today's pick into a buildable spec. Read `{{DAY_DIR}}/10-scout.md` first.
You are the planning agent: you decide WHAT gets built, not how to code it.

## Think in m0saic terms

- The canvas is rectangles. Decide the layout as regions with ratios, not pixels.
  Name the hinted canvas (1920x1080 / 1080x1920 / 1080x1080) and which other
  aspects must still work (the gate renders landscape, portrait and square).
- Still or video? If video, what is the duration source (`ctx.target.durationMs`
  is the only clock) and what are the beats?
- What does the user supply? Text props, numbers, colours, a list, a media file?
  Every optional prop needs a deterministic default that makes the template
  show what it does at defaults (the build gate renders it with no inputs).
  Keep it to the few props that matter — five to ten, not thirty.
- Text: the rendered copy must fit its cell (there is a textFits gate) and use
  ASCII in defaults.
- The layout contract: say what the geometry PROMISES, as canvas-independent
  invariants the build will sweep at seven canvases (AGENTS.md "The layout
  contract"): every text fits; where the chrome lives (a footer band in the
  bottom 40%, a full-width bar, a square mark); what must be present. Pin an
  exact fraction only when the use case asks for it.
- Pack: prefer an existing pack under `src/` or one from this vocabulary:
  {{PACKS}}. A new pack needs one sentence of justification. Slug: lowercase,
  dashes, says what it is.

Look at two or three neighbours before you spec: `template-manifest.json`
lists every template here; the starter curriculum and the official library are
linked from `AGENTS.md`. Mirror shapes that exist.

## Output — `{{DAY_DIR}}/20-brief.md`

```
# Brief — {{DATE}}

## The use case (two sentences, from the scout)
## The template
- id: @one-a-day/<pack>/<slug>/v1   (new pack? why, in one sentence)
- title: <Human Title>   (the scaffold prefixes the date: "YYYY-MM-DD · Title")
- kind: image | video; canvas hint WxH; aspects that must work
- duration: <n> ms from ctx.target, or "still"
## Layout (regions, ratios, what goes where; a small ASCII sketch is welcome)
## Layout contract (the invariants the build sweeps: text fits, bands, presence)
## Props (name · type · default · what it changes · required?)
## Beats (video only: t=0…end, what moves)
## Defaults must show: what a viewer sees with no inputs
## Acceptance rubric (the critic scores against this)
1. …
5. …
## Variants worth trying (up to {{VARIANTS_MAX}}, each ONE idea different: a layout, a motion, a palette — not a rewrite)
```

Then set `state.json` keys `pack`, `slug`, `title` and finally `plan: "done"`.
