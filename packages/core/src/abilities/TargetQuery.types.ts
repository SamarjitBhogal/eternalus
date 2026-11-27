import type { HealthCondition } from '../content/abilities/AbilityDefinition.types';

/**
 * Which entities an effect step may touch (05 §3 `TargetFilter`), relative to the caster. An
 * entity with no team (a map object) is nobody's ally, so it counts as an enemy. `facing` joins
 * with its first use.
 */
export type TargetFilter = {
  readonly team: 'enemies' | 'allies' | 'all';
  /** Whether the caster itself may be hit; absent = no. */
  readonly includeSelf?: boolean;
  /** Only the entities whose health meets it, read now (DEC-204); absent = any health. */
  readonly health?: HealthCondition | undefined;
  /** Only the entities of these families (`Entity.family`); absent = every family. */
  readonly families?: readonly string[] | undefined;
};
