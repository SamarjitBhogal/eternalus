import type { Team } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';

/**
 * One guard post of a structure (architecture 18 §7): where the guard stands, how far it may
 * chase, and who holds the post now. `SpawnSystem` fills and refills posts; `GuardController`,
 * `PathingSystem` and `GuardWithinLeashInvariant` read them.
 */
export type GuardSlot = {
  readonly id: string;
  readonly homeId: EntityId;
  /** The home's team; `neutral` for a camp. */
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
  readonly respawnTicks: number;
  /** The guard holding the post, or `null` while it waits to respawn. */
  readonly guardId: EntityId | null;
  /** The first tick an empty post may be filled. */
  readonly respawnAtTick: number;
};
