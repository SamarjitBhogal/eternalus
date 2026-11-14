/** Data-driven spell effects for the authored Magus starter kit. */
export type AbilityEffectSpec =
  | { readonly kind: 'buff'; readonly statusId: string }
  | {
      readonly kind: 'pulse';
      readonly radius: number;
      readonly damage: number;
      readonly knockback: number;
      readonly statusId: string;
    }
  | {
      readonly kind: 'zone';
      readonly radius: number;
      readonly durationSeconds: number;
      readonly healFractionPerSecond: number;
    };

/** One authored spell; times become ticks at the simulation boundary. */
export type AbilityDefinition = {
  /** Explicit presentation-only slot, approved independently of unfinished gameplay. */
  readonly isPreview?: boolean;
  readonly id: string;
  readonly displayName: string;
  readonly slot: 'ability-1' | 'ability-2' | 'ability-3' | 'ability-4';
  readonly cooldownSeconds: number;
  readonly aetherCost: number;
  readonly effects: readonly AbilityEffectSpec[];
};
