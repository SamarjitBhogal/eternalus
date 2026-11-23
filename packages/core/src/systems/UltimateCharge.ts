import { Abilities } from '../components/Abilities';
import { ULTIMATE_SLOT } from '../components/Abilities.constants';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { MOB_KINDS } from '../content/mobs/mobKinds';
import type { UltimateChargeDefinition } from '../content/progression/progression.types';
import type { AbilitySlotRuntime } from '../components/AbilitySlotRuntime';
import type { EntityId } from '../state/EntityStore.types';
import type { GameEventMap, UltimateChargeCause } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import { CHARGE_STEPS } from './UltimateCharge.constants';
import type { ChargeChange } from './UltimateCharge.types';

/**
 * The ultimate meter (architecture 05 §6, DEC-272, DEC-273), owned by `ProgressionSystem`, the
 * only writer of `charge`. Its listeners price each change while the entities are still in the
 * store and buffer it; `pay` applies the buffer in the system's pass. The meter never fills
 * passively: every change comes from one of these events and is announced as `ultimate-charged`.
 *
 * - `entity-died`: the victim loses `deathLoss`, whoever killed it. A killer on another team than
 *   the victim gains `legendKill` for a Legend, `bossKill` for a boss listed there (DEC-283: the
 *   last hit fills the meter) and its weight class's `mobKill` for any other mob (O5: self-kills
 *   and ally kills pay nothing; neutral camp mobs pay).
 * - `damage-applied`: an attacker on another team than a structure gains `structureDamagePerPercent`
 *   for each 1% of the structure's max health dealt, absorbed damage included (as scoring counts
 *   it, DEC-123); a boss in `bossDamagePerPercent` pays its own rate the same way.
 * - `checkpoint-reached`: each Legend present gains `checkpointReached`. `CaptureSystem` runs
 *   after `ProgressionSystem`, so this pays on the next tick.
 * - `assist-earned`: the helper gains `assist`. Scoring emits it in the director's pass, so this
 *   too pays on the next tick.
 *
 * Only an entity with an ultimate slot has a meter. A dead Legend gains nothing until it
 * respawns (the owner's reading of 2026-11-16, as for structure XP); a death still takes points.
 * The meter stays from 0 to 1, on a grid of `CHARGE_STEPS` steps (so whole points worth a full
 * meter make exactly 1), and an unchanged meter announces nothing.
 */
export class UltimateCharge {
  private readonly pending: ChargeChange[] = [];

  /**
   * Subscribes to `state`'s events; lives as long as the match.
   *
   * @param state - The match whose kills, hits, checkpoints and assists fill the meters.
   * @param table - The points of each source (`content/progression/ultimateCharge.ts`).
   */
  public constructor(
    state: GameState,
    private readonly table: UltimateChargeDefinition,
  ) {
    state.events.on('entity-died', (death) => {
      this.onDied(state, death);
    });
    state.events.on('damage-applied', (hit) => {
      this.onHit(state, hit);
    });
    state.events.on('checkpoint-reached', ({ presentLegendIds }) => {
      for (const legendId of presentLegendIds) {
        this.queue(state, legendId, table.checkpointReached, 'checkpoint');
      }
    });
    state.events.on('assist-earned', ({ legendId }) => {
      this.queue(state, legendId, table.assist, 'assist');
    });
  }

  /** Applies the buffered changes in the order they were earned, and announces each one. */
  public pay(state: GameState): void {
    for (const { recipientId, points, cause } of this.pending.splice(0)) {
      const recipient = state.entities.get(recipientId);
      const meter = UltimateCharge.meterOf(state, recipientId);
      if (
        meter === undefined ||
        (points > 0 && recipient?.findComponent(Health)?.isDead === true)
      ) {
        continue;
      }
      const exact = Math.min(1, Math.max(0, meter.charge + points / this.table.fullMeter));
      const charge = Math.round(exact * CHARGE_STEPS) / CHARGE_STEPS;
      if (charge !== meter.charge) {
        const amount = charge - meter.charge;
        meter.charge = charge;
        state.events.emit('ultimate-charged', { entityId: recipientId, amount, charge, cause });
      }
    }
  }

  private onDied(state: GameState, { entityId, killer }: GameEventMap['entity-died']): void {
    const victim = state.entities.get(entityId);
    if (victim === undefined) {
      return;
    }
    this.queue(state, entityId, -this.table.deathLoss, 'death');
    const killerId = killer.attackerId;
    if (killerId === null || state.entities.teamOf(killerId) === state.entities.teamOf(entityId)) {
      return;
    }
    const bossKill = this.table.bossKill[victim.definitionId];
    if (victim.family === 'legend') {
      this.queue(state, killerId, this.table.legendKill, 'legend-kill');
    } else if (bossKill !== undefined) {
      this.queue(state, killerId, bossKill, 'boss-kill');
    } else if (MOB_KINDS.hasKind(victim.kind)) {
      this.queue(state, killerId, this.table.mobKill[victim.kind], 'mob-kill');
    }
  }

  private onHit(
    state: GameState,
    { targetId, amount, absorbed, source: { attackerId } }: GameEventMap['damage-applied'],
  ): void {
    const target = state.entities.get(targetId);
    if (target === undefined || attackerId === null) {
      return;
    }
    const isStructure = target.family === 'structure';
    const perPercent = isStructure
      ? this.table.structureDamagePerPercent
      : this.table.bossDamagePerPercent[target.definitionId];
    const max = target.findComponent(Health)?.max ?? 0;
    if (
      perPercent === undefined ||
      max <= 0 ||
      state.entities.teamOf(attackerId) === state.entities.teamOf(targetId)
    ) {
      return;
    }
    const percent = (100 * (amount + absorbed)) / max;
    this.queue(
      state,
      attackerId,
      perPercent * percent,
      isStructure ? 'structure-damage' : 'boss-damage',
    );
  }

  /**
   * Buffers a change for an entity with a meter; every other entity's kills and hits are skipped.
   * A gain is multiplied by the recipient's `ultimateGain` (Erudition, DEC-330); a loss is not.
   */
  private queue(
    state: GameState,
    recipientId: EntityId,
    points: number,
    cause: UltimateChargeCause,
  ): void {
    if (points === 0 || UltimateCharge.meterOf(state, recipientId) === undefined) {
      return;
    }
    const gain =
      points > 0
        ? (state.entities
            .get(recipientId)
            ?.findComponent(StatusEffects)
            ?.multiplier('ultimateGain') ?? 1)
        : 1;
    this.pending.push({ recipientId, points: points * gain, cause });
  }

  private static meterOf(state: GameState, entityId: EntityId): AbilitySlotRuntime | undefined {
    return state.entities.get(entityId)?.findComponent(Abilities)?.slot(ULTIMATE_SLOT);
  }
}
