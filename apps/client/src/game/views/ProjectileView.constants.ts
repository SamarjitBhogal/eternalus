/** Size of a projectile's team-coloured dot, in world units. */
// TUNE: placeholder look for ranged attacks (PR 1); close is enough
export const PROJECTILE_DOT_SIZE = 0.5;

/** Size of the bright core on a projectile's dot, in world units. */
export const PROJECTILE_CORE_SIZE = 0.25;

/** Colour of a projectile's bright core. */
export const PROJECTILE_CORE_COLOR = '#ffffff';

/** Length of the streak behind a projectile, in world units. */
export const PROJECTILE_STREAK_LENGTH = 1.5;

/** Width of the streak behind a projectile, in screen pixels. */
export const PROJECTILE_STREAK_WIDTH = 2;

/** How a shot looks when it ends: `'fizzle'` thins into a mist, `'drop'` falls to the ground. */
export type ProjectileEndingLook = 'fizzle' | 'drop';

/**
 * The ending look of each projectile definition id (DEC-306). A new projectile is one entry here;
 * an id not listed fizzles.
 */
// TUNE: placeholder looks (DEC-306): the bolt fizzles into a mist, the arrow drops
export const PROJECTILE_ENDING_LOOKS: Readonly<Record<string, ProjectileEndingLook>> = {
  'magus-bolt': 'fizzle',
  arrow: 'drop',
};

/** The ending look of a projectile id with no entry in `PROJECTILE_ENDING_LOOKS`. */
export const DEFAULT_PROJECTILE_ENDING_LOOK: ProjectileEndingLook = 'fizzle';

/** Colour of the shadow under a dropping shot. */
export const PROJECTILE_SHADOW_COLOR = '#000000';

/** How solid the shadow is, 0 to 1. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_SHADOW_OPACITY = 0.35;

/** Size of the shadow dot, in world units. */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_SHADOW_SIZE = 0.4;

/**
 * How far below the shot (screen down, world +y) the shadow is at full speed, in world units. The
 * offset shrinks with the shot's speed, so the shadow meets it as it stops.
 */
// TUNE: placeholder look (DEC-306)
export const PROJECTILE_SHADOW_HEIGHT = 1.2;

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
