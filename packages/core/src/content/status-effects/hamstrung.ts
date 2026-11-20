import type { AuthoredStatusEffect } from './statusEffects.types';
import { STARTER_TUNING } from '../abilities/starterTuning';

/** TUNE: balancing.md starter abilities; Hamstring gaps approved 2026-11-17. */
export const HAMSTRUNG = {
  id: 'hamstrung',
  displayName: 'Hamstrung',
  polarity: 'debuff',
  controlClass: 'none',
  durationSeconds: STARTER_TUNING.hamstringSlowSeconds,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [{ stat: 'moveSpeed', op: 'mul', value: STARTER_TUNING.hamstringSlowMultiplier }],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
