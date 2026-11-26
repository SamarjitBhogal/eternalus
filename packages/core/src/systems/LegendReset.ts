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
 * (DEC-36): full health, no status effect, no movement (a dash or knock-back under way ends too),
 * no attack target, no last enemy hit (a hit from an earlier life earns no gem kill, DEC-346), and
 * back at `position`. Aether, ability cooldowns, facing and the AI brain are the caller's concern.
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
    const movement = legend.findComponent(Movement);
    movement?.stop();
    movement?.endPushes();
    legend.findComponent(Combat)?.setTarget(null);
    legend.removeComponent(LastEnemyHit);
    legend.getComponent(Transform).moveTo(position);
  }
}
