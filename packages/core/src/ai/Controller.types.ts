import type { Command } from '../commands/Command.types';
import type { ControllerId } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';

/**
 * Decides what one kind of entity does next (architecture 11 §2). Stateless and shared, one
 * instance per `ControllerId`: whatever it remembers lives in the entity's brain in `state.ai`.
 */
export interface Controller {
  /** The id content definitions name and the registry keys it by. */
  readonly id: ControllerId;
  /** Decides for one entity: reads state only and returns the commands for the next tick. */
  decide(state: GameState, entityId: EntityId): readonly Command[];
}
