import { StatusEffects } from '../components/StatusEffects';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { createDefaultStatusTickEffects } from '../combat/defaultStatusTickEffects';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';

/**
 * Runs every entity's statuses in store order (architecture 05 section 8): fires each periodic
 * status's effect on its ticks, then removes the ones that are over (`status-expired`). Runs before
 * movement and combat, so both read this tick's multipliers and flags.
 *
 * It also ends a status that `endsOnDamage` (Veil, DEC-267): every `damage-applied` marks such
 * statuses on the target and the attacker as broken (`StatusEffects.breakOnDamage`: they stop
 * counting at once), and the end of a pass removes them: the same pass for a bleed tick, the next
 * tick's for a combat hit. The listener only marks because a hit can land inside a loop over a
 * holder's statuses (a bleed tick, an `onHit` step) and removal splices that list.
 */
export class StatusEffectSystem implements System {
  public readonly name = 'status-effects';

  /** The holders with a broken status since the last pass, in the order they were first hit. */
  private readonly broken = new Set<EntityId>();

  /**
   * @param state - The match whose `damage-applied` events break statuses.
   * @param damage - The match's one damage pipeline, shared with every system that deals damage.
   * @param statuses - The match's one status applier; it emits `status-expired`.
   * @param tickEffects - Each periodic tick kind's strategy.
   */
  public constructor(
    state: GameState,
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
    private readonly tickEffects = createDefaultStatusTickEffects(),
  ) {
    state.events.on('damage-applied', ({ targetId, source }) => {
      this.breakOn(state, targetId);
      if (source.attackerId !== null) {
        this.breakOn(state, source.attackerId);
      }
    });
  }

  /** Ticks and expires every entity's statuses, then ends the ones damage broke. */
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
    for (const holderId of this.broken) {
      this.statuses.removeBroken(state, holderId);
    }
    this.broken.clear();
  }

  /** Marks `holderId`'s statuses that end on damage as broken, and remembers it if any were. */
  private breakOn(state: GameState, holderId: EntityId): void {
    if (state.entities.get(holderId)?.findComponent(StatusEffects)?.breakOnDamage() === true) {
      this.broken.add(holderId);
    }
  }
}
