import { HEAVY_MINION } from './heavyMinion';

/**
 * balancing.md's anchor-table Warrior ("Mini-boss and Greater Boss relative to Legends"): 650 at
 * level 1, growing 8% per level, compounding. Not the Warrior's content (`warrior.ts`: a
 * placeholder 600, +8% of it per level, added): building on that would move the Greater Boss off
 * the 41,259 the owner keeps (DEC-371 E3), so the link waits on the owner (INBOX).
 */
const REF_ANCHOR = { health: 650, growthPerLevel: 0.08 } as const;

/**
 * The level-`level` reference Legend's max health, `refHealth(L) = 650 × 1.08^(L − 1)`
 * (balancing.md: "Express boss stats as multiples of a reference Legend"). Every boss sized by it
 * moves with it in one place (DEC-371 E6, DEC-296 (3)).
 */
export const refHealth = (level: number): number =>
  REF_ANCHOR.health * (1 + REF_ANCHOR.growthPerLevel) ** (level - 1);

/**
 * What the bosses take from the heavy minion until each has its own numbers (DEC-371 E6): its
 * movement and its melee reach (no reference value for either; DEC-371 E2 keeps them).
 */
export const HEAVY_MOB_BASE = {
  movementProfile: HEAVY_MINION.movementProfile,
  reach: HEAVY_MINION.attack.reach,
} as const;
