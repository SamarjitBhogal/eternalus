import { describe, expect, it } from 'vitest';
import type { MapDefinition, MapFeature } from '../content/maps/maps.types';
import { CATHEDRAL_ZONE_SIZE, LANE_ZONE_SIZE } from './capture.constants';
import { capturePointsFromMap } from './capturePointsFromMap';

const feature = (
  id: string,
  kind: MapFeature['kind'],
  x: number,
  y: number,
  laneId?: string,
): MapFeature => ({
  id,
  kind,
  team: 'neutral',
  definitionId: kind,
  position: { x, y },
  minimapGlyph: { shape: 'square', size: 4, colourRole: 'objective' },
  ...(laneId === undefined ? {} : { laneId }),
});

const mapWith = (features: MapFeature[]): MapDefinition => ({
  id: 'test-map',
  displayName: 'Test map',
  width: 1000,
  height: 600,
  seed: 1,
  lanes: [],
  terrain: [],
  features,
});

describe('capturePointsFromMap', () => {
  it('makes one zone per capture-point feature plus the Cathedral', () => {
    const zones = capturePointsFromMap(
      mapWith([
        feature('cp-0', 'capture-point', 500, 60, 'lane-0'),
        feature('cp-2', 'capture-point', 500, 540, 'lane-2'),
        feature('cathedral', 'cathedral', 500, 300),
        feature('tree-1', 'obstacle', 10, 10),
      ]),
    );
    expect(zones).toEqual([
      { id: 'cp-0', lane: 'lane-0', center: { x: 500, y: 60 }, halfSize: 1000 * LANE_ZONE_SIZE },
      { id: 'cp-2', lane: 'lane-2', center: { x: 500, y: 540 }, halfSize: 1000 * LANE_ZONE_SIZE },
      {
        id: 'cathedral',
        lane: 'cathedral',
        center: { x: 500, y: 300 },
        halfSize: 1000 * CATHEDRAL_ZONE_SIZE,
      },
    ]);
  });

  it('skips the Cathedral when a capture point already sits on it', () => {
    const zones = capturePointsFromMap(
      mapWith([
        feature('cp-1', 'capture-point', 505, 300, 'lane-1'),
        feature('cathedral', 'cathedral', 500, 300),
      ]),
    );
    expect(zones.map((zone) => zone.id)).toEqual(['cp-1']);
  });

  it('returns no zones for a map without capture points or a Cathedral', () => {
    expect(capturePointsFromMap(mapWith([]))).toEqual([]);
  });

  it('labels a capture point with no lane as unknown', () => {
    const [zone] = capturePointsFromMap(mapWith([feature('cp', 'capture-point', 1, 2)]));
    expect(zone?.lane).toBe('unknown');
  });
});
