import type { StructureKind } from '../structures/structures.types';
import type { MinionStrengthCurve } from './mobs.types';

/**
 * The strength-by-distance curve (MS-16, DISC-24): `balancing.md` "Minion strength-by-distance
 * curve" (k 0.5, max 1.5, base stats at mid-lane), with the floor at base stats because DISC-24
 * makes it "an addition on top of base stats" (`balancing.md` proposes 0.75). DISC-24's shift
 * when a tower falls has no reference amount: a tenth of the lane per tower is the agent's
 * judgement, pending the owner's correction.
 */
export const MINION_STRENGTH = {
  k: 0.5, // TUNE: balancing.md
  min: 1, // TUNE: DISC-24 (addition on top of base stats)
  max: 1.5, // TUNE: balancing.md
  basePoint: 0.5, // DISC-24: base stats at the map centre at match start
  shiftPerTowerLost: 0.1, // TUNE: no reference; agent's judgement (INBOX.md)
  maxBasePoint: 0.9, // TUNE: no reference; keeps the enemy's Stronghold end at base stats
} as const satisfies MinionStrengthCurve;

/** The lost structures that enrage their lane's minions: one stack each (`balancing.md`). */
export const ENRAGING_STRUCTURES: readonly StructureKind[] = ['spawner-tower', 'buff-tower'];

/**
 * The share of a lane minion's hit each boss takes, by mob definition id (`balancing.md` "bosses
 * take full damage from Legends and 25% from minions", so it takes several players). A mob not
 * listed takes full damage.
 */
export const BOSS_MINION_DAMAGE_TAKEN: Readonly<Record<string, number>> = {
  'capture-point-boss': 0.25, // TUNE: balancing.md
};
