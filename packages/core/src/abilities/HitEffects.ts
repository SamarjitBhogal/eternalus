import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Progression } from '../components/Progression';
import type { StatusEffectRuntime } from '../components/StatusEffectRuntime';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { AbilityRegistry } from './AbilityRegistry';
import { CastInstance } from './CastInstance';
import { TargetQuery } from './TargetQuery';

/**
 * Runs the `onHit` steps of an attacker's statuses each time one of its basic attacks lands
 * (architecture 05 §8; Fury's knock-back). Each status's steps run as one cast through the
 * registry's strategies, as an ability's do (`CastInstance`): credited to the attacker under the
 * status's id, from the `default-action` slot (the basic attack), aimed at the struck body and
 * placed from the attacker to it, which the `hit` shape reads. The attack strategy calls it where
 * the hit lands (`MeleeAttackStrategy` in the tick); a weapon's `onHit` (05 §10) can run through it
 * too.
 */
export class HitEffects {
  private readonly targets: TargetQuery;

  /**
   * @param registry - Where effect and shape strategies are found (the `AbilityRegistry`).
   * @param damage - The match's one damage pipeline, for the steps.
   * @param statuses - The match's one status applier, for the steps.
   */
  public constructor(
    private readonly registry: Pick<AbilityRegistry, 'effectFor' | 'shapeFor'>,
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
  ) {
    this.targets = new TargetQuery(registry);
  }

  /**
   * Runs the `onHit` steps of every status on `attackerId`, oldest status first, for its basic
   * attack that just struck `targetId`. Nothing runs, and nothing is allocated (NFR-023), when the
   * attacker has no status with `onHit` steps; nothing runs when either entity has no position.
   */
  public afterHit(state: GameState, attackerId: EntityId, targetId: EntityId): void {
    const attacker = state.entities.get(attackerId);
    const active = attacker?.findComponent(StatusEffects)?.active;
    const position = attacker?.findComponent(Transform)?.position;
    const struck = state.entities.get(targetId)?.findComponent(Transform)?.position;
    if (
      attacker === undefined ||
      active === undefined ||
      position === undefined ||
      struck === undefined ||
      !HitEffects.hasOnHit(active)
    ) {
      return;
    }
    const from = { x: position.x, y: position.y };
    const to = { x: struck.x, y: struck.y };
    // Only the statuses active at the hit: a step may add one to the attacker (a buff on hit).
    for (let index = 0, count = active.length; index < count; index += 1) {
      const definition = active[index]?.definition;
      if (definition?.onHit === undefined) {
        continue;
      }
      // ponytail: steps bound and one CastInstance per hit, fine at a few hits a second; cache the
      // bound steps per status if on-hit statuses become common.
      new CastInstance(
        {
          casterId: attacker.id,
          ability: {
            id: definition.id,
            steps: definition.onHit.map((spec) => ({
              effect: this.registry.effectFor(spec.kind),
              spec,
              delayTicks: 0, // an on-hit step never waits: it runs where the hit lands
            })),
            definition: { scaling: {} },
          },
          slot: 'default-action',
          aim: { point: to, targetId },
          origin: from,
          casterLevel: attacker.findComponent(Progression)?.level ?? 1,
          tick: state.tick,
        },
        {
          state,
          effects: this.registry,
          targets: this.targets,
          damage: this.damage,
          statuses: this.statuses,
        },
      ).run({ from, to });
    }
  }

  /** Whether any of `active` has `onHit` steps; a loop, so a hit with none allocates nothing. */
  private static hasOnHit(active: readonly StatusEffectRuntime[]): boolean {
    for (let index = 0, count = active.length; index < count; index += 1) {
      if (active[index]?.definition.onHit !== undefined) {
        return true;
      }
    }
    return false;
  }
}
