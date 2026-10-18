import { MINI_MAP_DESIGN_FRAME, MINI_MAP_RING, MINI_MAP_RING_STROKE } from '../bridge/minimapRing';
import type { MiniMapRing } from './views/MiniMapView.types';

/** Colour behind the map, only visible if the view ever reaches past the map's edges. */
export const BACKGROUND_COLOR = '#202927';

/**
 * The HUD minimap ring both minimaps (battlefield and interior) draw inside: the one value
 * `bridge/minimapRing.ts` holds for `game/` and `ui/` (I-68, DV-95), injected into `MiniMapView`.
 */
export const HUD_MINIMAP_RING: MiniMapRing = {
  frame: MINI_MAP_DESIGN_FRAME,
  box: MINI_MAP_RING,
  strokeWidth: MINI_MAP_RING_STROKE,
};

/** The loop's frame clamp, in ticks: a frame may run at most this many (architecture 08 §2). */
export const MAX_TICKS_PER_FRAME = 5;

/** How much of the world the following camera shows left to right, in metres. TUNE: zoom. */
export const FOLLOW_VIEW_WIDTH = 64;

/**
 * How much of the world the following camera shows top to bottom (16:9 with the width).
 * TUNE: provisional.
 */
export const FOLLOW_VIEW_HEIGHT = 36;

/** How many log records the match keeps for bug reports and the overlay (architecture 15 §5). */
export const LOG_RING_CAPACITY = 512;

/**
 * PROTOTYPE(PROTO-01) TEMPORARY: demo code. Delete with `Match.spawnEscort` when Phase 2's
 * `SpawnSystem` and Phase 3's lane hordes land.
 *
 * Prototype decision (2026-10-08, demo): minions that escort the player, spawned around the
 * player's spawn point until Phase 2's `SpawnSystem` and Phase 3's lane hordes replace them.
 */
export const PROTOTYPE_ESCORT = {
  definitionId: 'light-minion',
  kind: 'light-mob',
  count: 6, // TUNE:
  spawnRadius: 2, // TUNE: metres from the player's spawn point
} as const;

/** Milliseconds in one second, to turn a tick rate into a tick length. */
export const MS_PER_SECOND = 1000;
