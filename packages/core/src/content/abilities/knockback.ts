/** How a knock-back moves its target (DEC-208), as authored: its travel time in seconds. */
export type AuthoredKnockback = {
  /**
   * The mass a knock-back's content `distance` is written for. A target of this mass or lighter
   * moves the full distance; a heavier one moves `distance × baseMass / targetMass`.
   */
  readonly baseMass: number;
  /** How long the push takes, in seconds; the target slides that whole time. */
  readonly travelSeconds: number;
  /** The status every knock-back target gets (the animation lock: cannot cast). */
  readonly staggerStatusId: string;
  /** The status a knock-up (`knockup: true`) adds. */
  readonly knockupStatusId: string;
  /**
   * The damage a target takes when a wall stops its knock-back short (a map object, a wall, a
   * placed wall or a structure; the map's edge does not count): once per push, credited to the
   * caster, through the `DamagePipeline` (DEC-382, `INBOX.md` HC-B43 (6)).
   */
  readonly impactDamage: number;
};

/**
 * A loaded knock-back (`loadKnockback`), read by `KnockbackEffect`: the travel time in ticks
 * (architecture 03 §8, DEC-241).
 */
export type KnockbackDefinition = Omit<AuthoredKnockback, 'travelSeconds'> & {
  /** How long the push takes, in ticks (at least one); the target slides that whole time. */
  readonly travelTicks: number;
};

/**
 * Knock-back tuning. DEC-208 sets the rule (the content distance is for a target of base mass, a
 * heavier target moves less, knock-backs on one target in the same tick add up as vectors); the
 * formula `distance × baseMass / max(baseMass, targetMass)` and both numbers below are the
 * session's proposal, pending the owner.
 */
export const KNOCKBACK = {
  baseMass: 1, // TUNE: proposal pending the owner; the Warrior's mass, the repo's mass scale (lightMinion.ts)
  travelSeconds: 0.25, // TUNE: proposal pending the owner (plan, owner answers 2026-11-12)
  staggerStatusId: 'staggered', // more-abilities.md section 7: staggered follows every knock-back
  knockupStatusId: 'knockup', // plan arch call 7
  impactDamage: 40, // TUNE: DEC-382 (HC-B43 (6)) build default
} as const satisfies AuthoredKnockback;
