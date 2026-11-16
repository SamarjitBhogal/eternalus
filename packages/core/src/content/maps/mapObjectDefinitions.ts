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
