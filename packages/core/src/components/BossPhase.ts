import type { BossPhaseId } from '../content/ai/ai.types';

/**
 * A boss's phase in its fight (DEC-417): `healthy`, then `hurt` once its health falls below its
 * profile's share, which opens its locked moves. It also remembers the boss's last hit, whatever
 * the attacker, so only a hit since the last change can turn it `hurt`. Game state, so
 * `StateHasher` covers it. Added on the boss's first hit (`BossDamageSystem`) or first change (the
 * developer menu's `dev-set-boss-phase`); a boss without one is `healthy`.
 */
export class BossPhase {
  private phaseValue: BossPhaseId = 'healthy';
  private changedTickValue = 0;
  /** -1: no hit yet. */
  private lastHitTickValue = -1;

  /** The current phase. */
  public get phase(): BossPhaseId {
    return this.phaseValue;
  }

  /** The tick the phase last changed. */
  public get changedTick(): number {
    return this.changedTickValue;
  }

  /** Whether the boss took a hit on or after the tick its phase last changed. */
  public get wasHitSinceChange(): boolean {
    return this.lastHitTickValue >= this.changedTickValue;
  }

  /** The fields that change the entity's future, for `StateHasher`. */
  public get fields(): readonly (string | number)[] {
    return [this.phaseValue, this.changedTickValue, this.lastHitTickValue];
  }

  /** Enters `phase` on `tick`. */
  public enter(phase: BossPhaseId, tick: number): void {
    this.phaseValue = phase;
    this.changedTickValue = tick;
  }

  /** Records a hit on `tick`. */
  public recordHit(tick: number): void {
    this.lastHitTickValue = tick;
  }
}
