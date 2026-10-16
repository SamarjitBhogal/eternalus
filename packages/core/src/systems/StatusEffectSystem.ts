import { StatusEffects } from '../components/StatusEffects';
import { DamagePipeline } from '../combat/DamagePipeline';
import { createDefaultStatusTickEffects } from '../combat/defaultStatusTickEffects';
import type { System, SystemContext } from './System.types';

/**
 * Runs every entity's statuses in store order (architecture 05 section 8): fires each periodic
 * status's effect on its ticks, then removes the ones that are over (`status-expired`). Runs before
 * movement and combat, so both read this tick's multipliers and flags.
 */
export class StatusEffectSystem implements System {
  public readonly name = 'status-effects';

  /**
   * @param damage - The pipeline periodic damage goes through.
   * @param tickEffects - Each periodic effect by id.
   */
  public constructor(
    private readonly damage = new DamagePipeline(),
    private readonly tickEffects = createDefaultStatusTickEffects(),
  ) {}

  /** Ticks and expires every entity's statuses. */
  public update({ state }: SystemContext): void {
    const context = { state, damage: this.damage };
    state.entities.forEach((entity) => {
      const statuses = entity.findComponent(StatusEffects);
      if (statuses === undefined || statuses.active.length === 0) {
        return;
      }
      for (const status of statuses.active) {
        const { periodic } = status.definition;
        if (periodic !== null && status.isPeriodicTick(state.tick)) {
          this.tickEffects[periodic.effect].tick(status, entity.id, context);
        }
      }
      for (const status of statuses.active) {
        if (status.hasExpired(state.tick)) {
          state.events.emit('status-expired', {
            entityId: entity.id,
            statusId: status.definition.id,
            sourceId: status.sourceId,
          });
        }
      }
      statuses.expire(state.tick);
    });
  }
}
