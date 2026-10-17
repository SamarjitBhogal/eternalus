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
