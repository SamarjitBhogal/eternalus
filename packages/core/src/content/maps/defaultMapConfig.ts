/**
 * The default map counts and world size, in the shape of `GameConfig.map`.
 *
 * TODO(sholtzman): delete once session B's `createDefaultGameConfig()` lands on the phase branch;
 * callers switch to `createDefaultGameConfig().map`.
 * TUNE: world size is provisional (1600 x 900 world units, traced from the team sketch).
 */
export const DEFAULT_MAP_CONFIG = {
  numLanes: 3,
  spawnTowersPerLane: 1,
  buffTowersPerLane: 1,
  campsPerSide: 6,
  cornerCamps: 4,
  worldWidth: 1600,
  worldHeight: 900,
  presetId: 'map-1',
} as const;
