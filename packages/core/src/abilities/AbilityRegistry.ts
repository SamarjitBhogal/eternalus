import type { AbilityDisplayStep } from '../content/loadDisplayContent';
import { ContentValidationError } from '../content/ContentValidationError';
import type { AbilityEffect, EffectStep } from './AbilityEffect.types';
import type { AbilityRestriction } from './AbilityRestriction.types';
import type {
  Ability,
  AbilitySource,
  BoundRestriction,
  ComposableAbility,
} from './AbilityRegistry.types';
import { ComposedAbility } from './ComposedAbility';
import { flattenSteps, shapeOf } from './effectSteps';
import type { AreaShape } from './shapes/AreaShape.types';

/**
 * The single place abilities are composed (architecture 05 §14): effect, restriction and shape
 * strategies are registered by kind (`defaultAbilityRegistry.ts` names every class), and
 * `resolve` binds an ability's steps and restrictions to them once, cached as a Flyweight.
 *
 * Composing an ability also checks it: every effect, shape and restriction kind it names needs a
 * strategy, and each step and shape must pass its strategy's `validate`. `resolveAll` at boot
 * reports every problem of every ability at once, so content fails loudly before a match starts.
 * Only an ability with no effects at all (`effects: []`, in a kit but not built yet) composes as
 * unavailable (`unavailable` at cast).
 */
export class AbilityRegistry {
  private readonly effects = new Map<string, AbilityEffect>();

  private readonly restrictionRules = new Map<string, AbilityRestriction>();

  private readonly shapes = new Map<string, AreaShape>();

  private readonly resolved = new Map<string, Ability>();

  /** @param definitions - The loaded abilities (`loadAbilities`). */
  public constructor(public readonly definitions: AbilitySource) {}

  /**
   * Registers the strategy for one effect kind.
   *
   * @throws Error when the kind already has one.
   */
  public registerEffect(effect: AbilityEffect): void {
    AbilityRegistry.add(this.effects, effect, 'effect');
  }

  /**
   * Registers the rule for one restriction kind.
   *
   * @throws Error when the kind already has one.
   */
  public registerRestriction(restriction: AbilityRestriction): void {
    AbilityRegistry.add(this.restrictionRules, restriction, 'restriction');
  }

  /**
   * Registers the hit test for one shape kind.
   *
   * @throws Error when the kind already has one.
   */
  public registerShape(shape: AreaShape): void {
    AbilityRegistry.add(this.shapes, shape, 'shape');
  }

  /**
   * The strategy of effect kind `kind` (a dash runs its nested steps through it).
   *
   * @throws Error when none is registered.
   */
  public effectFor(kind: string): AbilityEffect {
    return AbilityRegistry.required(this.effects, kind, 'effect');
  }

  /**
   * The hit test of shape kind `kind`.
   *
   * @throws Error when none is registered.
   */
  public shapeFor(kind: string): AreaShape {
    return AbilityRegistry.required(this.shapes, kind, 'shape');
  }

  /**
   * The composed ability `abilityId`, built and checked once and cached (05 §14).
   *
   * @throws UnknownDefinitionError when no ability has the id.
   * @throws ContentValidationError when it names an effect, shape or restriction kind with no
   *   strategy, or a step or shape fails its strategy's `validate`.
   */
  public resolve(abilityId: string): Ability {
    const cached = this.resolved.get(abilityId);
    if (cached !== undefined) {
      return cached;
    }
    const definition = this.definitions.get(abilityId);
    const problems = this.problemsOf(definition);
    if (problems.length > 0) {
      throw new ContentValidationError(problems.join('\n'));
    }
    const ability = new ComposedAbility(
      definition,
      definition.effects.map((spec) => ({ effect: this.effectFor(spec.kind), spec })),
      definition.restrictions.map((spec): BoundRestriction => ({
        rule: AbilityRegistry.required(this.restrictionRules, spec.kind, 'restriction'),
        spec,
      })),
      definition.effects.length > 0,
    );
    this.resolved.set(abilityId, ability);
    return ability;
  }

  /**
   * Checks and composes every ability once, at boot: a missing strategy or a step a strategy
   * refuses fails here, never mid-match.
   *
   * @throws ContentValidationError listing every problem of every ability.
   */
  public resolveAll(): void {
    const definitions = this.definitions.all();
    const problems = definitions.flatMap((definition) => this.problemsOf(definition));
    if (problems.length > 0) {
      throw new ContentValidationError(problems.join('\n'));
    }
    for (const { id } of definitions) {
      this.resolve(id);
    }
  }

  /**
   * The rows the aim overlay draws for `steps` (`AbilityDisplay.steps`, 05 §15), in cast order:
   * each step's strategy describes it, and a step that runs nested steps describes them through
   * this registry. What `loadDisplayContent` publishes; no loader knows an effect kind.
   *
   * @throws Error when a step's effect kind has no strategy.
   */
  public describe(steps: readonly EffectStep[]): readonly AbilityDisplayStep[] {
    return steps.flatMap((step) =>
      this.effectFor(step.kind).describe(step, (nested) => this.describe([nested])),
    );
  }

  /**
   * Everything wrong with `definition`: kinds with no strategy, then each step's and each shape's
   * own `validate` problems, every step nested in another included.
   */
  private problemsOf(definition: ComposableAbility): string[] {
    const steps = flattenSteps(definition.effects);
    const missing = [
      ...steps.flatMap((step) => {
        const shape = shapeOf(step);
        return [
          ...(this.effects.has(step.kind) ? [] : [`effect "${step.kind}"`]),
          ...(shape === undefined || this.shapes.has(shape.kind) ? [] : [`shape "${shape.kind}"`]),
        ];
      }),
      ...definition.restrictions
        .filter(({ kind }) => !this.restrictionRules.has(kind))
        .map(({ kind }) => `restriction "${kind}"`),
    ];
    const invalid = steps.flatMap((step) => {
      const shape = shapeOf(step);
      return [
        ...(this.effects.get(step.kind)?.validate(step) ?? []),
        ...(shape === undefined ? [] : (this.shapes.get(shape.kind)?.validate(shape) ?? [])),
      ];
    });
    return [
      ...(missing.length > 0
        ? [
            `Ability "${definition.id}" names ${missing.join(', ')} with no registered strategy (defaultAbilityRegistry.ts).`,
          ]
        : []),
      ...invalid.map((problem) => `Ability "${definition.id}": ${problem}.`),
    ];
  }

  private static add<T extends { readonly kind: string }>(
    into: Map<string, T>,
    strategy: T,
    what: string,
  ): void {
    if (into.has(strategy.kind)) {
      throw new Error(`The ${what} kind "${strategy.kind}" is already registered.`);
    }
    // No cached ability needs composing again: a kind is registered once, so a registration only
    // adds a kind that no ability resolved so far names (each one resolved with all its kinds).
    into.set(strategy.kind, strategy);
  }

  private static required<T>(from: ReadonlyMap<string, T>, kind: string, what: string): T {
    const strategy = from.get(kind);
    if (strategy === undefined) {
      throw new Error(`No ${what} strategy is registered for kind "${kind}".`);
    }
    return strategy;
  }
}
