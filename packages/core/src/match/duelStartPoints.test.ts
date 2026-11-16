import { describe, expect, it } from 'vitest';

import type { MapDefinition } from '../content/maps/maps.types';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { duelStartPoints } from './duelStartPoints';

describe('duelStartPoints', () => {
  it('puts light west and dark east of the Cathedral, offset apart', () => {
    const map: MapDefinition = {
      ...TWO_LANE_MAP,
      features: [
        {
          id: 'cathedral-x',
          kind: 'cathedral',
          team: 'neutral',
          definitionId: 'cathedral',
          position: { x: 100, y: 40 },
          minimapGlyph: { shape: 'dot', size: 1, colourRole: 'team' },
        },
      ],
    };

    expect(duelStartPoints(map, 10)).toEqual({ light: { x: 90, y: 40 }, dark: { x: 110, y: 40 } });
  });

  it('throws when the map has no Cathedral', () => {
    expect(() => duelStartPoints({ ...TWO_LANE_MAP, features: [] }, 10)).toThrow('Cathedral');
  });
});
