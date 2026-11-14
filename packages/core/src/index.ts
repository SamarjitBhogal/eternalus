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
export type { AbilityRejectReason } from './content/abilities/AbilityDefinition.types';
export { ConfigValidationError } from './config/ConfigValidationError';
export { createDefaultGameConfig } from './config/defaultGameConfig';
export type {
  DeepPartial,
  GameConfig,
  LimitsConfig,
  MapConfig,
  MatchConfig,
} from './config/GameConfig.types';
export type { MatchPhase } from './config/matchPhases';
export type {
  MatchTimelineEntry,
  TimelineAction,
  TimelineActionKind,
  TimelineMark,
} from './config/MatchTimelineEntry.types';
export { validateGameConfig } from './config/validateGameConfig';
export type { VictoryConditionId } from './config/VictoryConditionId.types';
export type {
  ClassDetailNames,
  LegendClassId,
  LegendDefinition,
  LegendKind,
} from './content/legends/legends.types';
// The kit rule the client's kit rows share with the simulation (ADR 0026 decision 1).
export { kitOf } from './content/legends/specs/kitOf';
export type {
  LegendName,
  LegendSpecDefinition,
  RoleRatings,
} from './content/legends/specs/legendSpecs.types';
// The display loader with the shipped effect strategies describing each ability's steps.
export { loadShippedDisplayContent as loadDisplayContent } from './abilities/loadShippedDisplayContent';
export type {
  AbilityDisplay,
  AbilityDisplayStep,
  DisplayContent,
} from './content/loadDisplayContent';
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
export type { BotRole, BotRosterDefinition, EnemyRoverRule } from './content/teams/botRoster.types';
export type {
  DiagnosticEvent,
  DiagnosticEventMap,
  DiagnosticEventName,
} from './diagnostics/DiagnosticEvent.types';
export { SEVERITY } from './diagnostics/Logger.constants';
export type {
  LogAttributes,
  LogContext,
  Logger,
  LogRecord,
  SeverityText,
} from './diagnostics/Logger.types';
export { makeLogRecord } from './diagnostics/makeLogRecord';
export { MemoryLogger } from './diagnostics/MemoryLogger';
export { NullLogger } from './diagnostics/NullLogger';
export { runReplay } from './diagnostics/replay';
export type { ReplayOutcome, ReplayTarget } from './diagnostics/Replay.types';
export { MapPresentationBuilder } from './map/MapPresentationBuilder';
export { MapGenerator } from './map/MapGenerator';
export type { MapGeneratorConfig } from './map/MapGenerator.types';
export { Simulation } from './Simulation';
export type { Replay, ReplaySetup, ReplayTargetFactory, RosterSlot } from './Simulation.types';
export { isUnitFamily } from './entities/unitFamilies';
export type { EntityId, RemovalCause } from './state/EntityStore.types';
export type {
  GameEventHandler,
  GameEventMap,
  GameEventType,
  Unsubscribe,
} from './state/GameEvents.types';
export type { MatchResult, Verdict } from './state/MatchResult.types';
export type { ScheduledMark } from './state/MatchState.types';
export type {
  AbilitySlotSnapshot,
  CaptureSnapshot,
  EntitySnapshot,
  MatchSnapshot,
  Snapshot,
} from './state/Snapshot.types';
export { StateHasher } from './state/StateHasher';
// DEC-178: the client uses core's "other team" rule instead of a copy.
export { isPlayableTeam, opponentOf, PLAYABLE_TEAMS } from './teams/playableTeams';
export type { PlayableTeam, Team } from './teams/teams.types';
export { isPointInPolygon } from './utils/geometry';
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

export type { MapBuilding, MapPresentation } from './content/maps/maps.types';

export { MapObjectBuilder } from './map/MapObjectBuilder';
export { AStarPathfinder } from './map/AStarPathfinder';
export { MatchPathfinderFactory } from './map/MatchPathfinderFactory';
export type { MatchNavigation } from './map/MatchPathfinderFactory.types';
export type { MapObject, MapObjectKind, MapObjectSnapshot } from './content/maps/mapObjects.types';
export { findBuildingAt } from './map/findBuildingAt';
export { findMapObjectAt } from './map/findMapObjectAt';
export { findUnitAt } from './state/findUnitAt';
