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
 * It also holds the one end rule of a status that `endsOnHit` (Veil, DEC-267, DEC-327): the act
 * of hitting ends it, not the damage. These events mark such statuses as broken on the one struck
 * and on the one credited with the hit (`StatusEffects.breakOnHit`: they stop counting at once):
 * - a `damage-applied` that is not a periodic status tick (`source.kind` is not `'status'`), so
 *   a bleed applied before Veil keeps ticking and the Veil stays, on both sides;
 * - a `status-applied` of a `debuff` from another entity, or from no one (as damage with no
 *   attacker), so a hit that only applies a status ends it too. A buff from another entity (an
 *   ally's aura) and a status from the holder itself do not.
 * The next pass removes the broken statuses: this tick's for a hit from a system that runs
 * before it (`AbilitySystem`), the next tick's for a combat hit. The listeners only mark, because
 * a hit can land inside a loop over a holder's statuses (an `onHit` step) and removal splices
 * that list. A hit that the damage pipeline blocks to 0 emits no `damage-applied`, so it does not
 * end the status.
 */
export class StatusEffectSystem implements System {
  public readonly name = 'status-effects';

  /** The holders with a broken status since the last pass, in the order they were first hit. */
  private readonly broken = new Set<EntityId>();

  /**
   * @param state - The match whose `damage-applied` and `status-applied` events break statuses.
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
      if (source.kind === 'status') {
        return;
      }
      this.breakOn(state, targetId);
      if (source.attackerId !== null) {
        this.breakOn(state, source.attackerId);
      }
    });
    state.events.on('status-applied', ({ entityId, statusId, sourceId }) => {
      if (sourceId === entityId || this.statuses.polarityOf(statusId) !== 'debuff') {
        return;
      }
      this.breakOn(state, entityId);
      if (sourceId !== null) {
        this.breakOn(state, sourceId);
      }
    });
  }

  /** Ticks and expires every entity's statuses, then ends the ones a hit broke. */
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
    // Emptied first: a holder broken again by a `status-expired` listener waits for the next pass.
    const holders = [...this.broken];
    this.broken.clear();
    for (const holderId of holders) {
      this.statuses.removeBroken(state, holderId);
    }
  }

  /** Marks `holderId`'s statuses that end on a hit as broken, and remembers it if any were. */
  private breakOn(state: GameState, holderId: EntityId): void {
    const statuses = state.entities.get(holderId)?.findComponent(StatusEffects);
    if (statuses?.breakOnHit(state.tick) === true) {
      this.broken.add(holderId);
    }
  }
}
