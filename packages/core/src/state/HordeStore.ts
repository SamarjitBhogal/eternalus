import { compareById } from '../utils/compareById';
import type { EntityId } from './EntityStore.types';
import type { Horde, HordeId } from './Horde.types';
import type { StoredHorde } from './HordeStore.types';

/**
 * Every live horde of a match, in creation order, and which horde each member belongs to
 * (architecture 18 §4). Membership changes only through `add` and `removeMember`, so a mob is in
 * at most one horde and a horde is never empty.
 */
export class HordeStore {
  private readonly hordes = new Map<HordeId, StoredHorde>();
  private readonly owners = new Map<EntityId, HordeId>();
  private issued = 0;

  /** Number of live hordes. */
  public get size(): number {
    return this.hordes.size;
  }

  /** How many horde ids have been handed out; part of the state hash. */
  public get issuedIds(): number {
    return this.issued;
  }

  /** A fresh horde id; the same sequence of calls gives the same ids in every run. */
  public nextId(): HordeId {
    this.issued += 1;
    return `horde-${String(this.issued)}`;
  }

  /**
   * Adds a horde; its members are sorted in string order and the lowest id leads.
   *
   * @throws Error when the id is taken, it has no members, or a member is already in a horde or
   *   listed twice.
   */
  public add(horde: Omit<Horde, 'leaderId'>): Horde {
    if (this.hordes.has(horde.id)) {
      throw new Error(`Horde "${horde.id}" is already in the store.`);
    }
    const memberIds = [...horde.memberIds].sort(compareById);
    const leaderId = memberIds[0];
    if (leaderId === undefined) {
      throw new Error(`Horde "${horde.id}" needs at least one member.`);
    }
    const taken = memberIds.find((id) => this.owners.has(id));
    if (taken !== undefined) {
      throw new Error(`Entity "${taken}" is already in a horde.`);
    }
    // Sorted, so a repeated id sits next to itself.
    const repeated = memberIds.find((id, at) => id === memberIds[at - 1]);
    if (repeated !== undefined) {
      throw new Error(`Entity "${repeated}" is listed twice in horde "${horde.id}".`);
    }
    const stored: StoredHorde = { ...horde, memberIds, leaderId };
    this.hordes.set(horde.id, stored);
    for (const id of memberIds) {
      this.owners.set(id, horde.id);
    }
    return stored;
  }

  /** The horde with `id`, or `undefined`. */
  public get(id: HordeId): Horde | undefined {
    return this.hordes.get(id);
  }

  /** The horde `entityId` marches in, or `undefined` when it is in none. */
  public hordeOf(entityId: EntityId): Horde | undefined {
    const id = this.owners.get(entityId);
    return id === undefined ? undefined : this.hordes.get(id);
  }

  /**
   * Takes `entityId` out of its horde; the lowest remaining id leads. A horde left with no
   * members is removed.
   *
   * @returns The horde as it now is (with no members when it was removed), or `undefined` when
   *   the entity was in no horde.
   */
  public removeMember(entityId: EntityId): Horde | undefined {
    const id = this.owners.get(entityId);
    const stored = id === undefined ? undefined : this.hordes.get(id);
    if (stored === undefined) {
      return undefined;
    }
    this.owners.delete(entityId);
    stored.memberIds = stored.memberIds.filter((id) => id !== entityId);
    const leaderId = stored.memberIds[0];
    if (leaderId === undefined) {
      this.hordes.delete(stored.id);
    } else {
      stored.leaderId = leaderId;
    }
    return stored;
  }

  /** Sets how far along its lane a horde's formation anchor is. Unknown ids are ignored. */
  public setProgress(id: HordeId, progress: number): void {
    const stored = this.hordes.get(id);
    if (stored !== undefined) {
      stored.progress = progress;
    }
  }

  /** Visits every horde in creation order. */
  public forEach(visit: (horde: Horde) => void): void {
    this.hordes.forEach((horde) => {
      visit(horde);
    });
  }
}
