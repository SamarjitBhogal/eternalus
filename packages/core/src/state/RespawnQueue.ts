import type { EntityId } from './EntityStore.types';
import type { RespawnEntry } from './RespawnQueue.types';

/**
 * Dead Legends waiting to respawn, in the order they died (FR-051). Plain data in `GameState`,
 * hashed by `StateHasher`. `RespawnSystem` is the only writer.
 */
export class RespawnQueue {
  private entries: RespawnEntry[] = [];

  /** How many Legends are waiting. */
  public get size(): number {
    return this.entries.length;
  }

  /** Whether the Legend `entityId` is waiting. */
  public has(entityId: EntityId): boolean {
    return this.entries.some((entry) => entry.entityId === entityId);
  }

  /**
   * Queues a dead Legend.
   *
   * @throws Error when that Legend is already waiting.
   */
  public add(entry: RespawnEntry): void {
    if (this.has(entry.entityId)) {
      throw new Error(`Legend "${entry.entityId}" is already waiting to respawn.`);
    }
    this.entries.push(entry);
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
