import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Points an attacker at a world point (DEC-184): from then on `CombatSystem` faces it and attacks
 * along that line whenever the attack is off cooldown, until `aim: null`, an `attack-target` or a
 * `stop`. It has no target, so a click attacks without a target under the cursor.
 */
export class AttackAimHandler implements CommandHandler<'attack-aim'> {
  /** Validates the attacker and the point, then sets the aim (or stops the aimed attack). */
  public handle(
    { actorId, aim, mode }: Command<'attack-aim'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    const { entities } = state;
    if (!entities.has(actorId)) {
      return 'unknown-entity';
    }
    if (aim !== null && !(Number.isFinite(aim.x) && Number.isFinite(aim.y))) {
      return 'invalid-position';
    }
    return entities.setAttackAim(actorId, aim, mode) ? null : 'cannot-attack';
  }
}
