import type { LockedClassDefinition } from './lockedClasses.types';

/**
 * The post-MVP flying class, displayed as Harbinger and shown as the locked fourth card (DEC-48).
 * Content id `flying` as architecture 04 §2 and 17 R1 reserve it (INBOX HC-F2).
 */
export const FLYING = {
  id: 'flying',
  displayName: 'Harbinger', // DEC-48
  roleBlurb: 'Air-based; moves primarily in the air, like a jet or helicopter.', // reference 01, Flying row
  roleLabel: 'aerial', // Figma 72:861, lower case
} as const satisfies LockedClassDefinition;
