import type { ProjectileFalloff } from '../content/units/units.types';

/**
 * The share of a ranged hit's damage that lands after the shot flew `distance` metres (05 §10): all
 * of it up to `fullTo`, a straight fall to `floor` at `floorAt`, `floor` beyond. `null` fall-off
 * (a shot that never weakens) is always 1.
 */
export const falloffMultiplier = (falloff: ProjectileFalloff | null, distance: number): number => {
  if (falloff === null || distance <= falloff.fullTo) return 1;
  if (distance >= falloff.floorAt) return falloff.floor;
  const share = (distance - falloff.fullTo) / (falloff.floorAt - falloff.fullTo);
  return 1 - (1 - falloff.floor) * share;
};
