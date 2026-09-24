# Ship - 2026-09-24

## @one-a-day/dev/app-store-screenshot-frame/v1 - App Store Screenshot Frame

This image template turns one mobile capture, localized headline, app name, sequence number, and two colors into a consistent store-listing PNG for indie iOS and Android developers. With no capture it renders a deterministic planner demo, so the default remains a useful finished example.

## Render it

`m0saic make @one-a-day/dev/app-store-screenshot-frame/v1 --template-repo . -w 1920 -h 1080 -o out.png`

Props worth trying: `--props '{"headline":"Focus without the clutter","appName":"DAYLIGHT","slideNumber":2,"slideCount":5,"accentColor":"#00d9ff","backgroundColor":"#101218"}'`

Why it exists (the tutorial): `m0saic make @one-a-day/dev/app-store-screenshot-frame/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4`

## Verification status

The selected variant `a` report is clean: landscape, portrait, square, validation, and the six-page tutorial all completed with exit 0 and no degraded render. The final `npm run verify` passed 81 Jest tests, 41 pipeline tests, lint, loader contract, dependency policy, layout checks, and tutorial-truth checks. `m0saic doctor . --json` reported `"ok": true` with no warnings. `node tools/check-why.mjs --json` also passed without warnings after the runner timeline was refreshed through the prior ship attempt. The 67,580-byte browse preview was inspected and is representative at frame zero.

The supervising Codex session reran `render-variant.mjs` with approved cache access and refreshed `variants/a/report.json`: all three image renders, nine stills, and the tutorial completed with exit 0 and `ok: true`. However, the exact final tutorial validation still requests uncached `C:\Users\MainDesktop\m0saic\cache\masks\mask-5fda60e1b2f7de4c.png`. Repeated attempts, including the prescribed one-minute retry and another after the approved refresh, fail before plan completion with `EPERM`; ACL inspection confirms this restricted phase has read/execute but not write access to the real cache. `M0SAIC_ROOT` was never redirected. This is an environment permission failure, not an error mosaic or template finding, so the ship ledger remains unset until that exact command exits 0 on the runner host.

## Token cost audit

The corrected reported-usage total is 10,657,806 tokens: 10,596,546 input tokens (including 10,111,104 cached), plus 61,260 output tokens. At the published GPT-5.6 Sol standard short-context API-equivalent rates checked on 2026-09-24, the estimate is $7.2114. This is not an invoice: failed turns without completed usage, supervising-chat usage, service tier, tool charges, and per-request context length are unavailable or excluded, so long-context and fast-mode pricing are not applied. See `60-token-costs.md` and `token-costs.json` for the phase breakdown and pricing source.

## Weak spots (honest; a human polish pass starts here)

The generic shell deliberately avoids platform claims, so it will not match a specific device silhouette. Long translated copy still has to stay within the declared 72-character headline and 96-character subhead limits. The template makes one framed image per render; capture, translation, upload, and current store-policy compliance remain outside its scope.

## Follow-ups (what v2 would do)

A v2 could accept a structured batch of locales and screen records, add safe-area presets without naming hardware, and expose alternate copy/device balance presets while preserving contain-only capture placement.
