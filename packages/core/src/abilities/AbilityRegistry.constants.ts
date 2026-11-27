import type { StepList } from './shapes/AreaShape.types';

/** An ability's own effects: a cast's steps, not an `onHit` list. */
export const CAST_STEPS: StepList = { isOnHit: false };
