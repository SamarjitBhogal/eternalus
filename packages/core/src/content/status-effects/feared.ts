import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Feared (DEC-203): the holder runs straight away from the fear's source at half speed and cannot
 * attack or cast (Rip & Tear puts it on every survivor, DEC-206 (2)). Its flight overrides every
 * command, controller and pathing steer, a player's own Legend's too (reading R3, owner card "PR6
 * R3 fear"). DEC-203's other form, cowering in place, would be a status with `cannot-move` and no
 * steering. Sentinels never get it (DEC-207, `statusImmunities` in `content/legends/sentinel.ts`).
 */
export const FEARED = {
  id: 'feared',
  displayName: 'Feared',
  polarity: 'debuff',
  controlClass: 'soft', // TUNE: reading, owner card PR6 R3 fear (whether control-immune covers it is open, more-abilities.md §7)
  durationSeconds: 2, // TUNE: reading, owner card PR6 R3 fear (DEC-203: 2 to 4 s)
  stacking: 'refresh', // TUNE: reading, owner card PR6 R3 fear (more-abilities.md §7: TBD)
  maxStacks: 1,
  modifiers: [{ stat: 'moveSpeed', op: 'mul', value: 0.5 }], // DEC-203: runs away at 50% speed
  flags: ['cannot-attack', 'cannot-cast'], // TUNE: reading, owner card PR6 R3 fear
  periodic: null,
  onExpire: [],
  steering: 'flee-source', // DEC-203: runs away; reading R3: straight away from the source
} as const satisfies AuthoredStatusEffect;
