import type { AbilityDefinition } from '../content/abilities/abilities.types';
/** Cast requests waiting for the ability system, and presentation evidence of successful casts. */
export type SpellCast = {
  readonly slot: string;
  readonly point: { readonly x: number; readonly y: number };
};
/** A slot's actual gameplay readiness, projected once into snapshots. */
export type SpellSlot = {
  readonly slot: AbilityDefinition['slot'];
  readonly abilityId: string;
  readonly cooldownRemainingTicks: number;
  readonly cooldownTicks: number;
  readonly charge: number | null;
  readonly isReady: boolean;
  readonly lastCastTick: number | null;
  readonly blockedBy:
    'on-cooldown' | 'not-enough-aether' | 'not-charged' | 'cannot-cast' | 'dead' | null;
};
