import type { EntityDrawState } from './EntityView.types';

/**
 * How a shot looks when it ends: `'fizzle'` thins into a mist, `'drop'` falls to the ground,
 * `'lodge'` lies still on its mark (an arc bolt), `'burst'` is a circle that grows to the blast
 * radius and fades (an orb).
 */
export type ProjectileEndingLook = 'fizzle' | 'drop' | 'lodge' | 'burst';

/** How a flying shot's body looks: `'streak'` is a dot with a trailing streak, `'orb'` is a circle. */
export type ProjectileBodyLook = 'streak' | 'orb';

/** A point or direction in world units, as an entity's draw state holds it. */
export type Point = EntityDrawState['position'];
