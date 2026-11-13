import type { MapDefinition } from '../content/maps/maps.types';
import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Where each Legend of a Duel starts, and returns to after every kill (FR-115): in the Cathedral,
 * `offset` either side of its centre, light on the west side and dark on the east.
 *
 * @param map - The generated map; its `cathedral` feature is the arena.
 * @param offset - Distance from the Cathedral's centre along the x axis.
 * @throws Error when there is no map or it has no Cathedral.
 */
export const duelStartPoints = (
  map: MapDefinition | undefined,
  offset: number,
): Readonly<Record<PlayableTeam, Vec2>> => {
  const cathedral = map?.features.find((feature) => feature.kind === 'cathedral');
  if (cathedral === undefined) {
    throw new Error('A Duel needs a generated map with a Cathedral to start in.');
  }
  const { x, y } = cathedral.position;
  return { light: { x: x - offset, y }, dark: { x: x + offset, y } };
};
