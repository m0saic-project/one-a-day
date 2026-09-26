Find today's use case: one recurring **media workflow** somewhere on the web that
a deterministic m0saic template could serve, and that this repo has not done
before.

## What counts

A use case is a group of people who repeatedly need the same kind of picture or
clip made from data or media they already have: a card, a chart clip, a
before/after, a caption reel, a countdown, a changelog video, a lyric video, a
grid of screenshots, a progress bar, a release banner, a badge, a thumbnail.
m0saic is rectangles on a canvas, driven by props, rendered by the CLI with no
GUI — so the best use cases are batchable, repeatable, and visual-but-structured.
Free-form artwork, hand-edited video, and anything that needs a person to nudge
pixels are bad fits.

## Lean niche: communities organised around one construct

Standing direction from the founder (2026-09-26): look first in **niche
communities**, where people organise around one shared construct that every
member already understands, usually with a shared tool that writes it down.
Examples: speedrunners and their split files (LiveSplit `.lss`: segments, PB
times, gold splits), cubers and their solve sessions, chess players and PGN,
ham radio operators and ADIF logs, sim racers and lap telemetry, tabletop
players and their army or deck lists, birders and their checklists. Such a
community already has what a template needs: a recurring moment (a PB, a
contest, a meet, a release), a structured artifact it already produces, and
a way it shows off to itself (clips, cards, overlays, recap posts) that is
still made by hand.

- Find the construct and its artifact first: what file or tool output does
  everyone there already have? A template whose props mirror that artifact
  (its field names, its units) is one the community recognises.
- The day's template is a **demo that shows the idea**, not the production
  tool: the smallest clip or card that makes a member say "oh, I can see
  this". The founder builds the plausible ones out properly.
- Look where they live: the hobby's subreddit and its wiki, its own forums,
  its leaderboard or stats site, the GitHub org of its tooling, its Steam or
  Discord-adjacent pages that are public.
- A mainstream use case can still win on stronger evidence; if it does, say
  in `## Pick` why it beat the niche candidates.

## Where to look

1. Read `journal/index.json` (root of the repo) — the use cases already done.
   Do not repeat one; a genuinely different angle on a busy area is fine.
2. Your own web search, plus the keyless helpers (each prints JSON):
   - `node pipeline/research/hn.mjs "<query>" --days 60 --n 25` (add `--comments` for comment threads)
   - `node pipeline/research/reddit.mjs r/<sub> --q "<query>" --t month` — subs worth a look:
     niche: r/speedrun, r/Cubers, r/chess, r/amateurradio, r/simracing, r/boardgames,
     r/Warhammer40k, r/birding, r/running, r/climbing, r/homebrewing, r/osugame;
     broad: r/VideoEditing, r/youtubers, r/NewTubers, r/podcasting, r/smallbusiness,
     r/marketing, r/datavisualization, r/webdev, r/devops, r/musicians,
     r/WeAreTheMusicMakers, r/Teachers, r/socialmedia, r/Twitch, r/streaming
     (reddit has refused anonymous clients since 2026-09-25 and blocks some agents'
     web tools outright; if you cannot open a thread you cannot cite it, so go to
     the community's other homes)
   - `node pipeline/research/fetch-text.mjs <url>` to read a page or thread
   `pipeline/research/README.md` has query ideas. Spend real time here — at least
   six searches across two or more communities. Follow the complaints: "every week
   I have to…", "is there a tool that…", "how do you all make…".
3. Anything you cite must be a URL you actually opened.

## Output — `{{DAY_DIR}}/10-scout.md`

```
# Scout — {{DATE}}

## Candidates (3–5, best first)
### 1. <name>
- Who: the audience and where they gather (links)
- The construct: what the community organises around, and the artifact it
  already produces (file format, tool output), if there is one
- The recurring need: what they make, how often, from what inputs
- Evidence: 2–4 links with a one-line quote/paraphrase each
- Why m0saic fits: rectangles / props / batch / deterministic — be concrete
- Risks: what could make this a bad template (needs media we lack, taste-heavy, too many knobs)

### 2. …

## Pick
<the one candidate> — two sentences on why it beat the others today.

## Rejected today
- <name>: <one line>
```

Then, in `state.json`, set `useCase` (one short line), `who` (one line: the
audience and where they gather - it seeds the template's why-tutorial),
`sources` (the URLs you cited for the pick), `tags` (3–6 lowercase words) and
finally `scout: "done"`.
