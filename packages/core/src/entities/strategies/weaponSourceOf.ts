import { Combat } from '../../components/Combat';
import type { EntityId } from '../../state/EntityStore.types';
import type { Entity } from '../Entity';

/**
 * Who a weapon attack's hit is credited to (05 §9–10): the attacker and the weapon it holds, or,
 * for a unit fighting with its own attack (mobs, 04 §5), its own definition. Melee and ranged
 * attacks name their hits the same way. A `DamageSource`, and a projectile's `ProjectileSource`.
 */
export const weaponSourceOf = (
  attacker: Entity,
): { readonly attackerId: EntityId; readonly kind: 'weapon'; readonly definitionId: string } => ({
  attackerId: attacker.id,
  kind: 'weapon',
  definitionId: attacker.findComponent(Combat)?.weaponId ?? attacker.definitionId,
});
