import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Progression } from '../components/Progression';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
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
 * placed from the attacker to it, which the `hit` shape reads. `CombatSystem` calls it after the
 * attack strategy hits; a weapon's `onHit` (05 §10) can run through it too.
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
   * Runs the `onHit` steps of every status on `attacker`, oldest status first, for its basic attack
   * that just struck `targetId`. Nothing runs when the attacker has no status with `onHit` steps or
   * the struck entity has no position.
   */
  public afterHit(state: GameState, attacker: Entity, targetId: EntityId): void {
    const active = attacker.findComponent(StatusEffects)?.active;
    const struck = state.entities.get(targetId)?.findComponent(Transform)?.position;
    if (active === undefined || struck === undefined) {
      return;
    }
    const { position } = attacker.getComponent(Transform);
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
}
