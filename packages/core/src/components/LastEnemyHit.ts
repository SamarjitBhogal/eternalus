import type { EntityId } from '../state/EntityStore.types';

/**
 * The last enemy whose hit landed on this entity, and the tick it landed (DEC-346). `KillCredit`
 * adds it on the entity's first enemy hit and records each later one; it names the killer of a
 * death by the Cathedral gem. An entity without one has taken no enemy hit.
 */
export class LastEnemyHit {
  /**
   * @param attackerIdValue - The enemy whose hit landed.
   * @param tickValue - The tick it landed on.
   */
  public constructor(
    private attackerIdValue: EntityId,
    private tickValue: number,
  ) {}

  /** The fields that change the match's future, for `StateHasher`. */
  public get fields(): readonly [EntityId, number] {
    return [this.attackerIdValue, this.tickValue];
  }

  /** Records that `attackerId`'s hit landed on `tick`, replacing the one before. */
  public record(attackerId: EntityId, tick: number): void {
    this.attackerIdValue = attackerId;
    this.tickValue = tick;
  }

  /** The last enemy attacker if its hit landed at most `windowTicks` before `tick`, else `null`. */
  public attackerIdWithin(tick: number, windowTicks: number): EntityId | null {
    return tick - this.tickValue <= windowTicks ? this.attackerIdValue : null;
  }
}
