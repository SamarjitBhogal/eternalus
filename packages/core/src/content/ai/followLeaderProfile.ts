/**
 * PROTOTYPE(PROTO-01) TEMPORARY: demo content. Delete with `ai/FollowLeaderController.ts`;
 * Phase 3's aggro profiles (`content/ai/profiles/`, architecture 11 §2) replace it.
 *
 * Tuning for the prototype `follow-leader` controller (`ai/FollowLeaderController.types.ts` has
 * the field docs). Prototype decision (2026-10-08) for the demo; Phase 3 replaces it.
 */
export const FOLLOW_LEADER_PROFILE = {
  followDistance: 2.5, // TUNE:
  separationRadius: 1.2, // TUNE: a bit over two light-mob footprints
  separationWeight: 1.5, // TUNE:
  minSteer: 0.25, // TUNE:
  decideEveryTicks: 5, // TUNE: the minion cadence of architecture 11 §6
} as const;
