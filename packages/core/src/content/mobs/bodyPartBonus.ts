import type { BodyPartBonus } from './mobs.types';

/**
 * The damage bonuses on a big boss's body parts (DEC-381: "a hit from behind should do slightly
 * more damage" and "a projectile to the head does a bit more damage than that"). Only a unit with a
 * body outline (`combatHitbox`) gets them; when both hold, only the larger applies
 * (`BodyPartBonusStep`).
 */
export const BODY_PART_BONUS = {
  backHit: 1.15, // TUNE: DEC-381 build default
  headShot: 1.25, // TUNE: DEC-381 build default
} as const satisfies BodyPartBonus;
