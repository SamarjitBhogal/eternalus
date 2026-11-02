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
  /** How far from a lane, in world units, its flow-field corridor reaches (architecture 06 §6). */
  readonly flowFieldCorridorHalfWidth: number;
  /** Most flow-field cells rebuilt per tick after a terrain change (time slicing, 06 §6). */
  readonly flowFieldCellBudget: number;
  /** Most grid cells one A\* search for a Legend may settle (10 §9, 11 §6 cost control). */
  readonly pathMaxExpansions: number;
  /** How many cells out A\* looks for open ground when a start or goal is blocked (10 §9). */
  readonly pathSnapCells: number;
  /** An authored preset (rift and bounds polygons, lane curvature); omit for the default look. */
  readonly presetId?: string;
};

/**
 * How capture points are taken (DEC-86; architecture 07 §7). Every unit inside a zone adds its
 * weight to its side (Light, Dark or neutral); the heaviest side moves the zone's progress toward
 * itself at a rate that grows with its margin over the next side.
 */
export type CapturePointsConfig = {
  /** Checkpoints a capture passes on its way to full (the game doc's three). */
  readonly checkpoints: number;
  /** Seconds to fill a zone from neutral to full at a margin of 1 (one minion alone). */
  readonly captureSeconds: number;
  /** Seconds an unfinished capture takes to fall all the way back to its last locking state. */
  readonly revertSeconds: number;
  /** The largest margin that still speeds a capture up; a bigger margin captures no faster. */
  readonly maxMargin: number;
  /** What one unit inside a zone weighs for its side. */
  readonly weights: {
    readonly legend: number;
    /** Every unit that is not a Legend (minions, camp mobs, bosses). */
    readonly unit: number;
  };
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
  readonly capturePoints: CapturePointsConfig;
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
