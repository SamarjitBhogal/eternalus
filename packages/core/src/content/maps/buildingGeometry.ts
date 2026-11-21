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
  /**
   * A fort: an outer capture point's square side and a lane tower's, walls included (sketch
   * units), how far inside its side a lane tower's circle stops (`LANE_TOWER_FOOTPRINT_RADIUS`) and
   * how much open ground other buildings leave round it (`laneFortKeepOuts`),
   * what every fort's side is divided by to give its wall thickness, and its central keep's width
   * and height.
   */
  fort: {
    capturePointSize: 88,
    // DEC-315 (DEC-185 (A) option (b), "bigger forts"): 56 m, so every passage through the court
    // (doorway, round the keep) is at least 2 nav cells wide at `config.map.navCellSize` 2.5 m.
    laneTowerSize: 56,
    laneTowerInset: 2, // TUNE: a tower's circle stops 2 m inside its fort's side, as at 32 m (DEC-185)
    // TUNE: open ground no other building's blocking object takes round a lane tower fort: two
    // 2.5 m nav cells, so its walls and doorways stay reachable (DEC-315).
    laneTowerClearance: 5,
    wallDivisor: 10,
    keepWidthDivisor: 3,
    keepHeightDivisor: 2.5,
  },
  northDoor: { x: 788, y: 320, width: 24, height: 12 },
  southDoor: { x: 785, y: 541, width: 30, height: 12 },
  westDoor: { x: 700, y: 437.5, width: 9, height: 30 },
  eastDoor: { x: 891, y: 437.5, width: 9, height: 30 },
  stronghold: {
    ...STRONGHOLD_GEOMETRY,
    extent:
      Math.max(
        STRONGHOLD_GEOMETRY.radiusX + STRONGHOLD_GEOMETRY.shadowOffset.x,
        STRONGHOLD_GEOMETRY.radiusY + STRONGHOLD_GEOMETRY.shadowOffset.y,
      ) + STRONGHOLD_GEOMETRY.extentPadding,
  },
} as const;

/**
 * A lane tower's footprint radius, in world units at the default world (1 sketch unit = 1 m): half
 * its fort's side less `fort.laneTowerInset`. At the default world the tower's circle follows its
 * fort (DEC-315): its map feature's footprint (the court it stamps, `WorldMap.stampCourt`), its
 * structure's radius and so its guard ring (`GuardRoster`) and where a horde gathers before it
 * (`LaneStructures`). A larger world stretches the fort (`fortInWorld`) but not this radius.
 */
export const LANE_TOWER_FOOTPRINT_RADIUS =
  BUILDING_GEOMETRY.fort.laneTowerSize / 2 - BUILDING_GEOMETRY.fort.laneTowerInset;
