import type { OutOfCombatHealing } from './outOfCombatHealing.types';

/**
 * Out-of-combat healing (DEC-188, owner 2026-11-04 and 2026-11-05; amended by DEC-215): a Legend
 * or mob that has dealt and taken no damage for `delaySeconds` regains `healthFractionPerSecond`
 * of its max health every second. While its centre is in the zone of a living friendly structure
 * listed in `structureBonuses` that has taken no damage for `structureQuietSeconds`, that
 * structure's bonus is added. Two zones never overlap (DEC-215 (1)). A heal from an allied Legend
 * adds to this one (DEC-215 (1)). One flat rate for every Legend and mob: a per-class rate is a
 * later keyed lookup that replaces `healthFractionPerSecond`.
 */
export const OUT_OF_COMBAT_HEALING: OutOfCombatHealing = {
  /** DEC-188 (owner 2026-11-04). */
  delaySeconds: 10, // TUNE:
  /** DEC-188 (owner 2026-11-04): 2% of max health per second. */
  healthFractionPerSecond: 0.02, // TUNE:
  /**
   * DEC-188: "a friendly tower that isnt under attack" read as 10 s without damage; DEC-215 (2):
   * the Stronghold is under attack when it was hit in the last 10 s.
   */
  structureQuietSeconds: 10, // TUNE:
  structureBonuses: {
    /** DEC-188 (owner 2026-11-04): +10 points, so 12% per second in a quiet friendly fort's box. */
    'spawner-tower': { fractionPerSecond: 0.1, zone: 'fort-box' }, // TUNE:
    'buff-tower': { fractionPerSecond: 0.1, zone: 'fort-box' }, // TUNE:
    /** DEC-188 (owner 2026-11-05): "an additional 15%", so 17% per second inside the shield. */
    stronghold: { fractionPerSecond: 0.15, zone: 'stronghold-interior' }, // TUNE:
  },
};
