import type { Team } from '../teams/teams.types';
import { LOCKING_PROGRESS } from './Capturable.constants';

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

  /** The living mini-boss that blocks capture, or `null` (set in Phase 3 sprint 3.6). */
  public readonly lockedBy: string | null = null;

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

  /** Hands the zone to `owner` (a capture reached its locking state); returns the previous owner. */
  public setOwner(owner: Team): Team {
    const previous = this.ownerValue;
    this.ownerValue = owner;
    return previous;
  }
}
