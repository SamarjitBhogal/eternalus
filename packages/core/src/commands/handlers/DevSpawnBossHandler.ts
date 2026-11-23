import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/** Brings the Cathedral's Eternal forward to this tick. */
export class DevSpawnBossHandler implements CommandHandler<'dev-spawn-boss'> {
  /** Opens one future guard post so SpawnSystem can fill it normally. */
  public handle(
    { definitionId }: Command<'dev-spawn-boss'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    let nextPost: number | undefined;
    state.guards.forEach((slot, index) => {
      if (
        nextPost === undefined &&
        slot.mobId === definitionId &&
        slot.guardId === null &&
        slot.respawnAtTick !== null &&
        slot.respawnAtTick > state.tick
      ) {
        nextPost = index;
      }
    });
    if (nextPost === undefined) return 'invalid-origin';
    state.guards.vacate(nextPost, state.tick);
    return null;
  }
}
