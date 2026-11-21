import { isMeleeAttack } from './isMeleeAttack';
import type { AttackMode, UnitAttack, UnitAttacks } from './units.types';

/**
 * How each attack mode picks its attack from a unit's attack list. `Record<AttackMode, ...>` makes
 * a new mode (05 §10 plans `'heavy'`) a compile error until it has a selector here.
 */
const SELECTORS: Readonly<
  Record<AttackMode, (attacks: readonly UnitAttack[]) => UnitAttack | undefined>
> = {
  basic: (attacks) => attacks[0],
  melee: (attacks) => attacks.find(isMeleeAttack),
};

/**
 * Resolves a unit's attacks by mode, once at spawn (DEC-308). A mode with no attack is left out.
 *
 * @param attacks - The weapon's attacks (or a mob's single attack), in authored order.
 * @param meleeReach - The class's part of melee reach in metres (DEC-305), added to every melee
 *   attack (`melee` and `melee-sweep`) and never to a ranged one, whose `reach` is a firing
 *   distance. `0` for a mob.
 * @returns The table, or `undefined` when there is no attack at all (no basic attack).
 */
export function attacksByMode(
  attacks: readonly UnitAttack[],
  meleeReach = 0,
): UnitAttacks | undefined {
  const reached = attacks.map((attack) =>
    isMeleeAttack(attack) ? { ...attack, reach: attack.reach + meleeReach } : attack,
  );
  const basic = SELECTORS.basic(reached);
  if (basic === undefined) {
    return undefined;
  }
  const table: Partial<Record<AttackMode, UnitAttack>> = {};
  for (const mode of Object.keys(SELECTORS) as AttackMode[]) {
    const attack = SELECTORS[mode](reached);
    if (attack !== undefined) {
      table[mode] = attack;
    }
  }
  return { ...table, basic };
}
