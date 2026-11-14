import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { AbilitySlot, Aim, CommandRejectReason } from '../Command.types';

/**
 * What the `cast-ability` handler asks before it queues a cast: `abilities/CastValidator`, typed by
 * shape here because `commands/` may not import `abilities/` (plan arch call 2).
 */
export type CastCheck = {
  /** Why `actorId` may not cast `slot` aimed at `aim` now, or `null` when it may. */
  check(
    state: GameState,
    actorId: EntityId,
    slot: AbilitySlot,
    aim: Aim,
  ): CommandRejectReason | null;
};
