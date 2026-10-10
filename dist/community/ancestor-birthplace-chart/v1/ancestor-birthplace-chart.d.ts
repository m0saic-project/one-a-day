import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/community/ancestor-birthplace-chart/v1` - the #MyColorfulAncestry
 * chart genealogists build by hand in Excel: five generations of ancestors,
 * every cell coloured by where that person was born, with a legend - drawn
 * from pasted rows or from the GEDCOM file every genealogy program exports,
 * as a clip in which the colours land generation by generation.
 *
 * ONE CONCEPT: **the geometry IS the Ahnentafel.** Person n sits level with
 * the union of father 2n (above) and mother 2n+1 (below): one unit of height
 * per generation-5 cell, doubled at every generation to the left, so the
 * tree is exact by construction and never summed from rounded parts. The
 * colour is a lookup from one parsed field of the place (the state inside
 * the home country, the country elsewhere); the legend is the same lookup
 * counted.
 *
 * The motion is data, not keyframes: the clip opens on the finished chart
 * (frame 0 is the picture), resets to blank cells with the names already
 * typed, then lands the colours in Ahnentafel order, generation by
 * generation, and holds the finished chart so it loops. Everything that
 * changes is a gated colour tile in one mask-free child document; every
 * word is static svg text in the bundled font, so there is no drawtext and
 * pixels are the same on every machine.
 *
 * The rule that bites: **text is chosen per column, never per cell.** A
 * generation picks the richest tier (name + year + place, name + year, name,
 * surname, number, nothing) whose font clears the floor for EVERY cell in
 * the column, so one generation never mixes tiers and nothing is ever
 * clipped or ellipsized.
 */
export type AncestryRow = {
    /** Ahnentafel number 1..31 (1 = the root, 2n = father of n, 2n+1 = mother of n). */
    n: number;
    /** The person's name, as it should print (folded to ASCII). */
    name: string;
    /** "", a 3-4 digit year, or "c. 1850". */
    year: string;
    /** GEDCOM PLAC order: smallest place first, country last, comma-separated. */
    place: string;
    /** An explicit colour key; when given it wins over the place. */
    key?: string;
};
export type AncestorBirthplaceChartProps = {
    /** Header title; "" makes it "<ROOT NAME> - ANCESTOR BIRTHPLACES". */
    title?: string;
    /** Rows "n | Name | year | place [| key]": one multi-line string, an array of such strings, or objects. */
    ancestors?: string | Array<string | AncestryRow>;
    /** The text of a GEDCOM 5.5.1 or 7.0 file; when non-empty it replaces `ancestors`. */
    gedcom?: string;
    /** GEDCOM xref of the root person, e.g. "@I12@"; "" means the first INDI. */
    root?: string;
    /** Which event fills the cells: "birth" or "death". */
    event?: string;
    /** How a place becomes a colour key: "state-or-country" or "country". */
    keyBy?: string;
    /** The country whose places key by state (case-insensitive; the usual spellings of the USA fold together). */
    homeCountry?: string;
    /** Per-key #rrggbb overrides, e.g. {"Ohio":"#e3a857"}; "Unknown" and "Other" too. */
    colors?: Record<string, string> | string;
    /** Clip length in whole seconds (4..60). */
    clipSec?: number;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export declare const ANCESTRY_SLOTS = 31;
/** Ten categorical fills, medium lightness, assigned in legend order; every one clears 4.5:1 under the ink. */
export declare const ANCESTRY_PALETTE: readonly string[];
/** A fictional family, all names invented; 28 of 31 known (23, 30 and 31 left out on purpose). */
export declare const ANCESTRY_DEFAULT_ROWS = "1 | Clara Whitfield | 1988 | Columbus, Franklin, Ohio, USA\n2 | Daniel Whitfield | 1958 | Dayton, Montgomery, Ohio, USA\n3 | Laura Brandt | 1960 | Erie, Erie, Pennsylvania, USA\n4 | Harold Whitfield | 1929 | Lexington, Fayette, Kentucky, USA\n5 | Mae Corrigan | 1932 | Cincinnati, Hamilton, Ohio, USA\n6 | Walter Brandt | 1927 | Pittsburgh, Allegheny, Pennsylvania, USA\n7 | Signe Lindqvist | 1931 | Jamestown, Chautauqua, New York, USA\n8 | Amos Whitfield | 1898 | Harlan, Harlan, Kentucky, USA\n9 | Ruth Pennington | 1902 | Abingdon, Washington, Virginia, USA\n10 | Patrick Corrigan | 1899 | Skibbereen, Cork, Ireland\n11 | Nora Hayes | 1904 | Cincinnati, Hamilton, Ohio, USA\n12 | Friedrich Brandt | 1895 | Bremen, Germany\n13 | Anna Keller | 1899 | Pittsburgh, Allegheny, Pennsylvania, USA\n14 | Nils Lindqvist | 1897 | Vaxjo, Kronoberg, Sweden\n15 | Ellen Dahl | 1903 | Jamestown, Chautauqua, New York, USA\n16 | Josiah Whitfield | 1866 | Harlan, Harlan, Kentucky, USA\n17 | Martha Cole | 1870 | Pineville, Bell, Kentucky, USA\n18 | Samuel Pennington | 1871 | Abingdon, Washington, Virginia, USA\n19 | Lydia Shaw | 1875 | Bristol, Washington, Virginia, USA\n20 | Michael Corrigan | 1868 | Skibbereen, Cork, Ireland\n21 | Bridget Walsh | 1872 | Bantry, Cork, Ireland\n22 | Thomas Hayes | 1871 | Ennis, Clare, Ireland\n24 | Johann Brandt | 1864 | Bremen, Germany\n25 | Margarethe Vogel | 1868 | Oldenburg, Germany\n26 | Georg Keller | 1866 | Ulm, Wurttemberg, Germany\n27 | Mary Ann Fisher | 1870 | Lancaster, Lancaster, Pennsylvania, USA\n28 | Anders Lindqvist | 1865 | Vaxjo, Kronoberg, Sweden\n29 | Karin Holm | 1869 | Ljungby, Kronoberg, Sweden";
/** Fold to printable ASCII: strip accents, spell out the usual letters, drop the rest, collapse spaces. */
export declare function ancestryFoldAscii(s: string): string;
/** WCAG contrast ratio between two #rrggbb colours. */
export declare function ancestryContrast(a: string, b: string): number;
export type AncestryPerson = {
    n: number;
    /** 0-based generation: 0 = the root, 4 = the great-great-grandparents. */
    gen: number;
    name: string;
    year: string;
    place: string;
    /** The colour key, or null when the place gives none. */
    key: string | null;
};
export type AncestryLegendEntry = {
    kind: "key" | "other" | "unknown";
    label: string;
    count: number;
    color: MosaicColor;
    /** Ahnentafel numbers, ascending. */
    members: number[];
};
export type AncestryModel = {
    /** Index = Ahnentafel number; [0] unused; null = unknown ancestor. */
    people: Array<AncestryPerson | null>;
    known: number;
    legend: AncestryLegendEntry[];
    /** Legend index by Ahnentafel number. */
    entryOf: number[];
    rootName: string;
    event: "birth" | "death";
};
/** A place -> its colour key. An explicit key wins; "" or no element -> null (unknown). */
export declare function ancestryKeyOf(place: string, explicit: string | undefined, keyBy: string, homeCountry: string): string | null;
/** The `ancestors` prop -> rows. Lines split on "|" or tab; blank lines and "#" lines are skipped; a duplicate n is refused. */
export declare function ancestryParseRows(value: unknown): AncestryRow[];
type GedEvent = {
    date: string;
    place: string;
};
type GedIndi = {
    xref: string;
    name: string;
    birth: GedEvent;
    death: GedEvent;
    famc: Array<{
        fam: string;
        pedi: string;
    }>;
};
type GedFam = {
    husb: string | null;
    wife: string | null;
};
export type AncestryGedcom = {
    indi: Map<string, GedIndi>;
    fam: Map<string, GedFam>;
    order: string[];
};
/** The tags this template reads: INDI (NAME, BIRT/DEAT with DATE and PLAC, FAMC with PEDI) and FAM (HUSB, WIFE). Everything else is ignored. */
export declare function ancestryParseGedcom(text: string): AncestryGedcom;
/** Walk FAMC -> HUSB / WIFE from the root into Ahnentafel 1..31. The FAMC with PEDI birth wins; otherwise the first. */
export declare function ancestryRowsFromGedcom(text: string, root: string, event: "birth" | "death"): AncestryRow[];
export type AncestryOptions = {
    keyBy: string;
    homeCountry: string;
    colors: Map<string, MosaicColor>;
    event: "birth" | "death";
};
export declare function ancestryModelOf(rows: AncestryRow[], opts: AncestryOptions): AncestryModel;
export type AncestryBeats = {
    clip: number;
    hook: number;
    start: number;
    end: number;
    gens: Array<{
        start: number;
        end: number;
    }>;
    /** Landing second by Ahnentafel number; [0] unused. */
    lands: number[];
};
/** 0-8% the finished chart, 8-14% the reset, 14-84% the replay (generation g over its share, its cells at equal spacing in Ahnentafel order), then the finished chart. */
export declare function ancestryBeatsOf(clipSec: number): AncestryBeats;
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Fit = {
    text: string;
    px: number;
    width: number;
};
type Block = {
    lines: string[];
    px: number;
    width: number;
};
/** The copy tiers a column can show, richest first. */
export declare const ANCESTRY_TIERS: readonly ["name-year-place", "name-year", "name", "surname", "number", "none"];
export type AncestryTier = (typeof ANCESTRY_TIERS)[number];
export type AncestryCellText = {
    n: number;
    nameLines: string[];
    nameWidth: number;
    meta: string | null;
    metaWidth: number;
};
export type AncestryColumnText = {
    tier: AncestryTier;
    px: number;
    metaPx: number;
    cells: AncestryCellText[];
};
/** The richest tier whose font clears `floorPx` for EVERY cell of the column; one size for the whole column. */
export declare function ancestryFitColumn(people: Array<AncestryPerson | null>, numbers: number[], innerW: number, innerH: number, capPx: number, floorPx: number): AncestryColumnText;
export type AncestryLayout = {
    W: number;
    H: number;
    U: number;
    stacked: boolean;
    title: {
        rect: Rect;
        block: Block;
    };
    subtitle: {
        rect: Rect;
        fit: Fit;
    };
    /** The chart's child canvas in the parent (5-smooth both sides). */
    chart: Rect;
    /** Inside the child: the header strip and the cells. */
    headH: number;
    head: Array<{
        rect: Rect;
        fit: Fit;
    }>;
    gap: number;
    pad: number;
    colW: number;
    /** The generation-5 unit height; generation g cells are unit * 2^(4-g) tall. */
    unit: number;
    /** Cell frames by Ahnentafel number (gutter already taken), in child coordinates; [0] unused. */
    cells: Rect[];
    columns: AncestryColumnText[];
    legend: {
        band: Rect;
        rows: number;
        px: number;
        items: Array<{
            swatch: Rect;
            label: Rect;
            fit: Fit;
        }>;
    };
};
export declare function ancestryLayout(model: AncestryModel, copy: {
    title: string;
    subtitle: string;
}, W: number, H: number): AncestryLayout;
export declare const AncestorBirthplaceChartV1: import("@m0saic/types").MosaicTemplate<AncestorBirthplaceChartProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default AncestorBirthplaceChartV1;
