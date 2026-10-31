import type { Command } from '../commands/Command.types';
import type { BotDifficultyDefinition } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { SeededRandom } from '../utils/SeededRandom';
import type { Perception } from './perception/Perception';

/** A bot Legend's memory between decisions (architecture 11 §4.2, 18 §8). */
export type BotMemory = {
  /** A laner's `MapLane.id`, given at setup and never changed; empty for the Rover. */
  readonly lane: string;
  /** Whether it is falling back (`Survive`) until it reaches its rejoin health. */
  readonly isRetreating: boolean;
  /** The unit it last told its attack to hit. */
  readonly targetId: string | null;
  /** The first tick it may cast again. */
  readonly nextCastTick: number;
};

/** What the bot controllers read besides the state, injected so they hold no content. */
export type BotLegendControllerContent = {
  /** Difficulties by id; a bot's brain names one as its profile. */
  readonly difficulties: Readonly<Record<string, BotDifficultyDefinition>>;
  /** The map feature kinds a retreating bot falls back to. */
  readonly retreatTo: readonly string[];
};

/** One bot's decision in the making: what the tree reads, and what its nodes write. */
export type BotTurn = {
  readonly state: GameState;
  readonly id: EntityId;
  readonly team: PlayableTeam;
  readonly position: Vec2;
  readonly difficulty: BotDifficultyDefinition;
  readonly perception: Perception;
  /** This brain's own stream (11 §5), advanced only by this decision. */
  readonly rng: SeededRandom;
  /** The memory as the last decision left it. */
  readonly memory: BotMemory;
  /** The memory after this decision; nodes update it. */
  next: BotMemory;
  /** The commands for the next tick; nodes add to it. */
  readonly commands: Command[];
  /** The enemy `Fight` chose, once its condition found one. */
  enemy: EntityId | null;
  /** Where a moving branch goes, once its condition found the way. */
  destination: Vec2 | null;
};
