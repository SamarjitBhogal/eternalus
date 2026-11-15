/**
 * The guard leashes and post gap (architecture 18 §7, 07 §6), named once so the guard plans and
 * the guard aggro profiles derive from the same numbers (AI56-F4, DEC-168). Metres.
 */
export const GUARD_LEASH = {
  tower: 8, // TUNE: balancing.md "leash radius 8 m"
  camp: 6, // TUNE: balancing.md camp leash
  postGap: 2, // TUNE: no reference value; just outside the footprint
} as const;
