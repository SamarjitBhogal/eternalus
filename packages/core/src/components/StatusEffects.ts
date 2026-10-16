import type {
  StatusEffectDefinition,
  StatusFlag,
  StatusStat,
} from '../content/status-effects/statusEffects.types';
import type { EntityId } from '../state/EntityStore.types';
import { StatusEffectRuntime } from './StatusEffectRuntime';

/**
 * The statuses on an entity (architecture 05 section 8) and what they add up to: one multiplier
 * per stat and the set of flags, recomputed whenever the list changes, so every reader asks one
 * question per tick. An entity without this component is immune to statuses (structures).
 */
export class StatusEffects {
  private readonly activeList: StatusEffectRuntime[] = [];

  private readonly spare: StatusEffectRuntime[] = [];

  /** Per stat, the sum of `perStack × stacks` over the active statuses. */
  private readonly modifierSums = new Map<StatusStat, number>();

  private readonly flags = new Set<StatusFlag>();

  /** The active statuses, oldest first. Read them, do not keep them: they are reused. */
  public get active(): readonly StatusEffectRuntime[] {
    return this.activeList;
  }

  /**
   * Applies `definition` (loaded, in ticks) at `tick`: a new instance, or the active one reapplied
   * by its stacking rule. Use `combat/StatusEffectApplier`, which also emits `status-applied`.
   */
  public apply(definition: StatusEffectDefinition, sourceId: EntityId | null, tick: number): void {
    const existing = this.find(definition.id);
    if (existing === undefined) {
      const runtime = this.spare.pop() ?? new StatusEffectRuntime(definition);
      this.activeList.push(runtime.start(definition, sourceId, tick));
    } else {
      existing.reapply(sourceId, tick);
    }
    this.recompute();
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

  /** What `stat` is multiplied by: 1 plus every active modifier × its stacks, never below 0. */
  public multiplier(stat: StatusStat): number {
    return Math.max(0, 1 + (this.modifierSums.get(stat) ?? 0));
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
    this.modifierSums.clear();
    this.flags.clear();
    for (const { definition, stacks } of this.activeList) {
      for (const { stat, perStack } of definition.modifiers) {
        this.modifierSums.set(stat, (this.modifierSums.get(stat) ?? 0) + perStack * stacks);
      }
      for (const flag of definition.flags) {
        this.flags.add(flag);
      }
    }
  }
}
