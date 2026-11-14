import { normalize } from '../utils/vec2';
import type { CastContext, EffectStep } from './AbilityEffect.types';
import type { CastFacts, CastServices } from './CastInstance.types';
import type { ShapePlacement } from './shapes/AreaShape.types';

/**
 * One cast in progress (architecture 05 §4): the caster, the aim and the bound steps. `run` fires
 * the steps in list order through their strategies. No shipped step has a delay or a channel yet,
 * so every step fires at cast and the instance is done after `run`; due ticks join with the first
 * delayed step (05 §4, Nova).
 */
export class CastInstance {
  /** @param facts - The cast. @param services - What its effects work with. */
  public constructor(
    private readonly facts: CastFacts,
    private readonly services: CastServices,
  ) {}

  /** Fires every step of the ability, in order, on the caster. */
  public run(): void {
    const { origin, ability } = this.facts;
    const context = this.contextAt({ from: origin, to: origin });
    for (const { effect, spec } of ability.steps) {
      effect.apply(spec, context);
    }
  }

  private contextAt(placement: ShapePlacement): CastContext {
    const { casterId, ability, slot, aim, origin, casterLevel, tick } = this.facts;
    const { state, effects, targets, damage, statuses } = this.services;
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
      damage,
      statuses,
      targets: (shape, filter) => targets.find(state, casterId, shape, placement, filter),
      centreFor: (shape, point) => effects.shapeFor(shape.kind).centreFor(shape, placement, point),
      run: (step: EffectStep, at: ShapePlacement) => {
        effects.effectFor(step.kind).apply(step, this.contextAt(at));
      },
    };
  }
}
