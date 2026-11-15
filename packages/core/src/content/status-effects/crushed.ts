import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Crushed: held by Grab, stunned and losing 3% of max health per second. TUNE: more-abilities.md
 * section 7 (max 3 s). Grab ends it early once it exists; the `slowed` on release waits for the
 * `slowed` status (`independent` stacking). Hard control, so `control-immune` blocks it and
 * follows it (DEC-99 (a), more-abilities.md section 7).
 */
export const CRUSHED = {
  id: 'crushed',
  displayName: 'Crushed',
  polarity: 'debuff',
  controlClass: 'hard',
  durationSeconds: 3,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack', 'cannot-cast'],
  periodic: { everySeconds: 1, effects: [{ kind: 'damage', fractionOfMax: 0.03 }] },
  onExpire: [{ kind: 'apply-status', statusId: 'control-immune' }],
} as const satisfies AuthoredStatusEffect;
