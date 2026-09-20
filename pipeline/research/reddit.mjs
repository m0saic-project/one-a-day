#!/usr/bin/env node
// Reddit public JSON (no key; polite UA; one request). Prints JSON.
const argv = process.argv.slice(2);
const sub = (argv.find((a) => !a.startsWith("--")) ?? "").replace(/^\/?r\//, "");
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
if (!sub) { console.error('usage: node pipeline/research/reddit.mjs r/<sub> [--q "<query>"] [--sort top|new|hot] [--t day|week|month|year] [--n 25]'); process.exit(2); }
const q = opt("--q");
const sort = opt("--sort", q ? "relevance" : "top");
const t = opt("--t", "week");
const n = Number(opt("--n", 25));
const url = q
  ? `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=${sort}&t=${t}&limit=${n}&raw_json=1`
  : `https://www.reddit.com/r/${sub}/${sort}.json?t=${t}&limit=${n}&raw_json=1`;
const res = await fetch(url, { headers: { "user-agent": "one-a-day-scout/1.0 (+https://github.com/m0saic-project/one-a-day)" }, signal: AbortSignal.timeout(15000) });
if (!res.ok) { console.error(`reddit: ${res.status} (reddit rate-limits anonymous clients; wait a minute)`); process.exit(1); }
const j = await res.json();
const rows = (j.data?.children ?? []).map(({ data: d }) => ({
  title: d.title, url: `https://www.reddit.com${d.permalink}`, link: d.url && !d.url.includes(d.permalink) ? d.url : null,
  score: d.score, comments: d.num_comments, flair: d.link_flair_text ?? null, createdUtc: d.created_utc,
  text: d.selftext ? String(d.selftext).replace(/\s+/g, " ").slice(0, 800) : undefined,
}));
console.log(JSON.stringify({ subreddit: sub, query: q ?? null, sort, t, count: rows.length, results: rows }, null, 2));
