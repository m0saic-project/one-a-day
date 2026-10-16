# Scout - 2026-10-16

## Candidates (3-5, best first)

### 1. Commander Deck Spotlight Card (MTG)

- Who: Magic: The Gathering Commander/EDH players - r/EDH and deck-building Facebook groups ("rate my deck" posts), playgroup chats before game night, and tournament coverage on TopDeck.gg-style sites. They gather around Moxfield, Archidekt and ManaBox, which all write the same decklist text export.
- The construct: the decklist text export. Everyone's tool emits the same shape - `4 Lightning Bolt (LEA) 161` quantity lines with set codes, optional Sideboard/Maybeboard sections, a marked commander. The builder UI alongside it shows the derived summary a deck is judged by: mana curve, average mana value, color identity, bracket.
- The recurring need: an image that makes a 100-card list digestible, rebuilt every time a deck changes, a new set drops, a game night needs "what are you bringing", or a player goes 4-0 at an event. Today it is made in Canva or with one-off web tools - and tools for exactly this keep appearing.
- Evidence:
  - https://mythichub.com/blog/turn-a-boring-decklist-into-an-awesome-image (2026-10-02) - "I was looking into creating a reusable template that I could post there and on other social media. I created a tool for myself that turns decks into fun images" and "it's easy to scroll past a plain list or a link to a decklist. I think an image gets more attention".
  - https://mythichub.com/deck-spotlight - "Turn a boring decklist into an awesome image... your commander, mana curve and bracket" from text exports of "Moxfield, Archidekt, ManaBox, MTG Arena and most other deck builders".
  - https://archidekt.com/faq - the deck-builder's own FAQ carries the question "How do I create an image of my deck to share on social media?" (Share icon -> "Generate deck image").
  - https://overpower.topdeck.gg/blog/visual-deck-display-20250626 - downloadable "high-resolution 16:9 deck images" including the player's record, "perfect for: Social media bragging rights - Share your 4-0 tournament deck".
  - https://github.com/YohannBethoule/DeckPassport - "a sleek, shareable card that captures the identity of their deck... No more walls of text to explain your deck. Just share the card."
- Why m0saic fits: the digest is pure rectangles - a mana-curve histogram (bars per mana value), color identity chips, a row per highlight card, bracket/record badges. The demo needs no card art and no network: the props are the artifact's own fields (deck name, format, commander, curve counts, quantities) plus the one-line plan the player writes. Batchable: one render per deck, so a top-8 or a playgroup's game-night lineup is a single CLI loop. Deterministic, still or clip (bars could grow, but a still already sells it).
- Risks: every existing tool puts Scryfall card art at the center - a member's first reaction may be "where's my commander's art?" (acceptable for a demo, a real gap for production). Mana values and bracket are not in the raw export lines; the player reads them off the builder. A 100-card list cannot fit - the template must stay a digest, which is what the ecosystem converged on anyway.

### 2. Espresso Dial-in Shot Card

- Who: home baristas on r/espresso and home-barista.com; users of Beanconqueror (open-source brew logger) and visualizer.coffee.
- The construct: the brew/shot record - dose in (g), yield out (g), time (s), grind setting, temperature, bean and roaster, rating, plus an optional flow/pressure curve from a smart scale (Beanconqueror JSON / Visualizer export).
- The recurring need: every new bag of beans starts a dial-in session, several shots a day get logged, and the "here is what worked" card gets posted to compare recipes and curves.
- Evidence:
  - https://visualizer.coffee/ - "Over 10,000 coffee people use Visualizer to share shots, compare results, and swap profiles"; "Upload a shot and you get charts, metadata, notes, coffee context".
  - https://beanconqueror.com/ - "Record and adjust over 30 brewing parameters like grind size, brew time, and water amount"; "Share: Share your brews and beans with all coffee lovers!" (changelog), with per-brew graph JSON export.
- Why m0saic fits: a recipe card is big numbers (dose/yield/time/ratio) over a flow-curve polyline - one deterministic render per shot, batchable across a session, zero media.
- Risks: Beanconqueror already ships an in-app "share an image of your brew with all the stats", so the hand-made gap is thinner than for decklists; curve props need many sample points to read as a real shot; tasting notes are free text.

### 3. Dive Profile Slate (scuba)

- Who: recreational and tech divers who log in Subsurface (.ssrf/UDDF) or their dive computer's software; r/scuba and ScubaBoard.
- The construct: the dive log record - dive number, site, date, max depth, duration, water temp, gas mix, and the depth-vs-time sample profile every dive computer records.
- The recurring need: trip recap posts, milestone dives, and a profile-plus-numbers badge to drop over a dive photo or video frame - rebuilt for every dive of a trip.
- Evidence:
  - https://github.com/paul-charp/Dive-Slate - "Your dive profile, as a transparent badge you can drop on a photo... a profile silhouette, the site name and a few big numbers"; "A whole trip in one pass... they all come out matching" (batch, exactly the m0saic pitch); "Nothing invented. A figure your log cannot answer is left off rather than guessed at."
  - https://subsurface-divelog.org/subsurface-user-manual/ - the Dive Profile panel ("a graphical representation of the depth of the dive as a function of time") is the centerpiece of every dive view and of the printed logbook.
- Why m0saic fits: profile polyline + big-number figures over a card; one render per dive; fully deterministic from logged samples.
- Risks: the killer use is a transparent overlay (Dive-Slate's whole product) and m0saic renders opaque canvases; profile sample arrays are dense props; a phone app already serves the workflow.

### 4. Warhammer 40k Muster Card (narrower re-look)

- Who: 40k/AoS players on r/WarhammerCompetitive and club Discords, and TOs who publish entrant lists; they build in New Recruit / BattleScribe / the GW app.
- The construct: the roster export (.rosz/.ros or the community text formats) - faction, detachment, units with points, a points total against the cap.
- The recurring need: a readable list summary for list-critique posts and pre-tournament shares, several times per player per season.
- Evidence:
  - https://www.newrecruit.eu/ - "Share your lists with a link or QR code. Anyone can view them, no account needed", "trusted by thousands of players and tournament organisers", with per-format text export.
  - Day 26's scout already weighed this and rejected the full-roster card as too dense; today's narrower shape (muster digest: faction, detachment rows, points bar to cap) does not change that verdict enough.
- Why m0saic fits: unit rows and a points bar are rectangles; batchable per tournament roster pack.
- Risks: the community's own standing complaint is that exports are unreadable garbage to be hand-trimmed; wargear sprawl makes the digest subjective; day 26 declined this niche for the same reasons.

## Pick

**Commander Deck Spotlight Card (MTG)** - It beat espresso and scuba because the artifact is the most standardized of the three (every builder writes the same export), the recurring moment is densest (every deck edit, every game night, every event), and the hand-made gap is documented from two weeks ago - a player who built the image tool because he was hand-making a "reusable template" for Instagram. It is also the untouched entry in the founder's own niche list ("tabletop players and their army or deck lists"), and the demo - mana curve bars, color chips, highlight rows, record badge - is the most m0saic-native of the day: rectangles and numbers, no art to fetch.

## Rejected today

- Espresso Dial-in Shot Card: strong daily cadence, but the community's own app already shares the brew image, and the flow curve needs dense sample props to read right.
- Dive Profile Slate: real workflow (someone built a whole app for it), but its best form is a transparent overlay m0saic cannot do, and props are dense sample arrays.
- Warhammer 40k Muster Card: day 26 already rejected the dense-roster shape; the digest angle still depends on hand-trimmed, subjective inputs.
