import type { ObstacleDefinition } from '../obstacles/obstacles.types';
import type { MapObjectKind } from './mapObjects.types';

/** Owner-approved provisional scenery HP (2026-10-27); structure HP follows balancing.md. */
export const MAP_OBJECT_HEALTH = {
  tree: 100,
  rock: 100,
  house: 100,
  furniture: 100,
  camp: 100,
  wall: 2000,
  fort: 100,
  terrain: null,
  stronghold: 10000,
  cathedral: null,
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
