import type { OutOfCombatHealing } from './outOfCombatHealing.types';

/**
 * Out-of-combat healing (DEC-188, owner 2026-11-04 and 2026-11-05): a Legend or mob that has dealt
 * and taken no damage for `delaySeconds` regains `healthFractionPerSecond` of its max health every
 * second. Inside the zone of a living friendly structure listed in `structureBonuses` that has
 * taken no damage for `structureQuietSeconds`, that structure's bonus is added; where zones
 * overlap, only the largest bonus counts. One flat rate for every Legend and mob: a per-class rate
 * is a later keyed lookup that replaces `healthFractionPerSecond`.
 */
export const OUT_OF_COMBAT_HEALING: OutOfCombatHealing = {
  /** DEC-188 (owner 2026-11-04). */
  delaySeconds: 10, // TUNE:
  /** DEC-188 (owner 2026-11-04): 2% of max health per second. */
  healthFractionPerSecond: 0.02, // TUNE:
  /** DEC-188: "a friendly tower that isnt under attack" read as 10 s without damage. */
  structureQuietSeconds: 10, // TUNE:
  structureBonuses: {
    /** DEC-188 (owner 2026-11-04): +10 points, so 12% per second inside a quiet friendly fort. */
    'spawner-tower': { fractionPerSecond: 0.1, zone: 'fort-outline' }, // TUNE:
    'buff-tower': { fractionPerSecond: 0.1, zone: 'fort-outline' }, // TUNE:
    /** DEC-188 (owner 2026-11-05): "an additional 15%", so 17% per second inside arc + cliffs. */
    stronghold: { fractionPerSecond: 0.15, zone: 'shield-enclosure' }, // TUNE:
  },
};
