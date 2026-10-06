# Scout notes: setlists (jam-band setlist / show-stat communities)

## Pages opened
- https://docs.phish.net/ (OK): Phish.net API v5. Methods include `shows`, `setlists`; example `api.phish.net/v5/shows/showdate/1997-11-22.json?apikey=...`; response `{error, error_message, data[]}` with `showid, showdate, venue, city, state`. Key required; "Special methods: rules for attendance, reviews, and users". Don't cache over 24h.
- https://elgoose.net/api/v2/latest.json (OK, raw JSON, no key): Songfish row per song, with real fields: `show_id, showdate, artist, songname, settype ("Set"), setnumber ("1"), set_label, position, transition (", " or " > "), transition_id, footnote, footnotes, isjamchart, jamchart_notes, shownotes, venuename, city, state, country, tourname, isoriginal, original_artist, isreprise, isjam`. Example shownotes: "Franklin's Tower was played for the first time since December 14, 2024 (129 shows)."
- https://bearlydead.songfishapp.com/api/docs (OK): Songfish is a shared platform (same API for elgoose, Bearly Dead, etc.). No auth. Methods setlists/latest/shows/songs/jamcharts. Only embeds are HTML iframe / JS (`/api/embed/2015-04-01.html`). No image output.
- https://tomorrowsverse.com/story/introducing-the-visual-setlist-2798.html (OK, 2011): blogger hand-made "Visual Setlists" for Phish "the morning after each performance": font size = play frequency, colour = gap since last played (1-2, 3-10, 11-20, 21-30, 30+ shows), underline = tour debut, red = debut, purple = bustout, plus a bar graph of song lengths.
- https://apps.apple.com/app/id6450758912 (OK): Setlysts (Goose, data from elgoose.net): attended-shows list + stats page (songs heard, openers/closers, bar charts by year/month/weekday, map). User review asks "ability to share setlists via messages within the app"; another asks for "Songs Never Heard" on stats page.

## Failed
- none opened failed. (Did not open setlist.fm API docs, phish.net attendance docs, Discourse phish.net embed thread.)

## Candidate 1: Jam-band show setlist card (Songfish / phish.net JSON -> still)
- Input: one show's rows from Songfish `setlists/showdate/<date>.json` (or phish.net v5 setlists). Group by setnumber/settype, join with `transition`, mark `isjamchart`, footnotes as superscripts, bustout/debut via gap (shownotes or computed from songs endpoint).
- Picture: square/story card: date, venue, city; Set 1 / Set 2 / Encore blocks with ">" segues; coloured badges for debut / bustout (gap N) / jamchart; footnotes strip. Optional "visual setlist" gap colour ramp.
- Served by: setlist.fm widget and Songfish HTML embeds (web, not image); bands' own social graphics (not verified this session). No free CLI found that renders an image from Songfish JSON.
- Risks: setlist text length varies (20+ songs, long titles) -> layout overflow; gap/bustout needs extra API calls; bands already post official setlists; ASCII mostly fine.

## Candidate 2: "My shows" fan stat card
- Input: list of attended show dates + Songfish/phish.net data. Picture: N shows, unique songs heard, most-heard song, longest bustout caught, shows by year bar.
- Served by: Setlysts app stats page (Goose), phish.net user stats pages (in-site). Sharing as an image is the gap (review request), but evidence is thin.
- Risks: per-user attendance lives behind accounts (phish.net special method, key); computing stats is data work, not layout.

## Rejected
- setlist.fm generic setlist card: setlist.fm already has a shareable widget; no gap/debut data.
- Live "visual setlist" word-cloud: font-size-by-rarity is free-form typography, hard to keep deterministic and legible.
