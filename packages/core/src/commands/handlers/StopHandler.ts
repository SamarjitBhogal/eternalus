import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';
import { NO_HEADING } from './StopHandler.constants';

/**
 * Drops an entity's heading, its attack target and its aim point (architecture 03 §3, MS-26):
 * `MovementSystem` then slows it to a stop, one tick at a time, and it no longer hits or chases
 * anything.
 */
export class StopHandler implements CommandHandler<'stop'> {
  /** Validates the actor, then clears its attack target, its aim point and its heading. */
  public handle(
    { actorId }: Command<'stop'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    if (!state.entities.has(actorId)) {
      return 'unknown-entity';
    }
    state.entities.clearAttackTarget(actorId);
    return state.entities.steer(actorId, NO_HEADING) ? null : 'not-movable';
  }
}
