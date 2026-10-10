# Scout — 2026-10-10

Day 21. Reddit refused the anonymous fetcher all morning (403, as AGENTS.md
warns), so the citations below are the communities' other homes: vendor blogs
and app pages that document the practice. Six searches across four
communities; every URL cited was opened and read.

## Candidates (3-5, best first)

### 1. Golf round scorecard card
- Who: golfers who keep a paper scorecard and post the round afterwards -
  r/golf (the "broke 90" / "best round" posts), GolfWRX and MyGolfSpy forums,
  and the apps built around exactly this moment (TheGrint, Golf GameBook,
  GOLFRiSE, 18Birdies).
- The construct: the scorecard itself - hole number, par, strokes, front nine
  "Out", back nine "In", total. Every golfer writes one, every round, on a
  card in their pocket; the circle-for-birdie / square-for-bogey notation is
  universal. The artifact already exists as data before the round ends.
- The recurring need: after a good round, share it. Today that means a photo
  of the crumpled paper card, or a screenshot of an app's scoring screen.
- Evidence:
  - TheGrint, "Our Scorecard Picture Service and How to Use It"
    (https://thegrint.com/range/post/scorecard-picture-service-use): "If you
    like to keep your score on a traditional scorecard while you play this is
    for you! Simply take a picture of your Scorecard at the end of your round
    and upload it using our SPS feature." - and "we actually have a team of
    real humans reviewing your scorecards", a paid service that exists purely
    to get the paper card's numbers back into data.
  - TheGrint, "TheGrint Scorephoto Giveaway"
    (https://thegrint.com/range/post/scorephoto-giveaway): they built a
    Scorephoto feature and ran a giveaway to push golfers to "share it through
    your favorite social media platform" - the share-the-round moment is real
    enough to market around.
  - Golf GameBook, scorecard page
    (https://www.golfgamebook.com/golf-scorecard): "Get a summary of your
    game after the round... share your highlights on social media with all
    your friends with a single tap!" - the round summary as a shareable is a
    selling point of the app, not a byproduct.
- Why m0saic fits: the scorecard IS a grid of rectangles with 1-2 digit
  numbers - 18 holes x (par, score), two 9-hole strips, an Out/In/Total row,
  a header band. Props mirror the card (pars, scores, course, date, tees).
  One deterministic render per round, batchable for a season or a foursome,
  no GUI. The circle/square notation is shapes in cells - exactly m0saic's
  mask-on-color-tile pattern.
- Risks: 18 columns is the widest grid this repo has shipped beside the
  crossword (15x15, day 010); portrait and square must keep the numbers
  legible. Course names vary in length. The eagle/double-bogey notation
  (two circles / two squares) adds per-cell geometry that must stay readable
  at small cells.

### 2. Camera-settings card for photo posts
- Who: photographers who post work and answer "what were your settings?" -
  r/photography, sports-parent photographers.
- The construct: EXIF - camera, lens, focal length, aperture, shutter, ISO -
  already inside every file.
- The recurring need: the settings caption under a posted photo, currently
  typed into comments.
- Evidence: ShotCard (https://nathanielrohr.com/blog/photography/shotcard,
  opened): "Every time I post a photo, somebody asks the same question. 'What
  were your settings?'... typing 'one one-thousandth, f/2.8, ISO 800' into a
  comment section for the fifteenth time gets old." A sports photographer
  built a whole card maker for this in July 2026.
- Why m0saic fits: a photo (media prop) plus a settings strip - batchable for
  a shoot's worth of selects.
- Risks: the photo dominates and the m0saic value is one caption strip; the
  defaults must render without any media file; and a polished, dedicated,
  free tool (ShotCard) already owns the exact deliverable.

### 3. Espresso dial-in shot card
- Who: home baristas - r/espresso - pulling 3-5 shots to dial in every new
  bag of beans.
- The construct: the recipe - dose in, yield out, time, grind step - logged
  shot by shot.
- The recurring need: share the dial-in progression or the winning recipe.
- Evidence: HomeBarista's dial-in guide
  (https://homebarista.app/guides/how-to-dial-in-espresso, opened): "the
  crucial habit is logging every shot: dose, yield, time, grind setting,
  taste tag. Without a log, the third shot fixes the second's problem" -
  and their tool "shows the progression side-by-side".
- Why m0saic fits: a ladder of shot rows (numbers, one taste word each) from
  a list prop.
- Risks: the coffee apps already build the log AND the share surface
  (HomeBarista, Coffee Journal); the card adds a graphic but not a workflow,
  and the audience overlaps the homebrew serving card (day 011) in feel.

### 4. Disc golf round card
- Who: r/discgolf; UDisc is the shared tool (88% of scorecards use smart
  layouts, per UDisc in the round-rating thread).
- The construct: hole-by-hole vs par, same shape as golf.
- Evidence: UDisc Replay (https://udisc.com/replay, opened): "Display your
  finest works on social media - use the tag #UDiscReplay" - UDisc itself
  generates the year-recap share cards.
- Risks (why it loses): the scoring app already makes the share images and a
  Wrapped-style recap; the "still made by hand" half of the lean-niche rule
  is gone.

## Pick

Golf round scorecard card. The construct is the purest in the repo yet - the
community's own artifact is already a grid of numbers that every member reads
fluently, and the current share practice is literally a photo of a piece of
paper (two vendors, TheGrint and GOLFRiSE, sell services that transcribe that
photo back into data). The competing candidates all had a polished tool
already owning the deliverable; here the apps lock the round inside their own
social layer, and the golfer without a subscription is back to photographing
paper.

## Rejected today
- Camera-settings card: real need, but a dedicated free tool (ShotCard)
  already ships the exact deliverable and the m0saic value-add is one strip.
- Espresso dial-in card: the logging apps already render the progression and
  own the share surface.
- Disc golf round card: UDisc already generates share cards and a yearly
  Replay; nothing is left made by hand.
