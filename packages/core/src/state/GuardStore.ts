import type { EntityId } from './EntityStore.types';
import type { GuardSlot } from './GuardStore.types';

/**
 * Every structure's guard posts (architecture 18 §7), in the order they were added. Plain data in
 * `GameState`, hashed by `StateHasher`. Changed only through `add`, `fill` and `vacate`.
 */
export class GuardStore {
  private readonly slots: GuardSlot[] = [];
  private readonly byGuard = new Map<EntityId, GuardSlot>();

  /** How many posts exist. */
  public get size(): number {
    return this.slots.length;
  }

  /** Adds an empty post. */
  public add(slot: Omit<GuardSlot, 'guardId' | 'respawnAtTick'>): void {
    this.slots.push({ ...slot, guardId: null, respawnAtTick: 0 });
  }

  /** The post `guardId` holds, or `undefined` when it is no guard. */
  public slotOf(guardId: EntityId): GuardSlot | undefined {
    return this.byGuard.get(guardId);
  }

  /** Every post, in the order it was added. */
  public forEach(visit: (slot: GuardSlot, index: number) => void): void {
    this.slots.forEach(visit);
  }

  /** Puts `guardId` on post `index`. */
  public fill(index: number, guardId: EntityId): void {
    this.replace(index, { guardId });
  }

  /** Empties post `index`; it may be filled again from `respawnAtTick`. */
  public vacate(index: number, respawnAtTick: number): void {
    this.replace(index, { guardId: null, respawnAtTick });
  }

  private replace(index: number, change: Partial<GuardSlot>): void {
    const slot = this.slots[index];
    if (slot === undefined) {
      throw new RangeError(`No guard post ${String(index)}.`);
    }
    if (slot.guardId !== null) {
      this.byGuard.delete(slot.guardId);
    }
    const next = { ...slot, ...change };
    this.slots[index] = next;
    if (next.guardId !== null) {
      this.byGuard.set(next.guardId, next);
    }
  }
}
