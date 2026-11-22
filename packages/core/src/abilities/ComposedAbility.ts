import type {
  Ability,
  BoundRestriction,
  BoundTargeting,
  CastStep,
  ComposableAbility,
} from './AbilityRegistry.types';

/**
 * The one MVP implementation of `Ability` (05 §14): a definition composed from effect and
 * restriction strategies and its targeting strategy. Built and cached only by `AbilityRegistry.resolve`.
 */
export class ComposedAbility implements Ability {
  /**
   * @param definition - The loaded ability.
   * @param steps - Its effect steps bound to their strategies, in cast order; empty when not available.
   * @param restrictions - Its restrictions bound to their rules, in content order.
   * @param targeting - Its targeting bound to its strategy; `null` when it has none.
   * @param isAvailable - Whether it can be cast at all (`Ability.isAvailable`).
   */
  public constructor(
    public readonly definition: ComposableAbility,
    public readonly steps: readonly CastStep[],
    public readonly restrictions: readonly BoundRestriction[],
    public readonly targeting: BoundTargeting | null,
    public readonly isAvailable: boolean,
  ) {}

  /** The ability's content id. */
  public get id(): string {
    return this.definition.id;
  }
}
