# Ship - 2026-09-24

## @one-a-day/dev/app-store-screenshot-frame/v1 - App Store Screenshot Frame

This image template turns one mobile capture, localized headline, app name, sequence number, and two colors into a consistent store-listing PNG for indie iOS and Android developers. With no capture it renders a deterministic planner demo, so the default remains a useful finished example.

## Render it

`m0saic make @one-a-day/dev/app-store-screenshot-frame/v1 --template-repo . -w 1920 -h 1080 -o out.png`

Props worth trying: `--props '{"headline":"Focus without the clutter","appName":"DAYLIGHT","slideNumber":2,"slideCount":5,"accentColor":"#00d9ff","backgroundColor":"#101218"}'`

Why it exists (the tutorial): `m0saic make @one-a-day/dev/app-store-screenshot-frame/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4`

## Verification status

The selected variant `a` report is clean: landscape, portrait, square, validation, and the six-page tutorial all completed with exit 0 and no degraded render. The final `npm run verify` passed 81 Jest tests, 41 pipeline tests, lint, loader contract, dependency policy, layout checks, and tutorial-truth checks. `m0saic doctor . --json` reported `"ok": true` with no warnings. `node tools/check-why.mjs --json` also passed without warnings after the runner timeline was refreshed through the prior ship attempt. The 67,580-byte browse preview was inspected and is representative at frame zero.

The supervising Codex session resolved the restricted phase's mask-cache EPERM error by running the exact tutorial validation with approved cache access; it exited 0. The final render report records all three image renders, nine stills, and the tutorial with exit 0 and `ok: true`. The runner independently passed template and tutorial validation, all verification checks, and doctor with zero warnings, then committed `f28fe81` and pushed it to `origin/main` at 09:09:50 America/Los_Angeles. `M0SAIC_ROOT` was never redirected. The shipping phase's earlier blocked notes are superseded by this successful gate result.

## Token cost audit

The final audited reported-usage total, including both shipping attempts and the recovered pre-reset build counter, is 14,029,184 tokens: 13,949,738 input tokens (including 13,297,920 cached), plus 79,446 output tokens. At the published GPT-5.6 Sol standard short-context API-equivalent rates checked on 2026-09-24, the estimate is $9.51536 (rounded: $9.52). This is not an invoice: failed requests without reported usage, supervising-chat usage, service tier, tool charges, and per-request context length are unavailable or excluded, so long-context and fast-mode pricing are not applied. See `60-token-costs.md` and `token-costs.json` for the phase breakdown and pricing source. This final accounting includes the last shipping attempt, which completed after the subtotal recorded in the original template shipping commit.

## Weak spots (honest; a human polish pass starts here)

The generic shell deliberately avoids platform claims, so it will not match a specific device silhouette. Long translated copy still has to stay within the declared 72-character headline and 96-character subhead limits. The template makes one framed image per render; capture, translation, upload, and current store-policy compliance remain outside its scope.

## Follow-ups (what v2 would do)

A v2 could accept a structured batch of locales and screen records, add safe-area presets without naming hardware, and expose alternate copy/device balance presets while preserving contain-only capture placement.
