import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Records whether a Legend's jump key is held (DEC-390). From the next tick `JumpSystem` lifts a
 * held Legend that stands on the ground, again on each landing, until a `jump` with `isHeld: false`.
 */
export class JumpHandler implements CommandHandler<'jump'> {
  /** Validates the actor, then records the held state. */
  public handle(
    { actorId, isHeld }: Command<'jump'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    if (!state.entities.has(actorId)) {
      return 'unknown-entity';
    }
    return state.entities.holdJump(actorId, isHeld) ? null : 'cannot-jump';
  }
}
