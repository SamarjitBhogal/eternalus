/** One structure kind whose aura speeds up the aether refill of allied Legends nearby. */
export type AetherAuraSource = {
  /** The structure kind that gives the aura. */
  readonly structureKind: string;
  /**
   * The structure kind whose surviving share on the aura's team (standing / spawned) scales the
   * bonus, or `null` for the full bonus always.
   */
  readonly scalesWithShareOf: string | null;
};

/** How fast a Legend's aether refills (DEC-201), read by `AetherRegenSystem`. */
export type AetherRegenDefinition = {
  /** Aether per second at the class's base capacity; the rate grows with max aether / base aether. */
  readonly perSecondAtBase: number;
  /** The full aura bonus on the rate (0.5 = +50%). */
  readonly auraBonus: number;
  /** How far an aura reaches from its structure's centre, in metres. */
  readonly auraRadius: number;
  /** The structures that give an aura, and how each one's bonus scales. */
  readonly auras: readonly AetherAuraSource[];
};

/**
 * Aether regeneration. TUNE: 4 per second at the base capacity, scaled by max / base so a full
 * refill takes the same time at every level (DEC-201 (1), (3)); +50% inside an allied BuffTower or
 * Stronghold aura (DEC-201 (2), balancing.md "Auras"). A BuffTower always gives the full bonus; the
 * Stronghold's scales with the share of its team's BuffTowers still standing, so it is gone once
 * they all fall (DEC-201 (4)). The aura radius is balancing.md's 12 m `Recommendation:`, pending
 * the owner.
 */
export const AETHER_REGEN = {
  perSecondAtBase: 4, // TUNE: DEC-201 (1)
  auraBonus: 0.5, // TUNE: DEC-201 (2)
  auraRadius: 12, // TUNE: balancing.md "Auras" (12 m), pending the owner
  auras: [
    { structureKind: 'buff-tower', scalesWithShareOf: null }, // DEC-201 (2), (4)
    { structureKind: 'stronghold', scalesWithShareOf: 'buff-tower' }, // DEC-201 (4)
  ],
} as const satisfies AetherRegenDefinition;
