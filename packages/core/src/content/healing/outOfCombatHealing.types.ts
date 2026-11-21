import type { StructureKind } from '../structures/structures.types';

/**
 * Where a structure's healing bonus applies (DEC-188, DEC-215): `fort-box` is the box round a lane
 * tower's fort walls, the court and the gateways included (DEC-215 (4)); `stronghold-interior` is
 * the ground inside its team's shield, which the shield arc and the cliffs enclose, without the
 * ground of the shield's walls, gates and turrets (DEC-215 (2), (5)).
 */
export type HealingZoneShape = 'fort-box' | 'stronghold-interior';

/**
 * The bonus one structure kind gives friendly units in its zone while it is not under attack, as
 * authored.
 */
type AuthoredStructureHealingBonus = {
  /** Added to the base rate, as a fraction of max health per second. */
  readonly fractionPerSecond: number;
  readonly zone: HealingZoneShape;
};

/** A structure kind's bonus as loaded: its rate per tick. */
type StructureHealingBonus = {
  /** Added to the base rate, as a fraction of max health per tick. */
  readonly fractionPerTick: number;
  readonly zone: HealingZoneShape;
};

/**
 * Keyed by structure kind; a kind without an entry gives no bonus. Two zones never overlap
 * (DEC-215 (1)), so a unit is in one zone at most.
 */
type StructureBonuses<Bonus> = Readonly<Partial<Record<StructureKind, Bonus>>>;

/**
 * Out-of-combat healing for every Legend and mob (DEC-188), as authored: times in seconds, rates
 * per second.
 */
export type AuthoredOutOfCombatHealing = {
  /** Seconds without dealing or taking damage before healing starts. */
  readonly delaySeconds: number;
  /** The base rate, a fraction of max health per second, flat for every unit. */
  readonly healthFractionPerSecond: number;
  /**
   * A structure is under attack until it has taken no damage for this many seconds. Only hits on
   * the structure itself count: a hit on a Stronghold's walls, gates, turrets or palace map object
   * does not (DEC-215 (2), DEC-225 Q-G), nor a blocked or zero-damage hit (DEC-225 Q-D); a lane
   * tower's fort walls are the tower (one pool, DEC-185 B).
   */
  readonly structureQuietSeconds: number;
  readonly structureBonuses: StructureBonuses<AuthoredStructureHealingBonus>;
};

/**
 * Out-of-combat healing as loaded (`loadOutOfCombatHealing`): times in ticks and rates per tick,
 * converted once (DEC-241).
 */
export type OutOfCombatHealing = {
  /** Ticks without dealing or taking damage before healing starts. */
  readonly delayTicks: number;
  /** The base rate, a fraction of max health per tick, flat for every unit. */
  readonly healthFractionPerTick: number;
  /** A structure is under attack until it has taken no damage for this many ticks. */
  readonly structureQuietTicks: number;
  readonly structureBonuses: StructureBonuses<StructureHealingBonus>;
};
