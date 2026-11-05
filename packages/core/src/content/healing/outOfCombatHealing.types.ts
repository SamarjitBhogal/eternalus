/**
 * Where a structure's healing bonus applies (DEC-188, owner: "the heal does not stretch outside
 * the bounds of the walls of the structures giving the buff"): `fort-outline` is inside its fort's
 * outer walls (its `Footprint`), `shield-enclosure` everything its team's shield arc and cliffs
 * enclose (owner 2026-11-05).
 */
export type HealingZoneShape = 'fort-outline' | 'shield-enclosure';

/** The bonus one structure kind gives friendly units in its zone while it is not under attack. */
type StructureHealingBonus = {
  /** Added to the base rate, as a fraction of max health per second. */
  readonly fractionPerSecond: number;
  readonly zone: HealingZoneShape;
};

/** Out-of-combat healing for every Legend and mob (DEC-188). */
export type OutOfCombatHealing = {
  /** Seconds without dealing or taking damage before healing starts. */
  readonly delaySeconds: number;
  /** The base rate, a fraction of max health per second, flat for every unit. */
  readonly healthFractionPerSecond: number;
  /** A structure is under attack until it has taken no damage for this many seconds. */
  readonly structureQuietSeconds: number;
  /** Keyed by structure kind; a kind without an entry gives no bonus. Bonuses never stack. */
  readonly structureBonuses: Readonly<Record<string, StructureHealingBonus>>;
};
