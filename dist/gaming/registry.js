"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamingRegistry = void 0;
/**
 * Pack registry: `gaming` — array order is the display order.
 */
exports.gamingRegistry = [
    {
        slug: "speedrun-pb-recap",
        templateId: "@one-a-day/gaming/speedrun-pb-recap/v1",
        exportName: "SpeedrunPbRecapV1",
        title: "2026-09-26 · Speedrun PB Recap",
        description: "A speedrun PB recap clip from the splits file: the table fills in against the old PB in LiveSplit's delta colours, the timer fast-forwards the run, and the clip opens and closes on the result.",
        tags: ["gaming", "2026-09-26", "day-007", "speedrun", "livesplit", "splits", "recap", "video"],
    },
    {
        slug: "crossword-grid-card",
        templateId: "@one-a-day/gaming/crossword-grid-card/v1",
        exportName: "CrosswordGridCardV1",
        title: "2026-09-29 · Crossword Grid Card",
        description: "Crossword Grid Card: a solved crossword grid drawn in a few layers on one integer lattice - derived clue numbers, circles, theme entries tinted and listed, the caption line; solved=false makes the teaser.",
        tags: ["gaming", "2026-09-29", "day-010"],
    },
    {
        slug: "vatsim-monthly-log",
        templateId: "@one-a-day/gaming/vatsim-monthly-log/v1",
        exportName: "VatsimMonthlyLogV1",
        title: "2026-10-13 · VATSIM Monthly Log",
        description: "A virtual airline's month as one ops-log card from the PIREP rows themselves: the pilot and month, four tiles, the dated table (date, flight, sector, type, block, fpm, score) and a career-milestone bar - flights, hours, longest and average all computed from the rows, nothing typed twice.",
        tags: ["gaming", "2026-10-13", "day-024", "vatsim", "logbook", "pirep", "flight-hours", "virtual-airline", "monthly"],
    },
    {
        slug: "tenxten-challenge-card",
        templateId: "@one-a-day/gaming/tenxten-challenge-card/v1",
        exportName: "TenxtenChallengeCardV1",
        title: "2026-10-14 · 10x10 Challenge Card",
        description: "The yearly 10x10 board game challenge as a progress card: ten games x ten plays as a pip grid - per-game fill, the plays and games-done totals and the year pace computed from the list, never typed.",
        tags: ["gaming", "2026-10-14", "day-025", "board-games", "10x10", "challenge", "progress", "plays", "bgg"],
    },
    {
        slug: "osu-scorepost-card",
        templateId: "@one-a-day/gaming/osu-scorepost-card/v1",
        exportName: "OsuScorepostCardV1",
        title: "2026-10-15 · osu! Scorepost Card",
        description: "An osu! result-screen card from the API score object: beatmap header, rank badge, four stat tiles, hit counts and mods - rendered for r/osugame or Discord without remote art.",
        tags: ["gaming", "2026-10-15", "day-026", "osu", "scorepost", "rhythm-game", "card"],
    },
    {
        slug: "commander-deck-spotlight",
        templateId: "@one-a-day/gaming/commander-deck-spotlight/v1",
        exportName: "CommanderDeckSpotlightV1",
        title: "2026-10-16 · Commander Deck Spotlight Card",
        description: "A Magic Commander/EDH deck as one share card from the decklist fields themselves: kicker, bracket and record pills, deck name, commander line with WUBRG mana chips, an eight-bar mana curve with derived AVG MV and spell count, 3-6 highlight rows and the plan one-liner.",
        tags: ["gaming", "2026-10-16", "day-027", "mtg", "commander", "edh", "decklist", "deck-tech", "share-card"],
    },
    {
        slug: "wh40k-roster-card",
        templateId: "@one-a-day/gaming/wh40k-roster-card/v1",
        exportName: "Wh40kRosterCardV1",
        title: "2026-10-18 · WH40k Roster Share Card",
        description: "A Warhammer 40,000 BattleScribe roster as one share card: army name, faction, detachment, points pill and unit rows with category badges, model counts and optional enhancement/warlord chips - no art or rules.",
        tags: ["gaming", "2026-10-18", "day-029", "warhammer-40k", "battlescribe", "roster", "army-list", "share-card"],
    },
    {
        slug: "typing-pb-card",
        templateId: "@one-a-day/gaming/typing-pb-card/v1",
        exportName: "TypingPbCardV1",
        title: "2026-10-21 · Typing PB Card",
        description: "A typing-test result card from the Monkeytype result object: the hero wpm with the NEW PB badge and +N delta computed against pb (never typed), raw/acc/consistency tiles, and the per-second chartData.wpm as a full-width bar row.",
        tags: ["gaming", "2026-10-21", "day-032", "monkeytype", "typing", "wpm", "personal-best", "result-card"],
    },
];
