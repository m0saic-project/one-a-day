# Scout - 2026-10-18

## Candidates (4, best first)

### 1. Warhammer 40k BattleScribe roster share card
- **Who:** Competitive Warhammer 40,000 players on r/WarhammerCompetitive, r/WarhammerListBuilding, faction Discords, and tournament check-ins.
- **The construct:** The community builds armies in BattleScribe and shares the resulting `.ros` / `.rosz` roster file (XML inside a zip). The file is the shared artifact: it lists forces, detachments, units, wargear, enhancements and points.
- **The recurring need:** "Rate my list" posts are constant. Players currently paste walls of text or screenshots of BattleScribe printouts that are hard to read. r/WarhammerListBuilding was created specifically because list posts were cluttering the main competitive sub.
- **Evidence:**
  - https://www.goonhammer.com/buttscribe-printed-materials-for-you-and-others/ - Goonhammer's ButtScribe exists because "BattleScribe printouts are ten pages long and practically illegible"; it turns a roster into a printable PDF and an embeddable army-summary image.
  - https://www.reddit.com/r/WarhammerCompetitive/comments/1r447pt/best_appsite_for_building_lists_to_share_for/ - "screenshots contain so much more info than friends/teammates/coaches would need to critique a list."
  - https://www.reddit.com/r/WarhammerCompetitive/comments/1h83ytt/new_listbuilding_subreddit/ - r/WarhammerListBuilding was created because list-building posts were missing a dedicated home; top comment: "Hopefully all the 'rate my list'-posts will migrate there."
  - https://www.reddit.com/r/WarhammerCompetitive/comments/i3pj79/i_am_currently_working_on_a_prototype_app_to/ - A community member built a prototype app to "upload, display (and later share) Battlescribe lists" because the native sharing was poor.
- **Why m0saic fits:** A roster is already a rectangle-friendly structure: header band (faction, detachment, points), unit rows with cost and role chips, a footer with totals. Props can mirror a BattleScribe selection tree (`forces[].units[]` with `name`, `points`, `category`, `modelCount`, `enhancement`, `warlord`). The output is a deterministic still card that replaces the screenshot wall-of-text.
- **Risks:** BattleScribe XML is deep and edition-specific; the demo template should take normalized props rather than parse XML at render time. GW IP means the card must stay factual (no art, no stat blocks, no rule text) and rely on user-supplied names.

### 2. Disc golf UDisc round scorecard share
- **Who:** Disc golfers on r/discgolf who use UDisc to keep score.
- **The construct:** UDisc scorecards; the app exports rounds to CSV and can share an image of the card.
- **The recurring need:** Players want to share rounds with friends who do not have UDisc Pro, recap tournament rounds, and post scorecards to group chats. One player built https://discstat.me to turn UDisc cards into shareable web pages with image previews.
- **Evidence:**
  - https://www.reddit.com/r/discgolf/comments/oozc23/share_your_udisc_scorecards_on_the_web_i_built/ - "what I really found lacking is its social features... export scorecards to images and sending them to me through a third party after each and every game."
  - https://www.reddit.com/r/discgolf/comments/1lm2kgo/way_to_export_all_your_udisc_rounds/ - Players export CSV to analyze rounds in R/Python.
  - https://www.reddit.com/r/discgolf/comments/akm1bn/how_does_udisc_work_in_a_round_with_friends/ - "you can share an image of the scorecard to text/messenger for the players that don't have UDisc Pro."
- **Why m0saic fits:** Hole-by-hole strokes vs par is a clean grid; props are exactly the CSV columns UDisc already exports.
- **Risks:** Very similar to the existing golf round scorecard template (day 21). The sport and community differ, but the visual structure is almost identical.

### 3. TETR.IO player stats card
- **Who:** Competitive Tetris players on r/Tetris, especially TETR.IO users.
- **The construct:** TETR.IO exposes a public REST API (`https://ch.tetr.io/api/users/:user/summaries`) with 40 Lines, Blitz, Tetra League, Zen and achievement summaries.
- **The recurring need:** Players constantly compare PBs, ranks, APM/PPS/VS and ask "is this time good for my rank?" Posts share screenshots of profiles or raw numbers.
- **Evidence:**
  - https://tetr.io/about/api/ - Official TETRA CHANNEL API docs; no account required, public player summaries.
  - https://www.reddit.com/r/Tetris/comments/wmako6/40l_sprint_times_by_rank_in_tetrio/ - Community analysis of 40L sprint times by rank.
  - https://www.reddit.com/r/Tetris/comments/izp1yj/drop_your_tetrio_40l_and_blitz_pbs/ - Players drop PBs in comments as free-form text.
- **Why m0saic fits:** A stats card is simple rectangles: rank badges, mode rows with times/scores, percentile bars.
- **Risks:** The API would have to be fetched at render time, which violates the deterministic props model; a proper template would need a wrapper to inject API data as props. Also a brag card more than a structured workflow.

### 4. Cocktail recipe card
- **Who:** Home bartenders on r/cocktails and r/bartenders.
- **The construct:** No single shared tool; recipes live in apps (Mixel), Google Sheets, notebooks, or printed bar recipe cards.
- **The recurring need:** People repeatedly make and share recipe cards. One poster made hand-designed cards and got 233 upvotes with comments asking for more.
- **Evidence:**
  - https://www.reddit.com/r/cocktails/comments/wb09mx/simple_cocktail_recipe_cards/ - "I make cocktails for fun and I'm still learning the specs. Started creating these as a way for me to quickly remind myself of each recipe."
  - https://www.reddit.com/r/bartenders/comments/1rsa8k/decently_formatted_bar_recipe_card/ - Bartender asks for a downloadable, editable recipe card template.
- **Why m0saic fits:** A recipe card is classic rectangles: title, ingredients list, spec, glass, garnish, instructions.
- **Risks:** No shared artifact means the template has to invent a prop schema; it is more of a generic design template than a community-specific workflow.

## Pick

**Warhammer 40k BattleScribe roster share card** - It is the strongest niche fit: a community that organises around one shared artifact (the BattleScribe roster), a recurring share moment ("rate my list" posts and tournament lists), and an existing pain point (screenshots and printouts are hard to read). Unlike the disc-golf scorecard it does not overlap an existing template, and unlike TETR.IO it does not need a live API at render time.

## Rejected today

- **Disc golf UDisc scorecard:** Clear need, but the visual structure is almost identical to the existing golf round scorecard (day 21).
- **TETR.IO stats card:** Good API and community, but the workflow is more "brag about PBs" than "make a thing from an artifact you already have"; also pushes network fetching into the render.
- **Cocktail recipe card:** Popular generic idea, but no shared tool/artifact means it is a design template more than a community workflow.
