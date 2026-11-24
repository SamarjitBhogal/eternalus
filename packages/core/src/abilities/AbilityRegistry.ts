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
import type { AreaShape, StepList } from './shapes/AreaShape.types';
import type { CastTargeting, TargetingSpec } from './targeting/CastTargeting.types';

/** An ability's own effects: a cast's steps, not an `onHit` list. */
const CAST_STEPS: StepList = { isOnHit: false };

/**
 * The single place abilities are composed (architecture 05 §14): effect, restriction, shape and
 * targeting strategies are registered by kind (`defaultAbilityRegistry.ts` names every class), and
 * `resolve` binds an ability's steps, restrictions and targeting to them once, cached as a
 * Flyweight.
 *
 * Composing an ability also checks it: every effect, shape, restriction and targeting kind it names
 * needs a strategy, and each step and shape must pass its strategy's `validate`. `resolveAll` at boot
 * reports every problem of every ability at once, so content fails loudly before a match starts.
 * Only an ability with no effects at all (`effects: []`, in a kit but not built yet) composes as
 * unavailable (`unavailable` at cast).
 */
export class AbilityRegistry {
  private readonly effects = new Map<string, AbilityEffect>();

  private readonly restrictionRules = new Map<string, AbilityRestriction>();

  private readonly shapes = new Map<string, AreaShape>();

  private readonly targetings = new Map<string, CastTargeting>();

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
   * Registers the strategy for one targeting kind.
   *
   * @throws Error when the kind already has one.
   */
  public registerTargeting(targeting: CastTargeting): void {
    AbilityRegistry.add(this.targetings, targeting, 'targeting');
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
   * @throws ContentValidationError when it names an effect, shape, restriction or targeting kind
   *   with no strategy, or a step or shape fails its strategy's `validate`.
   */
  public resolve(abilityId: string): Ability {
    const cached = this.resolved.get(abilityId);
    if (cached !== undefined) {
      return cached;
    }
    const definition = this.definitions.get(abilityId);
    AbilityRegistry.throwIfAny(this.problemsOf(definition));
    return this.compose(definition);
  }

  /**
   * Checks and composes every ability once, at boot: a missing strategy or a step a strategy
   * refuses fails here, never mid-match. Each ability is checked once, here, not again on compose.
   *
   * @throws ContentValidationError listing every problem of every ability.
   */
  public resolveAll(): void {
    const definitions = this.definitions.all();
    AbilityRegistry.throwIfAny(definitions.flatMap((definition) => this.problemsOf(definition)));
    for (const definition of definitions) {
      if (!this.resolved.has(definition.id)) {
        this.compose(definition);
      }
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
   * Whether a cast of an ability with `targeting` reads the player's aim (`AbilityDisplay.usesAim`,
   * 05 §15): its strategy's `usesAim`. An ability with no targeting (not built yet) counts as
   * aimed, so the client treats it as any other until it has effects.
   *
   * @throws Error when `targeting` names a kind with no strategy.
   */
  public usesAim(targeting: TargetingSpec | null): boolean {
    return (
      targeting === null ||
      AbilityRegistry.required(this.targetings, targeting.kind, 'targeting').usesAim
    );
  }

  /** Composes `definition`, already checked, and caches it. */
  private compose(definition: ComposableAbility): Ability {
    const { targeting } = definition;
    const ability = new ComposedAbility(
      definition,
      definition.effects.map((spec) => ({
        effect: this.effectFor(spec.kind),
        spec,
        delayTicks: spec.delayTicks ?? 0,
      })),
      definition.restrictions.map((spec): BoundRestriction => ({
        rule: AbilityRegistry.required(this.restrictionRules, spec.kind, 'restriction'),
        spec,
      })),
      targeting === null
        ? null
        : {
            strategy: AbilityRegistry.required(this.targetings, targeting.kind, 'targeting'),
            spec: targeting,
          },
      definition.effects.length > 0,
    );
    this.resolved.set(definition.id, ability);
    return ability;
  }

  /**
   * Everything wrong with `steps` of `owner` (as `Status "fury" onHit`), every step nested in them
   * included: kinds with no strategy, then each step's and each shape's own `validate` problems,
   * each shape checked with the list that holds its step (HC-B26 (5)). The check composing an
   * ability runs on its effects (not an `onHit` list); `checkStatusLinks` runs it at boot on each
   * status's `onHit` steps.
   *
   * @param list - The list `steps` form: `{ isOnHit: true }` for a status's `onHit`.
   */
  public checkSteps(owner: string, steps: readonly EffectStep[], list: StepList): string[] {
    return this.problemsIn(owner, steps, list, []);
  }

  /**
   * Everything wrong with `definition`: its steps' problems, its restrictions with no rule and its
   * targeting with no strategy.
   */
  private problemsOf(definition: ComposableAbility): string[] {
    const { targeting } = definition;
    const missingRules = definition.restrictions
      .filter(({ kind }) => !this.restrictionRules.has(kind))
      .map(({ kind }) => `restriction "${kind}"`);
    const missingTargeting =
      targeting === null || this.targetings.has(targeting.kind)
        ? []
        : [`targeting "${targeting.kind}"`];
    return this.problemsIn(`Ability "${definition.id}"`, definition.effects, CAST_STEPS, [
      ...missingRules,
      ...missingTargeting,
    ]);
  }

  /**
   * The problems of `owner`'s `steps` (see `checkSteps`), with `missingElsewhere` (kinds of
   * another sort with no strategy) named among the missing.
   */
  private problemsIn(
    owner: string,
    ownSteps: readonly EffectStep[],
    list: StepList,
    missingElsewhere: readonly string[],
  ): string[] {
    const steps = flattenSteps(ownSteps, list).map((placed) => ({
      ...placed,
      shape: shapeOf(placed.step),
    }));
    const missing = [
      ...steps.flatMap(({ step, shape }) => [
        ...(this.effects.has(step.kind) ? [] : [`effect "${step.kind}"`]),
        ...(shape === undefined || this.shapes.has(shape.kind) ? [] : [`shape "${shape.kind}"`]),
      ]),
      ...missingElsewhere,
    ];
    const invalid = steps.flatMap(({ step, list: holder, shape }) => [
      ...(this.effects.get(step.kind)?.validate(step) ?? []),
      ...(shape === undefined ? [] : (this.shapes.get(shape.kind)?.validate(shape, holder) ?? [])),
    ]);
    return [
      ...(missing.length > 0
        ? [
            `${owner} names ${missing.join(', ')} with no registered strategy (defaultAbilityRegistry.ts).`,
          ]
        : []),
      ...invalid.map((problem) => `${owner}: ${problem}.`),
    ];
  }

  /** @throws ContentValidationError listing `problems`, when there are any. */
  private static throwIfAny(problems: readonly string[]): void {
    if (problems.length > 0) {
      throw new ContentValidationError(problems.join('\n'));
    }
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
