/**
 * Which entities an effect step may touch (05 §3 `TargetFilter`), relative to the caster. An
 * entity with no team (a map object) is nobody's ally, so it counts as an enemy. `families` and
 * `facing` join with their first use.
 */
export type TargetFilter = {
  readonly team: 'enemies' | 'allies' | 'all';
  /** Whether the caster itself may be hit; absent = no. */
  readonly includeSelf?: boolean;
};
