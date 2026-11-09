import type { Team } from '@eternalus/core';

import type { GlyphSpec } from '../engine/render/Renderer.types';
import type { HealthBarSide } from './EntityLayer.types';

/** Colour of entities that belong to no player team (camps, bosses, obstacles). */
export const NEUTRAL_ENTITY_COLOR = '#d9d2c3';

/** Colour of the ring around the entity the player controls. */
export const FOCUS_RING_COLOR = '#ffe066';

/** How much wider than the entity the focus ring is. */
export const FOCUS_RING_SCALE = 1.8;

/** Colour of the outline that makes Legends stand out from mobs. */
export const LEGEND_OUTLINE_COLOR = '#ffffff';

/** How much wider than the Legend its outline is. */
export const LEGEND_OUTLINE_SCALE = 1.25;

/** Colour of the outline that keeps mobs visible on their own team's ground (the Stronghold). */
export const MOB_OUTLINE_COLOR = '#1b1b1b';

/** How much wider than the mob its outline is. */
export const MOB_OUTLINE_SCALE = 1.35;

/** Width of a capture point's outline, in screen pixels. */
export const CAPTURE_OUTLINE_WIDTH = 2;

/** Width of a capture point's bars, in world units (the old radius-35 ring's width). */
export const CAPTURE_BAR_WIDTH = 70;

/** Height of a capture point's progress bar, in world units. */
export const CAPTURE_BAR_HEIGHT = 5;

/** Height of the presence bar under the progress bar (each side's share), in world units. */
export const CAPTURE_PRESENCE_BAR_HEIGHT = 2;

/** Gap between the top of a capture point's area and its bars, in world units. */
export const CAPTURE_BAR_GAP = 4;

/** Colour behind a capture point's progress bar. */
export const CAPTURE_BAR_BACKGROUND_COLOR = '#1b1b1b';

/** Colour of the checkpoint marks on a capture point's progress bar. */
export const CAPTURE_CHECKPOINT_MARK_COLOR = '#ffffff';

/** Width of a checkpoint mark, in screen pixels. */
export const CAPTURE_CHECKPOINT_MARK_WIDTH = 1;

/**
 * Marker of a living mob (lane minion, tower guard, camp mob) on the mini map, in CSS pixels.
 * Its colour is the team's (`TEAM_COLORS`, `NEUTRAL_ENTITY_COLOR`).
 */
// TUNE: owner 2026-11-04 (DEC-187): what to draw; the size accepted 2026-11-05 (DEC-187 (C))
export const MINI_MAP_MOB_GLYPH: GlyphSpec = { shape: 'dot', size: 4 };

/** Marker of a living Legend on the mini map: clearly larger than a mob's. */
// TUNE: owner 2026-11-04 (DEC-187): what to draw; the size accepted 2026-11-05 (DEC-187 (C))
export const MINI_MAP_LEGEND_GLYPH: GlyphSpec = { shape: 'dot', size: 9 };

/**
 * Width of the outline around a unit's mini map marker, in CSS pixels on each side. The outline
 * also sets unit markers apart from the plain feature glyphs (a turret's 3 px dot).
 */
// TUNE: owner G1 (a team outline like the main view's); width accepted (DEC-187, second round)
export const MINI_MAP_OUTLINE_WIDTH = 1.5;

/**
 * Outline colour of a unit's mini map marker, by team. Light, neutral and dark differ in
 * lightness, so the team never shows by hue alone (13 §7).
 */
// TUNE: owner G1 (a team outline); the colours accepted 2026-11-05 (DEC-187, second round)
export const MINI_MAP_OUTLINE_COLORS: Readonly<Record<Team, string>> = {
  light: '#ffffff',
  neutral: '#8a8a8a',
  dark: MOB_OUTLINE_COLOR,
};

/** Mini map layer of Legends' markers: above the mobs' (layer 0), so a Legend stays on top. */
export const MINI_MAP_LEGEND_LAYER = 1;

/**
 * A unit's world health bar (DEC-195): its width as a share of the unit's footprint diameter, so a
 * Legend's bar is wider than a minion's.
 */
// TUNE: placeholder look; no Figma frame draws a world health bar
export const HEALTH_BAR_WIDTH_SCALE = 1.6;

/** Height of a unit's world health bar, in world units. */
// TUNE: placeholder look
export const HEALTH_BAR_HEIGHT = 0.25;

/**
 * Gap between the top of a unit's footprint and its health bar, in world units. It clears the
 * Legend and mob outlines (`LEGEND_OUTLINE_SCALE`, `MOB_OUTLINE_SCALE`).
 */
// TUNE: placeholder look
export const HEALTH_BAR_GAP = 0.5;

/** Colour of the empty part of a unit's world health bar. */
export const HEALTH_BAR_TRACK_COLOR = '#1b1b1b';

/**
 * Colour of the health left on a unit's world health bar, by side (DEC-195): one red for every
 * enemy, one green for every ally. The green is much lighter than the red, so the two differ for
 * red-green colour blindness too; the unit's own tint and outline also show its team (13 §7).
 */
// TUNE: placeholder look; no Figma frame draws a world health bar
export const HEALTH_BAR_FILL_COLORS: Readonly<Record<HealthBarSide, string>> = {
  enemy: '#c8423b',
  ally: '#8fd16f',
};
