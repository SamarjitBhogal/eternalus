import type { DuelArenaRules } from '../content/duel/duelRules.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { MapDefinition } from '../content/maps/maps.types';
import type { AuthoredGuardPlan } from '../content/structures/structures.types';
import type { Command } from '../commands/Command.types';
import type { DebugConfig } from '../diagnostics/InvariantRunner.types';
import type { Logger } from '../diagnostics/Logger.types';
import type { MatchTimeline } from '../match/MatchTimeline';
import type { SpaceIndex } from '../physics/SpaceIndex';
import type { StructureSource } from '../Simulation.types';
import type { GameState } from '../state/GameState';
import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MatchContent } from './matchContent.types';

/** What `buildDefaultPipeline` wires together: the match being built and its content. */
export type DefaultPipelineParts = {
  readonly state: GameState;
  readonly timeline: MatchTimeline;
  readonly debug: DebugConfig;
  readonly logger: Logger;
  /** The match's content, controllers and its one `EntityFactory` (`loadMatchContent`). */
  readonly content: MatchContent;
  readonly space: SpaceIndex | null;
  readonly structures: StructureSource;
  /** Where the bots' commands go; the `Simulation` applies them at the start of the next step. */
  readonly onBotCommand: (command: Command) => void;
  readonly map: MapDefinition | undefined;
  readonly mapObjects: readonly MapObject[] | undefined;
  readonly guardPlans: Readonly<Record<string, AuthoredGuardPlan>> | undefined;
  /** The Duel arena; set exactly when the match is a Duel. */
  readonly arena: DuelArenaRules | undefined;
  readonly duelStarts: Readonly<Record<PlayableTeam, Vec2>> | undefined;
};
