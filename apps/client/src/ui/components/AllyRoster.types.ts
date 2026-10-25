/** Which step's roster column: the class step (62:201) or the Legend step (58:342). */
export type AllyRosterLayout = 'class-step' | 'legend-step';

/**
 * A roster tile's look (CD-07): `player` = the class step's player tile (cream 2 px, the local
 * pick's sigil); `player-picked` = the Legend step's 70 × 70 player tile (accent 2 px, blue glow);
 * `legend` = a bot with a Legend (portrait, Legend accent 2 px, shadow); `idle` = any other bot
 * (sigil, 1 px).
 */
export type AllyTileLook = 'player' | 'player-picked' | 'legend' | 'idle';
