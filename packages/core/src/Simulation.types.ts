import type { GameConfig } from './config/GameConfig.types';
import type { MapObject } from './content/maps/mapObjects.types';
import type { MapDefinition } from './content/maps/maps.types';
import type { BotRole } from './content/teams/botRoster.types';
import type { DebugConfig } from './diagnostics/InvariantRunner.types';
import type { Logger } from './diagnostics/Logger.types';
import type { ReplayOf, ReplayTargetFactoryOf } from './diagnostics/Replay.types';
import type { ContentCatalogue } from './content/ContentCatalogue';
import type { LevelCurveDefinition } from './content/progression/progression.types';
import type { DefinitionSource, WeaponSource } from './entities/EntityFactory.types';
import type { System } from './systems/System.types';
import type { PlayableTeam } from './teams/teams.types';

/** Everything a `Simulation` is built from (architecture 03 §6). Only the first three are required. */
export type SimulationOptions = {
  /** Explicit physical map placements; omitted in headless horde scenarios. Requires `map`. */
  readonly mapObjects?: readonly MapObject[];
  /** The match config; validated, so an invalid one throws `ConfigValidationError`. */
  readonly config: GameConfig;
  /** The match seed, a whole number from 0 to 2^32 - 1. */
  readonly seed: number;
  /** Where core's log records go. */
  readonly logger: Logger;
  /** The tick's systems in execution order; the `DefaultSystemPipeline` when omitted. */
  readonly systems?: readonly System[];
  /** Invariant settings for the default pipeline; `RELEASE_DEBUG_CONFIG` when omitted. */
  readonly debug?: DebugConfig;
  /** Where entity definitions are found by id; `loadDefaultContent(config.tickRate)` when omitted. */
  readonly content?: DefinitionSource;
  /** The generated map; its lanes and structures drive the lane hordes (architecture 18). Without one, nothing spawns on lanes. */
  readonly map?: MapDefinition;
  /** The level curves Legends level along; `loadLevelCurves()` when omitted. */
  readonly levelCurves?: Pick<ContentCatalogue<LevelCurveDefinition>, 'has' | 'get'>;
  /**
   * The bot Legends, spawned when the match is built at the start of their lane on their side
   * (architecture 18 §8); a match without one has no bots. Needs `map`.
   */
  readonly roster?: readonly RosterSlot[];
  /** Where Legends find their weapons by id; `loadWeapons(config.tickRate)` when omitted. */
  readonly weapons?: WeaponSource;
};

/** One bot Legend of a match roster (architecture 18 §8): who, for which team, in which role. */
export type RosterSlot = {
  readonly team: PlayableTeam;
  /** The Legend definition (its class). */
  readonly definitionId: string;
  /** A `laner` gets a lane at setup; the `rover` takes none (MS-20). */
  readonly role: BotRole;
  /** The bot's difficulty (`content/ai/difficulties/`). */
  readonly difficulty: string;
};

/**
 * What a match was built with: the seed, the config and, when the match had them, the generated
 * map, its placed objects and the bot roster. Plain data, so a replay can rebuild the same
 * world without the code that prepared it (architecture 03 §9, 15 §7).
 */
export type ReplaySetup = Pick<
  SimulationOptions,
  'seed' | 'config' | 'map' | 'mapObjects' | 'roster'
>;

/** A recorded match: its `ReplaySetup`, the commands and the checkpoint hashes. */
export type Replay = ReplayOf<ReplaySetup>;

/** Builds a fresh target (a `Simulation` with its systems) from a replay's `ReplaySetup`. */
export type ReplayTargetFactory = ReplayTargetFactoryOf<ReplaySetup>;
