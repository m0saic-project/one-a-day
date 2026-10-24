# Scout — 2026-10-24

## Candidates (4, best first)

### 1. Orienteering race split-analysis card
- Who: Orienteers. They gather on **Attackpoint** (https://attackpoint.org/ — the sport's
  training-log and race-discussion hub, with a dedicated "Recent Splits" section and an
  "upload results" flow), on **WinSplits** result pages (obasen.orientering.se), and in club
  recaps published by Orienteering USA (orienteeringusa.org).
- The construct: a race is a sequence of controls you navigate between; your **split time**
  is the time between two consecutive controls, and the central post-race question is
  "where did I lose time?" The artifact every event already produces is a **result/split
  file**: the **IOF XML 3.0** `ResultList` (with split times per control) and the
  Sport Software CSV / WinSplits SPL formats every timing system exports. Eventor's own API
  returns `IOF XML 3.0 ResultList` with `includeSplitTimes`.
- The recurring need: after every race (dozens of local clubs worldwide run events weekly),
  orienteers upload splits to Attackpoint and analyze the same thing, by hand or in
  WinSplits — where they lost time per leg. WinSplits even computes it for them: "time
  without mistakes" and per-leg "time loss", coloring mistake legs pink. World of O News
  hand-draws "graphical split-time analysis" plots for every championship. A shareable,
  deterministic card of one racer's splits is the thing people read and would post.
- Evidence:
  - https://attackpoint.org/ — hub: "High-Performance Training Logs for Orienteers", "Race
    performance analysis", and a "Recent Splits" list of freshly-uploaded races.
  - http://obasen.orientering.se/winsplits/online/en/help_table.asp?databaseId=101857&categoryId=0 —
    WinSplits help: "For each runner, position, name, club, finish time, time behind the
    winner and times and positions at each control are shown." and "Some split times in the
    list have pink background colour. This means that the runner's time loss on such a leg is
    relatively large. In other words: a mistake has probably been made."
  - https://orienteering.sport/iof/it/data-standard-3-0 — the IOF Interface Standard 3.0 XML
    schema, the interchange format for "result lists" with "Improved support and
    documentation for split times"; times as ISO 8601 and total seconds.
  - https://news.worldofo.com/2026/07/11/woc-2026-knock-out-sprint-maps-and-results —
    World of O News publishes hand-made "graphical split-time analysis" plots per WOC race.
  - https://orienteeringusa.org/2026/04/junior-nationals-and-flying-pig-xxviii-event-recap/ —
    every OUSA event recap links "Splits on Attackpoint" and WinSplits as the canonical
    post-race artifact.
- Why m0saic fits: the card is rectangles on a canvas — one bar per control (split time vs
  the best leg, time-lost legs highlighted pink), the header block (name, club, class,
  course, finish time, place, time behind), and a footer. Props mirror the IOF XML fields
  verbatim (splits array in seconds, timesBehind, club, className). Batchable (one card per
  racer per race), fully deterministic, no media needed — pure numbers.
- Risks: split arrays are long (10–25 controls) so layout needs a scroll/compact mode and a
  split-count cap; "time loss" is computed by WinSplits from the whole class, so the template
  should take loss-per-leg as a prop rather than re-derive it; niche is small and the
  community is older — but it is exactly the "community organised around one construct with a
  shared tool" the brief asks for.

### 2. Scuba dive-log recap card
- Who: Scuba divers, on divelogs.org, scubaboard, and Subsurface users. Log every dive in a
  computer/app (Subsurface, MacDive, Shearwater).
- The construct: the dive log; the artifact is **UDDF/UDCF XML** or Subsurface's `.ssrf` —
  per-dive date, site, max depth, duration, temp, buddy, and a depth profile.
- The recurring need: after a trip, a "dive #100" milestone or a trip recap card; people
  share these by hand (Instagram "100th dive" posts are common).
- Evidence: https://divemates.app/help/export-from-another-app ("Subsurface's own `.ssrf`
  file works just as well"); https://github.com/ericgriffin/submersion ("full UDDF 3.2 import
  and export"); https://www.divelogs.org/ ("Get comprehensive statistics").
- Why m0saic fits: numbers-only card — dive count, max depth, total bottom time, depth
  profile as a bar/line.
- Risks: the profile chart is the hard, taste-heavy part; milestones are one-off rather than
  weekly, so less batchable than a race recap.

### 3. Fantasy football weekly recap image
- Who: Fantasy football commissioners (ESPN/Sleeper/Yahoo leagues), r/fantasyfootball and
  league group chats.
- The recurring need: a weekly recap/trash-talk image; Sleeper already ships a "Weekly
  Report with Awards" image every Tuesday, and commissioners still hand-make their own.
- Evidence: https://support.sleeper.com/en/articles/3204499-league-history-and-weekly-reports;
  https://www.tfofantasy.com/blog/ai-fantasy-football-recaps ("nobody wants to write the
  weekly recap").
- Why m0saic fits: matchup/standings are structured props; batchable one card per matchup.
- Risks: crowded commercial space (ffwrapped, Fantasy Genius, NextTeamUp, Sleeper's built-in
  report), and it skews to prose more than rectangles; a mainstream candidate that lost on
  "someone already sells exactly this".

### 4. MMO raid parse card (Warcraft Logs / FFLogs)
- Who: WoW/FFXIV raiders, on Warcraft Logs and FFLogs.
- The recurring need: a shareable "I parsed 99" / guild progress card after raid night.
- Evidence: https://wipefest.gg/; https://www.warcraftinsights.com/; https://thegamercodex.com/en/final-fantasy-xiv/tools/fflogs.
- Why m0saic fits: parse percentile, DPS, kill time, rank are clean props.
- Risks: Warcraft Logs/FFLogs already generate embeddable signature/parse images, and this is
  close in shape to day 026's osu! scorepost card; not enough of a gap.

## Pick
Orienteering race split-analysis card. It is the one genuinely fresh niche construct left on
the founder's list that this repo has not touched, it has a real machine-readable artifact
(IOF XML 3.0 with split times) whose field names a template can mirror, and a sharp recurring
moment (after every race, everyone asks "where did I lose time?" — a chart people currently
make by hand). It beats fantasy football because no commercial tool already owns it, and it
beats scuba because the moment recurs weekly instead of once per milestone.

## Rejected today
- Scuba dive-log recap: milestone-based, less batchable, profile chart is taste-heavy.
- Fantasy football recap: crowded commercial space (Sleeper ships its own image report).
- MMO raid parse card: logs sites already embed parse images; too close to osu scorepost.
