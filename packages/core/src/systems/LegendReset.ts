import { Abilities } from '../components/Abilities';
import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { LastEnemyHit } from '../components/LastEnemyHit';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import type { Vec2 } from '../utils/geometry.types';

/**
 * The reset every returning Legend gets, from `RespawnSystem` (FR-051) and `DuelRoundSystem`
 * (DEC-36): full health, no status effect and so no ability a status granted (the `granted` slot
 * empties: Fury's dash, DEC-270), no movement (a dash or knock-back under way ends too), no cast
 * step still to come (Fury's dash after its wind-up), no attack target, no last enemy hit (a hit
 * from an earlier life earns no gem kill, DEC-346), and back at `position`. The passive's status
 * goes with the rest, so the passive is due again and `AbilitySystem` puts it back on the next
 * tick (05 §7). Aether, ability cooldowns, the ultimate meter, facing and the AI brain are the
 * caller's concern. It removes the statuses without events; a caller that must announce each end
 * (`DuelRoundSystem`) ends them through the match's `StatusEffectApplier` first.
 */
export class LegendReset {
  /** Resets `legend` in place and moves it to `position`. */
  public apply(legend: Entity, position: Vec2): void {
    const health = legend.getComponent(Health);
    health.heal(health.max);
    const statuses = legend.findComponent(StatusEffects);
    for (const { definition } of [...(statuses?.active ?? [])]) {
      statuses?.remove(definition.id);
    }
    const abilities = legend.findComponent(Abilities);
    abilities?.slot('granted')?.hold(null);
    abilities?.endCasts();
    abilities?.rearmPassive();
    const movement = legend.findComponent(Movement);
    movement?.stop();
    movement?.endPushes();
    legend.findComponent(Combat)?.setTarget(null);
    legend.removeComponent(LastEnemyHit);
    legend.getComponent(Transform).moveTo(position);
  }
}
