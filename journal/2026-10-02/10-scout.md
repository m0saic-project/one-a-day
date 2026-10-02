# Scout — 2026-10-02

## Candidates (3–5, best first)

### 1. Sim Racing Telemetry & Lap Cards
- Who: Competitive sim racers in communities around iRacing, Assetto Corsa, Le Mans Ultimate. Online platforms: iRacing forums, SimRacingGarage communities, YouTube channels dedicated to telemetry analysis (e.g., SimTelemetry.site).
- The construct: Lap telemetry data recorded at 60Hz during every drive: speed, throttle, brake, steering input, gear, RPM, track position. Drivers export `.lss` files (LiveSplit-like) or telemetry CSVs from simulators. Each lap is a complete record of one attempt.
- The recurring need: After a PB or competitive session, drivers want to share their achievement as a card or clip: "I hit a 1:23.456 at Nürburgring with a 0.5s improvement, here's my lap data visualized." Communities currently screenshot lap times or manually create comparison graphics; a deterministic lap card (best sector times, delta to PB, apex speeds) would let them share standardized achievements.
- Evidence:
  - https://simtelemetry.site – "SimTelemetry gives will help (for now in AC and LMU, more sims coming)"; drivers record just by driving, telemetry traces are automatically captured at 60Hz with speed, throttle, brake, steering, gear, RPM. "Overlay any two laps side by side. See exactly where you gain or lose time."
  - https://news.ycombinator.com/item?id=49045861 – Show HN for SimTelemetry (3 points, 0 comments; quiet community on HN, but real and active).
  - iRacing and Assetto Corsa are established platforms with competitive leagues and telemetry-sharing cultures; drivers habitually share lap times and compete for leaderboard positions.
- Why m0saic fits: A template can render a lap card at defaults (latest lap, PB sector highlight, best corner) from telemetry JSON/CSV props. The card is a rectangle: sector times, delta visualization (bars or arrows), apex speed at the turn, the track map sketch. Deterministic, batchable per-lap, no hand-tuning.
- Risks: Telemetry files are complex (many channels); picking which to highlight requires domain knowledge. Risk of over-specifying the template to one sim's export format. Risk of the community being small and not needing physical cards (they live in the platform already).

### 2. Cycling Route Highlights & Ride Recap Cards
- Who: Road and gravel cyclists on Strava, who also record video (GoPro, phone). Communities: r/cycling, bikepacking forums, local riding groups, the broader "creator cyclist" culture on YouTube and Strava.
- The construct: A ride produces two artifacts: (1) Garmin/Wahoo telemetry (power, heart rate, elevation, segment times) exported as `.fit` or `.csv`, (2) GoPro/phone video footage. Both are routine outputs of a single outing. Cyclists want to highlight the best moments and share them.
- The recurring need: "I did a 60-mile ride this weekend with two PRs on key segments and 2000m of climbing. I have the video and the data—I want a highlight reel." Currently done by manual editing (hours) or shared as static Strava screenshots. A card or short clip that overlays ride stats (total power, elevation, PRs hit, key segment times) would be shareable, recurring (every ride), and batchable.
- Evidence:
  - https://www.iandmacomber.com/blog/gopro-garmin-gemini-ride-recap/ – "Teaching LLMs Taste: How I Built an Automated Cycling Ride Recap with GoPro, Garmin, and Gemini" (7 points, 2 comments on HN); author built a tool to extract highlights from GoPro + Garmin telemetry. "I have all the tech and all the numbers: spandex, aero bike, carbon wheels, head unit, power meter, three separate heart rate monitors…I added a handlebar-mounted GoPro."
  - Strava is the de facto social platform for cyclists; segment PRs and ride summaries are the primary shareable artifact.
  - Cycling media creators (YouTube, content) routinely highlight PB segments and climbing efforts in their ride recaps.
- Why m0saic fits: A ride recap card: elevation profile plot, total power (kJ), best segment time and delta to PR, climb summary (meters, avg grade, time). Props from `.fit` CSV: power, elevation, segment data. Deterministic render per ride, batchable for a season's worth of highlights.
- Risks: Garmin telemetry parsing is specialized; many cyclists don't produce video and just want the telemetry card. GoPro integration is out of scope for m0saic. The community is large (Strava has millions) but diffuse; the template may not resonate with all.

### 3. Fantasy Football League Cards & Draft Results
- Who: Fantasy football players in public leagues, league commissioners, and casual fantasy sports players. Communities: ESPN Fantasy, Yahoo Fantasy, Reddit's r/fantasyfootball, league Discord servers.
- The construct: Structured league data: draft picks (player, round, team), weekly matchup results (score, win/loss), standings (wins, losses, points for/against). All data is regularly exported or scraped from league platforms in table form.
- The recurring need: At draft time, during the season, and at playoffs, league members want to share results: "Here's the 2026 draft board—who was reached on? Here's my team after the trade deadline. Here's the playoff bracket." Currently done as spreadsheets or screenshots; a styled card per team or a draft-board visualization would be shareable and recurring (yearly draft, weekly trades, monthly standings).
- Evidence:
  - https://www.hypeleaguefootball.com/ – "Hype League, Fantasy Football for pre-season player news" (2 points on HN, 2026-08-03).
  - https://app.seasondfs.com/ – "Season DFS – Run a Season-Long DFS Fantasy Football League" (2 points on HN, 2026-07-21).
  - r/fantasyfootball and league Discord servers are active communities where members share draft picks, trades, and week results.
- Why m0saic fits: A template renders a draft card (player name, team, round, ADP vs actual pick, position) or a season standings card (team name, record, points for/against, playoff seed) from a league export CSV. Deterministic, batchable per-team or per-week, no hand-editing.
- Risks: Fantasy football data structures vary by platform (ESPN, Yahoo, Sleeper). The template might need multiple variants per league flavor. Fantasy players already have strong existing tools (ESPN's own graphics, Sleeper's integrations); the added value over a screenshot is moderate.

### 4. Fitness Gym Achievement & Leaderboard Cards
- Who: Gym-goers and fitness enthusiasts in communities around apps like Personal Trainer, Strava for fitness, Apple Health, MyFitnessPal, and local gym groups. Online: fitness Discord servers, fitness subreddits, app leaderboards.
- The construct: Workout data: date, exercise, sets/reps/weight, one-rep max (1RM) estimates or actuals, cumulative volume. Deterministic outputs of every session logged by the app. Leaderboards and achievements are built-in.
- The recurring need: "I hit a new personal record deadlift today—1.5x bodyweight. I want to share it with my crew." Currently done as phone screenshots or manual text posts. A card showing the lift, weight, date, and progress (vs. previous max, vs. friends' maxes) would be shareable and batchable per-session or per-milestone.
- Evidence:
  - https://mobile-squad.com/ – "Personal Trainer, the offline gym tracker. Log every set offline, get progressive-overload suggestions, and watch your PRs climb. Optional crew leaderboard." (6 points on HN for the Show HN, 2026-05-12).
  - Fitness apps log structured data by default; many communities (gym friend groups, online fitness coaching) actively share and compare workout data.
  - Already partially done: powerlifting meet recap (Day 8, 2026-09-27) and swim time-drop cards (Day 12, 2026-10-01), but those are specific competitions. A general gym PR card for any lift would be distinct and complementary.
- Risks: Gym achievement cards might be too niche or similar to existing sports templates. Not all gym-goers care about sharing digitally. Community is large but diffuse across many apps.

## Pick
**Sim Racing Telemetry & Lap Cards** – The strongest case: a tight niche community with a shared structured artifact (lap telemetry files) they already produce and analyze, clear need for shareable lap-time and sector cards, and no prior template. Cycling highlights is nearly as strong but risks complexity (GoPro + Garmin pairing); fantasy football is more mainstream and less "one construct"; fitness is broader and partly overlaps prior sport days.

## Rejected today
- Urban photography gallery cards: data (location, camera, lens) is less shared; community more diffuse; no strong artifact-first tools.
- Book club reading progress: no recurring structured milestone to visualize per-book; community not organized around a single data format.
- Mechanical keyboard build documentation: before/after photos are primary, not structured data; community shares on Reddit/Discord where the photo is already native.
- Stock trading portfolio performance: structured data exists (holdings, returns) but community is fiercely proprietary and risk-averse; unlikely to share in a public visual format.
