import { describe, expect, it } from 'vitest';
import { findMapObjectAt } from './findMapObjectAt';
import type { MapObject } from '../content/maps/mapObjects.types';

describe('findMapObjectAt', () => {
  it('selects a living object by exact shape and excludes destroyed and indestructible objects', () => {
    const objects: readonly MapObject[] = [
      {
        id: 'house',
        kind: 'house',
        isBlocking: true,
        footprints: [
          [
            { x: 1, y: 1 },
            { x: 4, y: 1 },
            { x: 4, y: 4 },
            { x: 1, y: 4 },
          ],
        ],
      },
    ];
    const state = {
      id: 'house',
      entityId: 'entity-1',
      health: { current: 100, max: 100 },
      isDestroyed: false,
    };
    expect(findMapObjectAt(objects, [state], { x: 2, y: 2 })).toBe('entity-1');
    expect(findMapObjectAt(objects, [state], { x: 0, y: 0 })).toBeNull();
    expect(findMapObjectAt(objects, [{ ...state, isDestroyed: true }], { x: 2, y: 2 })).toBeNull();
    // An indestructible object has neither an entity nor a pool.
    expect(
      findMapObjectAt(objects, [{ ...state, entityId: null, health: null }], { x: 2, y: 2 }),
    ).toBeNull();
  });

  it('selects a lane tower through a fort wall, which shows no pool of its own while the tower stands (DEC-185 B, DEC-217 (12))', () => {
    const wall: MapObject = {
      id: 'tower-fort-wall-top',
      kind: 'wall',
      isBlocking: true,
      partOf: 'tower',
      footprints: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 1 },
          { x: 0, y: 1 },
        ],
      ],
    };
    const state = { id: wall.id, entityId: 'tower-entity', health: null, isDestroyed: false };
    expect(findMapObjectAt([wall], [state], { x: 5, y: 0.5 })).toBe('tower-entity');
  });
});
