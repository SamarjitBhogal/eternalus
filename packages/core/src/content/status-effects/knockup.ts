import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Airborne after a knock-up: cannot move, attack or cast. TUNE: 0.8 s is balancing.md Slam;
 * more-abilities.md section 7 (`knockup`: "cannot act, move"). The id is `knockup` (the table's id),
 * the player sees "Airborne". Reapplying refreshes the timer (the table says "independent"; no
 * such stacking mode exists yet).
 */
export const KNOCKUP = {
  id: 'knockup',
  displayName: 'Airborne',
  durationSeconds: 0.8,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack', 'cannot-cast'],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
