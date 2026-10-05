"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sportsRegistry = void 0;
/**
 * Pack registry: `sports` — array order is the display order.
 */
exports.sportsRegistry = [
    {
        slug: "powerlifting-meet-recap",
        templateId: "@one-a-day/sports/powerlifting-meet-recap/v1",
        exportName: "PowerliftingMeetRecapV1",
        title: "2026-09-27 · Powerlifting Meet Recap",
        description: "A powerlifting meet recap clip from the lifter's OpenPowerlifting row: nine attempts on a 3 x 3 board, solid green made, hollow red missed, the total counted up from the bests and drawn to scale.",
        tags: ["sports", "2026-09-27", "day-008", "powerlifting", "meet", "attempts", "recap", "video"],
    },
    {
        slug: "swim-time-drop-card",
        templateId: "@one-a-day/sports/swim-time-drop-card/v1",
        exportName: "SwimTimeDropCardV1",
        title: "2026-10-01 · Swim Time Drop Card",
        description: "A swim meet time-drop card for one swimmer: entry time against the time swum per event, the drop in seconds, a bar that prints the percent of the entry time it stands for, and the standard reached.",
        tags: ["sports", "2026-10-01", "day-012", "swimming", "time-drop", "meet-recap", "club"],
    },
    {
        slug: "lap-telemetry-card",
        templateId: "@one-a-day/sports/lap-telemetry-card/v1",
        exportName: "LapTelemetryCardV1",
        title: "2026-10-02 · Sim Racing Lap Card",
        description: "A sim racing lap card: track, lap time and delta vs PB, three sectors with times, PBs, and proportional delta bars (green for faster, red for slower), driver name, and top speed.",
        tags: ["sports", "2026-10-02", "day-013", "racing", "telemetry", "sector", "delta"],
    },
    {
        slug: "cubing-average-card",
        templateId: "@one-a-day/sports/cubing-average-card/v1",
        exportName: "CubingAverageCardV1",
        title: "2026-10-04 · Cubing Average Card",
        description: "A speedcubing average card: give 3, 5 or 12 solves and it works out the Mo3, Ao5 or Ao12, one bar per solve with the dropped best and worst in parentheses and hollow, the average as the headline, and the delta against the previous PB.",
        tags: ["sports", "2026-10-04", "day-015", "cubing", "speedcubing", "average", "pb", "cstimer"],
    },
];
