import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Sundered: the Obsidian Bow's debuff (reference 07 "Reduces protections (stacks)"). Each stack
 * makes the target take more damage. The bonus adds, it does not compound: 3 stacks are +15 %
 * (the `veteran` rule, DEC-164).
 *
 * TUNE: DEC-387 (W6): +5 % damage taken per stack, 4 s, 3 stacks.
 */
export const SUNDERED = {
  id: 'sundered',
  displayName: 'Sundered',
  polarity: 'debuff',
  controlClass: 'none',
  durationSeconds: 4, // TUNE: DEC-387 (W6)
  stacking: 'intensity',
  maxStacks: 3, // TUNE: DEC-387 (W6)
  modifiers: [{ stat: 'damageTaken', op: 'add', value: 0.05 }], // TUNE: DEC-387 (W6)
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
