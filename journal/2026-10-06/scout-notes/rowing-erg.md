# Scout notes: rowing-erg (Concept2 indoor rowing)

## Pages opened (all loaded)
- https://c2forum.com/viewtopic.php?p=562801 (Public logbook & profile improvements?)
- https://c2forum.com/viewtopic.php?p=536366 (Exporting data)
- https://c2forum.com/viewtopic.php?p=585386 (Can I download drag factor, drive length)
- https://pkg.go.dev/github.com/richhaase/c2 (c2 Concept2 Logbook CLI)
- https://www.concept2.com/blog/ergdata-feature-sharing-workouts (ErgData sharing)

## What the data is
- Logbook "all history" -> season CSV: one summary row per workout incl. drag factor (Tsnor, p=585386). Bulk CSV is summary only; per-workout export gives stroke data / .fit (p=536366).
- Logbook API (personal access token, log.concept2.com Settings -> Developer). richhaase/c2 shows fields: time_formatted, pace per 500m, spm, bpm, df, workout_type, rest_time_tenths, rest_distance, splits; goal target_meters 1000000 (million-meter goal).
- Example rendered row: `04/11 5,000m 28:35.4 2:51.5/500m 24spm 112bpm 107df`.
- I did NOT verify the exact season-CSV column headers (no page opened showed them).

## Sharing / demand evidence
- Forum users put "RowErg PBs:" lists in their signatures (HornetMaX, p=562801) - PBs are a public identity thing.
- Same thread: public logbook is hard to browse for a friend's 2k PB ("pal did his 2K PB last season, can't see that").
- ErgData (Sep 2023) added sharing, but it shares a LINK to ReRow / view results in the logbook, not an image. "Text, email, AirDrop".
- No thread found of people asking for a share graphic; no evidence found of PM5 photo culture (search failed to surface it, not disproven).

## Already served?
- ErgData: link share, not image. Strava/Garmin/ErgZone likely generate share images for rows (NOT verified this session). richhaase/c2 makes an HTML progress report, not a card.

## Candidate
Erg piece result card (2k test / ranked piece): big time, avg split /500m, spm, watts, DF, per-500m split bars; optional season/goal meter progress (Holiday Challenge / million meters). Input: logbook API JSON or season CSV row. Fit is good (structured, numeric, batchable for a team), demand evidence weak. Strength ~4.

## Rejected
- Team erg-test leaderboard: plausible coach need (RowHero app exists for coach team results), but no evidence opened; weak.
- Stroke-by-stroke force curve clip: needs per-stroke BLE data, served by PainSled/ErgZone.
