import { describe, expect, it } from 'vitest';

import type { MapObject } from '../content/maps/mapObjects.types';
import { MapGenerationError } from './MapGenerationError';
import { structureBodyParts } from './structureBodyParts';

const wall = (id: string, partOf?: string, isBlocking = true): MapObject => ({
  id,
  kind: 'wall',
  footprints: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  ],
  isBlocking,
  ...(partOf === undefined ? {} : { partOf }),
});

describe('structureBodyParts', () => {
  it('groups the objects that are part of a structure by its feature id, in object order', () => {
    const outer0 = wall('outer-0', 'dark-stronghold');
    const outer1 = wall('outer-1', 'dark-stronghold');
    const throne = wall('throne', 'light-stronghold');

    const parts = structureBodyParts(
      [outer0, wall('room-wall'), throne, outer1],
      new Set(['dark-stronghold', 'light-stronghold']),
    );

    expect(parts.get('dark-stronghold')).toEqual([outer0, outer1]);
    expect(parts.get('light-stronghold')).toEqual([throne]);
    expect(parts.size).toBe(2);
  });

  it('rejects a part that does not block, or one of a feature that is no structure (Q104-13)', () => {
    const structures = new Set(['dark-stronghold']);

    expect(() => structureBodyParts([wall('floor', 'dark-stronghold', false)], structures)).toThrow(
      MapGenerationError,
    );
    expect(() => structureBodyParts([wall('floor', 'dark-stronghold', false)], structures)).toThrow(
      /'floor' is part of 'dark-stronghold' but does not block/,
    );
    expect(() => structureBodyParts([wall('stray', 'west-wall')], structures)).toThrow(
      /'stray' is part of 'west-wall', which is no structure/,
    );
  });
});
