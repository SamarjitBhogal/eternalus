import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MatchTimelineEntry } from './MatchTimelineEntry.types';

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
  /** The planned match length, the denominator of every timeline fraction; not a cap (no max). */
  readonly plannedMatchSeconds: number;
  /** The timed events of the match (architecture 12 §3), in tick order. */
  readonly timeline: readonly MatchTimelineEntry[];
  /**
   * The team the match is played for (architecture 12 §4: chosen at match creation); in sim mode,
   * the spectated team. A verdict for it enters `victory`, any other verdict `defeat`.
   */
  readonly playerTeam: PlayableTeam;
  /**
   * The human's seat (plan A19): the Legend the human plays, spawned for `playerTeam` at `at` when
   * the match is built; `null` in sim mode (no human). `definitionId` is the Legend definition, named
   * as in a roster slot. Until the map option gives core the map, `at` is the client's spawn point.
   */
  readonly seat: { readonly definitionId: string; readonly at: Vec2 } | null;
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

/**
 * `T` with every field optional at every depth: the overrides `createDefaultGameConfig` takes. An
 * array is replaced whole, never merged, so it keeps its element type.
 */
export type DeepPartial<T> = {
  readonly [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
