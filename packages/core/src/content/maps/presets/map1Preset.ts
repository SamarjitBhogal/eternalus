import type { Vec2 } from '../../../utils/geometry.types';
import type { MapPreset } from '../maps.types';

/** Map 1 was traced at this world size; points are stored as fractions of it. */
const TRACED_WIDTH = 1600;
const TRACED_HEIGHT = 900;

/** A traced point, as a fraction of the world size. */
const traced = (x: number, y: number): Vec2 => ({ x: x / TRACED_WIDTH, y: y / TRACED_HEIGHT });

/**
 * Map 1's authored look, traced from the team's layout sketch (originally `feat/map`'s
 * `map1Terrain.ts`). It only shapes the ground and bends the lanes; every structure, camp and
 * capture point is placed by the generator from `MapConfig`, so changing `numLanes` still works.
 * The traced rift wobbled left and right; that wobble is kept as a symmetric change of width so
 * the map stays mirror-symmetric.
 *
 * TUNE: provisional shapes. Light is on the west, Dark on the east.
 */
export const MAP_1_PRESET: MapPreset = {
  id: 'map-1',
  displayName: 'Map 1', // TUNE: placeholder name
  westOutOfBounds: [
    [
      traced(0, 0),
      traced(275, 0),
      traced(235, 70),
      traced(225, 195),
      traced(180, 295),
      traced(105, 330),
      traced(0, 340),
    ],
    [
      traced(0, 560),
      traced(105, 570),
      traced(180, 605),
      traced(225, 705),
      traced(235, 830),
      traced(275, 900),
      traced(0, 900),
    ],
  ],
  // Half-width = 7 + how far the traced centre line strayed from x = 800 at that height.
  riftProfile: [
    { y: 0 / TRACED_HEIGHT, halfWidth: 20 },
    { y: 70 / TRACED_HEIGHT, halfWidth: 9 },
    { y: 120 / TRACED_HEIGHT, halfWidth: 9 },
    { y: 210 / TRACED_HEIGHT, halfWidth: 15 },
    { y: 280 / TRACED_HEIGHT, halfWidth: 19 },
    { y: 340 / TRACED_HEIGHT, halfWidth: 10 },
    { y: 390 / TRACED_HEIGHT, halfWidth: 9 },
    { y: 510 / TRACED_HEIGHT, halfWidth: 9 },
    { y: 560 / TRACED_HEIGHT, halfWidth: 10 },
    { y: 620 / TRACED_HEIGHT, halfWidth: 19 },
    { y: 690 / TRACED_HEIGHT, halfWidth: 15 },
    { y: 780 / TRACED_HEIGHT, halfWidth: 9 },
    { y: 830 / TRACED_HEIGHT, halfWidth: 9 },
    { y: 900 / TRACED_HEIGHT, halfWidth: 20 },
  ],
  // The traced north lane's bends, relative to a Stronghold 130 units from the west edge.
  laneProfile: [
    { u: 0.075, v: 0.286 },
    { u: 0.246, v: 0.386 },
    { u: 0.522, v: 0.786 },
    { u: 0.769, v: 0.957 },
  ],
};
