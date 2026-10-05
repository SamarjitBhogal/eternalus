import type { MapPreset } from '../maps.types';

/**
 * Map 1's authored look, traced from the team's layout sketch (originally `feat/map`'s
 * `map1Terrain.ts`). It only shapes the ground and bends the lanes; every structure, camp and
 * capture point is placed by the generator from `MapConfig`, so changing `numLanes` still works.
 *
 * TUNE: provisional shapes in a 1600 x 900 world. Light is on the west, Dark on the east.
 */
export const MAP_1_PRESET: MapPreset = {
  id: 'map-1',
  displayName: 'Map 1', // TUNE: placeholder name
  westOutOfBounds: [
    [
      { x: 0, y: 0 },
      { x: 275, y: 0 },
      { x: 235, y: 70 },
      { x: 225, y: 195 },
      { x: 180, y: 295 },
      { x: 105, y: 330 },
      { x: 0, y: 340 },
    ],
    [
      { x: 0, y: 560 },
      { x: 105, y: 570 },
      { x: 180, y: 605 },
      { x: 225, y: 705 },
      { x: 235, y: 830 },
      { x: 275, y: 900 },
      { x: 0, y: 900 },
    ],
  ],
  riftCentreline: [
    { x: 787, y: 0 },
    { x: 802, y: 70 },
    { x: 802, y: 120 },
    { x: 792, y: 210 },
    { x: 812, y: 280 },
    { x: 797, y: 340 },
    { x: 802, y: 390 },
    { x: 802, y: 510 },
    { x: 797, y: 560 },
    { x: 812, y: 620 },
    { x: 792, y: 690 },
    { x: 802, y: 780 },
    { x: 802, y: 830 },
    { x: 787, y: 900 },
  ],
  // The traced north lane's bends, relative to a Stronghold 130 units from the west edge.
  laneProfile: [
    { u: 0.075, v: 0.286 },
    { u: 0.246, v: 0.386 },
    { u: 0.522, v: 0.786 },
    { u: 0.769, v: 0.957 },
  ],
  laneEdgeMargin: 100,
};
