import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { isPointInPolygon } from '../utils/geometry';
import { MapGenerator } from './MapGenerator';
import { strongholdEnclosure } from './strongholdEnclosure';

const MAP = new MapGenerator().generate(createDefaultGameConfig(), 1);

describe('strongholdEnclosure', () => {
  it.each([
    ['light', 'west', 1],
    ['dark', 'east', -1],
  ] as const)(
    'closes the %s shield arc on the %s cliffs and holds its walls, gates and rear, nothing in front',
    (team, edge, ahead) => {
      const stronghold = MAP.features.find((f) => f.kind === 'stronghold' && f.team === team);
      if (stronghold?.wallBoundary === undefined) throw new Error('no stronghold');
      const zone = strongholdEnclosure(MAP, stronghold) ?? [];
      const cliffCorners = MAP.terrain
        .filter(({ id }) => id.startsWith(`${edge}-stronghold-cliff-`))
        .flatMap(({ shape }) => shape);
      const { radius, thickness } = stronghold.wallBoundary;
      const { x, y } = stronghold.position;
      const face = x + ahead * (radius + thickness / 2);

      // The rear corners are where the cliffs meet the world edge.
      for (const corner of [zone[0], zone.at(-1)]) {
        expect(cliffCorners).toContainEqual(corner);
      }
      const pieces = MAP.features.filter(
        (f) => (f.kind === 'wall-segment' || f.kind === 'gate') && f.team === team,
      );
      expect(pieces.length).toBeGreaterThan(0);
      for (const piece of pieces) expect(isPointInPolygon(piece.position, zone)).toBe(true);
      expect(isPointInPolygon({ x: face - ahead * 0.5, y }, zone)).toBe(true);
      // Behind the Stronghold, almost at the world edge.
      const rear = x + ((zone[0]?.x ?? x) - x) * 0.99;
      expect(isPointInPolygon({ x: rear, y }, zone)).toBe(true);
      expect(isPointInPolygon({ x: face + ahead * 0.5, y }, zone)).toBe(false);
    },
  );

  it('builds the same region whatever order the map lists its features in', () => {
    const stronghold = MAP.features.find((f) => f.kind === 'stronghold' && f.team === 'light');
    if (stronghold === undefined) throw new Error('no stronghold');
    const reversed = { ...MAP, features: [...MAP.features].reverse() };

    expect(strongholdEnclosure(reversed, stronghold)).toEqual(strongholdEnclosure(MAP, stronghold));
  });

  it('is undefined on a map without a shield', () => {
    const stronghold = TWO_LANE_MAP.features.find(({ kind }) => kind === 'stronghold');

    expect(stronghold).toBeDefined();
    expect(stronghold && strongholdEnclosure(TWO_LANE_MAP, stronghold)).toBeUndefined();
  });
});
