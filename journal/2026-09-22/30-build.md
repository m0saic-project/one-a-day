# Build - 2026-09-22

## Template: @one-a-day/social/testimonial-proof-card/v1

## Variant a - Receipt card: a large measured excerpt, compact proof row, thin accent rule, and source-verification footer. Gate: clean (build, registry, layout contract, WHY validation, fingerprints, and 66 tests pass). Render: stills ok; the shared 1280x720 tutorial pipeline stalled before it wrote an MP4. Stills: the quote stays dominant in landscape, portrait, and square; SAMPLE REVIEW, attribution, rating, service, and disclosure are readable. The host's free-tier QR mark intrudes on the outer lower-right edge in square and landscape, but not on card content.

## Why-tutorial: the problem page says owners reuse one review across posts but need selected, attributable evidence; the solution page says the card keeps that evidence together and makes long excerpts fail instead of clip. The six-page plan validates at 1280x720, but the encoder remained CPU-active without producing an output file and was stopped after several minutes.

## What was hard

The card's quote must remain the largest region without making portrait attribution too small. Measuring the actual wrapped lines and yielding optional detail/service rows kept the contract honest.

The shared tutorial is valid at plan time and each image still renders cleanly, but this host's encoder does not emit the 59-second tutorial file. This is outside the template source path and remains a known render limitation for critique/ship.

## In place now: a
