# Scout - 2026-09-22

## Candidates (3-5, best first)

### 1. Branded review cards for local service businesses

- Who: local service-business owners and the people who run their social accounts in [r/smallbusiness](https://www.reddit.com/r/smallbusiness/).
- The recurring need: turn a customer review already collected in Google, a form, or email into a trustworthy social post whenever a good review arrives or a content calendar needs filling. Inputs are a short quote, customer name or role, service, optional rating, logo, and brand colors.
- Evidence:
  - In a [review-collection thread](https://www.reddit.com/r/smallbusiness/comments/1nitluu/small_business_owners_whats_your_process_for/), a commenter explicitly suggests putting a review and photo on a reusable branded card for social distribution; another describes one testimonial becoming a website item, social post, and case study.
  - A [group-home owner seeking social help](https://www.reddit.com/r/smallbusiness/comments/1ph2vfy/social_media_coordinator/) lists stories, pictures, and testimonials as the regular, lightweight posts they need handled.
  - A [business content discussion](https://www.reddit.com/r/smallbusiness/comments/1wgqpiz/starting_producing_social_media_content_for_the/) recommends batching real client/testimonial material rather than making something new every day.
- Why m0saic fits: a vertical or square still is a fixed rectangle system: brand bar, rating, bounded quote, customer attribution, service chip, and optional photo/logo. All content is props, so a business can render several reviews deterministically with one layout and no design session.
- Risks: authenticity matters more than polish; the template must not invent endorsements, ratings, or customer photos. Long unedited reviews need a firm copy floor and may need a short selected excerpt.

### 2. Audio-first podcast episode teaser / audiogram

- Who: independent podcasters in [r/podcasting](https://www.reddit.com/r/podcasting/).
- The recurring need: for each episode, export a short social video from a selected audio excerpt with show title, episode title, CTA, cover art, and a waveform, often in vertical dimensions.
- Evidence:
  - A [podcaster asking for audiogram tools](https://www.reddit.com/r/podcasting/comments/1jb4arp/free_audiogram_tools/) wants short social promos, calls out missing vertical formatting, and describes an FFmpeg workflow that applies the same template each time.
  - In a [discussion about clip metrics](https://www.reddit.com/r/podcasting/comments/w4mxch/do_we_have_hard_metrics_on_social_media_podcast/), one creator records a roughly one-minute teaser per show specifically because it is easy to extract and post; another tracks the audiogram-to-click-to-listen path.
- Why m0saic fits: cover art, title, speaker, CTA, and a graphic waveform area are rects and naturally accept repeatable props. The render can accept the chosen audio clip and produce platform-sized video without a GUI.
- Risks: a convincing reactive waveform and captions depend on runtime media/source capabilities; clip selection and transcript timing are upstream editorial work. The evidence also says audiograms can underperform, so the template should be positioned as a production aid, not a growth promise.

### 3. Open-source release highlight card / short feature rundown

- Who: maintainers and developer-relations teams announcing releases in Hacker News and product communities.
- The recurring need: convert release-note facts - version, a few named features, compatibility/test progress, and before/after performance - into a concise image or sequence that accompanies a release post.
- Evidence:
  - The [Audacity 4 release discussion](https://news.ycombinator.com/item?id=49548395) points readers to a release video and praises it for being concise; the [Audacity release page](https://www.audacityteam.org/audacity-4/) presents the release as a structured set of feature sections.
  - [Bun 1.4](https://bun.com/blog/bun-v1.4) publishes exactly the structured inputs a summary needs: newly passing tests, issue count, and performance deltas. Its [HN discussion](https://news.ycombinator.com/item?id=49374797) also refers to an accompanying release video.
- Why m0saic fits: feature rows, metric deltas, a version badge, and a release CTA are deterministic cells. The same props could render a still for a changelog and a paced video version for a release post.
- Risks: dense releases invite unreadable copy and cherry-picked metrics. This overlaps the repo's existing developer-focused work more than the first two candidates, and the feature selection remains a human editorial decision.

## Pick

Branded review cards for local service businesses. It is a genuinely recurring media task with small, available inputs and a concrete still-image geometry, while avoiding the runtime uncertainty of waveform/caption media and the developer focus of the first two shipped days.

## Rejected today

- Podcast audiogram: promising repeatability, but a useful default depends on reactive audio and caption behavior that needs more runtime validation than this day's scoped template should assume.
- Open-source release highlight: strong structured inputs, but too close to the existing developer/benchmark shelf and too dependent on editorial feature selection.
