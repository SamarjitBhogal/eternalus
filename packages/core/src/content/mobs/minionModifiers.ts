import type { StructureKind } from '../structures/structures.types';
import type { MinionStrengthCurve } from './mobs.types';

/**
 * The strength-by-distance curve (MS-16, DISC-24): `balancing.md` "Minion strength-by-distance
 * curve" (k 0.5, max 1.5), with the floor at base stats because DISC-24 makes it "an addition on
 * top of base stats" (`balancing.md` proposes 0.75).
 */
export const MINION_STRENGTH = {
  k: 0.5, // TUNE: balancing.md
  min: 1, // TUNE: DISC-24 (addition on top of base stats)
  max: 1.5, // TUNE: balancing.md
} as const satisfies MinionStrengthCurve;

/** The lost structures that enrage their lane's minions: one stack each (`balancing.md`). */
export const ENRAGING_STRUCTURES: readonly StructureKind[] = ['spawner-tower', 'buff-tower'];
