import type { MapLayout } from './maps.types';

/**
 * Layout rules the map generator follows besides the `MapConfig` counts. Lengths are in world
 * units (1 unit = 1 m), angles in degrees, lane positions `t` as fractions of a lane's length
 * from the owner's gate.
 *
 * TUNE: every number here is a provisional placeholder.
 */
export const DEFAULT_MAP_LAYOUT: MapLayout = {
  unnamedMap: { id: 'generated-map', displayName: 'Generated map' }, // TUNE: placeholder name
  strongholdInset: 130,
  laneEdgeMargin: 100,
  laneProfile: [{ u: 0.55, v: 1 }],
  laneBands: { spawner: [0.3, 0.4], buff: [0.14, 0.22] },
  wallRing: { radius: 100, thickness: 10, gateArcDegrees: 24, maxSegmentArcDegrees: 45 },
  camps: {
    band: [0.38, 0.85],
    // DISC-42: lighter near the lanes, heavier deeper into the Unknown.
    weightClasses: [
      { minDepth: 0, definitionId: 'forest-camp-light' },
      { minDepth: 0.55, definitionId: 'forest-camp-medium' },
      { minDepth: 0.85, definitionId: 'forest-camp-heavy' },
    ],
  },
  cornerCamps: { insetX: 320, insetY: 80, stepX: 120 },
  rift: { halfWidth: 7, bridgeWidth: 50 },
  defaultCornerSize: 220,
  obstacles: {
    perTenThousandUnits: 1.2,
    laneClearance: 40,
    featureClearance: 45,
    choices: [
      { definitionId: 'tree', weight: 3 },
      { definitionId: 'rock', weight: 1 },
    ],
  },
  footprintSides: 12,
  navCellSize: 10,
  definitionIds: {
    stronghold: 'stronghold',
    spawnerTower: 'spawner-tower',
    buffTower: 'buff-tower',
    wallSegment: 'wall-segment',
    gate: 'gate',
    turret: 'turret',
    cornerCamp: 'corner-camp',
    capturePoint: 'capture-point',
    cathedral: 'cathedral',
    bridgeSegment: 'bridge-segment',
  },
};
