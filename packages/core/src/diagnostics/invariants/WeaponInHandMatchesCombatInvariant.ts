import { Combat } from '../../components/Combat';
import { Loadout } from '../../components/Loadout';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `weapon-in-hand-matches-combat` (light): an entity with a `Loadout` attacks with the weapon in
 * its hand, so its `Combat.weaponId` is `Loadout.inHand.weaponId` (DEC-303: the Zealot's talons and
 * bow). `SwapWeaponEffect` swaps the loadout and equips `Combat` together; a swap or an equip done
 * around it leaves the two out of step.
 */
export class WeaponInHandMatchesCombatInvariant implements Invariant {
  public readonly id = 'weapon-in-hand-matches-combat';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** Flags every entity whose `Combat` weapon is not the weapon in its hand, in store order. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];
    state.entities.forEach((entity) => {
      const inHand = entity.findComponent(Loadout)?.inHand.weaponId;
      const equipped = entity.findComponent(Combat)?.weaponId ?? null;
      if (inHand === undefined || equipped === inHand) {
        return;
      }
      violations.push({
        invariantId: this.id,
        severity: this.severity,
        message: `Entity "${entity.id}" holds "${inHand}" but attacks with "${equipped ?? 'none'}".`,
        entityId: entity.id,
        details: { inHand, equipped: equipped ?? 'none' },
      });
    });
    return violations;
  }
}
