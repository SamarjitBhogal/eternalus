import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Veiled (the Vanguard's Veil, more-abilities.md §7): enemies cannot pick the holder as a target
 * and their screens do not draw it, the minimap too (DEC-266); its own side sees it faded. An area
 * still hits it. Dealing or taking any damage ends it (DEC-267); casting Fury does not. Recast
 * refreshes the 5 s. TUNE: balancing.md:180 (5 s).
 */
export const INVISIBLE = {
  id: 'invisible',
  displayName: 'Veiled',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 5, // TUNE: balancing.md:180
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['untargetable', 'hidden'],
  periodic: null,
  onExpire: [],
  endsOnDamage: true,
} as const satisfies AuthoredStatusEffect;
