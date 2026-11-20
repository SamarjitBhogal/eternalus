import type { AbilityRegistry } from '../abilities/AbilityRegistry';
import { TargetQuery } from '../abilities/TargetQuery';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { AbilityLifetime } from '../components/AbilityLifetime';
import { BladeFlight } from '../components/BladeFlight';
import { Transform } from '../components/Transform';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';
import { bladeContact } from './bladeContact';
import type { System, SystemContext } from './System.types';

/** Sweeps Hamstring every fixed tick so fast shots cannot tunnel through bodies or walls. */
export class BladeSystem implements System {
  public readonly name = 'ability-projectiles';
  private readonly targets: TargetQuery;
  /** Receives shared targeting, damage and status services. */
  public constructor(
    registry: AbilityRegistry,
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
  ) {
    this.targets = new TargetQuery(registry);
  }
  /** Only the nearest hit lands, then the projectile retires. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) return;
    const retired: string[] = [];
    state.entities.forEach((projectile) => {
      const flight = projectile.findComponent(BladeFlight);
      const life = projectile.findComponent(AbilityLifetime);
      const transform = projectile.findComponent(Transform);
      if (flight === undefined || life === undefined || transform === undefined) return;
      const from = { ...transform.position };
      const travel = Math.min(flight.remaining, flight.speedPerTick);
      const to = {
        x: from.x + flight.direction.x * travel,
        y: from.y + flight.direction.y * travel,
      };
      const clear =
        state.collisions?.reach(from, flight.direction, travel, Number.EPSILON) ?? travel;
      let first: string | null = null;
      let nearest = clear + CONTACT_EPSILON;
      const shape = { kind: 'path', width: Number.EPSILON };
      for (const id of this.targets.find(
        state,
        projectile.id,
        shape,
        { from, to },
        { team: 'enemies' },
      )) {
        const target = state.entities.get(id);
        if (target === undefined) continue;
        const contact = bladeContact(target, from, flight.direction, travel);
        if (contact < nearest) {
          nearest = contact;
          first = id;
        }
      }
      if (first !== null) {
        this.damage.apply(state, first, flight.damage, {
          attackerId: life.casterId,
          kind: 'ability',
          definitionId: life.abilityId,
        });
        for (const status of flight.statusIds)
          this.statuses.apply(state, first, status, life.casterId);
      }
      transform.moveBy({
        x: flight.direction.x * Math.min(clear, nearest, travel),
        y: flight.direction.y * Math.min(clear, nearest, travel),
      });
      flight.remaining -= travel;
      if (first !== null || clear < travel || flight.remaining <= CONTACT_EPSILON)
        retired.push(projectile.id);
    });
    for (const entityId of retired) {
      state.entities.remove(entityId, 'consumed');
      state.events.emit('entity-removed', { entityId, cause: 'consumed' });
    }
  }
}
