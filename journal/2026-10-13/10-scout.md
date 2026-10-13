# Scout — 2026-10-13

## Candidates (best first)

### 1. VATSIM monthly pilot log card
- Who: the ~20k pilots who fly the VATSIM online flying network
  (https://vatsim.net/, forum https://forum.vatsim.net/, Discord, the
  network blog https://blog.vatsim.net/), and the virtual airlines built on
  it (phpVMS sites like https://deltavirtual.org/).
- The construct: the flight hours. VATSIM counts connected time per pilot;
  virtual airlines turn each flight into a PIREP row (designator, DEP/ARR,
  airframe, block time, touchdown fpm, score). Ratings, ranks and "the
  1000-hour people" are the community's internal status ladder.
- The recurring need: a monthly wrap ("Sep: 13 flights, 32.7 h, POTM #7")
  and hour milestones, shared into the group chat, the Discord and the
  Facebook groups. It is currently text paste or a login dashboard
  screenshot.
- Evidence:
  - https://deltavirtual.org/users/13 — a real phpVMS pilot profile, opened:
    "FLIGHT OPERATIONS LOG / REV 2026.04" with PIREP rows (DL2155 · ELLX →
    EBBR · A319 · 00h 46m · -518 FPM · VERIFIED), a "Monthly Momentum /
    Oct vs Sep" block, hour badges ("Earned Aug 28 2026 — 400 Hours"), and a
    POTM history table (Sep 2026 · #7 · 296.4 · 13 flights · 32.7 h). The
    only share affordance in the log panel is "EXPORT PDF".
  - https://forum.vatsim.net/t/hours-on-the-ground/4768 — opened; a whole
    thread policing people who idle to "increase the number of flight
    hours". Supervisors warn "long-term parking pilots". Hours are worth
    cheating for, which is the cleanest proof they are the currency.
  - https://stats.vatsim.net/ — opened; the official personal-stat site,
    login-gated, so sharing one's month means screenshots of it.
  - https://www.reddit.com/r/VATSIM/comments/1pazqke/vatsim_pilot_hours_statistics —
    "Yesterday someone made a post in VATSIM Facebook group wondering about
    average hours of VATSIM pilots. I got curious myself and ended up writing"
    a scraper; the thread then compares individuals' hours
    ("41926 is pretty impressive!"). (Reddit 403s the fetch helper; read via
    search excerpt.)
  - https://www.facebook.com/groups/608473926761307/posts/1976861463255873 —
    a group post: "What's everyone's flying hours on vatsim? Mine 611hours",
    replies "Just reaching 5000 hours on Vatsim."
- Why m0saic fits: a month's log is exactly rectangles — a stat band plus
  PIREP rows the community already recognises column-for-column, plus a
  milestone line. Props mirror the phpVMS log fields (designator, sector,
  airframe, block, fpm). Deterministic, one card per pilot per month,
  batchable from the CSV a VA already exports.
- Risks: AvioDeck (https://aviodeck.app/features/vatsim-pilots, opened) has
  "shareable achievement cards" on the profile — but per-achievement, not a
  monthly log recap; the gap is the shareable month-end wrap, which today
  only exists behind a login or as "EXPORT PDF". Hours-only pilots outside a
  VA must count by hand. Aircraft type-codes are dense strings; copy must
  fit.

### 2. Sourdough bake journal card
- Who: r/Sourdough and the bake-log apps' users.
- The construct: the bake (formula, hydration, timetable, rating).
- The recurring need: a shareable record of one bake next to the crumb photo.
- Evidence:
  - https://kneadlyapp.com/ — "Bake Journal — Log and learn from every bake…
    Rate each bake on oven spring, crumb, and taste."
  - https://sourdoughandbread.com/sourdough-baking-journal — "Export JSON —
    you control backups"; each entry stores "hydration, leaven style, room
    temperature, and whole-wheat share".
- Risks: the share post is the photo of the crumb; a numbers card is second
  fiddle. Weaker community construct than hours on a network that counts
  them.

### 3. Dog agility title-progress card
- Who: AKC/UKC agility handlers (https://www.ukcdogs.com/agility-all-stars).
- The construct: the Q — one run, score + speed points, toward a title
  string ("MACH25 ... MXS7 PDS").
- Evidence: breed-club monthly ranking sheets, e.g.
  https://gdca.org/wp-content/uploads/Performance-Events/Agility/2026/2026-June-Agility-Scores-Regular.pdf
  ("Agility scores as reported directly from AKC").
- Risks: the showcase happens in private Facebook groups; the artifact is a
  PDF row among many. No open thread found saying "how do I make a card".

### 4. D&D campaign session-recap card
- Who: DMs (r/DMAcademy).
- Evidence: https://www.reddit.com/r/DMAcademy/comments/1tyrxbm/ — "I'm
  drowning in my own notes"; a poster tracks "Session | Prep (hrs) |
  Played (hrs)" as a text table.
- Risks: campaign notes are prose, not a shared structured artifact; the
  table above is about time accounting, not a share picture.

## Pick
VATSIM monthly pilot log card. The construct is one number everyone on the
network keeps and argues about (hours), the artifact already exists row-by-row
in every phpVMS log panel and the official stats site, the recurring moment
(month-end wrap, milestone) is visible in group posts, and what the tools
offer today is a login dashboard, a PDF, or per-achievement badges — not a
shareable card of the month itself. The niche brief from the shelf (chess,
QSL, parkrun) fits: props mirror the PIREP columns the pilots read natively.

## Rejected today
- Sourdough bake card: the photo is the post; numbers card is second fiddle.
- Dog agility title card: private-group sharing, no visible "make me a card" ask.
- D&D session recap: notes are prose, no shared artifact.
- Pickleball match card: SideOut/DUPR already run live scoring and share
  (https://sideoutpb.com/); crowded.
