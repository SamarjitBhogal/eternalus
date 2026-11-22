import type { MeleeAttack, SweepAttack, UnitAttack } from './units.types';

/**
 * Whether `attack` is a melee attack: one target (`melee`) or a sweep (`melee-sweep`). Melee
 * attacks gain their class's reach (DEC-305) and fill the `melee` mode; a ranged attack does
 * neither.
 */
export const isMeleeAttack = (attack: UnitAttack): attack is MeleeAttack | SweepAttack =>
  attack.strategy === 'melee' || attack.strategy === 'melee-sweep';
