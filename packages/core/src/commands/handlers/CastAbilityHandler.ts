import type { SlotReadiness } from '../../state/SlotReadiness.types';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Accepts a `cast-ability` (architecture 05 §7 step 2): the injected check decides, and an
 * accepted cast waits on its slot (`pendingCast`) for `AbilitySystem`, which spends, stamps the
 * cooldown and runs it this tick. A refused cast is announced by `applyCommand` with its reason.
 */
export class CastAbilityHandler implements CommandHandler<'cast-ability'> {
  /** @param cast - The cast rules (the match's `CastValidator`, injected by `Simulation`). */
  public constructor(private readonly cast: Pick<SlotReadiness, 'blockedBy'>) {}

  /** Checks the cast, then queues it on the caster's slot. */
  public handle(
    { actorId, slot, aim }: Command<'cast-ability'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    const reason = this.cast.blockedBy(state, actorId, slot, aim);
    if (reason !== null) {
      return reason;
    }
    return state.entities.queueCast(actorId, slot, aim) ? null : 'empty-slot';
  }
}
