import type { EntityDrawState } from './EntityView.types';

/**
 * How a shot looks when it ends: `'fizzle'` thins into a mist, `'drop'` falls to the ground,
 * `'lodge'` lies still on its mark (an arc bolt), `'burst'` is a circle that grows to the blast
 * radius and fades (an orb).
 */
export type ProjectileEndingLook = 'fizzle' | 'drop' | 'lodge' | 'burst';

/** A point or direction in world units, as an entity's draw state holds it. */
export type Point = EntityDrawState['position'];
