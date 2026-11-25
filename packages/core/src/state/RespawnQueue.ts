import type { Legend } from '../entities/Legend';
import type { PlayableTeam } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';
import type { OwedXp, RespawnEntry } from './RespawnQueue.types';

/** A queued entry, with its owed XP growing in place. */
type Waiting = Omit<RespawnEntry, 'owedXp'> & { readonly owedXp: OwedXp[] };

/**
 * Dead Legends waiting to respawn, in the order they died (FR-051, DEC-295): each one the same
 * `Legend` object the store withdrew, with the XP it is owed. In `GameState`, hashed by
 * `StateHasher` (the waiting Legend's fields too). `RespawnSystem` queues and returns them;
 * `ProgressionSystem` adds what they are owed.
 */
export class RespawnQueue {
  private entries: Waiting[] = [];

  /** How many Legends are waiting. */
  public get size(): number {
    return this.entries.length;
  }

  /** Whether the Legend `entityId` is waiting. */
  public has(entityId: EntityId): boolean {
    return this.legendOf(entityId) !== undefined;
  }

  /** The waiting Legend `entityId`, or `undefined` when it is not waiting. */
  public legendOf(entityId: EntityId): Legend | undefined {
    return this.entries.find((entry) => entry.legend.id === entityId)?.legend;
  }

  /**
   * Queues a dead Legend of `team` to return at `returnsAtTick`.
   *
   * @throws Error when that Legend is already waiting.
   */
  public add(legend: Legend, team: PlayableTeam, returnsAtTick: number): void {
    if (this.has(legend.id)) {
      throw new Error(`Legend "${legend.id}" is already waiting to respawn.`);
    }
    this.entries.push({ legend, team, returnsAtTick, owedXp: [] });
  }

  /**
   * Records XP the waiting Legend `entityId` gets when it returns.
   *
   * @throws Error when that Legend is not waiting.
   */
  public owe(entityId: EntityId, owed: OwedXp): void {
    const entry = this.entries.find((waiting) => waiting.legend.id === entityId);
    if (entry === undefined) {
      throw new Error(`Legend "${entityId}" is not waiting to respawn.`);
    }
    entry.owedXp.push(owed);
  }

  /** Removes and returns the entries due at `tick` (`returnsAtTick <= tick`), in death order. */
  public takeDue(tick: number): readonly RespawnEntry[] {
    const due = this.entries.filter((entry) => entry.returnsAtTick <= tick);
    this.entries = this.entries.filter((entry) => entry.returnsAtTick > tick);
    return due;
  }

  /** Visits every waiting entry in death order. */
  public forEach(visit: (entry: RespawnEntry) => void): void {
    this.entries.forEach(visit);
  }
}
