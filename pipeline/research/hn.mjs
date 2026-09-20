#!/usr/bin/env node
// Hacker News search (Algolia API, no key). Prints JSON.
const argv = process.argv.slice(2);
const q = argv.find((a) => !a.startsWith("--"));
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
if (!q) { console.error('usage: node pipeline/research/hn.mjs "<query>" [--days 30] [--n 20] [--comments]'); process.exit(2); }
const days = Number(opt("--days", 30));
const n = Number(opt("--n", 20));
const tags = argv.includes("--comments") ? "comment" : "story";
const since = Math.floor(Date.now() / 1000) - days * 86400;
const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=${tags}&numericFilters=created_at_i>${since}&hitsPerPage=${n}`;
const res = await fetch(url, { headers: { "user-agent": "one-a-day-scout/1.0 (+https://github.com/m0saic-project/one-a-day)" }, signal: AbortSignal.timeout(15000) });
if (!res.ok) { console.error(`hn: ${res.status}`); process.exit(1); }
const j = await res.json();
const rows = (j.hits ?? []).map((h) => ({
  title: h.title ?? h.story_title ?? null,
  url: h.url ?? h.story_url ?? null,
  hn: `https://news.ycombinator.com/item?id=${h.objectID}`,
  points: h.points ?? null,
  comments: h.num_comments ?? null,
  createdAt: h.created_at,
  text: h.comment_text ? String(h.comment_text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600) : undefined,
}));
console.log(JSON.stringify({ query: q, days, count: rows.length, results: rows }, null, 2));
