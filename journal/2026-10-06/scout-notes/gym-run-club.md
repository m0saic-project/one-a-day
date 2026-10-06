# Scout notes: gym-run-club (2026-10-06)

## Candidate: parkrun weekly event-summary infographic (strength 6/10)
- Who: parkrun event teams (run directors, report-writing volunteers) at ~2,000+ events, posting every Saturday to Facebook/event news pages.
- Hand-made evidence: github.com/ear1grey/parkrun-event-summary README: built after seeing "a really cool infographic at my local parkrun, that was generated using a PowerPoint slide ... (for Rushmoor parkrun) ... based on a design by Ian Gregory (an RD at Great Salterns) - there are many examples on the Rushmoor and Great Salterns parkrun results pages. The process of getting the data into Powerpoint is quite cumbersome".
- Field names (de facto): rwkura/parkrun-milestones `parkrun-runstats` output: event name, run #, date, Weather, parkrunners, New PBs, Visitors, First-time parkrunners, Volunteers, First-time volunteers, Milestones (e.g. 4xR25, 4xR50, 1xR100). Milestone tiers 25/50/100/250/500.
- Eventuate (johnsyweb, greasyfork/Chrome/Firefox, v1.20.0 updated 2026-09-30) produces report TEXT (finishers, milestone clubs, first timers, PBs, volunteers) for "volunteers who produce an event report" -- text, not image.
- Already served?: partly. ear1grey's extension renders an infographic in-page (beta, 3 stars, Chrome, parkrun.org.uk). It is a browser overlay, not a batch/branded exportable PNG; low adoption.
- Fit: fixed stat tiles + milestone badge row + event branding; one still per week per event; props = the runstats fields. Deterministic.
- Risks: parkrun is hostile to scraping its results (input should be hand-pasted numbers or Eventuate/runstats output); parkrun brand/trademark usage rules; names can be non-ASCII (keep card aggregate-only); an existing extension covers the core picture.

## Rejected
- CrossFit daily WOD graphic: WOD body is free-form text (SugarWOD API workout `description` blob, scheme in title); served by SugarWOD BoxTV TV display and dozens of paid Canva fitness template packs (Gumroad/CreativeMarket).
- CrossFit benchmark PR card (Fran/Murph): no evidence found of repeated by-hand making in budget; SugarWOD/BTWB apps already show PR share screens; data locked behind per-affiliate API key.
- parkrun personal milestone card (50/100/250): parkrun issues official milestone shirts/recognition; little evidence of hand-made cards found; would need individual names (non-ASCII risk).

## URLs opened
- https://greasyfork.org/scripts/534157-eventuate (ok)
- https://github.com/ear1grey/parkrun-event-summary (ok)
- https://github.com/rwkura/parkrun-milestones (ok)
- https://app.sugarwod.com/developers-api-docs (ok, truncated; workouts use scheduled_date_int, JSONAPI)
