/**
 * How a horde moves together (architecture 18 §4, §5). Distances are world units (metres); none
 * changes with the tick rate.
 */
export type HordeSteeringProfile = {
  /** A mob this close to its formation slot stops steering toward it. */
  readonly slotArrivalRadius: number;
  /** Neighbours closer than this push a mob away (architecture 10 §9). */
  readonly separationRadius: number;
  /**
   * How far toward its slot a mob checks the ground; when that stretch crosses an unwalkable
   * cell it follows the lane's flow field instead (architecture 18 §5.2).
   */
  readonly blockedLookAhead: number;
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
