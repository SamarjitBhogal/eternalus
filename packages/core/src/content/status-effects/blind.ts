import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Blinded: basic attacks miss. TUNE: more-abilities.md section 7 (1.5 s from balancing.md Nova).
 * The −70% vision waits for a vision system.
 */
export const BLIND = {
  id: 'blind',
  displayName: 'Blinded',
  durationSeconds: 1.5,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['attacks-miss'],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
