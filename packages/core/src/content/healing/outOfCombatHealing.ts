/**
 * Out-of-combat healing (DEC-188, owner 2026-11-04): a Legend or mob that has dealt and taken no
 * damage for `delaySeconds` regains `healthFractionPerSecond` of its max health every second; a
 * friendly spawner-tower or buff-tower within `towerRadius` that has taken no damage for
 * `towerQuietSeconds` adds `towerBonusFractionPerSecond`. One flat rate for every Legend and mob:
 * a per-class rate is a later keyed lookup that replaces `healthFractionPerSecond`.
 */
export const OUT_OF_COMBAT_HEALING = {
  /** DEC-188 (owner 2026-11-04). */
  delaySeconds: 10, // TUNE:
  /** DEC-188 (owner 2026-11-04): 2% of max health per second. */
  healthFractionPerSecond: 0.02, // TUNE:
  /** DEC-188 (owner 2026-11-04): +10 percentage points, so 12% per second under a quiet tower. */
  towerBonusFractionPerSecond: 0.1, // TUNE:
  /** balancing.md "Auras": the aura radius, 12 m. DEC-188 default, a question for the owner. */
  towerRadius: 12, // TUNE:
  /** DEC-188: "a friendly tower that isnt under attack" read as 10 s without damage. */
  towerQuietSeconds: 10, // TUNE:
} as const;
