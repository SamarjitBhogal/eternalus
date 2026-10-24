import type {
  StatusEffectDefinition,
  StatusFlag,
  StatusStat,
} from '../content/status-effects/statusEffects.types';
import { StatusEffectRuntime } from './StatusEffectRuntime';

/**
 * The statuses on an entity (architecture 05 section 8) and what they add up to: one multiplier
 * per stat (each modifier's `value` once per stack) and the set of flags, recomputed whenever the
 * list changes, so every reader asks one question per tick. An entity without this component is
 * immune to statuses (structures). Ids are plain strings (`components/` may not import `state/`).
 */
export class StatusEffects {
  private readonly activeList: StatusEffectRuntime[] = [];

  private readonly spare: StatusEffectRuntime[] = [];

  /** Per stat, the product of every active modifier's `value` raised to its stacks. */
  private readonly multipliers = new Map<StatusStat, number>();

  private readonly flags = new Set<StatusFlag>();

  /** The active statuses, oldest first. Read them, do not keep them: they are reused. */
  public get active(): readonly StatusEffectRuntime[] {
    return this.activeList;
  }

  /**
   * Applies `definition` (loaded, in ticks) at `tick`: a new instance, or the active one reapplied
   * by its stacking rule. Use `combat/StatusEffectApplier`, which also emits `status-applied`.
   */
  public apply(definition: StatusEffectDefinition, sourceId: string | null, tick: number): void {
    const existing = this.find(definition.id);
    if (existing === undefined) {
      const runtime = this.spare.pop() ?? new StatusEffectRuntime(definition);
      this.activeList.push(runtime.start(definition, sourceId, tick));
    } else {
      existing.reapply(sourceId, tick);
    }
    this.recompute();
  }

  /**
   * Removes the status `statusId` now, whatever its timer (an aura left, a hold released). Returns
   * whether it was active. Use `combat/StatusEffectApplier.remove`, which also emits the event.
   * Not from inside a loop over `active` (a listener during `StatusEffectSystem`'s pass): it splices.
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

  /** What `stat` is multiplied by: 1 with no modifier on it. */
  public multiplier(stat: StatusStat): number {
    return this.multipliers.get(stat) ?? 1;
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
    this.multipliers.clear();
    this.flags.clear();
    for (const { definition, stacks } of this.activeList) {
      for (const { stat, value } of definition.modifiers) {
        let product = this.multipliers.get(stat) ?? 1;
        // Repeated multiplication, not Math.pow, which core avoids (ADR 0012).
        for (let stack = 0; stack < stacks; stack += 1) {
          product *= value;
        }
        this.multipliers.set(stat, product);
      }
      for (const flag of definition.flags) {
        this.flags.add(flag);
      }
    }
  }
}
