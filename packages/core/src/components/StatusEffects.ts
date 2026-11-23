import type {
  StatusEffectDefinition,
  StatusFlag,
  StatusStat,
} from '../content/status-effects/statusEffects.types';
import type { ScaledModifier } from './StatusEffects.types';
import { StatusEffectRuntime } from './StatusEffectRuntime';

/**
 * The statuses on an entity (architecture 05 section 8) and what they add up to: one multiplier per
 * stat (each modifier's `value` once per stack, `StatModifier`) and the set of flags, recomputed
 * whenever the list changes, so every reader asks one question per tick. A modifier scaled by lost
 * health (`byLostHealth`) is kept apart and added in when its reader gives the health. An entity
 * without this component is immune to statuses (structures). Ids are plain strings (`components/`
 * may not import `state/`).
 */
export class StatusEffects {
  private readonly activeList: StatusEffectRuntime[] = [];

  private readonly spare: StatusEffectRuntime[] = [];

  /** Per stat, every active fixed `mul` modifier's `value` raised to its stacks. */
  private readonly products = new Map<StatusStat, number>();

  /** Per stat, the sum of every active fixed `add` modifier's `value` × its stacks. */
  private readonly bonuses = new Map<StatusStat, number>();

  /** The active modifiers scaled by lost health; empty for nearly every entity. */
  private readonly scaled: ScaledModifier[] = [];

  private readonly flags = new Set<StatusFlag>();

  /** The active statuses, oldest first. Read them, do not keep them: they are reused. */
  public get active(): readonly StatusEffectRuntime[] {
    return this.activeList;
  }

  /**
   * Applies `definition` (loaded, in ticks) at `tick`: a new instance, or the active one reapplied
   * by its stacking rule. Use `combat/StatusEffectApplier`, which also emits `status-applied`.
   *
   * @param durationTicks - This application's duration when its source overrides the definition's.
   */
  public apply(
    definition: StatusEffectDefinition,
    sourceId: string | null,
    tick: number,
    durationTicks?: number,
  ): void {
    const existing = this.find(definition.id);
    if (existing === undefined) {
      const runtime = this.spare.pop() ?? new StatusEffectRuntime(definition);
      this.activeList.push(runtime.start(definition, sourceId, tick, durationTicks));
    } else {
      existing.reapply(sourceId, tick, durationTicks);
    }
    this.recompute();
  }

  /**
   * Removes the status `statusId` now, whatever its timer (an aura left, a hold released). Returns
   * whether it was active. Use `combat/StatusEffectApplier.remove`, which also emits the event. Not
   * from inside a loop over `active` (a listener during `StatusEffectSystem`'s pass): it splices.
   */
  public remove(statusId: string): boolean {
    const status = this.find(statusId);
    if (status === undefined) {
      return false;
    }
    this.activeList.splice(this.activeList.indexOf(status), 1);
    this.spare.push(status);
    this.recompute();
    return true;
  }

  /** Removes every status that is over at `tick` (`StatusEffectRuntime.hasExpired`). */
  public expire(tick: number): void {
    let kept = 0;
    for (const status of this.activeList) {
      if (status.hasExpired(tick)) {
        this.spare.push(status);
      } else {
        this.activeList[kept] = status;
        kept += 1;
      }
    }
    if (kept !== this.activeList.length) {
      this.activeList.length = kept;
      this.recompute();
    }
  }

  /**
   * What `stat` is multiplied by: (1 + every `add`) × every `mul`; 1 with no modifier on it.
   *
   * @param healthFraction - The holder's health over its max health, from 0 to 1, for a modifier
   *   scaled by lost health (`byLostHealth`); full health (no part of it) when omitted.
   */
  public multiplier(stat: StatusStat, healthFraction = 1): number {
    let bonus = this.bonuses.get(stat) ?? 0;
    let product = this.products.get(stat) ?? 1;
    if (this.scaled.length === 0) {
      return (1 + bonus) * product; // nearly every entity: no loop on the hot path (NFR-023)
    }
    for (const { stat: scaledStat, op, value, byLostHealth, stacks } of this.scaled) {
      if (scaledStat !== stat) {
        continue;
      }
      const part = Math.min(1, Math.max(0, (1 - healthFraction) / (1 - byLostHealth.fullAt)));
      for (let stack = 0; stack < stacks; stack += 1) {
        if (op === 'add') {
          bonus += value * part;
        } else {
          product *= 1 + (value - 1) * part;
        }
      }
    }
    return (1 + bonus) * product;
  }

  /** Whether any active status sets `flag`. */
  public has(flag: StatusFlag): boolean {
    return this.flags.has(flag);
  }

  private find(statusId: string): StatusEffectRuntime | undefined {
    for (const status of this.activeList) {
      if (status.definition.id === statusId) {
        return status;
      }
    }
    return undefined;
  }

  private recompute(): void {
    this.products.clear();
    this.bonuses.clear();
    this.scaled.length = 0;
    this.flags.clear();
    for (const { definition, stacks } of this.activeList) {
      for (const { stat, op, value, byLostHealth } of definition.modifiers) {
        if (byLostHealth !== undefined) {
          this.scaled.push({ stat, op, value, byLostHealth, stacks });
        } else if (op === 'add') {
          this.bonuses.set(stat, (this.bonuses.get(stat) ?? 0) + value * stacks);
        } else {
          let product = this.products.get(stat) ?? 1;
          // Repeated multiplication, not Math.pow, which core avoids (ADR 0012).
          for (let stack = 0; stack < stacks; stack += 1) {
            product *= value;
          }
          this.products.set(stat, product);
        }
      }
      for (const flag of definition.flags) {
        this.flags.add(flag);
      }
    }
  }
}
