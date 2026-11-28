/**
 * The mobs whose living guard locks the zone it guards, by mob definition id (reference 04
 * "Mini-bosses at the quarter mark": "while the mini-boss is alive, its zone cannot be captured";
 * architecture 07 §7 `lockedBy`). Until the `MiniBoss` class exists (sprint 3.6) the capture
 * point boss is a guard-post mob, so the lock is keyed by its id. The Greater Boss locks the
 * Cathedral's capture while it lives (DEC-371, "BOSS E4 capture lock: A").
 */
export const ZONE_LOCKING_MOBS: readonly string[] = ['capture-point-boss', 'greater-boss'];
