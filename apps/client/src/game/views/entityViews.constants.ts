import type { Team } from '@eternalus/core';

import type { GlyphSpec } from '../engine/render/Renderer.types';

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

/**
 * The facing chevron in front of every Legend and mob (DEC-192), main view only: two arms from a
 * `tip` back to a base arc around the unit's centre. `base` and `tip` are distances from the centre
 * along the facing, `halfWidth` across it, all in unit radii, so the chevron sits outside the
 * outlines (`LEGEND_OUTLINE_SCALE`, `MOB_OUTLINE_SCALE`) and inside the focus ring
 * (`FOCUS_RING_SCALE`); `arcSegments` straight pieces draw the arc; `lineWidth` is in screen pixels.
 * The chevron is gold for every unit, whatever its team (DEC-192). The hex value is the palette's
 * gold, `--team-light-primary` in `styles/global.css` (canvas views cannot read CSS tokens).
 */
// TUNE: owner 2026-11-05 (DEC-192): a very small gold chevron at the front; sizes provisional
export const FACING_CHEVRON = {
  base: 1.4,
  tip: 1.75,
  halfWidth: 0.4,
  arcSegments: 4,
  color: '#d9a93a',
  lineWidth: 1.5,
} as const;

/**
 * Marker of a living mob (lane minion, tower guard, camp mob) on the mini map, in CSS pixels.
 * Its colour is the team's (`TEAM_COLORS`, `NEUTRAL_ENTITY_COLOR`).
 */
// TUNE: owner 2026-11-04 (DEC-187): what to draw; the size is provisional
export const MINI_MAP_MOB_GLYPH: GlyphSpec = { shape: 'dot', size: 4 };

/** Marker of a living Legend on the mini map: clearly larger than a mob's. */
// TUNE: owner 2026-11-04 (DEC-187): what to draw; the size is provisional
export const MINI_MAP_LEGEND_GLYPH: GlyphSpec = { shape: 'dot', size: 9 };

/**
 * Width of the outline around a unit's mini map marker, in CSS pixels on each side. The outline
 * also sets unit markers apart from the plain feature glyphs (a turret's 3 px dot).
 */
// TUNE: owner answer G1 (a team outline, like the main view's mob outline); width provisional
export const MINI_MAP_OUTLINE_WIDTH = 1.5;

/**
 * Outline colour of a unit's mini map marker, by team. Light, neutral and dark differ in
 * lightness, so the team never shows by hue alone (13 §7).
 */
// TUNE: owner answer G1 (a team outline); the colours are provisional
export const MINI_MAP_OUTLINE_COLORS: Readonly<Record<Team, string>> = {
  light: '#ffffff',
  neutral: '#8a8a8a',
  dark: MOB_OUTLINE_COLOR,
};

/** Mini map layer of Legends' markers: above the mobs' (layer 0), so a Legend stays on top. */
export const MINI_MAP_LEGEND_LAYER = 1;
