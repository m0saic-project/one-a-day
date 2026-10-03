# Ship — 2026-10-03

## @one-a-day/community/qsl-card/v1 — Ham Radio QSL Card
A still PNG QSL card for one ham radio contact, built from one ADIF log record.
It is for operators who owe a card to every station they worked, for example
after a contest weekend, a POTA activation or an evening on FT8. They export
the log and loop over it. The props are the ADIF fields in camelCase, in ADIF
formats: `stationCallsign`, `call`, `qsoDate` (`20261003`), `timeOn` (`1432`),
`freq` (`14.074`), `mode`, `rstSent`, `myGridsquare`, `qth`, `myPotaRef`,
`qslMsg`, plus `accentColor`. The card prints the date and time the QSL way
(`03 OCT 2026`, `14:32`) and derives BAND from FREQ with the ADIF 3.1.6 band
table, so the two never disagree. A callsign is never ellipsized. The QSO
table reflows 6x1, 3x2 or 2x3 depending on aspect, and a value that cannot fit
is refused with an error naming the prop. The card is paper, one accent and
type: no photo.

Shipped variant `a` (bands), the critic's pick over `c` (ruled grid). See
[40-critique.md](40-critique.md). `src/community/qsl-card/v1/` is
`variants/a/src/` byte for byte, except that `WHY.timeline` now holds the full
four-phase trace. I also replaced c's registry description ("the QSO in a ruled
form") with a's, and gave the new `community` pack a real one-line description
in `src/repo.ts` in place of the scaffold placeholder.

Checks run in this phase: `npm run build && npm run previews && npm run build &&
npm run fingerprints:update && npm run verify` all exited 0. `npx jest
src/community` passed 8/8 with a in place. `m0saic doctor . --json` returned
`ok: true`, and the template meets 0.3.0 with nothing lagging. `m0saic make ...
--tutorial --validate-only` exited 0. The two registry warnings belong to other
templates (`dev/og-card`, `social/episode-audiogram`). The browse card
`assets/templates/@one-a-day__community__qsl-card__v1/preview.png` is a full
1920x1080 render of the default card (136 KB, the same bytes as a's landscape
still). It is an image template, so a blank first frame cannot happen.

## Render it
```
m0saic make @one-a-day/community/qsl-card/v1 --template-repo . -w 1920 -h 1080 -o out.png
```
Props worth trying:
```
--props '{"stationCallsign":"DL1ABC","call":"VP2V/G4ABC","qsoDate":"20260815","timeOn":"0915","freq":"7.074","mode":"FT8","rstSent":"-08","myGridsquare":"JO62qm","qth":"Berlin","myPotaRef":""}'
-w 1650 -h 1050    (the 5.5 x 3.5 in card at 300 dpi)
--props '{"freq":"432.100","accentColor":"#1f5fa8"}'   (70cm, blue card)
```
Why it exists (the tutorial):
```
m0saic make @one-a-day/community/qsl-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)
- `ADIF QSO CARD` is printed in the footer of every card, and no prop removes
  it. It names the file format, not anything a ham writes on a QSL. This is
  the first thing to fix, but it can't be fixed in v1 once frozen.
- Portrait: `CONFIRMING OUR QSO` floats on its own with about 90 px of air on
  each side, so it looks detached from `TO RADIO <call>`.
- Square: the call is limited by height and fills only about half the width,
  so the top-right quarter of the header is empty.
- Roboto's `0` has no slash, so `N0CALL` can read as `NOCALL`. Hams print
  slashed zeros on cards for exactly this reason.
- No photo face. The usual emailed QSL has one, so today the template only
  suits operators who are happy with a text-only, contest-style card.
- It reads no `.adi` file. Users need their own script to map each ADIF
  record to `--props`.
- An unknown prop key does not raise an error. While writing this note I passed
  `myCity` (the ADIF field name) where the prop is `qth`: the render succeeded
  without a warning and `myCity` was ignored. A script that maps ADIF to props
  by field name will hit this. v2 could name the prop `myCity` or accept both.

## Follow-ups (what v2 would do)
- Make the footer mark a prop that defaults to empty.
- Keep the confirmation line tight under `TO RADIO` in portrait, and let the
  station block sit beside a short call in square.
- A slashed or dotted zero in callsigns, if the engine has a font with one.
- An optional background photo (an `image` input) behind a paper panel.
- Optionally print RST_RCVD, QSL_VIA and a "PSE/TNX QSL" tick, the fields that
  printed cards often carry.
