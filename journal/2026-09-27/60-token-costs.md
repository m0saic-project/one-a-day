# Token cost audit - 2026-09-27

Tokens AND dollars, as the founder asked on 2026-09-26. The day was run by hand in one Claude Code session, so there is no runner trace; Claude Code writes every API response, with its usage, to the session transcript, and this page is generated from it by `node journal/2026-09-27/token-cost-audit.mjs` (day 007's script, re-dated and re-priced).

## Basis

- Model: `claude-fable-5-1` (Fable 5.1), effort xhigh, standard speed, one interactive session, no subagents. Models in the transcript: `claude-fable-5-1`.
- List prices checked 2026-09-27 at https://platform.claude.com/docs/en/about-claude/pricing, USD per million tokens: input $10, 5-minute cache write $12.50, 1-hour cache write $20, cache read $0.25 (Fable 5.1 reads at 0.025x input), output $50 (thinking is billed as output). Web search $10 per 1,000; web fetch free beyond tokens.
- One record per API response. The transcript repeats a response's usage on every content-block line (here 59 responses were written as many more lines); summing lines would overstate the cost roughly threefold.
- API-equivalent estimate, not an invoice: the session ran on the founder's Claude plan.
- Outside the transcript: Claude Code runs each WebSearch as a separate request and summarises each WebFetch page with a small model. The fees of the 13 searches ($10 per 1,000) are in the table; the tokens of those 13 search and 2 fetch side requests are not measured, nor is session titling.
- Phases are binned by `logs/phase-marks.json`, written as each phase began. "orient" is the session reading the playbook and the last day, checking the scheduled task, the toolchain and the license, and running verify on the untouched tree.

## Measured

| Phase | Wall | Requests | Input | Cache write (1h) | Cache read | Output (thinking) | Web searches | Tool calls | USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| orient | 4 min | 8 | 16 | 82,187 | 540,219 | 9,449 (3,643) | 0 | 40 | $2.25 |
| scout | 6 min | 10 | 20 | 57,064 | 1,378,439 | 23,017 (12,554) | 13 | 23 | $2.77 |
| plan | 3 min | 3 | 6 | 45,429 | 551,582 | 14,561 (10,453) | 0 | 7 | $1.77 |
| build | 31 min | 28 | 56 | 171,655 | 8,967,157 | 88,254 (25,351) | 0 | 54 | $10.09 |
| critique | 1 min | 1 | 2 | 7,154 | 386,690 | 5,175 (2,225) | 0 | 2 | $0.50 |
| ship | 10 min | 9 | 18 | 53,493 | 3,807,225 | 22,625 (3,721) | 0 | 16 | $3.15 |
| **Total** | **55 min** | **59** | **118** | **416,982** | **15,631,312** | **163,081 (57,947)** | **13** | **142** | **$20.53** |

Where the dollars went: cache reads $3.91, cache writes $8.34, output $8.15, uncached input $0.00, web search $0.13. 16,211,493 tokens in all, measured through 2026-09-27T22:30:19.211Z.
