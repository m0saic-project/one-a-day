#!/usr/bin/env node
// One URL → readable text. Strips scripts, styles, nav/footer/aside, tags.
const argv = process.argv.slice(2);
const url = argv.find((a) => !a.startsWith("--"));
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
if (!url) { console.error("usage: node pipeline/research/fetch-text.mjs <url> [--max 60000]"); process.exit(2); }
const max = Number(opt("--max", 60000));
const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; one-a-day-scout/1.0; +https://github.com/m0saic-project/one-a-day)", accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
if (!res.ok) { console.error(`fetch: ${res.status} ${url}`); process.exit(1); }
const type = res.headers.get("content-type") ?? "";
const html = await res.text();
const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
let body = html;
if (/html/.test(type)) {
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(nav|footer|aside|header|form|svg|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article|blockquote|pre)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}
console.log(JSON.stringify({ url, contentType: type, title, truncated: body.length > max, text: body.slice(0, max) }, null, 2));
