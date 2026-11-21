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
 * It also owns the one end rule of a status that `endsOnDamage` (Veil, DEC-267): every
 * `damage-applied` marks such statuses on the target and on the attacker as broken
 * (`StatusEffects.breakOnDamage`), and the end of each pass removes them. The listener only marks,
 * because a hit can land inside a loop over a holder's statuses (a bleed tick here, an `onHit`
 * step in combat) and removing splices that list. A status broken by a bleed tick ends in the same
 * pass; one broken by a later system (combat) ends in the next tick's pass.
 */
export class StatusEffectSystem implements System {
  public readonly name = 'status-effects';

  /** The holders with a broken status since the last pass, in the order they were hit. */
  private readonly broken: EntityId[] = [];

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
    for (const holderId of this.broken.splice(0)) {
      this.statuses.removeBroken(state, holderId);
    }
  }

  /** Marks `holderId`'s statuses that end on damage as broken, and remembers it if any were. */
  private breakOn(state: GameState, holderId: EntityId): void {
    if (state.entities.get(holderId)?.findComponent(StatusEffects)?.breakOnDamage() === true) {
      this.broken.push(holderId);
    }
  }
}
