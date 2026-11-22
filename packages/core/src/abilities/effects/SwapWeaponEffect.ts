import { Combat } from '../../components/Combat';
import { Loadout } from '../../components/Loadout';
import type { SwapWeaponSpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';

/**
 * Puts the caster's other weapon in its hand (DEC-303: the Zealot's gadget swaps its talons and its
 * bow): the caster's `Loadout` swaps, then its `Combat` equips the new weapon's attacks. The attack
 * timer carries over and the target is kept (`Combat.equip`; `INBOX.md` HC-Q81, option A). With
 * the bow out, the melee mode becomes the basic attack, as the bow has no melee attack (HC-Q82,
 * option A). A caster with no second weapon changes nothing. The step has no area, so the aim
 * overlay draws nothing for it.
 */
export class SwapWeaponEffect implements AbilityEffect<SwapWeaponSpec> {
  public readonly kind = 'swap-weapon';

  /** Nothing to check: the step has no fields. */
  public validate(): readonly string[] {
    return [];
  }

  /** Nothing: a swap has no area to draw. */
  public describe(): readonly AbilityDisplayStep[] {
    return [];
  }

  /**
   * Swaps the caster's weapons and equips the one now in hand.
   *
   * @throws Error when the caster is not in the state.
   */
  public apply(_spec: SwapWeaponSpec, cast: CastContext): void {
    const caster = cast.state.entities.get(cast.casterId);
    if (caster === undefined) {
      throw new Error(`SwapWeaponEffect: the caster "${cast.casterId}" is not in the state.`);
    }
    const weapon = caster.getComponent(Loadout).swap();
    if (weapon !== null) {
      caster.getComponent(Combat).equip(weapon.attacks, weapon.weaponId);
    }
  }
}
