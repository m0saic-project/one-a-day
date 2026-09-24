# Brief - 2026-09-24

## The use case

Indie iOS and Android developers and small teams repeatedly turn raw simulator captures into branded store screenshots, then repeat the work for every screen, device size, locale, and release. They need a deterministic frame that combines one capture with localized copy and consistent branding, while leaving translation, simulator capture, store upload, and policy compliance outside the template.

## The template

- id: `@one-a-day/dev/app-store-screenshot-frame/v1` (existing `dev` pack: this is a release-pipeline asset regenerated from source inputs, like the pack's other build-step images)
- title: App Store Screenshot Frame
- kind: image; canvas hint 1080x1920; portrait is primary, and 1920x1080 landscape plus 1080x1080 square must remain deliberate compositions rather than crops
- duration: still
- output: opaque PNG; the template makes one framed store image per render and does not claim to emit every current store-mandated size

## Layout

Everything is real rectangular geometry derived from `ctx.target`. A full-canvas background carries a thin accent bar across the top. Inside a safe margin, the copy region contains a square app mark derived from the app name, the app name, a two- or three-line headline, an optional two-line subhead, and a compact slide index. The media region contains a neutral 9:19.5 rounded device shell and an inset screen viewport. The shell is generic and unbranded: no platform logo, model-specific camera island, or claim that the capture came from a particular device.

Portrait and square use a vertical stack. Portrait gives about 29% of the usable height to copy and 71% to the device stage; square gives about 36% to copy and 64% to the device stage. Landscape switches to a 42:58 split, with the copy rail on the left and the device stage on the right. Margins and gaps scale from the shorter canvas axis so the 480x270 contract canvas still has usable cells.

The supplied capture is centered inside the screen with `contain` behavior. It is never stretched or cropped; an aspect mismatch leaves a quiet accent-tinted matte inside the viewport. With no media input, the same viewport holds a deterministic generated demo UI.

```text
portrait / square                 landscape
+----------------------+          +----------------------------------+
| accent bar           |          | accent bar                       |
| mark  APP       01/05|          | copy rail       |                |
| Headline wraps here  |          | mark APP  01/05 |  +----------+  |
| Short supporting line|          | Headline        |  |          |  |
|                      |          | Supporting line |  | capture  |  |
|     +----------+     |          |                 |  |          |  |
|     |          |     |          |                 |  +----------+  |
|     | capture  |     |          |                 |                |
|     |          |     |          |                 |                |
|     +----------+     |          |                 |                |
+----------------------+          +----------------------------------+
```

## Layout contract

- Tag every rendered text source separately (`app-name`, `headline`, `subhead`, and `slide-index`) and attach an exact measured `textFits` constraint. Headline fits at up to three lines, subhead at up to two, and the other two stay on one line; no ellipsis at the font floor.
- The `accent-bar` is present, spans at least 98% of canvas width, and remains in the top 8% of the canvas.
- The `app-mark` is present and square. It remains in the copy region: the upper 40% on portrait/square and the left 48% on landscape.
- The `device-shell` and `capture` are present. The shell keeps the authored 9:19.5 aspect; on portrait/square it stays in the lower 78% of the canvas, and on landscape it stays in the right 62% and within the vertical safe area.
- The capture rect stays wholly inside the shell's screen viewport with a consistent inset. Aspect preservation is tested from source placement rather than inferred from the rendered pixels.
- The headline stays in the copy region and retains meaningful width: at least 70% of canvas width on portrait/square, or 30% on landscape. All presence, band, aspect, region, and text-fit rules are swept at the seven contract canvases.

## Props

- `sourceIds` - `media[]` - `[]` - supplies zero or one image capture; empty selects the generated demo UI - optional; reject more than one item or a known non-image input
- `headline` - `string` - `Plan your day in one tap` - primary localized promise, fitted to at most three lines - required with a default; normalize whitespace and reject empty or more than 72 characters
- `subhead` - `string` - `Tasks, focus and calendar - together.` - optional supporting localized copy, fitted to at most two lines - optional with a default; an explicit empty string removes the row, reject more than 96 characters
- `appName` - `string` - `DAYLIGHT` - app lockup text and the first ASCII alphanumeric character used by the square mark - required with a default; one line, reject empty or more than 24 characters
- `slideNumber` - `number` - `1` - first half of the compact sequence label - optional with a visible default; integer from 1 to 99
- `slideCount` - `number` - `5` - second half of the compact sequence label - optional with a visible default; integer from 1 to 99 and not less than `slideNumber`
- `accentColor` - color string - `#6558f5` - top bar, app mark, viewport matte, and small emphasis - optional with a visible default; require `#rrggbb`
- `backgroundColor` - color string - `#f3f0e8` - full canvas surface; ink is chosen for contrast - optional with a visible default; require `#rrggbb`
- `debugLayout` - `boolean` - `false` - draws the layout contract overlay for authoring - optional with a visible default

All rendered text defaults are ASCII. Bind the capture viewport to `sourceIds`, each text rect to its text prop, the slide-index rect to both number props, and the app mark/accent bar to `accentColor`. `backgroundColor` paints the document rather than a source rect, so it remains a props-panel control instead of carrying a false rect binding.

## Defaults must show

An opaque warm-cream portrait card with a slim indigo top bar, a DAYLIGHT mark and lockup, the headline `Plan your day in one tap`, the supporting line, `01/05`, and a large generic phone containing a generated task-planner UI. The demo must read immediately as a finished app-store screenshot frame, not as an empty-state card or missing-file warning.

## Acceptance rubric

1. Replacing only `sourceIds`, `headline`, and `appName` produces a credible release-ready PNG; the supplied capture remains complete, correctly proportioned, and visually dominant.
2. The default render clearly demonstrates the product without external files: headline first, app capture second, brand and sequence tertiary, with strong contrast and no fake store or device claims.
3. Portrait, square, and landscape have intentional aspect-specific compositions, and the complete seven-canvas sweep passes every text-fit, presence, band, aspect, and region invariant, including long allowed copy.
4. Invalid colors, empty required text, out-of-range sequence values, `slideNumber > slideCount`, multiple media items, and known non-image media fail fast with readable errors; no input is stretched, silently cropped, or presented as a named hardware model.
5. Identical props and target yield identical geometry and pixels; every prop represented by a source rect has a sound binding, default props render without inputs, and the document declares PNG image output.

## Variants worth trying

- **a - centered stack:** warm cream and indigo, centered device below a left-aligned copy block; the calm baseline with the simplest hierarchy.
- **b - offset stage:** keep variant a's palette and type but move the device to one side of a full-height accent panel, creating more tension without changing content or motion.
- **c - dark palette:** keep variant a's geometry exactly and test near-black, off-white, and electric cyan for stronger screenshot contrast; palette is the only changed idea.
