import type { DeepPartial, GameConfig } from './GameConfig.types';

/** MVP defaults (architecture 03 §10, requirements doc MVP list, integration contract §2.2). */
const DEFAULT_GAME_CONFIG: GameConfig = {
  tickRate: 30, // decided, D9
  map: {
    numLanes: 3,
    spawnTowersPerLane: 1,
    buffTowersPerLane: 1,
    campsPerSide: 6,
    cornerCamps: 4, // MVP-if-time; 0 disables
    worldWidth: 1600, // TUNE: traced from the team sketch
    worldHeight: 900, // TUNE: traced from the team sketch
    navCellSize: 5, // TUNE: was DEFAULT_MAP_LAYOUT.navCellSize on feat/map-generator
    presetId: 'map-1',
  },
  match: {
    legendsPerTeam: 10, // 3 per lane on 3 lanes + the Rover (03 §10)
    legendsPerLane: 3,
    countdownSeconds: 60,
    hordeSizes: { light: 16, medium: 8, heavy: 4 },
    initialHordesPerTeam: 3,
    plannedMatchSeconds: 1200, // TUNE: DEC-13 pending
  },
  limits: {
    maxLegendsPerTeam: 10,
    maxUnitsPerTeam: 144,
  },
};

/**
 * The default `GameConfig` with `overrides` merged over it at every depth. The result is frozen
 * so a running match cannot change its config. Not validated: pass it through
 * `validateGameConfig()` (the `Simulation` does) before relying on it.
 */
export const createDefaultGameConfig = (overrides: DeepPartial<GameConfig> = {}): GameConfig => {
  const { map, match, limits } = DEFAULT_GAME_CONFIG;
  return Object.freeze({
    tickRate: overrides.tickRate ?? DEFAULT_GAME_CONFIG.tickRate,
    map: Object.freeze({ ...map, ...overrides.map }),
    match: Object.freeze({
      ...match,
      ...overrides.match,
      hordeSizes: Object.freeze({ ...match.hordeSizes, ...overrides.match?.hordeSizes }),
    }),
    limits: Object.freeze({ ...limits, ...overrides.limits }),
  });
};
