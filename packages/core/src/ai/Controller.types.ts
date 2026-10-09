import type { Command } from '../commands/Command.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';

/**
 * Decides what one entity does next (architecture 11 §2). Controllers are stateless strategies,
 * one shared instance per id; they read state and return commands, which apply on the next tick.
 */
export interface Controller {
  /** Kebab-case id that unit definitions name in `controller`. */
  readonly id: string;
  /** How often an entity is asked, in ticks (architecture 11 §6); a content value, never a literal. */
  readonly cadenceTicks: number;
  /** Reads `state` only and returns the commands for `entityId` for the next tick. */
  decide(state: GameState, entityId: EntityId): readonly Command[];
}
