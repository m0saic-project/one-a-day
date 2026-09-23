# Brief - 2026-09-23

## The use case (two sentences, from the scout)

Every timed talk slot needs a countdown the speaker can see, with a wrap-up
warning, and the tools that do it live (Stagetimer, EventTimer, PresentTimer)
all agree on the shape: big digits, a yellow phase at one minute, a red phase
at thirty seconds. When the countdown has to be a FILE - an OBS scene, the AV
desk's playback deck, a phone on the podium, a slide embed, a YouTube-style
timer clip - people render it by hand with an ffmpeg `drawtext` one-liner (a
gist, a wiki page, a LinkedIn batch loop, a Python GUI all re-derive the same
`%{eif\:S-t\:d}` expression), and the OBS forums say "most people fake a
pre-stream countdown with a fixed-length video".

## The template

- **id:** `@one-a-day/events/talk-timer/v1` - NEW pack `events`, from the
  vocabulary in `pipeline/config.json`. Justification: a stage screen is
  neither a social post (`social`) nor a README picture (`dev`); event
  production media - timers, holding screens, boards - is its own family and
  this is its first member.
- **title:** `Talk Timer` (the scaffold prefixes the date:
  `2026-09-23 - Talk Timer`)
- **kind:** video, mp4. Canvas hint 1920x1080 at 30 fps - confidence
  monitors, stage screens and OBS scenes are 16:9. Must also hold at
  1080x1920 (a phone propped on the podium), 1080x1080, 3840x2160 and the
  contract's 640x360 / 480x270 floors.
- **duration:** the countdown is the clip. Natural length is
  `(seconds + holdSec) * 1000` ms - 305,000 at the defaults - authored on
  `doc.durationMs` and declared through `resolveOutputHints(props)` so a
  host seeds its Duration field from the props. An explicit user pin
  (`--durationMs`, Make's Duration field) wins, and then the countdown IS
  the pin minus the hold: a streamer who asks for a 180,000 ms clip gets a
  three minute countdown, not five minutes cut off at two. `ctx.target.
  durationMs` is never read as a pin (it echoes the hint).

## The one design decision

**The picture is a function of `t` and of nothing else, and every moving
part is a scalar gate.** A five minute clip is 9,000 frames, so anything
per-pixel (an alpha fade, a geq) multiplies by 9,000. The whole timer is
therefore built from three cheap mechanisms and no others:

1. **The bar is rectangles that ARE the remaining time.** The countdown is
   cut into equal slices (10 s for a 5 minute talk - the slice is the
   smallest of 1, 2, 5, 10, 15, 20, 30, 60, 120, 300 ... seconds that keeps
   the count at or under 30). Each slice is two colour tiles on the same
   rect: a LIT one with `overlay.enable = lt(t, k)` and a SPENT one with
   `gte(t, k)`, where `k` is the moment that slice runs out. Slices go out
   from the right; the last thirty seconds sit at the left end in red, the
   minute before them in amber, the rest in the accent. At any moment the
   number of lit slices is `ceil(remaining / slice)` - the test asserts it.
   No overlay slides, nothing fades, no track has to be drawn under it.
2. **The digits are one `drawtext` expression**, the same one every gist
   re-derives: `%{eif\:trunc(R/60)\:d\:2}:%{eif\:mod(R\,60)\:d\:2}` with
   `R = max(0, ceil(S - t))`, so the clip opens on `05:00`, flips to
   `04:59` at exactly one second, and holds `00:00` through the end hold.
   Three copies on the same rect, one per phase colour, each enable-gated to
   its window (calm / warn / final); the engine trims each to its window, so
   the three cost one clip's worth of frames, not three.
3. **The phases are thresholds, not animations.** `warnSec` (amber) and
   `finalSec` (red) are seconds-remaining, exactly as EventTimer states them
   ("yellow at the 1-minute mark and red at 30 seconds"); the digits, the
   bar's colour zones and a phase caption all derive from the same two
   numbers. At zero the `endText` word appears ("TIME"; a streamer sets
   "LIVE") and the clip holds for `holdSec`.

Frame 0 is the finished picture - `05:00` in the accent over a full bar with
its amber and red zones visible - so the browse still (frame 0, per
`tools/gen-previews.mjs`) is representative without a `STILL_FROM_VIDEO`
entry a day agent cannot add.

## Layout (regions, ratios)

Chrome scales with `S = min(H, 0.75 * W)` so portrait does not grow a slab.

```
+------------------------------------------------------------------+
| Lightning talk                                                   |  title      (header band, top ~16%)
| 5 minute slot - hard stop                                        |  subtitle
|                                                                  |
|                         0 4 : 5 9                                |  digits     (~50% of H, width-fitted to "88:88")
|                                                                  |
| [r][r][r][a][a][a][g][g][g][g][g][g][g][g][g][g][g][g][ ][ ][ ]  |  bar        (30 slices, lit from the left; ~7% of H)
| amber at 1:00 - red at 0:30 - then TIME              WRAP UP     |  footer     (rule left, phase caption right; ~8% of H)
+------------------------------------------------------------------+
```

Portrait: the same bands stacked; the digits fit the width, the bar keeps
its slice count and gets taller cells. Square: between the two.

## Layout contract (the invariants the build sweeps)

- every text fits its box - `textFitsMeasured` on the title, subtitle, rule
  line and each phase caption; the digits are measured against `88:88` (the
  widest string the expression can print) and sized to `0.85` of the fit so
  the system font drawtext uses (Arial-class, not the bundled Roboto the
  measurer knows) has room;
- `digits-*` sits in the middle band: `within: { yFrac: [0.12, 0.8] }`,
  `minWidthFrac: 0.35`;
- `seg-lit` and `seg-spent` live in the bar band: `within: { yFrac: [0.6,
  0.95] }`; presence of `seg-lit` (a timer with no bar is not this
  template);
- the header copy in the top third, the footer copy in the bottom quarter.

Nothing pins an exact fraction; the use case does not ask for one.

## Props (name . type . default . what it changes . required?)

| prop | type | default | what it changes |
|---|---|---|---|
| `seconds` | number | `300` | the countdown length; 5..21600; also the clip length (plus the hold) |
| `title` | string | `"Lightning talk"` | what the slot is; bound, so Make edits it in place |
| `subtitle` | string | `"5 minute slot - hard stop"` | the rule of the format; empty removes the line |
| `warnSec` | number | `60` | seconds remaining at which the digits and the bar turn amber; 0 = no amber phase |
| `finalSec` | number | `30` | seconds remaining at which they turn red; 0 = no red phase |
| `endText` | string | `"TIME"` | the word at zero (`"LIVE"` for a starting-soon screen); empty = none |
| `holdSec` | number | `5` | how long the clip holds at 00:00 after the countdown |
| `accent` | string | `"#3fb950"` | the calm colour (digits and bar); amber and red are fixed by the preset |
| `preset` | string | `"dark"` | `dark` (a confidence monitor) or `light` |
| `debugLayout` | boolean | `false` | check the contract and draw it over the frame |

Ten props, none required, every one showing its default. Validation in
`render()`: `seconds` an integer in range, `warnSec` and `finalSec` below
`seconds` with `finalSec <= warnSec` (0 disables either), `holdSec` 0..60,
colours `#rrggbb`, copy ASCII.

## Beats (video only: t=0 ... end, what moves)

| t | what the viewer sees |
|---|---|
| 0 | `05:00` in the accent, the full bar, title and subtitle, the rule line |
| every second | the digits change (drawtext, per frame) |
| every 10 s | the rightmost lit slice goes dim |
| `S - warnSec` (240 s) | digits turn amber, the lit tip of the bar is amber, caption `WRAP UP` |
| `S - finalSec` (270 s) | digits turn red, only red slices remain, caption `LAST 30 SECONDS` |
| `S` (300 s) | `00:00` in red, the last slice goes out, caption becomes `TIME` |
| `S + holdSec` (305 s) | end |

Nothing else moves. No fades, no slides, no per-pixel work.

## Defaults must show: what a viewer sees with no inputs

A dark 16:9 frame, `Lightning talk` and `5 minute slot - hard stop` top
left, `05:00` large and green, a 30-slice bar fully lit with three red and
three amber slices at its left end, and the rule `amber at 1:00 - red at
0:30 - then TIME` along the bottom. The stills the critic gets (10 / 50 /
90 % of the clip) read `04:30` green, `02:28` green and `00:26` red with the
bar drained to match; the build cuts one more at 250 s to show the amber
phase.

## Acceptance rubric (the critic scores against this)

1. Renders at defaults on every canvas, exit 0, no error mosaic; the
   why-tutorial renders its six pages.
2. The default frame 0 says what the template is for without the title:
   digits, a segmented bar with its warning zones, a rule line.
3. Every text fits at 1080x1920 and 480x270; the digits never clip at
   `88:88`.
4. The bar is honest: exactly `ceil(seconds / slice)` slices, the lit count
   at time `t` equals `ceil(remaining / slice)`, the colour zones match
   `warnSec` / `finalSec`, verified in the test from the enable windows.
5. The digits expression prints `MM:SS`, opens on `05:00`, holds `00:00`
   through the end hold; the three phase copies are gated to disjoint
   windows and the windows meet at exactly `S - warnSec` and `S - finalSec`.
6. A stage manager or a streamer would render this instead of a shell
   one-liner: `--props '{"seconds":180,"title":"Starting soon","endText":"LIVE"}'`
   is the whole integration.
7. Code quality against AGENTS.md: deterministic, `ctx.target`, bound title,
   fitted copy, ASCII, `placeInsetPieces`, no per-pixel effects, overlay
   depth under the engine's threshold.
8. The brief was honest: what shipped is what this page promised.
9. The why-tutorial tells the truth, including the counter-argument (a file
   cannot pause or add time) with its source.

## Variants worth trying (each ONE idea different)

- **a** - the brief as written: slices drain from the right, colour zones
  fixed on the bar, digits change colour by phase.
- **b** - one idea different: the whole background tints by phase (a
  full-frame colour tile per phase, enable-gated) instead of only the digits
  - "the room turns red". Tests legibility at a glance from a stage, at the
  cost of subtlety on a stream.
- **c** - one idea different: the bar FILLS with elapsed time instead of
  draining (spent slices are the lit ones, from the left), the way a
  progress bar reads. Tests which direction a speaker reads faster.
