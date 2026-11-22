import type { AttackMode, UnitAttack, UnitAttacks } from './units.types';

/**
 * How each attack mode picks its attack from a unit's attack list. `Record<AttackMode, ...>` makes
 * a new mode (05 §10 plans `'heavy'`) a compile error until it has a selector here.
 */
const SELECTORS: Readonly<
  Record<AttackMode, (attacks: readonly UnitAttack[]) => UnitAttack | undefined>
> = {
  basic: (attacks) => attacks[0],
  melee: (attacks) => attacks.find((attack) => attack.strategy === 'melee'),
};

/**
 * Resolves a unit's attacks by mode, once at spawn (DEC-308). A mode with no attack is left out.
 *
 * @param attacks - The weapon's attacks (or a mob's single attack), in authored order.
 * @returns The table, or `undefined` when there is no attack at all (no basic attack).
 */
export function attacksByMode(attacks: readonly UnitAttack[]): UnitAttacks | undefined {
  const basic = SELECTORS.basic(attacks);
  if (basic === undefined) {
    return undefined;
  }
  const table: Partial<Record<AttackMode, UnitAttack>> = {};
  for (const mode of Object.keys(SELECTORS) as AttackMode[]) {
    const attack = SELECTORS[mode](attacks);
    if (attack !== undefined) {
      table[mode] = attack;
    }
  }
  return { ...table, basic };
}
