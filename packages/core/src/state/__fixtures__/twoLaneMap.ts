import type { MapDefinition, MapFeature } from '../../content/maps/maps.types';

const GLYPH = { shape: 'dot', size: 1, colourRole: 'team' } as const;

const feature = (
  id: string,
  kind: MapFeature['kind'],
  team: MapFeature['team'],
  x: number,
  y: number,
  laneId?: string,
): MapFeature => ({
  id,
  kind,
  team,
  definitionId: kind,
  position: { x, y },
  minimapGlyph: GLYPH,
  ...(laneId === undefined ? {} : { laneId }),
});

/**
 * A small hand-made map for horde tests: two straight lanes from x 20 to x 180 (lane-0 at y 20
 * with a bend point at x 100, lane-1 at y 40), a Stronghold at each end, and one SpawnerTower
 * and one BuffTower per team.
 */
export const TWO_LANE_MAP: MapDefinition = {
  id: 'two-lane-test-map',
  displayName: 'Two lanes',
  width: 200,
  height: 60,
  seed: 1,
  lanes: [
    {
      id: 'lane-1',
      index: 1,
      path: [
        { x: 20, y: 40 },
        { x: 180, y: 40 },
      ],
    },
    {
      id: 'lane-0',
      index: 0,
      path: [
        { x: 20, y: 20 },
        { x: 100, y: 20 },
        { x: 180, y: 20 },
      ],
    },
  ],
  terrain: [],
  features: [
    feature('stronghold-light', 'stronghold', 'light', 10, 30),
    feature('stronghold-dark', 'stronghold', 'dark', 190, 30),
    feature('spawner-light-0', 'spawner-tower', 'light', 60, 20, 'lane-0'),
    feature('spawner-dark-0', 'spawner-tower', 'dark', 140, 20, 'lane-0'),
    feature('buff-light-1', 'buff-tower', 'light', 50, 40, 'lane-1'),
    feature('buff-dark-1', 'buff-tower', 'dark', 150, 40, 'lane-1'),
    feature('cathedral', 'cathedral', 'neutral', 100, 30),
  ],
};
