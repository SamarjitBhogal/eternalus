import { StatusEffects } from '../components/StatusEffects';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
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
   * @param damage - The match's one damage pipeline, shared with every system that deals damage.
   * @param statuses - The match's one status applier; it emits `status-expired`.
   * @param tickEffects - Each periodic tick kind's strategy.
   */
  public constructor(
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
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
          for (const spec of periodic.effects) {
            this.tickEffects[spec.kind].tick(spec, status, entity.id, context);
          }
        }
      }
      this.statuses.expire(state, entity.id);
    });
  }
}
