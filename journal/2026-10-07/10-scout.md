# Scout — 2026-10-07

## Candidates (3–5, best first)

### 1. Chess Game Recap Cards
- **Who**: Chess players on Lichess (free/open) and Chess.com (250+ million), from casual blitz to competitive classical. Gather in forums like Speedsolving.com, their blogs, Twitch, and game analysis communities.
- **The construct**: PGN files (Portable Game Notation) are the standard artifact; every game on Lichess/Chess.com exports as PGN with headers (opening, players, result, date, moves). Lichess also publishes player stats, rating histories, and tournament rosters.
- **The recurring need**: Players replay and share their games — "check out this game" posts appear daily in forums and Discord. Lichess runs a monthly "Game of the Month" contest where players submit their best games. Streamers analyze games for audiences. Rating milestones (1600, 2000, 2200 rating boundaries) prompt local announcements.
- **Evidence**:
  - https://github.com/philphilphil/blunderbase — personal chess database with game import, analysis, ratings tracking (8 stars, recent commits, very active)
  - https://github.com/brumar/chess-postmortem-skills — Claude Code skill for analyzing your own games (75 HN points, 57 comments, 2026-09-26)
  - https://lichess.org — live homepage shows "Game of the Month" feature, puzzle packs, tournament brackets
  - https://news.ycombinator.com/item?id=49857528 — "Show HN: A Claude Code skill to analyze your chess games"
- **Why m0saic fits**: The template renders one PGN's key metadata (opening name, piece counts, time control, result, rating change, final FEN). Batchable: one card per game, one per tournament round, one per milestone. Deterministic. Players already screenshot game boards to share — a card would be simpler and more professional.
- **Risks**: PGN parsing is well-defined but needs validation (malformed files, non-ASCII notation). Opening classification (e.g., "Sicilian Defense") requires a lookup table or an API call (e.g., Chess.com's opening explorer). UI might need to show a board state — if the template renders SVG from FEN, the font coverage on the pieces matters.

### 2. Twitch/YouTube Creator Milestone Cards
- **Who**: Content creators on Twitch and YouTube; streamers and video makers. They announce milestones (100K subs, 1M views) in Discord servers, Twitter, and on-stream. Communities: r/Twitch, r/NewTubers, r/streaming (subreddits for creators).
- **The construct**: Creator platform APIs export: channel name, subscriber/follower count, view count, total videos. Dashboard exports (CSV) are common.
- **The recurring need**: Creators celebrate milestones publicly — every 10K or 100K subscribers, streamers create "thank you" clips or posts. Announcement cards are made by hand (often in Figma or Photoshop) or borrowed templates.
- **Evidence**:
  - https://news.ycombinator.com/item?id=49924667 — "Show HN: RGBoo – interactive lofi stream for Halloween" (Twitch-adjacent, 3 points, 3 comments)
  - Broad creator economy (YouTube, Twitch, TikTok) creates demand for recurring visual announcements.
- **Why m0saic fits**: Render channel name, subscriber count, growth delta, date. Deterministic. Batchable: one card per milestone or weekly. Easy props: numbers from API or CSV.
- **Risks**: Requires API keys or manual data input (not everyone has API access). Fewer niche-community signals than chess; broader but less organized around shared artifacts.

### 3. Magic the Gathering Deck Tech Cards
- **Who**: MTG players in organized play (SCG, PPTQ, Arena), content creators (MTGGoldfish, Channel Fireball streamers), deckbuilders. Gather on r/magicTCG, MTGGoldfish forums, Scryfall, Archidekt.
- **The construct**: Deck lists are text or JSON: 60 cards in standard (or 100 for Commander), each with quantity and card name. Scryfall API provides canonical card data (mana cost, color, type). Every tournament publishes top 8 decklists.
- **The recurring need**: Deck builders write deck techs (blog posts or videos) that analyze a new list. Streamers pilot new decks and showcase them on stream. Meta shifts prompt new deck brewers to share. Format rotations create seasonal waves of new lists.
- **Evidence**:
  - Scryfall (scryfall.com) is the standard deck-list repository; Archidekt and Moxfield are visual deckbuilding tools.
  - MTGGoldfish publishes 5-10 new decklists per week with meta analysis.
- **Why m0saic fits**: Card grid layout (8–10 rows of mana curve), deck name, format, sideboard count. Deterministic from decklist JSON. Batchable: one card per published archetype per format.
- **Risks**: Requires real card art and text to feel authentic (licensing). Mana symbols are Unicode but need glyph coverage. Card text is verbose and wraps unpredictably.

### 4. Warhammer 40K Battle Report Cards
- **Who**: Tabletop wargamers in the 40K community. Organize around tournaments (Warhammer Open, GW Grand Narrative) and local game nights. Gather on r/Warhammer40k, Warhammer Community forums, Discord servers, BattleScribe (army-list tool).
- **The construct**: Battle reports share: mission name, two armies (faction + points/power level), result, player names, date. Army lists are exported from BattleScribe (XML) or as screenshots. Datasheet PDFs list all unit stats.
- **The recurring need**: After every tournament or casual game, players write up a report (blog post, forum thread, or Discord message) and often share a photo of the table. Cards would summarize the match and army compositions.
- **Evidence**:
  - https://www.warhammer-community.com shows active tournament schedule (National Tournament Series, Grand Narrative, World Championships).
  - BattleScribe (battlescribe.net) is the standard army-list builder; tournament organizers publish rosters.
- **Why m0saic fits**: Template shows mission, two faction logos (or names), point total, result, player names. Deterministic from structured match data. Batchable: one per battle report, one per tournament round.
- **Risks**: Requires Warhammer-specific visual assets (faction symbols, icons). Model counts vary wildly by list (100+ points can be 2 models or 50). Taste-heavy: competitive players may want more statistics than casual players.

### 5. Conference Talk / Hackathon Winner Cards
- **Who**: Event organizers (tech conferences, hackathons, local meetups). Announce talks, winners, and highlights on social media.
- **The construct**: Talk metadata: speaker name, title, time slot, room/track. Hackathon winners: team name, project title, category, prize. Both are published in schedules or result posts.
- **The recurring need**: Event accounts (@PyCon, @ReactConf, etc.) post "next up: speaker name on topic" every hour during the event. Organizers highlight winners the day after judging.
- **Evidence**:
  - Widespread conference social media (daily posts during events, winner announcements).
  - https://news.ycombinator.com/item?id=49991869 — "Show HN: I built a browser wargame set on the Eastern Front, 1941–43" (Show HN entries are often hackathon projects).
- **Why m0saic fits**: Speaker photo + title + time; or winner team + project name + category. Deterministic. Batchable: one per slot or one per winner.
- **Risks**: Broad use case (spans tech, science, arts). Smaller niche than chess. Requires real speaker photos or team photos; art direction may vary per event.

## Pick

**Chess Game Recap Cards** — strongest evidence (two active tools built by the community, Lichess game-of-the-month feature, large organized communities on two major platforms), clearest standard artifact (PGN), recurring moment (every game or tournament milestone), and easiest determinism (no photos, no taste, just game data).

## Rejected today
- **Film festival screening programs**: Found no community signals; niche is small and not discussed on HN or public forums.
- **Fitness/marathon race cards**: Strava exists but no specific recurring "share race result card" format; less standard than PGN.
- **Travel itinerary cards**: Found one tool (petrelvoyage.com) but insufficient evidence of a recurring shared format; more personal/taste-driven than chess.
