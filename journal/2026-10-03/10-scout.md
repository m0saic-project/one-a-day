# Scout — 2026-10-03

Thirteen days are done (see `journal/index.json`): dev cards, a timer, an
audiogram, speedruns, powerlifting, birding, crosswords, homebrew, swimming,
sim racing. Ham radio, cubing, tabletop, climbing and chess have not been
touched. Today I went to ham radio first, because it has the clearest "one
construct, one file" setup of any hobby on the list: the QSO record, written
down in ADIF by every logging program.

How I searched: web search for QSL generators, ADIF tools, POTA recaps, contest
score posts, cubing PR cards, running share cards, 40k list graphics and
climbing grade pyramids. `hn.mjs` for "QSL card" and "ADIF" found nothing on
topic. I didn't try reddit (blocked since 2026-09-25, see
`pipeline/research/README.md`). I opened every page cited below with
`fetch-text.mjs`.

## Candidates (3–5, best first)

### 1. QSL card from one ADIF QSO record
- Who: amateur radio operators who confirm contacts with QSL cards, paper or
  emailed. They gather in logger communities (World Radio League forum,
  Wavelog, Log4OM), on eQSL/LoTW/QRZ, and in POTA/SOTA activator circles.
- The construct: the QSO, meaning one contact between two stations. Every
  logging program exports it as an ADIF record with standard field names:
  `CALL`, `QSO_DATE` (YYYYMMDD), `TIME_ON` (HHMM UTC), `BAND`, `FREQ` (MHz),
  `MODE`, `RST_SENT`, `RST_RCVD`, `STATION_CALLSIGN`, `MY_GRIDSQUARE`,
  `MY_POTA_REF` / `MY_SIG_INFO`, `QSL_VIA`
  ([ADIF 3.1.6 spec](https://www.adif.org/316/ADIF_316.htm)).
- The recurring need: after every operating session (a contest weekend, a
  park activation, an evening on FT8), the operator owes a confirmation card
  to every station worked. A card has a fixed shape: my callsign large, "To
  Radio <their call>", and one table row with date, UTC, MHz/band, mode and
  RST, plus my QTH/grid and "PSE/TNX QSL 73". The inputs are always the same
  ADIF fields, the volume is tens to thousands of cards, and the design is
  made once and reused.
- Evidence:
  - [WRL forum, "QSL Card Generator"](https://community.worldradioleague.com/t/qsl-card-generator/13739):
    the opening post (57 likes) asks for exactly this: "select a template ...
    the appropriate information (other callsign/band/frequency/mode/time/report/etc.)
    would be auto populated ... a PNG or JPEG could be saved off". A new
    licensee replies "struggling with putting together a card". The related
    list puts the thread at 43 replies and 1,760 views.
  - [WRL thread page 2](https://community.worldradioleague.com/t/qsl-card-generator/13739?page=2)
    and [WRL "Auto QSL Card"](https://community.worldradioleague.com/t/auto-qsl-card/)
    (April 2026): users ask to send a card "to all contacts made that day ...
    if I'm on a camping trip for 8 days". That is a batch job, one card per
    QSO. On page 2 someone posts a Pillow script that draws text at
    hand-picked (x, y) coordinates, which is the do-it-yourself version of a
    template.
  - [S53ZO ADIF-to-QSL-label](https://github.com/s53zo/ADIF-to-QSL-label)
    ([write-up on cq.sk](https://cq.sk/en/adif-to-qsl-label/)) and the
    [Wavelog QSL Postcard Designer](https://docs.wavelog.org/user-guide/qsl/qsl-postcard-designer/)
    ("drag contact details (callsign, band, date ...) onto a card, save the
    design as a reusable template ... one postcard per callsign"). The
    community already treats this as a template fed by ADIF fields. Every
    current tool is a GUI or a PDF label printer, though; none renders an
    image per QSO from a CLI.
  - [DigiQSL features](https://digiqsl.com/features) and
    [GlobalQSL, via AmateurRadio.com](https://amateurradio.com/qsling-made-easy)
    ("export your log to an ADIF file, upload it to the service"): the
    ADIF-in, card-out workflow is common enough that people pay for it.
- Why m0saic fits: a QSL card is a rigid rectangle grid with no free-form art
  needed: a header band holding the station callsign, a QSO table that is a
  real row of cells (DATE | UTC | MHz | MODE | RST), a station block (grid,
  QTH, park ref, rig/power) and a footer. Props can map 1:1 to ADIF field
  names, so a member reads the prop list and recognises their log. It is
  deterministic and batchable: one `m0saic make` per ADIF record, and the
  same props always give the same card. Card proportions are standard
  (5.5 x 3.5 in, about 11:7), and the template also works as a square or
  portrait share image.
- Risks: QSL cards usually carry a photo background (shack, park, scenery).
  The demo has to look good on solid colour and geometry alone, with any
  photo slot optional, because we ship no media. There is prior art
  (eQSL, DigiQSL, Wavelog, WRL), so the demo has to win on being headless,
  scriptable and recognisably ADIF-shaped, not on being the first card
  maker. Callsign widths vary (K1A to VP2V/G4ABC), so the text-fit rules
  need care. Multi-QSO cards (several rows for one station) are a natural
  extension, but the brief should hold v1 to one to three rows.

### 2. Contest claimed-score card (Cabrillo / 3830 summary)
- Who: radio contesters. They post "score rumors" to
  [3830scores.com](https://www.3830scores.com/) within hours of every
  weekend contest.
- The construct: the contest log (Cabrillo) and its summary: QSOs, mults,
  hours, claimed points, per-band breakdown, club.
- The recurring need: every weekend has several contests. The current list
  shows CWT, NCCC Sprint, QSO parties and CQWW RTTY in one week. Operators
  post the same row format each time.
- Evidence:
  - [3830scores.com home](https://www.3830scores.com/): the site exists "to
    make it easier for contesters to share their claimed scores ...
    immediately after a contest". It lists dozens of contests per week.
  - [AmateurRadio.com "3830 Claimed Scores" posts](https://amateurradio.com/tag/3830-claimed-scores):
    a blogger re-types results into the same shape every time ("N4AF | 50 Qs
    | 32 Mults | 1,600 Points [PVRC]").
- Why m0saic fits: a band-by-band QSO/mult table plus a big score number,
  i.e. bars and cells driven by numbers.
- Risks: it is close to day 2 (bench rows) and day 8 (meet board) in shape.
  The audience mostly wants to see the leaderboard, not a picture of their
  own score. Evidence of anyone asking for a graphic is thin.

### 3. POTA activation recap card
- Who: Parks on the Air activators, who blog and post every activation.
- The construct: the activation log (ADIF with `MY_POTA_REF`), the park
  reference (e.g. GB-6728) and the 10-QSO threshold for a valid activation.
- The recurring need: a short "activated park X, N QSOs, bands, best DX"
  post after each outing.
- Evidence: [Ian Renton, "POTA Activation Report: Wareham Forest"](https://ianrenton.com/blog/pota-activation-report-wareham-forest/)
  is a prose recap of 1 QSO, then 14 QSOs, with the threshold story told in
  words.
- Why m0saic fits: a progress-to-10 bar, band/mode tallies and a park
  header, all count-driven.
- Risks: the picture people actually want is a map of contacts, which is
  geography, not rectangles. I found one blog, not a community asking for
  this. It could fold into candidate 1 later as a "QSL with park ref".

### 4. Cubing session / ao5 card (csTimer export)
- Who: speedcubers. The SpeedSolving forum runs a
  [weekly competition](https://www.speedsolving.com/threads/weekly-competition-2025-32.95263/)
  under WCA rules.
- The construct: five solves to one average (best and worst dropped,
  shown in parentheses) from csTimer's session export.
- Risks: I found no source where cubers ask for a graphic. The csTimer
  screenshot is the norm and seems good enough for them. The "best/worst
  dropped" story is also close to the day 7 speedrun recap.

### 5. Race result share card (running)
- Evidence: [RunDida share card generator](https://rundida.com/tools/share-card/)
  already makes 1080x1080 race cards with a PB badge.
- Risks: mainstream, already served by browser tools, and a fourth
  sports-results card in nine days.

## Pick
**QSL card from one ADIF QSO record.** It has the best fit with the founder's
direction: a niche with one construct, a standard file every member already
has, field names the template can mirror, and a public thread where members
describe this exact template ("auto populated ... saved off as a PNG").
Contest scores and POTA recaps are real but nobody is asking for a picture.
Cubing and running either lack evidence or already have tools.

## Rejected today
- Warhammer 40k army list card: list exports are long free text, and making
  them look good is taste-heavy and IP-adjacent. The tools that exist (War
  Organ, the official app) already export.
- Climbing grade pyramid: theCrag already renders one from the logbook,
  including 8a.nu imports.
- Chess game card from PGN: lichess already exports game GIFs, and a board
  is not the rectangles-and-props problem m0saic is best at.
- Speedsolving weekly results graphic: results live in a forum table that
  the site generates. I found no complaint about it.
