import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Feared (DEC-203, DEC-382 (R3 D)): for 2 to 4 s the holder either runs straight away from the
 * fear's source at half speed or cowers in place, and it cannot attack or cast (Rip & Tear puts it
 * on every survivor, DEC-206 (2)). Each application draws its form and its time from the match's
 * seeded RNG (`StatusEffectApplier.apply`). Its steer overrides every command, controller and
 * pathing steer, a player's own Legend's too (DEC-382 (R3 D), card "PR6 R3 fear"). Sentinels never
 * get it (DEC-207, `statusImmunities` in `content/legends/sentinel.ts`).
 */
export const FEARED = {
  id: 'feared',
  displayName: 'Feared',
  polarity: 'debuff',
  controlClass: 'soft', // TUNE: build reading, not on card PR6 R3 (whether control-immune covers it is open, more-abilities.md §7)
  durationSeconds: 2, // TUNE: DEC-382 (R3 D): 2 to 4 s (DEC-203)
  maxDurationSeconds: 4, // TUNE: DEC-382 (R3 D): 2 to 4 s (DEC-203)
  stacking: 'refresh', // TUNE: DEC-382 (R3 D) (card PR6 R3: Fear never adds up)
  maxStacks: 1,
  modifiers: [{ stat: 'moveSpeed', op: 'mul', value: 0.5 }], // DEC-203: runs away at 50% speed
  flags: ['cannot-attack', 'cannot-cast'], // TUNE: DEC-382 (R3 D); a cowering unit keeps both
  periodic: null,
  onExpire: [],
  steering: ['flee-source', 'cower'], // TUNE: DEC-382 (R3 D): random run or cower (DEC-203)
} as const satisfies AuthoredStatusEffect;
