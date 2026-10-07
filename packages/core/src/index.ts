/**
 * Public API of `@eternalus/core`. Other packages may import only from here.
 * Anything not exported from this file is internal to the simulation.
 */
export type {
  AbilitySlot,
  Aim,
  Command,
  CommandRejectReason,
  CommandType,
  InputIntent,
} from './commands/Command.types';
export { ConfigValidationError } from './config/ConfigValidationError';
export { createDefaultGameConfig } from './config/defaultGameConfig';
export type {
  DeepPartial,
  GameConfig,
  LimitsConfig,
  MapConfig,
  MatchConfig,
} from './config/GameConfig.types';
export { validateGameConfig } from './config/validateGameConfig';
export { MAP_1 } from './content/maps/map1';
export { SEVERITY } from './diagnostics/Logger.constants';
export type { LogAttributes, Logger, LogRecord, SeverityText } from './diagnostics/Logger.types';
export { makeLogRecord } from './diagnostics/makeLogRecord';
export { MemoryLogger } from './diagnostics/MemoryLogger';
export { NullLogger } from './diagnostics/NullLogger';
export { runReplay } from './diagnostics/replay';
export type {
  Replay,
  ReplayOutcome,
  ReplayTarget,
  ReplayTargetFactory,
} from './diagnostics/Replay.types';
export { Simulation } from './Simulation';
export type { EntityId, RemovalCause } from './state/EntityStore.types';
export type {
  GameEventHandler,
  GameEventMap,
  GameEventType,
  Unsubscribe,
} from './state/GameEvents.types';
export type { MatchPhase } from './state/GameState.types';
export type { EntitySnapshot, Snapshot } from './state/Snapshot.types';
export { StateHasher } from './state/StateHasher';
export type {
  FeatureOwner,
  MapDefinition,
  MapFeature,
  MapFeatureKind,
  MapLane,
  MapTerrain,
  MapTerrainKind,
  TeamId,
} from './content/maps/maps.types';
export type { Polygon, Rect, Vec2 } from './utils/geometry.types';
export { SeededRandom } from './utils/SeededRandom';
export type { SeededRandomState } from './utils/SeededRandom.types';
