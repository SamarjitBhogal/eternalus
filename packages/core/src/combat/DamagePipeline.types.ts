/** What one `DamagePipeline.apply` call did. */
export type DamageResult =
  | {
      readonly applied: false;
      /** `blocked`: a damage step took the hit to 0; `zero-damage`: it was 0 to begin with. */
      readonly reason: 'no-target' | 'no-health' | 'already-dead' | 'blocked' | 'zero-damage';
    }
  | {
      readonly applied: true;
      /** Damage taken from base health. */
      readonly amount: number;
      /** Damage absorbed by shield bars. */
      readonly absorbed: number;
      /** Whether this hit took the target's health to 0. */
      readonly killed: boolean;
    };
