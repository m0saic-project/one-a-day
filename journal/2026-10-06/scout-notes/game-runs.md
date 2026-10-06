# Scout notes: game-runs

## Searches (7)
1. DCSS morgue file to image generator share run (no useful hits)
2. Slay the Spire run history share image tool .run file
3. osu! thumbnail generator score replay thumbnail tool
4. Classic Tetris stats card maker NES score PB graphic tool github (nothing)
5. crawl morgue file summary card github dcss parser visualize
6. NetHack YAAP xlogfile fields conduct achieve dumplog
7. TETR.IO stats card image generator discord bot (nothing specific)

## Pages opened
- https://github.com/xjunko/osr2png : "osr2png is a CLI thumbnail generator for osu! maps." Takes -r replay.osr, -m "FINALLY FCED", styles 1/2. => osu! replay thumbnails ALREADY SERVED (CLI, batch). Kill.
- https://nethackwiki.com/wiki/Xlogfile : tab-delimited field=value lines, e.g. version, points, deathlev, maxlvl, hp, maxhp, role, race, gender, align, name, death, conduct=0xf80 (bitfield: Foodless, Vegan, Vegetarian, Atheist, Weaponless, Pacifist, Illiterate, Polypileless, Polyselfless, Wishless, Artifact wishless, Genocideless), turns, achieve (bitfield: Bell, Gehennom, Candelabrum, Book, Invocation, Amulet, End Game, Astral, Ascended, Luckstone, Sokoban, Medusa, Zen, Nudist), realtime, starttime, endtime. 3.7 adds text conductX/achieveX.
- https://ststracker.app/about : StS2 .run uploads; tracks "Victory/defeat, ascension, duration", "Cards picked...final deck", "HP curve, gold flow per floor". => StS already served by trackers (STS Tracker, SpireMeta); also needs card art to look right.
- https://www.moddb.com/news/building-the-ultimate-roguelike-morgue-file-part-2-ascii-maps : Cogmind dev surveys morgue files; "DCSS morgue file maps ... are the only ones to use Unicode characters". Morgues are text; DCSS morgues share as links, not pictures.
- FAILED: https://metacpan.org/pod/NetHack::NAOdash (402)

## Candidate (weak): NetHack ascension card from an xlogfile line
- Rectangles: header (name, role-race-gender-align), stat row (points, turns, realtime), 12 conduct pills lit/unlit from bitfield, 12-step achievement milestone track (Sokoban -> Medusa -> Gehennom -> ... -> Ascended). Pure ASCII, no art needed, deterministic from one line.
- Need evidence weak: did NOT find anyone hand-making ascension images; YAAP culture is text + dumplog links. No existing picture tool found either (NAOdash is stats/HTML).
- Strength ~4.

## Rejected
- osu! thumbnails: osr2png CLI already does it; also needs beatmap background art.
- Slay the Spire / StS2 runs: STS Tracker, SpireMeta already render run breakdowns; card/relic art licensed.
- Balatro: joker art licensed, needs sprites.
- DCSS morgue: free-text morgue, Unicode map, sharing culture is links; same shape as NetHack but messier parse.
- Classic Tetris/TETR.IO: no artifact file found in budget; TETR.IO has in-game/official profile pages; CTM stats live on stream overlays.
- Trackmania: records shown in-game/TMX with map thumbnails; not researched further.
