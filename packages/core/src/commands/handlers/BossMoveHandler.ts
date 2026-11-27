import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Starts a boss move (architecture 11 §4.6): only a boss (`controller: 'boss'`) may start one, and
 * only a move its own profile lists. The move lands its telegraph in ticks from now, recorded on
 * the boss (`BossMoveCast`) for `BossMoveSystem` to land, and `boss-telegraph` announces it. A
 * later move replaces one that has not landed. The boss stops at once, so it stands still through
 * the telegraph and no slide turns it (`MovementSystem` faces a unit the way it moves). With a
 * `targetId` it then turns to face that unit, so a cone, line or charge (which land along its
 * facing) aims there; the target can still step aside during the telegraph.
 */
export class BossMoveHandler implements CommandHandler<'boss-move'> {
  /**
   * @param telegraphTicks - By boss profile id, its moves' telegraphs in ticks
   *   (`loadBossTelegraphTicks`).
   */
  public constructor(
    private readonly telegraphTicks: Readonly<Record<string, Readonly<Record<string, number>>>>,
  ) {}

  /** Validates the boss and the move, then starts the move. */
  public handle(
    { actorId, moveId, targetId }: Command<'boss-move'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    if (!state.entities.isAlive(actorId)) {
      return 'unknown-entity';
    }
    const binding = state.entities.controllerOf(actorId);
    const ticks =
      binding?.controllerId === 'boss'
        ? this.telegraphTicks[binding.profileId]?.[moveId]
        : undefined;
    if (ticks === undefined) {
      return 'unknown-definition';
    }
    state.entities.halt(actorId);
    if (targetId !== undefined) {
      state.entities.turnToward(actorId, targetId);
    }
    state.entities.beginBossMove(actorId, moveId, state.tick + ticks);
    state.events.emit('boss-telegraph', { bossId: actorId, move: moveId });
    return null;
  }
}
