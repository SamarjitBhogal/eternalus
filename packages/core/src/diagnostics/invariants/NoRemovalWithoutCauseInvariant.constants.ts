import type { RemovalCause } from '../../state/EntityStore.types';

/** Every valid removal cause, checked at runtime because a cast can smuggle in any string. */
export const REMOVAL_CAUSES: readonly RemovalCause[] = [
  'died',
  'despawned',
  'consumed',
  'dev-removed',
  'match-ended',
];
