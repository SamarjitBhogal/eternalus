/** Shared authored geometry. Strongholds fit inside the generated ring in world units. */
export const BUILDING_GEOMETRY = {
  cathedral: { x: 800, y: 450 },
  palace: { x: 0, y: 450, floorRadiusX: 90, floorRadiusY: 101 },
  northDoor: { x: 788, y: 320, width: 24, height: 12 },
  southDoor: { x: 785, y: 541, width: 30, height: 12 },
  stronghold: { radiusX: 110, radiusY: 125, clearance: 12, extent: 133 },
} as const;
