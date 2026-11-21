import type { EntityDrawState } from './EntityView.types';

/** How a shot looks when it ends: `'fizzle'` thins into a mist, `'drop'` falls to the ground. */
export type ProjectileEndingLook = 'fizzle' | 'drop';

/** A point or direction in world units, as an entity's draw state holds it. */
export type Point = EntityDrawState['position'];
