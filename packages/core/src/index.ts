/**
 * Public API of `@eternalus/core`. Other packages may import only from here.
 * Anything not exported from this file is internal to the simulation.
 */
import type { PlayableTeam, Team } from './teams/teams.types';

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
export type { LegendKind } from './content/legends/legends.types';
export { DEFAULT_MAP_CONFIG } from './content/maps/defaultMapConfig';
export type {
  MapDecoration,
  MapDecorationLayer,
  MapDefinition,
  MapFeature,
  MapFeatureKind,
  MapLane,
  MapTerrain,
  MapTerrainKind,
  MinimapColourRole,
  MinimapGlyph,
  MinimapGlyphShape,
} from './content/maps/maps.types';
export type {
  DiagnosticEvent,
  DiagnosticEventMap,
  DiagnosticEventName,
} from './diagnostics/DiagnosticEvent.types';
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
export { CathedralInteriorBuilder } from './map/CathedralInteriorBuilder';
export type { CathedralInterior } from './map/CathedralInteriorBuilder.types';
export { MapGenerator } from './map/MapGenerator';
export { MapSceneryBuilder } from './map/MapSceneryBuilder';
export type { MapGeneratorConfig } from './map/MapGenerator.types';
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
export type { PlayableTeam, Team } from './teams/teams.types';
export type { Polygon, Rect, Vec2 } from './utils/geometry.types';
export { SeededRandom } from './utils/SeededRandom';
export type { SeededRandomState } from './utils/SeededRandom.types';

/**
 * The two playable teams.
 *
 * @deprecated Use `PlayableTeam`. Kept for one release for code written against `feat/map`.
 */
export type TeamId = PlayableTeam;

/**
 * Who owns a map feature when the match starts.
 *
 * @deprecated Use `Team`. Kept for one release for code written against `feat/map`.
 */
export type FeatureOwner = Team;
