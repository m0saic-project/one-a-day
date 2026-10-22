import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import type { MosaicDocument } from "@m0saic/types";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  FrcEventRecapV1,
  allianceChipText,
  normalizeFrcEventRecap,
  playoffChipText,
  rankSub,
  recordText,
} from "./frc-event-recap";

const render = (
  props: Parameters<typeof FrcEventRecapV1.render>[0] = {},
  w = 1080,
  h = 1080,
) => FrcEventRecapV1.render({ ...FrcEventRecapV1.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

/** Every literal text on the card (chip boxes and ticks carry none). */
function textsOf(doc: MosaicDocument): string[] {
  return (doc.sources ?? [])
    .filter((s) => s && s.type === "text")
    .flatMap((s) => (s.layers ?? []).map((l) => (l.content as { kind: string; text?: string }).text ?? ""))
    .filter((t) => t !== "");
}

describe("@one-a-day/sports/frc-event-recap/v1", () => {
  it("binds the rects that show props - Make's double-click edits them in place", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1080, 1080, { propsSchema: FrcEventRecapV1.propsSchema });
    expect(rejected).toEqual([]);
    for (const prop of ["teamNumber", "eventName", "weekLabel", "qualRank", "teamCount", "record", "districtPoints", "accent"]) {
      expect(byProp[prop]?.length ?? 0).toBeGreaterThanOrEqual(1);
    }
    expect(byProp.awards?.length ?? 0).toBe(1); // one award line at defaults
    // Closed pickers never carry a rect binding - Make edits them from the panel.
    expect(byProp.allianceRole ?? []).toHaveLength(0);
    expect(byProp.playoffResult ?? []).toHaveLength(0);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1080, height: 1080 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
    expect(FrcEventRecapV1.outputHints).toMatchObject({ width: 1080, height: 1080, format: { kind: "image" } });
  });

  it("keeps its layout contract at the seven contract canvases - defaults, the copy that stresses it, and every closed-set value", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    const stressed = {
      teamNumber: 99999,
      teamName: "IRON PANTHERS ROBOTICS CLUB 99", // 30 characters
      eventName: "Harbor City District Championship", // 33 of 40
      weekLabel: "Offseason - Remix",
      qualRank: 200,
      teamCount: 200,
      record: "120-99-12",
      allianceRole: "pick2",
      allianceNumber: 8,
      playoffResult: "quarterfinalist",
      awards: [
        "Excellence in Engineering Award sponsored by Delphi Company", // 60 characters
        "Innovation in Control Award sponsored by Automation Direct",
        "Regional Engineering Inspiration Award",
      ],
      districtPoints: 999,
    } as const;
    const emptied = {
      teamName: "",
      weekLabel: "",
      teamCount: 0,
      allianceRole: "none",
      playoffResult: "none",
      awards: [],
      districtPoints: 0,
    } as const;
    for (const over of [{}, stressed, emptied]) {
      await sweepLayout(
        (p, ctx) => FrcEventRecapV1.render(p, ctx).then(asDocument),
        "@one-a-day/sports/frc-event-recap/v1",
        { ...FrcEventRecapV1.defaultProps, ...over },
        (w, h) => targetCtx(w, h),
      );
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("shows the scout's cited TBA page as a finished card at defaults", async () => {
    const texts = textsOf(await render());
    for (const t of ["FRC EVENT RECAP", "TEAM 9128", "Harbor City District", " - Week 4", "RANK 1", "of 48 teams", "17-0-0", "W - L - T", "CAPTAIN - ALLIANCE 1", "EVENT WINNER", "AWARDS", "Innovation in Control Award", "78 DISTRICT POINTS", "DATA: THE BLUE ALLIANCE"]) {
      expect(texts).toContain(t);
    }
  });

  it("derives the TBA-vocabulary copy", () => {
    expect(allianceChipText("captain", 1)).toBe("CAPTAIN - ALLIANCE 1");
    expect(allianceChipText("pick1", 4)).toBe("1ST PICK - ALLIANCE 4");
    expect(allianceChipText("pick2", 8)).toBe("2ND PICK - ALLIANCE 8");
    expect(allianceChipText("none", 1)).toBe("");
    expect(playoffChipText("winner")).toBe("EVENT WINNER");
    expect(playoffChipText("finalist")).toBe("FINALIST");
    expect(playoffChipText("semifinalist")).toBe("SEMIFINALIST");
    expect(playoffChipText("quarterfinalist")).toBe("QUARTERFINALIST");
    expect(playoffChipText("none")).toBe("");
    expect(recordText("17-0-0")).toBe("17-0-0");
    expect(() => recordText("17-0")).toThrow(/record/);
    expect(() => recordText("17/0/0")).toThrow(/record/);
    expect(rankSub(0)).toBe("");
    expect(rankSub(1)).toBe("of 1 team");
    expect(rankSub(48)).toBe("of 48 teams");
  });

  it("drops the optional lines their props say to drop, and keeps the credit", async () => {
    const texts = textsOf(await render({ teamCount: 0, districtPoints: 0, allianceRole: "none", playoffResult: "none", awards: [], teamName: "", weekLabel: "" }));
    expect(texts).not.toContain("of 48 teams");
    expect(texts.some((t) => t.includes("DISTRICT POINTS"))).toBe(false);
    expect(texts).not.toContain("CAPTAIN - ALLIANCE 1");
    expect(texts).not.toContain("EVENT WINNER");
    expect(texts).not.toContain("AWARDS");
    expect(texts).toContain("Harbor City District"); // weekLabel removed, event stays
    expect(texts).toContain("DATA: THE BLUE ALLIANCE"); // the credit never leaves
    const named = textsOf(await render({ teamName: "Iron Panthers" }));
    expect(named).toContain("IRON PANTHERS");
  });

  it("refuses impossible input by name", async () => {
    await expect(render({ qualRank: 12, teamCount: 10 })).rejects.toThrow(/qualRank is 12 but teamCount is 10/);
    await expect(render({ record: "17/0/0" })).rejects.toThrow(/record "17\/0\/0" must be W-L-T digits/);
    await expect(render({ allianceRole: "captain", allianceNumber: 9 })).rejects.toThrow(/allianceNumber must be from 1 to 8/);
    await expect(render({ awards: ["a", "b", "c", "d"] })).rejects.toThrow(/awards has 4 lines; the card holds at most 3/);
    await expect(render({ eventName: "Harbor City — District" })).rejects.toThrow(/eventName/);
    await expect(render({ awards: ["Excellence in Engineering Award sponsored by the Delphi Company C"] })).rejects.toThrow(/awards line 1/);
    await expect(render({ teamName: "x".repeat(31) })).rejects.toThrow(/teamName/);
    await expect(render({ teamNumbr: 2471 } as never)).rejects.toThrow(/unknown prop 'teamNumbr'; did you mean 'teamNumber'\?/);
  });

  it("is deterministic and validates the model without rendering", async () => {
    expect(await render()).toEqual(await render());
    const m = normalizeFrcEventRecap({ allianceRole: "pick1", allianceNumber: 4, playoffResult: "finalist" });
    expect(m.allianceChip).toBe("1ST PICK - ALLIANCE 4");
    expect(m.playoffChip).toBe("FINALIST");
    expect(m.pointsText).toBe("78 DISTRICT POINTS");
  });
});
