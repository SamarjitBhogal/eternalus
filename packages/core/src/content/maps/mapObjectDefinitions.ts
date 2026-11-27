import type { ObstacleDefinition } from '../obstacles/obstacles.types';
import type { MapObjectKind } from './mapObjects.types';

/**
 * Health of each map-object kind; `null` is indestructible. Scenery HP is the owner ruling
 * DEC-121 (b): "100HP for this sprint. will be tuned in the future." Structure HP follows
 * balancing.md.
 */
export const MAP_OBJECT_HEALTH = {
  tree: 100, // TUNE: DEC-121 (b), this sprint only
  rock: 100, // TUNE: DEC-121 (b), this sprint only
  house: 100, // TUNE: DEC-121 (b), this sprint only
  furniture: 100, // TUNE: DEC-121 (b), this sprint only
  camp: 100, // TUNE: DEC-121 (b), this sprint only
  wall: 2000,
  fort: 100, // TUNE: DEC-121 (b), this sprint only
  terrain: null,
  stronghold: 10000,
  cathedral: null,
  // Unused while the tower stands: its fort shares the tower's one health pool (DEC-185 B;
  // DEC-217 (13): only towers share a pool, the palace and gates keep their own health).
  'spawner-tower': 3000,
  'buff-tower': 2500,
  turret: 600,
  gate: 3000,
} as const satisfies Record<MapObjectKind, number | null>;

/**
 * Whether each map-object kind is a structure (DEC-405: "towers, gates, walls, etc"); every kind
 * must choose. Walls, turrets, gates and the palace stand in for the structure family (07 §1,
 * §13). A fort counts for its walls: a lane tower's fort is the tower's own body, and a capture
 * point's fort is walls like the Cathedral's. Scenery is not a structure. Which kinds count is
 * the build's reading of the owner's "etc" (DEC-405 row), not his words.
 */
const IS_STRUCTURE_MAP_OBJECT = {
  tree: false,
  rock: false,
  house: false,
  wall: true,
  furniture: false,
  fort: true,
  camp: false,
  terrain: false,
  stronghold: true,
  cathedral: false, // no health; its walls are `wall` objects
  'spawner-tower': true,
  'buff-tower': true,
  turret: true,
  gate: true,
} as const satisfies Record<MapObjectKind, boolean>;

/** The map-object kinds a Legend's weapon hit treats as a structure (DEC-405). */
export const STRUCTURE_MAP_OBJECT_KINDS: ReadonlySet<MapObjectKind> = new Set(
  (Object.keys(IS_STRUCTURE_MAP_OBJECT) as MapObjectKind[]).filter(
    (kind) => IS_STRUCTURE_MAP_OBJECT[kind],
  ),
);

/** Obstacle definitions reuse the existing entity family; exact polygons are supplied by the map. */
export const MAP_OBJECT_DEFINITIONS = Object.fromEntries(
  Object.entries(MAP_OBJECT_HEALTH).map(([kind, health]) => [
    kind,
    {
      id: `map-object-${kind}`,
      kind: 'obstacle',
      obstacleType: 'rock',
      displayName: kind,
      footprintRadius: 0.5,
      health,
      isBurnable: false,
      weight: 1,
    } satisfies ObstacleDefinition,
  ]),
) as Readonly<Record<MapObjectKind, ObstacleDefinition>>;
