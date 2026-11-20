import { Abilities } from '../../components/Abilities';
import { ULTIMATE_SLOT } from '../../components/Abilities.constants';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `no-cast-while-not-ready` (architecture 05 §16, light): every cast that began this tick did so
 * on a ready slot, read from the slot's own record of the cast (`AbilitySlotRuntime.lastCast`):
 * the slot held an ability, its cooldown had ended, and an ultimate's meter was full. A cast that
 * skipped `CastValidator` shows here. Aether is not re-checked: `Aether.spend` throws on a cast
 * the pool cannot afford.
 */
export class NoCastWhileNotReadyInvariant implements Invariant {
  public readonly id = 'no-cast-while-not-ready';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** Flags every cast of this tick that began on a slot that was not ready. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];
    state.entities.forEach((entity) => {
      for (const runtime of entity.findComponent(Abilities)?.slots ?? []) {
        const cast = runtime.lastCast;
        if (cast?.tick !== state.tick) {
          continue;
        }
        const problem =
          runtime.abilityId === null
            ? 'the slot is empty'
            : cast.cooldownUntilTickBefore > cast.tick
              ? `its cooldown ran until tick ${String(cast.cooldownUntilTickBefore)}`
              : runtime.slot === ULTIMATE_SLOT && cast.chargeBefore < 1
                ? `its meter was at ${String(cast.chargeBefore)}`
                : null;
        if (problem !== null) {
          violations.push({
            invariantId: this.id,
            severity: this.severity,
            message: `Entity "${entity.id}" cast slot ${runtime.slot} at tick ${String(cast.tick)} but ${problem}.`,
            entityId: entity.id,
            details: { slot: runtime.slot, problem },
          });
        }
      }
    });
    return violations;
  }
}
