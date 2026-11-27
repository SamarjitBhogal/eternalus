import type { ProjectileBodyLook, ProjectileEndingLook } from './ProjectileView.types';

/** Size of a projectile's team-coloured dot, in world units. */
// TUNE: placeholder look for ranged attacks (PR 1); close is enough
export const PROJECTILE_DOT_SIZE = 0.5;

/** Size of the bright core on a projectile's dot, in world units. */
export const PROJECTILE_CORE_SIZE = 0.25;

/** Colour of a projectile's bright core. */
export const PROJECTILE_CORE_COLOR = '#ffffff';

/**
 * Colour of a lit shot's streak and dot, in place of its team colour: an arrow that flew over
 * lava and burns what it lands on (HC-Q89, DEC-345).
 */
// TUNE: placeholder look (DEC-345); close is enough
export const PROJECTILE_LIT_COLOR = '#ff7a1a';

/** Length of the streak behind a projectile, in world units. */
export const PROJECTILE_STREAK_LENGTH = 1.5;

/** Width of the streak behind a projectile, in screen pixels. */
export const PROJECTILE_STREAK_WIDTH = 2;

/**
 * The ending look of each projectile definition id (DEC-306). A new projectile is one entry here.
 * `ProjectileView.test.ts` checks the keys against core's projectile ids
 * (`DisplayContent.projectileIds`, ADR 0023), and `ProjectileView` throws on an id not listed.
 */
// TUNE: placeholder looks (DEC-306, DEC-341 (4)): a bolt fizzles into a mist, the arrow drops, the turret bolts lodge, the orb bursts
export const PROJECTILE_ENDING_LOOKS: Readonly<Record<string, ProjectileEndingLook>> = {
  'magus-bolt': 'fizzle',
  arrow: 'drop',
  'turret-bolt': 'lodge',
  'turret-heavy-bolt': 'lodge',
  'tower-orb': 'burst',
};

/**
 * The body look of each projectile definition id; an id with no entry is a `'streak'`.
 * `ProjectileView.test.ts` checks the keys against core's projectile ids
 * (`DisplayContent.projectileIds`, ADR 0023).
 */
// TUNE: placeholder looks (DEC-302): the tower orb is a circle, every other shot a streak
export const PROJECTILE_BODY_LOOKS: Readonly<Record<string, ProjectileBodyLook>> = {
  'tower-orb': 'orb',
};

/** Colour of the shadow under a dropping shot. */
export const PROJECTILE_SHADOW_COLOR = '#000000';

/** How solid the shadow is, 0 to 1. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_SHADOW_OPACITY = 0.35;

/** Size of the shadow dot, in world units. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_SHADOW_SIZE = 0.4;

/**
 * How high a dropping shot (an arrow) is as it leaves its weapon, in world units: how far below
 * it (screen down, world +y) its shadow is at the start of its flight.
 */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_ARC_LAUNCH_HEIGHT = 1.2;

/**
 * How much the arc of a dropping shot rises at mid-flight, in world units, above the straight
 * drop from its launch height to the ground at its end. The shadow drops away from the arrow, then
 * closes in and meets it where it lands (DEC-322 (2): an artificial arc).
 */
// TUNE: placeholder look (DEC-322 (2)); close is enough
export const PROJECTILE_ARC_RISE = 2;

/** Number of dots in the mist of a fizzling shot. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_MIST_DOT_COUNT = 6;

/** Size of each mist dot, in world units. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_MIST_DOT_SIZE = 0.6;

/** How far the mist dots are from the centre as it starts, in world units. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_MIST_START_RADIUS = 0.1;

/** How far the mist dots are from the centre as it is gone, in world units. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_MIST_END_RADIUS = 1.2;

/** How solid the mist is as it starts, 0 to 1; it fades to 0 as it is gone. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_MIST_OPACITY = 0.6;

/** The share of its ending (0 to 1) after which a dropped shot starts to fade out. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_DROP_FADE_FROM = 0.6;

/**
 * The range (metres) at which an arc shot's arc is as high as `PROJECTILE_ARC_RISE`; a nearer shot
 * rises by the share `range / PROJECTILE_ARC_REFERENCE_RANGE` of it (DEC-341 (4)), a farther one
 * by no more than the full rise.
 */
// TUNE: no reference value
export const PROJECTILE_ARC_REFERENCE_RANGE = 30;

/**
 * How high an arc shot is as it leaves its shooter, per definition id, in world units; an id with
 * no entry starts at `PROJECTILE_ARC_LAUNCH_HEIGHT`.
 */
// TUNE: no reference value
export const PROJECTILE_ARC_LAUNCH_HEIGHTS: Readonly<Record<string, number>> = {
  'turret-bolt': 2, // a wall turret's pylon top
  'turret-heavy-bolt': 2, // a wall turret's pylon top
  'tower-orb': 4, // a tower's gem
};

/** Half the width of an arc shot's oval shadow, in world units. */
// TUNE: no reference value
export const PROJECTILE_ARC_SHADOW_RADIUS_X = 0.7;

/** Half the height of an arc shot's oval shadow, in world units (flatter than it is wide). */
// TUNE: no reference value
export const PROJECTILE_ARC_SHADOW_RADIUS_Y = 0.35;

/** How solid an arc shot's shadow is at launch, 0 to 1. */
// TUNE: no reference value
export const PROJECTILE_ARC_SHADOW_OPACITY_START = 0.08;

/** How solid an arc shot's shadow is at its mark, 0 to 1. */
// TUNE: no reference value
export const PROJECTILE_ARC_SHADOW_OPACITY_END = 0.5;

/** Corners of the polygon that draws an oval shadow. */
export const PROJECTILE_ARC_SHADOW_SEGMENTS = 20;

/** Corners of the polygon that draws a burst circle. */
export const PROJECTILE_BURST_SEGMENTS = 32;

/** How solid a burst circle is as it starts, 0 to 1; it fades to 0 as it is gone. */
// TUNE: no reference value
export const PROJECTILE_BURST_OPACITY = 0.5;

/** The body of an orb, in world units. */
// ponytail: team-coloured circle until the owner's orb sprites (DEC-302)
export const PROJECTILE_ORB_BODY_SIZE = 1;
