import type { LockedClassDefinition } from './lockedClasses.types';

/**
 * The post-MVP flying class (content id `harbinger`), shown as the locked fourth card (DEC-48,
 * DEC-59).
 */
export const HARBINGER = {
  id: 'harbinger',
  displayName: 'Harbinger', // DEC-48
  roleBlurb: 'Air-based; moves primarily in the air, like a jet or helicopter.', // reference 01, Flying row
  roleLabel: 'aerial', // Figma 72:861, lower case
} as const satisfies LockedClassDefinition;
