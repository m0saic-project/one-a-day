# Brief - 2026-09-22

## The use case

Local service-business owners and social-media coordinators in r/smallbusiness need a repeatable way to turn one customer review they have already collected into a social post. They batch testimonials alongside other real client material, but a long review needs an edited excerpt and clear attribution rather than invented proof.

## The template

- id: @one-a-day/social/testimonial-proof-card/v1 (new pack: social is the right public shelf for reusable customer-proof posts, and no existing pack covers this audience.)
- title: Testimonial Proof Card (the scaffold prefixes the date: "2026-09-22 - Testimonial Proof Card")
- kind: image; canvas hint 1080x1080; landscape, portrait, and square must work
- duration: still

## Layout

Square-first, with one centered review card and a quiet page background. Its content is stacked inside an inset of about 7% of the short canvas edge; on a wide or tall canvas the card remains centered and chrome scales from the short edge.

```text
+----------------------------------+
| BUSINESS NAME       SAMPLE REVIEW|  14% header / source badge
| ===== accent rule ============== |
|                                  |
|  "Selected customer quote,       |  46% quote region
|   set as 2-5 measured lines."    |
|                                  |
| [MR] Maya R.        5 / 5 stars  |  25% attribution and rating
|      Garden refresh              |
|----------------------------------|
| CUSTOMER REVIEW - verify source  |  10% provenance footer
+----------------------------------+
```

The header names the business and explicitly marks the default as a sample. A thin accent rule separates brand from the quote. The quote is the largest rectangle; beneath it, a square initials mark, customer name, customer role or location, service chip, and numeric rating form a compact proof row. The bottom footer is an on-card disclosure, not a claim of a specific platform: it says where the operator should verify or replace the source label. At small sizes, the service chip and role yield before the quote, name, rating, and disclosure.

## Layout contract

- Every rendered text source is tagged and measured to fit its actual cell, including wrapped quote lines, business name, attribution, service, rating, source badge, and disclosure. Quote fitting uses a selected excerpt with a firm 2-5 line budget; invalid or unfit input fails clearly rather than clipping or silently ellipsizing.
- The accent rule spans at least 98% of the card's content width; the initials mark remains square; the card stays inside its inset and all required regions are present.
- The provenance footer is a full-width band inside the bottom 40% of the card. The attribution/rating row also stays in the lower half; the quote remains in the upper 70% and is the largest text region.
- At constrained canvases, optional descriptive rows may be omitted only with their information honestly absent; the customer name, quote, rating, business identity, and source/disclosure remain visible.

## Props

| name | type | default | what it changes | required? |
| --- | --- | --- | --- | --- |
| quote | string | "They listened to what we needed and left the garden looking better than we imagined." | Selected customer excerpt, fitted as the focal 2-5 line block | yes |
| customerName | string | "Maya R." | Attribution name beside the initials mark | no |
| customerDetail | string | "Homeowner, Brookdale" | Role, location, or customer context below the name | no |
| service | string | "Garden refresh" | Small service chip in the proof row | no |
| rating | number | 5 | Displayed rating from 1 through 5; stars and number agree | no |
| businessName | string | "Northline Gardens" | Header brand text | no |
| sourceLabel | string | "Customer review - verify source" | Footer disclosure; operator can replace with their real source | no |
| accent | string | "#1f7a5a" | Accent rule, chip, and rating emphasis | no |
| preset | "light" \| "dark" | "light" | Hand-tuned paper/ink palette, not derived colours | no |
| debugLayout | boolean | false | Draws the checked layout contract for authoring | no |

All string defaults are ASCII. Empty optional detail or service removes only that row; quote, name, business name, rating, and source label are validated as non-empty after defaults are resolved. The template uses text-only branding deliberately: it does not synthesize customer photos, logos, endorsements, or a platform badge.

## Defaults must show

A calm, square light card for Northline Gardens: a clearly marked SAMPLE REVIEW header, a readable selected quote from Maya R., a five-star numeric rating, the Garden refresh service, and a footer that says the review source must be verified. It is visibly useful without pretending that the example is a real published endorsement.

## Acceptance rubric

1. The default is an immediately legible square testimonial post whose quote, business identity, customer attribution, rating, service, and verification disclosure can each be found without reading tiny copy.
2. The hierarchy is honest: the supplied quote is dominant, and the card never implies a review platform, customer photo, or endorsement that the props did not provide.
3. A long but valid selected quote wraps and shrinks within its stated line budget at all contract canvases; no rendered default or stress copy clips, uses tofu, or relies on ellipsis.
4. The design remains composed in landscape, portrait, and square: the footer stays low and full-width, the initial mark remains square, and the proof row does not collide with quote text.
5. Defaults are deterministic and useful, every visible prop is bound to its own rect where applicable, and invalid ratings, colors, or unfit quote copy fail with a clear error.

## Variants worth trying

- a: Receipt card - the described stacked card, with the thin accent rule and explicit provenance footer.
- b: Quote-first - same inputs and disclosure, but a large opening-quote block occupies more of the card while attribution compresses into one lower strip.
- c: Proof ledger - same inputs and hierarchy, but use a narrow left metadata rail for initials, rating, and service beside the wide quote field.
