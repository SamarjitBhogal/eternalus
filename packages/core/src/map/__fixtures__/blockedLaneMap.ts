import type { MapDefinition, MapFeature } from '../../content/maps/maps.types';

const stronghold = (team: 'light' | 'dark', x: number): MapFeature => ({
  id: `stronghold-${team}`,
  kind: 'stronghold',
  team,
  definitionId: 'stronghold',
  position: { x, y: 20 },
  minimapGlyph: { shape: 'square', size: 1, colourRole: 'team' },
});

/**
 * A 120 x 40 map for flow-field tests: one straight lane along y 20 from x 10 to x 110 with a
 * 20 x 20 rift block across its middle (x 50..70, y 10..30), and a footprint-less Stronghold
 * just behind each end.
 */
export const BLOCKED_LANE_MAP: MapDefinition = {
  id: 'blocked-lane',
  displayName: 'Blocked lane',
  width: 120,
  height: 40,
  seed: 0,
  lanes: [
    {
      id: 'lane-0',
      index: 0,
      path: [
        { x: 10, y: 20 },
        { x: 110, y: 20 },
      ],
    },
  ],
  terrain: [
    {
      id: 'block',
      kind: 'rift',
      shape: [
        { x: 50, y: 10 },
        { x: 70, y: 10 },
        { x: 70, y: 30 },
        { x: 50, y: 30 },
      ],
    },
  ],
  features: [stronghold('light', 4), stronghold('dark', 116)],
};
