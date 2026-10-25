/** Which controller drives an entity (architecture 11 §2); kebab-case, never renamed once used. */
export type ControllerId =
  'player' | 'bot-legend' | 'minion' | 'guard' | 'turret' | 'boss' | 'rover';

/** How often each controller decides, and how many decisions a tick may hold (11 §6). */
export type AiCadence = {
  /** Ticks between two decisions of one entity, per controller. */
  readonly everyTicks: Readonly<Record<ControllerId, number>>;
  /** At most this many decisions per tick; the rest wait for the next tick, first in line. */
  readonly maxDecisionsPerTick: number;
};

/**
 * How a horde moves together (architecture 18 §4, §5). Distances are world units (metres); none
 * changes with the tick rate.
 */
export type HordeSteeringProfile = {
  /** A mob this close to its formation slot stops steering toward it. */
  readonly slotArrivalRadius: number;
  /** Neighbours closer than this push a mob away (architecture 10 §9). */
  readonly separationRadius: number;
  /** Push at contact, falling to 0 at `separationRadius`. */
  readonly separationWeight: number;
  /** A combined steer shorter than this counts as none, so a settled horde stands still. */
  readonly minSteer: number;
  /** The formation anchor advances at this fraction of the slowest member's top speed. */
  readonly marchSpeedFactor: number;
  /** Gap between members in the spawn grid; at least the largest minion's diameter. */
  readonly spawnSpacing: number;
  /** Members per row of the spawn grid. */
  readonly spawnColumns: number;
};

/** The weights of the lane assessment (architecture 18 §3.3); each term runs from 0 to 1. */
export type LaneAssessmentWeights = {
  readonly damageNotDealt: number;
  readonly structuresLost: number;
  readonly pushedBack: number;
};

/** The classes the aggro priority list names (architecture 11 §4.3). */
export type UnitClass = 'legend' | 'minion' | 'turret';

/**
 * One entry of a minion's target priority list (architecture 11 §4.3), best first. `x-attacking-
 * ally-y` is an enemy of class `x` whose attack target is an ally of class `y`; `closest-x` is any
 * enemy of class `x`; `lane-objective` is the horde's next standing enemy structure (18 §6.2).
 */
export type AggroPriority =
  | 'legend-attacking-ally-legend'
  | 'minion-attacking-ally-legend'
  | 'minion-attacking-ally-minion'
  | 'turret-attacking-ally-minion'
  | 'closest-minion'
  | 'closest-legend'
  | 'lane-objective';

/**
 * How a minion picks and keeps targets (architecture 11 §4.3, 18 §6.1): an AI profile, named by a
 * unit definition's `aiProfile`. Distances are metres, durations ticks.
 */
export type AggroRuleDefinition = {
  readonly id: string;
  /** Enemies this close may be acquired. */
  readonly acquisitionRadius: number;
  /** Best first; an enemy that matches no entry is never acquired. */
  readonly priority: readonly AggroPriority[];
  /** A chase ends when the mob is this far from where it left its formation. */
  readonly leashRadius: number;
  /** A chase ends this many ticks after it started on its current target. */
  readonly aggroDurationTicks: number;
  /** After re-forming, a mob waits this many ticks before it may acquire again. */
  readonly aggroCooldownTicks: number;
  /** A returning mob this close to its formation slot is marching again. */
  readonly reformDistance: number;
};
