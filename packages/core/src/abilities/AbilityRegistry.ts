import { ContentValidationError } from '../content/ContentValidationError';
import type { AbilityEffect, EffectStep } from './AbilityEffect.types';
import type { AbilityRestriction } from './AbilityRestriction.types';
import type { Ability, AbilitySource, BoundRestriction } from './AbilityRegistry.types';
import { ComposedAbility } from './ComposedAbility';
import type { AreaShape, ShapeSpec } from './shapes/AreaShape.types';

/** Whether `value` is an object with a string `kind` (a step or a shape). */
const isKinded = (value: unknown): value is EffectStep =>
  typeof value === 'object' && value !== null && 'kind' in value && typeof value.kind === 'string';

/** The steps nested in `step` (a dash's `onPath` and `onEnd`): every list field of kinded items. */
const childStepsOf = (step: EffectStep): EffectStep[] =>
  Object.values(step).flatMap((value: unknown) =>
    Array.isArray(value) ? value.filter(isKinded) : [],
  );

/** `steps` and every step nested in them, depth first. */
const flatten = (steps: readonly EffectStep[]): EffectStep[] =>
  steps.flatMap((step) => [step, ...flatten(childStepsOf(step))]);

/** The step's area, when it has one. */
const shapeOf = (step: EffectStep): ShapeSpec | undefined =>
  'shape' in step && isKinded(step.shape) ? step.shape : undefined;

/**
 * The single place abilities are composed (architecture 05 §14): effect, restriction and shape
 * strategies are registered by kind (`defaultAbilityRegistry.ts` names every class), and
 * `resolve` binds an ability's steps and restrictions to them once, cached as a Flyweight.
 *
 * An effect, shape or restriction kind with no strategy throws at `resolve`, so `resolveAll` at
 * boot fails loudly on it. Only an ability with no effects at all (`effects: []`, in a kit but not
 * built yet) composes as unavailable (`unavailable` at cast).
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
    this.add(this.effects, effect, 'effect');
  }

  /**
   * Registers the rule for one restriction kind.
   *
   * @throws Error when the kind already has one.
   */
  public registerRestriction(restriction: AbilityRestriction): void {
    this.add(this.restrictionRules, restriction, 'restriction');
  }

  /**
   * Registers the hit test for one shape kind.
   *
   * @throws Error when the kind already has one.
   */
  public registerShape(shape: AreaShape): void {
    this.add(this.shapes, shape, 'shape');
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
   * The composed ability `abilityId`, built once and cached (05 §14).
   *
   * @throws UnknownDefinitionError when no ability has the id.
   * @throws ContentValidationError when it names an effect, shape or restriction kind with no
   *   strategy.
   */
  public resolve(abilityId: string): Ability {
    const cached = this.resolved.get(abilityId);
    if (cached !== undefined) {
      return cached;
    }
    const definition = this.definitions.get(abilityId);
    const steps = flatten(definition.effects);
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
    if (missing.length > 0) {
      throw new ContentValidationError(
        `Ability "${abilityId}" names ${missing.join(', ')} with no registered strategy (defaultAbilityRegistry.ts).`,
      );
    }
    const isAvailable = definition.effects.length > 0;
    const ability = new ComposedAbility(
      definition,
      definition.effects.map((spec) => ({ effect: this.effectFor(spec.kind), spec })),
      definition.restrictions.map((spec): BoundRestriction => ({
        rule: AbilityRegistry.required(this.restrictionRules, spec.kind, 'restriction'),
        spec,
      })),
      isAvailable,
    );
    this.resolved.set(abilityId, ability);
    return ability;
  }

  /**
   * Resolves every ability once, so a missing effect, shape or restriction strategy fails at boot.
   *
   * @throws ContentValidationError as `resolve` does.
   */
  public resolveAll(): void {
    for (const { id } of this.definitions.all()) {
      this.resolve(id);
    }
  }

  private add<T extends { readonly kind: string }>(
    into: Map<string, T>,
    strategy: T,
    what: string,
  ): void {
    if (into.has(strategy.kind)) {
      throw new Error(`The ${what} kind "${strategy.kind}" is already registered.`);
    }
    into.set(strategy.kind, strategy);
    // A registration can bind a new strategy into a cached ability: compose again.
    this.resolved.clear();
  }

  private static required<T>(from: ReadonlyMap<string, T>, kind: string, what: string): T {
    const strategy = from.get(kind);
    if (strategy === undefined) {
      throw new Error(`No ${what} strategy is registered for kind "${kind}".`);
    }
    return strategy;
  }
}
