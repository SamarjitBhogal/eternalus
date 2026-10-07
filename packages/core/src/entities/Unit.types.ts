import type { UnitDefinition } from '../content/units/units.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/** What a unit needs to spawn: its definition, where it appears and which team it fights for. */
export type UnitSpawnContext = {
  /** Must be the definition named by the entity's `definitionId`, built by the same `kind`. */
  readonly definition: UnitDefinition;
  readonly position: Vec2;
  readonly team: Team;
};
