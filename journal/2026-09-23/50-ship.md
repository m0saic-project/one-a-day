# Ship - 2026-09-23

## `@one-a-day/events/talk-timer/v1` - Talk Timer

The talk timer as a clip: a countdown video a stage screen, a confidence
monitor, a phone on the podium or an OBS scene can just play, for the
stage crews and organisers who run timed slots and the streamers with a
starting-soon scene - the people who today either run a live web timer or
hand-write an ffmpeg `drawtext` one-liner. From nothing but props (the
length in seconds, a title and subtitle, the amber and red thresholds in
seconds remaining, the end word, the hold at zero, the accent, a light or
dark preset, the tint knob) it renders big digits that count down per
frame, a bar of time-slice rectangles that go out on schedule from the
right - the last thirty seconds red at the left end, the minute before
them amber - and, by default, a frame that turns amber and then red with
the phases, so the warning is read from the corner of an eye. At zero the
end word appears and the clip holds. Everything is a scalar gate or one
drawtext expression: nothing per-pixel moves, so a five minute clip costs
what it should. **The countdown is the clip:** the natural length is the
countdown plus the hold, declared through `resolveOutputHints`, and an
explicit `--durationMs` or Make Duration makes the countdown that long.

This is the first VIDEO template in the repo - the operator note asked for
one - and the first day in the `events` pack.

## Render it

```
m0saic make @one-a-day/events/talk-timer/v1 --template-repo . -w 1920 -h 1080 -o timer.mp4
```

Five minutes, amber at 1:00, red at 0:30, TIME at zero, five seconds of
hold - 305 s of video. About four minutes to render at 1080p on this
laptop; a 1080x1920 phone clip about three.

Props worth trying:

- `--props '{"seconds":180,"title":"Starting soon","subtitle":"","endText":"LIVE","warnSec":0,"finalSec":10}'`
  - a stream pre-roll: three minutes, no amber, the last ten seconds red,
  then LIVE.
- `--props '{"seconds":1080,"warnSec":300,"finalSec":60,"title":"Talk","subtitle":"18 minute slot"}'`
  - a TED-length slot with a five minute warning (PresentTimer's
  thresholds).
- `--durationMs 60000` with no props - the clip length is the countdown: a
  one minute timer with a five second hold.
- `--props '{"phaseTint":false}'` - the quiet frame: only the digits, the
  bar and the caption change colour (what the live timer apps do).
- `--props '{"preset":"light","accent":"#1f6feb"}'` - a bright room, a
  brand colour.
- `-w 1080 -h 1920` - the phone on the podium; the digits fit the width,
  the bar keeps its slices.
- `--props '{"debugLayout":true}'` - the layout contract drawn over the frame.

One clip per slot from a schedule file is a loop over these.

Why it exists (the tutorial):

```
m0saic make @one-a-day/events/talk-timer/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## How this day was run

The 09:00 scheduled task did not fire (the laptop was off), so the founder
ran the day by hand in a Claude Code session with the model set to Fable
5.1 at effort xhigh; `run.json` records it under `runner.session`. There
is no adapter trace, so the tutorial's last page is self-reported from the
session's own clock (`logs/session-timeline.json`) with tool-call tallies
and no tokens or dollars. The session's one background render was stopped
by the harness for low system memory, and a foreground call is capped at
ten minutes, so the renders ran one per call through
`logs/render-variant-split.mjs` - the pipeline's `render-variant` steps,
copied, writing the same `report.json`. The gate was `pipeline/lib/
gate.mjs`'s `runGate` called with the arguments `run.mjs` passes
(`logs/gate-run.mjs`), so `run.json` keeps the session record instead of
the runner's defaults; the commit is local and pushed by hand after the
gate, exactly as the runner would have pushed it.

## Weak spots (honest; a human polish pass starts here)

- **A clip cannot pause, add a minute, or be driven from backstage.** The
  live apps can, and Stagetimer's customers pay for that. This template's
  claim is narrower: when the countdown has to be a file, make the file
  from props instead of a shell one-liner. Regenerate it when the slot
  changes.
- **The digits are the machine's font.** Per-frame text has to be
  drawtext, drawtext resolves its font through fontconfig, and m0saic
  bundles no font for that path - so the document is deterministic and the
  pixels are deterministic per machine (a monospace with dotted zeros
  here; Arial-class elsewhere). Sized from a Roboto measurement of `88:88`
  with 15 % headroom. A bundled `fontfile=` for expr text would close this.
- **The end word is the quietest element on the frame.** `TIME` sits in
  the footer caption cell; it should be the loudest thing at zero.
- **The amber tint was chosen on a laptop panel** (`#2a2008`); on a stage
  LCD it may read brown. Same for the light preset's `#fff1cc`.
- **Portrait is sparse** - the digits fit the width and the group is
  centred, but a phone on a podium would take a taller bar and a larger
  title.
- **Minutes are not folded into hours:** a 90 minute slot reads `90:00`.
- **No sound.** SlideModel beeps in the last ten seconds; the template has
  no deterministic audio primitive to offer.
- **Render cost.** ~4-6 min at 1080p for a five minute clip on this
  laptop; a 21,600 s cap is allowed and would take an hour.

## Follow-ups (what v2 would do)

- Promote the end word: replace the digits at zero with `endText` at their
  size, or a two-line stack.
- `hours` formatting past 59 minutes, and a `count up` mode for elapsed
  time (the Toastmasters timer counts up against a target).
- A `fontFamily` prop that names an installed font for the digits, and a
  bundled monospace once the engine can take a `fontfile=` for expr text.
- Take a schedule file (`slots: [{ title, seconds, ... }]`) and emit one
  clip per slot as an `emit: "multi"` pipeline - the batch case the
  LinkedIn loop hand-rolls.
- An optional tick in the final seconds, when a deterministic audio
  primitive exists.

## What was pruned from this day's folder, and why

The losing variants' four video files each (a: 9.6 MB, b: 10.6 MB) were
deleted after the critique; their stills at 10 / 50 / 90 % plus the amber
and end cuts, their `report.json` (exit codes, probes, sizes, timings) and
their snapshotted `src/` stay, and each is reproducible with
`logs/render-variant-split.mjs` from that source. The pick's four renders
(c: ~11 MB) are kept in full - for a video template they are the
deliverable. The 22 research captures under `logs/research/` are kept:
every URL the day cites was opened, and they are the proof.
