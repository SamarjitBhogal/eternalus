import type {
  StatusEffectDefinition,
  StatusFlag,
  StatusStat,
  StatusSteeringKind,
} from '../content/status-effects/statusEffects.types';
import { StatusEffectRuntime } from './StatusEffectRuntime';

/**
 * The statuses on an entity (architecture 05 section 8) and what they add up to: one multiplier per
 * stat (each modifier's `value` once per stack, `StatModifier`) and the set of flags, recomputed
 * whenever the list changes or a status breaks, so every reader asks one question per tick. An
 * entity without this component is immune to statuses (structures); one with it may be immune to
 * some by its content (`UnitDefinition.statusImmunities`: the Sentinel to Fear, DEC-207). Ids are
 * plain strings (`components/` may not import `state/`).
 */
export class StatusEffects {
  private readonly activeList: StatusEffectRuntime[] = [];

  private readonly immunities: ReadonlySet<string>;

  /** The newest active status that steers its holder; recomputed with the flags. */
  private steeringStatus: StatusEffectRuntime | undefined = undefined;

  /** @param immunities - The ids of the statuses this entity never gets (its content's). */
  public constructor(immunities: readonly string[] = []) {
    this.immunities = new Set(immunities);
  }

  private readonly spare: StatusEffectRuntime[] = [];

  /** Per stat, (1 + its `add` bonus) × every active `mul` modifier's `value` raised to its stacks. */
  private readonly multipliers = new Map<StatusStat, number>();

  /** Per stat, the sum of every active `add` modifier's `value` × its stacks; folded in above. */
  private readonly bonuses = new Map<StatusStat, number>();

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
   * @param steering - This application's form, of the definition's `steering` forms; the first
   *   form when omitted.
   */
  public apply(
    definition: StatusEffectDefinition,
    sourceId: string | null,
    tick: number,
    durationTicks?: number,
    steering?: StatusSteeringKind,
  ): void {
    const existing = this.find(definition.id);
    if (existing === undefined) {
      const runtime = this.spare.pop() ?? new StatusEffectRuntime(definition);
      this.activeList.push(runtime.start(definition, sourceId, tick, durationTicks, steering));
    } else {
      existing.reapply(sourceId, tick, durationTicks, steering);
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
   * Marks every active status that `endsOnHit` as broken (its holder hit or was hit, DEC-267,
   * DEC-327) and returns whether any was. A broken status stops counting at once (no flags, no
   * modifiers), so a Veil ends at the hit; it stays listed, so this is safe inside a loop over
   * `active`, until `StatusEffectApplier.removeBroken` removes it. One that has run out at `tick`
   * does not break: it ends by expiry, so a hit inside its `status-expired` cannot end it twice.
   */
  public breakOnHit(tick: number): boolean {
    let hasBroken = false;
    for (const status of this.activeList) {
      if (status.definition.endsOnHit === true && !status.hasExpired(tick)) {
        status.isBroken = true;
        hasBroken = true;
      }
    }
    if (hasBroken) {
      this.recompute();
    }
    return hasBroken;
  }

  /** Whether this entity never gets the status `statusId` (`StatusEffectApplier` refuses it). */
  public isImmuneTo(statusId: string): boolean {
    return this.immunities.has(statusId);
  }

  /**
   * The newest active, unbroken status that steers this entity (`StatusEffectRuntime.steering`,
   * Fear), whose `heading` `MovementSystem` walks along in place of the entity's own (a zero
   * heading stands); `undefined` with none.
   */
  public get steering(): StatusEffectRuntime | undefined {
    return this.steeringStatus;
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
    this.bonuses.clear();
    this.flags.clear();
    this.steeringStatus = undefined;
    for (const status of this.activeList) {
      const { definition, stacks, isBroken } = status;
      if (isBroken) {
        continue;
      }
      if (status.steering !== null) {
        this.steeringStatus = status;
      }
      for (const { stat, op, value } of definition.modifiers) {
        if (op === 'add') {
          this.bonuses.set(stat, (this.bonuses.get(stat) ?? 0) + value * stacks);
          continue;
        }
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
    this.bonuses.forEach((bonus, stat) => {
      this.multipliers.set(stat, (1 + bonus) * (this.multipliers.get(stat) ?? 1));
    });
  }
}
