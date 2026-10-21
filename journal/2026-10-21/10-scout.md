# Scout — 2026-10-21

## Candidates (3, best first)

### 1. Typing-test PB card (Monkeytype result object)
- Who: Monkeytype's users, sharing results on r/monkeytype and r/typing and
  practicing on r/learntyping; the app's own Discord, where a bot hands out a
  role for every new personal best (the README: "auto-assign optional roles
  based on typing performance").
- The construct: the typing test result. The artifact every signed-in user
  already has is the result object itself: the results page with its
  "Export CSV" (wpm | raw | accuracy | consistency | chars | mode | info |
  tags | date), and the API's /results rows (wpm, rawWpm, acc, consistency,
  mode, mode2, language, isPb, chartData.wpm - per-second speed).
- The recurring need: the PB post. On every personal best the app itself
  institutionalizes the moment (a new Discord role "every time you achieve a
  new personal best in a 60 second test", per the account pages), and the
  share that follows today is a screenshot of the result screen.
- Evidence:
  - https://github.com/monkeytypegame/monkeytype - the README: "an account
    system to save your typing speed history", "a variety of test lengths and
    languages", and a Discord bot that auto-assigns roles based on typing
    performance; the project grew out of an r/MechanicalKeyboards prototype.
  - https://api.monkeytype.com/docs - /results objects carry wpm, rawWpm, acc,
    consistency, mode, mode2, language, isPb and chartData { wpm, burst, err }:
    the whole result, per second, in one structured row.
  - https://github.com/conner-mcnicholas/MonkeyTypeLeaderboard - the metric
    definitions in the wild: "WPM (Words Per Minute = characters/5,
    normalized to 60 seconds)", "Raw WPM (ignores mistakes)", "Accuracy (%
    correct keystrokes)", "Consistency (per second variance of Raw WPM)".
- Why m0saic fits: rectangles on a canvas. The props mirror the result object
  (handle, wpm, raw, acc, consistency, mode line, pb, chartData.wpm), the
  hero is the wpm, the NEW PB badge and the "+3 vs PB" delta are computed
  from wpm vs pb (nobody hand-writes the thing the post is about), and the
  per-second chartData.wpm is a full-width bar row a screenshot does not
  carry. One deterministic render per result; batchable for a whole history
  export.
- Risks: the app's own result screen is the incumbent and a screenshot is one
  keypress; r/typing threads show PB screenshots pasted as image links, but
  reddit refused this agent's fetches today (the one thread fetch returned
  only "Reddit"), so it is not cited - the app's own pages carry the moment.
  The day-26 osu! scorepost card is the nearest neighbour (a result-screen
  share card for a different game); the differentiator must be the computed
  PB and the speed-over-time bars, not the result screen redrawn.

### 2. Fantasy football weekly matchup recap
- Who: league members and commissioners on r/fantasyfootball; the weekly
  matchup and its recap is the league's recurring moment.
- The construct: the matchup box score. The artifact lives inside the
  platform (ESPN/Yahoo/Sleeper), not in a file the manager holds.
- The recurring need: the weekly recap post for the league chat.
- Evidence: https://commishable.com/commissioner-tools/recaps-and-updates -
  "Automate Weekly Recaps - Keep the trash talk alive all season - without
  the recap becoming your second job"; the need is real and already served.
- Why m0saic fits: a matchup card from typed-in box-score rows.
- Risks: a paid SaaS already ships the recap, and the data is
  platform-locked; a mainstream case without a user-held artifact loses to
  the niche pick on the scout prompt's own criteria.

### 3. Anki review-stats / year-in-review card
- Who: Anki users (r/Anki, r/medicalschoolanki) sharing study stats and
  streaks.
- The construct: the review log; the artifact is the collection's revlog
  table the manual documents (id, cid, ease, ivl, time, type per review).
- The recurring need: the milestone/streak share.
- Evidence: https://docs.ankiweb.net/stats.html - the stats window and its
  "Save PDF" button exist "to make it easy to share your statistics with
  others"; the revlog columns are documented for manual analysis.
- Why m0saic fits: a year-in-review card from aggregated revlog counts.
- Risks: Anki itself already renders the graphs and ships the share (Save
  PDF); the remaining angle (a cleaner card from the raw revlog) is thinner
  than the typing pick, whose share today is a raw screenshot.

## Pick

**Typing-test PB card (Monkeytype result object).** The most on-thesis niche
of the day: a community organised around one construct (the typing test
result), a structured artifact every signed-in member already has (the
result object and its CSV export, including per-second chartData), a
recurring show-off moment the app itself institutionalizes (the PB role),
and a share still made by screenshot. It is also cleanly distinct from all
31 prior days - no typing template exists, and the nearest neighbour
(day 26, osu!) is a different construct for a different community.

## Rejected today
- Fantasy football matchup recap: the need is real but a paid tool serves it and the data is platform-locked, not user-held.
- Anki review-stats card: Anki's own stats window already renders the graphs and ships the share as a PDF.
