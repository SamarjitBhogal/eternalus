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

/**
 * Marker of a living mob (lane minion, tower guard, camp mob) on the mini map, in CSS pixels.
 * Its colour is the team's (`TEAM_COLORS`, `NEUTRAL_ENTITY_COLOR`).
 */
// TUNE: owner 2026-11-04 (DEC-187): what to draw; the size is provisional
export const MINI_MAP_MOB_GLYPH = { shape: 'dot', size: 4 } as const;

/** Marker of a living Legend on the mini map: clearly larger than a mob's. */
// TUNE: owner 2026-11-04 (DEC-187): what to draw; the size is provisional
export const MINI_MAP_LEGEND_GLYPH = { shape: 'dot', size: 9 } as const;
