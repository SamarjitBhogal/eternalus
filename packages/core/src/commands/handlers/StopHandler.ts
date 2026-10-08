import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

const NO_HEADING = { x: 0, y: 0 };

/** Drops an entity's heading; `MovementSystem` then slows it to a stop, one tick at a time. */
export class StopHandler implements CommandHandler<'stop'> {
  /** Validates the actor, then clears its heading. */
  public handle(
    { actorId }: Command<'stop'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    if (!state.entities.has(actorId)) {
      return 'unknown-entity';
    }
    return state.entities.steer(actorId, NO_HEADING) ? null : 'not-movable';
  }
}
