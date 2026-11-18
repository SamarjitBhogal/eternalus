import type { Team } from '../teams/teams.types';
import { LOCKING_PROGRESS, ZERO_PER_SIDE } from './Capturable.constants';

/**
 * A zone's capture state (architecture 07 §7, DEC-86). `progress` runs from -1 (fully Dark) through
 * 0 (neutral) to +1 (fully Light); those three values are the locking states, and `owner` changes
 * only when a capture reaches one. `CaptureSystem` is the only writer. Entity ids are plain strings
 * because `components/` may not import `state/` (02 §2).
 */
export class Capturable {
  private ownerValue: Team = 'neutral';
  private progressValue = 0;
  private checkpointValue = 0;
  private presenceValue: Readonly<Record<Team, number>> = ZERO_PER_SIDE;
  private reachedValue: Record<Team, number> = { ...ZERO_PER_SIDE };
  private lockedByValue: string | null = null;

  /**
   * The living mini-boss that blocks capture, or `null` (reference 04: "while the mini-boss is
   * alive, its zone cannot be captured").
   */
  public get lockedBy(): string | null {
    return this.lockedByValue;
  }

  /** Who holds the zone; `'neutral'` at match start. */
  public get owner(): Team {
    return this.ownerValue;
  }

  /** -1 (fully Dark) to +1 (fully Light); 0 is neutral. */
  public get progress(): number {
    return this.progressValue;
  }

  /** Checkpoints the current capture has passed, from 0 to the configured count. */
  public get checkpoint(): number {
    return this.checkpointValue;
  }

  /**
   * Each side's summed unit weight inside the zone this tick (DEC-145 (c)): the density the
   * client shows as each side's share.
   */
  public get presence(): Readonly<Record<Team, number>> {
    return this.presenceValue;
  }

  /**
   * The highest checkpoint `team`'s pushes have reached since the zone last changed owner: a
   * checkpoint is reached once per side per owner (DEC-145 (g)).
   */
  public reachedBy(team: Team): number {
    return this.reachedValue[team];
  }

  /** The side the progress leans toward: Light above 0, Dark below 0, otherwise neutral. */
  public get progressTeam(): Team {
    if (this.progressValue > 0) {
      return 'light';
    }
    return this.progressValue < 0 ? 'dark' : 'neutral';
  }

  /** The progress of the owner's locking state: where an unfinished capture falls back to. */
  public get lockingProgress(): number {
    return Capturable.lockingProgressOf(this.ownerValue);
  }

  /** The locking-state progress of `team`: +1 Light, -1 Dark, 0 neutral. */
  public static lockingProgressOf(team: Team): number {
    return LOCKING_PROGRESS[team];
  }

  /** Sets the progress and the checkpoints it has passed. */
  public setProgress(progress: number, checkpoint: number): void {
    this.progressValue = progress;
    this.checkpointValue = checkpoint;
  }

  /**
   * Sets each side's summed weight inside the zone this tick. The object is kept and handed to
   * snapshots as it is, so the caller passes a new one each tick and never mutates it.
   */
  public setPresence(presence: Readonly<Record<Team, number>>): void {
    this.presenceValue = presence;
  }

  /** Locks the zone to the living boss `bossId`, or unlocks it with `null`. */
  public setLock(bossId: string | null): void {
    this.lockedByValue = bossId;
  }

  /** Records that `team`'s push reached `checkpoint`; a lower checkpoint changes nothing. */
  public markReached(team: Team, checkpoint: number): void {
    this.reachedValue[team] = Math.max(this.reachedValue[team], checkpoint);
  }

  /**
   * Hands the zone to `owner` (a capture reached its locking state) and clears every side's
   * reached checkpoints; returns the previous owner.
   */
  public setOwner(owner: Team): Team {
    const previous = this.ownerValue;
    this.ownerValue = owner;
    this.reachedValue = { ...ZERO_PER_SIDE };
    return previous;
  }
}
