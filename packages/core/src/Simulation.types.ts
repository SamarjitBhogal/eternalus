import type { GameConfig } from './config/GameConfig.types';
import type { MapDefinition } from './content/maps/maps.types';
import type { DebugConfig } from './diagnostics/InvariantRunner.types';
import type { Logger } from './diagnostics/Logger.types';
import type { ContentCatalogue } from './content/ContentCatalogue';
import type { LevelCurveDefinition } from './content/progression/progression.types';
import type { DefinitionSource, WeaponSource } from './entities/EntityFactory.types';
import type { System } from './systems/System.types';

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
  /** Where Legends find their weapons by id; `loadWeapons(config.tickRate)` when omitted. */
  readonly weapons?: WeaponSource;
};
