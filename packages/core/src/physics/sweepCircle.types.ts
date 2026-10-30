import type { Vec2 } from '../utils/geometry.types';

/** First contact along a displacement; the normal points away from the solid. */
export type SweepContact = { readonly time: number; readonly normal: Vec2 };
