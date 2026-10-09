import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Points an entity in a direction; from the next tick `MovementSystem` accelerates it that way
 * until another `move` or a `stop`.
 */
export class MoveHandler implements CommandHandler<'move'> {
  /** Validates the actor and direction, then sets the heading. */
  public handle(
    { actorId, direction }: Command<'move'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    if (!state.entities.has(actorId)) {
      return 'unknown-entity';
    }
    if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y)) {
      return 'invalid-direction';
    }
    return state.entities.steer(actorId, direction) ? null : 'not-movable';
  }
}
