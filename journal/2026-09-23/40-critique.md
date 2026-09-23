# Critique - 2026-09-23

Read-only pass over `20-brief.md`, `30-build.md`, the three `report.json`
files, the snapshotted source of each variant and the stills - including
the two extra cuts per variant (`landscape-amber-250s.png`,
`landscape-end-302s.png`) and the six tutorial pages of a. Nothing under
`src/` was touched; c is what the build left in place.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a - the brief as written | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 2 | 2 | **16** | none |
| b - the frame tints by phase | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 1 | **14** | none |
| c - b, spent slices translucent | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 1 | **15** | none |

Line by line, where the score is not a 2:

- **6 (would they use it)** - a and b get a 1 for the same reason: a
  rendered clip cannot pause or add a minute, and the OBS Lua author's
  "fixed-length video (not reusable, and it cannot switch scenes)" stands
  for the pre-roll case. c gets the 2 because with the tint the whole frame
  is the cue EventTimer describes - "clear visual cues to wrap up without
  anyone having to wave a card" - and that is the case where a file on a
  confidence monitor beats the gist's output outright.
- **7 (code quality)** - every variant is deterministic, reads
  `ctx.target`, binds the title / subtitle / end word / accent, measures its
  copy, is ASCII, and keeps the parent overlay chain at ~10 with no
  engine warning. The 1 is for the digits: per-frame text has to be
  drawtext, drawtext uses the machine's default font through fontconfig,
  so the PIXELS are deterministic per machine, not across machines. The
  bundled font every other template here draws with cannot do this. It is
  a substrate limit, it is stated on the tutorial, and it still costs the
  point.
- **8 (the brief was honest)** - b and c ship an eleventh prop
  (`phaseTint`) the brief's table did not list. `30-build.md` records the
  deviation and the reason; a deviation recorded is still a deviation.
- **9 (the why-tutorial tells the truth)** - the problem page is the
  scout's evidence in the evidence's words, with its sources; the "use it"
  page's command is real; page 5 is the template at its defaults; page 6
  is the runner's honest "self-reported" card. But the solution page was
  written before b existed and says nothing about the tint, so for b and c
  it describes a's behaviour. The ship phase must add the knob to the
  words - the prompt allows exactly that fix - and until it does, b and c
  score a 1 here.

Fatal checks, all clear: no render exited 3 (twelve renders and three
tutorials at exit 0, `degraded: false` in every report); the tests assert
the slice windows, the phase gates, the expression string, the clip-length
rule and the contract (a test that only passed by asserting nothing would
not survive `sliceWindows(127, 30, 10)` or the pinned-duration case); every
optional prop carries a default the render uses; `events/talk-timer` says
what it is; every source on the problem page appears in `10-scout.md`
(check-why: 0 warnings); the solution page claims no feature the variant
lacks - it under-claims for b and c, which is the line-9 point above.

## What each variant gets right / wrong

**a - the brief as written.** Right: frame 0 is the finished picture
(`05:00` in green over a full bar with its amber and red zones), so the
browse card - frame 0, the only still a day agent can get - is honest; the
10 / 50 / 90 % stills read `04:30` green, `02:28` green, `00:26` red with
`LAST 30 SECONDS`, and the bar's lit count matches `ceil(remaining / 10)`
in every one; portrait centres the digits-plus-bar group instead of
stranding the bar at the bottom. Wrong: the amber phase is a colour on
digits and a three-slice tip - from the back of a room it is a subtle cue
for the moment that most needs an unsubtle one; and the end word `TIME`
is footer-sized when it should be the loudest thing on the frame.

**b - the frame tints by phase.** Right: `landscape-amber-250s.png` and
`landscape-90.png` are unmistakable at any distance - the room turns amber,
then red - and the stream case gets a knob to turn it off. Wrong, and
visibly: the spent slices keep the calm preset's blue-grey under a red
frame (`portrait-90.png`), so the bar looks pasted on from a different
picture. That is a real defect the tint created, not a nit.

**c - b with translucent spent slices.** Right: the one thing b got wrong
is gone - spent slices take the frame's colour (`landscape-90.png`:
reddish-grey; `landscape-amber-250s.png`: olive-grey; the calm phase is
unchanged), the geometry is byte-identical to b (the fingerprint did not
move), and the child bar still carries no mask. Wrong: the translucent
tiles are overlays in the child now, so a variant renders ~25 % slower
than b (17.7 vs 13.9 min); and the amber tint `#2a2008` reads olive-brown
on this display - it needs tuning on a real confidence monitor before
anyone calls it amber.

## Decision: SHIP c

c is a plus one idea plus the fix that idea needed. The tint is the
single biggest improvement to the thing the scout found (a cue a speaker
reads without looking), b proved it and showed its cost, and c paid the
cost. `phaseTint` stays ON by default: the scouted use is a stage screen;
a stream overlay turns it off with one prop.

Ship-phase conditions, all inside what the prompt allows:

1. The solution page names the tint knob (words only; the code is c's).
2. `WHY.timeline` becomes the session's real phases, self-reported, with
   tool calls but no tokens or dollars (not measurable from inside the
   session), and page 6 says so.
3. `preview.png` is checked by eye: `05:00` green, full bar, no tint.

## What a human polish pass should look at first

- **The end word is the quietest element on the frame.** `TIME` (or
  `LIVE`) lives in the footer caption cell at ~4 % of the height. It
  should replace the digits' band or sit under them at half their size.
- **The amber tint against a real monitor.** `#2a2008` was chosen on a
  laptop panel; on a stage LCD it may read brown. Same for the light
  preset's `#fff1cc`.
- **Portrait is sparse.** The digits fit the width and the group is
  centred, which is correct, but a phone on a podium would take a taller
  bar and a larger title.
- **The digits' face is the machine's.** A bundled `fontfile=` for expr
  drawtext would make the pixels portable; until then the caveat stands.
- **No sound.** SlideModel beeps in the last ten seconds; a stage manager
  would want an optional tick. The template has no deterministic audio
  primitive to offer today.
