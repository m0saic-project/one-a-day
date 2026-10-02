---

# This call is a revision — round {{REVISION}}

Everything above describes the build phase; this section says what THIS call
is for. Today's template was built and the critic said **NO SHIP**. That
verdict is `{{DAY_DIR}}/{{REJECTED}}` — read it first, all of it. It is a
review, not the end of the day: you are called to answer it, the critic will
judge the result again, and what it finds then decides the day.

Do not scaffold and do not start over. The template is in place in
`src/<pack>/<slug>/v1/` (`state.json`: `pack`, `slug`, `inPlace`), and
`{{DAY_DIR}}/30-build.md` says how it got there.

1. Fix what the verdict names — every line under "wrong", and "the one thing
   that would have changed the verdict" — in the same id and folder.
2. Then look for what the verdict did NOT name, because the critic judges all
   nine lines again, not only the defect it found the first time. Open the
   stills of the variant in place and read every string in them the way a
   stranger would: a malformed number, a missing sign, a label nothing
   explains, defaults that contradict the brief's "Defaults must show". Hold
   the template against every line of the brief's layout contract and
   acceptance rubric, and against the validation it promised.
3. A feature the brief promised is either built or no longer claimed. If it
   truly cannot be built, say why in `30-build.md` and take the claim out of
   the header comment, the `description` (the template's and the registry
   row's) and `WHY.solution`. A claim the stills do not show is fatal.
4. The loop above from step 3 on: `npm run build` clean, the test beside the
   template asserting the fix, `npm test` green, fingerprints updated. Then
   render into the NEXT free letter — the one after the last entry of
   `state.json.variants`:
   `node pipeline/render/render-variant.mjs @one-a-day/<pack>/<slug>/v1 {{DAY_DIR}}/variants/<letter>`
   A revision does not count against the variants cap. Look at the new
   stills and go through the verdict against them, line by line.
5. If the fix cannot be made to pass the gate, put back the last variant that
   did (`{{DAY_DIR}}/variants/<x>/src/` over the template folder, rebuild),
   and say so plainly in `30-build.md`. The critic will judge what is there.

## Output — append to `{{DAY_DIR}}/30-build.md` (keep everything already in it)

```
## Revision {{REVISION}} — variant <letter>
- The verdict said: <one line>
- Changed: <what, and where in the stills it shows>
- Also fixed: <what the verdict did not name, or "nothing found">
- Still weak: <honest>
```

and bring its `## In place now` line up to date. Add the letter to
`state.json.variants`, set `inPlace` to it, and finally `build: "done"`. Do
not write `decision` or `pick`: the critic decides.
