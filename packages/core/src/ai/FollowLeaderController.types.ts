/**
 * Tuning for the prototype follow-leader controller, in world units. Prototype decision
 * (2026-10-08): minions escort their team's Legend for the demo; Phase 3's `MinionController`
 * (lane marching, aggro) replaces it.
 */
export type FollowLeaderProfile = {
  /** A follower stops moving toward its leader once it is this close. */
  readonly followDistance: number;
  /** Followers closer than this push away from each other. */
  readonly separationRadius: number;
  /** How strongly the push compares with the pull toward the leader (1 = equal at contact). */
  readonly separationWeight: number;
  /** Steering shorter than this is treated as "stay put", so followers settle instead of jitter. */
  readonly minSteer: number;
  /** How often a follower decides, in ticks (architecture 11 §6). */
  readonly decideEveryTicks: number;
};
