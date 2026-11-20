import type { AbilityDefinition } from '../content/abilities/AbilityDefinition.types';
import type { AbilityEffect, EffectStep } from './AbilityEffect.types';
import type { AbilityRestriction, RestrictionSpec } from './AbilityRestriction.types';

/**
 * An ability definition as the registry composes it: the loaded `AbilityDefinition` with its steps
 * and restrictions read by kind only, so a test may compose an ability from a kind the shipped
 * union does not list (the Fake Bolt litmus, 05 §16).
 */
export type ComposableAbility = Omit<AbilityDefinition, 'effects' | 'restrictions'> & {
  readonly effects: readonly EffectStep[];
  readonly restrictions: readonly RestrictionSpec[];
};

/** Where the registry finds an ability by id; a `ContentCatalogue<AbilityDefinition>` satisfies it. */
export interface AbilitySource {
  /** Every ability, in catalogue order. */
  all(): readonly ComposableAbility[];
  /**
   * The ability with the id `id`.
   *
   * @throws UnknownDefinitionError when none has it.
   */
  get(id: string): ComposableAbility;
}

/** One step of a cast bound to its strategy (05 §14 `CastStep`). Every step fires at cast. */
export type CastStep = { readonly effect: AbilityEffect; readonly spec: EffectStep };

/** One restriction bound to its rule. */
export type BoundRestriction = {
  readonly rule: AbilityRestriction;
  readonly spec: RestrictionSpec;
};

/**
 * A castable composition of one ability (05 §14): its definition with each effect step and
 * restriction bound to its strategy. `ComposedAbility` is the only implementation; the interface
 * leaves room for an ability that cannot be composed (an ADR-recorded exception).
 */
export interface Ability {
  readonly id: string;
  readonly definition: ComposableAbility;
  /** The cast timeline in order; empty when the ability is not available (no effects). */
  readonly steps: readonly CastStep[];
  readonly restrictions: readonly BoundRestriction[];
  /**
   * Whether it can be cast at all: it has effects (`effects: []` marks an ability in a kit that is
   * not built yet). A missing strategy never makes it unavailable: `resolve` throws instead.
   */
  readonly isAvailable: boolean;
}
