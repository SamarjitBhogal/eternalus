/** Provisional display tuning approved by DEC-238 (owner decisions log). */
import { MINI_MAP_DESIGN_FRAME, MINI_MAP_RING, MINI_MAP_RING_STROKE } from '../bridge/minimapRing';
import type { MiniMapRing } from './views/MiniMapView.types';

/** Colour behind the map, only visible if the view ever reaches past the map's edges. */
export const BACKGROUND_COLOR = '#202927';

/**
 * The HUD minimap ring the minimap draws inside: the one value
 * `bridge/minimapRing.ts` holds for `game/` and `ui/` (01 §2; 06 §10), injected into `MiniMapView`.
 */
export const HUD_MINIMAP_RING: MiniMapRing = {
  frame: MINI_MAP_DESIGN_FRAME,
  box: MINI_MAP_RING,
  strokeWidth: MINI_MAP_RING_STROKE,
};

/** The loop's frame clamp, in ticks: a frame may run at most this many (architecture 08 §2). */
export const MAX_TICKS_PER_FRAME = 5;

/** How much of the world the following camera shows left to right, in metres. TUNE: zoom. */
export const FOLLOW_VIEW_WIDTH = 96;

/**
 * How much of the world the following camera shows top to bottom (16:9 with the width).
 * TUNE: provisional.
 */
export const FOLLOW_VIEW_HEIGHT = 54;

/** How many log records the match keeps for bug reports and the overlay (architecture 15 §5). */
export const LOG_RING_CAPACITY = 512;

/** Milliseconds in one second, to turn a tick rate into a tick length. */
export const MS_PER_SECOND = 1000;
