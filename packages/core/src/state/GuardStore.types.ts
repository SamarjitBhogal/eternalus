import type { Team } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';

/**
 * One guard post of a structure, camp or capture point (architecture 18 §7, §7.1): where the
 * guard stands, how far it may chase, and who holds the post now. `SpawnSystem` fills and refills posts; `GuardController`,
 * `PathingSystem` and `GuardWithinLeashInvariant` read them.
 */
export type GuardSlot = {
  readonly id: string;
  readonly homeId: EntityId;
  /**
   * The guard's team: the home's; `neutral` for a camp; for a capture point's defenders, the
   * point's owner when they were called (`neutral` while it had none).
   */
  readonly team: Team;
  readonly mobId: string;
  /** The guard plan row this post belongs to, and its place in that row. */
  readonly row: number;
  readonly indexInRow: number;
  readonly postX: number;
  readonly postY: number;
  readonly homeX: number;
  readonly homeY: number;
  readonly homeRadius: number;
  /** Measured from the home's edge. */
  readonly leashRadius: number;
  readonly leashTolerance: number;
  /** Picks a walkable destination in the leash when there is no target to chase. */
  readonly roams?: true;
  readonly respawnTicks: number;
  /**
   * The capture-point checkpoint whose defenders hold this post (07 §7, DEC-257); absent for a
   * post of the home's own guard plan.
   */
  readonly checkpoint?: number;
  /**
   * The defender set this post belongs to: one per reached checkpoint (`checkpoint-reached`), as
   * a checkpoint can be reached again after its point changes owner. Absent with `checkpoint`.
   */
  readonly defenceId?: string;
  /** Whether the post's guard levels and is rallied (its plan's `canLevel`, 18 MS-16). */
  readonly canLevel: boolean;
  /** The guard holding the post, or `null` while it waits to respawn. */
  readonly guardId: EntityId | null;
  /**
   * The first tick an empty post may be filled; `null` while it waits for the rest of its group
   * (a `group` plan, 18 §7.1), whose last loss sets it.
   */
  readonly respawnAtTick: number | null;
};
