import type { HordeSteeringProfile } from './ai.types';

/** Lane-horde steering (architecture 18 §4, §5). */
export const HORDE_STEERING = {
  slotArrivalRadius: 0.5, // TUNE:
  separationRadius: 1.8, // TUNE: a bit over two heavy-minion radii, under the slot spacing
  separationWeight: 1.5, // TUNE:
  blockedLookAhead: 6, // TUNE: a little over one nav cell, so a wall a cell ahead is seen
  minSteer: 0.25, // TUNE:
  marchSpeedFactor: 0.9, // TUNE: under 1, so the ranks keep up with the anchor
  spawnSpacing: 2, // TUNE: over the heavy minion's 1.6 m diameter
  spawnColumns: 4, // TUNE:
} as const satisfies HordeSteeringProfile;

/**
 * The neighbour grid's cell size (architecture 10 §5): the steering query radius, so a
 * separation query touches the 3 × 3 cells around a unit.
 */
export const SPACE_CELL_SIZE = HORDE_STEERING.separationRadius;
