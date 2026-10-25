import type { Command } from '../commands/Command.types';
import type { ControllerId } from '../content/ai/ai.types';
import type { AiMemory, Brain } from '../state/AiState.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { SeededRandomState } from '../utils/SeededRandom.types';
import type { Perception } from './perception/Perception';

/** What a controller decides from (architecture 11 §2, §3). Read it; never change it. */
export type DecisionInput = {
  readonly state: GameState;
  readonly entityId: EntityId;
  /** The entity's brain as the last decision left it. */
  readonly brain: Brain;
  /** Radius-bounded queries; its results are reused, so read one before the next query. */
  readonly perception: Perception;
};

/**
 * One decision: the commands for the next tick, and the brain's memory and RNG state after it,
 * which `AiSystem` writes back, so a controller never changes state itself.
 */
export type Decision = {
  readonly commands: readonly Command[];
  readonly memory: AiMemory;
  readonly rngState: SeededRandomState;
};

/**
 * Decides what one kind of entity does next (architecture 11 §2). Stateless and shared, one
 * instance per `ControllerId`: whatever it remembers lives in the entity's brain in `state.ai`.
 */
export interface Controller {
  /** The id content definitions name and the registry keys it by. */
  readonly id: ControllerId;
  /** Decides for one entity: reads state only and returns the commands and the brain after. */
  decide(input: DecisionInput): Decision;
}
