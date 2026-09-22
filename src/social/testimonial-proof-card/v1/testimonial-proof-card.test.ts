import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { TestimonialProofCardV1, layoutTestimonialProofCard } from "./testimonial-proof-card";

const ID = "@one-a-day/social/testimonial-proof-card/v1";
const LONG_QUOTE = "They listened carefully, explained every choice, worked around the weather, protected the beds, and left the garden healthier, neater, and more useful than we expected when we first asked for help.";
const render = (props: Partial<Parameters<typeof TestimonialProofCardV1.render>[0]> = {}, w = 1080, h = 1080) => TestimonialProofCardV1.render({ ...TestimonialProofCardV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

describe(ID, () => {
  it("binds each visible customer-proof prop to its rect", async () => {
    const { byProp, rejected } = resolvePropBindings(await render(), 1080, 1080, { propsSchema: TestimonialProofCardV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const prop of ["quote", "customerName", "customerDetail", "service", "rating", "businessName", "sourceLabel", "accent"]) expect(byProp[prop]?.length).toBeGreaterThan(0);
  });
  it("keeps the card feasible at square, landscape, and portrait canvases", async () => {
    for (const [w, h] of [[1080, 1080], [1280, 720], [1080, 1920]]) {
      const ev = evaluateM0(String((await render({}, w, h)).m0), { width: w, height: h });
      expect(ev.feasible && ev.meetsPrecision).toBe(true);
    }
  });
  it("keeps the quote dominant and optional rows honestly removable", () => {
    for (const [w, h] of [[1080, 1080], [1280, 720], [1080, 1920]]) {
      const L = layoutTestimonialProofCard({ quote: LONG_QUOTE, customerName: "Maya R.", customerDetail: "", service: "", businessName: "Northline Gardens", sourceLabel: "Customer review - verify source", rating: 5 }, w, h);
      expect(L.quote.fit.lines).toBeLessThanOrEqual(5);
      expect(L.quote.rect.h).toBeGreaterThan(L.attribution.h);
      expect(L.initials.w).toBe(L.initials.h);
      expect(L.footer.y).toBeGreaterThan(L.attribution.y);
      expect(L.texts.map((entry) => entry.label)).not.toContain("customer detail");
      expect(L.texts.map((entry) => entry.label)).not.toContain("service");
    }
  });
  it("keeps the contract at every canvas for long and empty optional copy", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [{}, { quote: LONG_QUOTE }, { customerDetail: "", service: "", preset: "dark" as const }]) {
      await sweepLayout((p, ctx) => TestimonialProofCardV1.render(p, ctx).then(asDocument), ID, { ...TestimonialProofCardV1.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });
  it("is deterministic and rejects invalid evidence inputs", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ quote: " " })).rejects.toThrow(/quote must not be empty/);
    await expect(render({ rating: 6 })).rejects.toThrow(/rating must be an integer/);
    await expect(render({ accent: "green" })).rejects.toThrow(/#rrggbb/);
    await expect(render({ quote: "unbroken".repeat(100) })).rejects.toThrow(/must fit its measured cell/);
  });
});
