import { normalize } from '../utils/vec2';
import type { CastContext, EffectStep } from './AbilityEffect.types';
import type { CastStep } from './AbilityRegistry.types';
import type { CastFacts, CastServices } from './CastInstance.types';
import type { ShapePlacement } from './shapes/AreaShape.types';

/**
 * One cast in progress (architecture 05 §4): the caster, the aim and the bound steps. `run` fires
 * the steps that are due, in list order, through their strategies: a step is due `delayTicks`
 * after the cast tick, so a step with no delay fires at the cast. `AbilitySystem` keeps a cast with
 * steps left on the caster (`CastInProgress`) and, on each tick a step is due, builds it again and
 * runs it from the first step left. A status's `onHit` steps run as a cast too (`HitEffects`),
 * placed from the attacker to the struck body; they never wait.
 */
export class CastInstance {
  /** @param facts - The cast. @param services - What its effects work with. */
  public constructor(
    private readonly facts: CastFacts,
    private readonly services: CastServices,
  ) {}

  /**
   * Whether `step` of a cast made on `castTick` is due by `now`: `delayTicks` after the cast tick.
   * The one due rule; `AbilitySystem` asks it before it builds a `CastInstance`.
   */
  public static isDue(castTick: number, step: Pick<CastStep, 'delayTicks'>, now: number): boolean {
    return castTick + step.delayTicks <= now;
  }

  /**
   * Fires the steps from `from` on that are due by `state.tick`, in list order, and stops at the
   * first one that is not: the steps' delays never decrease along the list (`loadAbilities`).
   *
   * @param placement - Where the steps' shapes sit. `AbilitySystem` places each step on the caster
   *   where it is on the tick the step fires (05 §18); `HitEffects` places the steps from the
   *   attacker to the struck body.
   * @param from - The index of the first step not fired yet (0 at the cast).
   * @returns The index of the first step still waiting; the step count once every step fired.
   */
  public run(placement: ShapePlacement, from = 0): number {
    const { ability, tick } = this.facts;
    const { steps } = ability;
    const now = this.services.state.tick;
    let next = from;
    const context = this.contextAt(placement);
    for (let step = steps[next]; step !== undefined && CastInstance.isDue(tick, step, now);) {
      step.effect.apply(step.spec, context);
      next += 1;
      step = steps[next];
    }
    return next;
  }

  private contextAt(placement: ShapePlacement): CastContext {
    const { casterId, ability, slot, aim, origin, casterLevel, tick } = this.facts;
    const { state, effects, targets, damage, statuses, launcher } = this.services;
    const toAim = { x: aim.point.x - origin.x, y: aim.point.y - origin.y };
    const { scaling } = ability.definition;
    return {
      casterId,
      abilityId: ability.id,
      slot,
      tick,
      state,
      aim,
      direction: toAim.x === 0 && toAim.y === 0 ? { x: 0, y: 0 } : normalize(toAim),
      placement,
      scaled: (field, value) => value * (1 + (scaling[field]?.perLevel ?? 0) * (casterLevel - 1)),
      casterLevel,
      scaling,
      damage,
      statuses,
      launcher,
      targets: (shape, filter) => targets.find(state, casterId, shape, placement, filter),
      centreFor: (shape, point) => effects.shapeFor(shape.kind).centreFor(shape, placement, point),
      run: (step: EffectStep, at: ShapePlacement) => {
        effects.effectFor(step.kind).apply(step, this.contextAt(at));
      },
    };
  }
}
