/** Colour of the panel behind the mini map, inside the ring. */
export const MINI_MAP_BACKGROUND_COLOR = '#1b1813';

/**
 * World units from the player to the edge of the mini map: the circle of this radius around the
 * player fills the ring.
 */
// TUNE: owner 2026-11-04 (DEC-182)
export const MINI_MAP_VIEW_RADIUS = 200;

/** Marker at the middle of the mini map: the point the view is centred on (the player). */
export const MINI_MAP_CENTER_GLYPH = { shape: 'ring', size: 10 } as const;

/** Colour of the centre marker. */
export const MINI_MAP_CENTER_COLOR = '#ffffff';
