# Scout - 2026-10-15

## Candidates (3-5, best first)

### 1. osu! Scorepost Card

- Who: osu! players, especially those active on r/osugame (the game's main subreddit) and Discord servers, where every notable play becomes a "scorepost".
- The construct: the osu! score itself - a structured object from the official osu! API v2 or an `.osr` replay file. Fields are well-defined: player, beatmap, accuracy, max combo, rank/grade, score, pp, mods, and hit statistics (300/100/50/miss).
- The recurring need: players screenshot their result screen and post it to r/osugame dozens of times a day. The subreddit even has score submission guidelines. The post needs a title and an image that replicates the result screen.
- Evidence:
  - https://osuscorepost.wesleyxie.com/how_to_use - "osu!scorepost, the quickest and easiest way to generate a scorepost for sharing on r/osugame"; generates a post title and an image from just a score link.
  - https://github.com/NoelleTGS/osu-scorepost-generator - "A generator for r/osugame-styled osu! scoreposts" that fetches score info, calculates PP for FC, and opens the submission page.
  - https://www.reddit.com/r/osugame/wiki/scoreposting - the community's own score submission guidelines, proof that scoreposting is a repeated, ritualized activity.
  - https://github.com/ppy/osu/discussions/30685 - a player asks for Discord score embeds because screenshots are the only easy way to share a play's details.
  - https://github.com/solstice23/osu-stats-signature and https://github.com/saddexed/osu-stats-card - existing dynamic SVG profile cards show the community already values rendered stat cards.
- Why m0saic fits: a scorepost is fundamentally rectangles on a background - beatmap art as a full-bleed layer, player/beatmap header, rank badge, a grid of stats (acc, combo, pp, score, misses), and mod icons. All are deterministic props from the API. A template can render the same card for any score.
- Risks: beatmap backgrounds are remote images, which m0saic supports but adds a network dependency; the design must look good for both SS/FC scores and low-accuracy passes; mod acronyms can be long.

### 2. Warhammer 40k Army Roster Card

- Who: Warhammer 40,000 players on r/Warhammer40k, r/WarhammerCompetitive, and local club Discords.
- The construct: the BattleScribe roster (`.rosz` / `.ros` XML), the de-facto army list format.
- The recurring need: players build and share army lists before games and tournaments, often posting screenshots or links. Tools like ShareMyRoster and dataslate-parser already convert rosters into printable/shareable formats.
- Evidence:
  - https://www.sharemyroster.com/ - "View, share and print your Battlescribe rosters".
  - https://github.com/stvnksslr/dataslate-parser - "Parser to create unit cards for killteam/40k/horus heresy/AoS... since the current output is awful."
  - https://www.40k.app/lists - public army list sharing site with faction, detachment, and points.
- Why m0saic fits: a roster is a list of units with name, points, wargear, and abilities - a structured table or card grid.
- Risks: rosters are information-dense and vary wildly in size (500 to 2000+ points), so a one-size-fits-all layout is hard; wargear text is long and would clip; this repo already has a 10x10 board-game template, so the board-game niche is recently covered.

### 3. BoardGameGeek Collection Stats Card

- Who: Board gamers on r/boardgames who track collections and plays on BoardGameGeek.
- The construct: the BGG collection CSV/XML export, with owned games, ratings, play counts, and wishlist.
- The recurring need: users share collection snapshots, "shelf of shame" posts, and year-end play summaries.
- Evidence:
  - https://boardgamegeek.com/thread/3597635/export-and-import-collection - users regularly export their collection to CSV.
  - https://github.com/pedbarbosa/bgg-list - "BoardGameGeek collection exporter" that generates a printable table.
  - https://www.bgstatsapp.com/explanations/importing-from-bgg - BG Stats imports BGG plays for statistics.
- Why m0saic fits: a collection summary is a grid of game titles, ratings, and play counts - pure rectangles and text.
- Risks: BGG covers/box art are copyrighted remote images; the 10x10 challenge template already serves the board-game community; collection data is less of a "moment" than a scorepost.

### 4. Letterboxd Yearly Stats Card

- Who: Film lovers on r/Letterboxd and r/LetterboxdStats.
- The construct: the Letterboxd diary/ratings export and annual stats page.
- The recurring need: users share year-in-review cards showing films watched, hours, favorite directors, and ratings distribution.
- Evidence:
  - https://letterboxd.com/journal/2024-year-in-review - Letterboxd publishes its own year-in-review and offers personalized stats to Pro users.
  - https://github.com/gitkeniwo/letterboxd-stats - "Your Letterboxd year wrapped" dashboard from an export.
- Why m0saic fits: a wrapped-style card is bars, numbers, and a top-films grid.
- Risks: personalized stats require Letterboxd Pro or a manual export; movie posters are copyrighted; less niche and less of a shared artifact than an osu! score.

### 5. Factorio Production Stats Card

- Who: Factorio players on r/factorio and the official forums.
- The construct: the in-game production statistics window and blueprint strings.
- The recurring need: players share factory screenshots, production numbers, and blueprint books.
- Evidence:
  - https://wiki.factorio.com/Production_statistics - detailed production/consumption stats are a core feature.
  - https://forums.factorio.com/viewtopic.php?t=113566 - a player complains the production tab is hard to read and asks for better stats.
- Why m0saic fits: production rates and item icons could become a dashboard card.
- Risks: Factorio items need copyrighted sprites; the audience is more interested in live/interactive graphs than static cards; the use case is weaker evidence than osu! scoreposting.

## Pick

**osu! Scorepost Card** - The community has already validated the format: r/osugame scoreposts happen constantly, existing generators exist specifically for this, and the osu! API provides a clean, typed score object. It is the most visual, the most batchable, and the most obviously "one rectangle layout per score" of the candidates.

## Rejected today

- Warhammer 40k Army Roster Card: rosters are too information-dense and variable in length for a single clean template; the board-game pack already has a recent entry.
- BoardGameGeek Collection Stats Card: weaker "moment" than a scorepost and relies heavily on copyrighted box art.
- Letterboxd Yearly Stats Card: stats are gated behind Pro or manual export, and movie posters are copyrighted.
- Factorio Production Stats Card: sprites are copyrighted and the community values live graphs more than static cards.
