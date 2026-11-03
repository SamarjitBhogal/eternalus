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
    expect(findMapObjectAt(objects, [{ ...state, health: null }], { x: 2, y: 2 })).toBeNull();
  });
});
