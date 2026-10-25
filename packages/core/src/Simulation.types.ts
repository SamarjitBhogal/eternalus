import type { GameConfig } from './config/GameConfig.types';
import type { MapDefinition } from './content/maps/maps.types';
import type { DebugConfig } from './diagnostics/InvariantRunner.types';
import type { Logger } from './diagnostics/Logger.types';
import type { ContentCatalogue } from './content/ContentCatalogue';
import type { LevelCurveDefinition } from './content/progression/progression.types';
import type { DefinitionSource } from './entities/EntityFactory.types';
import type { System } from './systems/System.types';
import type { PlayableTeam } from './teams/teams.types';

/** Everything a `Simulation` is built from (architecture 03 §6). Only the first three are required. */
export type SimulationOptions = {
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
};

/** One bot Legend of a match roster (architecture 18 §8): who, for which team, in which role. */
export type RosterSlot = {
  readonly team: PlayableTeam;
  /** The Legend definition (its class). */
  readonly definitionId: string;
  /** A `laner` gets a lane at setup; the `rover` takes none (MS-20). */
  readonly role: 'laner' | 'rover';
  /** The bot's difficulty (`content/ai/difficulties/`). */
  readonly difficulty: string;
};
