/**
 * `@one-a-day/social/testimonial-proof-card/v1` turns one selected customer
 * review into an honest, reusable social still for a local service business.
 *
 * ONE CONCEPT: make the quote the largest measured rectangle, then keep its
 * attribution, rating, and source warning attached as proof rather than polish.
 *
 * The rule that bites: a testimonial is supplied evidence, not copy to invent.
 * A quote which cannot fit five lines fails instead of clipping or implying proof.
 */
export type TestimonialProofCardProps = {
    quote: string;
    customerName?: string;
    customerDetail?: string;
    service?: string;
    rating?: number;
    businessName?: string;
    sourceLabel?: string;
    accent?: string;
    preset?: "light" | "dark";
    debugLayout?: boolean;
};
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Fit = {
    text: string;
    fontSize: number;
    width: number;
    height: number;
    lines: number;
};
type PlacedText = {
    label: string;
    rect: Rect;
    fit: Fit;
};
export type TestimonialProofCardLayout = {
    card: Rect;
    content: Rect;
    quote: PlacedText;
    texts: PlacedText[];
    initials: Rect;
    attribution: Rect;
    footer: Rect;
    accentRule: Rect;
};
export declare function layoutTestimonialProofCard(text: {
    quote: string;
    customerName: string;
    customerDetail: string;
    service: string;
    businessName: string;
    sourceLabel: string;
    rating: number;
}, W: number, H: number): TestimonialProofCardLayout;
export declare const TestimonialProofCardV1: import("@m0saic/types").MosaicTemplate<TestimonialProofCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default TestimonialProofCardV1;
