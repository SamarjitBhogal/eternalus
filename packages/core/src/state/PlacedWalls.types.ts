import type { Polygon } from '../utils/geometry.types';
import type { EntityId } from './EntityStore.types';

/**
 * The match's walls on the state, for bodies placed during the match (architecture 10 §5; a
 * Shield Wall, DEC-330 (7)): whether an outline has room, and the one place that makes a body's
 * outline block walking and paths, and stop doing so. `map/RuntimeWalls` satisfies it. A port
 * because `abilities/` and `entities/` may not import `map/` or `physics/` (02 §2).
 */
export interface PlacedWalls {
  /**
   * Whether `outline` (world units) overlaps a wall (terrain, a blocking map object, a placed body)
   * or reaches past the map's edge, so a body cannot stand there.
   */
  isBlocked(outline: Polygon): boolean;
  /**
   * Makes `polygons` block walking (the collision index) and paths (the nav grid, and with it the
   * lane fields) as the body `id`, from now on.
   *
   * @throws Error when `id` already blocks.
   */
  add(id: EntityId, polygons: readonly Polygon[]): void;
  /** Undoes `add` of `id`; an id that does not block changes nothing. */
  remove(id: EntityId): void;
}
