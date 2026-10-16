import type { UnitAttack } from '../content/units/units.types';
import type { EntityId } from '../state/EntityStore.types';

/**
 * A unit's attack state (architecture 04 §3): what it attacks, its target and when it may hit
 * again. `CombatSystem` reads it every tick; the `attack-target` command sets the target.
 */
export class Combat {
  private targetIdValue: EntityId | null = null;

  private readyAtTickValue = 0;

  /** @param attack - The basic attack, with `interval` already in ticks. */
  public constructor(public readonly attack: UnitAttack) {}

  /** The entity being attacked, or `null` when idle. */
  public get targetId(): EntityId | null {
    return this.targetIdValue;
  }

  /** The first tick the next hit may land. */
  public get readyAtTick(): number {
    return this.readyAtTickValue;
  }

  /** Starts attacking `targetId`, or stops with `null`. */
  public setTarget(targetId: EntityId | null): void {
    this.targetIdValue = targetId;
  }

  /** Whether the attack is off cooldown at `tick`. */
  public canAttack(tick: number): boolean {
    return tick >= this.readyAtTickValue;
  }

  /** Records a hit at `tick`, putting the attack on cooldown for `attack.interval` ticks. */
  public beginAttack(tick: number): void {
    this.readyAtTickValue = tick + this.attack.interval;
  }
}
