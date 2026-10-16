import type { DamageSource } from '../state/GameEvents.types';

export type { DamageSource };

/** What one `DamagePipeline.apply` call did. */
export type DamageResult =
  | { readonly applied: false; readonly reason: 'no-target' | 'no-health' | 'already-dead' }
  | {
      readonly applied: true;
      /** Damage taken from base health. */
      readonly amount: number;
      /** Damage absorbed by shield bars. */
      readonly absorbed: number;
      /** Whether this hit took the target's health to 0. */
      readonly killed: boolean;
    };
