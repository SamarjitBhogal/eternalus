import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';
import { TurretAmmoRule } from '../../state/TurretAmmoRule';

/**
 * Loads one of a turret's ammo (architecture 11 §4.5 `switch-ammo`; 07 §5): its `TurretState`
 * records it and its `Combat` equips the ammo's attack (`TurretAmmoRule.load`). The attack
 * timer stays, so a switch never gives a free shot. `TurretController` sends it when the ammo it
 * picks for its target is not the loaded one.
 */
export class SwitchAmmoHandler implements CommandHandler<'switch-ammo'> {
  private readonly ammoRule = new TurretAmmoRule();

  /** Validates the turret and the ammo, then loads it. */
  public handle(
    { actorId, ammoId }: Command<'switch-ammo'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    const { entities } = state;
    if (!entities.has(actorId)) {
      return 'unknown-entity';
    }
    const turret = this.ammoRule.ammoOf(entities, actorId);
    if (turret === undefined) {
      return 'not-a-turret';
    }
    if (!turret.ammo.some(({ id }) => id === ammoId)) {
      return 'unknown-ammo';
    }
    return this.ammoRule.load(entities, actorId, ammoId) ? null : 'cannot-attack';
  }
}
