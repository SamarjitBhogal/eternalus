import { Combat } from '../components/Combat';
import { TurretState } from '../components/TurretState';
import type { EntityStore } from './EntityStore';
import type { EntityId } from './EntityStore.types';
import type { TurretAmmoView } from './TurretAmmoRule.types';

/**
 * The turret ammo rule over the store (architecture 07 §5): reads a turret's ammo and loads one.
 * It lets `ai/` and `commands/` reach a turret's `TurretState` without importing `components/`,
 * and keeps the store free of turret rules, as `ReachQuery` and `AreaHitQuery` do for theirs.
 * Stateless.
 */
export class TurretAmmoRule {
  /**
   * The turret's ammo and the id of the one it has loaded (its `TurretState`, read-only), or
   * `undefined` for an unknown id or an entity that is not a turret.
   */
  public ammoOf(entities: EntityStore, id: EntityId): TurretAmmoView | undefined {
    return entities.get(id)?.findComponent(TurretState);
  }

  /**
   * Loads the turret's ammo `ammoId`: its `TurretState` records it and its `Combat` equips the
   * ammo's attack (`Combat.equip`, no weapon). The attack timer stays, so a switch never gives a
   * free shot.
   *
   * @returns `false`, changing nothing, when the entity is unknown, is not a turret, cannot attack
   *   or does not carry `ammoId`.
   */
  public load(entities: EntityStore, id: EntityId, ammoId: string): boolean {
    const entity = entities.get(id);
    const combat = entity?.findComponent(Combat);
    if (combat === undefined) {
      return false;
    }
    const ammo = entity?.findComponent(TurretState)?.load(ammoId);
    if (ammo === undefined) {
      return false;
    }
    combat.equip({ basic: ammo.attack }, null);
    return true;
  }
}
