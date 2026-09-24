# Scout - 2026-09-24

## Candidates (3-5, best first)

### 1. Localized app-store screenshot frame

- Who: indie mobile developers and small teams shipping through the Apple App Store or Google Play, especially the developers comparing workflows in r/iOSProgramming and the Fastlane community.
- The recurring need: on each release or meaningful UI change, turn raw simulator captures into a branded screenshot set with a short localized headline, consistent framing, and exports for each store canvas. The inputs already exist: a device capture, headline, app name, accent color, and locale-specific copy.
- Evidence:
  - [r/iOSProgramming: screenshot management at scale](https://www.reddit.com/r/iOSProgramming/comments/1tbsleb/how_do_you_manage_app_store_screenshots_at_scale/): five locales and three device sizes already mean 15 sets; A/B and custom product-page variants push the author past 60 files, with copy changes repeated across artboards.
  - [r/iOSProgramming: making app screenshots is torture](https://www.reddit.com/r/iOSProgramming/comments/1e9incq/making_app_screenshots_is_torture_any_tool/): one release's screenshots took three hours before multiplying the work across languages, iPad, and Apple Watch.
  - [Fastlane snapshot documentation](https://docs.fastlane.tools/actions/snapshot/): its worked example is 20 languages times 6 devices times 5 screens, or 600 captures, and it calls out rerunning after each design update.
  - [r/iOSProgramming: annoying parts of App Store deployment](https://www.reddit.com/r/iOSProgramming/comments/1f973og/whats_the_most_time_consuming_annoying_part_about/): several developers name screenshots as the most tedious part and describe maintaining versioned directories and separate device templates.
- Why m0saic fits: the marketing composition is a small set of real rectangles - headline band, screenshot viewport, device edge, app mark, and optional slide number. Props can drive copy and color while the CLI batches one raw capture through portrait store sizes; the same inputs always produce the same frame, so a release script can regenerate the set instead of maintaining artboards.
- Risks: this template would frame supplied captures, not launch simulators, translate copy, upload to a store, or guarantee current store-policy compliance. Long localized headlines stress text fitting, and iPhone, iPad, and Android captures must not be misleadingly stretched into the wrong device frame.

### 2. Podcast episode quote-card batch

- Who: independent podcasters in r/podcasting who publish episodes on a steady cadence and promote them across several social networks.
- The recurring need: for every episode, make a family of quote cards from selected transcript lines plus the show name, episode title, guest, and cover image; some producers repeat this daily for a week and hand assets to guests.
- Evidence:
  - [r/podcasting: how are you promoting your shows?](https://www.reddit.com/r/podcasting/comments/1pvnfbb/how_are_you_promoting_your_shows/): one producer makes one audiogram, seven quote images, and 14 clips per episode, then distributes 90 posts across networks.
  - [r/podcasting: how to market the podcast](https://www.reddit.com/r/podcasting/comments/1rylgvq/how_to_market_the_podcast/): a social-media professional makes a quote carousel, meme set, and several videos for every episode and says quote graphics often outperform the videos.
- Why m0saic fits: quote, attribution, episode metadata, cover art, and a progress index are bounded rectangles. A JSON list of selected quotes can render a deterministic sequence or a batch of stills in multiple aspect ratios without rebuilding the design for every episode.
- Risks: quote selection is editorial and remains outside the template. This overlaps the repo's testimonial proof card, animated waveforms need audio analysis that a simple template should not pretend to do, and cross-platform crops could create too many knobs.

### 3. Weekly stream schedule card

- Who: Twitch and YouTube streamers, especially creators with shift work or otherwise changing availability who discuss scheduling in r/Twitch and r/canva.
- The recurring need: publish a fresh weekly card listing stream days, start times, game or topic, and off days, then share it to social channels and community servers whenever work shifts change.
- Evidence:
  - [r/Twitch: stream schedule question](https://www.reddit.com/r/Twitch/comments/1gw9zfv/stream_schedule_question/): a shift worker's available days change every week; the suggested workaround is manually updating a separate calendar and Twitch's weekly schedule.
  - [r/Twitch: importance of a regular schedule](https://www.reddit.com/r/Twitch/comments/1741dw7/importance_of_a_regular_schedule/): commenters repeatedly recommend posting a new weekly schedule, while noting that announcing it across Discord, X, and Instagram is a lot of work.
  - [r/canva: YouTube video schedule](https://www.reddit.com/r/canva/comments/1kt3z1b/youtube_video_schedule/): a creator asks how to build a four-cell future-content grid and is directed to weekly or stream-schedule templates.
- Why m0saic fits: a seven-column or stacked-day schedule is entirely structured geometry. Day, time, title, category color, timezone, and status can be props; inactive days can stay visible as deterministic placeholders, and the same schedule can be rendered square or portrait for different channels.
- Risks: seven columns become cramped on phones, timezone handling can confuse viewers, and creator branding is taste-heavy. Twitch's native schedule already handles reminders, so the value is the shareable image rather than schedule storage.

### 4. Classroom weekly agenda board

- Who: classroom teachers in r/Teachers who keep an agenda visible on a projector or whiteboard and reuse it across several class periods.
- The recurring need: make a weekly or per-class agenda from a short sequence such as warm-up, activities, and closing; update completion state during the week and duplicate the structure for each class.
- Evidence:
  - [r/Teachers: I need help getting organized](https://www.reddit.com/r/Teachers/comments/1nruvpy/i_need_help_getting_organized/): a teacher reuses a weekly agenda on the whiteboard, crosses off completed parts, and maintains a version for each class.
  - [r/Teachers: opinions on using Canva in the classroom](https://www.reddit.com/r/Teachers/comments/1c3aidi/opinions_on_using_canva_in_the_classroom/): teachers report making announcements, reminders, and weekly advisory agendas, while one calls template searching a time sink.
- Why m0saic fits: weekday lanes, class labels, activity rows, and check states map directly to rectangles and props. A roster or lesson-plan export could batch consistent boards per class, with large text and predictable contrast for projection.
- Risks: live crossing-off is more natural in interactive slides than a rendered file, school accessibility needs vary, and long lesson names can overwhelm a compact board. The evidence supports reuse but not a strong need for automated media export.

## Pick

Localized app-store screenshot frame. It has the clearest multiplication problem - releases times screens times devices times locales - and the desired output is already a deterministic composition of supplied captures and short copy. It beat schedule and quote-card ideas because batch regeneration is central to the workflow, not merely a convenience, and it does not repeat any of the four shipped use cases.

## Rejected today

- Podcast episode quote-card batch: strong cadence and volume, but too close to the shipped testimonial card unless it expands into audio-aware motion, which raises scope and media-analysis risk.
- Weekly stream schedule card: a clean geometric fit, but native platform schedules hold the source of truth and the evidence is more about communication discipline than asset-production pain.
- Classroom weekly agenda board: repeatable and structured, but teachers benefit more from an editable live surface than from regenerated stills or clips.
