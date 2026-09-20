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

Search terms that tend to find media workflows worth a template: "how do I
make a video that", "batch export", "every week I have to", "thumbnail",
"overlay", "timeline", "highlight reel", "lyrics video", "chart animation",
"screen recording", "before and after", "progress bar", "countdown",
"changelog video", "release notes", "demo gif".
