# Token cost audit - 2026-09-24

The user explicitly requested token costs. This audit is maintained by the supervising Codex session; phase agents should preserve it.

## Provenance

- The first manual runner used its default `claude` adapter but stopped during preflight, before any model phase ran.
- The manual Codex retry overlapped with the scheduled runner's dependency installation and failed preflight. No model phase ran in that retry.
- The scheduled runner selected `codex-sol`, explicitly passing `gpt-5.6-sol`. Its phase logs are the authoritative usage source. A phase's generic self-declaration is not evidence that the explicit model flag changed.
- The active scheduled runner did not inherit the manual operator context. The normal repository contract still requires tokens and dollars in the tutorial.

## Pricing checked on 2026-09-24

Official source opened: https://developers.openai.com/api/docs/models/gpt-5.6-sol

Standard API-equivalent rates per million tokens: input $4, cached input $0.40, output $20. Requests above 272,000 input tokens have 2x input and 1.5x output pricing. Fast-mode rates and actual subscription charges are not inferred from a model name.

The pipeline's generic `gpt-5` fallback uses older rates ($1.25 input, $0.125 cached input, $10 output). Its estimate is not verified pricing for GPT-5.6 Sol. Preserve the raw trace; this audit will report a separate estimate using the explicit model's published rates.

Codex `input_tokens` includes cached input. Calculate standard short-context API-equivalent dollars as `(input_tokens - cached_input_tokens) * 4 / 1e6 + cached_input_tokens * 0.4 / 1e6 + output_tokens * 20 / 1e6`. Do not add cached input again when reporting total tokens.

The table below includes completed phase usage events available when this audit was generated. The supervising chat's usage is not exposed here and will be excluded, explicitly. Dollar estimates are API equivalents, not a subscription invoice; tool charges and unreported usage are excluded.

## Measured phase usage

| Phase | Input (includes cache) | Cached input | Output | Total tokens | API-equivalent USD |
| --- | ---: | ---: | ---: | ---: | ---: |
| scout-1 | 945605 | 851968 | 8285 | 953890 | $0.8810 |
| plan-1 | 1919775 | 1802880 | 11247 | 1931022 | $1.4137 |
| build-1 | 1195482 | 1121280 | 6530 | 1202012 | $0.8759 |
| build-1-before-reset | 6251312 | 6097536 | 31750 | 6283062 | $3.6891 |
| critique-1 | 284372 | 237440 | 3448 | 287820 | $0.3517 |
| ship-1 | 1735032 | 1655424 | 8991 | 1744023 | $1.1604 |
| ship-2 | 1618160 | 1531392 | 9195 | 1627355 | $1.1435 |
| **Total** | **13949738** | **13297920** | **79446** | **14029184** | **$9.5154** |

Reproduce with `node journal/2026-09-24/token-cost-audit.mjs`. Raw CLI transcripts and the runner trace remain unchanged. The runner tutorial may use its older generic estimate; this audit supplies the separately verified pricing basis.

The interrupted first build is recovered separately from its local Codex session token counter, preserved in `recovered-build-usage.json`. That thread emitted no turn.completed usage event, so it is not duplicated in the phase transcript totals.

**Incomplete accounting:** these logs contain failed turns or lack a completed usage event: `build-1.jsonl`, `build-2.jsonl`, `build-3.jsonl`. Their unreported usage is excluded, not treated as zero. Totals above cover reported usage only and are not the complete cost of all attempts.
