# Scout - 2026-09-21

Ten search angles were run in parallel as subagents of this session (HN via
`pipeline/research/hn.mjs`, Reddit via `pipeline/research/reddit.mjs`, plus web
search and `fetch-text.mjs`), each saving what it opened under
`logs/research/` - 202 captures. Every URL quoted below was opened by this run.

Two things to record before the candidates, because they shape what the
evidence could be:

- **Reddit was unreachable all day.** `pipeline/research/reddit.mjs` returned
  `403 (reddit rate-limits anonymous clients)` on every call from this machine,
  across r/devops, r/sre, r/webdev, r/podcasting, r/VideoEditing, r/Teachers,
  r/smallbusiness, r/WeAreTheMusicMakers, r/commandline, r/rust, r/javascript
  and r/opensource, over ~90 minutes. `site:reddit.com` through web search
  returned nothing either. Seven of the ten angles lost their primary source.
  Today's evidence is therefore Hacker News + the open web + GitHub, and the
  Reddit-flavoured candidates below are weaker than they would otherwise be.
  A note for whoever maintains `pipeline/research/`: the helper needs a UA or
  the `.json` endpoint.
- **One capture set was lost.** The `reddit-podcast-video` angle self-reported
  running `rm -f journal/2026-09-21/logs/research/*.json` early on to clear its
  own scratch, which also removed captures other angles had already written.
  Everything cited here was re-fetched or is still on disk; the count above is
  post-incident.

## Candidates (5, best first)

### 1. The before/after benchmark picture, regenerated every release

- **Who:** maintainers of libraries, compilers, runtimes, linkers, bundlers and
  model weights who publish a performance claim - esbuild, oxc/oxlint,
  hyperfine users, BenchmarkDotNet/criterion/pytest-benchmark users. They
  gather on GitHub READMEs and release notes, in CI bot PRs, and on Hacker
  News launch threads.
- **The recurring need:** every release - sometimes every push to main - they
  re-measure and must re-publish a picture of the same shaped numbers. The
  numbers already exist as machine-readable output. The picture does not.
- **Evidence:**
  - <https://github.com/benchmark-action/github-action-benchmark> (opened
    2026-09-21) - the de-facto CI benchmark action: "Every entry in the JSON
    file you provide only needs to provide `name`, `unit`, and `value`. You can
    also provide optional `range` (results' variance)". Its own regression
    check is a ratio threshold: "this action marks the result as performance
    regression when it is worse than the previous exceeding 200% threshold."
  - <https://github.com/sharkdp/hyperfine/tree/master/scripts> (opened
    2026-09-21) - **the strongest single item in the run.** hyperfine has 28.9k
    stars and ships SIX plotting scripts of its own
    (`plot_benchmark_comparison.py`, `plot_whisker.py`, `plot_histogram.py`,
    `plot_parametrized.py`, `plot_progression.py`, `advanced_statistics.py`),
    because `--export-json` is not a picture. The price of entry: "To make
    these scripts work, you will need `numpy`, `matplotlib` and `scipy`." The
    maintainers shipped the chore themselves rather than eliminate it.
  - <https://news.ycombinator.com/item?id=49370832> (2026-08-20) - a GNU
    coreutils co-maintainer on someone else's benchmark post: "I find it a bit
    frustrating that benchmarks are thrown out without any methodology or
    citations, because they are often trusted without question."
  - <https://news.ycombinator.com/item?id=49770064> (2026-09-19) - a reader on
    a filesystem benchmark write-up: "there's just far too much for a human to
    absorb, all presented at once ... Overall text size is quite small, and
    difficult to read ... A significant proportion of the free text is
    caveats." A row cap, a type floor and ONE caveat line, from the audience.
  - <https://github.com/evanw/esbuild> README (opened 2026-09-21) - the
    benchmark at the top of the README is two hand-committed files,
    `images/benchmark-light.svg` and `images/benchmark-dark.svg`.
  - <https://github.com/oxc-project/bench-resolver/pull/184> (2026-09-20, one
    day before this run) - "Automated benchmark results update triggered by a
    change to main." A bot re-opens this PR on every change; the artifact is a
    markdown table, not a picture.
  - <https://github.com/zackees/llvm-ld/issues/32> (2026-09-18) - an issue that
    reads as a spec for this template: four build modes, paired bars in ms,
    direct-labelled, light and dark, deterministic, README-embedded, with an
    interquartile whisker per bar. "Bar length proportional to time is the
    honest encoding." **Discounted on verification:** the repo shows 0 stars
    and 0 forks and the issue is already closed. It is one person writing an
    excellent spec for their own README, not a demand signal from a group.
  - <https://news.ycombinator.com/item?id=49727511> (2026-09-16) - nine paired
    benchmark rows posted to HN as flat text, no chart anywhere.
- **Why m0saic fits:** the rectangle IS the measurement. A bar drawn relative to
  its own baseline is the speedup; a second rectangle for the run-to-run
  interval is the honesty; whether two intervals overlap is the verdict. Delete
  a rectangle and a number is gone. The inputs are the rows a harness already
  prints, so this is `--props @bench.json` and nothing else. Determinism is the
  point: the same numbers must produce the same committed PNG, or the README
  diff is noise.
- **Risks:** bar charts are the most crowded shape in software and the official
  m0saic library already ships `@m0saic/charts/bar-graph/v2`; this earns its
  place only if the interval and the derived verdict are real. Benchmark names
  are long and user-supplied ("My Custom Smaller Is Better Benchmark - CPU
  Load") - text fitting is the #1 defect risk. Mixed units across rows make one
  shared linear scale a lie. A `smallerIsBetter` flag read backwards renders a
  confident lie.

### 2. The incident timeline (the anatomy of an outage)

- **Who:** SRE / on-call engineers writing public postmortems.
- **The recurring need:** every incident produces a timeline that is retold as
  prose; the graphic version is hand-made in Figma or skipped.
- **Evidence:** a dense cluster of tiny Show HNs, all solving the *text*
  postmortem and none the picture -
  <https://news.ycombinator.com/item?id=46647049>,
  <https://news.ycombinator.com/item?id=46575349>,
  <https://news.ycombinator.com/item?id=47142521>,
  <https://news.ycombinator.com/item?id=47151143>. Also
  <https://news.ycombinator.com/item?id=45810991> ("Ask HN: Why are most status
  pages delayed?").
- **Why m0saic fits:** x is clock time and width is duration, so the gap between
  "CPU spike begins" and "first alert" is drawn to scale rather than asserted.
- **Risks:** the evidence proves the timeline is assembled painfully and proves
  nobody currently makes it as a graphic - which is as easily read as "there is
  no demand" as "there is an unmet need". Event labels cluster densely at t0.

### 3. Bundle / dependency weight treemap, before to after

- **Who:** frontend and dev-tool maintainers watching bundle size per release.
- **Evidence:** BundleMon / size-limit / Codecov all post text tables in PR
  comments; the `web-open-source-maintainers` angle found the data everywhere
  and the picture nowhere.
- **Why m0saic fits:** area is the share, exactly.
- **Risks:** `@m0saic/alpine/treemap/v2` already exists in the official library,
  and squarified geometry against this repo's 5-smooth split rule is a day of
  work on its own. Rejected mostly on duplication.

### 4. Weekly league standings / power-rankings movement clip

- **Who:** grassroots clubs, fantasy leagues, esports organisers.
- **Evidence:** entirely blocked - this was a Reddit angle and Reddit was 403
  all day. What survived is vendor marketing, which is not evidence.
- **Risks:** what these communities actually want is crests and avatars, which
  a deterministic template cannot fetch.

### 5. Eval run grid - the models x trials pass/fail matrix

- **Who:** people publishing LLM eval results.
- **Evidence:** <https://news.ycombinator.com/item?id=47860393> ("Each model ran
  10 times per document to measure reliability, not just one-shot accuracy;
  7,560 API calls total"). Thin beyond that: a comment search for eval result
  comparison charts returned 0 hits over 300 days.
- **Risks:** one row per model times one cell per trial is a lot of sub-pixel
  rectangles at 640x360.

## Pick

**Candidate 1 - the before/after benchmark picture.** Four of the ten angles
proposed it independently without seeing each other's work, which is the
strongest convergence in the run, and it is the only candidate where the
incumbent path is documented end to end: the rows exist
(`github-action-benchmark`), the picture is wanted (esbuild commits two SVGs by
hand; the llvm-ld issue asks for exactly this), and the current answer is a
Python scientific stack (`plot_whisker.py` + numpy + matplotlib + scipy) or
nothing.

The second reason is a constraint the scout turned up rather than an
opportunity, and it decides the design: **this audience distrusts animated
charts.** Verbatim, from <https://news.ycombinator.com/item?id=30268920>
(titzer, 2022-02-09): "You wouldn't make a bar chart and put some bars on one
page and some bars on another page. Animated charts are like that. They're
entertainment, not a tool for seriously comparing data." And from
<https://news.ycombinator.com/item?id=21535972> (2019-11-14) on bar chart
races: "A bar chart race is in many ways 'worse' than a static chart. The bar
chart race forces you to wait for the animation to finish." A search for
developers asking for an animated benchmark clip returned nothing. So the
template ships as a STILL by default, and any motion it offers must not move a
single data rectangle. That goes into the brief.

## What the verification pass changed

Every candidate was handed to a second, adversarial reader whose brief was to
assume the evidence was thinner than claimed and to open every link. Ten of
ten survived as openable; eight came back REAL, two THIN (the incident
timeline, the bundle treemap). Four things changed:

- **The llvm-ld issue was demoted** (above). It reads like a spec because it
  is one, but it is one person's repo.
- **One claim was falsified.** The sweep asserted that "almost none" of these
  posts carry a chart. <https://lemire.me/blog/2026/09/18/how-did-amd-ryzen-get-50-faster-in-two-years/>
  (2026-09-18) carries five chart images plus matching numeric tables. The
  honest reframing is not "nobody makes the picture" but "the per-post
  workload is five pictures, made by hand".
- **The hyperfine evidence got stronger, and is the one that matters** - six
  scripts, not one, behind a numpy/matplotlib/scipy wall.
- **The best counter-argument was found, and it is not weak.** The strongest
  items here - hyperfine's scripts, github-action-benchmark's 1.3k stars -
  prove the chore is real by showing it is *already tooled*. A skeptic reads
  exactly the same facts as "this is solved; nobody is waiting for you". The
  answer this template bets on is not "no tool exists" but "every existing
  tool draws the number and none of them draws the doubt".

## Rejected today

- **Flamegraphs:** 25 HN stories over 540 days, all tool announcements
  (ETTrace, MyFlames, xtrace, timep). Nobody describes making the *picture*
  repeatedly - the picture is a by-product of the tool. Lovely shape, no chore.
- **Trace/span waterfalls, latency histograms:** 0 comments over 720 days. They
  live inside APM UIs and are never exported as a repeated artifact.
- **CI stage-duration waterfalls:** people complain CI is slow; they do not make
  a graphic of it.
- **Bar chart race / ranking race:** saturated (Flourish and a dozen tools), and
  the only substantive HN discussion of the form is people explaining why it is
  a bad chart.
- **Carousel slides, quote cards, menu boards, price lists, tour-date cards:**
  rectangles holding text, not rectangles that are data. Excluded by the
  operator note, and the quote card is a sibling of day 001.
- **Audiograms:** needs audio analysis m0saic does not do.
- **Scripted terminal clips:** Charm's VHS already does this deterministically
  from a `.tape` file.
- **star-history charts:** a hosted service already emits an embeddable still.
- **Sponsor walls:** tier does map to tile size, but the emotional content is
  avatars, which cannot be fetched.
