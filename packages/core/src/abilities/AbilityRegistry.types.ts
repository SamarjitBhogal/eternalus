import type { AbilityDefinition } from '../content/abilities/AbilityDefinition.types';
import type { AbilityEffect, EffectStep } from './AbilityEffect.types';
import type { AbilityRestriction, RestrictionSpec } from './AbilityRestriction.types';
import type { CastTargeting, TargetingSpec } from './targeting/CastTargeting.types';

/**
 * An ability definition as the registry composes it: the loaded `AbilityDefinition` with its steps,
 * restrictions and targeting read by kind only, so a test may compose an ability from a kind the
 * shipped union does not list (the Fake Bolt litmus, 05 §16).
 */
export type ComposableAbility = Omit<
  AbilityDefinition,
  'effects' | 'restrictions' | 'targeting'
> & {
  readonly effects: readonly TimelineStep[];
  readonly restrictions: readonly RestrictionSpec[];
  readonly targeting: TargetingSpec | null;
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

/**
 * A step of an ability's cast timeline as loaded (05 §3, §4): any effect step, waiting
 * `delayTicks` after the cast (absent = at the cast).
 */
type TimelineStep = EffectStep & { readonly delayTicks?: number };

/**
 * One step of a cast bound to its strategy (05 §14 `CastStep`): it fires `delayTicks` after the
 * cast (0 = at the cast).
 */
export type CastStep = {
  readonly effect: AbilityEffect;
  readonly spec: EffectStep;
  readonly delayTicks: number;
};

/** One restriction bound to its rule. */
export type BoundRestriction = {
  readonly rule: AbilityRestriction;
  readonly spec: RestrictionSpec;
};

/** An ability's targeting bound to its strategy. */
export type BoundTargeting = {
  readonly strategy: CastTargeting;
  readonly spec: TargetingSpec;
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
   * How a cast aims, bound to its strategy; `null` for an ability with no targeting (only one with
   * no effects has none, `loadAbilities`): its cast runs with the aim as sent, with no aim check.
   */
  readonly targeting: BoundTargeting | null;
  /**
   * Whether it can be cast at all: it has effects (`effects: []` marks an ability in a kit that is
   * not built yet). A missing strategy never makes it unavailable: `resolve` throws instead.
   */
  readonly isAvailable: boolean;
}
