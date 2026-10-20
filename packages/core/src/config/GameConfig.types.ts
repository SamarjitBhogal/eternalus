/**
 * The world part of `GameConfig`: counts and sizes that shape the generated map (ADR 0009).
 * Field names are a contract with `map/` (integration contract §2.2); never rename them.
 */
export type MapConfig = {
  readonly numLanes: number;
  readonly spawnTowersPerLane: number;
  readonly buffTowersPerLane: number;
  readonly campsPerSide: number;
  /** 0 disables corner camps (MVP-if-time). */
  readonly cornerCamps: number;
  /** World size in world units (1 unit = 1 m). */
  readonly worldWidth: number;
  readonly worldHeight: number;
  /** Side of one square cell of the walkability grid (`WorldMap`), in world units. */
  readonly navCellSize: number;
  /** An authored preset (rift and bounds polygons, lane curvature); omit for the default look. */
  readonly presetId?: string;
};

/** How a match is staffed and paced. Times are authored in seconds and converted to ticks. */
export type MatchConfig = {
  readonly legendsPerTeam: number;
  readonly legendsPerLane: number;
  readonly countdownSeconds: number;
  readonly hordeSizes: {
    readonly light: number;
    readonly medium: number;
    readonly heavy: number;
  };
  readonly initialHordesPerTeam: number;
  readonly plannedMatchSeconds: number;
};

/** Per-team caps the developer menu and spawners must respect. */
export type LimitsConfig = {
  readonly maxLegendsPerTeam: number;
  readonly maxUnitsPerTeam: number;
};

/**
 * Everything that shapes one match. Validated once by `validateGameConfig()` and injected into
 * `Simulation`; never read from a global (architecture 01 rule A).
 */
export type GameConfig = {
  /** Simulation ticks per second. */
  readonly tickRate: number;
  readonly map: MapConfig;
  readonly match: MatchConfig;
  readonly limits: LimitsConfig;
};

/** `T` with every field optional at every depth: the overrides `createDefaultGameConfig` takes. */
export type DeepPartial<T> = {
  readonly [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
