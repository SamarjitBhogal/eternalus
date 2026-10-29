import type { LockedClassDefinition } from './lockedClasses.types';

/**
 * The post-MVP flying class, content id `harbinger`, displayed as Harbinger and shown as the locked fourth card (DEC-48).
 * The id replaces the earlier `flying` (owner ruling F2, ADR 0018 point 5).
 */
export const HARBINGER = {
  id: 'harbinger',
  displayName: 'Harbinger', // DEC-48
  roleBlurb: 'Air-based; moves primarily in the air, like a jet or helicopter.', // reference 01, Flying row
  roleLabel: 'aerial', // Figma 72:861, lower case
} as const satisfies LockedClassDefinition;
