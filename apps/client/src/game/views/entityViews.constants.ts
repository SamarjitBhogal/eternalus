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

/**
 * Colour of a fallen Legend's body (DEC-295: "greyed-out"), whatever its team: a translucent grey
 * that reads as scenery on every ground.
 */
// TUNE: owner 2026-11-20 (DEC-295): look provisional until class art lands
export const LEGEND_BODY_COLOR = 'rgba(128, 128, 128, 0.55)';

/** How much wider than the Legend its outline is. */
export const LEGEND_OUTLINE_SCALE = 1.1;

/** Shared Legend display diameter, approved for the stand-in art by DEC-238. */
export const LEGEND_VISUAL_DIAMETER = 5.2;

/** Keep the selected hero's ring close to the enlarged body rather than enlarging it as a halo. */
export const LEGEND_FOCUS_RING_SCALE = 1.18;

/** Enlarges fallback troop markers and footprints beneath minion figures (DEC-238). */
export const MOB_VISUAL_SCALE = 1.4;

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
 * The marker a structure kind draws in the main view, in world units; a kind not listed draws
 * none. The two lane towers differ in shape (DEC-87: spawner tier 1, buff tier 2).
 */
// TUNE: the sizes are the old map-layer glyphs' (28); the shapes tell the two towers apart
export const STRUCTURE_MARKERS: Readonly<Record<string, GlyphSpec | undefined>> = {
  'spawner-tower': { shape: 'square', size: 28 },
  'buff-tower': { shape: 'diamond', size: 28 },
};

/**
 * The alpha, as two hex digits appended to a team colour, of the ring a structure draws round its
 * aura field (DEC-315 (4), DEC-323 (3)): faint, so the ground under it stays readable.
 */
// TUNE: DEC-315 (4); "a ring is drawn at 12 m", no reference look, close is enough
export const STRUCTURE_AURA_RING_ALPHA = '66';

/**
 * The aura field a living structure draws under the units (DEC-323 (3)): the ground within the
 * aura's radius of its outline box (`EntitySnapshot.aura`), so a box grown by the radius with
 * corners rounded by it (a circle round a box of no size). `fillAlpha` is the field's alpha, two
 * hex digits appended to the team colour; `ringWidth` is the ring's width in screen pixels;
 * `cornerSegments` straight pieces draw each rounded corner.
 */
// TUNE: DEC-323 (3) "a visible field ... team-coloured aura ring"; no reference look, close is enough
export const STRUCTURE_AURA_FIELD = {
  fillAlpha: '1a',
  ringWidth: 1.5,
  cornerSegments: 8,
} as const;

/**
 * The light particles that drift along a structure's aura ring (DEC-323 (3)): `count` dots of
 * `size` world units, evenly spaced, moving clockwise at `speed` world units per tick (30 ticks a
 * second), in the team colour at `alpha` (two hex digits appended to it). A fixed count per
 * structure keeps the cost flat.
 */
// TUNE: DEC-323 (3) "light-weight, performance-friendly particles"; no reference look
export const STRUCTURE_AURA_PARTICLES = {
  count: 12,
  size: 0.6,
  speed: 0.1,
  alpha: 'b3',
} as const;
