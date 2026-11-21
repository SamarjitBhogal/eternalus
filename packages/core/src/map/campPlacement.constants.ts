/**
 * How far past a keep-out's edge a camp steps out of it, in world units, so its box no longer
 * touches the keep-out (`clearCampOfForts`).
 */
export const CAMP_PUSH_MARGIN = 0.5; // TUNE: any gap above 0 works; half a unit is invisible

/**
 * Half the width and height of the box a camp's pieces fill, in sketch units: the clearing is
 * 46 x 36 and a tent reaches 1 unit past it (`MapSceneryBuilder`).
 */
export const CAMP_HALF_EXTENT = { x: 24, y: 18 } as const;
