import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Blinded. TUNE: more-abilities.md section 7 (1.5 s from balancing.md Nova). DEC-42: blind makes aim
 * wobble, so attacks usually (not always) miss; it has no hard miss. The wobble (seeded RNG) and the
 * client's white vignette are follow-ups; the −70% vision waits for a vision system.
 */
export const BLIND = {
  id: 'blind',
  displayName: 'Blinded',
  durationSeconds: 1.5,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: [],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
