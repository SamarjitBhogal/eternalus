import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Points an attacker at a target; from then on `CombatSystem` hits it whenever it is in reach and
 * the attack is off cooldown, until the target dies or another `attack-target` replaces it.
 */
export class AttackTargetHandler implements CommandHandler<'attack-target'> {
  /** Validates the attacker and target, then sets the target. */
  public handle(
    { actorId, targetId }: Command<'attack-target'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    const { entities } = state;
    if (!entities.has(actorId) || !entities.has(targetId)) {
      return 'unknown-entity';
    }
    const actorTeam = entities.teamOf(actorId);
    const isAlly = actorTeam !== undefined && actorTeam === entities.teamOf(targetId);
    if (isAlly || !entities.isAlive(targetId)) {
      return 'invalid-target';
    }
    return entities.setAttackTarget(actorId, targetId) ? null : 'cannot-attack';
  }
}
