# Research helpers

Keyless fetchers the scout phase can call so its research is reproducible and
does not depend on which agent CLI is running or what web tools it has.
Every script prints JSON to stdout, takes no secrets, and is rate-limit polite
(one request, a real User-Agent, short timeouts).

| Script | What it does |
|---|---|
| `node pipeline/research/hn.mjs "<query>" [--days 30] [--n 20]` | Hacker News via the Algolia search API: stories (and comments with `--comments`) matching the query, newest first, with points and comment counts |
| `node pipeline/research/reddit.mjs r/<sub> [--q "<query>"] [--sort top\|new\|hot] [--t week] [--n 25]` | A subreddit listing or search through reddit's public `.json` endpoints |
| `node pipeline/research/fetch-text.mjs <url> [--max 60000]` | One URL → readable text (scripts/styles/nav stripped), capped in size, for reading an article or a thread |

**Not available without keys:** X/Twitter (no public API), Instagram, TikTok.
For those the scout uses the agent's own web search and cites the URL it read.

**Reddit (checked 2026-09-26):** `reddit.mjs` gets 403 from `www.reddit.com`
and `api.reddit.com` for anonymous clients (all of day 6's attempts and
today's), `old.reddit.com` serves a "Welcome to Reddit" wall instead of JSON,
and Anthropic's web search refuses the domain outright ("not accessible to
our user agent"). Days 3 and 5 (Codex) cited reddit threads. A working
keyless path would need a reddit OAuth app, which is a founder decision (a
secret on the runner). Until then a scout that cannot open a thread goes to
the community's other homes and cites those.

Search terms that tend to find media workflows worth a template: "how do I
make a video that", "batch export", "every week I have to", "thumbnail",
"overlay", "timeline", "highlight reel", "lyrics video", "chart animation",
"screen recording", "before and after", "progress bar", "countdown",
"changelog video", "release notes", "demo gif".

For niche communities (the scout's first stop): "<hobby> splits", "<hobby>
export", "share my <PB|log|list|session>", "recap", "overlay for my runs",
"graphic from my <log>", "file format", "is there a tool that turns my
<artifact> into", and the hobby's own nouns (PB, gold split, QSO, ao5, lap
delta, army list).
