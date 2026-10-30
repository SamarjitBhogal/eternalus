const STRONGHOLD_GEOMETRY = {
  radiusX: 110,
  radiusY: 125,
  clearance: 12,
  wallThickness: 8,
  shadowOffset: { x: 6, y: 7 },
  extentPadding: 1,
} as const;

/** Shared authored geometry. Strongholds fit inside their generated ring in world units. */
export const BUILDING_GEOMETRY = {
  /** Presentation boundary geometry, matching the existing furnished palace silhouette. */
  wallSides: 64,
  wallThickness: 3,
  palaceDoorHalfWidth: 6,
  cathedral: {
    x: 800,
    y: 450,
    nave: { x: 755, y: 342, width: 90, height: 211 },
    transept: { x: 703, y: 420, width: 194, height: 65 },
    apse: { x: 800, y: 344, radiusX: 44, radiusY: 26 },
    precinct: { radiusX: 270, radiusY: 210 },
  },
  palace: {
    x: 0,
    y: 450,
    floorRadiusX: 90,
    floorRadiusY: 101,
    /** Middle-back of the ceremonial hall, before team rotation and ring scaling. */
    throne: { x: 0, y: 385, room: { x: -32, y: 360, width: 64, height: 48 } },
  },
  northDoor: { x: 788, y: 320, width: 24, height: 12 },
  southDoor: { x: 785, y: 541, width: 30, height: 12 },
  stronghold: {
    ...STRONGHOLD_GEOMETRY,
    extent:
      Math.max(
        STRONGHOLD_GEOMETRY.radiusX + STRONGHOLD_GEOMETRY.shadowOffset.x,
        STRONGHOLD_GEOMETRY.radiusY + STRONGHOLD_GEOMETRY.shadowOffset.y,
      ) + STRONGHOLD_GEOMETRY.extentPadding,
  },
} as const;
