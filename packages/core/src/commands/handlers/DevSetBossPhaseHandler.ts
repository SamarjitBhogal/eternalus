import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu: puts a boss in a phase (DEC-417), as if its health had crossed its profile's
 * line, and announces it with `boss-phase-changed`. Only a living boss (`controller: 'boss'`)
 * accepts it; its own phase again changes nothing. A boss set back to `healthy` while below its
 * share turns `hurt` again on its next hit (`BossDamageSystem`).
 */
export class DevSetBossPhaseHandler implements CommandHandler<'dev-set-boss-phase'> {
  /** Validates the boss, then changes its phase. */
  public handle(
    { entityId, phase }: Command<'dev-set-boss-phase'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    if (!state.entities.isAlive(entityId)) {
      return 'unknown-entity';
    }
    if (state.entities.controllerOf(entityId)?.controllerId !== 'boss') {
      return 'invalid-target';
    }
    const from = state.entities.bossPhaseOf(entityId);
    if (from !== phase) {
      state.entities.setBossPhase(entityId, phase, state.tick);
      state.events.emit('boss-phase-changed', { bossId: entityId, from, to: phase });
    }
    return null;
  }
}
