import type { BodyPartBonus } from './mobs.types';

/**
 * The damage bonuses on a big boss's body parts (DEC-381: "a hit from behind should do slightly
 * more damage" and "a projectile to the head does a bit more damage than that"). Only a unit with a
 * body outline (`combatHitbox`) gets them; when both hold, only the larger applies
 * (`BodyPartBonusStep`). The owner chose each value on the DEC-381 cards ("Tunable post
 * game-testing").
 */
export const BODY_PART_BONUS = {
  backHit: 1.15, // TUNE: DEC-381 (1) A, "15% more (built)"
  headShot: 1.25, // TUNE: DEC-381 (3) A, "25% more (built)"
  backZoneDegrees: 120, // TUNE: DEC-381 (2) B, "a narrower rear zone of 120 degrees"
} as const satisfies BodyPartBonus;
