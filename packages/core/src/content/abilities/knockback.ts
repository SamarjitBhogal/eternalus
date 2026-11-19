/** How a knock-back moves its target (DEC-208), read by `KnockbackEffect`. */
export type KnockbackDefinition = {
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
} as const satisfies KnockbackDefinition;
